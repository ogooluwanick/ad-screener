import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // Adjust path as necessary
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const client = await clientPromise;
    const db = client.db();
    const usersCollection = db.collection("users");

    const userId = new ObjectId(session.user.id);
    const user = await usersCollection.findOne({ _id: userId });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Return only the necessary fields, excluding sensitive ones like password
    // For fields not yet in your DB, return null or default values
    const profileData = {
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      email: user.email || "",
      role: user.role || "",
      phone: user.phone || "", // Assuming 'phone' might be added to user schema
      company: user.company || "", // Assuming 'company' might be added
      location: user.location || "", // Assuming 'location' might be added
      bio: user.bio || "", // Assuming 'bio' might be added
      website: user.website || "", // Assuming 'website' might be added
      // joinDate could be user.createdAt
      joinDate: user.createdAt ? new Date(user.createdAt).toISOString().split('T')[0] : "", 
    };

    return NextResponse.json(profileData, { status: 200 });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      { message: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const client = await clientPromise;
    const db = client.db();
    const usersCollection = db.collection("users");
    const userId = new ObjectId(session.user.id);

    const body = await req.json();
    const { firstName, lastName, phone, company, location, bio, website } = body;

    // Basic validation (can be expanded)
    if (!firstName || !lastName) {
      return NextResponse.json(
        { message: "First name and last name are required." },
        { status: 400 }
      );
    }

    const updateData: { [key: string]: any } = {
      firstName,
      lastName,
      updatedAt: new Date(),
    };

    // Add optional fields if they are provided and not empty
    if (phone !== undefined) updateData.phone = phone;
    if (company !== undefined) updateData.company = company;
    if (location !== undefined) updateData.location = location;
    if (bio !== undefined) updateData.bio = bio;
    if (website !== undefined) updateData.website = website;
    // Note: Email updates are typically handled separately due to verification needs.
    // If you want to allow email changes here, add validation and consider implications.

    const result = await usersCollection.updateOne(
      { _id: userId },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }
    if (result.modifiedCount === 0 && result.matchedCount === 1) {
      // No fields were actually changed
      return NextResponse.json({ message: "No changes detected or user data already up to date." }, { status: 200 });
    }
    
    // Fetch the updated user to return it
    const updatedUser = await usersCollection.findOne({ _id: userId });

    return NextResponse.json(
      { message: "Profile updated successfully", user: {
        firstName: updatedUser?.firstName,
        lastName: updatedUser?.lastName,
        email: updatedUser?.email, // Email is not updated here, but returned for consistency
        role: updatedUser?.role,
        phone: updatedUser?.phone,
        company: updatedUser?.company,
        location: updatedUser?.location,
        bio: updatedUser?.bio,
        website: updatedUser?.website,
        joinDate: updatedUser?.createdAt ? new Date(updatedUser.createdAt).toISOString().split('T')[0] : "",
      } },
      { status: 200 }
    );

  } catch (error) {
    console.error("Error updating user profile:", error);
    let errorMessage = "An unexpected error occurred.";
    if (error instanceof Error) {
        // Potentially check for specific error types if needed
    }
    return NextResponse.json(
      { message: errorMessage },
      { status: 500 }
    );
  }
}
