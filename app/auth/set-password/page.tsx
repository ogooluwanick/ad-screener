"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Shield, KeyRound } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Suspense } from "react";

function SetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setError("Invalid token.");
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess(false);

    if (!token) {
      setError("Invalid token.");
      setIsLoading(false);
      return;
    }

    if (!password || !confirmPassword) {
      setError("Please enter a password and confirm it.");
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/set-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setError("");
        setSuccessMessage(data.message || "Your password has been set successfully! You can now log in.");
        toast({
          title: "Password Reset Successful",
          description: data.message || "You can now log in with your new password.",
        });
        // Redirect to login page after successful password reset
        setTimeout(() => router.push("/login"), 3000);
      } else {
        setError(data.message || "Failed to reset password.");
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!token && !error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-green-50 p-4">
        <div className="w-full max-w-md text-center">
          <p className="text-lg text-gray-700">Verifying token...</p>
        </div>
      </div>
    );
  }

  if (error && !successMessage) { // Only show error if no success message (i.e. token error)
    return (
      <div className="min-h-screen flex items-center justify-center bg-green-50 p-4">
        <div className="w-full max-w-md text-center">
          <Shield className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-xl font-semibold text-red-700">Reset Link Invalid or Expired</p>
          <p className="text-sm text-gray-600 mt-2">{error}</p>
          <Link href="/forgot-password">
            <Button variant="link" className="mt-4 text-green-600">Request a new link</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-50 p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6">
          <Link href="/" className="flex items-center">
            <Shield className="h-8 w-8 text-green-600 mr-2" />
            <span className="text-2xl font-bold text-gray-900">AdScreener</span>
          </Link>
        </div>

        <Card className="border-green-100">
          <CardHeader>
            <CardTitle className="text-center">Set Your Password</CardTitle>
            <CardDescription className="text-center">
              Enter your new password below.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {successMessage ? (
              <div className="text-center space-y-3">
                <KeyRound className="h-12 w-12 text-green-500 mx-auto" />
                <p className="text-green-600">{successMessage}</p>
                <Button onClick={() => router.push('/login')} className="w-full bg-green-600 hover:bg-green-700">
                  Go to Log In
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">New Password</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="border-green-200 focus:border-green-500 focus:ring-green-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="border-green-200 focus:border-green-500 focus:ring-green-500"
                    />
                  </div>

                  {error && <p className="text-sm text-red-600 text-center">{error}</p>}
                  <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={isLoading || !token}>
                    {isLoading ? "Setting Password..." : "Set Password"}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
          {!successMessage && (
            <CardFooter className="flex justify-center">
              <Link href="/login" className="text-sm text-green-600 hover:underline">
                Back to Log In
              </Link>
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  );
}

export function SetPasswordPageWrapper() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-green-50 p-4">
        <div className="w-full max-w-md text-center">
          <Shield className="h-12 w-12 text-green-600 mx-auto mb-4" />
          <p className="text-xl font-semibold text-gray-800">Loading Page...</p>
        </div>
      </div>
    }>
      <SetPasswordPage />
    </Suspense>
  );
}

export default SetPasswordPageWrapper;
