import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { MongoClient } from "mongodb";
import { createInAppNotification } from '@/lib/notificationService';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  if (!token) {
    // Redirect to a status page indicating no token was provided
    const statusUrl = new URL("/auth/verify-email-status", req.nextUrl.origin);
    statusUrl.searchParams.set("status", "error");
    statusUrl.searchParams.set("message", "Verification token missing.");
    return NextResponse.redirect(statusUrl);
  }

  try {
    const client: MongoClient = await clientPromise();
    const db = client.db();
    const usersCollection = db.collection("users");

    const user = await usersCollection.findOne({
      verificationToken: token,
      verificationTokenExpires: { $gt: new Date() }, // Check if token is not expired
    });

    if (!user) {
      // Redirect to a status page indicating token is invalid or expired
      const statusUrl = new URL("/auth/verify-email-status", req.nextUrl.origin);
      statusUrl.searchParams.set("status", "error");
      statusUrl.searchParams.set("message", "Invalid or expired verification token.");
      return NextResponse.redirect(statusUrl);
    }

    // Token is valid, update the user
    await usersCollection.updateOne(
      { _id: user._id },
      {
        $set: {
          emailVerified: new Date(),
          verificationToken: null, // Clear the token
          verificationTokenExpires: null, // Clear token expiry
        },
      }
    );

    // Send in-app notification
    await createInAppNotification({
      userId: user._id.toString(),
      title: "Email Verified",
      message: "Your email has been verified successfully! You can now log in.",
      level: "success",
    });

    const statusUrl = new URL("/auth/verify-email-status", req.nextUrl.origin);
    statusUrl.searchParams.set("status", "success");
    statusUrl.searchParams.set("message", "Email verified successfully!");

    // If the user does not have a password set (e.g., account created by admin),
    // they should be directed to set their password after verification.
    if (!user.password) {
      statusUrl.searchParams.set("next_action", "set_password");
      // The token is needed for the set-password page
      if (token) { // Ensure token exists before setting
        statusUrl.searchParams.set("token", token);
      }
    }

    return NextResponse.redirect(statusUrl);

  } catch (error) {
    console.error("Email verification error:", error);
    // Redirect to a status page indicating a server error
    const statusUrl = new URL("/auth/verify-email-status", req.nextUrl.origin);
    statusUrl.searchParams.set("status", "error");
    statusUrl.searchParams.set("message", "An unexpected error occurred during email verification.");
    return NextResponse.redirect(statusUrl);
  }
}
