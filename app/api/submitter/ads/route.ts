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
  _id: ObjectId; 
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
  category?: string; // Added category field
}

// Type for the data to be inserted (excluding _id as it's auto-generated)
type AdInsertData = Omit<AdDocument, '_id'>;

// PaymentDocument defines the structure for payment information in the database
interface PaymentDocument {
  _id: ObjectId;
  adId: ObjectId; // Link to the Ad document
  submitterId: string;
  paymentReference: string;
  amountInKobo: number;
  currency: string; // e.g., "NGN"
  status: 'successful'; // Assuming only successful payments are recorded this way initially
  paidAt: Date;
}

// Type for the payment data to be inserted
type PaymentInsertData = Omit<PaymentDocument, '_id'>;


export async function POST(request: Request) {
  console.log('[API /submitter/ads] POST request received');
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id || session.user.role !== 'submitter') {
    console.log('[API /submitter/ads] Unauthorized access attempt or invalid role.');
    return NextResponse.json({ message: 'Unauthorized or invalid role' }, { status: 401 });
  }
  console.log('[API /submitter/ads] Session validated for user:', session.user.id, 'with role:', session.user.role);

  try {
    const formData = await request.formData();
    console.log('[API /submitter/ads] FormData received');

    const title = formData.get('title') as string | null;
    const description = formData.get('description') as string | null;
    const contentUrl = formData.get('contentUrl') as string | null;
    const paymentReference = formData.get('paymentReference') as string | null;
    const imageFile = formData.get('image') as File | null;
    const amountInKoboString = formData.get('amountInKobo') as string | null; // Added to receive amount charged
    const category = formData.get('category') as string | null; // Added category

    // const clientSubmitterId = formData.get('submitterId') as string | null; // Not used for security, session.user.id is authoritative

    console.log('[API /submitter/ads] Raw form data values:');
    console.log('  Title:', title);
    console.log('  Description:', description ? description.substring(0, 50) + '...' : 'N/A'); // Log snippet
    console.log('  Content URL:', contentUrl);
    console.log('  Payment Reference:', paymentReference);
    console.log('  Image File Name:', imageFile?.name);
    console.log('  Image File Type:', imageFile?.type);
    console.log('  Image File Size:', imageFile?.size);
    console.log('  Amount in Kobo String:', amountInKoboString);
    console.log('  Category:', category);


    if (!title || !description || !contentUrl || !paymentReference || !imageFile || !amountInKoboString || !category) {
      console.error('[API /submitter/ads] Missing required fields. Title:', !!title, 'Desc:', !!description, 'URL:', !!contentUrl, 'Ref:', !!paymentReference, 'Img:', !!imageFile, 'AmountStr:', !!amountInKoboString, 'Category:', !!category);
      return NextResponse.json({ message: 'Missing required fields: title, description, contentUrl, paymentReference, image, amountInKobo, or category.' }, { status: 400 });
    }

    const amountInKobo = parseInt(amountInKoboString, 10);
    if (isNaN(amountInKobo) || amountInKobo <= 0) {
      console.error('[API /submitter/ads] Invalid amountInKobo:', amountInKoboString);
      return NextResponse.json({ message: 'Invalid amountInKobo provided.' }, { status: 400 });
    }
    console.log('[API /submitter/ads] Parsed amountInKobo:', amountInKobo);

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
    console.log('[API /submitter/ads] Image saved to disk:', publicImageUrl);

    const client = await clientPromise(); // Call the function
    const db = client.db();
    const adsCollection = db.collection<AdInsertData>('ads');
    const paymentsCollection = db.collection<PaymentInsertData>('payments');

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
      category: category, // Added category
      // reviewedAt, reviewerId, rejectionReason will be undefined initially
    };
    console.log('[API /submitter/ads] Prepared ad data for insertion:', JSON.stringify(newAdData));

    const result = await adsCollection.insertOne(newAdData);
    console.log('[API /submitter/ads] Ad insertion result:', result);

    if (!result.insertedId) {
      console.error('[API /submitter/ads] Failed to insert ad into database. Result:', result);
      try { await fs.unlink(imageDiskPath); } catch (cleanupError) { console.error("Failed to cleanup uploaded file after ad insertion failure:", cleanupError); }
      return NextResponse.json({ message: 'Failed to submit ad to database' }, { status: 500 });
    }

    const createdAdObjectId = result.insertedId; // This is an ObjectId
    console.log('[API /submitter/ads] Ad successfully inserted with ID:', createdAdObjectId.toString());

    // Now, create and insert the payment record
    const paymentData: PaymentInsertData = {
      adId: createdAdObjectId,
      submitterId: session.user.id,
      paymentReference: paymentReference,
      amountInKobo: amountInKobo,
      currency: 'NGN', // Assuming NGN for now, adjust if currency can vary
      status: 'successful',
      paidAt: new Date(), // Timestamp of payment recording
    };
    console.log('[API /submitter/ads] Prepared payment data for insertion:', JSON.stringify(paymentData));

    try {
      const paymentResult = await paymentsCollection.insertOne(paymentData);
      console.log('[API /submitter/ads] Payment record insertion result:', paymentResult);
      if (!paymentResult.insertedId) {
        console.error(`[API /submitter/ads] Failed to record payment for ad ${createdAdObjectId.toString()}, but ad was created.`);
      } else {
        console.log(`[API /submitter/ads] Payment recorded successfully for ad ${createdAdObjectId.toString()} with payment ID ${paymentResult.insertedId.toString()}`);
      }
    } catch (paymentError) {
      console.error(`[API /submitter/ads] Error recording payment for ad ${createdAdObjectId.toString()}:`, paymentError);
      // Optionally, notify admin or add to a retry queue.
      // The ad is already created, so we don't roll it back here for simplicity.
    }
    
    const createdAdIdString = createdAdObjectId.toString();
    console.log('[API /submitter/ads] Starting notification process for ad:', createdAdIdString);

    // Fire-and-forget notification and dashboard update to prevent hanging the API response
    if (session.user.id) { // Changed from session.user.email to session.user.id
      console.log(`[API /submitter/ads] Attempting to send notification to user ID ${session.user.id} for ad ${createdAdIdString}`);
      sendNotificationToUser(session.user.id, { // Changed from session.user.email to session.user.id
        title: 'Ad Submitted Successfully!',
        message: `Your ad "${title}" has been submitted and is pending review. Ad ID: ${createdAdIdString}`,
        level: 'success',
      }).then(() => {
        console.log(`[API /submitter/ads] Notification successfully queued for user ID ${session.user.id} for ad ${createdAdIdString}`);
      }).catch(err => console.error(`[API /submitter/ads] Failed to send notification to user ID ${session.user.id} for ad ${createdAdIdString}:`, err));
    } else {
      console.warn(`[API /submitter/ads] No user ID in session to send notification for ad ${createdAdIdString}`);
    }

    console.log(`[API /submitter/ads] Attempting to trigger reviewer dashboard update for ad ${createdAdIdString}`);
    triggerReviewerDashboardUpdate()
      .then(() => {
        console.log(`[API /submitter/ads] Reviewer dashboard update successfully triggered for ad ${createdAdIdString}`);
      })
      .catch(err => console.error(`[API /submitter/ads] Failed to trigger reviewer dashboard update for ad ${createdAdIdString}:`, err));

    console.log('[API /submitter/ads] Successfully processed ad submission. Returning 201.');
    return NextResponse.json({ 
      message: 'Ad submission processed. Payment recorded, image uploaded. Notifications are being sent.', 
      adId: createdAdIdString, 
      ad: { ...newAdData, _id: createdAdObjectId } // Return the created ad data with its new _id
    }, { status: 201 });

  } catch (error) {
    console.error('[API /submitter/ads] Critical error in POST handler:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json({ message: 'Failed to submit ad', error: errorMessage }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.id || session.user.role !== 'submitter') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  
  const client = await clientPromise(); // Call the function
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
