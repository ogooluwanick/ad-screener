import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // Adjust path as needed
import clientPromise from "@/lib/mongodb";
import { ObjectId } from 'mongodb';
import { sendAdReviewNotifications } from '@/lib/ad-notifications';

// Define a basic Ad interface (consistent with submitter route)
interface AdDocument {
  _id: ObjectId; // Using ObjectId directly from mongodb
  title: string;
  description: string;
  contentUrl: string;
  submitterId: string;
  submitterEmail: string; // Email of the submitter for notifications
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: Date;
  reviewedAt?: Date;
  reviewerId?: string;
  rejectionReason?: string;
  imageUrl?: string; // Added for consistency
  assignedReviewerIds?: string[]; // Optional for existing docs, but new ones will have it
}

interface ReviewPayload {
  status: 'approved' | 'rejected';
  rejectionReason?: string; // Required if status is 'rejected'
}

export async function PUT(
  request: Request,
  { params }: { params: { adId: string } }
) {
  const session = await getServerSession(authOptions);
  const { adId } = params;

  if (!session || !session.user || !session.user.id || session.user.role !== 'reviewer') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  if (!ObjectId.isValid(adId)) {
    return NextResponse.json({ message: 'Invalid Ad ID format' }, { status: 400 });
  }

  try {
    const body: ReviewPayload = await request.json();

    if (!body.status || (body.status === 'rejected' && !body.rejectionReason)) {
      return NextResponse.json({ message: 'Missing required fields (status, and rejectionReason if rejected)' }, { status: 400 });
    }
    if (body.status === 'approved' && body.rejectionReason) {
        return NextResponse.json({ message: 'Rejection reason should not be provided for approved ads' }, { status: 400 });
    }


    const client = await clientPromise(); // Call the function
    const db = client.db();
    const adsCollection = db.collection<AdDocument>('ads');

    const adObjectId = new ObjectId(adId);

    const adToUpdate = await adsCollection.findOne({ _id: adObjectId });

    if (!adToUpdate) {
      return NextResponse.json({ message: 'Ad not found' }, { status: 404 });
    }

    if (adToUpdate.status !== 'pending') {
      return NextResponse.json({ message: `Ad is already ${adToUpdate.status} and cannot be re-reviewed through this endpoint.` }, { status: 409 }); // Conflict
    }

    // Check if the Ad is assigned to this reviewer or unassigned
    const reviewerId = session.user.id;
    const isAssignedToThisReviewer = adToUpdate.assignedReviewerIds && adToUpdate.assignedReviewerIds.includes(reviewerId);
    const isUnassigned = !adToUpdate.assignedReviewerIds || adToUpdate.assignedReviewerIds.length === 0;

    if (!isAssignedToThisReviewer && !isUnassigned) {
      return NextResponse.json({ message: 'This Ad is not assigned to you for review.' }, { status: 403 }); // Forbidden
    }

    const updateData: Partial<AdDocument> = {
      status: body.status,
      reviewedAt: new Date(),
      reviewerId: session.user.id,
    };

    if (body.status === 'rejected') {
      updateData.rejectionReason = body.rejectionReason;
    }

    const result = await adsCollection.updateOne(
      { _id: adObjectId },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      // Should be caught by findOne earlier, but as a safeguard
      return NextResponse.json({ message: 'Ad not found during update' }, { status: 404 });
    }
    if (result.modifiedCount === 0) {
      return NextResponse.json({ message: 'Ad status was not changed (already in the target state or no change made).' }, { status: 200 });
    }

    // --- Start Notifications ---
    await sendAdReviewNotifications({
      adDetails: {
        submitterId: adToUpdate.submitterId,
        submitterEmail: adToUpdate.submitterEmail,
        title: adToUpdate.title,
        adId: adId,
      },
      status: body.status,
      rejectionReason: body.rejectionReason,
    });

    return NextResponse.json({
      message: `Ad ${adId} status updated to ${body.status}. Notifications initiated. Relevant dashboards refreshing.`,
    }, { status: 200 });

  } catch (error) {
    console.error(`Error updating Ad ${adId}:`, error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json({ message: 'Failed to update Ad status', error: errorMessage }, { status: 500 });
  }
}

// Placeholder for GET /api/reviewer/ads/[adId] (to get a specific Ad for review)
export async function GET(
  request: Request,
  { params }: { params: { adId: string } }
) {
  const session = await getServerSession(authOptions);
  const { adId } = params;

  if (!session || !session.user || !session.user.id || session.user.role !== 'reviewer') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
   if (!ObjectId.isValid(adId)) {
    return NextResponse.json({ message: 'Invalid Ad ID format' }, { status: 400 });
  }
  // TODO: Implement logic to fetch and return a specific Ad by ID
  return NextResponse.json({ message: `GET /api/reviewer/ads/${adId} not yet implemented.` });
}
