"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation" // Removed useSearchParams as it's not needed here
import Link from "next/link"
import { signIn, useSession } from "next-auth/react"
import { Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
// RadioGroup and RadioGroupItem are not needed as role is fixed
import { toast } from "@/hooks/use-toast"

export default function ReviewerSignupPage() { // Renamed component
  const router = useRouter()
  const { data: session, status } = useSession()

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "reviewer", // Hardcoded to reviewer
    companyName: "", // Added companyName
  })

  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role) {
      const userRole = session.user.role;
      if (userRole === "submitter") {
        router.push("/submitter/dashboard");
      } else if (userRole === "reviewer") {
        router.push("/reviewer/dashboard");
      } else {
        router.push("/");
      }
    }
  }, [session, status, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password || !formData.confirmPassword || !formData.companyName) { // Added companyName check
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
          role: formData.role, // Will be "reviewer"
          companyName: formData.companyName, // Added companyName
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
        title: "Registration Successful!", 
        description: "Please check your email to verify your account." 
      });
      router.push("/auth/check-email"); // Redirect to check email page

      // const signInResponse = await signIn("credentials", { // REMOVED: No auto login
      //   redirect: false,
      //   email: formData.email,
      //   password: formData.password,
      // })

      // if (signInResponse?.error) {
      //   toast({
      //     title: "Login Failed After Signup",
      //     description: signInResponse.error || "Could not log you in automatically. Please try logging in manually.",
      //     variant: "destructive",
      //   })
      //   router.push("/login")
      // } else if (signInResponse?.ok) {
      //   // Redirect based on role, should always be reviewer here
      //   router.push("/reviewer/dashboard")
      // }
    } catch (error) {
      console.error("Reviewer signup error:", error)
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred during signup.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-green-50 p-4">
        <p>Loading...</p>
      </div>
    );
  }
  
  if (status === "authenticated") {
     return (
      <div className="min-h-screen flex items-center justify-center bg-green-50 p-4">
        <p>Redirecting...</p>
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
            <CardTitle className="text-center">Create Reviewer Account</CardTitle>
            <CardDescription className="text-center">Internal Reviewer Sign Up</CardDescription>
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
                      className="border-green-200 focus:border-green-500 focus:ring-green-500"
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
                      className="border-green-200 focus:border-green-500 focus:ring-green-500"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    name="companyName"
                    type="text"
                    placeholder="Your Company LLC"
                    value={formData.companyName}
                    onChange={handleChange}
                    required
                    className="border-green-200 focus:border-green-500 focus:ring-green-500"
                  />
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

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    className="border-green-200 focus:border-green-500 focus:ring-green-500"
                  />
                </div>

                <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={isLoading}>
                  {isLoading ? "Creating Reviewer Account..." : "Sign Up as Reviewer"}
                </Button>
              </div>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <Link href="/login" className="text-green-600 hover:underline">
                Log in
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
