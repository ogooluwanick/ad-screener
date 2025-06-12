import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // Adjust path as needed
import clientPromise from "@/lib/mongodb";
import { sendNotificationToUser, triggerReviewerDashboardUpdate } from '@/lib/notification-client';
// import { broadcastNotification } from '@/lib/notification-client'; // If reviewers are notified via broadcast or specific group

// Define a basic Ad interface (you'll likely have a more detailed model)
interface AdPayload {
  title: string;
  description: string;
  contentUrl: string;
  // Add other ad properties here
}

interface AdDocument extends AdPayload {
  _id: string; // Or ObjectId if using mongodb directly
  submitterId: string; // ID of the user who submitted the ad
  submitterEmail: string; // Email of the submitter for notifications
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: Date;
  reviewedAt?: Date;
  reviewerId?: string;
  rejectionReason?: string;
  assignedReviewerIds: string[]; // New field for reviewer assignments
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id || session.user.role !== 'submitter') {
    return NextResponse.json({ message: 'Unauthorized or invalid role' }, { status: 401 });
  }

  try {
    const body: AdPayload = await request.json();

    if (!body.title || !body.description || !body.contentUrl) {
      return NextResponse.json({ message: 'Missing required ad fields (title, description, contentUrl)' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(); // Use your default DB or specify one: client.db("yourDbName")
    const adsCollection = db.collection<Omit<AdDocument, '_id'>>('ads');

    const newAdData = {
      ...body,
      submitterId: session.user.id,
      submitterEmail: session.user.email || '', // Ensure email is available
      status: 'pending' as 'pending',
      submittedAt: new Date(),
      assignedReviewerIds: [], // Initialize as empty array
    };

    const result = await adsCollection.insertOne(newAdData);

    if (!result.insertedId) {
      return NextResponse.json({ message: 'Failed to submit ad' }, { status: 500 });
    }

    const createdAdId = result.insertedId.toString();

    // --- Send Notification to Submitter ---
    if (session.user.email) {
      await sendNotificationToUser(session.user.email, {
        title: 'Ad Submitted Successfully!',
        message: `Your ad "${body.title}" has been submitted and is pending review. Ad ID: ${createdAdId}`,
        level: 'success', // For styling in NotificationPanel
        // deepLink: `/submitter/ads/${createdAdId}` // Optional: link to view the ad
      });
    }

    // --- Send Notification to Reviewers ---
    // This part needs a strategy:
    // 1. Get all reviewer emails from DB.
    // 2. Send individual notifications to each.
    // OR 3. Broadcast to a 'reviewers' group if your WebSocket server supports groups (current one doesn't directly).
    // For now, let's assume we'd fetch reviewer emails and loop.
    // Example (conceptual, needs implementation of getReviewerEmails):
    // const reviewerEmails = await getReviewerEmailsFromDB();
    // for (const email of reviewerEmails) {
    //   await sendNotificationToUser(email, {
    //     title: 'New Ad for Review',
    //     message: `A new ad "${body.title}" (ID: ${createdAdId}) by ${session.user.email} is awaiting your review.`,
    //     level: 'info',
    //     // deepLink: `/reviewer/pending/${createdAdId}` // Optional: link to review the ad
    //   });
    // }
    // As a simpler placeholder for now, we could broadcast if that's acceptable,
    // or just log that reviewers should be notified.
    // console.log(`Ad ${createdAdId} submitted. Reviewers should be notified.`); // Replaced by direct trigger
    await triggerReviewerDashboardUpdate();


    return NextResponse.json({ message: 'Ad submitted successfully, reviewer dashboards refreshing.', adId: createdAdId, ad: newAdData }, { status: 201 });

  } catch (error) {
    console.error('Error submitting ad:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json({ message: 'Failed to submit ad', error: errorMessage }, { status: 500 });
  }
}

// Placeholder for GET /api/submitter/ads (to list ads for the submitter)
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.id || session.user.role !== 'submitter') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  // TODO: Implement logic to fetch and return ads submitted by this user
  return NextResponse.json({ message: 'GET /api/submitter/ads not yet implemented.' });
}
