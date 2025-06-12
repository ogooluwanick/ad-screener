"use client"

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, ExternalLink, Info, ListChecks } from "lucide-react";
import { ApprovedAdListItem } from "@/app/api/reviewer/ads/approved/route";
import { useNotifications } from "@/hooks/use-notifications";

export default function ApprovedAdsPage() {
  const { data: session, status: sessionStatus } = useSession();
  const [approvedAds, setApprovedAds] = useState<ApprovedAdListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchApprovedAds = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/reviewer/ads/approved');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error: ${response.status}`);
      }
      const data: ApprovedAdListItem[] = await response.json();
      setApprovedAds(data);
    } catch (err) {
      console.error("Failed to fetch approved ads:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const messageCallbacks = {
    DASHBOARD_REFRESH_REQUESTED: useCallback(() => {
      console.log('Approved ads list refresh triggered by WebSocket (DASHBOARD_REFRESH_REQUESTED).');
      fetchApprovedAds();
    }, [fetchApprovedAds]),
  };

  useNotifications(session?.user?.id, session?.user?.role as string, messageCallbacks);

  useEffect(() => {
    if (sessionStatus === "authenticated" && session?.user?.role === 'reviewer') {
      fetchApprovedAds();
    } else if (sessionStatus === "unauthenticated") {
      setError("Access Denied. Please log in as a reviewer.");
      setIsLoading(false);
    } else if (sessionStatus === "authenticated" && session?.user?.role !== 'reviewer') {
      setError("Access Denied. You do not have permission to view this page.");
      setIsLoading(false);
    }
  }, [session, sessionStatus, fetchApprovedAds]);

  if (isLoading) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-9 w-24" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-1/2 mb-2" />
            <Skeleton className="h-4 w-3/4" />
          </CardHeader>
          <CardContent>
            {[...Array(3)].map((_, i) => (
              <TableRow key={i} className="flex items-center space-x-4 p-2 border-b">
                <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                <TableCell className="text-right"><Skeleton className="h-8 w-28" /></TableCell>
              </TableRow>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] p-4 md:p-6 text-center">
        <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Error Loading Approved Ads</h2>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={fetchApprovedAds} variant="outline">
          <Info className="mr-2 h-4 w-4" /> Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Approved Ads</h1>
        <Button onClick={fetchApprovedAds} variant="outline" size="sm">
          Refresh List
        </Button>
      </div>

      {approvedAds.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <ListChecks className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium">No ads have been approved yet.</p>
            <p className="text-muted-foreground">Once ads are reviewed and approved, they will appear here.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Reviewed and Approved Ads</CardTitle>
            <CardDescription>
              The following ads have been approved.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Submitter</TableHead>
                  <TableHead>Approved On</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {approvedAds.map((ad) => (
                  <TableRow key={ad.id}>
                    <TableCell className="font-medium">{ad.title}</TableCell>
                    <TableCell>{ad.submitterEmail}</TableCell>
                    <TableCell>{new Date(ad.approvalDate).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(ad.contentUrl, '_blank')}
                        title="View Ad Content"
                      >
                        <ExternalLink className="h-4 w-4 mr-1 sm:mr-2" />
                        <span className="hidden sm:inline">View Content</span>
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
