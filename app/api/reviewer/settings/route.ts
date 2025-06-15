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
  security?: {
    sessionTimeout?: string; // in hours
  };
  // Password changes and data export are handled in separate endpoints
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
    const client = await clientPromise(); // Call the function
    const db = client.db();
    const userId = new ObjectId(session.user.id);

    const user = await db.collection("users").findOne(
      { _id: userId },
      { projection: { "reviewerSettings.notifications": 1, "reviewerSettings.reviewPreferences": 1, "reviewerSettings.security": 1 } }
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
      security: {
        sessionTimeout: "4", // Default to 4 hours
      },
    };

    // Merge fetched settings with defaults to ensure all fields are present
    const fetchedSettings = user.reviewerSettings || {};
    const settings: ReviewerSettings = {
      notifications: { ...defaultSettings.notifications, ...fetchedSettings.notifications },
      reviewPreferences: { ...defaultSettings.reviewPreferences, ...fetchedSettings.reviewPreferences },
      security: { ...defaultSettings.security, ...fetchedSettings.security },
    };
    
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
    const client = await clientPromise(); // Call the function
    const db = client.db();
    const userId = new ObjectId(session.user.id);
    const body: ReviewerSettings = await request.json();

    // Validate incoming data (basic validation)
    if (!body.notifications || !body.reviewPreferences || !body.security) {
      return NextResponse.json({ message: "Invalid settings format: notifications, reviewPreferences, and security are required." }, { status: 400 });
    }
    
    // Ensure maxDailyReviews is an array of numbers if present
    if (body.reviewPreferences.maxDailyReviews && 
        (!Array.isArray(body.reviewPreferences.maxDailyReviews) || body.reviewPreferences.maxDailyReviews.some(isNaN))) {
        return NextResponse.json({ message: "maxDailyReviews must be an array of numbers" }, { status: 400 });
    }

    // Validate sessionTimeout if present
    if (body.security.sessionTimeout && typeof body.security.sessionTimeout !== 'string') {
        return NextResponse.json({ message: "sessionTimeout must be a string" }, { status: 400 });
    }

    // Construct the update object carefully to only include provided sections
    const settingsToUpdate: { $set: { [key: string]: any } } = { $set: {} };

    if (body.notifications) {
        settingsToUpdate.$set["reviewerSettings.notifications"] = body.notifications;
    }
    if (body.reviewPreferences) {
        settingsToUpdate.$set["reviewerSettings.reviewPreferences"] = body.reviewPreferences;
    }
    if (body.security) {
        settingsToUpdate.$set["reviewerSettings.security"] = body.security;
    }
    
    if (Object.keys(settingsToUpdate.$set).length === 0) {
        return NextResponse.json({ message: "No settings data provided to update." }, { status: 400 });
    }

    const updateResult = await db.collection("users").updateOne(
      { _id: userId },
      settingsToUpdate 
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
