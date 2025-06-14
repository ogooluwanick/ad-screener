"use client";

import type React from "react";
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import DashboardHeader from "@/components/dashboard-header";
import { toast } from "@/hooks/use-toast";
import { Shield, Loader2 } from "lucide-react"; // Added Loader2

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "loading") {
      return; // Wait for session to load
    }

    if (status === "unauthenticated") {
      // Redirect to sign-in page if not authenticated, then back to profile
      signIn(undefined, { callbackUrl: pathname });
      return;
    }

    // Ensure user has a role, otherwise it's an unexpected state for a profile page
    // that relies on role for DashboardHeader.
    if (status === "authenticated" && !session?.user?.role) {
      toast({
        title: "Error",
        description: "User role not found. Cannot display profile context correctly.",
        variant: "destructive",
      });
      router.push("/"); // Redirect to a generic page or dashboard
    }
  }, [status, session, router, pathname]);

  if (status === "loading" || (status === "authenticated" && !session?.user?.role)) {
    // Show a loading state while session is loading or if role is missing temporarily
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900">
        <Loader2 className="h-16 w-16 text-blue-600 animate-spin mb-4" />
        <p className="text-lg text-gray-700 dark:text-gray-300">Loading profile...</p>
      </div>
    );
  }

  if (status === "authenticated" && session?.user?.role) {
    const userRole = session.user.role as "submitter" | "reviewer"; // Type assertion
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <DashboardHeader role={userRole} />
        <main className="container mx-auto px-4 py-6">{children}</main>
      </div>
    );
  }

  // Fallback for unauthenticated status if signIn redirect hasn't happened yet
  // or other unexpected states.
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900">
      <Shield className="h-16 w-16 text-blue-600 mb-4" />
      <p className="text-lg text-gray-700 dark:text-gray-300">Preparing your space...</p>
    </div>
  );
}
