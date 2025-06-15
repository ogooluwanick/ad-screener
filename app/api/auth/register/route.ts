import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import clientPromise from "@/lib/mongodb";
import { MongoClient, ObjectId } from "mongodb";
import { sendSignupEmail } from "@/lib/email"; // Added import for email sending

export async function POST(req: NextRequest) {
  try {
    const { firstName, lastName, email, password, role } = await req.json();

    if (!firstName || !lastName || !email || !password || !role) {
      return NextResponse.json(
        { message: "First name, last name, email, password, and role are required." },
        { status: 400 }
      );
    }

    // Basic email validation
    if (!/\S+@\S+\.\S+/.test(email)) {
      return NextResponse.json(
        { message: "Invalid email format." },
        { status: 400 }
      );
    }

    // Basic password strength (example: at least 6 characters)
    if (password.length < 6) {
      return NextResponse.json(
        { message: "Password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    const client: MongoClient = await clientPromise(); // Call the function
    const db = client.db();
    const usersCollection = db.collection("users");

    const existingUser = await usersCollection.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { message: "User already exists with this email." },
        { status: 409 } // Conflict
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10); // 10 is the salt rounds

    const newUser = {
      _id: new ObjectId(),
      firstName,
      lastName,
      email,
      password: hashedPassword,
      name: `${firstName} ${lastName}`, // Combine firstName and lastName for the 'name' field
      emailVerified: null, // Required by MongoDBAdapter if not using email verification provider
      image: null, // Required by MongoDBAdapter
      role: role, // 'submitter' or 'reviewer'
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await usersCollection.insertOne(newUser);

    if (!result.insertedId) {
        return NextResponse.json(
            { message: "Failed to create user account." },
            { status: 500 }
        );
    }
    
    // Return a subset of user information, excluding password
    const createdUser = {
        id: result.insertedId.toString(),
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
    };

    // Send signup email
    try {
      await sendSignupEmail(newUser.email, newUser.name);
      console.log(`Signup email sent to ${newUser.email}`);
    } catch (emailError) {
      console.error(`Failed to send signup email to ${newUser.email}:`, emailError);
      // Optionally, decide if this failure should affect the overall response.
      // For now, registration is successful even if email fails, but it's logged.
    }

    return NextResponse.json(
      { message: "User created successfully", user: createdUser },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { message: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
