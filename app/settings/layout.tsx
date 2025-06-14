"use client";

import DashboardHeader from "@/components/dashboard-header";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
        <p className="ml-4 text-lg">Loading...</p>
      </div>
    );
  }

  if (!session || !session.user || !session.user.role) {
    // This case should ideally be handled by the redirect in useEffect,
    // but as a fallback or if role is missing.
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg text-red-600">Session not found or role missing. Redirecting...</p>
      </div>
    );
  }

  const userRole = session.user.role as "submitter" | "reviewer";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <DashboardHeader role={userRole} />
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
