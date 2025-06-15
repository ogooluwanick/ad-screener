import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { sendEmail } from "@/lib/email"; // Added for sending emails
// It's good practice to also sign the user out after account deletion.
// import { signOut } from "next-auth/react"; // This is for client-side, need a server-side equivalent or handle on client.

// Define a placeholder for the admin email. In a real app, use an environment variable.
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@example.com";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "submitter") {
    return NextResponse.json({ message: "Forbidden: Only submitters can delete their accounts through this endpoint." }, { status: 403 });
  }

  try {
    const client = await clientPromise(); // Call the function
    const db = client.db();
    const userId = new ObjectId(session.user.id);
    const usersCollection = db.collection("users");

    // Fetch user details before deleting, for notification purposes
    const userToDelete = await usersCollection.findOne({ _id: userId });

    if (!userToDelete) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const userEmail = userToDelete.email;
    const userName = userToDelete.name || "User";

    // Potentially, you might want to delete related data first (e.g., ads submitted by this user)
    // For example:
    // await db.collection("ads").deleteMany({ submitterId: session.user.id }); // Use session.user.id if it's a string
    // This depends on your application's data integrity rules.

    const deleteResult = await usersCollection.deleteOne({ _id: userId });

    if (deleteResult.deletedCount === 0) {
      // This case should ideally be caught by the findOne check above,
      // but it's a safeguard.
      return NextResponse.json({ message: "User not found or already deleted during delete operation" }, { status: 404 });
    }

    // Send notifications after successful deletion
    // 1. Email to the user
    if (userEmail) {
      try {
        await sendEmail({
          to: userEmail,
          subject: "Your AdScreener Account Has Been Deleted",
          text: `Hi ${userName},\n\nYour account with AdScreener has been successfully deleted as per your request.\n\nIf you did not request this, please contact our support immediately.\n\nThank you for being a part of our community.\n\nThe AdScreener Team`,
          htmlContent: `<p>Hi ${userName},</p><p>Your account with AdScreener has been successfully deleted as per your request.</p><p>If you did not request this, please contact our support immediately.</p><p>Thank you for being a part of our community.<br/>The AdScreener Team</p>`
        });
        console.log(`Account deletion confirmation email sent to ${userEmail}`);
      } catch (emailError) {
        console.error(`Failed to send account deletion email to ${userEmail}:`, emailError);
      }
    }

    // 2. Email to Admin
    try {
      await sendEmail({
        to: ADMIN_EMAIL, // Use the configured admin email
        subject: "User Account Deleted Notification",
        text: `A user account has been deleted:\n\nUser ID: ${userId.toString()}\nEmail: ${userEmail || 'N/A'}\nName: ${userName || 'N/A'}\n\nThis is an automated notification.`,
        htmlContent: `<p>A user account has been deleted:</p><ul><li>User ID: ${userId.toString()}</li><li>Email: ${userEmail || 'N/A'}</li><li>Name: ${userName || 'N/A'}</li></ul><p>This is an automated notification.</p>`
      });
      console.log(`Admin notification email sent to ${ADMIN_EMAIL} for user ${userId.toString()} deletion.`);
    } catch (adminEmailError) {
      console.error(`Failed to send admin notification email for user ${userId.toString()} deletion:`, adminEmailError);
    }
    
    // Note: Signing out the user after account deletion is crucial.
    // NextAuth.js signOut is typically client-side.
    // The client should handle redirecting or signing out after a successful response.
    // For API-only initiated signout, you'd typically invalidate the session token if stored/managed by your backend.
    // However, with NextAuth, the session is cookie-based, and clearing the cookie is done client-side.

    return NextResponse.json({ message: "Account successfully deleted." }, { status: 200 });

  } catch (error) {
    console.error("Error deleting account:", error);
    return NextResponse.json({ message: "Internal server error during account deletion" }, { status: 500 });
  }
}
