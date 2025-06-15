import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from 'mongodb';

// Using a similar structure to AdDocumentForListing for consistency
export interface AdDocumentForListing {
  _id: ObjectId;
  title: string;
  description: string;
  contentUrl: string;
  submitterId: string;
  submitterEmail: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: Date;
  reviewedAt?: Date; // This date would also be the rejection date
  reviewerId?: string;
  rejectionReason?: string; // Specific to rejected ads
  // Add any other fields you want to return for the listing
}

export interface RejectedAdListItem {
  id: string; // string version of ObjectId
  title: string;
  submitterId: string; // Added submitterId
  submitterEmail: string;
  submissionDate: string; // ISO string date
  rejectionDate: string; // ISO string date for reviewedAt (when it was rejected)
  reviewerId?: string; // ID of the reviewer
  rejectionReason?: string;
  contentUrl: string;
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id || session.user.role !== 'reviewer') {
    return NextResponse.json({ message: 'Unauthorized or invalid role' }, { status: 401 });
  }

  try {
    const client = await clientPromise();
    const db = client.db();
    const adsCollection = db.collection<AdDocumentForListing>('ads');

    // Fetch all rejected ads, sorted by review date (which is the rejection date, newest first)
    const rejectedAdsCursor = adsCollection
      .find({ status: 'rejected' })
      .sort({ reviewedAt: -1 }); // Newest rejected first

    const rejectedAdsDocuments = await rejectedAdsCursor.toArray();

    const rejectedAds: RejectedAdListItem[] = rejectedAdsDocuments.map(ad => ({
      id: ad._id.toHexString(),
      title: ad.title,
      submitterId: ad.submitterId, // Added submitterId
      submitterEmail: ad.submitterEmail,
      submissionDate: ad.submittedAt.toISOString(),
      rejectionDate: ad.reviewedAt ? ad.reviewedAt.toISOString() : new Date(0).toISOString(), // Fallback for safety
      reviewerId: ad.reviewerId,
      rejectionReason: ad.rejectionReason,
      contentUrl: ad.contentUrl,
    }));

    return NextResponse.json(rejectedAds, { status: 200 });

  } catch (error) {
    console.error('Error fetching rejected ads:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json({ message: 'Failed to fetch rejected ads', error: errorMessage }, { status: 500 });
  }
}
