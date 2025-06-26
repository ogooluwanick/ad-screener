import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // Adjust path as necessary
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { sendNotificationToUser } from "@/lib/notification-client"; // Added for notifications
import { deleteFromCloudinary } from "@/lib/cloudinary_utils"; // For deleting old LoA

export async function GET() { // Added export async function GET() here
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const client = await clientPromise(); // Call the function
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
      _id: user._id.toHexString(), // Include _id
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      email: user.email || "",
      role: user.role || "",
      phone: user.phone || "",
      company: user.company || "", // For Submitter's company or Reviewer's affiliated company
      // location: user.location || "", // Removed
      bio: user.bio || "",
      website: user.website || "", // Submitter's website
      joinDate: user.createdAt ? (user.createdAt instanceof Date ? user.createdAt.toISOString() : new Date(user.createdAt).toISOString()).split('T')[0] : "",
      profileImageUrl: user.profileImageUrl || null,
      // Submitter specific fields
      submitterType: user.submitterType || "", // "business" or "agency"
      registrationNumber: user.registrationNumber || "", // CAC or Agency Reg No.
      sector: user.sector || "", // Business sector
      officeAddress: user.officeAddress || "", // Business address
      state: user.state || "", // Business state
      country: user.country || "", // Business country
      businessDescription: user.businessDescription || "", // Business description
      // Reviewer specific fields
      department: user.department || "", // Reviewer's internal department
      expertise: user.expertise || [],   // Reviewer's areas of expertise (already existed)
      // Agency specific
      letterOfAuthorityUrl: user.letterOfAuthorityUrl || null,
      letterOfAuthorityPublicId: user.letterOfAuthorityPublicId || null,
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
    const client = await clientPromise(); // Call the function
    const db = client.db();
    const usersCollection = db.collection("users");
    const userId = new ObjectId(session.user.id);

    const body = await req.json();
    // Destructure all potential fields including new reviewer fields
    const { 
      firstName,
      lastName,
      phone,
      company,
      // location, // Removed
      bio,
      website,
      profileImageUrl,
      // Submitter specific fields
      submitterType,
      registrationNumber,
      sector,
      officeAddress,
      state,
      country,
      businessDescription,
      // Reviewer specific fields
      department, 
      expertise,
      // Letter of Authority fields
      newLetterOfAuthorityUrl,
      newLetterOfAuthorityPublicId,
      currentLetterOfAuthorityPublicId // This is the one from profileData before new upload
    } = body;

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
    // if (location !== undefined) updateData.location = location; // Removed
    if (bio !== undefined) updateData.bio = bio;
    if (website !== undefined) updateData.website = website;
    if (profileImageUrl !== undefined) {
      updateData.profileImageUrl = profileImageUrl;
    }

    // Add submitter-specific fields if provided (and user is a submitter)
    // It's good practice to check role before updating role-specific fields,
    // but for simplicity here, we'll allow them if provided.
    // Consider adding role checks if strict separation is needed.
    if (submitterType !== undefined) updateData.submitterType = submitterType;
    if (registrationNumber !== undefined) updateData.registrationNumber = registrationNumber;
    if (sector !== undefined) updateData.sector = sector;
    if (officeAddress !== undefined) updateData.officeAddress = officeAddress;
    if (state !== undefined) updateData.state = state;
    if (country !== undefined) updateData.country = country;
    if (businessDescription !== undefined) updateData.businessDescription = businessDescription;
    
    // Add reviewer-specific fields if provided
    if (department !== undefined) updateData.department = department;
    if (expertise !== undefined && Array.isArray(expertise)) { 
      updateData.expertise = expertise;
    }
    // Note: Email updates are typically handled separately due to verification needs.

    // Fetch current user data to check existing LoA and submitterType
    const currentUser = await usersCollection.findOne({ _id: userId });
    if (!currentUser) {
      return NextResponse.json({ message: "User not found for update check" }, { status: 404 });
    }

    const oldLoAPublicId = currentUser.letterOfAuthorityPublicId;
    const oldSubmitterType = currentUser.submitterType;

    if (newLetterOfAuthorityUrl && newLetterOfAuthorityPublicId) {
      // New LoA was uploaded
      if (oldLoAPublicId) {
        try {
          await deleteFromCloudinary(oldLoAPublicId, 'raw'); // Assuming 'raw' or 'auto' was used for LoA
          console.log(`Successfully deleted old Letter of Authority: ${oldLoAPublicId}`);
        } catch (deleteError) {
          console.error(`Failed to delete old Letter of Authority ${oldLoAPublicId}:`, deleteError);
          // Decide if this is a critical error. For now, log and continue.
        }
      }
      updateData.letterOfAuthorityUrl = newLetterOfAuthorityUrl;
      updateData.letterOfAuthorityPublicId = newLetterOfAuthorityPublicId;
    } else if (submitterType && submitterType !== 'agency' && oldSubmitterType === 'agency' && oldLoAPublicId) {
      // User changed from Agency to Business/other, and had an LoA
      try {
        await deleteFromCloudinary(oldLoAPublicId, 'raw');
        console.log(`Successfully deleted Letter of Authority due to submitter type change: ${oldLoAPublicId}`);
      } catch (deleteError) {
        console.error(`Failed to delete Letter of Authority ${oldLoAPublicId} on type change:`, deleteError);
      }
      updateData.letterOfAuthorityUrl = null;
      updateData.letterOfAuthorityPublicId = null;
    } else if (submitterType && submitterType === 'agency' && !newLetterOfAuthorityUrl && currentLetterOfAuthorityPublicId === null && oldLoAPublicId) {
      // This case handles if the user is an agency, didn't upload a new LoA, but somehow the frontend indicates current is null (e.g. user wants to remove it without replacing)
      // And there was an old one. This might be an explicit "remove" action not yet implemented on frontend.
      // For now, if new URL is not provided, we keep the old one unless type changes.
      // If an explicit "remove" button is added, it should send specific flags.
    }


    // If submitterType is not 'agency', ensure LoA fields are nulled, unless a new one is being set (which implies type is agency)
    if (updateData.submitterType && updateData.submitterType !== 'agency' && !(newLetterOfAuthorityUrl && newLetterOfAuthorityPublicId)) {
        if (currentUser.letterOfAuthorityPublicId) { // Check if there was one to delete
             try {
                await deleteFromCloudinary(currentUser.letterOfAuthorityPublicId, 'raw');
                console.log(`Successfully deleted Letter of Authority as user is no longer agency: ${currentUser.letterOfAuthorityPublicId}`);
            } catch (deleteError) {
                console.error(`Failed to delete old Letter of Authority ${currentUser.letterOfAuthorityPublicId} when changing from agency:`, deleteError);
            }
        }
        updateData.letterOfAuthorityUrl = null;
        updateData.letterOfAuthorityPublicId = null;
    }


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

    // Send in-app notification
    if (session.user.id && result.modifiedCount > 0) { // Only send if something actually changed
      sendNotificationToUser(session.user.id, {
        title: "Profile Updated",
        message: "Your profile information has been successfully updated.",
        level: "success",
      }).then(() => console.log(`Profile update notification sent to user ${session.user.id}`))
        .catch(err => console.error(`Failed to send profile update notification to user ${session.user.id}:`, err));
    }


    return NextResponse.json(
      { message: "Profile updated successfully", user: {
        firstName: updatedUser?.firstName,
        lastName: updatedUser?.lastName,
        email: updatedUser?.email, // Email is not updated here, but returned for consistency
        role: updatedUser?.role,
        phone: updatedUser?.phone,
        company: updatedUser?.company,
        // location: updatedUser?.location, // Removed
        bio: updatedUser?.bio,
        website: updatedUser?.website,
        joinDate: updatedUser?.createdAt ? new Date(updatedUser.createdAt).toISOString().split('T')[0] : "",
        profileImageUrl: updatedUser?.profileImageUrl,
        // Submitter specific
        submitterType: updatedUser?.submitterType,
        registrationNumber: updatedUser?.registrationNumber,
        sector: updatedUser?.sector,
        officeAddress: updatedUser?.officeAddress,
        state: updatedUser?.state,
        country: updatedUser?.country,
        businessDescription: updatedUser?.businessDescription,
        // Reviewer specific
        department: updatedUser?.department,
        expertise: updatedUser?.expertise,
        // Agency specific
        letterOfAuthorityUrl: updatedUser?.letterOfAuthorityUrl,
        letterOfAuthorityPublicId: updatedUser?.letterOfAuthorityPublicId,
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
