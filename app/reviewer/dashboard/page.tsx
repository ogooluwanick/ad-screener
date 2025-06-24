"use client"

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { ReviewerDashboardData, ReviewerDashboardStats, RecentAd } from "@/app/api/reviewer/dashboard-data/route"; // Import interfaces
import { Skeleton } from "@/components/ui/skeleton"; // For loading state
import Link from "next/link";
import { useNotifications } from "@/hooks/use-notifications";
import { ArrowRight, CheckCircle, Clock, FileText, Users, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

const initialStats: ReviewerDashboardStats = {
  totalAds: 0,
  pendingReview: 0,
  approved: 0,
  rejected: 0,
  totalSubmitters: 0,
};

export default function ReviewerDashboard() {
  const { data: session, status: sessionStatus } = useSession();
  const [stats, setStats] = useState<ReviewerDashboardStats>(initialStats);
  const [recentAds, setRecentAds] = useState<RecentAd[]>([]);
  // const [userEmail, setUserEmail] = useState(""); // Removed, will use session.user.email
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    console.log("Attempting to fetch dashboard data...");
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/reviewer/dashboard-data');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error: ${response.status}`);
      }
      const data: ReviewerDashboardData = await response.json();
      setStats(data.stats);
      setRecentAds(data.recentAds);
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setIsLoading(false);
    }
  }, []); // Empty dependency array as it doesn't depend on props/state from this component's scope

  // Setup WebSocket notifications
  const messageCallbacks = {
    DASHBOARD_REFRESH_REQUESTED: useCallback(() => {
      console.log('DASHBOARD_REFRESH_REQUESTED received via WebSocket, refetching data.');
      fetchDashboardData();
    }, [fetchDashboardData]), // Dependency: fetchDashboardData
  };

  const userIdForNotifications = session?.user?.id;
  // Assuming role is available in session.user.role, adjust if it's stored differently
  const userRoleForNotifications = session?.user?.role as string | undefined;

  useNotifications(userIdForNotifications, userRoleForNotifications, messageCallbacks);

  useEffect(() => {
    if (sessionStatus === "loading") {
      setIsLoading(true); // Show loading indicator while session is being fetched
      return;
    }

    if (session) {
      // setUserEmail(session.user?.email || "Reviewer"); // Set user email from session
      fetchDashboardData();
    } else if (sessionStatus === "unauthenticated") {
      // Handle case where user is not logged in
      setIsLoading(false);
      setError("User session not found. Please log in to view the dashboard.");
    }
  }, [session, sessionStatus, fetchDashboardData]);

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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-10 w-48 mt-2 sm:mt-0" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {[...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-7 w-1/3 mb-1" />
                <Skeleton className="h-3 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="col-span-1">
            <CardHeader>
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-4 w-3/4 mt-1" />
            </CardHeader>
            <CardContent className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center">
                  <Skeleton className="h-5 w-5 mr-4 rounded-full" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </CardContent>
            <CardFooter>
              <Skeleton className="h-10 w-full" />
            </CardFooter>
          </Card>
          <Card className="col-span-1">
            <CardHeader>
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-4 w-3/4 mt-1" />
            </CardHeader>
            <CardContent className="space-y-8">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-4 w-1/4" />
                  </div>
                  <Skeleton className="h-2 w-full" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-4 w-2/3 mt-1" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row gap-4">
            <Skeleton className="h-10 w-full sm:w-auto" />
            <Skeleton className="h-10 w-full sm:w-auto" />
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <XCircle className="h-16 w-16 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Error Loading Dashboard</h2>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={fetchDashboardData}>
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Reviewer Dashboard</h1>
        <div className="mt-2 sm:mt-0">
          <Link href="/reviewer/pending">
            <Button className="bg-green-600 hover:bg-green-700">
              <Clock className="mr-2 h-4 w-4" />
              Review Pending Ads
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
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

      {/* Recent Submissions and Review Statistics */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Recent Submissions</CardTitle>
            <CardDescription>Latest ads awaiting review</CardDescription>
          </CardHeader>
          <CardContent>
            {recentAds.length > 0 ? (
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
            ) : (
              <p className="text-sm text-muted-foreground">No recent pending submissions.</p>
            )}
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
              Hello <span className="capitalize">{session?.user?.firstName || 'Reviewer'}</span>, welcome to your reviewer dashboard. As a reviewer, you play a crucial role in
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
            <Button className="w-full sm:w-auto bg-green-600 hover:bg-green-700">Review Pending Ads</Button>
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
