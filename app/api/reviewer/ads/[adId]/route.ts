import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // Adjust path as needed
import clientPromise from "@/lib/mongodb";
import { ObjectId } from 'mongodb';
import { sendNotificationToUser, triggerReviewerDashboardUpdate, triggerSubmitterDashboardUpdate } from '@/lib/notification-client'; // Added triggerSubmitterDashboardUpdate

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
    return NextResponse.json({ message: 'Unauthorized or invalid role' }, { status: 401 });
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


    const client = await clientPromise;
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

    // Check if the ad is assigned to this reviewer or unassigned
    const reviewerId = session.user.id;
    const isAssignedToThisReviewer = adToUpdate.assignedReviewerIds && adToUpdate.assignedReviewerIds.includes(reviewerId);
    const isUnassigned = !adToUpdate.assignedReviewerIds || adToUpdate.assignedReviewerIds.length === 0;

    if (!isAssignedToThisReviewer && !isUnassigned) {
      return NextResponse.json({ message: 'This ad is not assigned to you for review.' }, { status: 403 }); // Forbidden
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

    // --- Send Notification to Submitter ---
    let notificationSentToSubmitter = false;
    if (adToUpdate.submitterEmail) {
      let notificationTitle = '';
      let notificationMessage = '';
      let notificationLevel: 'success' | 'error' = 'success';

      if (body.status === 'approved') {
        notificationTitle = 'Your Ad Has Been Approved!';
        notificationMessage = `Congratulations! Your ad "${adToUpdate.title}" (ID: ${adId}) has been approved.`;
        notificationLevel = 'success';
      } else { // 'rejected'
        notificationTitle = 'Your Ad Has Been Rejected';
        notificationMessage = `Unfortunately, your ad "${adToUpdate.title}" (ID: ${adId}) has been rejected. Reason: ${body.rejectionReason}`;
        notificationLevel = 'error';
      }

      await sendNotificationToUser(adToUpdate.submitterEmail, {
        title: notificationTitle,
        message: notificationMessage,
        level: notificationLevel,
        // deepLink: `/submitter/ads/${adId}` // Optional
      });
      notificationSentToSubmitter = true;
    }

    // --- Trigger Dashboard Update for Reviewers ---
    // This should be called regardless of whether the submitter notification was sent,
    // as long as the ad status was successfully updated.
    if (result.modifiedCount > 0) {
      await triggerReviewerDashboardUpdate();
      // Also trigger an update for the specific submitter's dashboard
      if (adToUpdate.submitterId) {
        await triggerSubmitterDashboardUpdate(adToUpdate.submitterId);
      }
    }

    return NextResponse.json({
      message: `Ad ${adId} status updated to ${body.status}. ${notificationSentToSubmitter ? 'Submitter notified.' : 'Submitter not notified (no email or error).'} Relevant dashboards refreshing.`,
    }, { status: 200 });

  } catch (error) {
    console.error(`Error updating ad ${adId}:`, error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json({ message: 'Failed to update ad status', error: errorMessage }, { status: 500 });
  }
}

// Placeholder for GET /api/reviewer/ads/[adId] (to get a specific ad for review)
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
  // TODO: Implement logic to fetch and return a specific ad by ID
  return NextResponse.json({ message: `GET /api/reviewer/ads/${adId} not yet implemented.` });
}
