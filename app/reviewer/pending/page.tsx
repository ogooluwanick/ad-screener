"use client"

import { useState } from "react"
import { CheckCircle, Clock, Eye, Search, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "@/hooks/use-toast"

// Mock data
const mockAds = [
  {
    id: "1",
    title: "Holiday Special",
    description: "Special offers for the holiday season with amazing discounts.",
    targetUrl: "https://example.com/holiday",
    imageUrl: "/placeholder.svg?height=300&width=600",
    submitter: "john@example.com",
    submissionDate: "2023-06-15",
    status: "pending",
  },
  {
    id: "2",
    title: "Flash Sale",
    description: "24-hour flash sale with incredible discounts on all items.",
    targetUrl: "https://example.com/flash-sale",
    imageUrl: "/placeholder.svg?height=300&width=600",
    submitter: "jane@example.com",
    submissionDate: "2023-06-14",
    status: "pending",
  },
  {
    id: "3",
    title: "New Product Launch",
    description: "Introducing our new product line with special features.",
    targetUrl: "https://example.com/new-product",
    imageUrl: "/placeholder.svg?height=300&width=600",
    submitter: "mike@example.com",
    submissionDate: "2023-06-13",
    status: "pending",
  },
  {
    id: "4",
    title: "Back to School",
    description: "Discounts on school supplies and equipment for students.",
    targetUrl: "https://example.com/back-to-school",
    imageUrl: "/placeholder.svg?height=300&width=600",
    submitter: "sarah@example.com",
    submissionDate: "2023-06-12",
    status: "pending",
  },
]

export default function PendingReviews() {
  const [ads, setAds] = useState(mockAds)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedAd, setSelectedAd] = useState<(typeof mockAds)[0] | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [reviewAction, setReviewAction] = useState<"approve" | "reject" | null>(null)
  const [rejectionReason, setRejectionReason] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)

  const filteredAds = ads.filter(
    (ad) =>
      ad.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ad.submitter.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleViewAd = (ad: (typeof mockAds)[0]) => {
    setSelectedAd(ad)
    setIsDialogOpen(true)
    setReviewAction(null)
    setRejectionReason("")
  }

  const handleReviewAction = (action: "approve" | "reject") => {
    setReviewAction(action)
  }

  const handleSubmitReview = () => {
    if (!selectedAd || !reviewAction) return

    if (reviewAction === "reject" && !rejectionReason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for rejection",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)

    // Mock API call
    setTimeout(() => {
      // Update the ad status
      setAds((prev) =>
        prev.map((ad) =>
          ad.id === selectedAd.id
            ? {
                ...ad,
                status: reviewAction,
                rejectionReason: reviewAction === "reject" ? rejectionReason : undefined,
              }
            : ad,
        ),
      )

      // Remove from pending list
      setAds((prev) => prev.filter((ad) => ad.id !== selectedAd.id))

      toast({
        title: "Success",
        description: `Ad ${reviewAction === "approve" ? "approved" : "rejected"} successfully`,
      })

      setIsProcessing(false)
      setIsDialogOpen(false)
      setSelectedAd(null)
      setReviewAction(null)
      setRejectionReason("")
    }, 1500)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Pending Reviews</h1>
        <div className="mt-2 sm:mt-0 text-sm text-gray-600">{filteredAds.length} ads awaiting review</div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ad Submissions for Review</CardTitle>
          <CardDescription>Review and approve or reject submitted advertisements</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search by title or submitter..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead className="hidden md:table-cell">Submitter</TableHead>
                  <TableHead className="hidden md:table-cell">Submission Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAds.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                      {searchTerm ? "No ads found matching your search" : "No pending ads to review"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAds.map((ad) => (
                    <TableRow key={ad.id}>
                      <TableCell className="font-medium">{ad.title}</TableCell>
                      <TableCell className="hidden md:table-cell">{ad.submitter}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        {new Date(ad.submissionDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 text-amber-600 mr-2" />
                          <span className="text-amber-600 capitalize">Pending</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleViewAd(ad)}>
                          <Eye className="h-4 w-4 mr-1" />
                          Review
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
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedAd?.title}</DialogTitle>
            <DialogDescription>
              Submitted by {selectedAd?.submitter} on{" "}
              {selectedAd && new Date(selectedAd.submissionDate).toLocaleDateString()}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="aspect-video overflow-hidden rounded-md border">
              <img
                src={selectedAd?.imageUrl || "/placeholder.svg"}
                alt={selectedAd?.title}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="grid gap-4">
              <div className="space-y-2">
                <h3 className="font-semibold">Description</h3>
                <p className="text-sm text-gray-600">{selectedAd?.description}</p>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">Target URL</h3>
                <p className="text-sm text-blue-600 break-all">
                  <a href={selectedAd?.targetUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
                    {selectedAd?.targetUrl}
                  </a>
                </p>
              </div>
            </div>

            {!reviewAction && (
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={() => handleReviewAction("approve")}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Approve
                </Button>
                <Button onClick={() => handleReviewAction("reject")} variant="destructive" className="flex-1">
                  <XCircle className="mr-2 h-4 w-4" />
                  Reject
                </Button>
              </div>
            )}

            {reviewAction === "approve" && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                  <span className="font-medium text-green-800">Ready to approve this ad</span>
                </div>
                <p className="text-sm text-green-700 mt-1">
                  This ad meets our guidelines and will be approved for publication.
                </p>
              </div>
            )}

            {reviewAction === "reject" && (
              <div className="space-y-4">
                <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                  <div className="flex items-center">
                    <XCircle className="h-5 w-5 text-red-600 mr-2" />
                    <span className="font-medium text-red-800">Rejecting this ad</span>
                  </div>
                  <p className="text-sm text-red-700 mt-1">
                    Please provide a clear reason for rejection to help the submitter improve.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rejectionReason">Reason for Rejection *</Label>
                  <Textarea
                    id="rejectionReason"
                    placeholder="Please explain why this ad is being rejected..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDialogOpen(false)
                setReviewAction(null)
                setRejectionReason("")
              }}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            {reviewAction && (
              <Button
                onClick={handleSubmitReview}
                disabled={isProcessing}
                className={reviewAction === "approve" ? "bg-green-600 hover:bg-green-700" : ""}
                variant={reviewAction === "reject" ? "destructive" : "default"}
              >
                {isProcessing ? "Processing..." : `Confirm ${reviewAction === "approve" ? "Approval" : "Rejection"}`}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
