import NextAuth, { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { MongoDBAdapter } from "@next-auth/mongodb-adapter"
import clientPromise from "@/lib/mongodb"
import bcrypt from "bcryptjs"
import { MongoClient, ObjectId } from "mongodb" // Added ObjectId
import crypto from "crypto" // For token generation
import { sendVerificationEmail } from "@/lib/email" // For resending verification

// clientPromise is now a function that returns Promise<MongoClient>
// We need to call it to get the promise for the adapter.
export const authOptions: NextAuthOptions = {
  adapter: MongoDBAdapter(clientPromise()), 
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

        // Call clientPromise() to get the Promise<MongoClient>, then await it.
        const client: MongoClient = await clientPromise(); 
        const usersCollection = client.db().collection("users");
        const dbUser = await usersCollection.findOne({ email: credentials.email });

        if (!dbUser) {
          throw new Error("No user found with this email");
        }
        
        // Check if email is verified
        if (!dbUser.emailVerified) {
          // Email is not verified, resend verification email
          const newVerificationToken = crypto.randomBytes(32).toString("hex");
          const newVerificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

          await usersCollection.updateOne(
            { _id: new ObjectId(dbUser._id) },
            {
              $set: {
                verificationToken: newVerificationToken,
                verificationTokenExpires: newVerificationTokenExpires,
              },
            }
          );

          try {
            await sendVerificationEmail(dbUser.email, dbUser.name, newVerificationToken);
            throw new Error("Your email is not verified. We've sent a new verification link to your email address. Please check your inbox.");
          } catch (emailError: any) {
            console.error("Error resending verification email:", emailError);
            // If resending fails, throw a more generic error or the original "please verify"
            throw new Error("Your email is not verified. Please check your inbox or try registering again if issues persist.");
          }
        }

        const isValidPassword = await bcrypt.compare(credentials.password, dbUser.password as string);

        if (!isValidPassword) {
          throw new Error("Incorrect password");
        }

        let sessionTimeoutInHours = 4; // Default session timeout
        if (dbUser.role === "reviewer" && dbUser.reviewerSettings?.security?.sessionTimeout) {
          sessionTimeoutInHours = parseInt(dbUser.reviewerSettings.security.sessionTimeout, 10);
        } else if (dbUser.role === "submitter" && dbUser.submitterSettings?.security?.sessionTimeout) {
          sessionTimeoutInHours = parseInt(dbUser.submitterSettings.security.sessionTimeout, 10);
        }

        // Return user object without password
        return {
          id: dbUser._id.toString(),
          name: dbUser.name, 
          email: dbUser.email,
          role: dbUser.role,
          firstName: dbUser.firstName,
          lastName: dbUser.lastName,
          profileImageUrl: dbUser.profileImageUrl,
          sessionTimeoutInHours: sessionTimeoutInHours 
        };
      }
    })
  ],
  session: {
    strategy: "jwt",
    // maxAge can be set to the longest possible session timeout (e.g., 7 days in seconds)
    // The JWT's own 'exp' claim will enforce the user-specific shorter timeout.
    maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
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
        token.role = (user as any).role;
        token.firstName = (user as any).firstName;
        token.lastName = (user as any).lastName;
        token.profileImageUrl = (user as any).profileImageUrl;

        // Set JWT expiration based on user's sessionTimeout setting
        const sessionTimeoutInHours = (user as any).sessionTimeoutInHours || 4; // Default to 4 hours if not set
        const sessionTimeoutInSeconds = sessionTimeoutInHours * 60 * 60;
        token.exp = Math.floor(Date.now() / 1000) + sessionTimeoutInSeconds;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string; // Add role to session
        session.user.firstName = token.firstName as string;
        session.user.lastName = token.lastName as string;
        session.user.profileImageUrl = token.profileImageUrl as string;
      }
      return session;
    },
  },
  // debug: process.env.NODE_ENV === 'development', // Optional: Enable debug messages
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST }
