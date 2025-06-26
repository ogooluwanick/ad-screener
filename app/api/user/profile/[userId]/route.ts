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
  // location?: string; // Removed
  bio?: string;
  joinDate?: string; // Consider if joinDate is public
  image?: string; // Profile image URL

  // Submitter-specific public fields
  company?: string; // Business/Agency Name
  website?: string;
  submitterType?: "business" | "agency" | "";
  registrationNumber?: string;
  sector?: string; // Business only
  officeAddress?: string; // Business only
  state?: string; // Business only
  country?: string; // Business only
  businessDescription?: string; // Business only
  
  // Reviewer-specific public fields
  department?: string;
  reviewerLevel?: string;
  expertise?: string[];
  accuracy?: number; // For reviewer's accuracy rate
  // Probably exclude stats like totalReviews for public view unless intended
  profileVisibility?: "public" | "private" | "reviewers-only";

  // Submitter-specific stats
  totalAds?: number;
  approvedAds?: number;
  pendingAds?: number;
  rejectedAds?: number;

  // Common fields
  email?: string; // Added email
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

    const client = await clientPromise(); // Call the function
    const db = client.db(); // Use your default DB or specify one if needed

    const user = await db.collection('users').findOne(
      { _id: new ObjectId(userId) },
      {
        projection: {
          // Explicitly list fields to return for public profile to avoid exposing sensitive data
          firstName: 1,
          lastName: 1,
          role: 1,
          // location: 1, // Removed
          bio: 1,
          createdAt: 1, // Use createdAt for joinDate consistency
          profileImageUrl: 1, // Assuming image URL is stored as profileImageUrl
          company: 1, 
          website: 1, 
          submitterType: 1,
          registrationNumber: 1,
          sector: 1,
          officeAddress: 1,
          state: 1,
          country: 1,
          businessDescription: 1,
          department: 1, // For reviewers
          reviewerLevel: 1, // For reviewers
          expertise: 1, // For reviewers
          accuracy: 1, // For reviewers
          // For submitters, profile visibility is nested in settings
          "settings.privacy.profileVisibility": 1,
          // Submitter stats
          totalAds: 1,
          approvedAds: 1,
          pendingAds: 1,
          rejectedAds: 1,
          // Added email
          email: 1,
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
      // location: user.location, // Removed
      bio: user.bio,
      joinDate: user.createdAt ? (user.createdAt instanceof Date ? user.createdAt.toISOString() : new Date(user.createdAt).toISOString()).split('T')[0] : "",
      image: user.profileImageUrl,
      company: user.company,
      website: user.website,
      // Submitter specific
      submitterType: user.submitterType,
      registrationNumber: user.registrationNumber,
      sector: user.sector,
      officeAddress: user.officeAddress,
      state: user.state,
      country: user.country,
      businessDescription: user.businessDescription,
      // Reviewer specific
      department: user.department,
      reviewerLevel: user.reviewerLevel,
      expertise: user.expertise,
      accuracy: user.accuracy,
      profileVisibility: user.settings?.privacy?.profileVisibility || "public",
      // Submitter stats
      totalAds: user.totalAds,
      approvedAds: user.approvedAds,
      pendingAds: user.pendingAds,
      rejectedAds: user.rejectedAds,
      // Added email
      email: user.email,
    };

    return NextResponse.json(publicProfile, { status: 200 });
  } catch (error) {
    console.error('Error fetching public user profile:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
