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
}

// User interface
interface UserDocument {
  _id: ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  createdAt: Date;
  emailVerified: boolean | null;
}

export interface AdminDashboardStats {
  totalAds: number;
  pendingReview: number;
  approved: number;
  rejected: number;
  totalUsers: number;
}

export interface AdminRecentAd {
  id: string; // string version of ObjectId
  title: string;
  submissionDate: string; // ISO string date
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  submitterEmail: string;
}

export interface AdminRecentUser {
  id: string; // string version of ObjectId
  name: string;
  email: string;
  role: string;
  joinDate: string; // ISO string date
  emailVerified: boolean;
}

export interface AdminDashboardData {
  stats: AdminDashboardStats;
  recentAds: AdminRecentAd[];
  recentUsers: AdminRecentUser[];
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id || (session.user.role !== 'admin' && session.user.role !== 'superadmin')) {
    return NextResponse.json({ message: 'Unauthorized or invalid role' }, { status: 401 });
  }

  try {
    const client = await clientPromise();
    const db = client.db();
    const adsCollection = db.collection<AdDocument>('ads');
    const usersCollection = db.collection<UserDocument>('users');

    // Aggregate statistics for ALL ads (admin view)
    const totalAds = await adsCollection.countDocuments({});
    const pendingReview = await adsCollection.countDocuments({ status: 'pending' });
    const approved = await adsCollection.countDocuments({ status: 'approved' });
    const rejected = await adsCollection.countDocuments({ status: 'rejected' });

    // User statistics
    const totalUsers = await usersCollection.countDocuments({});

    const stats: AdminDashboardStats = {
      totalAds,
      pendingReview,
      approved,
      rejected,
      totalUsers,
    };

    // Recent ads from ALL submitters (e.g., latest 10)
    const recentAdsCursor = adsCollection
      .find({})
      .sort({ submittedAt: -1 }) // Sort by newest first
      .limit(5);

    const recentAdsDocuments = await recentAdsCursor.toArray();

    const recentAds: AdminRecentAd[] = recentAdsDocuments.map(ad => ({
      id: ad._id.toHexString(),
      title: ad.title,
      submissionDate: ad.submittedAt.toISOString(),
      status: ad.status,
      rejectionReason: ad.rejectionReason,
      submitterEmail: ad.submitterEmail,
    }));

    // Recent users (latest 5)
    const recentUsersCursor = usersCollection
      .find({})
      .sort({ createdAt: -1 }) // Sort by newest first
      .limit(5);

    const recentUsersDocuments = await recentUsersCursor.toArray();

    const recentUsers: AdminRecentUser[] = recentUsersDocuments.map(user => ({
      id: user._id.toHexString(),
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      role: user.role,
      joinDate: user.createdAt.toISOString(),
      emailVerified: user.emailVerified === true,
    }));

    const dashboardData: AdminDashboardData = {
      stats,
      recentAds,
      recentUsers,
    };

    return NextResponse.json(dashboardData, { status: 200 });

  } catch (error) {
    console.error('Error fetching admin dashboard data:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json({ message: 'Failed to fetch dashboard data', error: errorMessage }, { status: 500 });
  }
}
