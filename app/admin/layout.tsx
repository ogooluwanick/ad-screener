"use client";

import type React from "react";
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import DashboardHeader from "@/components/dashboard-header";
import { toast } from "@/hooks/use-toast";
import { Shield } from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "loading") {
      return;
    }

    if (status === "unauthenticated") {
      signIn(undefined, { callbackUrl: pathname });
      return;
    }

    if (session?.user?.role !== "admin" && session?.user?.role !== "superadmin") {
      toast({
        title: "Access Denied",
        description: "You do not have permission to access this page.",
        variant: "destructive",
      });
      router.push("/");
    }
  }, [status, session, router, pathname]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900">
        <Shield className="h-16 w-16 text-green-600 animate-pulse mb-4" />
        <p className="text-lg text-gray-700 dark:text-gray-300">Loading admin dashboard...</p>
      </div>
    );
  }

  if (status === "authenticated" && (session?.user?.role === "admin" || session?.user?.role === "superadmin")) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <DashboardHeader
          role={session?.user?.role === "superadmin" ? "superadmin" : "admin"}
        />
        <main className="container mx-auto px-4 py-6">{children}</main>
      </div>
    );
  }

  return null; // Fallback
} 