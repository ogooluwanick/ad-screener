"use client"

import type React from "react"
import { Suspense, useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Shield, KeyRound } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [token, setToken] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const resetToken = searchParams.get("token");
    if (resetToken) {
      setToken(resetToken);
    } else {
      setError("Invalid or missing reset token. Please request a new password reset link.");
      toast({
        title: "Error",
        description: "Invalid or missing reset token.",
        variant: "destructive",
      });
    }
  }, [searchParams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    if (!formData.password || !formData.confirmPassword) {
      setError("Both password fields are required.");
      toast({ title: "Error", description: "Both password fields are required.", variant: "destructive" });
      setIsLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      toast({ title: "Error", description: "Passwords do not match.", variant: "destructive" });
      setIsLoading(false);
      return;
    }
    
    if (formData.password.length < 6) {
        setError("Password must be at least 6 characters long.");
        toast({ title: "Error", description: "Password must be at least 6 characters long.", variant: "destructive" });
        setIsLoading(false);
        return;
    }

    if (!token) {
        setError("Reset token is missing. Cannot proceed.");
        toast({ title: "Error", description: "Reset token is missing.", variant: "destructive" });
        setIsLoading(false);
        return;
    }

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password: formData.password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to reset password. Please try again.");
        toast({
          title: "Error",
          description: data.message || "Failed to reset password. The link may be invalid or expired.",
          variant: "destructive",
        });
      } else {
        setSuccessMessage(data.message || "Your password has been reset successfully! You can now log in.");
        toast({
          title: "Password Reset Successful",
          description: data.message || "You can now log in with your new password.",
        });
        // Optionally redirect to login page after a delay
        setTimeout(() => router.push("/login"), 3000);
      }
    } catch (err) {
      console.error("Reset password request error:", err);
      setError("An unexpected error occurred. Please try again.");
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
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
            <CardTitle className="text-center">Reset Your Password</CardTitle>
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
                      value={formData.password}
                      onChange={handleChange}
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
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                      className="border-green-200 focus:border-green-500 focus:ring-green-500"
                    />
                  </div>

                  {error && <p className="text-sm text-red-600 text-center">{error}</p>}
                  <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={isLoading || !token}>
                    {isLoading ? "Resetting Password..." : "Reset Password"}
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


export default function ResetPasswordPage() {
  return (
    // Suspense is crucial for useSearchParams to work correctly during SSR/initial load
    <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center bg-green-50 p-4">
            <div className="w-full max-w-md text-center">
                <Shield className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <p className="text-xl font-semibold text-gray-800">Loading Page...</p>
            </div>
        </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
