import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto"; // For token generation
import clientPromise from "@/lib/mongodb";
import { MongoClient, ObjectId } from "mongodb";
import { sendVerificationEmail } from "@/lib/email"; // Changed to sendVerificationEmail
import { createInAppNotification } from '@/lib/notificationService';
import { uploadToCloudinary } from "@/lib/cloudinary_utils"; // Import Cloudinary uploader
import { Readable } from "stream"; // For converting file to buffer

// Helper function to convert a File (from FormData) to Buffer
async function fileToBuffer(file: File): Promise<Buffer> {
  const arrayBuffer = await file.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const firstName = formData.get("firstName") as string | null;
    const lastName = formData.get("lastName") as string | null;
    const email = formData.get("email") as string | null;
    const password = formData.get("password") as string | null;
    const role = formData.get("role") as string | null;
    const companyName = formData.get("companyName") as string | null;
    const submitterType = formData.get("submitterType") as string | null;
    const registrationNumber = formData.get("registrationNumber") as string | null;
    
    // Business specific fields
    const sector = formData.get("sector") as string | null;
    const officeAddress = formData.get("officeAddress") as string | null;
    const state = formData.get("state") as string | null;
    const country = formData.get("country") as string | null;
    const businessDescription = formData.get("businessDescription") as string | null;

    // Agency specific file
    const letterOfAuthorityFile = formData.get("letterOfAuthority") as File | null;

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
      letterOfAuthorityUrl: null as string | null, // Initialize with explicit type
      letterOfAuthorityPublicId: null as string | null, // Initialize with explicit type
      // Add new submitter fields if role is submitter
      ...(role === 'submitter' && {
        submitterType: submitterType || null,
        registrationNumber: registrationNumber || null,
        sector: sector || null, // For business
        officeAddress: officeAddress || null, // For business
        state: state || null, // For business
        country: country || null, // For business
        businessDescription: businessDescription || null, // For business
      }),
    };

    if (role === 'submitter' && submitterType === 'agency' && letterOfAuthorityFile) {
      try {
        const fileBuffer = await fileToBuffer(letterOfAuthorityFile);
        // Sanitize filename if needed, or use a generated one
        const fileName = `${newUser._id}-letter-of-authority-${Date.now()}`; 
        const uploadResult = await uploadToCloudinary(fileBuffer, "letters_of_authority", fileName, 'auto');

        if (uploadResult && uploadResult.secure_url) {
          newUser.letterOfAuthorityUrl = uploadResult.secure_url;
          newUser.letterOfAuthorityPublicId = uploadResult.public_id;
        } else {
          // Handle upload failure: log, but maybe proceed without it or return error
          console.error("Cloudinary upload failed for letter of authority, but proceeding with user creation without it.");
          // Or, to be stricter:
          // return NextResponse.json({ message: "Failed to upload Letter of Authority." }, { status: 500 });
        }
      } catch (uploadError: any) {
        console.error("Error uploading Letter of Authority:", uploadError);
        // return NextResponse.json({ message: `Error uploading Letter of Authority: ${uploadError.message}` }, { status: 500 });
      }
    }

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
          sector: newUser.sector, // For business
          officeAddress: newUser.officeAddress, // For business
          state: newUser.state, // For business
          country: newUser.country, // For business
          businessDescription: newUser.businessDescription, // For business
          letterOfAuthorityUrl: newUser.letterOfAuthorityUrl, // For agency
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

    await createInAppNotification({
      userId: createdUser.id,
      title: "Account Created",
      message: "Your account has been created successfully. Please check your email to verify your account.",
      level: "success",
    });

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
