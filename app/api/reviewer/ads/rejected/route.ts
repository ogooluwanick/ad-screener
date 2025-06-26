import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from 'mongodb';
import { sendAdReviewNotifications } from '@/lib/ad-notifications';

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
  compliance?: ComplianceData; // Added for compliance checklist
}

// Structure for the compliance checklist data (should be in a shared types file)
interface ComplianceData {
  rulesCompliance: "Yes" | "No" | "N/A";
  falseClaimsFree: "Yes" | "No" | "N/A";
  claimsSubstantiated: "Yes" | "No" | "N/A";
  offensiveContentFree: "Yes" | "No" | "N/A";
  targetAudienceAppropriate: "Yes" | "No" | "N/A";
  comparativeAdvertisingFair: "Yes" | "No" | "N/A";
  disclaimersDisplayed: "Yes" | "No" | "N/A";
  unapprovedEndorsementsAbsent: "Yes" | "No" | "N/A";
  statutoryApprovalsAttached: "Yes" | "No" | "N/A";
  sanctionHistoryReviewed: "Yes" | "No" | "N/A";
  culturalReferencesAppropriate: "Yes" | "No" | "N/A";
  childrenProtected: "Yes" | "No" | "N/A";
  sanctionsHistory: "Yes" | "No" | "N/A";
  overallComplianceNotes?: string;
  filledAt: Date;
  reviewerId: string;
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
  compliance?: ComplianceData; // Added for compliance checklist
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id || (session.user.role !== 'reviewer' && session.user.role !== 'super_admin')) {
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
      submissionDate: ad.submittedAt instanceof Date ? ad.submittedAt.toISOString() : new Date(ad.submittedAt).toISOString(),
      rejectionDate: ad.reviewedAt ? ad.reviewedAt.toISOString() : new Date(0).toISOString(), 
      reviewerId: ad.reviewerId,
      rejectionReason: ad.rejectionReason,
      description: ad.description, // Added
      // contentUrl: ad.contentUrl, // REMOVED
      adFileUrl: ad.adFileUrl, // ADDED
      adFilePublicId: ad.adFilePublicId, // ADDED
      supportingDocuments: ad.supportingDocuments, // Added
      compliance: ad.compliance, // Added
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

// POST handler to reject an ad
export async function POST(request: Request) {
  console.log('[API /reviewer/ads/rejected] POST request received');
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id || (session.user.role !== 'reviewer' && session.user.role !== 'super_admin')) {
    console.log('[API /reviewer/ads/rejected] Unauthorized access attempt or invalid role.');
    return NextResponse.json({ message: 'Unauthorized or invalid role' }, { status: 401 });
  }
  console.log(`[API /reviewer/ads/rejected] Session validated for ${session.user.role}:`, session.user.id);

  try {
    const body = await request.json();
    const { adId, rejectionReason, complianceData } = body;

    console.log(`[API /reviewer/ads/rejected] Received adId: ${adId}, Reason: ${rejectionReason ? rejectionReason.substring(0,50) + '...' : 'N/A'}`);
    // console.log(`[API /reviewer/ads/rejected] Received complianceData:`, JSON.stringify(complianceData, null, 2));


    if (!adId || typeof adId !== 'string') {
      console.error('[API /reviewer/ads/rejected] Missing or invalid adId.');
      return NextResponse.json({ message: 'Missing or invalid adId' }, { status: 400 });
    }
    if (!rejectionReason || typeof rejectionReason !== 'string' || rejectionReason.trim() === '') {
      console.error('[API /reviewer/ads/rejected] Missing or invalid rejectionReason.');
      return NextResponse.json({ message: 'Missing or invalid rejectionReason' }, { status: 400 });
    }
    if (!complianceData || typeof complianceData !== 'object') {
      console.error('[API /reviewer/ads/rejected] Missing or invalid complianceData.');
      return NextResponse.json({ message: 'Missing or invalid complianceData' }, { status: 400 });
    }

    const requiredComplianceKeys: (keyof ComplianceData)[] = [
      "rulesCompliance", "falseClaimsFree", "claimsSubstantiated", "offensiveContentFree",
      "targetAudienceAppropriate", "comparativeAdvertisingFair", "disclaimersDisplayed",
      "unapprovedEndorsementsAbsent", "statutoryApprovalsAttached", "sanctionHistoryReviewed",
      "culturalReferencesAppropriate", "childrenProtected", "sanctionsHistory"
    ];
    for (const key of requiredComplianceKeys) {
      if (!(key in complianceData) || !["Yes", "No", "N/A"].includes(complianceData[key])) {
        console.error(`[API /reviewer/ads/rejected] Invalid or missing compliance field: ${key}`);
        return NextResponse.json({ message: `Invalid or missing compliance field: ${key}` }, { status: 400 });
      }
    }

    const client = await clientPromise();
    const db = client.db();
    const adsCollection = db.collection<AdDocumentForListing>('ads');

    const adObjectId = new ObjectId(adId);
    const adToUpdate = await adsCollection.findOne({ _id: adObjectId });

    if (!adToUpdate) {
      console.error(`[API /reviewer/ads/rejected] Ad with ID ${adId} not found.`);
      return NextResponse.json({ message: 'Ad not found' }, { status: 404 });
    }

    if (adToUpdate.status !== 'pending') {
      console.warn(`[API /reviewer/ads/rejected] Ad ${adId} is not in 'pending' status. Current status: ${adToUpdate.status}`);
      return NextResponse.json({ message: `Ad is not in 'pending' status. Current status: ${adToUpdate.status}` }, { status: 400 });
    }
    
    const finalComplianceData: ComplianceData = {
      ...complianceData,
      reviewerId: session.user.id,
      filledAt: new Date(),
    };
    // console.log(`[API /reviewer/ads/rejected] Final compliance data for ad ${adId}:`, JSON.stringify(finalComplianceData, null, 2));


    const updateResult = await adsCollection.updateOne(
      { _id: adObjectId },
      {
        $set: {
          status: 'rejected' as 'rejected',
          reviewedAt: new Date(),
          reviewerId: session.user.id,
          rejectionReason: rejectionReason.trim(),
          compliance: finalComplianceData,
        },
      }
    );

    if (updateResult.modifiedCount === 0) {
      console.error(`[API /reviewer/ads/rejected] Failed to update ad ${adId}. No document was modified.`);
      return NextResponse.json({ message: 'Failed to reject ad. Please try again.' }, { status: 500 });
    }

    console.log(`[API /reviewer/ads/rejected] Ad ${adId} successfully rejected by reviewer ${session.user.id}.`);

    // --- Start Notifications ---
    await sendAdReviewNotifications({
      adDetails: {
        submitterId: adToUpdate.submitterId,
        submitterEmail: adToUpdate.submitterEmail,
        title: adToUpdate.title,
        adId: adId,
      },
      status: 'rejected',
      rejectionReason: rejectionReason.trim(),
    });
    // --- End Notifications ---

    return NextResponse.json({ message: 'Ad rejected successfully', adId }, { status: 200 });

  } catch (error) {
    console.error('[API /reviewer/ads/rejected] Critical error in POST handler:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json({ message: 'Failed to reject ad', error: errorMessage }, { status: 500 });
  }
}
