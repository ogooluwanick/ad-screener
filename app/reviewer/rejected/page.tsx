"use client"

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, Download, ExternalLink, Info, ListChecks, Eye, RotateCcw } from "lucide-react"; // Added Download & Eye
import Link from "next/link"; // Import Link
import { RejectedAdListItem } from "@/app/api/reviewer/ads/rejected/route"; 
import { useNotifications } from "@/hooks/use-notifications";
import {
  Dialog,
  DialogClose,
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
  const [selectedAdForDetails, setSelectedAdForDetails] = useState<RejectedAdListItem | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  // For the re-evaluation functionality within the details modal
  const [newRejectionReasonForReevaluation, setNewRejectionReasonForReevaluation] = useState("");

  const getCloudinaryDownloadUrl = (url: string, filename?: string): string => {
    if (!url) return '#';
    const parts = url.split('/upload/');
    if (parts.length !== 2) return url; // Not a standard Cloudinary upload URL
    const transformation = 'fl_attachment';
    return `${parts[0]}/upload/${transformation}/${parts[1]}`;
  };

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

  const { refetchNotifications } = useNotifications(session?.user?.id);
  
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

  const handleOpenDetailsModal = (ad: RejectedAdListItem) => {
    setSelectedAdForDetails(ad);
    setNewRejectionReasonForReevaluation(ad.rejectionReason || ""); // Pre-fill with current reason for potential re-evaluation
    setIsDetailsModalOpen(true);
  };

  const handleCloseDetailsModal = () => {
    setSelectedAdForDetails(null);
    setIsDetailsModalOpen(false);
    setNewRejectionReasonForReevaluation("");
  };

  const handleReevaluationSubmit = async () => {
    if (!selectedAdForDetails) return;

    try {
      const response = await fetch(`/api/reviewer/ads/${selectedAdForDetails.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          status: 'pending', 
          rejectionReason: newRejectionReasonForReevaluation, // Use the potentially modified reason
          reviewerId: session?.user?.id, // Ensure reviewerId is passed for the update
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update ad status for re-evaluation");
      }

      toast({
        title: "Ad Sent for Re-evaluation",
        description: `Ad "${selectedAdForDetails.title}" has been moved to the pending queue.`,
      });
      handleCloseDetailsModal();
      fetchRejectedAds(); 
    } catch (error) {
      console.error("Failed to re-evaluate ad:", error);
      toast({
        title: "Re-evaluation Error",
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
                    <TableCell className="max-w-xs truncate" title={ad.rejectionReason || undefined }>{ad.rejectionReason || "N/A"}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleOpenDetailsModal(ad)}
                        className="bg-blue-600 hover:bg-blue-700"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4 mr-1 sm:mr-2" />
                        <span className="hidden sm:inline">Details</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
      {/* Details Modal for Rejected Ads */}
      <Dialog open={isDetailsModalOpen} onOpenChange={(isOpen) => { if (!isOpen) handleCloseDetailsModal(); else setIsDetailsModalOpen(true); }}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Ad Details: {selectedAdForDetails?.title}</DialogTitle>
            <DialogDescription>
              Reviewing details of the rejected ad. You can optionally send it back to pending for re-evaluation.
            </DialogDescription>
          </DialogHeader>
          
          {selectedAdForDetails && (
            <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto !px-2"> {/* Increased max-h */}
              <div>
                <h3 className="font-semibold mb-1">Ad Title:</h3>
                <p className="text-sm text-muted-foreground">{selectedAdForDetails.title}</p>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Ad Description:</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedAdForDetails.description}</p>
              </div>
              
              <div>
                <h3 className="font-semibold mb-1">Ad File:</h3>
                {selectedAdForDetails.adFileType === 'image' && selectedAdForDetails.adFileUrl && (
                  <img src={selectedAdForDetails.adFileUrl} alt="Ad file" className="mt-1 border rounded-md max-w-full h-auto object-contain" />
                )}
                {selectedAdForDetails.adFileType === 'video' && selectedAdForDetails.adFileUrl && (
                  <video controls src={selectedAdForDetails.adFileUrl} className="mt-1 border rounded-md max-w-full h-auto object-contain">Your browser does not support the video tag.</video>
                )}
                {selectedAdForDetails.adFileType === 'pdf' && selectedAdForDetails.adFileUrl && (
                  <Button asChild variant="outline" className="mt-1">
                    <a href={selectedAdForDetails.adFileUrl} target="_blank" rel="noopener noreferrer">View PDF <ExternalLink className="inline h-3 w-3 ml-1" /></a>
                  </Button>
                )}
                {(!selectedAdForDetails.adFileType || selectedAdForDetails.adFileType === 'other') && selectedAdForDetails.adFileUrl && (
                  <p className="text-sm text-muted-foreground mt-1">
                    <a href={selectedAdForDetails.adFileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">View Ad File <ExternalLink className="inline h-3 w-3 ml-1" /></a> (Preview not available)
                  </p>
                )}
                 {!selectedAdForDetails.adFileUrl && <p className="text-sm text-muted-foreground mt-1">No ad file provided.</p>}
              </div>

              {selectedAdForDetails.supportingDocuments && selectedAdForDetails.supportingDocuments.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-1">Supporting Documents:</h3>
                  <ul className="list-disc list-inside space-y-1 pl-4">
                    {selectedAdForDetails.supportingDocuments.map((doc, index) => (
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

              <hr className="my-3"/>
              <div>
                <h3 className="font-semibold mb-1 text-red-700">Rejection Reason:</h3>
                <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md whitespace-pre-wrap border border-red-200">{selectedAdForDetails.rejectionReason || "No reason provided."}</p>
              </div>
               <div>
                <h3 className="font-semibold mb-1">Rejected On:</h3>
                <p className="text-sm text-muted-foreground">{new Date(selectedAdForDetails.rejectionDate).toLocaleString()}</p>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Submitted By:</h3>
                <p className="text-sm text-muted-foreground">{selectedAdForDetails.submitterEmail}</p>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Submitted On:</h3>
                <p className="text-sm text-muted-foreground">{new Date(selectedAdForDetails.submissionDate).toLocaleString()}</p>
              </div>
              {selectedAdForDetails.reviewerId && (
                 <div>
                    <h3 className="font-semibold mb-1">Rejected By (Reviewer ID):</h3>
                    <p className="text-sm text-muted-foreground">{selectedAdForDetails.reviewerId}</p>
                 </div>
              )}
              <hr className="my-3"/>
              <div>
                <Label htmlFor="newRejectionReason" className="font-semibold text-gray-700">New/Updated Reason for Re-evaluation (Optional):</Label>
                <Textarea
                  id="newRejectionReason"
                  value={newRejectionReasonForReevaluation}
                  onChange={(e) => setNewRejectionReasonForReevaluation(e.target.value)}
                  className="mt-1"
                  placeholder="If sending back to pending, you can update the reason here or leave it as is."
                  rows={3}
                />
                 <p className="text-xs text-gray-500 mt-1">This reason will be saved if you send the ad for re-evaluation.</p>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0 pt-4 border-t">
             <Button 
                variant="outline" 
                onClick={handleReevaluationSubmit}
                disabled={!selectedAdForDetails}
                className="border-orange-500 text-orange-600 hover:bg-orange-50 hover:text-orange-700"
              >
                <RotateCcw className="mr-2 h-4 w-4" /> Send to Pending
              </Button>
            <DialogClose asChild>
              <Button variant="default">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
