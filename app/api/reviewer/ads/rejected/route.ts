import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from 'mongodb';

// Using a similar structure to AdDocumentForListing for consistency
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
  reviewedAt?: Date; // This date would also be the rejection date
  reviewerId?: string;
  rejectionReason?: string; // Specific to rejected ads
  supportingDocuments?: Array<{ url: string; publicId: string; name: string }>; // Added
}

export interface RejectedAdListItem {
  id: string; // string version of ObjectId
  title: string;
  submitterId: string;
  submitterEmail: string;
  submissionDate: string; // ISO string date
  rejectionDate: string; // ISO string date for reviewedAt (when it was rejected)
  reviewerId?: string; // ID of the reviewer
  rejectionReason?: string;
  // contentUrl: string; // REMOVED
  adFileUrl?: string; // ADDED
  adFilePublicId?: string; // ADDED
  adFileType?: 'image' | 'video' | 'pdf' | 'other'; // ADDED
  description: string; // Added
  supportingDocuments?: Array<{ url: string; publicId: string; name: string }>; // Added
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
      rejectionDate: ad.reviewedAt ? ad.reviewedAt.toISOString() : new Date(0).toISOString(), 
      reviewerId: ad.reviewerId,
      rejectionReason: ad.rejectionReason,
      description: ad.description, // Added
      // contentUrl: ad.contentUrl, // REMOVED
      adFileUrl: ad.adFileUrl, // ADDED
      adFilePublicId: ad.adFilePublicId, // ADDED
      supportingDocuments: ad.supportingDocuments, // Added
      adFileType: (() => { // IIFE to determine fileType
        let fileType: RejectedAdListItem['adFileType'] = 'other';
        if (ad.adFileUrl) {
          if (ad.resource_type === 'image' || /\.(jpeg|jpg|gif|png|webp)$/i.test(ad.adFileUrl)) {
            fileType = 'image';
          } else if (ad.resource_type === 'video' || /\.(mp4|webm|ogg)$/i.test(ad.adFileUrl)) {
            fileType = 'video';
          } else if (/\.pdf$/i.test(ad.adFileUrl)) {
            fileType = 'pdf';
          }
        }
        return fileType;
      })(),
    }));

    return NextResponse.json(rejectedAds, { status: 200 });

  } catch (error) {
    console.error('Error fetching rejected ads:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json({ message: 'Failed to fetch rejected ads', error: errorMessage }, { status: 500 });
  }
}
