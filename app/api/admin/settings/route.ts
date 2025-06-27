import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

interface AdminSettings {
  notifications?: {
    emailNotifications?: boolean;
    pushNotifications?: boolean;
    systemUpdates?: boolean;
    // Admin specific notifications
    newAdminRegistrations?: boolean;
    reviewerActivityReports?: boolean;
    submitterActivityReports?: boolean;
  };
  adminPreferences?: {
    dashboardLayout?: string;
    defaultUserView?: string;
    auditLogRetentionDays?: number;
  };
  security?: {
    sessionTimeout?: string; // in hours
  };
}

// GET handler to fetch admin settings
export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "admin") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    const client = await clientPromise();
    const db = client.db();
    const userId = new ObjectId(session.user.id);

    const user = await db.collection("users").findOne(
      { _id: userId },
      { projection: { "adminSettings.notifications": 1, "adminSettings.adminPreferences": 1, "adminSettings.security": 1 } }
    );

    if (!user) {
      // If user not found, return 404. Frontend will handle default state.
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const defaultSettings: AdminSettings = {
      notifications: {
        emailNotifications: true,
        pushNotifications: true,
        systemUpdates: true,
        newAdminRegistrations: true,
        reviewerActivityReports: true,
        submitterActivityReports: true,
      },
      adminPreferences: {
        dashboardLayout: "default",
        defaultUserView: "all",
        auditLogRetentionDays: 90,
      },
      security: {
        sessionTimeout: "4", // Default to 4 hours
      },
    };

    // Merge fetched settings with defaults to ensure all fields are present
    const fetchedSettings = user.adminSettings || {};
    const settings: AdminSettings = {
      notifications: { ...defaultSettings.notifications, ...fetchedSettings.notifications },
      adminPreferences: { ...defaultSettings.adminPreferences, ...fetchedSettings.adminPreferences },
      security: { ...defaultSettings.security, ...fetchedSettings.security },
    };
    
    return NextResponse.json(settings, { status: 200 });
  } catch (error) {
    console.error("Error fetching admin settings:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

// PUT handler to update admin settings
export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "admin") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    const client = await clientPromise();
    const db = client.db();
    const userId = new ObjectId(session.user.id);
    const body: AdminSettings = await request.json();

    // Basic validation for required top-level keys
    if (!body.notifications || !body.adminPreferences || !body.security) {
      return NextResponse.json({ message: "Invalid settings format: notifications, adminPreferences, and security are required." }, { status: 400 });
    }

    // Validate sessionTimeout if present
    if (body.security.sessionTimeout && typeof body.security.sessionTimeout !== 'string') {
        return NextResponse.json({ message: "sessionTimeout must be a string" }, { status: 400 });
    }
    // Validate auditLogRetentionDays if present
    if (body.adminPreferences?.auditLogRetentionDays && typeof body.adminPreferences.auditLogRetentionDays !== 'number') {
        return NextResponse.json({ message: "auditLogRetentionDays must be a number" }, { status: 400 });
    }

    // Construct the update object carefully to only include provided sections
    const settingsToUpdate: { $set: { [key: string]: any } } = { $set: {} };

    if (body.notifications) {
        settingsToUpdate.$set["adminSettings.notifications"] = body.notifications;
    }
    if (body.adminPreferences) {
        settingsToUpdate.$set["adminSettings.adminPreferences"] = body.adminPreferences;
    }
    if (body.security) {
        settingsToUpdate.$set["adminSettings.security"] = body.security;
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
    console.error("Error updating admin settings:", error);
    if (error instanceof SyntaxError) { // Handle JSON parsing errors
        return NextResponse.json({ message: "Invalid JSON payload" }, { status: 400 });
    }
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
