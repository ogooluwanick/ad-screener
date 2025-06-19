import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import clientPromise from "@/lib/mongodb"; // Use the native MongoDB client
import { MongoClient } from "mongodb";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const { email: userEmail } = await req.json(); // Renamed to avoid conflict

    if (!userEmail) {
      return NextResponse.json({ message: "Email is required." }, { status: 400 });
    }

    const client: MongoClient = await clientPromise();
    const db = client.db();
    const usersCollection = db.collection("users");

    const user = await usersCollection.findOne({ email: userEmail });

    if (!user) {
      console.log(`Password reset request for non-existent email: ${userEmail}`);
      return NextResponse.json({ message: "If an account with that email exists, a password reset link has been sent." }, { status: 200 });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const passwordResetToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    const passwordResetExpires = new Date(Date.now() + 3600000); // 1 hour from now

    await usersCollection.updateOne(
      { _id: user._id },
      {
        $set: {
          passwordResetToken: passwordResetToken,
          passwordResetExpires: passwordResetExpires,
          updatedAt: new Date(),
        },
      }
    );

    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`;

    try {
      // Ensure user.name exists, otherwise pass user.email or a default
      const userName = user.name || user.firstName || userEmail; 
      await sendPasswordResetEmail(user.email, userName, resetUrl);
      console.log(`Password reset email sent to ${user.email}`);
      return NextResponse.json({ message: "If an account with that email exists, a password reset link has been sent." }, { status: 200 });
    } catch (emailError) {
      console.error("Failed to send password reset email:", emailError);
      await usersCollection.updateOne(
        { _id: user._id },
        {
          $unset: {
            passwordResetToken: "",
            passwordResetExpires: "",
          },
          $set: { // Still update the updatedAt field
            updatedAt: new Date(),
          }
        }
      );
      return NextResponse.json({ message: "Error processing request. Please try again later." }, { status: 500 });
    }

  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ message: "An internal server error occurred." }, { status: 500 });
  }
}
