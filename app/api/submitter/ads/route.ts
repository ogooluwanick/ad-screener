import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";
import { sendNotificationToUser } from '@/lib/notification-client';
import { sendEmail } from '@/lib/email';
import { ObjectId } from 'mongodb'; // Import ObjectId
import { uploadToCloudinary } from '@/lib/cloudinary_utils'; // Added for Cloudinary upload

// AdDocument defines the structure in the database
interface AdDocument {
  _id: ObjectId; 
  submitterId: string;
  submitterEmail: string;
  title: string;
  description: string;
  // contentUrl: string; // REMOVED
  adFileUrl?: string; // URL of the uploaded Ad file from Cloudinary
  adFilePublicId?: string; // Public ID of the Ad file in Cloudinary
  supportingDocuments?: Array<{ url: string; publicId: string; name: string }>; // Array of supporting documents
  paymentReference: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: Date;
  reviewedAt?: Date;
  reviewerId?: string;
  rejectionReason?: string;
  assignedReviewerIds: string[];
  // category?: string; // REMOVED
  compliance?: ComplianceData; // Added for compliance checklist
  mediaType?: string; // Added for dynamic pricing
  vettingSpeed?: string; // Added for dynamic pricing
  totalFeeNgn?: number; // Added for dynamic pricing
}

// Structure for the compliance checklist data
interface ComplianceData {
  rulesCompliance: "Yes" | "No" | "N/A";
  falseClaimsFree: "Yes" | "No" | "N/A";
  claimsSubstantiated: "Yes" | "No" | "N/A";
  offensiveContentFree: "Yes" | "No" | "N/A";
  targetAudienceAppropriate: "Yes" | "No" | "N/A";
  comparativeAdvertisingFair: "Yes" | "No" | "N/A";
  disclaimersDisplayed: "Yes" | "No" | "N/A";
  unapprovedEndorsementsAbsent: "Yes" | "No" | "N/A";
  statutoryApprovalsAttached: "Yes" | "No" | "N/A";
  sanctionHistoryReviewed: "Yes" | "No" | "N/A";
  culturalReferencesAppropriate: "Yes" | "No" | "N/A";
  childrenProtected: "Yes" | "No" | "N/A";
  overallComplianceNotes?: string;
  filledAt: Date;
  reviewerId: string;
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
    // const contentUrl = formData.get('contentUrl') as string | null; // REMOVED
    const paymentReference = formData.get('paymentReference') as string | null;
    const adFile = formData.get('adFile') as File | null; // RENAMED from imageFile
    const supportingDocumentFiles = formData.getAll('supportingDocuments') as File[]; // For multiple supporting documents
    const amountInKoboString = formData.get('amountInKobo') as string | null;
    // const category = formData.get('category') as string | null; // REMOVED

    // New fields for dynamic pricing
    const mediaType = formData.get('mediaType') as string | null;
    const vettingSpeed = formData.get('vettingSpeed') as string | null;
    const totalFeeNgnString = formData.get('totalFeeNgn') as string | null;


    console.log('[API /submitter/ads] Raw form data values:');
    console.log('  Title:', title);
    console.log('  Description:', description ? description.substring(0, 50) + '...' : 'N/A');
    // console.log('  Content URL:', contentUrl); // REMOVED
    console.log('  Payment Reference:', paymentReference);
    console.log('  Ad File Name:', adFile?.name);
    console.log('  Ad File Type:', adFile?.type);
    console.log('  Ad File Size:', adFile?.size);
    supportingDocumentFiles.forEach((file, index) => {
      console.log(`  Supporting Document ${index + 1} Name:`, file.name);
      console.log(`  Supporting Document ${index + 1} Type:`, file.type);
      console.log(`  Supporting Document ${index + 1} Size:`, file.size);
    });
    console.log('  Amount in Kobo String:', amountInKoboString);
    // console.log('  Category:', category); // REMOVED
    console.log('  Media Type:', mediaType);
    console.log('  Vetting Speed:', vettingSpeed);
    console.log('  Total Fee NGN String:', totalFeeNgnString);


