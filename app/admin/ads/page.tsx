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
import { Checkbox } from "@/components/ui/checkbox"; // Added for multi-select
import { AlertTriangle, Edit, Eye, Download, ExternalLink, FileText, Clock, CheckCircle, XCircle, Search, ThumbsUp, ThumbsDown, Info as InfoIcon, MoreHorizontal, FileCheck } from "lucide-react"; // Added Search, ThumbsUp, ThumbsDown, InfoIcon, MoreHorizontal, FileCheck
import { toast } from "@/hooks/use-toast";
import ComplianceForm, { ComplianceFormData } from "@/components/compliance-form"; // Added ComplianceForm
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
// We'll use the existing Ad interface and adapt it if necessary, rather than importing PendingAdListItem directly for now.

interface User {
  _id: string;
  email: string;
  role: string;
  name?: string; // Optional: if available and useful
}

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
  reviewerId?: string; // This might become deprecated or represent the first/primary reviewer
  rejectionReason?: string;
  assignedReviewerIds?: string[];
  adFileType?: string;
  adFileUrl?: string;
  supportingDocuments?: Array<{
    name: string;
    url: string;
  }>;
  compliance?: any;
  mediaType?: string;
  vettingSpeed?: string;
  totalFeeNgn?: number;
}

interface EditAdData {
  title: string;
  description: string;
  status: string;
  rejectionReason: string;
  // reviewerId: string; // Will be replaced by assignedReviewerIds
  assignedReviewerIds: string[];
}

