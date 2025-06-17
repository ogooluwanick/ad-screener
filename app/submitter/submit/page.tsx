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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select" // Added Select
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
// import { appConfig } from "@/lib/app_config" // Will be replaced by useAdCategories
// import { useAdCategories } from "@/hooks/use-ad-categories" // REMOVED
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "@/hooks/use-toast"
import Paystack from "@/components/Paystack" // This is the new PaystackButton-based component
// import axios from "axios"; // Not strictly needed if using fetch for FormData

const AD_SUBMISSION_FEE_USD = 50;

export default function SubmitAd() {
  const router = useRouter()
  const { data: session } = useSession()

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    // targetUrl: "", // REMOVED
    // category: "", // REMOVED
  })

  const [adFile, setAdFile] = useState<File | null>(null) // RENAMED from imageFile
  const [adFilePreview, setAdFilePreview] = useState<string | null>(null) // RENAMED from imagePreview
  const [errors, setErrors] = useState<Record<string, string | undefined>>({})
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false) // For the ad data submission step
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false) // For Paystack UI interaction
  const [isSubmissionComplete, setIsSubmissionComplete] = useState(false)

  const [currentNgnRate, setCurrentNgnRate] = useState<number | null>(null)
  const [calculatedFeeInNgn, setCalculatedFeeInNgn] = useState<number | null>(null)
  const [calculatedFeeInKobo, setCalculatedFeeInKobo] = useState<number | null>(null)
  const [exchangeRateError, setExchangeRateError] = useState<string | null>(null)
  const [isFetchingRate, setIsFetchingRate] = useState(true)

  // REMOVED useAdCategories hook usage and its destructured variables

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

  // REMOVED handleCategoryChange

  const handleAdFileChange = (e: React.ChangeEvent<HTMLInputElement>) => { // RENAMED from handleImageChange
    const file = e.target.files?.[0]
    if (!file) return
    // Broaden accepted types, Cloudinary will handle more specific validation.
    // Keep a client-side size check for immediate feedback. Vercel has a 4.5MB limit for serverless function request bodies.
    // Let's use 4MB as a slightly safer client-side limit.
    const maxSize = 4 * 1024 * 1024; // 4MB
    if (file.size > maxSize) { 
      setErrors((prev) => ({ ...prev, adFile: `File size must be less than ${maxSize / (1024*1024)}MB.` }))
      setAdFile(null);
      setAdFilePreview(null);
      e.target.value = ""; // Clear the input
      return
    }
    setAdFile(file) // RENAMED from setImageFile
    if (file.type.startsWith("image/")) {
      const reader = new FileReader()
      reader.onload = (event) => setAdFilePreview(event.target?.result as string) // RENAMED from setImagePreview
      reader.readAsDataURL(file)
    } else {
      setAdFilePreview(null); // No preview for non-image files for now
    }
    if (errors.adFile) setErrors((prev) => ({ ...prev, adFile: undefined })) // RENAMED from errors.image
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string | undefined> = {}
    if (!formData.title.trim()) newErrors.title = "Title is required"
    if (!formData.description.trim()) newErrors.description = "Description is required"
    // REMOVED targetUrl validation
    // REMOVED category validation
    if (!adFile) newErrors.adFile = "Ad File is required" // RENAMED from imageFile / errors.image
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

  // Called by Paystack.jsx when the visible button is clicked, before Paystack modal opens
  const handlePaystackInitiate = () => {
    console.log("[SubmitAdPage] handlePaystackInitiate called. Setting isPaymentProcessing to true.");
    setIsPaymentProcessing(true); // This will show "Processing Payment..." on the Paystack.jsx button
  };

  // This is the 'onSuccess' callback from the PaystackButton component
  const handlePaymentSuccess = async (paymentResult: { reference: string }) => {
    console.log("[SubmitAdPage] handlePaymentSuccess (Paystack callback) called. Result:", paymentResult);
    // At this point, isPaymentProcessing is likely true from onInitiate.
    // We now set isSubmitting to true for the ad data upload phase.
    console.log("[SubmitAdPage] Setting isSubmitting to true for ad data submission.");
    setIsSubmitting(true); 

    try {
      const adUploadData = new FormData();
      adUploadData.append("title", formData.title);
      adUploadData.append("description", formData.description);
      // adUploadData.append("contentUrl", formData.targetUrl); // REMOVED
      // adUploadData.append("category", formData.category); // REMOVED
      if (adFile) { // RENAMED from imageFile
        adUploadData.append("adFile", adFile); // RENAMED from "image"
      }
      
      if (!paymentResult || typeof paymentResult.reference !== 'string') {
        console.error("[SubmitAdPage] Invalid payment reference object from Paystack:", paymentResult);
        throw new Error("Invalid payment reference received from Paystack.");
      }
      adUploadData.append("paymentReference", paymentResult.reference);

      // submitterId is handled by the backend using the session.
      if (!session?.user?.id) {
        console.error("[SubmitAdPage] User session not found, cannot submit ad.");
        throw new Error("User session not found, cannot submit ad.");
      }

      if (calculatedFeeInKobo !== null) {
        adUploadData.append("amountInKobo", calculatedFeeInKobo.toString());
      } else {
        console.error("[SubmitAdPage] Critical error: calculatedFeeInKobo is null.");
        throw new Error("Fee amount was not available for submission. Please contact support.");
      }

      console.log("[SubmitAdPage] Attempting to POST ad data to /api/submitter/ads. FormData prepared.");
      const response = await fetch("/api/submitter/ads", {
        method: "POST",
        body: adUploadData,
      });
      const resultData = await response.json();
      console.log("[SubmitAdPage] API response status:", response.status, "Result:", resultData);

      if (!response.ok) {
        throw new Error(resultData.message || "Ad submission failed after payment.");
      }
      
      toast({ title: "Success!", description: "Your ad has been submitted for review." });
      console.log("[SubmitAdPage] Ad submission successful. Setting isSubmissionComplete to true.");
      setIsSubmissionComplete(true); 
      
      // No need to manually set isSubmitting/isPaymentProcessing to false here before closing modal,
      // as the finally block handles it. The modal should close.
      setIsPaymentModalOpen(false); 
      
      setTimeout(() => {
        console.log("[SubmitAdPage] Navigating to dashboard.");
        router.push("/submitter/dashboard");
      }, 2000);

    } catch (error: any) { 
      console.error("[SubmitAdPage] Error during ad submission process:", error);
      toast({ 
        title: "Ad Submission Failed", 
        description: `Your payment was successful, but an error occurred while submitting your ad: ${error.message}. Please contact support with your payment reference: ${paymentResult?.reference || 'N/A'}.`, 
        variant: "destructive",
        duration: 10000 
      });
      // isSubmitting and isPaymentProcessing will be reset in the finally block.
      // The modal might remain open if setIsPaymentModalOpen(false) wasn't reached or if an error occurred before.
      // If it's open, the user can manually close it or retry.
    } finally { 
      console.log("[SubmitAdPage] Finally block in handlePaymentSuccess. Resetting isSubmitting and isPaymentProcessing.");
      setIsSubmitting(false); // Reset for the main form button
      setIsPaymentProcessing(false); // Reset for the Paystack button in the modal
    }
  }

  // This is the 'onClose' callback from the PaystackButton component
  const handlePaymentClose = () => {
    console.log("[SubmitAdPage] handlePaymentClose (Paystack callback) called. isSubmissionComplete:", isSubmissionComplete);
    // Only show "Payment Cancelled" if submission hasn't happened and modal is still open
    if (!isSubmissionComplete && isPaymentModalOpen) {
        toast({ title: "Payment Cancelled", description: "The payment process was cancelled.", variant: "default" });
    }
    // Don't close the modal here if submission is complete, as it's handled by handlePaymentSuccess
    // If not complete, the user might be closing the Paystack popup, but our dialog might still be open.
    // The dialog's onOpenChange will handle setting isPaymentModalOpen to false.
    console.log("[SubmitAdPage] Resetting isPaymentProcessing due to Paystack modal close.");
    setIsPaymentProcessing(false); // Reset loading state for the Paystack button
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
         <Alert variant="default">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
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
            {/* REMOVED Target URL Field */}
            {/* REMOVED Ad Category Field */}
            <div className="space-y-2">
              <Label htmlFor="adFile">Ad File *</Label> {/* RENAMED from Image */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                {adFilePreview ? ( // RENAMED from imagePreview
                  <div className="space-y-4">
                    <img src={adFilePreview} alt="Ad File Preview" className="max-w-full h-48 object-contain mx-auto rounded" />
                    <Button type="button" variant="outline" onClick={() => { setAdFile(null); setAdFilePreview(null); const input = document.getElementById('adFile') as HTMLInputElement; if(input) input.value = ''; }}>Remove Ad File</Button> {/* RENAMED */}
                  </div>
                ) : adFile ? (
                  <div className="space-y-2">
                     <Upload className="h-8 w-8 text-gray-400 mx-auto" />
                    <p className="text-sm text-gray-600">Selected file: {adFile.name} ({ (adFile.size / (1024*1024)).toFixed(2)} MB)</p>
                    <p className="text-xs text-gray-500">Preview not available for this file type.</p>
                    <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => { setAdFile(null); setAdFilePreview(null); const input = document.getElementById('adFile') as HTMLInputElement; if(input) input.value = ''; }}>Change File</Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="h-8 w-8 text-gray-400 mx-auto" />
                    <div><Label htmlFor="adFile" className="cursor-pointer text-blue-600 hover:text-blue-700">Click to upload</Label><p className="text-sm text-gray-500">or drag and drop</p></div> {/* RENAMED */}
                    <p className="text-xs text-gray-400">Images, Videos, PDFs. Max 4MB.</p> {/* UPDATED description */}
                  </div>
                )}
                <Input id="adFile" type="file" accept="image/*,video/*,application/pdf" onChange={handleAdFileChange} className="hidden" /> {/* RENAMED, UPDATED accept */}
              </div>
              {errors.adFile && <p className="text-sm text-red-600">{errors.adFile}</p>} {/* RENAMED from errors.image */}
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" form="ad-submission-form" className="bg-blue-600 hover:bg-blue-700" 
            disabled={isSubmitting || isPaymentProcessing || isFetchingRate || !calculatedFeeInKobo}>
            {isFetchingRate ? "Loading Rate..." : (isSubmitting ? "Submitting Ad..." : (isPaymentProcessing ? "Processing Payment..." : "Pay Fee & Submit"))}
          </Button>
        </CardFooter>
      </Card>

      <Dialog open={isPaymentModalOpen} onOpenChange={(isOpen) => {
        console.log(`[SubmitAdPage] Dialog onOpenChange triggered. New isOpen: ${isOpen}. Current states: isPaymentProcessing: ${isPaymentProcessing}, isSubmitting: ${isSubmitting}`);
        // Prevent closing dialog if payment/submission is actively in progress
        if (!isOpen && (isPaymentProcessing || isSubmitting) && !isSubmissionComplete) {
          console.log("[SubmitAdPage] Dialog onOpenChange: Prevented closing because payment/submission is in progress and not yet complete.");
          return; 
        }
        setIsPaymentModalOpen(isOpen);
        // If dialog is closed by user (and not due to submission complete), reset payment processing state
        if (!isOpen && !isSubmissionComplete) {
          console.log("[SubmitAdPage] Dialog onOpenChange: Dialog is closing by user action (not submission complete), resetting isPaymentProcessing.");
          setIsPaymentProcessing(false); 
        }
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
                {/* <li><span className="font-medium">Target URL:</span> {formData.targetUrl || "N/A"}</li> REMOVED */}
                {/* <li><span className="font-medium">Category:</span> {formData.category || "N/A"}</li> REMOVED */}
                <li><span className="font-medium">Ad File:</span> {adFile?.name || "N/A"}</li> {/* RENAMED */}
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
                amountInKobo={calculatedFeeInKobo}
                metadata={{ 
                  adTitle: formData.title, 
                  clientSubmitterId: session.user.id 
                }}
                onSuccess={handlePaymentSuccess} 
                onClose={handlePaymentClose}   
                onInitiate={handlePaystackInitiate} 
                isLoading={isPaymentProcessing} 
                loadingText={"Processing Payment..."} 
                className="w-full"
              />
            ) : (
              <Alert variant={(!calculatedFeeInKobo && !isFetchingRate && exchangeRateError) ? "default" : "destructive"}>
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
                // Manually closing the dialog should also reset payment processing state
                setIsPaymentModalOpen(false);
                setIsPaymentProcessing(false); 
             }} disabled={isSubmitting || isPaymentProcessing /* Allow cancel if only payment processing, not full submitting */}>
                Cancel
             </Button>
           </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
