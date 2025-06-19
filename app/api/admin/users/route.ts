import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";
import { MongoClient } from "mongodb";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id || (session.user.role !== 'admin' && session.user.role !== 'superadmin')) {
    return NextResponse.json({ message: 'Unauthorized or invalid role' }, { status: 401 });
  }

  try {
    const client: MongoClient = await clientPromise();
    const db = client.db();
    const usersCollection = db.collection("users");

    const users = await usersCollection.find({}).toArray();

    // Convert ObjectId to string for each user
    const usersWithId = users.map(user => ({
      ...user,
      _id: user._id.toString(),
    }));

    return NextResponse.json(usersWithId);
  } catch (error) {
    console.error("Failed to fetch users:", error);
    return NextResponse.json(
      { message: "Failed to fetch users." },
      { status: 500 }
    );
  }
}
