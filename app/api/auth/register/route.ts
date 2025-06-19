import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto"; // For token generation
import clientPromise from "@/lib/mongodb";
import { MongoClient, ObjectId } from "mongodb";
import { sendVerificationEmail } from "@/lib/email"; // Changed to sendVerificationEmail

export async function POST(req: NextRequest) {
  try {
    // Adding a comment to test the replace_in_file tool
    const { 
      firstName, 
      lastName, 
      email, 
      password, 
      role, 
      companyName, // Used for Business Name (Agency/Business)
      // New fields for submitter (agency/business)
      submitterType, 
      registrationNumber, // For Agency Reg No or Business CAC No
      sector,
      officeAddress,
      state,
      country,
      businessDescription 
    } = await req.json();

    if (!firstName || !lastName || !email || !password || !role) {
      return NextResponse.json(
        { message: "First name, last name, email, password, and role are required. Role must be 'submitter', 'reviewer', or 'superadmin'." },
        { status: 400 }
      );
    }

    if (!['submitter', 'reviewer', 'superadmin'].includes(role)) {
      return NextResponse.json(
        { message: "Invalid role. Role must be 'submitter', 'reviewer', or 'superadmin'." },
        { status: 400 }
      );
    }
    // Other fields are conditionally required by frontend based on role and submitterType

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

    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

    const newUser = {
      _id: new ObjectId(),
      firstName,
      lastName,
      email,
      password: hashedPassword,
      name: `${firstName} ${lastName}`, // Combine firstName and lastName for the 'name' field
      emailVerified: null, 
      verificationToken,
      verificationTokenExpires,
      image: null, // Required by MongoDBAdapter
      role: role, // 'submitter' or 'reviewer'
      companyName: companyName || null,
      createdAt: new Date(),
      updatedAt: new Date(),
      // Add new submitter fields if role is submitter
      ...(role === 'submitter' && {
        submitterType: submitterType || null,
        registrationNumber: registrationNumber || null,
        sector: sector || null,
        officeAddress: officeAddress || null,
        state: state || null,
        country: country || null,
        businessDescription: businessDescription || null,
      }),
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
        companyName: newUser.companyName,
        // Conditionally add submitter specific fields to response
        ...(newUser.role === 'submitter' && {
          submitterType: newUser.submitterType,
          registrationNumber: newUser.registrationNumber,
          sector: newUser.sector,
          officeAddress: newUser.officeAddress,
          state: newUser.state,
          country: newUser.country,
          businessDescription: newUser.businessDescription,
        }),
    };

    // Send verification email
    try {
      await sendVerificationEmail(newUser.email, newUser.name, verificationToken);
      console.log(`Verification email sent to ${newUser.email}`);
    } catch (emailError: any) {
      console.error(`Failed to send verification email to ${newUser.email}:`, emailError);
      // Critical: If email sending fails, we might want to roll back user creation or at least inform the user.
      // For now, let's return an error indicating email sending failed.
      // Consider a more robust transaction or cleanup mechanism in a production scenario.
      await usersCollection.deleteOne({ _id: result.insertedId }); // Attempt to clean up user
      return NextResponse.json(
        { message: `User registration initiated, but failed to send verification email. Please try again. Error: ${emailError.message || 'Unknown email error'}` },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "User created successfully. Please check your email to verify your account.", user: createdUser }, // Updated message
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
