import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import clientPromise from "@/lib/mongodb";
import { MongoClient, ObjectId } from "mongodb";
import { sendVerificationEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id || (session.user.role !== 'admin' && session.user.role !== 'superadmin')) {
    return NextResponse.json({ message: 'Unauthorized or invalid role' }, { status: 401 });
  }

  try {
    const { firstName, lastName, email } = await req.json();

    if (!firstName || !lastName || !email) {
      return NextResponse.json(
        { message: "First name, last name, and email are required." },
        { status: 400 }
      );
    }

    const client: MongoClient = await clientPromise();
    const db = client.db();
    const usersCollection = db.collection("users");

    const existingUser = await usersCollection.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { message: "User already exists with this email." },
        { status: 409 }
      );
    }

    // Generate a random password
    const password = crypto.randomBytes(16).toString("hex");
    const hashedPassword = await bcrypt.hash(password, 10);

    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

    const newUser = {
      _id: new ObjectId(),
      firstName,
      lastName,
      email,
      password: hashedPassword,
      name: `${firstName} ${lastName}`,
      emailVerified: null,
      verificationToken,
      verificationTokenExpires,
      image: null,
      role: "reviewer",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await usersCollection.insertOne(newUser);

    if (!result.insertedId) {
      return NextResponse.json(
        { message: "Failed to create reviewer account." },
        { status: 500 }
      );
    }

    // Send verification email with password setup link
    try {
      // Construct the password setup link
      const passwordSetupLink = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${verificationToken}`;
      await sendVerificationEmail(newUser.email, newUser.name, verificationToken, true);
      console.log(`Verification email sent to ${newUser.email}`);
    } catch (error: any) {
      console.error(`Failed to send verification email to ${newUser.email}:`, error);
      await usersCollection.deleteOne({ _id: result.insertedId });
      return NextResponse.json(
        { message: `Reviewer account creation initiated, but failed to send verification email. Please try again. Error: ${error.message || "Unknown email error"}` },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Reviewer account created successfully. Please check the reviewer's email to set up their password." },
      { status: 201 }
    );
  } catch (error) {
    console.error("Reviewer account creation error:", error);
    return NextResponse.json(
      { message: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
