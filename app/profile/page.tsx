"use client"

import { useState, useEffect, useRef } from "react";
import { Camera, Mail, Calendar, MapPin, Award, AlertTriangle, Loader2, CheckCircle, XCircle, Briefcase, Link as LinkIcon, Clock, ChartBarStacked, Earth } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { useUserProfile, useUpdateUserProfile, type UserProfileData, type UpdateUserProfilePayload } from "@/hooks/use-user-profile";
import { useSubmitterDashboardStats } from "@/hooks/use-submitter-dashboard-stats";
import { useReviewerProfileData, type ReviewerPerformanceStats, type RecentActivityItem } from "@/hooks/use-reviewer-profile-data";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Import Select components

interface UnifiedProfileData extends UserProfileData {
  image?: string;
  phone: string;
  // location: string; // Removed as per request
  bio: string;
  joinDate: string;
  company?: string;
  website?: string; // Submitter's website

  // Reviewer specific fields
  department?: string; // Reviewer's internal department
  expertise?: string[]; // Reviewer's areas of expertise
  reviewerLevel?: string;

  // Submitter specific fields
  submitterType?: "business" | "agency" | "";
  registrationNumber?: string;
  sector?: string;
  officeAddress?: string;
  state?: string;
  country?: string;
  businessDescription?: string;

  // Stats 
  totalAds?: number; // For submitter
  approvedAds?: number; // For submitter
  rejectedAds?: number; // For submitter
  pendingAds?: number; // For submitter
  totalReviews?: number; // For reviewer
  approvedReviews?: number; // For reviewer
  rejectedReviews?: number; // For reviewer
  avgReviewTimeMs?: number;
  avgReviewTimeDisplay?: string;
  accuracy?: number;
  recentActivities?: RecentActivityItem[];
}

const initialUnifiedProfileData: UnifiedProfileData = {
  _id: "",
  firstName: "",
  lastName: "",
  email: "",
  role: "",
  image: undefined,
  phone: "",
  // location: "", // Removed
  bio: "",
  joinDate: "",
  company: "",
  website: "",
  
  // Reviewer specific defaults
  department: "Quality Assurance", 
  expertise: [], 
  reviewerLevel: "Junior", 

  // Submitter specific defaults
  submitterType: "",
  registrationNumber: "",
  sector: "",
  officeAddress: "",
  state: "",
  country: "",
  businessDescription: "",

  // Stats defaults
  totalAds: 0, // For submitter
  approvedAds: 0, // For submitter
  rejectedAds: 0, // For submitter
  pendingAds: 0, // For submitter
  totalReviews: 0, // For reviewer
  approvedReviews: 0, // For reviewer
  rejectedReviews: 0,
  avgReviewTimeMs: 0,
  avgReviewTimeDisplay: "0 minutes",
  accuracy: 0,
  recentActivities: [],
};

const calculateReviewerLevel = (totalReviews?: number): string => {
  if (totalReviews === undefined || totalReviews === null) return "Junior"; // Default if undefined
  if (totalReviews >= 500) return "Lead";
  if (totalReviews >= 200) return "Senior";
  if (totalReviews >= 50) return "Mid-Level";
  return "Junior";
};

// Define a list of sectors for the dropdown, same as in signup
const businessSectors = [
  "Technology",
  "Finance",
  "Healthcare",
  "Retail",
  "Manufacturing",
  "Education",
  "Real Estate",
  "Hospitality",
  "Agriculture",
  "Other",
];

