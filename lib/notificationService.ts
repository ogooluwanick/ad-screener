import clientPromise from "@/lib/mongodb";
import { ObjectId } from 'mongodb';

// Define structure for inserting a new notification
// Matches NotificationInsertData from app/api/notifications/create/route.ts
export interface NotificationInsertData {
  userId: string;
  title: string;
  message: string;
  level: 'info' | 'success' | 'warning' | 'error';
  deepLink?: string;
  createdAt: Date;
  isRead: boolean;
  type?: string;
}

// Define structure for the created notification, similar to ClientNotification
export interface CreatedNotification {
  _id: string; // ObjectId as string
  userId: string;
  title: string;
  message: string;
  level: 'info' | 'success' | 'warning' | 'error';
  deepLink?: string;
  createdAt: string; // Date as ISO string
  isRead: boolean;
  type?: string;
}

interface CreateNotificationParams {
  userId: string;
  title: string;
  message: string;
  level: 'info' | 'success' | 'warning' | 'error';
  deepLink?: string;
  type?: string;
}

export const createInAppNotification = async ({
  userId,
  title,
  message,
  level,
  deepLink,
  type,
}: CreateNotificationParams): Promise<CreatedNotification | null> => {
  // Basic validation (already in API route, but good to have here too)
  if (!userId || !title || !message || !level) {
    console.error('[NotificationService] Missing required fields for notification.');
    return null;
  }
  if (!['info', 'success', 'warning', 'error'].includes(level)) {
    console.error('[NotificationService] Invalid level value for notification.');
    return null;
  }

  try {
    const mongoClient = await clientPromise();
    const db = mongoClient.db();
    const notificationsCollection = db.collection('notifications');

    const notificationToInsert: NotificationInsertData = {
      userId, // Should be a string representation of ObjectId if coming from user session
      title,
      message,
      level,
      deepLink: deepLink || undefined,
      createdAt: new Date(),
      isRead: false,
      type: type || 'general',
    };

    const insertResult = await notificationsCollection.insertOne(notificationToInsert);
    
    if (!insertResult.insertedId) {
        console.error('[NotificationService] Failed to insert notification, no insertedId returned.');
        return null;
    }

    const createdNotification: CreatedNotification = {
      _id: insertResult.insertedId.toString(),
      userId: notificationToInsert.userId,
      title: notificationToInsert.title,
      message: notificationToInsert.message,
      level: notificationToInsert.level,
      deepLink: notificationToInsert.deepLink,
      createdAt: notificationToInsert.createdAt.toISOString(), // Convert date to ISO string
      isRead: notificationToInsert.isRead,
      type: notificationToInsert.type,
    };
    
    console.log(`[NotificationService] Notification for ${userId} stored in DB with ID: ${insertResult.insertedId.toString()}.`);
    return createdNotification;

  } catch (error) {
    console.error('[NotificationService] Error creating notification:', error);
    return null;
  }
};
