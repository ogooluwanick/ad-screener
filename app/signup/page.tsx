"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { signIn, useSession } from "next-auth/react"
import { Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea" // For Business Description

// Define a list of sectors for the dropdown
const businessSectors = [
  "Technology",
  "Finance",
  "Healthcare",
  "Retail",
  "Manufacturing",
  "Education",
  "Real Estate",
  "Hospitality",
  "Agriculture",
  "Other",
];

export default function SignupPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [submitterType, setSubmitterType] = useState("business") // Default to 'business' or 'agency'

  const [formData, setFormData] = useState({
    firstName: "", // For authorized representative
    lastName: "",  // For authorized representative
    email: "",
    password: "",
    confirmPassword: "",
    role: "submitter", // Hardcoded to submitter
    // Common for Agency & Business
    companyName: "", // Business Name
    registrationNumber: "", // Agency Reg No or Business CAC No
    // Specific to Business
    sector: "",
    officeAddress: "",
    state: "",
    country: "",
    businessDescription: "",
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Basic common validations
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password || !formData.confirmPassword) {
      toast({ title: "Error", description: "Personal and login details are required.", variant: "destructive" })
      setIsLoading(false); return;
    }
    if (formData.password !== formData.confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match.", variant: "destructive" })
      setIsLoading(false); return;
    }
    if (formData.password.length < 6) {
      toast({ title: "Error", description: "Password must be at least 6 characters long.", variant: "destructive" })
      setIsLoading(false); return;
    }

    // Submitter type specific validations
    if (!formData.companyName) {
        toast({ title: "Error", description: "Business Name is required.", variant: "destructive" });
        setIsLoading(false); return;
    }
    if (!formData.registrationNumber) {
        const regLabel = submitterType === "agency" ? "Agency Registration Number" : "CAC Registration No.";
        toast({ title: "Error", description: `${regLabel} is required.`, variant: "destructive" });
        setIsLoading(false); return;
    }

    const payload: any = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      password: formData.password,
      role: formData.role,
      submitterType: submitterType,
      companyName: formData.companyName,
      registrationNumber: formData.registrationNumber,
    };

    if (submitterType === "business") {
      if (!formData.sector || !formData.officeAddress || !formData.state || !formData.country || !formData.businessDescription) {
        toast({ title: "Error", description: "All business details are required for Business account type.", variant: "destructive" })
        setIsLoading(false); return;
      }
      payload.sector = formData.sector;
      payload.officeAddress = formData.officeAddress;
      payload.state = formData.state;
      payload.country = formData.country;
      payload.businessDescription = formData.businessDescription;
    }


    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        toast({ title: "Error", description: data.message || "Something went wrong.", variant: "destructive" })
        setIsLoading(false); return;
      }

      // toast({ title: "Success", description: "Account created successfully! Logging you in..." }) // Old message
      toast({ title: "Registration Successful!", description: "Please check your email to verify your account." });
      router.push("/auth/check-email"); // Redirect to check email page

      // const signInResponse = await signIn("credentials", { // REMOVED: No auto login
      //   redirect: false,
      //   email: formData.email,
      //   password: formData.password,
      // })

      // if (signInResponse?.error) {
      //   toast({ title: "Login Failed After Signup", description: signInResponse.error || "Could not log you in automatically.", variant: "destructive" })
      //   router.push("/login")
      // } else if (signInResponse?.ok) {
      //   router.push("/submitter/dashboard")
      // }
    } catch (error) {
      console.error("Signup error:", error)
      // Check if error is an instance of Error to access message property
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred during signup.";
      toast({ title: "Error", description: errorMessage, variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  if (status === "loading") return <div className="min-h-screen flex items-center justify-center bg-green-50 p-4"><p>Loading...</p></div>;
  if (status === "authenticated") return <div className="min-h-screen flex items-center justify-center bg-green-50 p-4"><p>Redirecting...</p></div>;

  const renderCommonFields = () => (
    <>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name (Auth. Rep.)</Label>
          <Input id="firstName" name="firstName" placeholder="John" value={formData.firstName} onChange={handleChange} required className="border-green-200 focus:border-green-500 focus:ring-green-500" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name (Auth. Rep.)</Label>
          <Input id="lastName" name="lastName" placeholder="Doe" value={formData.lastName} onChange={handleChange} required className="border-green-200 focus:border-green-500 focus:ring-green-500" />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" placeholder="you@example.com" value={formData.email} onChange={handleChange} required className="border-green-200 focus:border-green-500 focus:ring-green-500" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" value={formData.password} onChange={handleChange} required className="border-green-200 focus:border-green-500 focus:ring-green-500" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <Input id="confirmPassword" name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} required className="border-green-200 focus:border-green-500 focus:ring-green-500" />
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-50 p-4">
      <div className="w-full max-w-lg"> {/* Increased max-width for larger form */}
        <div className="flex justify-center mb-6">
          <Link href="/" className="flex items-center">
            <Shield className="h-8 w-8 text-green-600 mr-2" />
            <span className="text-2xl font-bold text-gray-900">AdScreener</span>
          </Link>
        </div>

        <Card className="border-green-100">
          <CardHeader>
            <CardTitle className="text-center">Create Submitter Account</CardTitle>
            <CardDescription className="text-center">Sign up as an Agency or Business to submit ads.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={submitterType} onValueChange={setSubmitterType} className="w-full">
              <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2">
                <TabsTrigger value="business">Business</TabsTrigger>
                <TabsTrigger value="agency">Agency</TabsTrigger>
              </TabsList>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4 pt-4">
                  {renderCommonFields()}

                  <TabsContent value="business" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="companyNameBusiness">Business Name</Label>
                      <Input id="companyNameBusiness" name="companyName" placeholder="Your Company LLC" value={formData.companyName} onChange={handleChange} required={submitterType === "business"} className="border-green-200 focus:border-green-500 focus:ring-green-500" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="registrationNumberBusiness">CAC Registration No.</Label>
                      <Input id="registrationNumberBusiness" name="registrationNumber" placeholder="RC123456" value={formData.registrationNumber} onChange={handleChange} required={submitterType === "business"} className="border-green-200 focus:border-green-500 focus:ring-green-500" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sector">Sector</Label>
                      <Select name="sector" onValueChange={(value) => handleSelectChange("sector", value)} value={formData.sector} required={submitterType === "business"}>
                        <SelectTrigger className="border-green-200 focus:border-green-500 focus:ring-green-500">
                          <SelectValue placeholder="Select a sector" />
                        </SelectTrigger>
                        <SelectContent>
                          {businessSectors.map((sector) => (
                            <SelectItem key={sector} value={sector}>{sector}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="officeAddress">Office Address</Label>
                      <Input id="officeAddress" name="officeAddress" placeholder="123 Main St, City" value={formData.officeAddress} onChange={handleChange} required={submitterType === "business"} className="border-green-200 focus:border-green-500 focus:ring-green-500" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                        <Label htmlFor="state">State</Label>
                        <Input id="state" name="state" placeholder="Lagos" value={formData.state} onChange={handleChange} required={submitterType === "business"} className="border-green-200 focus:border-green-500 focus:ring-green-500" />
                        </div>
                        <div className="space-y-2">
                        <Label htmlFor="country">Country</Label>
                        <Input id="country" name="country" placeholder="Nigeria" value={formData.country} onChange={handleChange} required={submitterType === "business"} className="border-green-200 focus:border-green-500 focus:ring-green-500" />
                        </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="businessDescription">Business Description</Label>
                      <Textarea id="businessDescription" name="businessDescription" placeholder="Briefly describe your business..." value={formData.businessDescription} onChange={handleChange} required={submitterType === "business"} className="border-green-200 focus:border-green-500 focus:ring-green-500" />
                    </div>
                  </TabsContent>

                  <TabsContent value="agency" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="companyNameAgency">Agency Name</Label>
                      <Input id="companyNameAgency" name="companyName" placeholder="Your Agency Ltd." value={formData.companyName} onChange={handleChange} required={submitterType === "agency"} className="border-green-200 focus:border-green-500 focus:ring-green-500" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="registrationNumberAgency">Agency Registration Number</Label>
                      <Input id="registrationNumberAgency" name="registrationNumber" placeholder="AGY007" value={formData.registrationNumber} onChange={handleChange} required={submitterType === "agency"} className="border-green-200 focus:border-green-500 focus:ring-green-500" />
                    </div>
                  </TabsContent>
                  
                  <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={isLoading}>
                    {isLoading ? "Creating Account..." : `Sign Up as ${submitterType.charAt(0).toUpperCase() + submitterType.slice(1)}`}
                  </Button>
                </div>
              </form>
            </Tabs>
          </CardContent>
          <CardFooter className="flex justify-center pt-4">
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
