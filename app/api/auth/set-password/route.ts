import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import clientPromise from "@/lib/mongodb";
import { MongoClient } from "mongodb";
import { sendNotificationToUser } from "@/lib/notification-client";

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json({ message: "Token and new password are required." }, { status: 400 });
    }

    if (password.length < 6) {
        return NextResponse.json({ message: "Password must be at least 6 characters long." }, { status: 400 });
    }

    const client: MongoClient = await clientPromise();
    const db = client.db();
    const usersCollection = db.collection("users");

    const user = await usersCollection.findOne({
      verificationToken: token,
      verificationTokenExpires: { $gt: new Date() }, // Check if token is not expired
    });

    if (!user) {
      return NextResponse.json({ message: "Invalid or expired password reset token." }, { status: 400 });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user's password and remove reset token fields
    await usersCollection.updateOne(
      { _id: user._id },
      {
        $set: {
          password: hashedPassword,
          emailVerified: new Date(),
          updatedAt: new Date(),
          verificationToken: null,
          verificationTokenExpires: null,
        }
      }
    );

    await sendNotificationToUser(user._id.toString(), {
      title: "Password Set",
      message: "Your password has been set successfully.",
      level: "success",
    });

    // It's good practice to not send back sensitive info, even if it's just an ID
    return NextResponse.json({ message: "Password has been set successfully." }, { status: 200 });

  } catch (error) {
    console.error("Set password error:", error);
    // Generic error to avoid leaking details
    return NextResponse.json({ message: "An internal server error occurred." }, { status: 500 });
  }
}
