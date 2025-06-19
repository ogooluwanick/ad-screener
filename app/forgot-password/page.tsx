"use client"

import type React from "react"
import { Suspense, useState } from "react"
import Link from "next/link"
import { Shield, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"

function ForgotPasswordForm() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage(null)

    if (!email) {
      toast({
        title: "Error",
        description: "Email address is required.",
        variant: "destructive",
      })
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast({
          title: "Error",
          description: data.message || "Failed to send reset link. Please try again.",
          variant: "destructive",
        });
        setMessage(data.message || "Failed to send reset link. Please try again.");
      } else {
        toast({
          title: "Request Sent",
          description: data.message || "If an account with that email exists, we've sent instructions to reset your password.",
        });
        setMessage(data.message || "If an account with that email exists, we've sent instructions to reset your password.");
        setEmail(""); // Clear the input field
      }
    } catch (error) {
      console.error("Forgot password request error:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      setMessage("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50 p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6">
          <Link href="/" className="flex items-center">
            <Shield className="h-8 w-8 text-blue-600 mr-2" />
            <span className="text-2xl font-bold text-gray-900">AdScreener</span>
          </Link>
        </div>

        <Card className="border-blue-100">
          <CardHeader>
            <CardTitle className="text-center">Forgot Password</CardTitle>
            <CardDescription className="text-center">
              Enter your email address and we'll send you a link to reset your password.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={handleChange}
                      required
                      className="border-blue-200 focus:border-blue-500 focus:ring-blue-500 pl-10"
                    />
                  </div>
                </div>

                {message && <p className="text-sm text-green-600 text-center">{message}</p>}
                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
                  {isLoading ? "Sending..." : "Send Reset Link"}
                </Button>
              </div>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col items-center space-y-2">
            <Link href="/login" className="text-sm text-blue-600 hover:underline">
              Back to Log In
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-blue-50 p-4">
        <div className="w-full max-w-md text-center">
          <Shield className="h-12 w-12 text-blue-600 mx-auto mb-4" />
          <p className="text-xl font-semibold text-gray-800">Loading AdScreener...</p>
          <p className="text-sm text-gray-600 mt-2">Please wait a moment.</p>
        </div>
      </div>
    }>
      <ForgotPasswordForm />
    </Suspense>
  );
}
