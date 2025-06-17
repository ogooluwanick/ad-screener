import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from 'mongodb';

// Using the same AdDocumentForListing from the pending route for consistency
export interface AdDocumentForListing { // This should ideally be a shared type
  _id: ObjectId;
  title: string;
  description: string;
  // contentUrl: string; // REMOVED
  adFileUrl?: string; // ADDED
  adFilePublicId?: string; // ADDED
  resource_type?: string; // ADDED (from Cloudinary, e.g., 'image', 'video')
  submitterId: string;
  submitterEmail: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: Date;
  reviewedAt?: Date;
  reviewerId?: string;
  assignedReviewerIds?: string[];
}

export interface ApprovedAdListItem {
  id: string; // string version of ObjectId
  title: string;
  submitterId: string;
  submitterEmail: string;
  submissionDate: string; // ISO string date
  approvalDate: string; // ISO string date for reviewedAt
  reviewerId?: string; // ID of the reviewer, if available
  // contentUrl: string; // REMOVED
  adFileUrl?: string; // ADDED
  adFilePublicId?: string; // ADDED
  adFileType?: 'image' | 'video' | 'pdf' | 'other'; // ADDED
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
      let fileType: ApprovedAdListItem['adFileType'] = 'other';
      if (ad.adFileUrl) {
        if (ad.resource_type === 'image' || /\.(jpeg|jpg|gif|png|webp)$/i.test(ad.adFileUrl)) {
          fileType = 'image';
        } else if (ad.resource_type === 'video' || /\.(mp4|webm|ogg)$/i.test(ad.adFileUrl)) {
          fileType = 'video';
        } else if (/\.pdf$/i.test(ad.adFileUrl)) {
          fileType = 'pdf';
        }
      }

      return {
        id: ad._id.toHexString(),
        title: ad.title,
        submitterId: ad.submitterId,
        submitterEmail: ad.submitterEmail,
        submissionDate: ad.submittedAt.toISOString(),
        approvalDate: ad.reviewedAt ? ad.reviewedAt.toISOString() : new Date(0).toISOString(), 
        reviewerId: ad.reviewerId,
        // contentUrl: ad.contentUrl, // REMOVED
        adFileUrl: ad.adFileUrl, // ADDED
        adFilePublicId: ad.adFilePublicId, // ADDED
        adFileType: fileType, // ADDED
      };
    });

    return NextResponse.json(approvedAds, { status: 200 });

  } catch (error) {
    console.error('Error fetching approved ads:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json({ message: 'Failed to fetch approved ads', error: errorMessage }, { status: 500 });
  }
}
