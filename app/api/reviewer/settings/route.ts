import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

interface ReviewerSettings {
  notifications?: {
    emailNotifications?: boolean;
    pushNotifications?: boolean;
    newSubmissions?: boolean;
    urgentReviews?: boolean;
    systemUpdates?: boolean;
    weeklyReports?: boolean;
    teamUpdates?: boolean;
  };
  reviewPreferences?: {
    autoAssignment?: boolean;
    maxDailyReviews?: number[]; // Assuming it's an array with one number
    preferredCategories?: string[];
    reviewReminders?: boolean;
    bulkActions?: boolean;
    advancedFilters?: boolean;
  };
  // Security settings will be handled in a separate endpoint for password changes
  // Data export will also be handled separately
}

// GET handler to fetch reviewer settings
export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "reviewer") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    const client = await clientPromise;
    const db = client.db();
    const userId = new ObjectId(session.user.id);

    const user = await db.collection("users").findOne(
      { _id: userId },
      { projection: { reviewerSettings: 1 } }
    );

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const defaultSettings: ReviewerSettings = {
      notifications: {
        emailNotifications: true,
        pushNotifications: true,
        newSubmissions: true,
        urgentReviews: true,
        systemUpdates: true,
        weeklyReports: true,
        teamUpdates: false,
      },
      reviewPreferences: {
        autoAssignment: true,
        maxDailyReviews: [25],
        preferredCategories: ["all"],
        reviewReminders: true,
        bulkActions: true,
        advancedFilters: true,
      },
    };

    const settings = user.reviewerSettings || defaultSettings;

    return NextResponse.json(settings, { status: 200 });
  } catch (error) {
    console.error("Error fetching reviewer settings:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

// PUT handler to update reviewer settings
export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "reviewer") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    const client = await clientPromise;
    const db = client.db();
    const userId = new ObjectId(session.user.id);
    const body: ReviewerSettings = await request.json();

    // Validate incoming data (basic validation)
    if (!body.notifications || !body.reviewPreferences) {
      return NextResponse.json({ message: "Invalid settings format" }, { status: 400 });
    }
    
    // Ensure maxDailyReviews is an array of numbers if present
    if (body.reviewPreferences.maxDailyReviews && !Array.isArray(body.reviewPreferences.maxDailyReviews)) {
        return NextResponse.json({ message: "maxDailyReviews must be an array" }, { status: 400 });
    }
    if (body.reviewPreferences.maxDailyReviews && body.reviewPreferences.maxDailyReviews.some(isNaN)) {
        return NextResponse.json({ message: "maxDailyReviews must contain numbers" }, { status: 400 });
    }


    const updateResult = await db.collection("users").updateOne(
      { _id: userId },
      { $set: { reviewerSettings: body } }
    );

    if (updateResult.matchedCount === 0) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Settings updated successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error updating reviewer settings:", error);
    if (error instanceof SyntaxError) { // Handle JSON parsing errors
        return NextResponse.json({ message: "Invalid JSON payload" }, { status: 400 });
    }
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