    if (!title || !description || !paymentReference || !adFile || !amountInKoboString || !mediaType || !vettingSpeed || !totalFeeNgnString) {
      console.error('[API /submitter/ads] Missing required fields. Title:', !!title, 'Desc:', !!description, 'Ref:', !!paymentReference, 'AdFile:', !!adFile, 'AmountStr:', !!amountInKoboString, 'MediaType:', !!mediaType, 'VettingSpeed:', !!vettingSpeed, 'TotalFeeNgnStr:', !!totalFeeNgnString);
      return NextResponse.json({ message: 'Missing required fields: title, description, paymentReference, adFile, amountInKobo, mediaType, vettingSpeed, or totalFeeNgn.' }, { status: 400 });
    }

    const amountInKobo = parseInt(amountInKoboString, 10);
    const totalFeeNgn = parseFloat(totalFeeNgnString);
    if (isNaN(amountInKobo) || amountInKobo <= 0) {
      console.error('[API /submitter/ads] Invalid amountInKobo:', amountInKoboString);
      return NextResponse.json({ message: 'Invalid amountInKobo provided.' }, { status: 400 });
    }
    if (isNaN(totalFeeNgn) || totalFeeNgn < 0) { // Fee can be 0 if it's free, but not negative
      console.error('[API /submitter/ads] Invalid totalFeeNgn:', totalFeeNgnString);
      return NextResponse.json({ message: 'Invalid totalFeeNgn provided.' }, { status: 400 });
    }
    console.log('[API /submitter/ads] Parsed amountInKobo:', amountInKobo);
    console.log('[API /submitter/ads] Parsed totalFeeNgn:', totalFeeNgn);

    // --- Ad File handling with Cloudinary ---
    let adFileUploadResult;
    try {
      const adFileBuffer = Buffer.from(await adFile.arrayBuffer());
      const originalFileName = adFile.name.substring(0, adFile.name.lastIndexOf('.')) || adFile.name;
          const sanitizedFileName = originalFileName.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/\s+/g, '-');
          const uniqueFileNameForCloudinary = `${Date.now()}-${sanitizedFileName}`;
          // For the main Ad file, 'auto' is usually fine, or determine based on adFile.type if more specific control is needed.
          console.log(`[API /submitter/ads] Uploading Ad file ${adFile.name} to Cloudinary as ${uniqueFileNameForCloudinary} with resource_type: 'auto'`);
          adFileUploadResult = await uploadToCloudinary(adFileBuffer, 'ads_files', uniqueFileNameForCloudinary, 'auto');

