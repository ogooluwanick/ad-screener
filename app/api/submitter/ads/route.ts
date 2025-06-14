import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";
import { sendNotificationToUser, triggerReviewerDashboardUpdate } from '@/lib/notification-client';
import fs from 'fs/promises';
import path from 'path';
import { ObjectId } from 'mongodb'; // Import ObjectId

// AdDocument defines the structure in the database
interface AdDocument {
  _id: ObjectId; // Use ObjectId type for MongoDB
  submitterId: string;
  submitterEmail: string;
  title: string;
  description: string;
  contentUrl: string; // URL the ad links to
  imageUrl?: string; // Path to the uploaded ad creative image
  paymentReference: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: Date;
  reviewedAt?: Date;
  reviewerId?: string;
  rejectionReason?: string;
  assignedReviewerIds: string[];
}

// Type for the data to be inserted (excluding _id as it's auto-generated)
type AdInsertData = Omit<AdDocument, '_id'>;


export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id || session.user.role !== 'submitter') {
    return NextResponse.json({ message: 'Unauthorized or invalid role' }, { status: 401 });
  }

  try {
    const formData = await request.formData();

    const title = formData.get('title') as string | null;
    const description = formData.get('description') as string | null;
    const contentUrl = formData.get('contentUrl') as string | null;
    const paymentReference = formData.get('paymentReference') as string | null;
    const imageFile = formData.get('image') as File | null;
    // const clientSubmitterId = formData.get('submitterId') as string | null; // Not used for security, session.user.id is authoritative

    if (!title || !description || !contentUrl || !paymentReference || !imageFile) {
      return NextResponse.json({ message: 'Missing required fields: title, description, contentUrl, paymentReference, or image.' }, { status: 400 });
    }

    // Validate image type and size
    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!validTypes.includes(imageFile.type)) {
        return NextResponse.json({ message: "Invalid image file type. Please upload JPEG, PNG, GIF, or WebP." }, { status: 400 });
    }
    if (imageFile.size > 5 * 1024 * 1024) { // 5MB
        return NextResponse.json({ message: "Image file size exceeds 5MB." }, { status: 400 });
    }

    // File handling
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'ads');
    await fs.mkdir(uploadDir, { recursive: true });

    const sanitizedFilename = imageFile.name.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/\s+/g, '-');
    const uniqueFilename = `${Date.now()}-${sanitizedFilename}`;
    const imageDiskPath = path.join(uploadDir, uniqueFilename);
    const publicImageUrl = `/uploads/ads/${uniqueFilename}`;

    const imageBuffer = Buffer.from(await imageFile.arrayBuffer());
    await fs.writeFile(imageDiskPath, imageBuffer);

    const client = await clientPromise;
    const db = client.db();
    const adsCollection = db.collection<AdInsertData>('ads'); // Use AdInsertData for insertion

    const newAdData: AdInsertData = {
      title,
      description,
      contentUrl,
      imageUrl: publicImageUrl,
      paymentReference,
      submitterId: session.user.id, // Authoritative ID from session
      submitterEmail: session.user.email || '',
      status: 'pending' as 'pending',
      submittedAt: new Date(),
      assignedReviewerIds: [],
      // reviewedAt, reviewerId, rejectionReason will be undefined initially
    };

    const result = await adsCollection.insertOne(newAdData);

    if (!result.insertedId) {
      try { await fs.unlink(imageDiskPath); } catch (cleanupError) { console.error("Failed to cleanup uploaded file:", cleanupError); }
      return NextResponse.json({ message: 'Failed to submit ad to database' }, { status: 500 });
    }

    const createdAdId = result.insertedId.toString();

    if (session.user.email) {
      await sendNotificationToUser(session.user.email, {
        title: 'Ad Submitted Successfully!',
        message: `Your ad "${title}" has been submitted and is pending review. Ad ID: ${createdAdId}`,
        level: 'success',
      });
    }

    await triggerReviewerDashboardUpdate();

    return NextResponse.json({ 
      message: 'Ad submitted successfully, image uploaded, and reviewer dashboards refreshing.', 
      adId: createdAdId, 
      ad: { ...newAdData, _id: result.insertedId } // Return the created ad data with its new _id
    }, { status: 201 });

  } catch (error) {
    console.error('Error submitting ad:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json({ message: 'Failed to submit ad', error: errorMessage }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.id || session.user.role !== 'submitter') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  
  const client = await clientPromise;
  const db = client.db();
  const adsCollection = db.collection<AdDocument>('ads'); // Use AdDocument for fetching

  try {
    const userAds = await adsCollection.find({ submitterId: session.user.id }).sort({ submittedAt: -1 }).toArray();
    return NextResponse.json(userAds, { status: 200 });
  } catch (error) {
    console.error('Error fetching submitter ads:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json({ message: 'Failed to fetch ads', error: errorMessage }, { status: 500 });
  }
}
