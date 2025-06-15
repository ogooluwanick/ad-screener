import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from 'mongodb';

// Consistent Ad interface (can be moved to a shared types file later)
interface AdDocument {
  _id: ObjectId;
  title: string;
  description: string;
  contentUrl: string;
  submitterId: string;
  submitterEmail: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: Date;
  reviewedAt?: Date;
  reviewerId?: string; // ID of the reviewer who actioned the ad
  rejectionReason?: string;
  category?: string; // Added category field
  // assignedReviewerIds?: string[]; // Not directly needed for this specific data
}

export interface ReviewerPerformanceStats {
  totalReviews: number;
  approvedReviews: number;
  rejectedReviews: number;
  avgReviewTimeMs?: number; // Average review time in milliseconds
  accuracy?: number; // Placeholder for accuracy percentage
}

export interface RecentActivityItem {
  id: string;
  title: string;
  status: 'approved' | 'rejected'; // Only completed actions
  reviewedAt: string; // ISO string date
}

export interface ReviewerProfileData {
  performanceStats: ReviewerPerformanceStats;
  recentActivities: RecentActivityItem[];
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  // Any authenticated user can attempt to view this data
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ message: 'Unauthorized. Please log in to view profile data.' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const targetUserId = searchParams.get('userId');

  if (!targetUserId) {
    return NextResponse.json({ message: 'User ID parameter is required.' }, { status: 400 });
  }
  if (!ObjectId.isValid(targetUserId)) {
     // Check if it's a valid string format that ObjectId expects, 
     // even if reviewerId in 'ads' is just a string, the user ID itself might be an ObjectId in the 'users' collection.
     // Let's assume for now targetUserId is the string representation of the ID.
     // If your 'users' collection uses string IDs that are not ObjectId hex strings, adjust this check.
     // For now, we'll proceed assuming targetUserId is a string that matches reviewerId in ads.
  }


  try {
    const client = await clientPromise();
    const db = client.db();
    const usersCollection = db.collection('users'); // Assuming 'users' collection
    const adsCollection = db.collection<AdDocument>('ads');

    // Verify the target user is a reviewer
    let userToViewObjectId;
    try {
      userToViewObjectId = new ObjectId(targetUserId);
    } catch (e) {
      // If targetUserId is not a valid ObjectId string, it might be a different ID format.
      // For this example, we'll assume it should be an ObjectId. Adjust if your user IDs are different.
      return NextResponse.json({ message: 'Invalid User ID format for lookup.' }, { status: 400 });
    }
    
    const targetUser = await usersCollection.findOne({ _id: userToViewObjectId });

    if (!targetUser) {
      return NextResponse.json({ message: 'Target user not found.' }, { status: 404 });
    }

    if (targetUser.role !== 'reviewer') {
      return NextResponse.json({ message: 'Profile data is only available for reviewers.' }, { status: 403 });
    }

    // Fetch all ads reviewed by the target reviewer
    // Assuming reviewerId in ads collection is stored as a string. If it's ObjectId, convert targetUserId.
    const reviewedAds = await adsCollection.find({ 
      reviewerId: targetUserId, // Use the targetUserId from query params
      status: { $in: ['approved', 'rejected'] } // Only consider completed reviews
    }).toArray();

    let totalReviews = 0;
    let approvedReviews = 0;
    let rejectedReviews = 0;
    let totalReviewDurationMs = 0;
    let reviewsWithDuration = 0;

    reviewedAds.forEach(ad => {
      totalReviews++;
      if (ad.status === 'approved') {
        approvedReviews++;
      } else if (ad.status === 'rejected') {
        rejectedReviews++;
      }

      if (ad.reviewedAt && ad.submittedAt) { // Ensure both dates exist
        const reviewTimeMs = ad.reviewedAt.getTime() - ad.submittedAt.getTime();
        if (reviewTimeMs >= 0) { // Ensure non-negative duration
          totalReviewDurationMs += reviewTimeMs;
          reviewsWithDuration++;
        }
      }
    });

    const avgReviewTimeMs = reviewsWithDuration > 0 ? totalReviewDurationMs / reviewsWithDuration : undefined;

    // Placeholder for accuracy calculation
    // TODO: [Accuracy Calculation Rework] Implement actual accuracy calculation. 
    // This will require a reliable way to determine if a review was "correct".
    // Consider adding a field to AdDocument like `isReviewCorrect: boolean` or `appealStatus: 'upheld' | 'overturned'`,
    // which would be updated by a separate process (e.g., senior review, automated checks, or appeal outcomes).
    // The current simulation is: (Simulated Correct Reviews / Total Reviews) * 100.
    let accuracy: number | undefined = undefined;
    if (totalReviews > 0) {
      // For now, let's simulate an accuracy. Replace with real logic.
      // Example: Assume 90% of approved and 95% of rejected are "correct" for simulation
      const simulatedCorrectApprovals = Math.floor(approvedReviews * 0.90);
      const simulatedCorrectRejections = Math.floor(rejectedReviews * 0.95);
      const totalSimulatedCorrectReviews = simulatedCorrectApprovals + simulatedCorrectRejections;
      accuracy = parseFloat(((totalSimulatedCorrectReviews / totalReviews) * 100).toFixed(1));
    } else {
      accuracy = 0; // Or undefined if preferred for no reviews
    }


    const performanceStats: ReviewerPerformanceStats = {
      totalReviews,
      approvedReviews,
      rejectedReviews,
      avgReviewTimeMs,
      accuracy,
    };

    // Fetch N most recent activities by this reviewer
    const recentActivitiesCursor = adsCollection
      .find({ 
        reviewerId: targetUserId, // Use the targetUserId from query params
        status: { $in: ['approved', 'rejected'] }
      })
      .sort({ reviewedAt: -1 }) // Sort by most recently reviewed
      .limit(5);
    
    const recentActivitiesDocuments = await recentActivitiesCursor.toArray();

    const recentActivities: RecentActivityItem[] = recentActivitiesDocuments.map(ad => ({
      id: ad._id.toHexString(),
      title: ad.title,
      status: ad.status as 'approved' | 'rejected', // Already filtered, so cast is safe
      reviewedAt: ad.reviewedAt ? ad.reviewedAt.toISOString() : new Date().toISOString(), // Fallback, though reviewedAt should exist
    }));

    const profileData: ReviewerProfileData = {
      performanceStats,
      recentActivities,
    };

    return NextResponse.json(profileData, { status: 200 });

  } catch (error) {
    console.error('Error fetching reviewer profile data:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json({ message: 'Failed to fetch reviewer profile data', error: errorMessage }, { status: 500 });
  }
}
