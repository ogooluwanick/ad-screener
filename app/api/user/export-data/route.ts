import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const client = await clientPromise;
    const db = client.db();
    const userId = new ObjectId(session.user.id);

    const user = await db.collection("users").findOne({ _id: userId });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Remove sensitive information like password before sending
    const { password, ...userDataToExport } = user;

    // For a real application, you might want to:
    // 1. Select specific fields to export.
    // 2. Format the data (e.g., as CSV, JSON file).
    // 3. Implement a more secure delivery method (e.g., email link to download).
    // For now, we return the user data (minus password) as JSON.

    return NextResponse.json(userDataToExport, {
      status: 200,
      headers: {
        'Content-Disposition': `attachment; filename="user_data_${userId}.json"`,
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error("Error exporting user data:", error);
    return NextResponse.json({ message: "Internal server error during data export" }, { status: 500 });
  }
}
