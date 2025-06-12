"use client"

import { useState } from "react"
import { CheckCircle, Eye, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

// Mock data for approved ads
const mockApprovedAds = [
  {
    id: "1",
    title: "Summer Sale Campaign",
    description: "Promote our summer sale with 50% off on all products.",
    targetUrl: "https://example.com/summer-sale",
    imageUrl: "/placeholder.svg?height=300&width=600",
    submitter: "john@example.com",
    submissionDate: "2023-06-10",
    approvalDate: "2023-06-11",
    status: "approved",
  },
  {
    id: "2",
    title: "Back to School",
    description: "Discounts on school supplies and equipment for students.",
    targetUrl: "https://example.com/back-to-school",
    imageUrl: "/placeholder.svg?height=300&width=600",
    submitter: "sarah@example.com",
    submissionDate: "2023-06-08",
    approvalDate: "2023-06-09",
    status: "approved",
  },
  {
    id: "3",
    title: "Weekend Special",
    description: "Special weekend offers with great discounts.",
    targetUrl: "https://example.com/weekend-special",
    imageUrl: "/placeholder.svg?height=300&width=600",
    submitter: "mike@example.com",
    submissionDate: "2023-06-05",
    approvalDate: "2023-06-06",
    status: "approved",
  },
  {
    id: "4",
    title: "Tech Sale",
    description: "Amazing deals on the latest technology products.",
    targetUrl: "https://example.com/tech-sale",
    imageUrl: "/placeholder.svg?height=300&width=600",
    submitter: "jane@example.com",
    submissionDate: "2023-06-01",
    approvalDate: "2023-06-02",
    status: "approved",
  },
]

export default function ApprovedAds() {
  const [ads, setAds] = useState(mockApprovedAds)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedAd, setSelectedAd] = useState<(typeof mockApprovedAds)[0] | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const filteredAds = ads.filter(
    (ad) =>
      ad.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ad.submitter.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleViewAd = (ad: (typeof mockApprovedAds)[0]) => {
    setSelectedAd(ad)
    setIsDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Approved Ads</h1>
        <div className="mt-2 sm:mt-0 text-sm text-gray-600">{filteredAds.length} approved ads</div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Approved Advertisements</CardTitle>
          <CardDescription>View all approved ads that are ready for publication</CardDescription>
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
                  <TableHead className="hidden md:table-cell">Approval Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAds.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                      {searchTerm ? "No approved ads found matching your search" : "No approved ads yet"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAds.map((ad) => (
                    <TableRow key={ad.id}>
                      <TableCell className="font-medium">{ad.title}</TableCell>
                      <TableCell className="hidden md:table-cell">{ad.submitter}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        {new Date(ad.approvalDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                          <span className="text-green-600 capitalize">Approved</span>
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
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedAd?.title}</DialogTitle>
            <DialogDescription>
              Approved on {selectedAd && new Date(selectedAd.approvalDate).toLocaleDateString()} • Submitted by{" "}
              {selectedAd?.submitter}
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h3 className="font-semibold">Submission Date</h3>
                  <p className="text-sm text-gray-600">
                    {selectedAd && new Date(selectedAd.submissionDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold">Approval Date</h3>
                  <p className="text-sm text-gray-600">
                    {selectedAd && new Date(selectedAd.approvalDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-green-50 border border-green-200 rounded-md">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                <span className="font-medium text-green-800">This ad has been approved</span>
              </div>
              <p className="text-sm text-green-700 mt-1">
                This advertisement meets all guidelines and is ready for publication.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
