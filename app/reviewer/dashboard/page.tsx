"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowRight, CheckCircle, Clock, FileText, Users, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

// Mock data
const mockStats = {
  totalAds: 45,
  pendingReview: 12,
  approved: 28,
  rejected: 5,
  totalSubmitters: 23,
}

const mockRecentAds = [
  {
    id: "1",
    title: "Holiday Special",
    submitter: "john@example.com",
    submissionDate: "2023-06-15",
    status: "pending",
  },
  {
    id: "2",
    title: "Flash Sale",
    submitter: "jane@example.com",
    submissionDate: "2023-06-14",
    status: "pending",
  },
  {
    id: "3",
    title: "New Product Launch",
    submitter: "mike@example.com",
    submissionDate: "2023-06-13",
    status: "pending",
  },
]

export default function ReviewerDashboard() {
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
        <h1 className="text-2xl font-bold tracking-tight">Reviewer Dashboard</h1>
        <div className="mt-2 sm:mt-0">
          <Link href="/reviewer/pending">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Clock className="mr-2 h-4 w-4" />
              Review Pending Ads
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Ads</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAds}</div>
            <p className="text-xs text-muted-foreground">All submissions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingReview}</div>
            <p className="text-xs text-muted-foreground">Awaiting review</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.approved}</div>
            <p className="text-xs text-muted-foreground">Approved ads</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.rejected}</div>
            <p className="text-xs text-muted-foreground">Rejected ads</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Submitters</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSubmitters}</div>
            <p className="text-xs text-muted-foreground">Active users</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Recent Submissions</CardTitle>
            <CardDescription>Latest ads awaiting review</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentAds.map((ad) => (
                <div key={ad.id} className="flex items-center">
                  <div className="mr-4">{getStatusIcon(ad.status)}</div>
                  <div className="flex-1 space-y-1">
                    <p className="font-medium leading-none">{ad.title}</p>
                    <p className="text-sm text-muted-foreground">
                      By {ad.submitter} • {new Date(ad.submissionDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className={`capitalize font-medium ${getStatusColor(ad.status)}`}>{ad.status}</div>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <Link href="/reviewer/pending">
              <Button variant="outline" className="w-full">
                Review All Pending
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardFooter>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Review Statistics</CardTitle>
            <CardDescription>Overview of ad review status</CardDescription>
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
              <Progress
                value={(stats.pendingReview / stats.totalAds) * 100}
                className="h-2 bg-amber-100"
                indicatorClassName="bg-amber-600"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center">
                  <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                  <span>Approved</span>
                </div>
                <span>{stats.approved} ads</span>
              </div>
              <Progress
                value={(stats.approved / stats.totalAds) * 100}
                className="h-2 bg-green-100"
                indicatorClassName="bg-green-600"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center">
                  <XCircle className="mr-2 h-4 w-4 text-red-600" />
                  <span>Rejected</span>
                </div>
                <span>{stats.rejected} ads</span>
              </div>
              <Progress
                value={(stats.rejected / stats.totalAds) * 100}
                className="h-2 bg-red-100"
                indicatorClassName="bg-red-600"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Welcome, Reviewer</CardTitle>
          <CardDescription>Manage ad submissions and maintain quality standards</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm">
            <p className="mb-4">
              Hello {userEmail}, welcome to your reviewer dashboard. As a reviewer, you play a crucial role in
              maintaining the quality and standards of advertisements on our platform.
            </p>
            <p>
              You currently have {stats.pendingReview} ads awaiting review. Click "Review Pending Ads" to start
              reviewing submissions and help submitters get their ads approved quickly.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-4">
          <Link href="/reviewer/pending">
            <Button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700">Review Pending Ads</Button>
          </Link>
          <Link href="#">
            <Button variant="outline" className="w-full sm:w-auto">
              Review Guidelines
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
