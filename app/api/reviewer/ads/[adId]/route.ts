import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // Adjust path as needed
import clientPromise from "@/lib/mongodb";
import { ObjectId } from 'mongodb';
import { sendNotificationToUser } from '@/lib/notification-client'; // Removed triggerReviewerDashboardUpdate and triggerSubmitterDashboardUpdate
import { sendEmail } from '@/lib/email'; // Added for email notifications

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
    const submitterId = adToUpdate.submitterId;
    const submitterEmail = adToUpdate.submitterEmail;
    const adTitle = adToUpdate.title;
    const currentReviewerId = session.user.id;
    const currentReviewerName = session.user.name || 'A reviewer'; // Fallback name

    let submitterNotificationTitle = '';
    let submitterNotificationMessage = '';
    let submitterNotificationLevel: 'success' | 'error' = 'success';
    let emailSubject = '';
    let emailText = '';
    let emailHtmlContent = '';

    if (body.status === 'approved') {
      submitterNotificationTitle = 'Your Ad Has Been Approved!';
      submitterNotificationMessage = `Congratulations! Your Ad "${adTitle}" (ID: ${adId}) has been approved.`;
      submitterNotificationLevel = 'success';

      emailSubject = `Ad Approved: "${adTitle}"`;
      emailText = `Hi ${adToUpdate.submitterEmail || 'Submitter'},\n\nGood news! Your Ad titled "${adTitle}" (ID: ${adId}) has been approved and is now active or scheduled according to its settings.\n\nThank you for using AdScreener.`;
      emailHtmlContent = `<p>Hi ${adToUpdate.submitterEmail || 'Submitter'},</p><p>Good news! Your Ad titled "<strong>${adTitle}</strong>" (ID: ${adId}) has been approved and is now active or scheduled according to its settings.</p><p>Thank you for using AdScreener.</p>`;

    } else { // 'rejected'
      submitterNotificationTitle = 'Your Ad Has Been Rejected';
      submitterNotificationMessage = `Unfortunately, your Ad "${adTitle}" (ID: ${adId}) has been rejected. Reason: ${body.rejectionReason}`;
      submitterNotificationLevel = 'error';

      emailSubject = `Ad Rejected: "${adTitle}"`;
      emailText = `Hi ${adToUpdate.submitterEmail || 'Submitter'},\n\nWe regret to inform you that your Ad titled "${adTitle}" (ID: ${adId}) has been rejected.\nReason: ${body.rejectionReason}\n\nPlease review the feedback and make necessary changes if you wish to resubmit.\n\nRegards,\nThe AdScreener Team`;
      emailHtmlContent = `<p>Hi ${adToUpdate.submitterEmail || 'Submitter'},</p><p>We regret to inform you that your Ad titled "<strong>${adTitle}</strong>" (ID: ${adId}) has been rejected.</p><p><strong>Reason:</strong> ${body.rejectionReason}</p><p>Please review the feedback and make necessary changes if you wish to resubmit.</p><p>Regards,<br/>The AdScreener Team</p>`;
    }

    // 1. In-App Notification to Submitter
    if (submitterId) {
      sendNotificationToUser(submitterId, {
        title: submitterNotificationTitle,
        message: submitterNotificationMessage,
        level: submitterNotificationLevel,
        deepLink: `/submitter/ads?adId=${adId}` // Example deep link
      }).then(() => console.log(`In-app notification sent to submitter ${submitterId} for Ad ${adId} status ${body.status}`))
        .catch(err => console.error(`Failed to send in-app notification to submitter ${submitterId} for Ad ${adId}:`, err));
    } else {
      console.warn(`No submitterId found for Ad ${adId}, cannot send in-app notification.`);
    }

    // 2. Email Notification to Submitter
    if (submitterEmail) {
      sendEmail({
        to: submitterEmail,
        subject: emailSubject,
        text: emailText,
        htmlContent: emailHtmlContent
      }).then(() => console.log(`Email notification sent to submitter ${submitterEmail} for Ad ${adId} status ${body.status}`))
        .catch(err => console.error(`Failed to send email to submitter ${submitterEmail} for Ad ${adId}:`, err));
    } else {
      console.warn(`No submitterEmail found for Ad ${adId}, cannot send email notification.`);
    }
    
    // 3. In-App Notification to Reviewer (who performed the action)
    if (currentReviewerId) {
        sendNotificationToUser(currentReviewerId, {
            title: `Ad Review Complete: ${adTitle}`,
            message: `You have successfully ${body.status} the Ad "${adTitle}" (ID: ${adId}).`,
            level: 'info', // Or 'success'
            // deepLink: `/reviewer/ads/${adId}` // Or to the list of reviewed ads
        }).then(() => console.log(`In-app notification sent to reviewer ${currentReviewerId} for action on Ad ${adId}`))
          .catch(err => console.error(`Failed to send in-app notification to reviewer ${currentReviewerId} for Ad ${adId}:`, err));
    }


    // --- Trigger Dashboard Update for Reviewers --- (This is now handled by client-side polling)
    // if (result.modifiedCount > 0) {
    //   // await triggerReviewerDashboardUpdate(); // Deprecated
    //   // if (adToUpdate.submitterId) {
    //   //   await triggerSubmitterDashboardUpdate(adToUpdate.submitterId); // Deprecated
    //   // }
    // }

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
