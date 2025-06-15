"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { CheckCircle, Clock, Eye, Filter, PlusCircle, Search, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton" // Added for loading state

// Type for Ad data from API
interface Ad {
  _id: string
  title: string
  description: string
  targetUrl: string // Mapped from contentUrl
  imageUrl?: string
  submissionDate: string // Mapped from submittedAt
  status: "pending" | "approved" | "rejected"
  rejectionReason?: string
}

export default function SubmitterAds() {
  const [ads, setAds] = useState<Ad[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [selectedAd, setSelectedAd] = useState<Ad | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

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
        const formattedAds: Ad[] = data.map((ad: any) => ({
          _id: ad._id,
          title: ad.title,
          description: ad.description,
          targetUrl: ad.contentUrl,
          imageUrl: ad.imageUrl,
          submissionDate: ad.submittedAt,
          status: ad.status,
          rejectionReason: ad.rejectionReason,
        }))
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
                  <TableHead className="hidden md:table-cell">Submission Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={`skeleton-${index}`}>
                      <TableCell><Skeleton className="h-5 w-3/4" /></TableCell>
                      <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-8 w-20" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredAds.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                      No ads found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAds.map((ad) => (
                    <TableRow key={ad._id}>
                      <TableCell className="font-medium">{ad.title}</TableCell>
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

          <div className="space-y-4">
            <div className="aspect-video overflow-hidden rounded-md">
              <img
                src={selectedAd?.imageUrl || "/placeholder.svg"}
                alt={selectedAd?.title}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold">Description</h3>
              <p className="text-sm text-gray-600">{selectedAd?.description}</p>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold">Target URL</h3>
              <p className="text-sm text-blue-600 break-all">
                <a href={selectedAd?.targetUrl} target="_blank" rel="noopener noreferrer">
                  {selectedAd?.targetUrl}
                </a>
              </p>
            </div>

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
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
