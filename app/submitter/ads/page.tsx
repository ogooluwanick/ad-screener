"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { CheckCircle, Clock, Download, Eye, Filter, PlusCircle, Search, XCircle } from "lucide-react" // Added Download
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton" // Added for loading state
import ComplianceForm from "@/components/compliance-form"; // Added

// Type for Ad data from API
interface Ad {
  _id: string
  title: string
  description: string
  // targetUrl: string // REMOVED
  adFileUrl?: string // RENAMED from imageUrl, mapped from adFileUrl
  adFilePublicId?: string // Added
  adFileType?: 'image' | 'video' | 'pdf' | 'other'; // Added to help render
  supportingDocuments?: Array<{ url: string; publicId: string; name: string }>; // Added
  submissionDate: string // Mapped from submittedAt
  status: "pending" | "approved" | "rejected"
  rejectionReason?: string
  compliance?: ComplianceFormData // Added for compliance checklist
  mediaType?: string;
  vettingSpeed?: string;
  totalFeeNgn?: number;
}

// Forward declaration for ComplianceFormData if not imported directly
// For actual use, ensure ComplianceFormData is imported or defined appropriately.
// Assuming ComplianceFormData is similar to what's in compliance-form.tsx
interface ComplianceFormData {
  rulesCompliance: "Yes" | "No" | "N/A";
  falseClaimsFree: "Yes" | "No" | "N/A";
  claimsSubstantiated: "Yes" | "No" | "N/A";
  offensiveContentFree: "Yes" | "No" | "N/A";
  targetAudienceAppropriate: "Yes" | "No" | "N/A";
  comparativeAdvertisingFair: "Yes" | "No" | "N/A";
  disclaimersDisplayed: "Yes" | "No" | "N/A";
  unapprovedEndorsementsAbsent: "Yes" | "No" | "N/A";
  statutoryApprovalsAttached: "Yes" | "No" | "N/A";
  sanctionHistoryReviewed: "Yes" | "No" | "N/A";
  culturalReferencesAppropriate: "Yes" | "No" | "N/A";
  childrenProtected: "Yes" | "No" | "N/A";
  overallComplianceNotes?: string;
  // filledAt and reviewerId might also be part of the full ComplianceData from backend
  filledAt?: string; // Or Date
  reviewerId?: string;
}

