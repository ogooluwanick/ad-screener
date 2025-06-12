"use client"

import type React from "react"

import { useState, useEffect } from "react" // Added useEffect
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { signIn, useSession } from "next-auth/react" // Added useSession
import { Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { toast } from "@/hooks/use-toast"

export default function SignupPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, status } = useSession() // Get session data and status
  const defaultRole = searchParams.get("role") || "submitter"

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: defaultRole,
  })

  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Redirect if user is already logged in
    if (status === "authenticated" && session?.user?.role) {
      const userRole = session.user.role;
      if (userRole === "submitter") {
        router.push("/submitter/dashboard");
      } else if (userRole === "reviewer") {
        router.push("/reviewer/dashboard");
      } else {
        // Fallback or error handling if role is not defined or unexpected
        router.push("/"); // Or a generic dashboard
      }
    }
  }, [session, status, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleRoleChange = (value: string) => {
    setFormData((prev) => ({ ...prev, role: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password || !formData.confirmPassword) {
      toast({
        title: "Error",
        description: "All fields are required.",
        variant: "destructive",
      })
      setIsLoading(false)
      return
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match.",
        variant: "destructive",
      })
      setIsLoading(false)
      return
    }

    if (formData.password.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      })
      setIsLoading(false)
      return
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
          role: formData.role,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast({
          title: "Error",
          description: data.message || "Something went wrong.",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      toast({
        title: "Success",
        description: "Account created successfully! Logging you in...",
      })

      // Automatically sign in the user after successful registration
      const signInResponse = await signIn("credentials", {
        redirect: false, // Don't redirect automatically, handle it manually
        email: formData.email,
        password: formData.password,
      })

      if (signInResponse?.error) {
        toast({
          title: "Login Failed After Signup",
          description: signInResponse.error || "Could not log you in automatically. Please try logging in manually.",
          variant: "destructive",
        })
        // Optionally redirect to login page or show error
        router.push("/login") // Or stay on signup page
      } else if (signInResponse?.ok) {
         // Redirect based on role
        if (formData.role === "submitter") {
          router.push("/submitter/dashboard")
        } else {
          router.push("/reviewer/dashboard")
        }
      }
    } catch (error) {
      console.error("Signup error:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred during signup.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Show loading or null while checking session to prevent flash of content
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-50 p-4">
        <p>Loading...</p> {/* Or a spinner component */}
      </div>
    );
  }
  
  // If user is authenticated and redirection is in progress (or just happened),
  // you might want to return null or a loading indicator as well,
  // though the useEffect should handle the redirect.
  // This check is more for if you want to avoid rendering the form at all if already logged in.
  if (status === "authenticated") {
     return (
      <div className="min-h-screen flex items-center justify-center bg-blue-50 p-4">
        <p>Redirecting...</p> {/* Or a spinner component */}
      </div>
    );
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
            <CardTitle className="text-center">Create an Account</CardTitle>
            <CardDescription className="text-center">Sign up to start using AdScreener</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      type="text"
                      placeholder="John"
                      value={formData.firstName}
                      onChange={handleChange}
                      required
                      className="border-blue-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      type="text"
                      placeholder="Doe"
                      value={formData.lastName}
                      onChange={handleChange}
                      required
                      className="border-blue-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>

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
                    className="border-blue-200 focus:border-blue-500 focus:ring-blue-500"
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
                    className="border-blue-200 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    className="border-blue-200 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label>I am a:</Label>
                  <RadioGroup
                    value={formData.role}
                    onValueChange={handleRoleChange}
                    className="flex flex-col space-y-1"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="submitter" id="submitter" />
                      <Label htmlFor="submitter" className="cursor-pointer">
                        Submitter (Submit ads for review)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="reviewer" id="reviewer" />
                      <Label htmlFor="reviewer" className="cursor-pointer">
                        Reviewer (Review submitted ads)
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
                  {isLoading ? "Creating Account..." : "Sign Up"}
                </Button>
              </div>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <Link href="/login" className="text-blue-600 hover:underline">
                Log in
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
