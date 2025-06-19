"use client"

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, CheckCircle, Download, Eye, ExternalLink, Info, Send, ThumbsDown, ThumbsUp, XCircle } from "lucide-react"; // Added Download
import { PendingAdListItem } from "@/app/api/reviewer/ads/pending/route"; // Import the interface
import { useNotifications } from "@/hooks/use-notifications";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog"; // Added Dialog components
import { Textarea } from "@/components/ui/textarea"; // Added Textarea
import { Label } from "@/components/ui/label"; // Added Label
import { toast } from "@/components/ui/use-toast"; // For notifications
import ComplianceForm, { ComplianceFormData } from "@/components/compliance-form"; // Added ComplianceForm

export default function PendingAdsPage() {
  const { data: session, status: sessionStatus } = useSession();
  const [pendingAds, setPendingAds] = useState<PendingAdListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAdForReview, setSelectedAdForReview] = useState<PendingAdListItem | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [complianceData, setComplianceData] = useState<ComplianceFormData | null>(null);
  const [showComplianceFormStep, setShowComplianceFormStep] = useState(true); // Initially show compliance form

  const getCloudinaryDownloadUrl = (url: string, filename?: string): string => {
    if (!url) return '#';
    const parts = url.split('/upload/');
    if (parts.length !== 2) return url; // Not a standard Cloudinary upload URL
    const transformation = 'fl_attachment';
    return `${parts[0]}/upload/${transformation}/${parts[1]}`;
  };

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

  // Corrected: useNotifications only takes userId. WebSocket callbacks need separate handling if still used.
  const { refetchNotifications } = useNotifications(session?.user?.id); 
  // If DASHBOARD_REFRESH_REQUESTED is still a valid WebSocket event you want to listen to,
  // you would need a separate WebSocket listener setup that calls fetchPendingAds.
  // For now, I'm assuming the primary notification mechanism is through polling or manual refresh.
  // If messageCallbacks were for a different system, that system needs to be checked.
  // The original useNotifications hook does not seem to use these messageCallbacks.

  useEffect(() => {
    // Example of how you might use a WebSocket event if it were set up elsewhere:
    // const handleDashboardRefresh = () => {
    //   console.log('Pending ads list refresh triggered by WebSocket.');
    //   fetchPendingAds();
    // };
    // someWebSocketService.on('DASHBOARD_REFRESH_REQUESTED', handleDashboardRefresh);
    // return () => someWebSocketService.off('DASHBOARD_REFRESH_REQUESTED', handleDashboardRefresh);
    // This is just a placeholder to illustrate. The actual implementation depends on your WebSocket setup.
  }, [fetchPendingAds]);


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

  const handleOpenReviewModal = (ad: PendingAdListItem) => {
    setSelectedAdForReview(ad);
    setRejectionReason(""); // Reset reason
    setComplianceData(null); // Reset compliance data
    setShowComplianceFormStep(true); // Reset to show compliance form step
    setIsReviewModalOpen(true);
  };

  const handleCloseReviewModal = () => {
    setSelectedAdForReview(null);
    setIsReviewModalOpen(false);
    setRejectionReason("");
    setComplianceData(null);
    setShowComplianceFormStep(true);
  };

  const submitReview = async (adId: string, status: 'approved' | 'rejected', reason?: string) => {
    if (!session?.user?.id) {
      toast({ title: "Error", description: "You must be logged in to review ads.", variant: "destructive" });
      return;
    }
    if (status === 'rejected' && !reason?.trim()) {
      toast({ title: "Validation Error", description: "Rejection reason is required.", variant: "destructive" });
      return;
    }
    if (!complianceData) {
      toast({ title: "Validation Error", description: "Compliance form must be submitted.", variant: "destructive" });
      return;
    }

    setIsSubmittingReview(true);
    try {
      const endpoint = status === 'approved' ? `/api/reviewer/ads/approved` : `/api/reviewer/ads/rejected`;
      const body: any = {
        adId,
        complianceData,
      };
      if (status === 'rejected') {
        body.rejectionReason = reason;
      }

      const response = await fetch(endpoint, {
        method: 'POST', // Changed from PUT
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to submit review: ${response.statusText}`);
      }

      toast({
        title: "Review Submitted",
        description: `Ad has been ${status}.`,
        variant: "default",
      });
      setPendingAds(prevAds => prevAds.filter(ad => ad.id !== adId)); // Remove from list
      handleCloseReviewModal();
    } catch (err) {
      console.error("Failed to submit review:", err);
      toast({
        title: "Review Submission Failed",
        description: err instanceof Error ? err.message : "An unknown error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingReview(false);
    }
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
                  <TableHead className="hidden md:table-cell">Email</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingAds.map((ad) => (
                  <TableRow key={ad.id}>
                    <TableCell className="font-medium">{ad.title}</TableCell>
                    <TableCell>
                      {/* Link to profile removed, displaying name/email as text */}
                      {ad.submitterName || ad.submitterEmail}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {/* Link to profile removed, displaying email as text */}
                      {ad.submitterEmail}
                    </TableCell>
                    <TableCell>{new Date(ad.submissionDate).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right space-x-2">
                       {/* Button to directly open contentUrl removed, review modal will show ad file */}
                      <Button 
                        variant="default" 
                        size="sm" 
                        onClick={() => handleOpenReviewModal(ad)}
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

      {/* Review Modal */}
      <Dialog open={isReviewModalOpen} onOpenChange={(isOpen: boolean) => { if (!isOpen) handleCloseReviewModal(); else setIsReviewModalOpen(true); }}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review Ad: {selectedAdForReview?.title}</DialogTitle>
            <DialogDescription>
              Carefully review the ad details and content before making a decision.
            </DialogDescription>
          </DialogHeader>
          
          {selectedAdForReview && (
            <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto !px-2">
              <div>
                <h3 className="font-semibold mb-1">Ad Title:</h3>
                <p className="text-sm text-muted-foreground">{selectedAdForReview.title}</p>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Ad Description:</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedAdForReview.description}</p>
              </div>
              {/* REMOVED Target URL display */}
              
              <div>
                <h3 className="font-semibold mb-1">Ad File:</h3>
                {selectedAdForReview.adFileType === 'image' && selectedAdForReview.adFileUrl && (
                  <div className="mt-2 border rounded-md overflow-hidden max-w-md mx-auto">
                    <img 
                      src={selectedAdForReview.adFileUrl} 
                      alt={`Ad file for ${selectedAdForReview.title}`} 
                      className="w-full h-auto object-contain" 
                    />
                  </div>
                )}
                {selectedAdForReview.adFileType === 'video' && selectedAdForReview.adFileUrl && (
                  <div className="mt-2 border rounded-md overflow-hidden max-w-md mx-auto">
                    <video controls src={selectedAdForReview.adFileUrl} className="w-full h-auto object-contain">
                      Your browser does not support the video tag.
                    </video>
                  </div>
                )}
                {selectedAdForReview.adFileType === 'pdf' && selectedAdForReview.adFileUrl && (
                  <div className="my-2">
                      <Button asChild variant="outline">
                        <a href={selectedAdForReview.adFileUrl} target="_blank" rel="noopener noreferrer">View PDF <ExternalLink className="inline h-3 w-3 ml-1" /></a>
                      </Button>
                  </div>
                )}
                {(!selectedAdForReview.adFileType || selectedAdForReview.adFileType === 'other') && selectedAdForReview.adFileUrl && (
                  <p className="text-sm text-muted-foreground">
                    Ad file: <a href={selectedAdForReview.adFileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{selectedAdForReview.adFileUrl} <ExternalLink className="inline h-3 w-3 ml-1" /></a> (Preview not available for this type)
                  </p>
                )}
                {!selectedAdForReview.adFileUrl && (
                   <div className="mt-2 border rounded-md overflow-hidden max-w-md mx-auto bg-slate-100 flex items-center justify-center aspect-video">
                    <p className="text-sm text-gray-500">No ad file provided.</p>
                  </div>
                )}
              </div>

              {selectedAdForReview.supportingDocuments && selectedAdForReview.supportingDocuments.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-1">Supporting Documents:</h3>
                  <ul className="list-disc list-inside space-y-1 pl-4">
                    {selectedAdForReview.supportingDocuments.map((doc, index) => (
                      <li key={index} className="text-sm">
                        <a 
                          href={getCloudinaryDownloadUrl(doc.url, doc.name)}
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-blue-600 hover:underline"
                          title={`Download ${doc.name}`}
                          download={doc.name}
                        >
                          {doc.name || `Document ${index + 1}`} <Download className="inline h-3 w-3 ml-1 opacity-75" />
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div>
                <h3 className="font-semibold mb-1">Submitted By:</h3>
                <p className="text-sm text-muted-foreground">{selectedAdForReview.submitterName || selectedAdForReview.submitterEmail} ({selectedAdForReview.submitterEmail})</p>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Submitted On:</h3>
                <p className="text-sm text-muted-foreground">{new Date(selectedAdForReview.submissionDate).toLocaleString()}</p>
              </div>

              <hr className="my-4" />

              {/* Compliance Form Integration */}
              <div className="my-4 p-4 border rounded-md bg-slate-50">
                <h3 className="text-lg font-semibold mb-3">Step 1: Complete Compliance Checklist</h3>
                <ComplianceForm
                  onSubmit={(data) => {
                    setComplianceData(data);
                    toast({ title: "Compliance Form Saved", description: "You can now proceed to approve or reject.", variant: "default" });
                    setShowComplianceFormStep(false); // Hide form, show approve/reject
                  }}
                  isSubmitting={isSubmittingReview} // Disable form while main review is submitting
                  // To prevent re-submission of compliance form if already submitted for this modal session
                  // We can hide its internal submit button if complianceData is already set.
                  // Or, the ComplianceForm itself can handle this.
                  // For now, the form's submit button will always be active unless isSubmittingReview is true.
                  // The parent controls enabling Approve/Reject based on complianceData state.
                />
              </div>
              
              <hr className="my-4" />

              <div className={`${complianceData ? '' : 'opacity-50 pointer-events-none'}`}>
                <h3 className="text-lg font-semibold mb-3">Step 2: Approve or Reject Ad</h3>
                {!complianceData && <p className="text-sm text-orange-600 mb-2"><Info size={14} className="inline mr-1" />Please complete and submit the compliance checklist above to enable these actions.</p>}
                <Label htmlFor="rejectionReason" className="font-semibold">Rejection Reason (Required if rejecting):</Label>
                <Textarea
                  id="rejectionReason"
                  placeholder="Provide a clear reason if rejecting the ad..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="mt-1"
                  rows={3}
                />
              </div>
            </div>
          )}
          
          <DialogFooter className="gap-2 sm:gap-0">
            <DialogClose asChild>
              <Button variant="outline" disabled={isSubmittingReview}>Cancel</Button>
            </DialogClose>
            <Button 
              variant="destructive" 
              onClick={() => selectedAdForReview && submitReview(selectedAdForReview.id, 'rejected', rejectionReason)}
              disabled={isSubmittingReview || !complianceData || (!!selectedAdForReview && !rejectionReason.trim())}
            >
              <ThumbsDown className="mr-2 h-4 w-4" /> Reject Ad
            </Button>
            <Button 
              className="bg-green-600 hover:bg-green-700"
              onClick={() => selectedAdForReview && submitReview(selectedAdForReview.id, 'approved')}
              disabled={isSubmittingReview || !complianceData}
            >
              <ThumbsUp className="mr-2 h-4 w-4" /> Approve Ad
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
