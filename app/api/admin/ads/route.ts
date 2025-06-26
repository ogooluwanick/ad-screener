import { NextResponse } from 'next/server';
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
  mediaType?: string;
  vettingSpeed?: string;
  totalFeeNgn?: number;
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id || (session.user.role !== 'admin' && session.user.role !== 'superadmin')) {
    return NextResponse.json({ message: 'Unauthorized or invalid role' }, { status: 401 });
  }

  try {
    const client = await clientPromise();
    const db = client.db();
    const adsCollection = db.collection<AdDocument>('ads');

    // Fetch all ads sorted by submission date (newest first)
    const adsCursor = adsCollection
      .find({})
      .sort({ submittedAt: -1 });

    const adsDocuments = await adsCursor.toArray();

    const ads = adsDocuments.map(ad => ({
      _id: ad._id.toHexString(),
      title: ad.title,
      description: ad.description,
      contentUrl: ad.contentUrl,
      submitterId: ad.submitterId,
      submitterEmail: ad.submitterEmail,
      status: ad.status,
      submittedAt: ad.submittedAt instanceof Date ? ad.submittedAt.toISOString() : new Date(ad.submittedAt).toISOString(),
      reviewedAt: ad.reviewedAt?.toISOString(),
      reviewerId: ad.reviewerId,
      rejectionReason: ad.rejectionReason,
      assignedReviewerIds: ad.assignedReviewerIds,
      adFileType: ad.adFileType,
      adFileUrl: ad.adFileUrl,
      supportingDocuments: ad.supportingDocuments,
      compliance: ad.compliance,
      mediaType: ad.mediaType,
      vettingSpeed: ad.vettingSpeed,
      totalFeeNgn: ad.totalFeeNgn,
    }));

    return NextResponse.json(ads, { status: 200 });

  } catch (error) {
    console.error('Error fetching admin ads:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json({ message: 'Failed to fetch ads', error: errorMessage }, { status: 500 });
  }
}