export default function SubmitterAds() {
  const [ads, setAds] = useState<Ad[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [selectedAd, setSelectedAd] = useState<Ad | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const getCloudinaryDownloadUrl = (url: string, filename?: string): string => {
    if (!url) return '#';
    const parts = url.split('/upload/');
    if (parts.length !== 2) return url; // Not a standard Cloudinary upload URL
  
    // Using simplified fl_attachment without custom filename to avoid 400 errors.
    // The original filename will be suggested by the 'download' attribute on the <a> tag.
    const transformation = 'fl_attachment';
    return `${parts[0]}/upload/${transformation}/${parts[1]}`;
  };

  useEffect(() => {
    const fetchAds = async () => {
      setIsLoading(true)
      try {
        const response = await fetch("/api/submitter/ads")
        if (!response.ok) {
          throw new Error("Failed to fetch ads")
        }
        const data = await response.json()
        // Map API data to frontend Ad type
        const formattedAds: Ad[] = data.map((ad: any) => {
          let fileType: Ad['adFileType'] = 'other';
          if (ad.adFileUrl) {
            if (/\.(jpeg|jpg|gif|png|webp)$/i.test(ad.adFileUrl)) {
              fileType = 'image';
            } else if (/\.(mp4|webm|ogg)$/i.test(ad.adFileUrl)) {
              fileType = 'video';
            } else if (/\.pdf$/i.test(ad.adFileUrl)) {
              fileType = 'pdf';
            }
          } else if (ad.resource_type === 'image' || ad.resource_type === 'video') {
            fileType = ad.resource_type;
          }

          return {
            _id: ad._id,
            title: ad.title,
            description: ad.description,
            // targetUrl: ad.contentUrl, // REMOVED
            adFileUrl: ad.adFileUrl, // RENAMED
            adFilePublicId: ad.adFilePublicId, // ADDED
            adFileType: fileType, // ADDED
            supportingDocuments: ad.supportingDocuments, // Added
            submissionDate: ad.submittedAt,
            status: ad.status,
            rejectionReason: ad.rejectionReason,
            compliance: ad.compliance, // Added
            mediaType: ad.mediaType,
            vettingSpeed: ad.vettingSpeed,
            totalFeeNgn: ad.totalFeeNgn,
          };
        });
        setAds(formattedAds)
      } catch (error) {
        console.error("Error fetching ads:", error)
        // Handle error state, e.g., show a toast notification
      } finally {
        setIsLoading(false)
      }
    }

    fetchAds()
  }, [])

  const filteredAds = ads.filter((ad) => {
    const matchesSearch = ad.title.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter ? ad.status === statusFilter : true
    return matchesSearch && matchesStatus
  })

  const handleViewAd = (ad: Ad) => {
    setSelectedAd(ad)
    setIsDialogOpen(true)
  }

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight">My Ads</h1>
        <div className="mt-2 sm:mt-0">
          <Link href="/submitter/submit">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <PlusCircle className="mr-2 h-4 w-4" />
              Submit New Ad
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ad Submissions</CardTitle>
          <CardDescription>Manage and track all your ad submissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search ads..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full sm:w-auto">
                  <Filter className="mr-2 h-4 w-4" />
                  {statusFilter ? `Status: ${statusFilter}` : "Filter by status"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setStatusFilter(null)}>All</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("pending")}>Pending</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("approved")}>Approved</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("rejected")}>Rejected</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead className="hidden lg:table-cell">Media Type</TableHead>
                  <TableHead className="hidden lg:table-cell">Vetting Speed</TableHead>
                  <TableHead className="hidden md:table-cell">Submission Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={`skeleton-${index}`}>
                      <TableCell><Skeleton className="h-5 w-2/5" /></TableCell>
                      <TableCell className="hidden lg:table-cell"><Skeleton className="h-5 w-20" /></TableCell>
                      <TableCell className="hidden lg:table-cell"><Skeleton className="h-5 w-20" /></TableCell>
                      <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-8 w-20" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredAds.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      No ads found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAds.map((ad) => (
                    <TableRow key={ad._id}>
                      <TableCell className="font-medium truncate max-w-[150px] sm:max-w-xs" title={ad.title}>{ad.title}</TableCell>
                      <TableCell className="hidden lg:table-cell capitalize">{ad.mediaType || 'N/A'}</TableCell>
                      <TableCell className="hidden lg:table-cell capitalize">
                        {ad.vettingSpeed === 'normal' ? 'Normal' : 
                         ad.vettingSpeed === '16hr' ? '16hr Accel.' :
                         ad.vettingSpeed === '8hr' ? '8hr Accel.' :
                         ad.vettingSpeed === '4hr' ? '4hr Accel.' :
                         ad.vettingSpeed || 'N/A'}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {new Date(ad.submissionDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          {getStatusIcon(ad.status)}
                          <span className={`ml-2 capitalize ${getStatusColor(ad.status)}`}>{ad.status}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleViewAd(ad)}>
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedAd?.title}</DialogTitle>
            <DialogDescription>
              Submitted on {selectedAd && new Date(selectedAd.submissionDate).toLocaleDateString()}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 max-h-[80vh] overflow-y-scroll">
            <div>
              <h3 className="font-semibold mb-1">Ad File</h3>
              {selectedAd?.adFileType === 'image' && selectedAd.adFileUrl && (
                <div className="aspect-video overflow-hidden rounded-md border">
                  <img
                    src={selectedAd.adFileUrl}
                    alt={`Ad file for ${selectedAd.title}`}
                    className="w-full h-full object-contain" // Changed to object-contain
                  />
                </div>
              )}
              {selectedAd?.adFileType === 'video' && selectedAd.adFileUrl && (
                <div className="aspect-video overflow-hidden rounded-md border">
                  <video controls src={selectedAd.adFileUrl} className="w-full h-full object-contain">
                    Your browser does not support the video tag.
                  </video>
                </div>
              )}
              {selectedAd?.adFileType === 'pdf' && selectedAd.adFileUrl && (
                 <div className="my-2">
                    <Button asChild variant="outline">
                      <a href={selectedAd.adFileUrl} target="_blank" rel="noopener noreferrer">View PDF</a>
                    </Button>
                 </div>
              )}
              {(!selectedAd?.adFileType || selectedAd?.adFileType === 'other') && selectedAd?.adFileUrl && (
                <p className="text-sm text-gray-600">
                  Ad file: <a href={selectedAd.adFileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{selectedAd.adFileUrl}</a> (Preview not available)
                </p>
              )}
              {!selectedAd?.adFileUrl && (
                <div className="aspect-video overflow-hidden rounded-md border bg-slate-100 flex items-center justify-center">
                  <p className="text-sm text-gray-500">No ad file uploaded.</p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold">Description</h3>
              <p className="text-sm text-gray-600">{selectedAd?.description}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-1">Media Type:</h3>
                  <p className="text-sm text-muted-foreground capitalize">{selectedAd?.mediaType || "N/A"}</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Vetting Speed:</h3>
                  <p className="text-sm text-muted-foreground capitalize">
                    {selectedAd?.vettingSpeed === 'normal' ? 'Normal' : 
                     selectedAd?.vettingSpeed === '16hr' ? 'Accelerated (16 hours)' :
                     selectedAd?.vettingSpeed === '8hr' ? 'Accelerated (8 hours)' :
                     selectedAd?.vettingSpeed === '4hr' ? 'Accelerated (4 hours)' :
                     selectedAd?.vettingSpeed || 'N/A'}
                  </p>
                </div>
              </div>

            {selectedAd?.totalFeeNgn !== undefined && selectedAd?.totalFeeNgn !== null && (
                <div>
                  <h3 className="font-semibold mb-1">Total Fee Paid:</h3>
                  <p className="text-sm text-muted-foreground">
                    ₦{selectedAd.totalFeeNgn.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
            )}

            {selectedAd?.supportingDocuments && selectedAd.supportingDocuments.length > 0 && (
              <div>
                <h3 className="font-semibold mb-1">Supporting Documents</h3>
                <ul className="list-disc list-inside space-y-1 pl-4">
                  {selectedAd.supportingDocuments.map((doc, index) => (
                    <li key={doc.publicId || index} className="text-sm">
                      <a 
                        href={getCloudinaryDownloadUrl(doc.url, doc.name)}
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-blue-600 hover:underline"
                        title={`Download ${doc.name}`} // Changed title to Download
                        download={doc.name} // Added download attribute as a fallback
                      >
                        {doc.name || `Document ${index + 1}`}
                        <Download className="inline h-3 w-3 ml-1 opacity-75" /> {/* Changed icon to Download */}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* REMOVED Target URL section */}

            <div className="flex items-center space-x-2">
              <h3 className="font-semibold">Status:</h3>
              <div className="flex items-center">
                {selectedAd && getStatusIcon(selectedAd.status)}
                <span className={`ml-2 capitalize ${selectedAd && getStatusColor(selectedAd.status)}`}>
                  {selectedAd?.status}
                </span>
              </div>
            </div>

            {selectedAd?.status === "rejected" && selectedAd?.rejectionReason && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-md">
                <h3 className="font-semibold text-red-600">Rejection Reason</h3>
                <p className="text-sm text-red-600">{selectedAd.rejectionReason}</p>
              </div>
            )}

            {/* Display Compliance Data if available and ad is not pending */}
            {selectedAd && (selectedAd.status === "approved" || selectedAd.status === "rejected") && selectedAd.compliance && (
              <div className="mt-4 pt-4 border-t">
                <h3 className="text-lg font-semibold mb-2">Compliance Checklist Review</h3>
                <ComplianceForm
                  initialData={selectedAd.compliance}
                  isReadOnly={true}
                  onSubmit={() => {}} // No-op for read-only
                />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