const AdminAdsPage = () => {
  const { data: session, status: sessionStatus } = useSession();
  const [ads, setAds] = useState<Ad[]>([]); // This will hold all ads
  const [allReviewers, setAllReviewers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState(""); // For reviewer search in edit modal
  const [filteredReviewers, setFilteredReviewers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for Edit Ad Modal
  const [selectedAdForEdit, setSelectedAdForEdit] = useState<Ad | null>(null); // Renamed from selectedAd
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editData, setEditData] = useState<EditAdData>({
    title: "",
    description: "",
    status: "",
    rejectionReason: "",
    assignedReviewerIds: [],
  });
  const [isUpdating, setIsUpdating] = useState(false);

  // State for View Details Modal
  const [selectedAdForDetails, setSelectedAdForDetails] = useState<Ad | null>(null); // New state for details modal
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // State for Review Ad Modal (copied from reviewer/pending page)
  const [selectedAdForReview, setSelectedAdForReview] = useState<Ad | null>(null); // Use Ad type
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [rejectionReasonForReview, setRejectionReasonForReview] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [complianceData, setComplianceData] = useState<ComplianceFormData | null>(null);
  // const [showComplianceFormStep, setShowComplianceFormStep] = useState(true); // May not be needed if modal structure is simpler

  const fetchUsers = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/users');
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      const usersData: User[] = await response.json();
      const reviewers = usersData.filter((user: User) => user.role === 'reviewer' || user.role === 'admin' || user.role === 'superadmin'); // Admins can also review
      setAllReviewers(reviewers);
      setFilteredReviewers(reviewers); // Initialize filtered list
    } catch (err: unknown) {
      console.error("Failed to fetch users:", err);
      toast({
        title: "Error",
        description: "Could not load reviewers list.",
        variant: "destructive",
      });
    }
  }, []);

  const fetchAds = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/ads');
      if (!response.ok) {
        const errorData: { message?: string } = await response.json();
        throw new Error(errorData.message || `Error: ${response.status}`);
      }
      const data: Ad[] = await response.json();
      setAds(data);
    } catch (err: unknown) {
      console.error("Failed to fetch ads:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (sessionStatus === "authenticated" && (session?.user?.role === 'admin' || session?.user?.role === 'superadmin')) {
      fetchAds();
      fetchUsers(); // Fetch users/reviewers
    } else if (sessionStatus === "unauthenticated") {
      setError("Access Denied. Please log in as an admin.");
      setLoading(false);
    } else if (sessionStatus === "authenticated" && session?.user?.role !== 'admin' && session?.user?.role !== 'superadmin') {
      setError("Access Denied. You do not have permission to view this page.");
      setLoading(false);
    }
  }, [session, sessionStatus, fetchAds, fetchUsers]); 

  // Edit Ad Modal Functions
  const handleEditAd = (ad: Ad) => { 
    setSelectedAdForEdit(ad);
    setEditData({
      title: ad.title,
      description: ad.description,
      status: ad.status,
      rejectionReason: ad.rejectionReason || "",
      assignedReviewerIds: ad.assignedReviewerIds || [],
    });
    setSearchTerm(""); 
    setFilteredReviewers(allReviewers); 
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setSelectedAdForEdit(null);
    setIsEditModalOpen(false);
    setEditData({ title: "", description: "", status: "", rejectionReason: "", assignedReviewerIds: [] });
    setSearchTerm("");
  };

  // View Details Modal Functions
  const handleViewDetails = (ad: Ad) => { 
    setSelectedAdForDetails(ad);
    setIsDetailsModalOpen(true);
  };

  const handleCloseDetailsModal = () => {
    setSelectedAdForDetails(null);
    setIsDetailsModalOpen(false);
  };
  
  // Review Ad Modal Functions (adapted from reviewer/pending)
  const handleOpenReviewModal = (ad: Ad) => {
    setSelectedAdForReview(ad);
    setRejectionReasonForReview(""); 
    setComplianceData(null); 
    // setShowComplianceFormStep(true); 
    setIsReviewModalOpen(true);
  };

  const handleCloseReviewModal = () => {
    setSelectedAdForReview(null);
    setIsReviewModalOpen(false);
    setRejectionReasonForReview("");
    setComplianceData(null);
    // setShowComplianceFormStep(true);
  };

  const handleUpdateAd = async () => {
    if (!selectedAdForEdit) return; // Updated to selectedAdForEdit

    setIsUpdating(true);
    try {
      const response = await fetch("/api/admin/update-ad", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          adId: selectedAdForEdit._id, // Updated to selectedAdForEdit
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

  // Submit Review Function (adapted from reviewer/pending)
  const submitReview = async (adId: string, reviewStatus: 'approved' | 'rejected', reason?: string) => {
    if (!session?.user?.id) {
      toast({ title: "Error", description: "You must be logged in to review ads.", variant: "destructive" });
      return;
    }
    if (reviewStatus === 'rejected' && !reason?.trim()) {
      toast({ title: "Validation Error", description: "Rejection reason is required.", variant: "destructive" });
      return;
    }
    if (!complianceData) {
      toast({ title: "Validation Error", description: "Compliance form must be submitted.", variant: "destructive" });
      return;
    }

    setIsSubmittingReview(true);
    try {
      const endpoint = reviewStatus === 'approved' ? `/api/reviewer/ads/approved` : `/api/reviewer/ads/rejected`;
      const body: any = {
        adId,
        complianceData,
      };
      if (reviewStatus === 'rejected') {
        body.rejectionReason = reason;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to submit review: ${response.statusText}`);
      }

      toast({
        title: "Review Submitted",
        description: `Ad has been ${reviewStatus}.`,
        variant: "default",
      });
      fetchAds(); // Refresh the main ads list
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
                  <TableHead>Media Type</TableHead>
                  <TableHead>Vetting Speed</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  {/* <TableHead>Reviewed</TableHead> // Combined with status or details */}
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ads.map((ad) => (
                  <TableRow key={ad._id}>
                    <TableCell className="font-medium truncate max-w-xs" title={ad.title}>{ad.title}</TableCell>
                    <TableCell>{ad.submitterEmail}</TableCell>
                    <TableCell className="capitalize">{ad.mediaType || 'N/A'}</TableCell>
                    <TableCell className="capitalize">
                      {ad.vettingSpeed === 'normal' ? 'Normal' : 
                       ad.vettingSpeed === '16hr' ? '16hr Accel.' :
                       ad.vettingSpeed === '8hr' ? '8hr Accel.' :
                       ad.vettingSpeed === '4hr' ? '4hr Accel.' :
                       ad.vettingSpeed || 'N/A'}
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(ad.status)}`}>
                        {getStatusIcon(ad.status)}
                        {ad.status}
                      </span>
                    </TableCell>
                    <TableCell>{new Date(ad.submittedAt).toLocaleDateString()}</TableCell>
                    {/* <TableCell>
                      {ad.reviewedAt ? new Date(ad.reviewedAt).toLocaleDateString() : "Not reviewed"}
                    </TableCell> */}
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleViewDetails(ad)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditAd(ad)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Ad
                          </DropdownMenuItem>
                          {ad.status === 'pending' && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleOpenReviewModal(ad)}>
                                <FileCheck className="mr-2 h-4 w-4" /> {/* Changed icon to FileCheck for review */}
                                Review Ad
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
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
            <DialogTitle>Edit Ad: {selectedAdForEdit?.title}</DialogTitle>
            <DialogDescription>
              Update ad information and review status. Changes will be applied immediately.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto !px-2">
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
            
            {/* New Reviewer Assignment Section */}
            <div className="space-y-2">
              <Label htmlFor="assignReviewers">Assign Reviewer(s)</Label>
              <div className="relative">
                <Input
                  id="reviewerSearch"
                  type="text"
                  placeholder="Search reviewers by email or name..."
                  value={searchTerm}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setSearchTerm(e.target.value);
                    const term = e.target.value.toLowerCase();
                    setFilteredReviewers(
                      allReviewers.filter(
                        (r: User) =>
                          r.email.toLowerCase().includes(term) ||
                          (r.name && r.name.toLowerCase().includes(term))
                      )
                    );
                  }}
                  className="pl-8"
                />
                <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              </div>
              <div className="max-h-48 overflow-y-auto border rounded-md p-2 space-y-2 mt-2">
                {filteredReviewers.length > 0 ? (
                  filteredReviewers.map((reviewer: User) => (
                    <div key={reviewer._id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`reviewer-${reviewer._id}`}
                        checked={editData.assignedReviewerIds.includes(reviewer._id)}
                        onCheckedChange={(checked: boolean | 'indeterminate') => {
                          setEditData((prev: EditAdData) => {
                            const newAssignedReviewerIds = checked === true
                              ? [...prev.assignedReviewerIds, reviewer._id]
                              : prev.assignedReviewerIds.filter((id) => id !== reviewer._id);
                            return { ...prev, assignedReviewerIds: newAssignedReviewerIds };
                          });
                        }}
                      />
                      <Label htmlFor={`reviewer-${reviewer._id}`} className="font-normal">
                        {reviewer.name || reviewer.email} ({reviewer.email})
                      </Label>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center">No reviewers found matching your search.</p>
                )}
                 {allReviewers.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center">No reviewers available.</p>
                )}
              </div>
              {editData.assignedReviewerIds.length > 0 && (
                <div className="mt-2 text-sm">
                  <span className="font-medium">Selected:</span> {editData.assignedReviewerIds.length} reviewer(s)
                </div>
              )}
            </div>
            
            {/* <div className="space-y-2"> // Old Reviewer ID field, replaced by above
              <Label htmlFor="reviewerId">Reviewer ID</Label>
              <Input
                id="reviewerId"
                value={editData.reviewerId}
                onChange={(e) => setEditData({ ...editData, reviewerId: e.target.value })}
                placeholder="Reviewer ID (optional)"
              />
            </div> */}
            
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
            <DialogTitle>Ad Details: {selectedAdForDetails?.title}</DialogTitle>
            <DialogDescription>
              Complete information about the ad submission.
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-1">Media Type:</h3>
                  <p className="text-sm text-muted-foreground capitalize">{selectedAdForDetails.mediaType || "N/A"}</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Vetting Speed:</h3>
                  <p className="text-sm text-muted-foreground capitalize">
                    {selectedAdForDetails.vettingSpeed === 'normal' ? 'Normal' : 
                     selectedAdForDetails.vettingSpeed === '16hr' ? 'Accelerated (16 hours)' :
                     selectedAdForDetails.vettingSpeed === '8hr' ? 'Accelerated (8 hours)' :
                     selectedAdForDetails.vettingSpeed === '4hr' ? 'Accelerated (4 hours)' :
                     selectedAdForDetails.vettingSpeed || 'N/A'}
                  </p>
                </div>
              </div>

              {selectedAdForDetails.totalFeeNgn !== undefined && selectedAdForDetails.totalFeeNgn !== null && (
                 <div>
                    <h3 className="font-semibold mb-1">Total Fee Paid:</h3>
                    <p className="text-sm text-muted-foreground">
                      ₦{selectedAdForDetails.totalFeeNgn.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
              )}
              
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
                    Ad file: <a href={selectedAdForDetails.adFileUrl} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline">{selectedAdForDetails.adFileUrl} <ExternalLink className="inline h-3 w-3 ml-1" /></a> (Preview not available)
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
                    {selectedAdForDetails.supportingDocuments.map((doc: { url: string; name: string }, index: number) => (
                      <li key={index} className="text-sm">
                        <a 
                          href={getCloudinaryDownloadUrl(doc.url, doc.name)}
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-green-600 hover:underline"
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
                <p className="text-sm text-muted-foreground">{new Date(selectedAdForDetails.submittedAt).toLocaleString()}</p>
              </div>
              {selectedAdForDetails.reviewedAt && (
                <div>
                  <h3 className="font-semibold mb-1">Reviewed On:</h3>
                  <p className="text-sm text-muted-foreground">{new Date(selectedAdForDetails.reviewedAt).toLocaleString()}</p>
                </div>
              )}
              {selectedAdForDetails.reviewerId && (
              <div>
                <h3 className="font-semibold mb-1">Reviewed By (Legacy ID):</h3>
                <p className="text-sm text-muted-foreground">{selectedAdForDetails.reviewerId || "N/A"}</p>
              </div>
            )}
            {selectedAdForDetails.assignedReviewerIds && selectedAdForDetails.assignedReviewerIds.length > 0 && (
               <div>
                 <h3 className="font-semibold mb-1">Assigned Reviewer(s):</h3>
                 <ul className="list-disc list-inside pl-4">
                   {selectedAdForDetails.assignedReviewerIds.map((id: string) => {
                     const reviewer = allReviewers.find(r => r._id === id);
                     return <li key={id} className="text-sm text-muted-foreground">{reviewer ? `${reviewer.name || reviewer.email} (${reviewer.email})` : `ID: ${id}`}</li>;
                   })}
                 </ul>
               </div>
            )}
            {selectedAdForDetails.rejectionReason && (
                <div>
                  <h3 className="font-semibold mb-1">Rejection Reason:</h3>
                  <p className="text-sm text-muted-foreground">{selectedAdForDetails.rejectionReason}</p>
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
            <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto !px-2"> {/* Increased max-h slightly */}
              <div>
                <h3 className="font-semibold mb-1">Ad Title:</h3>
                <p className="text-sm text-muted-foreground">{selectedAdForReview.title}</p>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Ad Description:</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedAdForReview.description}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-1">Media Type:</h3>
                  <p className="text-sm text-muted-foreground capitalize">{selectedAdForReview.mediaType || "N/A"}</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Vetting Speed:</h3>
                  <p className="text-sm text-muted-foreground capitalize">
                    {selectedAdForReview.vettingSpeed === 'normal' ? 'Normal' : 
                     selectedAdForReview.vettingSpeed === '16hr' ? 'Accelerated (16 hours)' :
                     selectedAdForReview.vettingSpeed === '8hr' ? 'Accelerated (8 hours)' :
                     selectedAdForReview.vettingSpeed === '4hr' ? 'Accelerated (4 hours)' :
                     selectedAdForReview.vettingSpeed || 'N/A'}
                  </p>
                </div>
              </div>

              {selectedAdForReview.totalFeeNgn !== undefined && selectedAdForReview.totalFeeNgn !== null && (
                 <div>
                    <h3 className="font-semibold mb-1">Total Fee Paid by Submitter:</h3>
                    <p className="text-sm text-muted-foreground">
                      ₦{selectedAdForReview.totalFeeNgn.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
              )}
              
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
                    Ad file: <a href={selectedAdForReview.adFileUrl} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline">{selectedAdForReview.adFileUrl} <ExternalLink className="inline h-3 w-3 ml-1" /></a> (Preview not available for this type)
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
                          className="text-green-600 hover:underline"
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
                <p className="text-sm text-muted-foreground">{selectedAdForReview.submitterEmail}</p>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Submitted On:</h3>
                <p className="text-sm text-muted-foreground">{new Date(selectedAdForReview.submittedAt).toLocaleString()}</p>
              </div>

              <hr className="my-4" />

              {/* Compliance Form Integration */}
              <div className="my-4 p-4 border rounded-md bg-slate-50">
                <h3 className="text-lg font-semibold mb-3">Step 1: Complete Compliance Checklist</h3>
                <ComplianceForm
                  onSubmit={(data) => {
                    setComplianceData(data);
                    toast({ title: "Compliance Form Saved", description: "You can now proceed to approve or reject.", variant: "default" });
                  }}
                  isSubmitting={isSubmittingReview}
                />
              </div>
              
              <hr className="my-4" />

              <div className={`${complianceData ? '' : 'opacity-50 pointer-events-none'}`}>
                <h3 className="text-lg font-semibold mb-3">Step 2: Approve or Reject Ad</h3>
                {!complianceData && <p className="text-sm text-orange-600 mb-2"><InfoIcon size={14} className="inline mr-1" />Please complete and submit the compliance checklist above to enable these actions.</p>}
                <Label htmlFor="rejectionReasonForReview" className="font-semibold">Rejection Reason (Required if rejecting):</Label>
                <Textarea
                  id="rejectionReasonForReview"
                  placeholder="Provide a clear reason if rejecting the ad..."
                  value={rejectionReasonForReview}
                  onChange={(e) => setRejectionReasonForReview(e.target.value)}
                  className="mt-1"
                  rows={3}
                />
              </div>
            </div>
          )}
          
          <DialogFooter className="gap-2 sm:gap-0">
            <DialogClose asChild>
              <Button variant="outline" disabled={isSubmittingReview} onClick={handleCloseReviewModal}>Cancel</Button>
            </DialogClose>
            <Button 
              variant="destructive" 
              onClick={() => selectedAdForReview && submitReview(selectedAdForReview._id, 'rejected', rejectionReasonForReview)}
              disabled={isSubmittingReview || !complianceData || (!!selectedAdForReview && !rejectionReasonForReview.trim())}
            >
              <ThumbsDown className="mr-2 h-4 w-4" /> Reject Ad
            </Button>
            <Button 
              className="bg-green-600 hover:bg-green-700"
              onClick={() => selectedAdForReview && submitReview(selectedAdForReview._id, 'approved')}
              disabled={isSubmittingReview || !complianceData}
            >
              <ThumbsUp className="mr-2 h-4 w-4" /> Approve Ad
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminAdsPage;
