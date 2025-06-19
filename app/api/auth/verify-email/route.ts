import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { MongoClient } from "mongodb";
import { sendNotificationToUser } from "@/lib/notification-client";

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
    await sendNotificationToUser(user._id.toString(), {
      title: "Email Verified",
      message: "Your email has been verified successfully! You can now log in.",
      level: "success",
    });

    // Redirect to set password page if emailVerified was null
    if (user.emailVerified === null) {
      const setPasswordUrl = new URL("/auth/set-password", req.nextUrl.origin);
      setPasswordUrl.searchParams.set("token", token);
      return NextResponse.redirect(setPasswordUrl);
    }

    // Redirect to a status page indicating success
    const statusUrl = new URL("/auth/verify-email-status", req.nextUrl.origin);
    statusUrl.searchParams.set("status", "success");
    statusUrl.searchParams.set("message", "Email verified successfully! You can now log in.");
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
