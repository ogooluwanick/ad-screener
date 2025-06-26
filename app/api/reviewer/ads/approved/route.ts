import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from 'mongodb';
import { sendAdReviewNotifications } from '@/lib/ad-notifications';

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
  supportingDocuments?: Array<{ url: string; publicId: string; name: string }>; // Ensure this is present
  reviewedAt?: Date;
  reviewerId?: string;
  assignedReviewerIds?: string[];
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
  description: string; // Added description
  supportingDocuments?: Array<{ url: string; publicId: string; name: string }>; // Added
  compliance?: ComplianceData; // Added for compliance checklist
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
        submissionDate: ad.submittedAt instanceof Date ? ad.submittedAt.toISOString() : new Date(ad.submittedAt).toISOString(),
        approvalDate: ad.reviewedAt ? ad.reviewedAt.toISOString() : new Date(0).toISOString(), 
        reviewerId: ad.reviewerId,
        // contentUrl: ad.contentUrl, // REMOVED
        adFileUrl: ad.adFileUrl, // ADDED
        adFilePublicId: ad.adFilePublicId, // ADDED
        adFileType: fileType, // ADDED
        description: ad.description, // Added description
        supportingDocuments: ad.supportingDocuments, // Added
        compliance: ad.compliance, // Added
      };
    });

    return NextResponse.json(approvedAds, { status: 200 });

  } catch (error) {
    console.error('Error fetching approved ads:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json({ message: 'Failed to fetch approved ads', error: errorMessage }, { status: 500 });
  }
}

// POST handler to approve an ad
export async function POST(request: Request) {
  console.log('[API /reviewer/ads/approved] POST request received');
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id || (session.user.role !== 'reviewer' && session.user.role !== 'super_admin')) {
    console.log('[API /reviewer/ads/approved] Unauthorized access attempt or invalid role.');
    return NextResponse.json({ message: 'Unauthorized or invalid role' }, { status: 401 });
  }
  console.log(`[API /reviewer/ads/approved] Session validated for ${session.user.role}:`, session.user.id);

  try {
    const body = await request.json();
    const { adId, complianceData } = body;

    console.log(`[API /reviewer/ads/approved] Received adId: ${adId}`);
    // console.log(`[API /reviewer/ads/approved] Received complianceData:`, JSON.stringify(complianceData, null, 2));

    if (!adId || typeof adId !== 'string') {
      console.error('[API /reviewer/ads/approved] Missing or invalid adId.');
      return NextResponse.json({ message: 'Missing or invalid adId' }, { status: 400 });
    }
    if (!complianceData || typeof complianceData !== 'object') {
      console.error('[API /reviewer/ads/approved] Missing or invalid complianceData.');
      return NextResponse.json({ message: 'Missing or invalid complianceData' }, { status: 400 });
    }
    
    const requiredKeys: (keyof ComplianceData)[] = [
      "rulesCompliance", "falseClaimsFree", "claimsSubstantiated", "offensiveContentFree",
      "targetAudienceAppropriate", "comparativeAdvertisingFair", "disclaimersDisplayed",
      "unapprovedEndorsementsAbsent", "statutoryApprovalsAttached", "sanctionHistoryReviewed",
      "culturalReferencesAppropriate", "childrenProtected", "sanctionsHistory"
    ];
    for (const key of requiredKeys) {
      if (!(key in complianceData) || !["Yes", "No", "N/A"].includes(complianceData[key])) {
        console.error(`[API /reviewer/ads/approved] Invalid or missing compliance field: ${key}`);
        return NextResponse.json({ message: `Invalid or missing compliance field: ${key}` }, { status: 400 });
      }
    }

    const client = await clientPromise();
    const db = client.db();
    const adsCollection = db.collection<AdDocumentForListing>('ads');

    const adObjectId = new ObjectId(adId);
    const adToUpdate = await adsCollection.findOne({ _id: adObjectId });

    if (!adToUpdate) {
      console.error(`[API /reviewer/ads/approved] Ad with ID ${adId} not found.`);
      return NextResponse.json({ message: 'Ad not found' }, { status: 404 });
    }

    if (adToUpdate.status !== 'pending') {
      console.warn(`[API /reviewer/ads/approved] Ad ${adId} is not in 'pending' status. Current status: ${adToUpdate.status}`);
      return NextResponse.json({ message: `Ad is not in 'pending' status. Current status: ${adToUpdate.status}` }, { status: 400 });
    }

    const finalComplianceData: ComplianceData = {
      ...complianceData, // Spread the received compliance data
      reviewerId: session.user.id, // Override/set reviewerId from session
      filledAt: new Date(), // Set current timestamp
    };
    // console.log(`[API /reviewer/ads/approved] Final compliance data for ad ${adId}:`, JSON.stringify(finalComplianceData, null, 2));

    const updateResult = await adsCollection.updateOne(
      { _id: adObjectId },
      {
        $set: {
          status: 'approved' as 'approved',
          reviewedAt: new Date(),
          reviewerId: session.user.id,
          compliance: finalComplianceData,
        },
      }
    );

    if (updateResult.modifiedCount === 0) {
      console.error(`[API /reviewer/ads/approved] Failed to update ad ${adId}. No document was modified.`);
      return NextResponse.json({ message: 'Failed to approve ad. Please try again.' }, { status: 500 });
    }

    console.log(`[API /reviewer/ads/approved] Ad ${adId} successfully approved by reviewer ${session.user.id}.`);

    // --- Start Notifications ---
    await sendAdReviewNotifications({
      adDetails: {
        submitterId: adToUpdate.submitterId,
        submitterEmail: adToUpdate.submitterEmail,
        title: adToUpdate.title,
        adId: adId,
      },
      status: 'approved',
    });
    // --- End Notifications ---

    return NextResponse.json({ message: 'Ad approved successfully', adId }, { status: 200 });

  } catch (error) {
    console.error('[API /reviewer/ads/approved] Critical error in POST handler:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json({ message: 'Failed to approve ad', error: errorMessage }, { status: 500 });
  }
}
