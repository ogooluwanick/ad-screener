import { NextResponse } from 'next/server';
// getServerSession and authOptions might not be needed if this endpoint is purely for internal service calls
// import { getServerSession } from "next-auth/next";
// import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { createInAppNotification } from '@/lib/notificationService'; // Import the service function

// POST: Create a new notification
export async function POST(request: Request) {
  let notificationData;
  try {
    notificationData = await request.json();
  } catch (error) {
    return NextResponse.json({ message: 'Invalid JSON in request body' }, { status: 400 });
  }

  const { userId, title, message, level, deepLink, type } = notificationData;

  // Basic validation (also present in the service, but good for early exit)
  if (!userId || !title || !message || !level) {
    return NextResponse.json({ message: 'Missing required fields: userId, title, message, level' }, { status: 400 });
  }
  if (!['info', 'success', 'warning', 'error'].includes(level)) {
    return NextResponse.json({ message: 'Invalid level value' }, { status: 400 });
  }

  try {
    const createdNotification = await createInAppNotification({
      userId,
      title,
      message,
      level,
      deepLink,
      type,
    });

    if (!createdNotification) {
      // The service function logs the specific error
      return NextResponse.json({ message: 'Failed to create notification (service error)' }, { status: 500 });
    }
    
    console.log(`[API Create Notification] Forwarded to NotificationService. Result ID: ${createdNotification._id}`);
    return NextResponse.json({ message: 'Notification created successfully', notification: createdNotification }, { status: 201 });

  } catch (error) { // Catch any unexpected errors from the service call itself, though service should handle its own.
    console.error('[API Create Notification] Unexpected error calling notification service:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json({ message: 'Failed to create notification', error: errorMessage }, { status: 500 });
  }
}