          if (!adFileUploadResult || !adFileUploadResult.secure_url || !adFileUploadResult.public_id) {
        console.error('[API /submitter/ads] Cloudinary upload failed or did not return expected result for Ad file.');
        return NextResponse.json({ message: 'Failed to upload Ad file to Cloudinary.' }, { status: 500 });
      }
      console.log('[API /submitter/ads] Ad file uploaded to Cloudinary:', adFileUploadResult.secure_url);
    } catch (uploadError) {
      console.error('[API /submitter/ads] Error during Cloudinary upload process for Ad file:', uploadError);
      return NextResponse.json({ message: 'Error uploading Ad file.', error: uploadError instanceof Error ? uploadError.message : 'Unknown upload error' }, { status: 500 });
    }

    // --- Supporting Documents handling with Cloudinary ---
    const uploadedSupportingDocuments: Array<{ url: string; publicId: string; name: string }> = [];
    if (supportingDocumentFiles && supportingDocumentFiles.length > 0) {
      console.log(`[API /submitter/ads] Processing ${supportingDocumentFiles.length} supporting document(s).`);
      for (const file of supportingDocumentFiles) {
        try {
          const fileBuffer = Buffer.from(await file.arrayBuffer());
          const originalFileName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
          const sanitizedFileName = originalFileName.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/\s+/g, '-');
          const uniqueFileNameForCloudinary = `${Date.now()}-${sanitizedFileName}`;

          let resourceTypeForSupportingDoc: 'raw' | 'auto' = 'auto';
          const fileType = file.type;
          if (fileType === 'application/pdf' || 
              fileType === 'application/msword' || 
              fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
              fileType === 'text/plain'
              // Add other document MIME types as needed
             ) {
            resourceTypeForSupportingDoc = 'raw';
          }

          console.log(`[API /submitter/ads] Uploading supporting document ${file.name} to Cloudinary as ${uniqueFileNameForCloudinary} with resource_type: ${resourceTypeForSupportingDoc}`);
          const uploadResult = await uploadToCloudinary(fileBuffer, 'supporting_documents', uniqueFileNameForCloudinary, resourceTypeForSupportingDoc);

          if (uploadResult && uploadResult.secure_url && uploadResult.public_id) {
            uploadedSupportingDocuments.push({ 
              url: uploadResult.secure_url, 
              publicId: uploadResult.public_id,
              name: file.name // Store original file name for display purposes
            });
            console.log(`[API /submitter/ads] Supporting document ${file.name} uploaded: ${uploadResult.secure_url}`);
          } else {
            console.warn(`[API /submitter/ads] Failed to upload supporting document ${file.name} or missing URL/PublicID.`);
            // Decide if this should be a critical error or if the process can continue without this specific file.
            // For now, it logs a warning and continues.
          }
        } catch (docUploadError) {
          console.error(`[API /submitter/ads] Error uploading supporting document ${file.name}:`, docUploadError);
          // Decide if this should be a critical error. For now, logs and continues.
        }
      }
    } else {
      console.log('[API /submitter/ads] No supporting documents were uploaded.');
    }

    const client = await clientPromise();
    const db = client.db();
    const adsCollection = db.collection<AdInsertData>('ads');
    const paymentsCollection = db.collection<PaymentInsertData>('payments');

    const newAdData: AdInsertData = {
      title,
      description,
      // contentUrl, // REMOVED
      adFileUrl: adFileUploadResult.secure_url, // From Cloudinary
      adFilePublicId: adFileUploadResult.public_id, // From Cloudinary
      supportingDocuments: uploadedSupportingDocuments.length > 0 ? uploadedSupportingDocuments : undefined,
      paymentReference,
      submitterId: session.user.id,
      submitterEmail: session.user.email || '',
      status: 'pending' as 'pending',
      submittedAt: new Date(),
      assignedReviewerIds: [],
      // category: category, // REMOVED
      mediaType: mediaType,
      vettingSpeed: vettingSpeed,
      totalFeeNgn: totalFeeNgn,
    };
    console.log('[API /submitter/ads] Prepared Ad data for insertion:', JSON.stringify(newAdData));

    const result = await adsCollection.insertOne(newAdData);
    console.log('[API /submitter/ads] Ad insertion result:', result);

    if (!result.insertedId) {
      console.error('[API /submitter/ads] Failed to insert Ad into database. Result:', result);
      // TODO: Consider deleting adFile and supportingDocuments from Cloudinary if DB insert fails.
      // This requires a more complex rollback mechanism. For now, log and proceed.
      // if (adFileUploadResult?.public_id) {
      //   await deleteFromCloudinary(adFileUploadResult.public_id); 
      // }
      // for (const doc of uploadedSupportingDocuments) {
      //   await deleteFromCloudinary(doc.publicId);
      // }
      return NextResponse.json({ message: 'Failed to submit Ad to database' }, { status: 500 });
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
        console.error(`[API /submitter/ads] Failed to record payment for Ad ${createdAdObjectId.toString()}, but Ad was created.`);
      } else {
        console.log(`[API /submitter/ads] Payment recorded successfully for Ad ${createdAdObjectId.toString()} with payment ID ${paymentResult.insertedId.toString()}`);
      }
    } catch (paymentError) {
      console.error(`[API /submitter/ads] Error recording payment for Ad ${createdAdObjectId.toString()}:`, paymentError);
      // Optionally, notify admin or add to a retry queue.
      // The Ad is already created, so we don't roll it back here for simplicity.
    }
    
    const createdAdIdString = createdAdObjectId.toString();
    console.log('[API /submitter/ads] Starting notification process for Ad:', createdAdIdString);

    // --- Start Notifications ---
    const submitterUserId = session.user.id;
    const submitterUserEmail = session.user.email;

    // 1. In-App Notification to Submitter
    if (submitterUserId) {
      console.log(`[API /submitter/ads] Attempting to send in-app notification to user ID ${submitterUserId} for Ad ${createdAdIdString}`);
      sendNotificationToUser(submitterUserId, {
        title: 'Ad Submitted Successfully!',
        message: `Your Ad "${title}" has been submitted and is pending review. Ad ID: ${createdAdIdString}`,
        level: 'success',
        deepLink: `/submitter/ads?adId=${createdAdIdString}` // Example deep link
      }).then(() => {
        console.log(`[API /submitter/ads] In-app notification successfully queued for user ID ${submitterUserId} for Ad ${createdAdIdString}`);
      }).catch(err => console.error(`[API /submitter/ads] Failed to send in-app notification to user ID ${submitterUserId} for Ad ${createdAdIdString}:`, err));
    } else {
      console.warn(`[API /submitter/ads] No user ID in session to send in-app notification for Ad ${createdAdIdString}`);
    }

    // 2. Email Notification to Submitter
    if (submitterUserEmail && title) {
      console.log(`[API /submitter/ads] Attempting to send email confirmation to ${submitterUserEmail} for Ad ${createdAdIdString}`);
      sendEmail({
        to: submitterUserEmail,
        subject: `Ad Submission Confirmation: "${title}"`,
        text: `Hi ${session.user.name || 'Submitter'},\n\nYour Ad titled "${title}" (ID: ${createdAdIdString}) has been successfully submitted and is now pending review.\n\nYou can view your Ad status in your dashboard.\n\nThank you for advertising with AdScreener!`,
        htmlContent: `
          <p>Hi ${session.user.name || 'Submitter'},</p>
          <p>Your Ad titled "<strong>${title}</strong>" (ID: ${createdAdIdString}) has been successfully submitted and is now pending review.</p>
          <p>You can view your Ad status in your dashboard.</p>
          <p>Thank you for advertising with AdScreener!</p>
        `
      }).then(() => {
        console.log(`[API /submitter/ads] Email confirmation successfully sent to ${submitterUserEmail} for Ad ${createdAdIdString}`);
      }).catch(err => console.error(`[API /submitter/ads] Failed to send email confirmation to ${submitterUserEmail} for Ad ${createdAdIdString}:`, err));
    } else {
      console.warn(`[API /submitter/ads] No submitter email or title available, cannot send email confirmation for Ad ${createdAdIdString}`);
    }

    // 3. Trigger Reviewer Dashboard Update (This is now handled by client-side polling)
    // console.log(`[API /submitter/ads] Attempting to trigger reviewer dashboard update for Ad ${createdAdIdString}`);
    // triggerReviewerDashboardUpdate()
    //   .then(() => {
    //     console.log(`[API /submitter/ads] Reviewer dashboard update successfully triggered for Ad ${createdAdIdString}`);
    //   })
    //   .catch(err => console.error(`[API /submitter/ads] Failed to trigger reviewer dashboard update for Ad ${createdAdIdString}:`, err));

    console.log('[API /submitter/ads] Successfully processed Ad submission. Returning 201.');
    return NextResponse.json({ 
      message: 'Ad submission processed. Payment recorded, image uploaded. Notifications are being sent.', 
      adId: createdAdIdString, 
      ad: { ...newAdData, _id: createdAdObjectId } // Return the created Ad data with its new _id
    }, { status: 201 });

  } catch (error) {
    console.error('[API /submitter/ads] Critical error in POST handler:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json({ message: 'Failed to submit Ad', error: errorMessage }, { status: 500 });
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
