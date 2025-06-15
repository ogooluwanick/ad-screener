import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import bcrypt from "bcryptjs";
import { sendEmail } from "@/lib/email";
import { sendNotificationToUser } from "@/lib/notification-client";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ message: "Current password and new password are required" }, { status: 400 });
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ message: "New password must be at least 8 characters long" }, { status: 400 });
    }

    const client = await clientPromise(); // Call the function
    const db = client.db();
    const userId = new ObjectId(session.user.id);

    const user = await db.collection("users").findOne({ _id: userId });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Check if the user signed up with an OAuth provider (e.g., Google, GitHub)
    // These users might not have a traditional password set.
    if (!user.password) {
        return NextResponse.json({ message: "Password cannot be changed for accounts created with OAuth providers." }, { status: 400 });
    }

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);

    if (!isCurrentPasswordValid) {
      return NextResponse.json({ message: "Invalid current password" }, { status: 400 });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    const updateResult = await db.collection("users").updateOne(
      { _id: userId },
      { $set: { password: hashedNewPassword } }
    );

    if (updateResult.modifiedCount === 0) {
      // This might happen if the new password is the same as the old one,
      // or if there was an issue. For simplicity, we'll treat it as success if matched.
      if (updateResult.matchedCount === 0) {
        return NextResponse.json({ message: "User not found during update" }, { status: 404 });
      }
    }

    // Send notifications
    const userEmail = user.email; // Assuming user object has email
    const userIdString = session.user.id; // Already a string from session

    // 1. Send In-App Notification
    try {
      await sendNotificationToUser(userIdString, {
        title: "Password Changed",
        message: "Your password has been successfully updated.",
        level: "success",
      });
      console.log(`In-app notification for password change sent to user ${userIdString}`);
    } catch (notificationError) {
      console.error(`Failed to send in-app notification for password change to user ${userIdString}:`, notificationError);
    }

    // 2. Send Email Notification
    if (userEmail) {
      try {
        await sendEmail({
          to: userEmail,
          subject: "Security Alert: Your Password Has Been Changed",
          text: `Hi ${user.name || 'User'},\n\nYour password for your AdScreener account was recently changed.\n\nIf you made this change, you can safely ignore this email.\n\nIf you did not make this change, please secure your account immediately and contact support.\n\nThank you,\nThe AdScreener Team`,
          // Consider a more detailed HTML template for this critical alert
          htmlContent: `
            <p>Hi ${user.name || 'User'},</p>
            <p>Your password for your AdScreener account was recently changed.</p>
            <p>If you made this change, you can safely ignore this email.</p>
            <p><strong>If you did not make this change, please secure your account immediately and contact support.</strong></p>
            <p>Thank you,<br/>The AdScreener Team</p>
          `
        });
        console.log(`Password change email alert sent to ${userEmail}`);
      } catch (emailError) {
        console.error(`Failed to send password change email alert to ${userEmail}:`, emailError);
      }
    } else {
      console.warn(`User email not found for user ${userIdString}, cannot send password change email alert.`);
    }

    return NextResponse.json({ message: "Password updated successfully" }, { status: 200 });

  } catch (error) {
    console.error("Error changing password:", error);
    if (error instanceof SyntaxError) {
        return NextResponse.json({ message: "Invalid JSON payload" }, { status: 400 });
    }
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
