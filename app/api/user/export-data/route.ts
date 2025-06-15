import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";
import { ObjectId, WithId, Document } from "mongodb";

// Define a basic Ad interface, adjust according to your actual Ad schema
interface Ad extends WithId<Document> {
  // Common ad properties - adjust as needed
  title: string;
  description: string;
  status: string;
  submitterId?: ObjectId; // Changed from submittedBy
  reviewerId?: ObjectId;  // Changed from reviewedBy (for direct assignment)
  reviews?: { reviewerId: ObjectId; status: string; comment?: string }[]; // For multiple reviews or review history
  // Add other ad-specific fields here
  [key: string]: any; // Allows for other properties not explicitly defined
}

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const client = await clientPromise(); // Call the function
    const db = client.db();
    const sessionUserIdString = session.user.id; // Use string ID from session directly for querying ads
    const userObjectId = new ObjectId(sessionUserIdString); // Use ObjectId for querying users collection

    const user = await db.collection("users").findOne({ _id: userObjectId });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Remove sensitive information like password before sending
    const { password, ...userDataOnly } = user;
    let adsData: Ad[] = [];

    if (user.role === "reviewer") {
      // Assuming ads collection has a field like 'reviewedBy' or similar
      // For example, if reviews are stored in an array within the ad document:
      // adsData = await db.collection("ads").find({ "reviews.reviewerId": userId }).toArray();
      // If neither of these, a more complex query or schema understanding is needed.
      // For now, let's assume a simpler 'reviewedBy' field directly on ads for reviewers.
      // A more robust solution would check for ads where the user participated in a review.
      // This might involve looking for ads where the status is 'approved' or 'rejected' by this reviewer.
      // For simplicity, we'll fetch ads where this user is listed as the reviewer.
      // A more accurate query might be:
      // adsData = await db.collection("ads").find({
      //   reviews: { $elemMatch: { reviewerId: userId } }
      // }).toArray();
      // Fetch ads where this user is listed as the reviewerId (string).
      // The "reviews.reviewerId" part is removed as the current schema in reviewer/ads/[adId]/route.ts
      // updates a top-level reviewerId (string) and doesn't populate a 'reviews' array with ObjectIds.
      adsData = await db.collection("ads").find({ reviewerId: sessionUserIdString }).toArray();

    } else if (user.role === "submitter") {
      // Query using the string submitterId
      adsData = await db.collection("ads").find({ submitterId: sessionUserIdString }).toArray();
    }

    const dataToExport = {
      userData: userDataOnly,
      ads: adsData,
    };

    // For a real application, you might want to:
    // 1. Select specific fields to export.
    // 2. Format the data (e.g., as CSV, JSON file).
    // 3. Implement a more secure delivery method (e.g., email link to download).
    // For now, we return the user data (minus password) and their ads as JSON.

    return NextResponse.json(dataToExport, {
      status: 200,
      headers: {
        'Content-Disposition': `attachment; filename="user_data_${sessionUserIdString}.json"`, // Filename is already .json, using string ID for filename consistency
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error("Error exporting user data:", error);
    return NextResponse.json({ message: "Internal server error during data export" }, { status: 500 });
  }
}
