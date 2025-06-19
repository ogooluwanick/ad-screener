"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, Edit, Eye, Download, ExternalLink, FileText, Clock, CheckCircle, XCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Ad {
  _id: string;
  title: string;
  description: string;
  contentUrl: string;
  submitterId: string;
  submitterEmail: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  reviewedAt?: string;
  reviewerId?: string;
  rejectionReason?: string;
  assignedReviewerIds?: string[];
  adFileType?: string;
  adFileUrl?: string;
  supportingDocuments?: Array<{
    name: string;
    url: string;
  }>;
  compliance?: any;
}

interface EditAdData {
  title: string;
  description: string;
  status: string;
  rejectionReason: string;
  reviewerId: string;
}

const AdminAdsPage = () => {
  const { data: session, status: sessionStatus } = useSession();
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAd, setSelectedAd] = useState<Ad | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [editData, setEditData] = useState<EditAdData>({
    title: "",
    description: "",
    status: "",
    rejectionReason: "",
    reviewerId: "",
  });
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchAds = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/ads');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error: ${response.status}`);
      }
      const data = await response.json();
      setAds(data);
    } catch (err) {
      console.error("Failed to fetch ads:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (sessionStatus === "authenticated" && (session?.user?.role === 'admin' || session?.user?.role === 'superadmin')) {
      fetchAds();
    } else if (sessionStatus === "unauthenticated") {
      setError("Access Denied. Please log in as an admin.");
      setLoading(false);
    } else if (sessionStatus === "authenticated" && session?.user?.role !== 'admin' && session?.user?.role !== 'superadmin') {
      setError("Access Denied. You do not have permission to view this page.");
      setLoading(false);
    }
  }, [session, sessionStatus, fetchAds]);

  const handleEditAd = (ad: Ad) => {
    setSelectedAd(ad);
    setEditData({
      title: ad.title,
      description: ad.description,
      status: ad.status,
      rejectionReason: ad.rejectionReason || "",
      reviewerId: ad.reviewerId || "",
    });
    setIsEditModalOpen(true);
  };

  const handleViewDetails = (ad: Ad) => {
    setSelectedAd(ad);
    setIsDetailsModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setSelectedAd(null);
    setIsEditModalOpen(false);
    setEditData({
      title: "",
      description: "",
      status: "",
      rejectionReason: "",
      reviewerId: "",
    });
  };

  const handleCloseDetailsModal = () => {
    setSelectedAd(null);
    setIsDetailsModalOpen(false);
  };

  const handleUpdateAd = async () => {
    if (!selectedAd) return;

    setIsUpdating(true);
    try {
      const response = await fetch("/api/admin/update-ad", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          adId: selectedAd._id,
          ...editData,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update ad");
      }

      toast({
        title: "Ad Updated",
        description: "Ad information has been updated successfully.",
      });

      handleCloseEditModal();
      fetchAds(); // Refresh the list
    } catch (error) {
      console.error("Failed to update ad:", error);
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update ad",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "text-green-600 bg-green-50";
      case "rejected":
        return "text-red-600 bg-red-50";
      case "pending":
        return "text-amber-600 bg-amber-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-4 w-4" />;
      case "rejected":
        return <XCircle className="h-4 w-4" />;
      case "pending":
        return <Clock className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getCloudinaryDownloadUrl = (url: string, filename?: string): string => {
    if (!url) return '#';
    const parts = url.split('/upload/');
    if (parts.length !== 2) return url;
    const transformation = 'fl_attachment';
    return `${parts[0]}/upload/${transformation}/${parts[1]}`;
  };

  if (loading) {
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
            {[...Array(5)].map((_, i) => (
              <TableRow key={i} className="flex items-center space-x-4 p-2 border-b">
                <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                <TableCell className="text-right"><Skeleton className="h-8 w-20" /></TableCell>
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
        <h2 className="text-xl font-semibold mb-2">Error Loading Ads</h2>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={fetchAds} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Ad Management</h1>
        <Button onClick={fetchAds} variant="outline" size="sm">
          Refresh List
        </Button>
      </div>

      {ads.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium">No ads found.</p>
            <p className="text-muted-foreground">Ads will appear here once they are submitted.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All Ads</CardTitle>
            <CardDescription>
              Manage all submitted ads. View details or edit ad information and review status.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Submitter</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Reviewed</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ads.map((ad) => (
                  <TableRow key={ad._id}>
                    <TableCell className="font-medium">{ad.title}</TableCell>
                    <TableCell>{ad.submitterEmail}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(ad.status)}`}>
                        {getStatusIcon(ad.status)}
                        {ad.status}
                      </span>
                    </TableCell>
                    <TableCell>{new Date(ad.submittedAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {ad.reviewedAt ? new Date(ad.reviewedAt).toLocaleDateString() : "Not reviewed"}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleViewDetails(ad)}
                        title="View Details"
                      >
                        <Eye className="h-4 w-4 mr-1 sm:mr-2" />
                        <span className="hidden sm:inline">View</span>
                      </Button>
                      <Button 
                        variant="default" 
                        size="sm" 
                        onClick={() => handleEditAd(ad)}
                        className="bg-blue-600 hover:bg-blue-700"
                        title="Edit Ad"
                      >
                        <Edit className="h-4 w-4 mr-1 sm:mr-2" />
                        <span className="hidden sm:inline">Edit</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Edit Ad Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={(isOpen: boolean) => { if (!isOpen) handleCloseEditModal(); else setIsEditModalOpen(true); }}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Ad: {selectedAd?.title}</DialogTitle>
            <DialogDescription>
              Update ad information and review status. Changes will be applied immediately.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Ad Title</Label>
              <Input
                id="title"
                value={editData.title}
                onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                placeholder="Ad title"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Ad Description</Label>
              <Textarea
                id="description"
                value={editData.description}
                onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                placeholder="Ad description"
                rows={4}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={editData.status} onValueChange={(value) => setEditData({ ...editData, status: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="reviewerId">Reviewer ID</Label>
              <Input
                id="reviewerId"
                value={editData.reviewerId}
                onChange={(e) => setEditData({ ...editData, reviewerId: e.target.value })}
                placeholder="Reviewer ID (optional)"
              />
            </div>
            
            {editData.status === "rejected" && (
              <div className="space-y-2">
                <Label htmlFor="rejectionReason">Rejection Reason</Label>
                <Textarea
                  id="rejectionReason"
                  value={editData.rejectionReason}
                  onChange={(e) => setEditData({ ...editData, rejectionReason: e.target.value })}
                  placeholder="Reason for rejection"
                  rows={3}
                />
              </div>
            )}
          </div>
          
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleUpdateAd} disabled={isUpdating}>
              {isUpdating ? "Updating..." : "Update Ad"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Details Modal */}
      <Dialog open={isDetailsModalOpen} onOpenChange={(isOpen: boolean) => { if (!isOpen) handleCloseDetailsModal(); else setIsDetailsModalOpen(true); }}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Ad Details: {selectedAd?.title}</DialogTitle>
            <DialogDescription>
              Complete information about the ad submission.
            </DialogDescription>
          </DialogHeader>
          
          {selectedAd && (
            <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto !px-2">
              <div>
                <h3 className="font-semibold mb-1">Ad Title:</h3>
                <p className="text-sm text-muted-foreground">{selectedAd.title}</p>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Ad Description:</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedAd.description}</p>
              </div>
              
              <div>
                <h3 className="font-semibold mb-1">Ad File:</h3>
                {selectedAd.adFileType === 'image' && selectedAd.adFileUrl && (
                  <div className="mt-2 border rounded-md overflow-hidden max-w-md mx-auto">
                    <img 
                      src={selectedAd.adFileUrl} 
                      alt={`Ad file for ${selectedAd.title}`} 
                      className="w-full h-auto object-contain" 
                    />
                  </div>
                )}
                {selectedAd.adFileType === 'video' && selectedAd.adFileUrl && (
                  <div className="mt-2 border rounded-md overflow-hidden max-w-md mx-auto">
                    <video controls src={selectedAd.adFileUrl} className="w-full h-auto object-contain">
                      Your browser does not support the video tag.
                    </video>
                  </div>
                )}
                {selectedAd.adFileType === 'pdf' && selectedAd.adFileUrl && (
                  <div className="my-2">
                      <Button asChild variant="outline">
                        <a href={selectedAd.adFileUrl} target="_blank" rel="noopener noreferrer">View PDF <ExternalLink className="inline h-3 w-3 ml-1" /></a>
                      </Button>
                  </div>
                )}
                {(!selectedAd.adFileType || selectedAd.adFileType === 'other') && selectedAd.adFileUrl && (
                  <p className="text-sm text-muted-foreground">
                    Ad file: <a href={selectedAd.adFileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{selectedAd.adFileUrl} <ExternalLink className="inline h-3 w-3 ml-1" /></a> (Preview not available)
                  </p>
                )}
                {!selectedAd.adFileUrl && (
                   <div className="mt-2 border rounded-md overflow-hidden max-w-md mx-auto bg-slate-100 flex items-center justify-center aspect-video">
                    <p className="text-sm text-gray-500">No ad file provided.</p>
                  </div>
                )}
              </div>

              {selectedAd.supportingDocuments && selectedAd.supportingDocuments.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-1">Supporting Documents:</h3>
                  <ul className="list-disc list-inside space-y-1 pl-4">
                    {selectedAd.supportingDocuments.map((doc, index) => (
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
                <p className="text-sm text-muted-foreground">{selectedAd.submitterEmail}</p>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Submitted On:</h3>
                <p className="text-sm text-muted-foreground">{new Date(selectedAd.submittedAt).toLocaleString()}</p>
              </div>
              {selectedAd.reviewedAt && (
                <div>
                  <h3 className="font-semibold mb-1">Reviewed On:</h3>
                  <p className="text-sm text-muted-foreground">{new Date(selectedAd.reviewedAt).toLocaleString()}</p>
                </div>
              )}
              {selectedAd.reviewerId && (
                <div>
                  <h3 className="font-semibold mb-1">Reviewed By (ID):</h3>
                  <p className="text-sm text-muted-foreground">{selectedAd.reviewerId}</p>
                </div>
              )}
              {selectedAd.rejectionReason && (
                <div>
                  <h3 className="font-semibold mb-1">Rejection Reason:</h3>
                  <p className="text-sm text-muted-foreground">{selectedAd.rejectionReason}</p>
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
};

export default AdminAdsPage; 