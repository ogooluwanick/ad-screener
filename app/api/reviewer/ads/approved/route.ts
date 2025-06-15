import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from 'mongodb';

// Using the same AdDocumentForListing from the pending route for consistency
export interface AdDocumentForListing {
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
  assignedReviewerIds?: string[]; // Added for consistency
  // Add any other fields you want to return for the listing
}

export interface ApprovedAdListItem {
  id: string; // string version of ObjectId
  title: string;
  submitterId: string; // Added submitterId
  submitterEmail: string;
  submissionDate: string; // ISO string date
  approvalDate: string; // ISO string date for reviewedAt
  reviewerId?: string; // ID of the reviewer, if available
  contentUrl: string;
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id || session.user.role !== 'reviewer') {
    return NextResponse.json({ message: 'Unauthorized or invalid role' }, { status: 401 });
  }

  try {
    const client = await clientPromise(); // Call the function
    const db = client.db();
    const adsCollection = db.collection<AdDocumentForListing>('ads');

    // Fetch all approved ads, sorted by review date (newest first)
    const approvedAdsCursor = adsCollection
      .find({ status: 'approved' })
      .sort({ reviewedAt: -1 }); // Newest approved first

    const approvedAdsDocuments = await approvedAdsCursor.toArray();

    // Corrected mapping
    const approvedAds: ApprovedAdListItem[] = approvedAdsDocuments.map((ad: AdDocumentForListing) => {
      return {
        id: ad._id.toHexString(),
        title: ad.title,
        submitterId: ad.submitterId,
        submitterEmail: ad.submitterEmail,
        submissionDate: ad.submittedAt.toISOString(),
        approvalDate: ad.reviewedAt ? ad.reviewedAt.toISOString() : new Date(0).toISOString(), // Fallback for safety
        reviewerId: ad.reviewerId,
        contentUrl: ad.contentUrl,
      };
    });

    return NextResponse.json(approvedAds, { status: 200 });

  } catch (error) {
    console.error('Error fetching approved ads:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json({ message: 'Failed to fetch approved ads', error: errorMessage }, { status: 500 });
  }
}
