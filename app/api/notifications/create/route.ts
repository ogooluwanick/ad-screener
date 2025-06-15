import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // Assuming this is your auth options path
import clientPromise from "@/lib/mongodb";
import { ObjectId } from 'mongodb';

// Define structure for inserting a new notification
// This matches the NotificationInsertData type from server.ts (omitting _id as it's auto-generated)
interface NotificationInsertData {
  userId: string;
  title: string;
  message: string;
  level: 'info' | 'success' | 'warning' | 'error';
  deepLink?: string;
  createdAt: Date;
  isRead: boolean;
  type?: string;
}

// POST: Create a new notification
export async function POST(request: Request) {
  // Note: This endpoint might be called by other backend services/API routes.
  // If it's called server-to-server internally, session-based auth might not apply directly.
  // However, if it's intended to be callable by a logged-in user to create a notification *for themselves*
  // or if the creating system needs to be authenticated, session check is good.
  // For now, let's assume it might be called by other authenticated API routes that pass necessary data.

  let notificationData;
  try {
    notificationData = await request.json();
  } catch (error) {
    return NextResponse.json({ message: 'Invalid JSON in request body' }, { status: 400 });
  }

  const { userId, title, message, level, deepLink, type } = notificationData;

  // Basic validation
  if (!userId || !title || !message || !level) {
    return NextResponse.json({ message: 'Missing required fields: userId, title, message, level' }, { status: 400 });
  }

  if (!['info', 'success', 'warning', 'error'].includes(level)) {
    return NextResponse.json({ message: 'Invalid level value' }, { status: 400 });
  }

  try {
    const mongoClient = await clientPromise();
    const db = mongoClient.db();
    const notificationsCollection = db.collection('notifications'); // Using 'notifications' as per your GET route

    const notificationToInsert: NotificationInsertData = {
      userId,
      title,
      message,
      level,
      deepLink: deepLink || undefined,
      createdAt: new Date(),
      isRead: false,
      type: type || 'general',
    };

    const insertResult = await notificationsCollection.insertOne(notificationToInsert);
    
    // Construct the created notification object to return, similar to ClientNotification
    const createdNotification = {
      _id: insertResult.insertedId.toString(),
      ...notificationToInsert,
      createdAt: notificationToInsert.createdAt.toISOString(), // Convert date to ISO string for response
    };

    console.log(`[API Create Notification] Notification for ${userId} stored in DB with ID: ${insertResult.insertedId.toString()}.`);
    return NextResponse.json({ message: 'Notification created successfully', notification: createdNotification }, { status: 201 });

  } catch (error) {
    console.error('[API Create Notification] Error creating notification:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json({ message: 'Failed to create notification', error: errorMessage }, { status: 500 });
  }
}
