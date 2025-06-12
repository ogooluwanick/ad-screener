"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowRight, CheckCircle, Clock, FileText, PlusCircle, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

// Mock data
const mockStats = {
  totalAds: 12,
  pendingReview: 3,
  approved: 8,
  rejected: 1,
}

const mockRecentAds = [
  {
    id: "1",
    title: "Summer Sale Campaign",
    submissionDate: "2023-06-15",
    status: "approved",
  },
  {
    id: "2",
    title: "New Product Launch",
    submissionDate: "2023-06-10",
    status: "rejected",
  },
  {
    id: "3",
    title: "Holiday Special",
    submissionDate: "2023-06-05",
    status: "pending",
  },
]

export default function SubmitterDashboard() {
  const [stats, setStats] = useState(mockStats)
  const [recentAds, setRecentAds] = useState(mockRecentAds)
  const [userEmail, setUserEmail] = useState("")

  useEffect(() => {
    // Get user email from localStorage in client component
    const email = localStorage.getItem("userEmail") || ""
    setUserEmail(email)
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "text-green-600"
      case "rejected":
        return "text-red-600"
      default:
        return "text-amber-600"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case "rejected":
        return <XCircle className="h-5 w-5 text-red-600" />
      default:
        return <Clock className="h-5 w-5 text-amber-600" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <div className="mt-2 sm:mt-0">
          <Link href="/submitter/submit">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <PlusCircle className="mr-2 h-4 w-4" />
              Submit New Ad
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Ads</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAds}</div>
            <p className="text-xs text-muted-foreground">Ads submitted</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingReview}</div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.approved}</div>
            <p className="text-xs text-muted-foreground">Ready for publication</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.rejected}</div>
            <p className="text-xs text-muted-foreground">Needs revision</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Recent Submissions</CardTitle>
            <CardDescription>Your most recently submitted ads</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentAds.map((ad) => (
                <div key={ad.id} className="flex items-center">
                  <div className="mr-4">{getStatusIcon(ad.status)}</div>
                  <div className="flex-1 space-y-1">
                    <p className="font-medium leading-none">{ad.title}</p>
                    <p className="text-sm text-muted-foreground">
                      Submitted on {new Date(ad.submissionDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className={`capitalize font-medium ${getStatusColor(ad.status)}`}>{ad.status}</div>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <Link href="/submitter/ads">
              <Button variant="outline" className="w-full">
                View All Ads
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardFooter>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Submission Stats</CardTitle>
            <CardDescription>Overview of your ad submission status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center">
                  <Clock className="mr-2 h-4 w-4 text-amber-600" />
                  <span>Pending</span>
                </div>
                <span>{stats.pendingReview} ads</span>
              </div>
              <Progress value={(stats.pendingReview / stats.totalAds) * 100} className="h-2 bg-amber-100" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center">
                  <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                  <span>Approved</span>
                </div>
                <span>{stats.approved} ads</span>
              </div>
              <Progress value={(stats.approved / stats.totalAds) * 100} className="h-2 bg-green-100" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center">
                  <XCircle className="mr-2 h-4 w-4 text-red-600" />
                  <span>Rejected</span>
                </div>
                <span>{stats.rejected} ads</span>
              </div>
              <Progress value={(stats.rejected / stats.totalAds) * 100} className="h-2 bg-red-100" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Welcome to AdScreener</CardTitle>
          <CardDescription>Get started with submitting your ads for review</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm">
            <p className="mb-4">
              Hello {userEmail}, welcome to your AdScreener dashboard. Here you can submit new ads for review, track the
              status of your submissions, and receive notifications about approval or rejection.
            </p>
            <p>
              To get started, click the "Submit New Ad" button above. Once your ad is submitted, our reviewers will
              evaluate it according to our guidelines and provide feedback.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-4">
          <Link href="/submitter/submit">
            <Button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700">Submit New Ad</Button>
          </Link>
          <Link href="#">
            <Button variant="outline" className="w-full sm:w-auto">
              View Guidelines
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
