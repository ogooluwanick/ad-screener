import clientPromise from "@/lib/mongodb";
import { MongoClient } from "mongodb";

interface User {
  _id: string;
  email: string;
  role: string;
  lastOnline?: Date;
  // Add other user properties as needed
}

export async function getUsersByRole(roles: string[]): Promise<User[]> {
  try {
    const client: MongoClient = await clientPromise();
    const db = client.db();
    const usersCollection = db.collection("users");

    const users = await usersCollection.find({ role: { $in: roles } }).toArray();

    return users.map(user => ({
      _id: user._id.toString(),
      email: user.email,
      role: user.role,
      lastOnline: user.lastOnline,
    }));
  } catch (error) {
    console.error(`Failed to fetch users by roles ${roles.join(', ')}:`, error);
    return [];
  }
}
