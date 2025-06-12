import { NextResponse } from 'next/server';
import { sendNotificationToUser, broadcastNotification } from '@/lib/notification-client';

// Ensure this route is only accessible by authorized users or services
// Add authentication and authorization checks as needed

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, userId, message } = body;

    if (!type || !message) {
      return NextResponse.json({ error: 'Missing type or message in request body' }, { status: 400 });
    }

    let success = false;

    if (type === 'user') {
      if (!userId) {
        return NextResponse.json({ error: 'Missing userId for user-specific notification' }, { status: 400 });
      }
      success = await sendNotificationToUser(userId, message);
    } else if (type === 'broadcast') {
      success = await broadcastNotification(message);
    } else {
      return NextResponse.json({ error: 'Invalid notification type specified' }, { status: 400 });
    }

    if (success) {
      return NextResponse.json({ message: `Notification ${type} processed.` }, { status: 200 });
    } else {
      return NextResponse.json({ error: `Failed to send ${type} notification.` }, { status: 500 });
    }

  } catch (error) {
    console.error('Error processing notification request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Example GET handler for testing (optional, remove in production)
export async function GET() {
  // You could use this to test broadcasting or sending to a test user
  // For example: await broadcastNotification({ info: "Test broadcast from GET handler" });
  return NextResponse.json({ message: 'Notification API is active. Use POST to send notifications.' });
}
