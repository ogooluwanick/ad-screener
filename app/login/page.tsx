"use client"

import type React from "react"
import { Suspense } from "react" // Added Suspense

import { useState, useEffect } from "react" // Added useEffect
import { useRouter, useSearchParams } from "next/navigation" // Added useSearchParams
import Link from "next/link"
import { signIn, useSession } from "next-auth/react" // Import signIn and useSession
import { Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"

// This component contains the actual login form logic and uses useSearchParams
function LoginFormWrapper() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, status } = useSession()

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null) // For displaying login errors

  // Redirect if already logged in
  useEffect(() => {
    if (status === "authenticated" && session?.user?.role) {
      const callbackUrl = searchParams.get("callbackUrl")
      if (callbackUrl) {
        router.push(callbackUrl)
      } else if (session.user.role === "superadmin") {
        router.push("/admin/dashboard"); // Redirect superadmin to admin dashboard
      } else if (session.user.role === "submitter") {
        router.push("/submitter/dashboard")
      } else if (session.user.role === "reviewer") {
        router.push("/reviewer/dashboard")
      } else {
        router.push("/") // Fallback redirect
      }
    }
  }, [status, session, router, searchParams])


  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null) // Clear previous errors

    if (!formData.email || !formData.password) {
      toast({
        title: "Error",
        description: "Email and password are required.",
        variant: "destructive",
      })
      setIsLoading(false)
      return
    }

    try {
      const result = await signIn("credentials", {
        redirect: false, // Handle redirect manually after checking role
        email: formData.email,
        password: formData.password,
      })

      if (result?.error) {
        // Use the error message directly from the authorize function if available
        const errorMessage = result.error || "Login failed. Please check your credentials.";
        
        setError(errorMessage); // Set error for display
        toast({
          title: "Login Failed",
          description: errorMessage, // Display the specific error from authorize
          variant: "destructive",
        });
        setIsLoading(false);
      } else if (result?.ok) {
        // Successful login, session will be updated.
        // The useEffect hook will handle redirection based on role.
        // We might need to refresh the session or wait for status update
        // For now, let's assume useEffect will pick up the change.
        // If not, a manual router.refresh() or similar might be needed.
        toast({
          title: "Success",
          description: "Logged in successfully! Redirecting...",
        })
        // Redirection is handled by useEffect
      }
    } catch (err) {
      console.error("Login submit error:", err)
      setError("An unexpected error occurred during login.")
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      })
    } finally {
      // setIsLoading(false); // Let useEffect handle loading state or redirect
    }
  }
  
  // Update loading state based on session status as well
  useEffect(() => {
    if (status === "loading" || (status === "authenticated" && !session?.user?.role)) {
      setIsLoading(true);
    } else {
      setIsLoading(false);
    }
  }, [status, session]);

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
            <CardTitle className="text-center">Log In</CardTitle>
            <CardDescription className="text-center">Enter your credentials to access your account</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="border-green-200 focus:border-green-500 focus:ring-green-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="border-green-200 focus:border-green-500 focus:ring-green-500"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Input type="checkbox" id="remember" className="h-4 w-4" />
                    <Label htmlFor="remember" className="text-sm">
                      Remember me
                    </Label>
                  </div>
                  <Link href="/forgot-password" className="text-sm text-green-600 hover:underline">
                    Forgot password?
                  </Link>
                </div>

                {error && <p className="text-sm text-red-600 text-center">{error}</p>}
                <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={isLoading || status === 'loading'}>
                  {isLoading || status === 'loading' ? "Logging in..." : "Log In"}
                </Button>
              </div>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{" "}
              <Link href="/signup" className="text-green-600 hover:underline">
                Sign up
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

// The main export LoginPage now wraps LoginFormWrapper with Suspense
export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-green-50 p-4">
        <div className="w-full max-w-md text-center">
          <Shield className="h-12 w-12 text-green-600 mx-auto mb-4" />
          <p className="text-xl font-semibold text-gray-800">Loading AdScreener...</p>
          <p className="text-sm text-gray-600 mt-2">Please wait a moment.</p>
          {/* Optionally, add a simple spinner animation here if desired */}
        </div>
      </div>
    }>
      <LoginFormWrapper />
    </Suspense>
  );
}