export default function UnifiedProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState<UnifiedProfileData>(initialUnifiedProfileData);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [newlyUploadedImageUrl, setNewlyUploadedImageUrl] = useState<string | null>(null);

  const {
    data: fetchedProfileData,
    isLoading: isLoadingProfile,
    error: profileError,
    refetch: refetchProfile
  } = useUserProfile();

  const {
    mutate: updateProfile,
    isPending: isUpdatingProfile
  } = useUpdateUserProfile();

  const { 
    data: submitterStats,
    isLoading: isLoadingSubmitterStats,
    error: submitterStatsError,
    refetch: refetchSubmitterStats,
  } = useSubmitterDashboardStats({ enabled: !!(profileData.role && profileData.role === 'submitter') });

  const {
    data: reviewerProfileApiData,
    isLoading: isLoadingReviewerProfileData,
    error: reviewerProfileDataError,
    refetch: refetchReviewerProfileData,
  } = useReviewerProfileData(
    fetchedProfileData?._id, // Pass the logged-in user's ID
    { enabled: !!(fetchedProfileData?._id && profileData.role && profileData.role === 'reviewer') }
  );

  // The useAdCategories hook call and its destructured variables (adCategories, isLoadingAdCategories, adCategoriesError)
  // were intended to be fully removed. Ensuring they are not present.

  const formatAvgReviewTime = (ms?: number): string => {
    if (ms === undefined || ms === null || ms < 0) return "N/A";
    if (ms === 0) return "0 minutes";
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    if (minutes > 0 && seconds > 0) return `${minutes}m ${seconds}s`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''}`;
    if (seconds > 0) return `${seconds} second${seconds > 1 ? 's' : ''}`;
    return "<1s";
  };

  useEffect(() => {
    if (fetchedProfileData) {
      setProfileData(prev => ({
        ...initialUnifiedProfileData,
        ...fetchedProfileData,
        role: fetchedProfileData.role || initialUnifiedProfileData.role,
        image: fetchedProfileData.profileImageUrl || initialUnifiedProfileData.image,
        phone: fetchedProfileData.phone || initialUnifiedProfileData.phone,
        // location: fetchedProfileData.location || initialUnifiedProfileData.location, // Removed
        bio: fetchedProfileData.bio || initialUnifiedProfileData.bio,
        joinDate: fetchedProfileData.joinDate || initialUnifiedProfileData.joinDate,
        company: fetchedProfileData.company || initialUnifiedProfileData.company, // Used for Submitter's company or Reviewer's affiliated company
        website: fetchedProfileData.website || initialUnifiedProfileData.website, // Submitter's website
        
        // Submitter specific fields
        submitterType: fetchedProfileData.submitterType || initialUnifiedProfileData.submitterType,
        registrationNumber: fetchedProfileData.registrationNumber || initialUnifiedProfileData.registrationNumber,
        sector: fetchedProfileData.sector || initialUnifiedProfileData.sector,
        officeAddress: fetchedProfileData.officeAddress || initialUnifiedProfileData.officeAddress,
        state: fetchedProfileData.state || initialUnifiedProfileData.state,
        country: fetchedProfileData.country || initialUnifiedProfileData.country,
        businessDescription: fetchedProfileData.businessDescription || initialUnifiedProfileData.businessDescription,
        
        // Reviewer specific fields
        department: fetchedProfileData.department || initialUnifiedProfileData.department,
        expertise: fetchedProfileData.expertise || initialUnifiedProfileData.expertise,
        reviewerLevel: calculateReviewerLevel(reviewerProfileApiData?.performanceStats.totalReviews) || initialUnifiedProfileData.reviewerLevel, // Recalculate or use fetched
      }));
      setNewlyUploadedImageUrl(null);
    }
  }, [fetchedProfileData]);

  useEffect(() => {
    if (submitterStats && profileData.role === 'submitter') {
      setProfileData(prev => ({
        ...prev,
        totalAds: submitterStats.totalAds,
        approvedAds: submitterStats.approvedAds,
        pendingAds: submitterStats.pendingAds,
        rejectedAds: submitterStats.rejectedAds,
      }));
    }
  }, [submitterStats, profileData.role]);

  useEffect(() => {
    if (reviewerProfileApiData && profileData.role === 'reviewer') {
      const newLevel = calculateReviewerLevel(reviewerProfileApiData.performanceStats.totalReviews);
      setProfileData(prev => ({
        ...prev,
        totalReviews: reviewerProfileApiData.performanceStats.totalReviews,
        approvedReviews: reviewerProfileApiData.performanceStats.approvedReviews,
        rejectedReviews: reviewerProfileApiData.performanceStats.rejectedReviews,
        avgReviewTimeMs: reviewerProfileApiData.performanceStats.avgReviewTimeMs,
        avgReviewTimeDisplay: formatAvgReviewTime(reviewerProfileApiData.performanceStats.avgReviewTimeMs),
        accuracy: reviewerProfileApiData.performanceStats.accuracy,
        recentActivities: reviewerProfileApiData.recentActivities,
        reviewerLevel: newLevel, // Calculate and set reviewerLevel
      }));
    }
  }, [reviewerProfileApiData, profileData.role]);

  const handleInputChange = (field: keyof UnifiedProfileData, value: string | number | string[]) => {
    setProfileData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    let payload: UpdateUserProfilePayload = {
      firstName: profileData.firstName,
      lastName: profileData.lastName,
      phone: profileData.phone,
      // location: profileData.location, // Removed
      bio: profileData.bio,
      profileImageUrl: newlyUploadedImageUrl || profileData.image,
    };

    // Common fields are already in payload

    if (profileData.role === "submitter") {
      payload = { 
        ...payload, 
        company: profileData.company, // Business/Agency Name
        website: profileData.website,
        submitterType: profileData.submitterType,
        registrationNumber: profileData.registrationNumber,
        sector: profileData.submitterType === 'business' ? profileData.sector : undefined, // Only for business
        officeAddress: profileData.submitterType === 'business' ? profileData.officeAddress : undefined,
        state: profileData.submitterType === 'business' ? profileData.state : undefined,
        country: profileData.submitterType === 'business' ? profileData.country : undefined,
        businessDescription: profileData.submitterType === 'business' ? profileData.businessDescription : undefined,
      };
    } else if (profileData.role === "reviewer") {
      payload = { 
        ...payload, 
        department: profileData.department,
        company: profileData.company, // Reviewer's affiliated company if any
        expertise: profileData.expertise || [] 
      };
    }

    updateProfile(payload, {
      onSuccess: (data) => {
        toast({ title: "Profile Updated", description: data.message || "Your profile has been successfully updated." });
        setIsEditing(false);
        setNewlyUploadedImageUrl(null);
        refetchProfile(); 
      },
      onError: (error: Error) => {
        toast({ title: "Update Failed", description: error.message || "Could not update profile.", variant: "destructive" });
      }
    });
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setNewlyUploadedImageUrl(null);
    if (fetchedProfileData) {
      const currentTotalReviews = reviewerProfileApiData?.performanceStats.totalReviews;
      const calculatedLevel = fetchedProfileData.role === 'reviewer' 
        ? calculateReviewerLevel(currentTotalReviews) 
        : (fetchedProfileData as UnifiedProfileData).reviewerLevel || initialUnifiedProfileData.reviewerLevel;

       setProfileData(prev => ({
        ...initialUnifiedProfileData,
        ...fetchedProfileData,
        image: fetchedProfileData.profileImageUrl || initialUnifiedProfileData.image,
        role: fetchedProfileData.role || initialUnifiedProfileData.role,
        
        // Submitter specific
        submitterType: fetchedProfileData.submitterType || initialUnifiedProfileData.submitterType,
        registrationNumber: fetchedProfileData.registrationNumber || initialUnifiedProfileData.registrationNumber,
        sector: fetchedProfileData.sector || initialUnifiedProfileData.sector,
        officeAddress: fetchedProfileData.officeAddress || initialUnifiedProfileData.officeAddress,
        state: fetchedProfileData.state || initialUnifiedProfileData.state,
        country: fetchedProfileData.country || initialUnifiedProfileData.country,
        businessDescription: fetchedProfileData.businessDescription || initialUnifiedProfileData.businessDescription,

        // Reviewer specific
        department: fetchedProfileData.department || initialUnifiedProfileData.department,
        expertise: fetchedProfileData.expertise || initialUnifiedProfileData.expertise,
        reviewerLevel: calculatedLevel,
        
        // Stats
        totalReviews: currentTotalReviews ?? initialUnifiedProfileData.totalReviews,
        approvedReviews: reviewerProfileApiData?.performanceStats.approvedReviews ?? initialUnifiedProfileData.approvedReviews,
        rejectedReviews: reviewerProfileApiData?.performanceStats.rejectedReviews ?? initialUnifiedProfileData.rejectedReviews,
        avgReviewTimeMs: reviewerProfileApiData?.performanceStats.avgReviewTimeMs ?? initialUnifiedProfileData.avgReviewTimeMs,
        avgReviewTimeDisplay: formatAvgReviewTime(reviewerProfileApiData?.performanceStats.avgReviewTimeMs) ?? initialUnifiedProfileData.avgReviewTimeDisplay,
        accuracy: reviewerProfileApiData?.performanceStats.accuracy ?? initialUnifiedProfileData.accuracy,
        recentActivities: reviewerProfileApiData?.recentActivities ?? initialUnifiedProfileData.recentActivities,
      }));
    } else {
      setProfileData(initialUnifiedProfileData);
    }
  };
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) { // 2MB limit
      toast({ title: "File too large", description: "Please select an image smaller than 2MB.", variant: "destructive" });
      if(event.target) event.target.value = "";
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
        toast({ title: "Invalid File Type", description: "Only JPG, PNG, GIF, WEBP are allowed.", variant: "destructive" });
        if(event.target) event.target.value = "";
        return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setProfileData((prev) => ({ ...prev, image: reader.result as string }));
    };
    reader.readAsDataURL(file);

    const formData = new FormData();
    formData.append('profileImage', file);
    setIsUploadingImage(true);
    setNewlyUploadedImageUrl(null);

    try {
      const response = await fetch('/api/user/upload-profile-image', { method: 'POST', body: formData });
      const result = await response.json();

      if (!response.ok) throw new Error(result.message || 'Image upload failed.');
      
      setNewlyUploadedImageUrl(result.imageUrl);
      setProfileData((prev) => ({ ...prev, image: result.imageUrl }));
      toast({ title: "Image Uploaded", description: "Ready to save. Click 'Save Changes'." });
    } catch (uploadError: any) {
      toast({ title: "Upload Failed", description: uploadError.message || "Could not upload image.", variant: "destructive" });
    } finally {
      setIsUploadingImage(false);
      if(event.target) event.target.value = ""; 
    }
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName || !lastName) return "";
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };
  
  const getReviewerLevelColor = (level?: string) => {
    switch (level) {
      case "Lead": return "bg-indigo-100 text-indigo-800"; // Changed Lead color for better distinction
      case "Senior": return "bg-purple-100 text-purple-800";
      case "Mid-Level": return "bg-blue-100 text-blue-800"; // Added Mid-Level
      case "Junior": return "bg-gray-100 text-gray-800"; // Explicitly Junior
      default: return "bg-gray-100 text-gray-800"; // Fallback
    }
  };

  if (isLoadingProfile) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
        <p className="ml-4 text-lg">Loading profile...</p>
      </div>
    );
  }

  if (profileError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-red-600">
        <AlertTriangle className="h-12 w-12 mb-4" />
        <p className="text-lg">Error loading profile: {profileError.message}</p>
        <Button onClick={() => refetchProfile()} className="mt-4">Try Again</Button>
      </div>
    );
  }
  
  const userRole = profileData.role?.toLowerCase();

  const displayTotalAds = userRole === 'submitter' && submitterStats ? submitterStats.totalAds : profileData.totalAds;
  const displayApprovedAds = userRole === 'submitter' && submitterStats ? submitterStats.approvedAds : profileData.approvedAds;
  const displayPendingAds = userRole === 'submitter' && submitterStats ? submitterStats.pendingAds : profileData.pendingAds;
  const displayRejectedAds = userRole === 'submitter' && submitterStats ? submitterStats.rejectedAds : profileData.rejectedAds;

  const displayTotalReviews = userRole === 'reviewer' ? (reviewerProfileApiData?.performanceStats.totalReviews ?? profileData.totalReviews) : 0;
  const displayApprovedReviews = userRole === 'reviewer' ? (reviewerProfileApiData?.performanceStats.approvedReviews ?? profileData.approvedReviews) : 0;
  const displayRejectedReviews = userRole === 'reviewer' ? (reviewerProfileApiData?.performanceStats.rejectedReviews ?? profileData.rejectedReviews) : 0;
  const displayAvgReviewTime = userRole === 'reviewer' ? (formatAvgReviewTime(reviewerProfileApiData?.performanceStats.avgReviewTimeMs) ?? profileData.avgReviewTimeDisplay) : "N/A";
  const displayAccuracy = userRole === 'reviewer' ? (reviewerProfileApiData?.performanceStats.accuracy ?? profileData.accuracy) : 0;
  const displayRecentActivities = userRole === 'reviewer' ? (reviewerProfileApiData?.recentActivities ?? profileData.recentActivities) : [];

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
        <div className="mt-2 sm:mt-0">
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)} className="bg-blue-600 hover:bg-blue-700">Edit Profile</Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCancelEdit} disabled={isUpdatingProfile || isUploadingImage}>Cancel</Button>
              <Button onClick={handleSave} disabled={isUpdatingProfile || isUploadingImage} className="bg-blue-600 hover:bg-blue-700">
                {isUpdatingProfile ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : 
                 isUploadingImage ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Uploading...</> : 
                 "Save Changes"}
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={profileData.image} alt="Profile" />
                  <AvatarFallback className="text-lg">{getInitials(profileData.firstName, profileData.lastName)}</AvatarFallback>
                </Avatar>
                {isEditing && (
                  <>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: "none" }} accept="image/png, image/jpeg, image/gif, image/webp" />
                    <Button size="icon" variant="outline" className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full" onClick={handleImageUploadClick} disabled={isUploadingImage}>
                      <Camera className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
            <CardTitle className="capitalize">{profileData.firstName} {profileData.lastName}</CardTitle>
            <CardDescription>
              {userRole === 'reviewer' && profileData.reviewerLevel && (<Badge className={getReviewerLevelColor(profileData.reviewerLevel)}>{profileData.reviewerLevel} Reviewer</Badge>)}
              {userRole === 'submitter' && (<Badge variant="secondary">Submitter {profileData.submitterType && `(${profileData.submitterType.charAt(0).toUpperCase() + profileData.submitterType.slice(1)})`}</Badge>)}
              {!userRole && <Badge variant="outline">User</Badge>}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center text-sm text-gray-600"><Mail className="h-4 w-4 mr-2" />{profileData.email}</div>
            {/* Location display will now rely on state/country for business submitters, or be absent */}
            <div className="flex items-center text-sm text-gray-600"><Calendar className="h-4 w-4 mr-2" />Joined {profileData.joinDate ? new Date(profileData.joinDate).toLocaleDateString() : "N/A"}</div>
            
            {userRole === 'reviewer' && (
              <>
                {profileData.accuracy !== undefined && (<div className="flex items-center text-sm text-gray-600"><Award className="h-4 w-4 mr-2" />{profileData.accuracy}% Accuracy Rate</div>)}
                {profileData.department && (<div className="flex items-center text-sm text-gray-600"><Briefcase className="h-4 w-4 mr-2" />{isEditing ? <Input value={profileData.department || ""} onChange={(e) => handleInputChange("department", e.target.value)} className="text-sm p-1 h-auto" disabled={isUpdatingProfile || isUploadingImage} /> : profileData.department}</div>)}
                {profileData.company && (<div className="flex items-center text-sm text-gray-600"><Briefcase className="h-4 w-4 mr-2" />Affiliated: {isEditing ? <Input value={profileData.company || ""} onChange={(e) => handleInputChange("company", e.target.value)} className="text-sm p-1 h-auto" disabled={isUpdatingProfile || isUploadingImage} /> : profileData.company}</div>)}
              </>
            )}

            {userRole === 'submitter' && (
              <>
                <div className="flex items-center text-sm text-gray-600"><Briefcase className="h-4 w-4 mr-2" />
                  {isEditing ? 
                    <Input value={profileData.company || ""} onChange={(e) => handleInputChange("company", e.target.value)} placeholder="Company Name" className="text-sm p-1 h-auto" disabled={isUpdatingProfile || isUploadingImage} /> 
                    : profileData.company || "Company Name N/A"}
                  {profileData.submitterType && <Badge variant="outline" className="ml-2">{profileData.submitterType.charAt(0).toUpperCase() + profileData.submitterType.slice(1)}</Badge>}
                </div>
                {profileData.registrationNumber && (<div className="flex items-center text-sm text-gray-600"><Award className="h-4 w-4 mr-2" />Reg No: {isEditing ? <Input value={profileData.registrationNumber || ""} onChange={(e) => handleInputChange("registrationNumber", e.target.value)} className="text-sm p-1 h-auto" disabled={isUpdatingProfile || isUploadingImage} /> : profileData.registrationNumber}</div>)}
                {profileData.website && (<div className="flex items-center text-sm text-gray-600"><LinkIcon className="h-4 w-4 mr-2" />{isEditing ? <Input value={profileData.website || ""} onChange={(e) => handleInputChange("website", e.target.value)} className="text-sm p-1 h-auto" disabled={isUpdatingProfile || isUploadingImage} /> : <a href={profileData.website} target="_blank" rel="noopener noreferrer" className="hover:underline">{profileData.website}</a>}</div>)}
                {profileData.submitterType === 'business' && (
                  <>
                    {profileData.sector && (<div className="flex items-center text-sm text-gray-600"><ChartBarStacked  className="h-4 w-4 mr-2" />Sector: {isEditing ? <Input value={profileData.sector || ""} onChange={(e) => handleInputChange("sector", e.target.value)} className="text-sm p-1 h-auto" disabled={isUpdatingProfile || isUploadingImage} /> : profileData.sector}</div>)}
                    {profileData.officeAddress && (<div className="flex items-center text-sm text-gray-600"><MapPin className="h-4 w-4 mr-2" />Address: {isEditing ? <Textarea value={profileData.officeAddress || ""} onChange={(e) => handleInputChange("officeAddress", e.target.value)} className="text-sm p-1 h-auto" disabled={isUpdatingProfile || isUploadingImage} /> : profileData.officeAddress}</div>)}
                    <div className="flex items-center text-sm text-gray-600">
                      <Earth className="h-4 w-4 mr-2" />
                      Address:
                      {isEditing ? (
                        <div className="flex ml-1 space-x-1 flex-grow">
                          <Input
                            value={profileData.state || ""}
                            onChange={(e) => handleInputChange("state", e.target.value)}
                            placeholder="State"
                            className="text-sm p-1 h-auto flex-1 min-w-0"
                            disabled={isUpdatingProfile || isUploadingImage}
                          />
                          <Input
                            value={profileData.country || ""}
                            onChange={(e) => handleInputChange("country", e.target.value)}
                            placeholder="Country"
                            className="text-sm p-1 h-auto flex-1 min-w-0"
                            disabled={isUpdatingProfile || isUploadingImage}
                          />
                        </div>
                      ) : (
                        <span className="ml-1">
                          {(profileData.state && profileData.country)
                            ? `${profileData.state}, ${profileData.country}`
                            : profileData.state
                            ? profileData.state
                            : profileData.country
                            ? profileData.country
                            : "Unknown"}
                        </span>
                      )}
                    </div>
                  </>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader><CardTitle>Profile Information</CardTitle><CardDescription>Manage your personal and role-specific information.</CardDescription></CardHeader>
          <CardContent className="space-y-6">
            {/* Basic Info */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2"><Label htmlFor="firstName">First Name</Label><Input id="firstName" value={profileData.firstName} onChange={(e) => handleInputChange("firstName", e.target.value)} disabled={!isEditing || isUpdatingProfile || isUploadingImage} /></div>
              <div className="space-y-2"><Label htmlFor="lastName">Last Name</Label><Input id="lastName" value={profileData.lastName} onChange={(e) => handleInputChange("lastName", e.target.value)} disabled={!isEditing || isUpdatingProfile || isUploadingImage} /></div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" value={profileData.email} readOnly className="bg-gray-100 cursor-not-allowed" /></div>
              <div className="space-y-2"><Label htmlFor="phone">Phone</Label><Input id="phone" value={profileData.phone} onChange={(e) => handleInputChange("phone", e.target.value)} disabled={!isEditing || isUpdatingProfile || isUploadingImage} /></div>
            </div>
            {/* Location field removed from here. State and Country fields are part of submitter business type section */}
            
            {/* Role Specific Fields */}
            {userRole === 'reviewer' && (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2"><Label htmlFor="department">Department</Label><Input id="department" value={profileData.department || ""} onChange={(e) => handleInputChange("department", e.target.value)} disabled={!isEditing || isUpdatingProfile || isUploadingImage} /></div>
                  <div className="space-y-2"><Label htmlFor="companyReviewer">Affiliated Company (Optional)</Label><Input id="companyReviewer" value={profileData.company || ""} onChange={(e) => handleInputChange("company", e.target.value)} disabled={!isEditing || isUpdatingProfile || isUploadingImage} placeholder="e.g. Partner Org Inc." /></div>
                </div>
                {/* Expertise could be a multi-select or tags input if needed, for now, simple text for API */}
                <div className="space-y-2"><Label htmlFor="expertise">Areas of Expertise (comma-separated)</Label><Input id="expertise" value={profileData.expertise?.join(", ") || ""} onChange={(e) => handleInputChange("expertise", e.target.value.split(",").map(s => s.trim()))} disabled={!isEditing || isUpdatingProfile || isUploadingImage} placeholder="e.g. Finance, Healthcare Ads, E-commerce" /></div>
              </>
            )}

            {userRole === 'submitter' && (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="submitterType">Submitter Type</Label>
                    {isEditing ? (
                      <select id="submitterType" value={profileData.submitterType || ""} onChange={(e) => handleInputChange("submitterType", e.target.value)} disabled={!isEditing || isUpdatingProfile || isUploadingImage} className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                        <option value="">Select Type</option>
                        <option value="business">Business</option>
                        <option value="agency">Agency</option>
                      </select>
                    ) : (
                      <Input value={profileData.submitterType ? profileData.submitterType.charAt(0).toUpperCase() + profileData.submitterType.slice(1) : "N/A"} readOnly className="bg-gray-100 cursor-not-allowed" />
                    )}
                  </div>
                  <div className="space-y-2"><Label htmlFor="companySubmitter">{profileData.submitterType === 'agency' ? 'Agency Name' : 'Business Name'}</Label><Input id="companySubmitter" value={profileData.company || ""} onChange={(e) => handleInputChange("company", e.target.value)} disabled={!isEditing || isUpdatingProfile || isUploadingImage} /></div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2"><Label htmlFor="registrationNumber">{profileData.submitterType === 'agency' ? 'Agency Reg. No.' : 'CAC Reg. No.'}</Label><Input id="registrationNumber" value={profileData.registrationNumber || ""} onChange={(e) => handleInputChange("registrationNumber", e.target.value)} disabled={!isEditing || isUpdatingProfile || isUploadingImage} /></div>
                  <div className="space-y-2"><Label htmlFor="website">Website</Label><Input id="website" value={profileData.website || ""} onChange={(e) => handleInputChange("website", e.target.value)} disabled={!isEditing || isUpdatingProfile || isUploadingImage} placeholder="https://example.com" /></div>
                </div>

                {profileData.submitterType === 'business' && (
                  <>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="sector">Sector</Label>
                        {isEditing ? (
                          <Select name="sector" onValueChange={(value) => handleInputChange("sector", value)} value={profileData.sector || ""} disabled={isUpdatingProfile || isUploadingImage}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a sector" />
                            </SelectTrigger>
                            <SelectContent>
                              {businessSectors.map((sector) => (
                                <SelectItem key={sector} value={sector}>{sector}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input id="sector" value={profileData.sector || "N/A"} readOnly className="bg-gray-100 cursor-not-allowed" />
                        )}
                      </div>
                      <div className="space-y-2"><Label htmlFor="officeAddress">Office Address</Label><Input id="officeAddress" value={profileData.officeAddress || ""} onChange={(e) => handleInputChange("officeAddress", e.target.value)} disabled={!isEditing || isUpdatingProfile || isUploadingImage} /></div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2"><Label htmlFor="state">State</Label><Input id="state" value={profileData.state || ""} onChange={(e) => handleInputChange("state", e.target.value)} disabled={!isEditing || isUpdatingProfile || isUploadingImage} /></div>
                      <div className="space-y-2"><Label htmlFor="country">Country</Label><Input id="country" value={profileData.country || ""} onChange={(e) => handleInputChange("country", e.target.value)} disabled={!isEditing || isUpdatingProfile || isUploadingImage} /></div>
                    </div>
                    <div className="space-y-2"><Label htmlFor="businessDescription">Business Description</Label><Textarea id="businessDescription" rows={3} value={profileData.businessDescription || ""} onChange={(e) => handleInputChange("businessDescription", e.target.value)} disabled={!isEditing || isUpdatingProfile || isUploadingImage} placeholder="Describe your business..." /></div>
                  </>
                )}
              </>
            )}
            {/* Common Bio */}
            <div className="space-y-2"><Label htmlFor="bio">Bio</Label><Textarea id="bio" rows={4} value={profileData.bio} onChange={(e) => handleInputChange("bio", e.target.value)} disabled={!isEditing || isUpdatingProfile || isUploadingImage} placeholder={userRole === 'reviewer' ? "Tell us about your reviewing experience..." : "Tell us about yourself or your company..."} /></div>
            
          </CardContent>
        </Card>

        {userRole === 'reviewer' && (<>
            {/* Review Performance and Recent Activity Cards remain the same */}
            <Card className="md:col-span-3">
              <CardHeader>
                <CardTitle>Review Performance</CardTitle>
                <CardDescription>Your reviewing statistics and performance metrics.</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingReviewerProfileData && ( /* ... loading UI ... */ <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /><p className="ml-3">Loading...</p></div>)}
                {reviewerProfileDataError && ( /* ... error UI ... */ <div className="text-red-500 p-4">Error: {reviewerProfileDataError.message}</div>)}
                {!isLoadingReviewerProfileData && !reviewerProfileDataError && reviewerProfileApiData && (
                  <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
                    <div className="text-center p-4 bg-blue-50 rounded-lg"><div className="text-2xl font-bold text-blue-600">{displayTotalReviews}</div><div className="text-sm text-gray-600">Total Reviews</div></div>
                    <div className="text-center p-4 bg-green-50 rounded-lg"><div className="text-2xl font-bold text-green-600">{displayApprovedReviews}</div><div className="text-sm text-gray-600">Approved</div></div>
                    <div className="text-center p-4 bg-red-50 rounded-lg"><div className="text-2xl font-bold text-red-600">{displayRejectedReviews}</div><div className="text-sm text-gray-600">Rejected</div></div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg"><div className="text-2xl font-bold text-purple-600">{displayAvgReviewTime}</div><div className="text-sm text-gray-600">Avg Review Time</div></div>
                    <div className="text-center p-4 bg-amber-50 rounded-lg"><div className="text-2xl font-bold text-amber-600">{displayAccuracy !== undefined ? `${displayAccuracy}%` : 'N/A'}</div><div className="text-sm text-gray-600">Accuracy Rate</div></div>
                  </div>
                )}
              </CardContent>
            </Card>
            <Card className="md:col-span-3">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Your latest review activities.</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingReviewerProfileData && ( /* ... loading UI ... */ <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /><p className="ml-3">Loading...</p></div>)}
                {reviewerProfileDataError && ( /* ... error UI ... */ <div className="text-red-500 p-4">Error: {reviewerProfileDataError.message}</div>)}
                {!isLoadingReviewerProfileData && !reviewerProfileDataError && displayRecentActivities && displayRecentActivities.length > 0 && (
                  <div className="space-y-4">
                    {displayRecentActivities?.map(activity => (
                      <div key={activity.id} className={`flex items-center justify-between p-3 rounded-lg ${activity.status === 'approved' ? 'bg-green-50' : 'bg-red-50'}`}>
                        <div className="flex items-center">
                          {activity.status === 'approved' ? <CheckCircle className="h-5 w-5 text-green-600 mr-3" /> : <XCircle className="h-5 w-5 text-red-600 mr-3" />}
                          <div>
                            <p className="font-medium">{activity.status === 'approved' ? 'Approved' : 'Rejected'} "{activity.title}"</p>
                            <p className="text-sm text-gray-500">{new Date(activity.reviewedAt).toLocaleString()}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className={activity.status === 'approved' ? 'text-green-600 border-green-600' : 'text-red-600 border-red-600'}>
                          {activity.status === 'approved' ? 'Approved' : 'Rejected'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
                {!isLoadingReviewerProfileData && !reviewerProfileDataError && displayRecentActivities && displayRecentActivities.length === 0 && (
                   <p className="text-center text-gray-500 py-4">No recent activities found.</p>
                )}
              </CardContent>
            </Card>
        </>)}
        
        {userRole === 'submitter' && (
          <Card className="md:col-span-3">
            <CardHeader>
              <CardTitle>Account Statistics</CardTitle>
              <CardDescription>Overview of your ad submissions.</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingSubmitterStats && ( <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /><p className="ml-3">Loading...</p></div>)}
              {submitterStatsError && (<div className="text-red-500 p-4">Error: {submitterStatsError.message}</div>)}
              {!isLoadingSubmitterStats && !submitterStatsError && submitterStats && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg"><div className="text-2xl font-bold text-blue-600">{displayTotalAds}</div><div className="text-sm text-gray-600">Total Ads</div></div>
                  <div className="text-center p-4 bg-green-50 rounded-lg"><div className="text-2xl font-bold text-green-600">{displayApprovedAds}</div><div className="text-sm text-gray-600">Approved Ads</div></div>
                  <div className="text-center p-4 bg-amber-50 rounded-lg"><div className="text-2xl font-bold text-amber-600">{displayPendingAds}</div><div className="text-sm text-gray-600">Pending Ads</div></div>
                  <div className="text-center p-4 bg-red-50 rounded-lg"><div className="text-2xl font-bold text-red-600">{displayRejectedAds}</div><div className="text-sm text-gray-600">Rejected Ads</div></div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
