"use client"

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, CheckCircle, Eye, ExternalLink, Info, XCircle } from "lucide-react";
import { PendingAdListItem } from "@/app/api/reviewer/ads/pending/route"; // Import the interface
import { useNotifications } from "@/hooks/use-notifications";
import { Badge } from "@/components/ui/badge"; // For status, if needed, though all are 'pending'

export default function PendingAdsPage() {
  const { data: session, status: sessionStatus } = useSession();
  const [pendingAds, setPendingAds] = useState<PendingAdListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAdForReview, setSelectedAdForReview] = useState<PendingAdListItem | null>(null); // For a modal/detail view

  const fetchPendingAds = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/reviewer/ads/pending');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error: ${response.status}`);
      }
      const data: PendingAdListItem[] = await response.json();
      setPendingAds(data);
    } catch (err) {
      console.error("Failed to fetch pending ads:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // WebSocket notifications
  const messageCallbacks = {
    DASHBOARD_REFRESH_REQUESTED: useCallback(() => { // Re-using dashboard refresh for pending list for now
      console.log('Pending ads list refresh triggered by WebSocket.');
      fetchPendingAds();
    }, [fetchPendingAds]),
  };

  useNotifications(session?.user?.id, session?.user?.role as string, messageCallbacks);

  useEffect(() => {
    if (sessionStatus === "authenticated" && session?.user?.role === 'reviewer') {
      fetchPendingAds();
    } else if (sessionStatus === "unauthenticated") {
      setError("Access Denied. Please log in as a reviewer.");
      setIsLoading(false);
    } else if (sessionStatus === "authenticated" && session?.user?.role !== 'reviewer') {
      setError("Access Denied. You do not have permission to view this page.");
      setIsLoading(false);
    }
  }, [session, sessionStatus, fetchPendingAds]);

  // Modal/dialog functions for ad review (simplified for now)
  const handleReviewAd = (ad: PendingAdListItem) => {
    // This would typically open a modal or navigate to a detailed review page
    // For now, we'll just log it or set it for a simple display.
    // Router.push(`/reviewer/review/${ad.id}`) // Example navigation
    setSelectedAdForReview(ad);
    // For a real review UI, you'd likely have a modal here.
    // For simplicity, we'll just use an alert or log.
    alert(`Reviewing Ad: ${ad.title}\nID: ${ad.id}\n\n(Full review UI would open here)`);
    // TODO: Implement actual review modal/page and PUT request to /api/reviewer/ads/[adId]
  };


  if (isLoading) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <Skeleton className="h-8 w-1/3" />
        <Card>
          <CardHeader><Skeleton className="h-6 w-1/4" /></CardHeader>
          <CardContent>
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4 p-2 border-b">
                <Skeleton className="h-10 w-1/4" />
                <Skeleton className="h-10 w-1/4" />
                <Skeleton className="h-10 w-1/4" />
                <Skeleton className="h-10 w-1/4" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 md:p-6 text-center">
        <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Error Loading Pending Ads</h2>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={fetchPendingAds} variant="outline">
          <Info className="mr-2 h-4 w-4" /> Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Pending Ad Reviews</h1>
        <Button onClick={fetchPendingAds} variant="outline" size="sm">
          Refresh List
        </Button>
      </div>

      {pendingAds.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <p className="text-lg font-medium">No ads currently pending review.</p>
            <p className="text-muted-foreground">Great job, or perhaps it's a quiet day!</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Ads Awaiting Review</CardTitle>
            <CardDescription>
              The following ads are pending your review. Please assess them according to the guidelines.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Submitter</TableHead>
                  <TableHead>Submitted On</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingAds.map((ad) => (
                  <TableRow key={ad.id}>
                    <TableCell className="font-medium">{ad.title}</TableCell>
                    <TableCell>{ad.submitterEmail}</TableCell>
                    <TableCell>{new Date(ad.submissionDate).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right space-x-2">
                       <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(ad.contentUrl, '_blank')}
                        title="View Ad Content"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="default" 
                        size="sm" 
                        onClick={() => handleReviewAd(ad)}
                        className="bg-blue-600 hover:bg-blue-700"
                        title="Review Ad Details"
                      >
                        <Eye className="h-4 w-4 mr-1 sm:mr-2" />
                        <span className="hidden sm:inline">Review</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
