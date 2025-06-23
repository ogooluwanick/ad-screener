"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { AlertCircle, Upload, Tv, Smartphone, CheckCircle2 } from "lucide-react" // Added Tv, Smartphone, CheckCircle2
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { NextSeo } from 'next-seo';
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group" // Added for pricing options
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select" // No longer used directly
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox" // Added Checkbox
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs" // Added Tabs
import { X } from "lucide-react" // For remove button
// import { appConfig } from "@/lib/app_config" // Will be replaced by useAdCategories
// import { useAdCategories } from "@/hooks/use-ad-categories" // REMOVED
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select" // Added for vetting speed
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

// Pricing constants in NGN (kobo for Paystack)
const NORMAL_VETTING_FEES = {
  traditional: 35000, // N35k
  digital: 20000,     // N20k
};

const ACCELERATED_FEES_ADDITIONAL = {
  "16hr": {
    traditional: 250000, // N250k
    digital: 100000,     // N100k
  },
  "8hr": {
    traditional: 400000, // N400k
    digital: 150000,     // N150k
  },
  "4hr": {
    traditional: 600000, // N600k
    digital: 250000,     // N250k
  },
};

type MediaType = "traditional" | "digital" | "";
type VettingSpeed = "normal" | "16hr" | "8hr" | "4hr" | "";


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
  const [supportingDocuments, setSupportingDocuments] = useState<File[]>([])
  const [activeTab, setActiveTab] = useState("adDetails")
  const [errors, setErrors] = useState<Record<string, string | undefined>>({})
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false) // For the ad data submission step
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false) // For Paystack UI interaction
  const [isSubmissionComplete, setIsSubmissionComplete] = useState(false)

  // Dynamic Pricing State
  const [mediaType, setMediaType] = useState<MediaType>("")
  const [vettingSpeed, setVettingSpeed] = useState<VettingSpeed>("normal")
  const [calculatedFeeInNgn, setCalculatedFeeInNgn] = useState<number | null>(null)
  const [calculatedFeeInKobo, setCalculatedFeeInKobo] = useState<number | null>(null)
  // const [currentNgnRate, setCurrentNgnRate] = useState<number | null>(null) // No longer needed
  // const [exchangeRateError, setExchangeRateError] = useState<string | null>(null) // No longer needed
  // const [isFetchingRate, setIsFetchingRate] = useState(true) // No longer needed

  // Affirmation states
  const [affirmation1, setAffirmation1] = useState(false)
  const [affirmation2, setAffirmation2] = useState(false)
  const [affirmation3, setAffirmation3] = useState(false)

  // REMOVED useAdCategories hook usage and its destructured variables

  const MAX_SUPPORTING_DOCS = 5;
  const MAX_SUPPORTING_DOC_SIZE_MB = 2; // Max 2MB per supporting document

  // Calculate fee whenever mediaType or vettingSpeed changes
  useEffect(() => {
    if (mediaType && vettingSpeed) { // Ensure both are selected
      let totalFeeNgn = 0;
      const baseFee = NORMAL_VETTING_FEES[mediaType];
      totalFeeNgn += baseFee;

      // Check if vettingSpeed is a key for accelerated fees
      if (vettingSpeed !== "normal" && ACCELERATED_FEES_ADDITIONAL.hasOwnProperty(vettingSpeed)) {
        // Ensure vettingSpeed is a valid key before indexing
        // The hasOwnProperty check already ensures vettingSpeed is one of "16hr", "8hr", "4hr"
        const validVettingSpeedKey = vettingSpeed as keyof typeof ACCELERATED_FEES_ADDITIONAL;
        const acceleratedFeeTier = ACCELERATED_FEES_ADDITIONAL[validVettingSpeedKey];
        
        if (acceleratedFeeTier && acceleratedFeeTier[mediaType]) {
          totalFeeNgn += acceleratedFeeTier[mediaType];
        }
      }
      setCalculatedFeeInNgn(totalFeeNgn);
      setCalculatedFeeInKobo(totalFeeNgn * 100);
    } else {
      // Reset fees if media type is not selected
      setCalculatedFeeInNgn(null);
      setCalculatedFeeInKobo(null);
    }
  }, [mediaType, vettingSpeed]);


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

  const handleSupportingDocumentsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles = Array.from(files);
    let currentErrors = { ...errors };
    let newErrorMessages: string[] = [];

    if (supportingDocuments.length + newFiles.length > MAX_SUPPORTING_DOCS) {
      newErrorMessages.push(`You can upload a maximum of ${MAX_SUPPORTING_DOCS} supporting documents.`);
      // Truncate newFiles to fit the limit if some are already selected
      newFiles.splice(MAX_SUPPORTING_DOCS - supportingDocuments.length);
    }
    
    const validNewFiles = newFiles.filter(file => {
      if (file.size > MAX_SUPPORTING_DOC_SIZE_MB * 1024 * 1024) {
        newErrorMessages.push(`File "${file.name}" exceeds ${MAX_SUPPORTING_DOC_SIZE_MB}MB limit.`);
        return false;
      }
      return true;
    });

    if (newErrorMessages.length > 0) {
      currentErrors.supportingDocuments = newErrorMessages.join(" ");
      toast({
        title: "Upload Error",
        description: newErrorMessages.join(" "),
        variant: "destructive",
        duration: 5000,
      });
    } else {
      delete currentErrors.supportingDocuments;
    }
    
    setErrors(currentErrors);
    setSupportingDocuments(prev => [...prev, ...validNewFiles].slice(0, MAX_SUPPORTING_DOCS));
    e.target.value = ""; // Clear the input for next selection
  };

  const removeSupportingDocument = (indexToRemove: number) => {
    setSupportingDocuments(prev => prev.filter((_, index) => index !== indexToRemove));
    if (errors.supportingDocuments && supportingDocuments.length -1 < MAX_SUPPORTING_DOCS) { // Clear error if now under limit
        const newErrors = {...errors};
        delete newErrors.supportingDocuments;
        setErrors(newErrors);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string | undefined> = {}
    if (!formData.title.trim()) newErrors.title = "Title is required"
    if (!formData.description.trim()) newErrors.description = "Description is required"
    // REMOVED targetUrl validation
    // REMOVED category validation
    if (!adFile) newErrors.adFile = "Ad File is required" // RENAMED from imageFile / errors.image
    if (!mediaType) newErrors.mediaType = "Media type is required."
    if (!vettingSpeed) newErrors.vettingSpeed = "Vetting speed is required."


    // Affirmation validation
    if (!affirmation1) newErrors.affirmation1 = "You must affirm accuracy and compliance."
    if (!affirmation2) newErrors.affirmation2 = "You must confirm authorization."
    if (!affirmation3) newErrors.affirmation3 = "You must acknowledge sanctions for false information."
    
    setErrors(newErrors)
    return Object.values(newErrors).every(error => error === undefined);
  }

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) {
      // Scroll to the first error
      const firstErrorKey = Object.keys(errors).find(key => errors[key]);
      if (firstErrorKey) {
        const errorElement = document.getElementById(firstErrorKey) || document.getElementsByName(firstErrorKey)[0];
        errorElement?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      toast({title: "Validation Error", description: "Please fill in all required fields.", variant: "destructive"});
      return;
    }

    // if (isFetchingRate) { // No longer fetching rate
    //     toast({title: "Please wait", description: "Exchange rate is currently loading.", variant: "default"});
    //     return;
    // }
    if (!calculatedFeeInKobo || calculatedFeeInNgn === null) { // Check both NGN and Kobo
        toast({title: "Pricing Error", description: "Cannot proceed: Ad fee calculation failed. Please select media type and vetting speed, or contact support.", variant: "destructive"});
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

      // Append supporting documents
      supportingDocuments.forEach(file => {
        adUploadData.append("supportingDocuments", file);
      });

      // Append pricing details
      adUploadData.append("mediaType", mediaType);
      adUploadData.append("vettingSpeed", vettingSpeed);
      if (calculatedFeeInNgn !== null) { // Ensure it's not null before appending
        adUploadData.append("totalFeeNgn", calculatedFeeInNgn.toString());
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
    <>
      <NextSeo title="Submit Ad" />
      <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Submit New Ad</h1>
        <p className="text-gray-600">Create and submit your advertisement for review</p>
      </div>

      <Alert className="border-blue-200 bg-blue-50">
        <AlertCircle className="h-4 w-4 text-blue-600" />
        <AlertTitle className="text-blue-800">Submission Fee</AlertTitle>
        <AlertDescription className="text-blue-700">
          {mediaType && calculatedFeeInNgn !== null ?
            `The calculated submission fee is ₦${calculatedFeeInNgn.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.` :
            "Please select Media Type and Vetting Speed to see the submission fee."
          }
        </AlertDescription>
      </Alert>
      {/* {exchangeRateError && !isFetchingRate && ( // This section is no longer needed
         <Alert variant="default">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertTitle className="text-yellow-800">Exchange Rate Issue</AlertTitle>
            <AlertDescription className="text-yellow-700">{exchangeRateError} A default rate will be used for payment if possible.</AlertDescription>
        </Alert>
      )} */}

      <Card>
        <CardHeader>
          <CardTitle>Ad Submission</CardTitle>
          <CardDescription>Fill in your ad details and upload any supporting documents.</CardDescription>
        </CardHeader>
        <CardContent>
            <form id="ad-submission-form" onSubmit={handleSubmitForm} className="space-y-6 pt-4">
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
                <Label htmlFor="adFile">Ad File *</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  {adFilePreview ? (
                    <div className="space-y-4">
                      <img src={adFilePreview} alt="Ad File Preview" className="max-w-full h-48 object-contain mx-auto rounded" />
                      <Button type="button" variant="outline" onClick={() => { setAdFile(null); setAdFilePreview(null); const input = document.getElementById('adFile') as HTMLInputElement; if(input) input.value = ''; }}>Remove Ad File</Button>
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
                      <div><Label htmlFor="adFile" className="cursor-pointer text-blue-600 hover:text-blue-700">Click to upload</Label><p className="text-sm text-gray-500">or drag and drop</p></div>
                      <p className="text-xs text-gray-400">Images, Videos, PDFs. Max 4MB.</p>
                    </div>
                  )}
                  <Input id="adFile" type="file" accept="image/*,video/*,application/pdf" onChange={handleAdFileChange} className="hidden" />
                </div>
                {errors.adFile && <p className="text-sm text-red-600">{errors.adFile}</p>}
              </div>
              
            <hr />
            
              <div className="space-y-2 pt-4">
                <Label htmlFor="supportingDocumentsInput">Upload Supporting Documents (Max {MAX_SUPPORTING_DOCS} files, {MAX_SUPPORTING_DOC_SIZE_MB}MB each)</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <div>
                    <Label htmlFor="supportingDocumentsInput" className="cursor-pointer text-blue-600 hover:text-blue-700">Click to select files</Label>
                    <p className="text-sm text-gray-500">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-400">PDFs, Docs, Images, etc.</p>
                  <Input 
                    id="supportingDocumentsInput" 
                    type="file" 
                    multiple 
                    onChange={handleSupportingDocumentsChange} 
                    className="hidden" 
                    accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/*,.txt" // Common document types
                  />
                </div>
                {errors.supportingDocuments && <p className="text-sm text-red-600 mt-1">{errors.supportingDocuments}</p>}
              </div>

              {supportingDocuments.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Selected Supporting Documents:</h4>
                  <ul className="space-y-2">
                    {supportingDocuments.map((file, index) => (
                      <li key={index} className="flex items-center justify-between p-2 border rounded-md bg-gray-50">
                        <div className="text-sm">
                          <p className="font-medium truncate max-w-xs">{file.name}</p>
                          <p className="text-xs text-gray-500">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                        </div>
                        <Button type="button" variant="ghost" size="sm" onClick={() => removeSupportingDocument(index)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

                          {/* Dynamic Pricing Options */}
<div className="space-y-4 pt-4">
                <h3 className="text-md font-semibold">Vetting Options</h3>
                <div className="space-y-2">
                  <Label>Media Type *</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button
                      type="button"
                      variant={mediaType === "traditional" ? "default" : "outline"}
                      className={`h-auto p-4 border-2 rounded-lg flex flex-col items-center justify-center space-y-2 relative ${mediaType === "traditional" ? "border-blue-600 ring-2 ring-blue-600" : "border-gray-300"}`}
                      onClick={() => {
                        setMediaType("traditional");
                        if (errors.mediaType) setErrors(prev => ({...prev, mediaType: undefined}));
                      }}
                    >
                      {mediaType === "traditional" && <CheckCircle2 className="absolute top-2 right-2 h-5 w-5 text-white" />}
                      <Tv className="h-10 w-10 mb-2 !mt-0" size={40} />
                      <span className="text-sm font-medium">Traditional Media</span>
                      <span className={`text-xs ${mediaType === "traditional" ? "text-white" : "text-muted-foreground"}`}>e.g., TV, Radio, Print</span>
                    </Button>
                    <Button
                      type="button"
                      variant={mediaType === "digital" ? "default" : "outline"}
                      className={`h-auto p-4 border-2 rounded-lg flex flex-col items-center justify-center space-y-2 relative ${mediaType === "digital" ? "border-blue-600 ring-2 ring-blue-600" : "border-gray-300"}`}
                      onClick={() => {
                        setMediaType("digital");
                        if (errors.mediaType) setErrors(prev => ({...prev, mediaType: undefined}));
                      }}
                    >
                      {mediaType === "digital" && <CheckCircle2 className="absolute top-2 right-2 h-5 w-5 text-white" />}
                      <Smartphone className="h-10 w-10 mb-2 !mt-0" size={40}  />
                      <span className="text-sm font-medium">Digital Media</span>
                    <span className={`text-xs ${mediaType === "digital" ? "text-white" : "text-muted-foreground"}`}>e.g., Online, Social</span>
                    </Button>
                  </div>
                  {errors.mediaType && <p className="text-sm text-red-600 mt-1">{errors.mediaType}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="vettingSpeed">Vetting Speed *</Label>
                  <Select
                    name="vettingSpeed"
                    value={vettingSpeed}
                    onValueChange={(value: VettingSpeed) => {
                      setVettingSpeed(value);
                       if (errors.vettingSpeed) setErrors(prev => ({...prev, vettingSpeed: undefined}));
                    }}
                  >
                    <SelectTrigger id="vettingSpeed" className={errors.vettingSpeed ? "border-red-500" : ""}>
                      <SelectValue placeholder="Select vetting speed" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">Normal Vetting</SelectItem>
                      <SelectItem value="16hr">Accelerated: Within 16 hours</SelectItem>
                      <SelectItem value="8hr">Accelerated: Within 8 hours</SelectItem>
                      <SelectItem value="4hr">Accelerated: Within 4 hours</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.vettingSpeed && <p className="text-sm text-red-600">{errors.vettingSpeed}</p>}
                </div>
                {mediaType && vettingSpeed && calculatedFeeInNgn !== null && (
                  <Alert variant="default" className="mt-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Calculated Fee</AlertTitle>
                    <AlertDescription>
                      Selected: {mediaType === "traditional" ? "Traditional" : "Digital"} Media, Vetting Speed: {
                        vettingSpeed === "normal" ? "Normal" :
                        vettingSpeed === "16hr" ? "16 Hours Accelerated" :
                        vettingSpeed === "8hr" ? "8 Hours Accelerated" :
                        "4 Hours Accelerated"
                      }.
                      <br />
                      Total Fee: <strong>₦{calculatedFeeInNgn.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            
            <hr />
            
              {/* Affirmation Checkboxes - common to both tabs, placed outside TabsContent but inside form */}
              <div className="space-y-4 pt-4 border-t border-gray-200">
                <h3 className="text-md font-semibold">Affirmations</h3>
                <div className="items-top flex space-x-2">
                  <Checkbox id="affirmation1" checked={affirmation1} onCheckedChange={(checked) => { setAffirmation1(checked as boolean); if (errors.affirmation1) setErrors(prev => ({...prev, affirmation1: undefined})); }} />
                  <div className="grid gap-1.5 leading-none">
                    <label
                      htmlFor="affirmation1"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      I affirm that all information and materials submitted are accurate and compliant with applicable advertising guidelines.
                    </label>
                    {errors.affirmation1 && <p className="text-xs text-red-600">{errors.affirmation1}</p>}
                  </div>
                </div>
                <div className="items-top flex space-x-2">
                  <Checkbox id="affirmation2" checked={affirmation2} onCheckedChange={(checked) => { setAffirmation2(checked as boolean); if (errors.affirmation2) setErrors(prev => ({...prev, affirmation2: undefined})); }} />
                  <div className="grid gap-1.5 leading-none">
                    <label
                      htmlFor="affirmation2"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      I confirm that I am authorized to submit on behalf of the advertiser.
                    </label>
                    {errors.affirmation2 && <p className="text-xs text-red-600">{errors.affirmation2}</p>}
                  </div>
                </div>
                <div className="items-top flex space-x-2">
                  <Checkbox id="affirmation3" checked={affirmation3} onCheckedChange={(checked) => { setAffirmation3(checked as boolean); if (errors.affirmation3) setErrors(prev => ({...prev, affirmation3: undefined})); }} />
                  <div className="grid gap-1.5 leading-none">
                    <label
                      htmlFor="affirmation3"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      I acknowledge that any misleading or false information may lead to sanctions.
                    </label>
                    {errors.affirmation3 && <p className="text-xs text-red-600">{errors.affirmation3}</p>}
                  </div>
                </div>
              </div>
            </form>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          <Button 
            type="submit" 
            form="ad-submission-form" 
            className="bg-blue-600 hover:bg-blue-700" 
            disabled={isSubmitting || isPaymentProcessing || !calculatedFeeInKobo || !mediaType /* Disable if rate not calculated or media type not chosen */}
          >
            {/* {isFetchingRate ? "Loading Rate..." : // No longer fetching rate
              (isSubmitting ? "Submitting Ad..." : 
              (isPaymentProcessing ? "Processing Payment..." : "Pay Fee & Submit"))
            } */}
            {isSubmitting ? "Submitting Ad..." : 
              (isPaymentProcessing ? "Processing Payment..." : 
              (calculatedFeeInNgn !== null ? `Pay ₦${calculatedFeeInNgn.toLocaleString()} & Submit` : "Proceed to Payment"))
            }
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
             {calculatedFeeInNgn !== null ? 
                `Review your ad details and proceed to payment. The total fee is ₦${calculatedFeeInNgn.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.` :
                "Please ensure all ad details and vetting options are selected. Fee will be displayed once calculated."
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <h4 className="font-semibold text-slate-700 mb-2">Ad Summary:</h4>
              <ul className="list-disc list-inside text-sm text-slate-600 space-y-1">
                <li><span className="font-medium">Title:</span> {formData.title || "N/A"}</li>
                <li><span className="font-medium">Ad File:</span> {adFile?.name || "N/A"}</li>
                {supportingDocuments.length > 0 && (
                  <li><span className="font-medium">Supporting Docs:</span> {supportingDocuments.length} file(s)</li>
                )}
              </ul>
              <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-200">
                <span className="font-medium text-slate-700">Total Fee:</span>
                <span className="font-bold text-lg text-blue-600">
                  {/* {isFetchingRate && "Calculating..."} // No longer fetching rate */}
                  {calculatedFeeInNgn !== null ? `₦${calculatedFeeInNgn.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "N/A"}
                  {/* {!isFetchingRate && !calculatedFeeInNgn && exchangeRateError && `USD $${AD_SUBMISSION_FEE_USD.toFixed(2)} (Fallback NGN may apply)`}
                  {!isFetchingRate && !calculatedFeeInNgn && !exchangeRateError && `USD $${AD_SUBMISSION_FEE_USD.toFixed(2)} (NGN N/A)`} */}
                </span>
              </div>
              <div className="mt-2 text-sm text-slate-500">
                <p><span className="font-medium">Media Type:</span> {mediaType ? (mediaType.charAt(0).toUpperCase() + mediaType.slice(1)) : "N/A"}</p>
                <p><span className="font-medium">Vetting Speed:</span> {
                  vettingSpeed === "normal" ? "Normal" :
                  vettingSpeed === "16hr" ? "Accelerated (16hr)" :
                  vettingSpeed === "8hr" ? "Accelerated (8hr)" :
                  vettingSpeed === "4hr" ? "Accelerated (4hr)" : "N/A"
                }</p>
              </div>
            </div>
            
            {session?.user?.email && calculatedFeeInKobo !== null ? ( // Check calculatedFeeInKobo is not null
              <Paystack
                amountInKobo={calculatedFeeInKobo} // This is now dynamically calculated NGN in Kobo
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
              <Alert variant={calculatedFeeInKobo === null ? "default" : "destructive"}>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>{!session?.user?.email ? "User Email Missing" : "Payment Unavailable"}</AlertTitle>
                <AlertDescription>
                  {!session?.user?.email ? "User email not found. Please ensure you are logged in." :
                   calculatedFeeInKobo === null ? "Could not determine payment amount. Please ensure media type and vetting speed are selected, or contact support if this persists." :
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
