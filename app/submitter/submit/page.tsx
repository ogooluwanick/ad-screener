"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { AlertCircle, Upload } from "lucide-react"
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "@/hooks/use-toast"
import Paystack from "@/components/Paystack"

const AD_SUBMISSION_FEE_USD = 50;

export default function SubmitAd() {
  const router = useRouter()
  const { data: session } = useSession()

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    targetUrl: "",
  })

  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string | undefined>>({})
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false)
  const [isSubmissionComplete, setIsSubmissionComplete] = useState(false)

  const [currentNgnRate, setCurrentNgnRate] = useState<number | null>(null)
  const [calculatedFeeInNgn, setCalculatedFeeInNgn] = useState<number | null>(null)
  const [calculatedFeeInKobo, setCalculatedFeeInKobo] = useState<number | null>(null)
  const [exchangeRateError, setExchangeRateError] = useState<string | null>(null)
  const [isFetchingRate, setIsFetchingRate] = useState(true)

  useEffect(() => {
    const fetchRateAndSetFee = async () => {
      setIsFetchingRate(true)
      setExchangeRateError(null)
      try {
        const response = await fetch("/api/exchange-rate")
        const data = await response.json()
        if (!response.ok || typeof data.rate !== 'number') {
          throw new Error(data.message || "Failed to fetch valid exchange rate.")
        }
        const rate = data.rate
        setCurrentNgnRate(rate)
        const feeNgn = AD_SUBMISSION_FEE_USD * rate
        setCalculatedFeeInNgn(feeNgn)
        setCalculatedFeeInKobo(Math.round(feeNgn * 100))
        if (data.source === 'fallback') {
          toast({
            title: "Exchange Rate Notice",
            description: `Using fallback exchange rate: 1 USD = ${rate.toLocaleString()} NGN. ${data.message || ''}`,
            variant: "default",
            duration: 7000,
          })
        }
      } catch (err: any) {
        console.error("Error fetching exchange rate:", err)
        const errorMessage = err.message || "Could not load current exchange rate."
        setExchangeRateError(errorMessage)
        const fallbackRateOnError = 1500; 
        setCurrentNgnRate(fallbackRateOnError);
        const feeNgn = AD_SUBMISSION_FEE_USD * fallbackRateOnError;
        setCalculatedFeeInNgn(feeNgn);
        setCalculatedFeeInKobo(Math.round(feeNgn * 100));
        toast({
          title: "Exchange Rate Error",
          description: `${errorMessage} A default rate of 1 USD = ${fallbackRateOnError.toLocaleString()} NGN will be used.`,
          variant: "destructive",
          duration: 7000,
        })
      } finally {
        setIsFetchingRate(false)
      }
    }
    fetchRateAndSetFee()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prevErrors) => ({ ...prevErrors, [name]: undefined }))
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"]
    if (!validTypes.includes(file.type)) {
      setErrors((prev) => ({ ...prev, image: "Invalid image file type (JPEG, PNG, GIF, WebP)." }))
      return
    }
    if (file.size > 5 * 1024 * 1024) { 
      setErrors((prev) => ({ ...prev, image: "Image file size must be less than 5MB." }))
      return
    }
    setImageFile(file)
    const reader = new FileReader()
    reader.onload = (event) => setImagePreview(event.target?.result as string)
    reader.readAsDataURL(file)
    if (errors.image) setErrors((prev) => ({ ...prev, image: undefined }))
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string | undefined> = {}
    if (!formData.title.trim()) newErrors.title = "Title is required"
    if (!formData.description.trim()) newErrors.description = "Description is required"
    if (!formData.targetUrl.trim()) {
      newErrors.targetUrl = "Target URL is required"
    } else {
      try { new URL(formData.targetUrl) } catch { newErrors.targetUrl = "Please enter a valid URL" }
    }
    if (!imageFile) newErrors.image = "Image is required"
    setErrors(newErrors)
    return Object.values(newErrors).every(error => error === undefined);
  }

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return;

    if (isFetchingRate) {
        toast({title: "Please wait", description: "Exchange rate is currently loading.", variant: "default"});
        return;
    }
    if (!calculatedFeeInKobo) {
        toast({title: "Payment Error", description: "Cannot proceed: Ad fee calculation failed. Please refresh or contact support.", variant: "destructive"});
        return;
    }
    setIsPaymentModalOpen(true)
  }

  const handlePaystackInitiate = () => {
    setIsPaymentProcessing(true);
  };

  const handlePaymentSuccess = async (paymentReference: { reference: string }) => {
    setIsSubmitting(true) 
    const adUploadData = new FormData()
    adUploadData.append("title", formData.title)
    adUploadData.append("description", formData.description)
    adUploadData.append("contentUrl", formData.targetUrl)
    if (imageFile) adUploadData.append("image", imageFile)
    adUploadData.append("paymentReference", paymentReference.reference)
    if (session?.user?.id) adUploadData.append("submitterId", session.user.id)

    try {
      const response = await fetch("/api/submitter/ads", { method: "POST", body: adUploadData })
      const result = await response.json()
      if (!response.ok) throw new Error(result.message || "Ad submission failed")
      
      toast({ title: "Success!", description: "Your ad has been submitted for review." })
      setIsSubmissionComplete(true)
      setIsPaymentModalOpen(false)
      setTimeout(() => {
        router.push("/submitter/dashboard")
      }, 2000)
    } catch (error: any) {
      console.error("Ad submission error:", error)
      toast({ title: "Submission Failed", description: error.message || "An error occurred while submitting your ad.", variant: "destructive" })
    } finally {
      setIsSubmitting(false)
      setIsPaymentProcessing(false)
    }
  }

  const handlePaymentClose = () => {
    setIsPaymentModalOpen(false)
    setIsPaymentProcessing(false) 
    if (!isSubmissionComplete) {
        toast({ title: "Payment Cancelled", description: "The payment process was cancelled.", variant: "default" })
    }
  }

  const handlePaymentError = (error: Error) => {
    setIsPaymentProcessing(false) 
    toast({ title: "Payment Error", description: error.message || "An unexpected error occurred with the payment.", variant: "destructive" })
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
          {isFetchingRate ? "Fetching current exchange rate..." :
            calculatedFeeInNgn ?
            `A ₦${calculatedFeeInNgn.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (equivalent to $${AD_SUBMISSION_FEE_USD.toFixed(2)}) submission fee is required.` :
            `A $${AD_SUBMISSION_FEE_USD.toFixed(2)} submission fee is required. ${exchangeRateError || "Could not determine NGN equivalent."}`
          }
        </AlertDescription>
      </Alert>
      {exchangeRateError && !isFetchingRate && (
         <Alert variant="default"> {/* Changed from warning to default */}
            <AlertCircle className="h-4 w-4 text-yellow-600" /> {/* Using a yellow icon for default warning-like message */}
            <AlertTitle className="text-yellow-800">Exchange Rate Issue</AlertTitle>
            <AlertDescription className="text-yellow-700">{exchangeRateError} A default rate will be used for payment if possible.</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Ad Details</CardTitle>
          <CardDescription>Fill in the details for your advertisement</CardDescription>
        </CardHeader>
        <CardContent>
          <form id="ad-submission-form" onSubmit={handleSubmitForm} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input id="title" name="title" placeholder="Enter ad title" value={formData.title} onChange={handleChange} className={errors.title ? "border-red-500" : ""} />
              {errors.title && <p className="text-sm text-red-600">{errors.title}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea id="description" name="description" placeholder="Describe your advertisement" rows={4} value={formData.description} onChange={handleChange} className={errors.description ? "border-red-500" : ""} />
              {errors.description && <p className="text-sm text-red-600">{errors.description}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="targetUrl">Target URL *</Label>
              <Input id="targetUrl" name="targetUrl" type="url" placeholder="https://example.com" value={formData.targetUrl} onChange={handleChange} className={errors.targetUrl ? "border-red-500" : ""} />
              {errors.targetUrl && <p className="text-sm text-red-600">{errors.targetUrl}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="image">Image *</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                {imagePreview ? (
                  <div className="space-y-4">
                    <img src={imagePreview} alt="Preview" className="max-w-full h-48 object-contain mx-auto rounded" />
                    <Button type="button" variant="outline" onClick={() => { setImageFile(null); setImagePreview(null); }}>Remove Image</Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="h-8 w-8 text-gray-400 mx-auto" />
                    <div><Label htmlFor="image" className="cursor-pointer text-blue-600 hover:text-blue-700">Click to upload</Label><p className="text-sm text-gray-500">or drag and drop</p></div>
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
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" form="ad-submission-form" className="bg-blue-600 hover:bg-blue-700" 
            disabled={isSubmitting || isPaymentProcessing || isFetchingRate || !calculatedFeeInKobo}>
            {isFetchingRate ? "Loading Rate..." : (isSubmitting ? "Submitting Ad..." : "Pay Fee & Submit")}
          </Button>
        </CardFooter>
      </Card>

      <Dialog open={isPaymentModalOpen} onOpenChange={(isOpen) => {
        if (!isOpen && (isPaymentProcessing || isSubmitting)) return; 
        setIsPaymentModalOpen(isOpen);
        if (!isOpen) setIsPaymentProcessing(false); 
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm & Pay Submission Fee</DialogTitle>
            <DialogDescription>
             {calculatedFeeInNgn ? 
                `Review your ad details and proceed to payment. A fee of ₦${calculatedFeeInNgn.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (USD $${AD_SUBMISSION_FEE_USD.toFixed(2)}) is required.` :
                `Review your ad details and proceed to payment. A fee of USD $${AD_SUBMISSION_FEE_USD.toFixed(2)} is required. ${exchangeRateError ? '(Using fallback NGN rate)' : '(NGN equivalent pending)'}`
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <h4 className="font-semibold text-slate-700 mb-2">Ad Summary:</h4>
              <ul className="list-disc list-inside text-sm text-slate-600 space-y-1">
                <li><span className="font-medium">Title:</span> {formData.title || "N/A"}</li>
                <li><span className="font-medium">Target URL:</span> {formData.targetUrl || "N/A"}</li>
                <li><span className="font-medium">Image:</span> {imageFile?.name || "N/A"}</li>
              </ul>
              <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-200">
                <span className="font-medium text-slate-700">Total Fee:</span>
                <span className="font-bold text-lg text-blue-600">
                  {isFetchingRate && "Calculating..."}
                  {!isFetchingRate && calculatedFeeInNgn && `₦${calculatedFeeInNgn.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  {!isFetchingRate && !calculatedFeeInNgn && exchangeRateError && `USD $${AD_SUBMISSION_FEE_USD.toFixed(2)} (Fallback NGN may apply)`}
                  {!isFetchingRate && !calculatedFeeInNgn && !exchangeRateError && `USD $${AD_SUBMISSION_FEE_USD.toFixed(2)} (NGN N/A)`}
                </span>
              </div>
            </div>
            
            {session?.user?.email && calculatedFeeInKobo ? (
              <Paystack
                email={session.user.email}
                amountInKobo={calculatedFeeInKobo}
                metadata={{ adTitle: formData.title, submitterId: session.user.id }}
                onSuccess={handlePaymentSuccess}
                onClose={handlePaymentClose} 
                onError={handlePaymentError}
                onInitiate={handlePaystackInitiate} 
                isLoading={isPaymentProcessing} 
                loadingText={"Processing Payment..."}
                className="w-full" 
              />
            ) : (
              <Alert variant={(!calculatedFeeInKobo && !isFetchingRate && exchangeRateError) ? "default" : "destructive"}> {/* Changed warning to default */}
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>{!session?.user?.email ? "User Email Missing" : "Payment Unavailable"}</AlertTitle>
                <AlertDescription>
                  {!session?.user?.email ? "User email not found. Please ensure you are logged in." :
                   isFetchingRate ? "Please wait, fetching payment details..." :
                   !calculatedFeeInKobo ? "Could not determine payment amount in Kobo. Please refresh or contact support if this persists." :
                   "Payment cannot be processed at this time."}
                </AlertDescription>
              </Alert>
            )}
          </div>
           <div className="mt-4 flex justify-end">
             <Button variant="outline" onClick={() => {
                setIsPaymentModalOpen(false);
                setIsPaymentProcessing(false); 
             }} disabled={isPaymentProcessing || isSubmitting}>
                Cancel
             </Button>
           </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
