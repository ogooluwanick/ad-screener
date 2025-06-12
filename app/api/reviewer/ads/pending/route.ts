import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from 'mongodb';

// Consistent Ad interface (can be moved to a shared types file later)
export interface AdDocumentForListing { // Renamed to avoid conflict if imported elsewhere
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
  // Add any other fields you want to return for the listing
}

export interface PendingAdListItem {
  id: string; // string version of ObjectId
  title: string;
  submitterEmail: string;
  submissionDate: string; // ISO string date
  description: string;
  contentUrl: string;
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id || session.user.role !== 'reviewer') {
    return NextResponse.json({ message: 'Unauthorized or invalid role' }, { status: 401 });
  }

  try {
    const client = await clientPromise;
    const db = client.db();
    const adsCollection = db.collection<AdDocumentForListing>('ads');
    const currentReviewerId = session.user.id;

    // Fetch pending ads: ads assigned to current reviewer OR ads with no assignment
    const pendingQuery = {
      status: 'pending' as 'pending',
      $or: [
        { assignedReviewerIds: currentReviewerId },
        { assignedReviewerIds: { $exists: false } },
        { assignedReviewerIds: { $size: 0 } }
      ]
    };

    const pendingAdsCursor = adsCollection
      .find(pendingQuery)
      .sort({ submittedAt: 1 }); // Oldest first

    const pendingAdsDocuments = await pendingAdsCursor.toArray();

    const pendingAds: PendingAdListItem[] = pendingAdsDocuments.map(ad => ({
      id: ad._id.toHexString(),
      title: ad.title,
      submitterEmail: ad.submitterEmail,
      submissionDate: ad.submittedAt.toISOString(),
      description: ad.description, // Added description
      contentUrl: ad.contentUrl,   // Added contentUrl
    }));

    return NextResponse.json(pendingAds, { status: 200 });

  } catch (error) {
    console.error('Error fetching pending ads:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json({ message: 'Failed to fetch pending ads', error: errorMessage }, { status: 500 });
  }
}
