import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";
import { ObjectId, MongoClient } from 'mongodb';
import { createInAppNotification } from '@/lib/notificationService';
import { sendEmail } from '@/lib/email'; // Import sendEmail utility

// Define a simple User interface for fetching reviewer details
interface UserDocument {
  _id: ObjectId;
  email: string;
  name?: string;
  role: string;
}

interface AdDocument {
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
  rejectionReason?: string;
  assignedReviewerIds?: string[];
  adFileType?: string;
  adFileUrl?: string;
  supportingDocuments?: Array<{
    name: string;
    url: string;
  }>;
  compliance?: any;
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id || (session.user.role !== 'admin' && session.user.role !== 'superadmin' && session.user.role !== 'reviewer')) {
    return NextResponse.json({ message: 'Unauthorized or invalid role' }, { status: 401 });
  }

  try {
    const { adId, title, description, status, rejectionReason, reviewerId, assignedReviewerIds } = await request.json();

    if (!adId) {
      return NextResponse.json({ message: 'Ad ID is required' }, { status: 400 });
    }

    const client = await clientPromise();
    const db = client.db();
    const adsCollection = db.collection<AdDocument>('ads');

    // Build update object with provided fields
    const updateFields: any = {};
    if (title) updateFields.title = title;
    if (description) updateFields.description = description;
    if (status) updateFields.status = status;
    if (reviewerId !== undefined) updateFields.reviewerId = reviewerId || null; // Keep for potential legacy use or primary reviewer
    if (rejectionReason !== undefined) updateFields.rejectionReason = rejectionReason || null;
    if (assignedReviewerIds !== undefined) {
        // Ensure it's an array of strings, or an empty array if null/undefined
        updateFields.assignedReviewerIds = Array.isArray(assignedReviewerIds) ? assignedReviewerIds.filter(id => typeof id === 'string') : [];
    }
    
    // Set reviewedAt timestamp if status is being changed to approved or rejected
    // and if it's not already set (to avoid overwriting if only assigning reviewers)
    // However, assignment itself doesn't mean "reviewed". This logic might need refinement.
    // For now, let's assume assignment doesn't automatically mark as reviewed.
    // The original logic for reviewedAt based on status change remains.
    if (status === 'approved' || status === 'rejected') {
      updateFields.reviewedAt = new Date();
    }

    const result = await adsCollection.updateOne(
      { _id: new ObjectId(adId) },
      { $set: updateFields }
    );

    if (result.modifiedCount !== 1 && result.matchedCount !== 1) { // Check if matched and modified or just matched if no actual field values changed
      // If assignedReviewerIds was the only change and it was the same as before, modifiedCount could be 0.
      // A more robust check might be needed if we only want to succeed if there was a change.
      // For now, if it matched, we assume success even if values were identical.
      const adExists = await adsCollection.findOne({ _id: new ObjectId(adId) });
      if (!adExists) {
        return NextResponse.json({ message: 'Ad not found or failed to update' }, { status: 404 });
      }
      // If it exists but wasn't modified, it might mean the data sent was identical to existing data.
      // This can be considered a success in terms of the desired state being achieved.
    }

    // TODO: Implement Notification Logic
    // 1. Fetch details of assigned reviewers (email, name) from the 'users' collection.
    // 2. Create in-app notifications for each assigned reviewer.
    //    - Need to know the structure for creating notifications (e.g., POST to /api/notifications/create)
    //    - Notification message: "You have been assigned to review an Ad: [Ad Title]"
    // 3. Send email notifications to each assigned reviewer.
    //    - Use lib/email.ts
    //    - Email content: Similar to in-app notification, with a link to the Ad or reviewer dashboard.

    if (assignedReviewerIds && assignedReviewerIds.length > 0) {
      try {
        const adDetails = await adsCollection.findOne({ _id: new ObjectId(adId) });
        if (!adDetails) {
          console.error(`Ad with ID ${adId} not found after update for sending notifications.`);
        } else {
          const usersCollection = db.collection<UserDocument>('users');
          const reviewerObjectIds = assignedReviewerIds.map((id: string) => new ObjectId(id));
          const reviewersToNotify = await usersCollection.find({ _id: { $in: reviewerObjectIds } }).toArray();

          const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'; // Fallback URL

          for (const reviewer of reviewersToNotify) {
            const notificationTitle = "New Ad Assignment";
            const notificationMessage = `You have been assigned to review the Ad: "${adDetails.title}". Please treat this as urgent.`;
            // Consider making the deep link more specific if possible, e.g., directly to the Ad view for reviewers
            const adReviewLink = `${appUrl}reviewer/pending?adId=${adId}`; // Adjust if reviewer page is different

            // 1. Create In-App Notification using the existing client
            try {
              await createInAppNotification({
                userId: reviewer._id.toString(),
                title: notificationTitle,
                message: notificationMessage,
                level: 'info',
                deepLink: adReviewLink,
              });

              console.log(`In-app notification request sent for ${reviewer.email} for Ad ${adId}.`);
            } catch (e: unknown) {
              console.error(`Error calling createInAppNotification for ${reviewer.email}:`, e instanceof Error ? e.message : e);
            }

            // 2. Send Email Notification
            try {
              const emailSubject = `Urgent: New Ad Assigned for Review - "${adDetails.title}"`;
              const emailText = `Hello ${reviewer.name || reviewer.email.split('@')[0]},\n\nYou have been assigned to review a new Ad titled "${adDetails.title}".\nPlease review it urgently.\n\nYou can view the Ad here: ${adReviewLink}\n\nThank you,\nAdScreener Admin`;
              const emailHtmlContent = `
                <p>Hello ${reviewer.name || reviewer.email.split('@')[0]},</p>
                <p>You have been assigned to review a new Ad titled "<strong>${adDetails.title}</strong>".</p>
                <p><strong>Please review this Ad urgently.</strong></p>
                <p>You can view the Ad by clicking the button below or using the link:</p>
                <p style="text-align: center; margin: 20px 0;">
                  <a href="${adReviewLink}" style="background-color: #007bff; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">View Ad for Review</a>
                </p>
                <p><a href="${adReviewLink}">${adReviewLink}</a></p>
                <p>Thank you,<br/>The AdScreener Admin Team</p>
              `;

              await sendEmail({
                to: reviewer.email,
                subject: emailSubject,
                text: emailText,
                htmlContent: emailHtmlContent,
                customerName: reviewer.name || reviewer.email.split('@')[0], // For default template if htmlContent was not used
              });
            } catch (e: unknown) {
              console.error(`Error sending email notification to ${reviewer.email}:`, e instanceof Error ? e.message : e);
            }
          }
        }
      } catch (notificationError: unknown) { // Explicitly type notificationError
        console.error('Error during notification process:', notificationError instanceof Error ? notificationError.message : notificationError);
        // Do not let notification errors fail the main Ad update response
      }
    }

    return NextResponse.json({ message: 'Ad updated successfully' }, { status: 200 });

  } catch (error: unknown) { // Explicitly type error
    console.error('Error updating Ad:', error instanceof Error ? error.message : error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred during Ad update.';
    return NextResponse.json({ message: 'Failed to update Ad', error: errorMessage }, { status: 500 });
  }
}
