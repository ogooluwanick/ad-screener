import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

interface SubmitterSettings {
  notifications?: {
    emailNotifications?: boolean;
    pushNotifications?: boolean;
    submissionStatus?: boolean;
    feedbackReceived?: boolean;
    systemUpdates?: boolean;
    promotionalEmails?: boolean;
  };
  preferences?: {
    defaultCampaignDuration?: number; // in days
    autoSaveDrafts?: boolean;
    preferredAdFormats?: string[];
  };
  privacy?: {
    profileVisibility?: string;
    showEmail?: boolean;
    showPhone?: boolean;
    dataCollection?: boolean;
  };
  // Security settings will be handled in a separate endpoint for password changes
  // Data export will also be handled separately
}

// GET handler to fetch submitter settings
export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "submitter") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    const client = await clientPromise;
    const db = client.db();
    const userId = new ObjectId(session.user.id);

    const user = await db.collection("users").findOne(
      { _id: userId },
      { projection: { submitterSettings: 1 } }
    );

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const defaultSettings: SubmitterSettings = {
      notifications: {
        emailNotifications: true,
        pushNotifications: true,
        submissionStatus: true,
        feedbackReceived: true,
        systemUpdates: true,
        promotionalEmails: false,
      },
      preferences: {
        defaultCampaignDuration: 30,
        autoSaveDrafts: true,
        preferredAdFormats: ["banner", "video"],
      },
      privacy: {
        profileVisibility: "public",
        showEmail: false,
        showPhone: false,
        dataCollection: true,
      }
    };

    // Merge fetched settings with defaults to ensure all fields are present
    const fetchedSettings = user.submitterSettings || {};
    const settings = {
        notifications: { ...defaultSettings.notifications, ...fetchedSettings.notifications },
        preferences: { ...defaultSettings.preferences, ...fetchedSettings.preferences },
        privacy: { ...defaultSettings.privacy, ...fetchedSettings.privacy },
    };

    return NextResponse.json(settings, { status: 200 });
  } catch (error) {
    console.error("Error fetching submitter settings:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

// PUT handler to update submitter settings
export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "submitter") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    const client = await clientPromise;
    const db = client.db();
    const userId = new ObjectId(session.user.id);
    const body: SubmitterSettings = await request.json();

    // Validate incoming data (basic validation)
    // We expect notifications and privacy from the current frontend page. Preferences might be optional or for future use.
    if (!body.notifications || !body.privacy) {
      return NextResponse.json({ message: "Invalid settings format: notifications and privacy are required." }, { status: 400 });
    }
    if (body.preferences && body.preferences.defaultCampaignDuration && typeof body.preferences.defaultCampaignDuration !== 'number') {
        return NextResponse.json({ message: "defaultCampaignDuration must be a number" }, { status: 400 });
    }
    if (body.preferences && body.preferences.preferredAdFormats && !Array.isArray(body.preferences.preferredAdFormats)) {
        return NextResponse.json({ message: "preferredAdFormats must be an array" }, { status: 400 });
    }
    
    // Construct the update object carefully to only include provided sections
    const settingsToUpdate: Partial<SubmitterSettings> = {};
    if (body.notifications) {
        settingsToUpdate.notifications = body.notifications;
    }
    if (body.privacy) {
        settingsToUpdate.privacy = body.privacy;
    }
    if (body.preferences) { // If preferences are sent, include them
        settingsToUpdate.preferences = body.preferences;
    }

    if (Object.keys(settingsToUpdate).length === 0) {
        return NextResponse.json({ message: "No settings data provided to update." }, { status: 400 });
    }

    const updateResult = await db.collection("users").updateOne(
      { _id: userId },
      { $set: { submitterSettings: settingsToUpdate } } // Update with the structured object
    );

    if (updateResult.matchedCount === 0) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Settings updated successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error updating submitter settings:", error);
     if (error instanceof SyntaxError) { // Handle JSON parsing errors
        return NextResponse.json({ message: "Invalid JSON payload" }, { status: 400 });
    }
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
