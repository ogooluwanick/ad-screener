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
  reviewerId?: string;
  rejectionReason?: string;
  assignedReviewerIds?: string[];
  category?: string; // Added category field
}

export interface ReviewerDashboardStats {
  totalAds: number;
  pendingReview: number;
  approved: number;
  rejected: number;
  totalSubmitters: number;
}

export interface RecentAd {
  id: string; // string version of ObjectId
  title: string;
  submitter: string; // submitterEmail
  submissionDate: string; // ISO string date
  status: 'pending' | 'approved' | 'rejected';
}

export interface ReviewerDashboardData {
  stats: ReviewerDashboardStats;
  recentAds: RecentAd[];
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id || session.user.role !== 'reviewer') {
    return NextResponse.json({ message: 'Unauthorized or invalid role' }, { status: 401 });
  }

  try {
    const client = await clientPromise(); // Call the function
    const db = client.db();
    const adsCollection = db.collection<AdDocument>('ads');
    const currentReviewerId = session.user.id;

    // Aggregate statistics
    // Total ads remains the same (all ads in the system)
    const totalAds = await adsCollection.countDocuments();

    // Pending review: ads assigned to current reviewer OR ads with no assignment
    const pendingReviewQuery = {
      status: 'pending' as 'pending', // Explicitly cast to literal type
      $or: [
        { assignedReviewerIds: currentReviewerId },
        { assignedReviewerIds: { $exists: false } },
        { assignedReviewerIds: { $size: 0 } }
      ]
    };
    const pendingReview = await adsCollection.countDocuments(pendingReviewQuery);

    // Approved: count ads approved by anyone (or specifically by this reviewer if needed, but typically global count)
    const approved = await adsCollection.countDocuments({ status: 'approved' });
    // Rejected: count ads rejected by anyone (or specifically by this reviewer if needed)
    const rejected = await adsCollection.countDocuments({ status: 'rejected' });

    // Total unique submitters
    const distinctSubmitters = await adsCollection.distinct('submitterId');
    const totalSubmitters = distinctSubmitters.length;

    const stats: ReviewerDashboardStats = {
      totalAds,
      pendingReview,
      approved,
      rejected,
      totalSubmitters,
    };

    // Recent pending ads (e.g., latest 5) - for this reviewer (assigned or unassigned)
    const recentAdsCursor = adsCollection
      .find(pendingReviewQuery) // Use the same query as for the count
      .sort({ submittedAt: -1 }) // Sort by newest first
      .limit(5);

    const recentAdsDocuments = await recentAdsCursor.toArray();

    const recentAds: RecentAd[] = recentAdsDocuments.map(ad => ({
      id: ad._id.toHexString(),
      title: ad.title,
      submitter: ad.submitterEmail,
      submissionDate: ad.submittedAt instanceof Date ? ad.submittedAt.toISOString() : new Date(ad.submittedAt).toISOString(),
      status: ad.status,
    }));

    const dashboardData: ReviewerDashboardData = {
      stats,
      recentAds,
    };

    return NextResponse.json(dashboardData, { status: 200 });

  } catch (error) {
    console.error('Error fetching reviewer dashboard data:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json({ message: 'Failed to fetch dashboard data', error: errorMessage }, { status: 500 });
  }
}
