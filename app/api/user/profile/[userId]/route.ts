import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// Define the shape of the data to be returned for a public profile
// This might be a subset of the full UserProfileData for privacy
interface PublicProfileData {
  firstName: string;
  lastName: string;
  role: string;
  // Common fields suitable for public view
  location?: string;
  bio?: string;
  joinDate?: string; // Consider if joinDate is public
  image?: string; // Profile image URL

  // Submitter-specific public fields
  company?: string;
  website?: string;
  
  // Reviewer-specific public fields
  department?: string; 
  reviewerLevel?: string;
  // Probably exclude stats like accuracy, totalReviews for public view unless intended
  profileVisibility?: "public" | "private" | "reviewers-only";
}

export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;

    if (!userId || !ObjectId.isValid(userId)) {
      return NextResponse.json({ message: 'Invalid user ID' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(); // Use your default DB or specify one if needed

    const user = await db.collection('users').findOne(
      { _id: new ObjectId(userId) },
      {
        projection: {
          // Explicitly list fields to return for public profile to avoid exposing sensitive data
          firstName: 1,
          lastName: 1,
          role: 1,
          location: 1,
          bio: 1,
          joinDate: 1, // Make sure this is in a suitable format or transform it
          profileImageUrl: 1, // Assuming image URL is stored as profileImageUrl
          company: 1, // For submitters
          website: 1, // For submitters
          department: 1, // For reviewers
          reviewerLevel: 1, // For reviewers
          // For submitters, profile visibility is nested in settings
          "settings.privacy.profileVisibility": 1, 
          // Do NOT project email, phone, or detailed stats unless explicitly intended for public view
        },
      }
    );

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Map the database field `profileImageUrl` to `image` for consistency with frontend state
    const publicProfile: PublicProfileData = {
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      location: user.location,
      bio: user.bio,
      joinDate: user.joinDate ? new Date(user.joinDate).toISOString() : undefined,
      image: user.profileImageUrl, 
      company: user.company,
      website: user.website,
      department: user.department,
      reviewerLevel: user.reviewerLevel,
      // Profile visibility: from submitter settings, or default to 'public' if not set (e.g., for reviewers)
      profileVisibility: user.settings?.privacy?.profileVisibility || "public",
    };

    return NextResponse.json(publicProfile, { status: 200 });
  } catch (error) {
    console.error('Error fetching public user profile:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
