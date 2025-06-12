import NextAuth, { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { MongoDBAdapter } from "@next-auth/mongodb-adapter"
import clientPromise from "@/lib/mongodb"
import bcrypt from "bcryptjs"
import { MongoClient } from "mongodb"

export const authOptions: NextAuthOptions = {
  adapter: MongoDBAdapter(clientPromise),
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "jsmith@example.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Missing email or password");
        }

        const client: MongoClient = await clientPromise;
        const usersCollection = client.db().collection("users");
        const user = await usersCollection.findOne({ email: credentials.email });

        if (!user) {
          throw new Error("No user found with this email");
        }

        const isValidPassword = await bcrypt.compare(credentials.password, user.password as string);

        if (!isValidPassword) {
          throw new Error("Incorrect password");
        }

        // Return user object without password
        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role, // Add role here
        };
      }
    })
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: '/login',
    // signOut: '/auth/signout', // Optional: Custom signout page
    // error: '/auth/error', // Optional: Custom error page
    // verifyRequest: '/auth/verify-request', // Optional: Custom verify request page (for email provider)
    // newUser: '/auth/new-user' // Optional: Redirect new users to a specific page
  },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role; // Add role to token
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string; // Add role to session
      }
      return session;
    },
  },
  // debug: process.env.NODE_ENV === 'development', // Optional: Enable debug messages
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST }
