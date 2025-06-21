"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { SubmitterDashboardData, SubmitterDashboardStats, SubmitterRecentAd } from "@/app/api/submitter/dashboard-data/route";
import { useNotifications } from "@/hooks/use-notifications";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, CheckCircle, Clock, FileText, PlusCircle, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

const initialStats: SubmitterDashboardStats = {
  totalAds: 0,
  pendingReview: 0,
  approved: 0,
  rejected: 0,
};

export default function SubmitterDashboard() {
  const { data: session, status: sessionStatus } = useSession();
  const [stats, setStats] = useState<SubmitterDashboardStats>(initialStats);
  const [recentAds, setRecentAds] = useState<SubmitterRecentAd[]>([]);
  // const [userEmail, setUserEmail] = useState(""); // Will use session.user.email
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    console.log("Attempting to fetch submitter dashboard data...");
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/submitter/dashboard-data');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error: ${response.status}`);
      }
      const data: SubmitterDashboardData = await response.json();
      setStats(data.stats);
      setRecentAds(data.recentAds);
    } catch (err) {
      console.error("Failed to fetch submitter dashboard data:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // The useNotifications hook (from @/hooks/use-notifications) is called here.
  // It primarily handles fetching/polling API-based notifications.
  // The previous WebSocket message callback logic has been removed as it was
  // incompatible with this specific hook's signature.
  useNotifications(session?.user?.id);

  useEffect(() => {
    if (sessionStatus === "loading") {
      setIsLoading(true);
      return;
    }
    if (session) {
      // setUserEmail(session.user?.email || "Submitter");
      fetchDashboardData();
    } else if (sessionStatus === "unauthenticated") {
      setIsLoading(false);
      setError("User session not found. Please log in.");
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-2/3" /> <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-7 w-1/3 mb-1" /> <Skeleton className="h-3 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="col-span-1">
            <CardHeader><Skeleton className="h-6 w-1/2" /><Skeleton className="h-4 w-3/4 mt-1" /></CardHeader>
            <CardContent className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center">
                  <Skeleton className="h-5 w-5 mr-4 rounded-full" />
                  <div className="flex-1 space-y-1"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-3 w-1/2" /></div>
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </CardContent>
            <CardFooter><Skeleton className="h-10 w-full" /></CardFooter>
          </Card>
          <Card className="col-span-1">
            <CardHeader><Skeleton className="h-6 w-1/2" /><Skeleton className="h-4 w-3/4 mt-1" /></CardHeader>
            <CardContent className="space-y-8">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex items-center justify-between text-sm"><Skeleton className="h-4 w-1/4" /><Skeleton className="h-4 w-1/4" /></div>
                  <Skeleton className="h-2 w-full" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader><Skeleton className="h-6 w-1/3" /><Skeleton className="h-4 w-2/3 mt-1" /></CardHeader>
          <CardContent><Skeleton className="h-4 w-full mb-2" /><Skeleton className="h-4 w-3/4" /></CardContent>
          <CardFooter className="flex flex-col sm:flex-row gap-4"><Skeleton className="h-10 w-full sm:w-auto" /><Skeleton className="h-10 w-full sm:w-auto" /></CardFooter>
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
        <Button onClick={fetchDashboardData}>Try Again</Button>
      </div>
    );
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

      {/* Stats Cards */}
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

      {/* Recent Submissions and Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Recent Submissions</CardTitle>
            <CardDescription>Your most recently submitted ads</CardDescription>
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
                        Submitted on {new Date(ad.submissionDate).toLocaleDateString()}
                        {ad.status === 'rejected' && ad.rejectionReason && (
                          <span className="block text-xs text-red-500">Reason: {ad.rejectionReason}</span>
                        )}
                      </p>
                    </div>
                    <div className={`capitalize font-medium ${getStatusColor(ad.status)}`}>{ad.status}</div>
                  </div>
                ))}
              </div>
            ) : (
               <p className="text-sm text-muted-foreground">No recent ad submissions.</p>
            )}
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
              Hello <span className="capitalize">{session?.user?.firstName || 'Submitter'}</span>, welcome to your AdScreener dashboard. Here you can submit new ads for review, track the
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
          <Link href="/submitter/guidelines">
            <Button variant="outline" className="w-full sm:w-auto">
              View Guidelines
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
