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
  assignedReviewerIds?: string[]; // Added for consistency, though not directly used in this route's logic
}

export interface SubmitterDashboardStats {
  totalAds: number;
  pendingReview: number;
  approved: number;
  rejected: number;
}

export interface SubmitterRecentAd {
  id: string; // string version of ObjectId
  title: string;
  submissionDate: string; // ISO string date
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
}

export interface SubmitterDashboardData {
  stats: SubmitterDashboardStats;
  recentAds: SubmitterRecentAd[];
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id || session.user.role !== 'submitter') {
    return NextResponse.json({ message: 'Unauthorized or invalid role' }, { status: 401 });
  }

  const submitterId = session.user.id;

  try {
    const client = await clientPromise(); // Call the function
    const db = client.db();
    const adsCollection = db.collection<AdDocument>('ads');

    // Aggregate statistics for the logged-in submitter
    const totalAds = await adsCollection.countDocuments({ submitterId });
    const pendingReview = await adsCollection.countDocuments({ submitterId, status: 'pending' });
    const approved = await adsCollection.countDocuments({ submitterId, status: 'approved' });
    const rejected = await adsCollection.countDocuments({ submitterId, status: 'rejected' });

    const stats: SubmitterDashboardStats = {
      totalAds,
      pendingReview,
      approved,
      rejected,
    };

    // Recent ads for this submitter (e.g., latest 5)
    const recentAdsCursor = adsCollection
      .find({ submitterId })
      .sort({ submittedAt: -1 }) // Sort by newest first
      .limit(5);

    const recentAdsDocuments = await recentAdsCursor.toArray();

    const recentAds: SubmitterRecentAd[] = recentAdsDocuments.map(ad => ({
      id: ad._id.toHexString(),
      title: ad.title,
      submissionDate: ad.submittedAt.toISOString(),
      status: ad.status,
      rejectionReason: ad.rejectionReason,
    }));

    const dashboardData: SubmitterDashboardData = {
      stats,
      recentAds,
    };

    return NextResponse.json(dashboardData, { status: 200 });

  } catch (error) {
    console.error('Error fetching submitter dashboard data:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json({ message: 'Failed to fetch dashboard data', error: errorMessage }, { status: 500 });
  }
}
