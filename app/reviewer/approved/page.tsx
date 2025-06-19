"use client"

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, Download, ExternalLink, Info, ListChecks, Eye } from "lucide-react"; // Added Download & Eye
import Link from "next/link"; // Import Link
import { ApprovedAdListItem } from "@/app/api/reviewer/ads/approved/route";
import { useNotifications } from "@/hooks/use-notifications";

export default function ApprovedAdsPage() {
  const { data: session, status: sessionStatus } = useSession();
  const [approvedAds, setApprovedAds] = useState<ApprovedAdListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAdForDetails, setSelectedAdForDetails] = useState<ApprovedAdListItem | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const getCloudinaryDownloadUrl = (url: string, filename?: string): string => {
    if (!url) return '#';
    const parts = url.split('/upload/');
    if (parts.length !== 2) return url;
    let transformation = 'fl_attachment';
    if (filename) {
      const sanitizedFilename = filename.replace(/[^a-zA-Z0-9_.-]/g, '_').substring(0, 100);
      transformation += `:${encodeURIComponent(sanitizedFilename)}`;
    }
    return `${parts[0]}/upload/${transformation}/${parts[1]}`;
  };

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

  // Corrected: useNotifications only takes userId.
  const { refetchNotifications } = useNotifications(session?.user?.id);
  // WebSocket messageCallbacks would need separate handling if still actively used.

  useEffect(() => {
    // Placeholder for potential WebSocket integration if messageCallbacks are for that
    // const handleDashboardRefresh = () => {
    //   console.log('Approved ads list refresh triggered by WebSocket.');
    //   fetchApprovedAds();
    // };
    // someWebSocketService.on('DASHBOARD_REFRESH_REQUESTED', handleDashboardRefresh);
    // return () => someWebSocketService.off('DASHBOARD_REFRESH_REQUESTED', handleDashboardRefresh);
  }, [fetchApprovedAds]);

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

  const handleOpenDetailsModal = (ad: ApprovedAdListItem) => {
    setSelectedAdForDetails(ad);
    setIsDetailsModalOpen(true);
  };

  const handleCloseDetailsModal = () => {
    setSelectedAdForDetails(null);
    setIsDetailsModalOpen(false);
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
                    <TableCell>
                      {ad.submitterEmail}
                    </TableCell>
                    <TableCell>{new Date(ad.approvalDate).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button 
                        variant="default" 
                        size="sm" 
                        onClick={() => handleOpenDetailsModal(ad)}
                        className="bg-blue-600 hover:bg-blue-700" // Consistent styling
                        title="View Ad Details"
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

      {/* Details Modal */}
      <Dialog open={isDetailsModalOpen} onOpenChange={(isOpen: boolean) => { if (!isOpen) handleCloseDetailsModal(); else setIsDetailsModalOpen(true); }}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Ad Details: {selectedAdForDetails?.title}</DialogTitle>
            <DialogDescription>
              Showing details for the approved ad.
            </DialogDescription>
          </DialogHeader>
          
          {selectedAdForDetails && (
            <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto !px-2">
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
                  <div className="mt-2 border rounded-md overflow-hidden max-w-md mx-auto">
                    <img 
                      src={selectedAdForDetails.adFileUrl} 
                      alt={`Ad file for ${selectedAdForDetails.title}`} 
                      className="w-full h-auto object-contain" 
                    />
                  </div>
                )}
                {selectedAdForDetails.adFileType === 'video' && selectedAdForDetails.adFileUrl && (
                  <div className="mt-2 border rounded-md overflow-hidden max-w-md mx-auto">
                    <video controls src={selectedAdForDetails.adFileUrl} className="w-full h-auto object-contain">
                      Your browser does not support the video tag.
                    </video>
                  </div>
                )}
                {selectedAdForDetails.adFileType === 'pdf' && selectedAdForDetails.adFileUrl && (
                  <div className="my-2">
                      <Button asChild variant="outline">
                        <a href={selectedAdForDetails.adFileUrl} target="_blank" rel="noopener noreferrer">View PDF <ExternalLink className="inline h-3 w-3 ml-1" /></a>
                      </Button>
                  </div>
                )}
                {(!selectedAdForDetails.adFileType || selectedAdForDetails.adFileType === 'other') && selectedAdForDetails.adFileUrl && (
                  <p className="text-sm text-muted-foreground">
                    Ad file: <a href={selectedAdForDetails.adFileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{selectedAdForDetails.adFileUrl} <ExternalLink className="inline h-3 w-3 ml-1" /></a> (Preview not available)
                  </p>
                )}
                {!selectedAdForDetails.adFileUrl && (
                   <div className="mt-2 border rounded-md overflow-hidden max-w-md mx-auto bg-slate-100 flex items-center justify-center aspect-video">
                    <p className="text-sm text-gray-500">No ad file provided.</p>
                  </div>
                )}
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

              <div>
                <h3 className="font-semibold mb-1">Submitted By:</h3>
                <p className="text-sm text-muted-foreground">{selectedAdForDetails.submitterEmail}</p>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Submitted On:</h3>
                <p className="text-sm text-muted-foreground">{new Date(selectedAdForDetails.submissionDate).toLocaleString()}</p>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Approved On:</h3>
                <p className="text-sm text-muted-foreground">{new Date(selectedAdForDetails.approvalDate).toLocaleString()}</p>
              </div>
              {selectedAdForDetails.reviewerId && (
                 <div>
                    <h3 className="font-semibold mb-1">Approved By (ID):</h3>
                    <p className="text-sm text-muted-foreground">{selectedAdForDetails.reviewerId}</p>
                 </div>
              )}
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
