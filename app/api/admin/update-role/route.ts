import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";
import { MongoClient, ObjectId } from "mongodb";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id || (session.user.role !== 'admin' && session.user.role !== 'superadmin')) {
    return NextResponse.json({ message: 'Unauthorized or invalid role' }, { status: 401 });
  }

  try {
    const { userId, role, firstName, lastName, email } = await req.json();

    if (!userId || !role) {
      return NextResponse.json(
        { message: "User ID and role are required." },
        { status: 400 }
      );
    }

    const client: MongoClient = await clientPromise();
    const db = client.db();
    const usersCollection = db.collection("users");

    // Build update object with provided fields
    const updateFields: any = { role };
    if (firstName) updateFields.firstName = firstName;
    if (lastName) updateFields.lastName = lastName;
    if (email) updateFields.email = email;
    updateFields.updatedAt = new Date();

    const result = await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      { $set: updateFields }
    );

    if (result.modifiedCount !== 1) {
      return NextResponse.json(
        { message: "Failed to update user information." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "User information updated successfully." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to update user information:", error);
    return NextResponse.json(
      { message: "Failed to update user information." },
      { status: 500 }
    );
  }
}
