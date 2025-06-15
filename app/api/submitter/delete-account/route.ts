import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
// It's good practice to also sign the user out after account deletion.
import { signOut } from "next-auth/react"; // This is for client-side, need a server-side equivalent or handle on client.

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

    // Potentially, you might want to delete related data first (e.g., ads submitted by this user)
    // For example:
    // await db.collection("ads").deleteMany({ submitterId: userId });
    // This depends on your application's data integrity rules.

    const deleteResult = await db.collection("users").deleteOne({ _id: userId });

    if (deleteResult.deletedCount === 0) {
      return NextResponse.json({ message: "User not found or already deleted" }, { status: 404 });
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
