"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AlertCircle, CreditCard, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "@/hooks/use-toast"

export default function SubmitAd() {
  const router = useRouter()

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    targetUrl: "",
  })

  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false)
  const [isSubmissionComplete, setIsSubmissionComplete] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    // Clear error when field is edited
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"]
    if (!validTypes.includes(file.type)) {
      setErrors((prev) => ({
        ...prev,
        image: "Please upload a valid image file (JPEG, PNG, GIF, or WebP)",
      }))
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({
        ...prev,
        image: "Image file size must be less than 5MB",
      }))
      return
    }

    setImageFile(file)

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    // Clear error
    if (errors.image) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors.image
        return newErrors
      })
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) {
      newErrors.title = "Title is required"
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required"
    }

    if (!formData.targetUrl.trim()) {
      newErrors.targetUrl = "Target URL is required"
    } else {
      try {
        new URL(formData.targetUrl)
      } catch {
        newErrors.targetUrl = "Please enter a valid URL"
      }
    }

    if (!imageFile) {
      newErrors.image = "Image is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    // Open payment modal
    setIsPaymentModalOpen(true)
  }

  const handlePayment = () => {
    setIsPaymentProcessing(true)

    // Mock payment processing
    setTimeout(() => {
      setIsPaymentProcessing(false)
      setIsPaymentModalOpen(false)

      // Now submit the ad
      setIsSubmitting(true)

      setTimeout(() => {
        setIsSubmitting(false)
        setIsSubmissionComplete(true)

        toast({
          title: "Success",
          description: "Your ad has been submitted for review",
        })

        // Redirect to dashboard after a delay
        setTimeout(() => {
          router.push("/submitter/dashboard")
        }, 2000)
      }, 1500)
    }, 2000)
  }

  if (isSubmissionComplete) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle className="text-green-600">Submission Complete!</CardTitle>
            <CardDescription>Your ad has been submitted for review</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-sm text-gray-600">You will receive a notification once your ad has been reviewed.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Submit New Ad</h1>
        <p className="text-gray-600">Create and submit your advertisement for review</p>
      </div>

      <Alert className="border-blue-200 bg-blue-50">
        <AlertCircle className="h-4 w-4 text-blue-600" />
        <AlertTitle className="text-blue-800">Submission Fee Required</AlertTitle>
        <AlertDescription className="text-blue-700">
          A $50.00 submission fee is required to process your ad for review. Payment will be processed after you
          complete the form.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Ad Details</CardTitle>
          <CardDescription>Fill in the details for your advertisement</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                name="title"
                placeholder="Enter ad title"
                value={formData.title}
                onChange={handleChange}
                className={errors.title ? "border-red-500" : ""}
              />
              {errors.title && <p className="text-sm text-red-600">{errors.title}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Describe your advertisement"
                rows={4}
                value={formData.description}
                onChange={handleChange}
                className={errors.description ? "border-red-500" : ""}
              />
              {errors.description && <p className="text-sm text-red-600">{errors.description}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetUrl">Target URL *</Label>
              <Input
                id="targetUrl"
                name="targetUrl"
                type="url"
                placeholder="https://example.com"
                value={formData.targetUrl}
                onChange={handleChange}
                className={errors.targetUrl ? "border-red-500" : ""}
              />
              {errors.targetUrl && <p className="text-sm text-red-600">{errors.targetUrl}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="image">Image *</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                {imagePreview ? (
                  <div className="space-y-4">
                    <img
                      src={imagePreview || "/placeholder.svg"}
                      alt="Preview"
                      className="max-w-full h-48 object-contain mx-auto rounded"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setImageFile(null)
                        setImagePreview(null)
                      }}
                    >
                      Remove Image
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="h-8 w-8 text-gray-400 mx-auto" />
                    <div>
                      <Label htmlFor="image" className="cursor-pointer text-blue-600 hover:text-blue-700">
                        Click to upload
                      </Label>
                      <p className="text-sm text-gray-500">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-400">PNG, JPG, GIF, WebP up to 5MB</p>
                  </div>
                )}
                <Input id="image" type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
              </div>
              {errors.image && <p className="text-sm text-red-600">{errors.image}</p>}
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700" disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Pay Fee & Submit"}
          </Button>
        </CardFooter>
      </Card>

      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Payment Required</DialogTitle>
            <DialogDescription>Complete payment to submit your ad for review</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-medium">Submission Fee</span>
                <span className="font-bold text-lg">$50.00</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Card Number</Label>
              <Input placeholder="1234 5678 9012 3456" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Expiry Date</Label>
                <Input placeholder="MM/YY" />
              </div>
              <div className="space-y-2">
                <Label>CVV</Label>
                <Input placeholder="123" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Cardholder Name</Label>
              <Input placeholder="John Doe" />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPaymentModalOpen(false)} disabled={isPaymentProcessing}>
              Cancel
            </Button>
            <Button onClick={handlePayment} className="bg-blue-600 hover:bg-blue-700" disabled={isPaymentProcessing}>
              <CreditCard className="mr-2 h-4 w-4" />
              {isPaymentProcessing ? "Processing..." : "Pay $50.00"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
