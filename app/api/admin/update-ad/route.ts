import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from 'mongodb';

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

  if (!session || !session.user || !session.user.id || (session.user.role !== 'admin' && session.user.role !== 'superadmin')) {
    return NextResponse.json({ message: 'Unauthorized or invalid role' }, { status: 401 });
  }

  try {
    const { adId, title, description, status, rejectionReason, reviewerId } = await request.json();

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
    if (reviewerId !== undefined) updateFields.reviewerId = reviewerId || null;
    if (rejectionReason !== undefined) updateFields.rejectionReason = rejectionReason || null;
    
    // Set reviewedAt timestamp if status is being changed to approved or rejected
    if (status === 'approved' || status === 'rejected') {
      updateFields.reviewedAt = new Date();
    }

    const result = await adsCollection.updateOne(
      { _id: new ObjectId(adId) },
      { $set: updateFields }
    );

    if (result.modifiedCount !== 1) {
      return NextResponse.json({ message: 'Failed to update ad' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Ad updated successfully' }, { status: 200 });

  } catch (error) {
    console.error('Error updating ad:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json({ message: 'Failed to update ad', error: errorMessage }, { status: 500 });
  }
} 