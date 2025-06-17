"use client"

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, ExternalLink, Info, ListChecks, RotateCcw } from "lucide-react";
import Link from "next/link"; // Import Link
import { RejectedAdListItem } from "@/app/api/reviewer/ads/rejected/route"; 
import { useNotifications } from "@/hooks/use-notifications";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";

export default function RejectedAdsPage() {
  const { data: session, status: sessionStatus } = useSession();
  const [rejectedAds, setRejectedAds] = useState<RejectedAdListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAd, setSelectedAd] = useState<RejectedAdListItem | null>(null);
  const [isReevaluationDialogOpen, setIsReevaluationDialogOpen] = useState(false);
  const [reevaluationReason, setReevaluationReason] = useState("");

  const fetchRejectedAds = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/reviewer/ads/rejected'); 
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error: ${response.status}`);
      }
      const data: RejectedAdListItem[] = await response.json();
      setRejectedAds(data);
    } catch (err) {
      console.error("Failed to fetch rejected ads:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Corrected: useNotifications only takes userId.
  const { refetchNotifications } = useNotifications(session?.user?.id);
  // WebSocket messageCallbacks (and the messageCallbacks object itself) are removed as they are not used by the current useNotifications hook.
  // If WebSocket functionality is needed, it should be implemented separately.
  
  useEffect(() => {
    // Placeholder for potential WebSocket integration if messageCallbacks are for that
    // const handleDashboardRefresh = () => {
    //   console.log('Rejected ads list refresh triggered by WebSocket.');
    //   fetchRejectedAds();
    // };
    // someWebSocketService.on('DASHBOARD_REFRESH_REQUESTED', handleDashboardRefresh);
    // return () => someWebSocketService.off('DASHBOARD_REFRESH_REQUESTED', handleDashboardRefresh);
  }, [fetchRejectedAds]);

  useEffect(() => {
    if (sessionStatus === "authenticated" && session?.user?.role === 'reviewer') {
      fetchRejectedAds();
    } else if (sessionStatus === "unauthenticated") {
      setError("Access Denied. Please log in as a reviewer.");
      setIsLoading(false);
    } else if (sessionStatus === "authenticated" && session?.user?.role !== 'reviewer') {
      setError("Access Denied. You do not have permission to view this page.");
      setIsLoading(false);
    }
  }, [session, sessionStatus, fetchRejectedAds]);

  const handleReevaluate = (ad: RejectedAdListItem) => {
    setSelectedAd(ad);
    setReevaluationReason(ad.rejectionReason || "");
    setIsReevaluationDialogOpen(true);
  };

  const handleReevaluationSubmit = async () => {
    if (!selectedAd) return;

    try {
      const response = await fetch(`/api/reviewer/ads/${selectedAd.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          status: 'pending', // Change status back to pending
          rejectionReason: reevaluationReason, // Update or clear rejection reason
          // Potentially add a note that this is a re-evaluation
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update ad status");
      }

      toast({
        title: "Ad Sent for Re-evaluation",
        description: `Ad "${selectedAd.title}" has been moved to the pending queue.`,
      });
      setIsReevaluationDialogOpen(false);
      setSelectedAd(null);
      fetchRejectedAds(); // Refresh the list of rejected ads
    } catch (error) {
      console.error("Failed to re-evaluate ad:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Could not re-evaluate ad.",
        variant: "destructive",
      });
    }
  };


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
                <TableCell><Skeleton className="h-5 w-40" /></TableCell>
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
        <h2 className="text-xl font-semibold mb-2">Error Loading Rejected Ads</h2>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={fetchRejectedAds} variant="outline">
          <Info className="mr-2 h-4 w-4" /> Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Rejected Ads</h1>
        <Button onClick={fetchRejectedAds} variant="outline" size="sm">
          Refresh List
        </Button>
      </div>

      {rejectedAds.length === 0 && !isLoading ? ( // Added !isLoading to prevent flash of "No ads"
        <Card>
          <CardContent className="p-6 text-center">
            <ListChecks className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium">No ads have been rejected.</p>
            <p className="text-muted-foreground">Ads that are reviewed and rejected will appear here.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Reviewed and Rejected Ads</CardTitle>
            <CardDescription>
              The following ads have been rejected. You can choose to re-evaluate them.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Submitter</TableHead>
                  <TableHead>Rejected On</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rejectedAds.map((ad) => (
                  <TableRow key={ad.id}>
                    <TableCell className="font-medium">{ad.title}</TableCell>
                    <TableCell>
                      {/* Link to profile removed, displaying email as text */}
                      {ad.submitterEmail}
                    </TableCell>
                    <TableCell>{new Date(ad.rejectionDate).toLocaleDateString()}</TableCell>
                    <TableCell>{ad.rejectionReason || "N/A"}</TableCell>
                    <TableCell className="text-right space-x-2">
                      {ad.adFileUrl && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(ad.adFileUrl, '_blank')}
                          title="View Ad File"
                        >
                          <ExternalLink className="h-4 w-4 mr-1 sm:mr-2" />
                          <span className="hidden sm:inline">View Ad File</span>
                        </Button>
                      )}
                      <Button
                        variant="default" // Changed from ghost to default for blue color
                        size="sm"
                        onClick={() => handleReevaluate(ad)}
                        title="Re-evaluate Ad"
                      >
                        <RotateCcw className="h-4 w-4 mr-1 sm:mr-2" />
                        <span className="hidden sm:inline">Re-evaluate</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
       <Dialog open={isReevaluationDialogOpen} onOpenChange={setIsReevaluationDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Re-evaluate Ad: {selectedAd?.title}</DialogTitle>
            <DialogDescription>
              Review the ad details and provide a reason if you are moving it back to the pending queue. 
              The original rejection reason was: "{selectedAd?.rejectionReason || 'Not specified'}"
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="reevaluation-reason" className="text-right">
                New Reason (Optional)
              </Label>
              <Textarea
                id="reevaluation-reason"
                value={reevaluationReason}
                onChange={(e) => setReevaluationReason(e.target.value)}
                className="col-span-3"
                placeholder="Enter reason for re-evaluation (e.g., submitter provided more info)"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsReevaluationDialogOpen(false)}>Cancel</Button>
            <Button type="submit" onClick={handleReevaluationSubmit}>Send to Pending</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
