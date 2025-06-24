"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

function VerifyEmailStatusDisplay() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const status = searchParams.get("status");
  const message = searchParams.get("message");
  const nextAction = searchParams.get("next_action");
  const token = searchParams.get("token");

  const [displayStatus, setDisplayStatus] = useState<"success" | "error" | "loading">("loading");
  const [displayMessage, setDisplayMessage] = useState<string | null>(null);

  useEffect(() => {
    if (status === "success") {
      setDisplayStatus("success");
      setDisplayMessage(message || "Email verified successfully!");
    } else if (status === "error") {
      setDisplayStatus("error");
      setDisplayMessage(message || "An error occurred during verification.");
    } else {
      // Handle cases where params might be missing or invalid
      setDisplayStatus("error");
      setDisplayMessage("Invalid verification status or parameters.");
    }
  }, [status, message, router]);

  useEffect(() => {
    if (displayStatus === "success") {
      const timer = setTimeout(() => {
        if (nextAction === "set_password" && token) {
          router.push(`/auth/set-password?token=${token}`);
        } else {
          router.push("/login");
        }
      }, 3000); // 3-second delay

      return () => clearTimeout(timer); // Cleanup timer on component unmount
    }
  }, [displayStatus, router, nextAction, token]);

  const Icon = displayStatus === "success" ? CheckCircle : displayStatus === "error" ? XCircle : AlertTriangle;
  const iconColor = displayStatus === "success" ? "text-green-600" : "text-red-600";
  const cardBorderColor = displayStatus === "success" ? "border-green-200" : "border-red-200";
  const bgColor = displayStatus === "success" ? "bg-green-50" : "bg-red-50";


  if (displayStatus === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <p>Loading verification status...</p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${bgColor}`}>
      <Card className={`w-full max-w-md shadow-lg ${cardBorderColor}`}>
        <CardHeader className="text-center">
          <div className={`mx-auto flex items-center justify-center h-16 w-16 ${displayStatus === "success" ? "bg-green-100" : "bg-red-100"} rounded-full mb-4`}>
            <Icon className={`h-8 w-8 ${iconColor}`} />
          </div>
          <CardTitle className={`text-2xl font-bold ${displayStatus === "success" ? "text-slate-800" : "text-red-700"}`}>
            {displayStatus === "success" ? "Verification Successful" : "Verification Failed"}
          </CardTitle>
          {displayMessage && (
            <CardDescription className={`${displayStatus === "success" ? "text-slate-600" : "text-red-600"} pt-2`}>
              {displayMessage}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="text-center">
          {displayStatus === "success" && (
            <p className="text-sm text-slate-500 mb-6">
              You can now proceed to log in with your verified email address.
            </p>
          )}
           {displayStatus === "error" && (
            <p className="text-sm text-slate-500 mb-6">
              If the problem persists, please try registering again or contact support.
            </p>
          )}
          <Button asChild className="w-full sm:w-auto">
            <Link href="/login">
              Go to Login
            </Link>
          </Button>
        </CardContent>
        {displayStatus === "error" && (
             <CardFooter className="flex flex-col items-center justify-center pt-4 border-t">
                <p className="text-xs text-slate-500">Trouble verifying? You can also try:</p>
                <Link href="/signup" className="text-xs text-green-600 hover:underline mt-1">
                    Register again
                </Link>
             </CardFooter>
        )}
      </Card>
    </div>
  );
}

export default function VerifyEmailStatusPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50 p-4"><p>Loading page...</p></div>}>
      <VerifyEmailStatusDisplay />
    </Suspense>
  );
}
