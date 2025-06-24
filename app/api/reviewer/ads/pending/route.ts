import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from 'mongodb';

// Consistent Ad interface (can be moved to a shared types file later)
export interface AdDocumentForListing {
  _id: ObjectId;
  title: string;
  description: string;
  // contentUrl: string; // REMOVED
  adFileUrl?: string; // RENAMED from imageUrl
  adFilePublicId?: string; // ADDED
  resource_type?: string; // ADDED (from Cloudinary, e.g., 'image', 'video')
  submitterId: string;
  submitterEmail: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: Date;
  supportingDocuments?: Array<{ url: string; publicId: string; name: string }>; // Added
  mediaType?: string; // Added
  vettingSpeed?: string; // Added
  totalFeeNgn?: number; // Added
  reviewedAt?: Date;
  reviewerId?: string;
  rejectionReason?: string;
  assignedReviewerIds?: string[];
}

export interface PendingAdListItem {
  id: string; // string version of ObjectId
  title: string;
  submitterId: string;
  submitterEmail: string;
  submissionDate: string; // ISO string date
  description: string;
  // contentUrl: string; // REMOVED
  adFileUrl?: string; // RENAMED from imageUrl
  adFilePublicId?: string; // ADDED
  adFileType?: 'image' | 'video' | 'pdf' | 'other'; // ADDED
  supportingDocuments?: Array<{ url: string; publicId: string; name: string }>; // Added
  submitterName?: string;
  mediaType?: string; // Added
  vettingSpeed?: string; // Added
  totalFeeNgn?: number; // Added
}

// Basic User interface for fetching name
interface UserDocument {
  _id: ObjectId;
  name?: string;
  email?: string;
  // other fields if necessary
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id || (session.user.role !== 'reviewer' && session.user.role !== 'super_admin')) {
    return NextResponse.json({ message: 'Unauthorized or invalid role' }, { status: 401 });
  }

  try {
    const client = await clientPromise(); // Call the function
    const db = client.db();
    const adsCollection = db.collection<AdDocumentForListing>('ads');
    const usersCollection = db.collection<UserDocument>('users'); // Added users collection
    
    let pendingQuery: any;

    if (session.user.role === 'super_admin') {
      pendingQuery = {
        status: 'pending' as 'pending',
      };
    } else { // For 'reviewer'
      const currentReviewerId = session.user.id;
      pendingQuery = {
        status: 'pending' as 'pending',
        $or: [
          { assignedReviewerIds: currentReviewerId },
          { assignedReviewerIds: { $exists: false } },
          { assignedReviewerIds: { $size: 0 } }
        ]
      };
    }

    const pendingAdsCursor = adsCollection
      .find(pendingQuery)
      .sort({ submittedAt: 1 }); // Oldest first

    const pendingAdsDocuments = await pendingAdsCursor.toArray();

    const pendingAdsPromises = pendingAdsDocuments.map(async (ad) => {
      let submitterName = ad.submitterEmail; // Default to email
      if (ObjectId.isValid(ad.submitterId)) {
        const submitter = await usersCollection.findOne({ _id: new ObjectId(ad.submitterId) });
        if (submitter && submitter.name) {
          submitterName = submitter.name;
        }
      }

      let fileType: PendingAdListItem['adFileType'] = 'other';
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
        submitterName: submitterName,
        submissionDate: ad.submittedAt.toISOString(),
        description: ad.description,
        // contentUrl: ad.contentUrl, // REMOVED
        adFileUrl: ad.adFileUrl, // RENAMED
        adFilePublicId: ad.adFilePublicId, // ADDED
        adFileType: fileType, // ADDED
        supportingDocuments: ad.supportingDocuments, // Added
        mediaType: ad.mediaType, // Added
        vettingSpeed: ad.vettingSpeed, // Added
        totalFeeNgn: ad.totalFeeNgn, // Added
      };
    });

    const pendingAds: PendingAdListItem[] = await Promise.all(pendingAdsPromises);

    return NextResponse.json(pendingAds, { status: 200 });

  } catch (error) {
    console.error('Error fetching pending ads:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json({ message: 'Failed to fetch pending ads', error: errorMessage }, { status: 500 });
  }
}
