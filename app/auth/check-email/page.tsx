"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MailCheck } from "lucide-react";

export default function CheckEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 bg-blue-100 rounded-full mb-4">
            <MailCheck className="h-8 w-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-slate-800">Check Your Email</CardTitle>
          <CardDescription className="text-slate-600 pt-2">
            We've sent a verification link to the email address you provided. Please check your inbox (and spam folder, just in case) to complete your registration.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-sm text-slate-500">
            Didn't receive the email? You might be able to request a new one soon or contact support if issues persist.
          </p>
          <div className="mt-6">
            <Link
              href="/login"
              className="text-blue-600 hover:text-blue-700 font-medium hover:underline"
            >
              Back to Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
