"use client"

import { useState, useEffect } from "react"
import { Camera, Mail, Calendar, MapPin, Award, AlertTriangle, Loader2, CheckCircle, XCircle } from "lucide-react" // Added AlertTriangle, Loader2
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/hooks/use-toast"
import { useUserProfile, useUpdateUserProfile, type UserProfileData, type UpdateUserProfilePayload } from "@/hooks/use-user-profile"

// Define a more comprehensive type for the local state, including reviewer-specific fields and stats
interface ExtendedReviewerProfileData extends UserProfileData {
  phone: string; // Common field
  location: string; // Common field
  bio: string; // Common field
  department?: string; // Reviewer specific
  expertise?: string[]; // Reviewer specific
  joinDate: string; // Common field
  reviewerLevel?: string; // Reviewer specific stat/info
  totalReviews?: number; // Stat
  approvedReviews?: number; // Stat
  rejectedReviews?: number; // Stat
  avgReviewTime?: string; // Stat
  accuracy?: number; // Stat
}

const initialProfileData: ExtendedReviewerProfileData = {
  firstName: "",
  lastName: "",
  email: "",
  role: "", // Will come from API
  phone: "",
  location: "",
  bio: "",
  department: "Quality Assurance", // Mock
  expertise: ["Content Review", "Brand Safety", "Compliance"], // Mock
  joinDate: "",
  reviewerLevel: "Senior", // Mock
  totalReviews: 0, // Mock
  approvedReviews: 0, // Mock
  rejectedReviews: 0, // Mock
  avgReviewTime: "0 minutes", // Mock
  accuracy: 0, // Mock
};

export default function ReviewerProfile() {
  const [isEditing, setIsEditing] = useState(false)
  const [profileData, setProfileData] = useState<ExtendedReviewerProfileData>(initialProfileData);

  const { data: fetchedProfileData, isLoading: isLoadingProfile, error: profileError, refetch: refetchProfile } = useUserProfile();
  const { mutate: updateProfile, isPending: isUpdatingProfile } = useUpdateUserProfile();

  useEffect(() => {
    if (fetchedProfileData) {
      setProfileData(prev => ({
        ...prev, // Keep existing reviewer-specific mock data or local state
        firstName: fetchedProfileData.firstName || "",
        lastName: fetchedProfileData.lastName || "",
        email: fetchedProfileData.email || "",
        role: fetchedProfileData.role || "",
        phone: fetchedProfileData.phone || prev.phone || "", // Use fetched if available, else keep local/mock
        location: fetchedProfileData.location || prev.location || "",
        bio: fetchedProfileData.bio || prev.bio || "",
        joinDate: fetchedProfileData.joinDate || "",
        // Reviewer-specific fields like department, expertise, reviewerLevel are not in UserProfileData yet
        // They will retain their initial mock values or previous local state unless API is updated
      }));
    }
  }, [fetchedProfileData]);

  const handleInputChange = (field: keyof ExtendedReviewerProfileData, value: string | number | string[]) => {
    setProfileData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    const payload: UpdateUserProfilePayload = {
      firstName: profileData.firstName,
      lastName: profileData.lastName,
      phone: profileData.phone,
      // company: profileData.company, // Not present in reviewer data model
      location: profileData.location,
      bio: profileData.bio,
      // website: profileData.website, // Not present in reviewer data model
    };
    // Note: 'department' and 'expertise' are not sent as they are not in UpdateUserProfilePayload

    updateProfile(payload, {
      onSuccess: (data) => {
        toast({
          title: "Profile Updated",
          description: data.message || "Your profile has been successfully updated.",
        });
        setIsEditing(false);
      },
      onError: (error) => {
        toast({
          title: "Update Failed",
          description: error.message || "Could not update profile. Please try again.",
          variant: "destructive",
        });
      }
    });
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    if (fetchedProfileData) {
      setProfileData(prev => ({
        ...prev,
        firstName: fetchedProfileData.firstName || "",
        lastName: fetchedProfileData.lastName || "",
        email: fetchedProfileData.email || "",
        role: fetchedProfileData.role || "",
        phone: fetchedProfileData.phone || prev.phone || "",
        location: fetchedProfileData.location || prev.location || "",
        bio: fetchedProfileData.bio || prev.bio || "",
        joinDate: fetchedProfileData.joinDate || "",
      }));
    }
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName || !lastName) return "";
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };
  
  const getLevelColor = (level?: string) => {
    switch (level) {
      case "Senior": return "bg-purple-100 text-purple-800";
      case "Lead": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
        <div className="mt-2 sm:mt-0">
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)} className="bg-blue-600 hover:bg-blue-700">
              Edit Profile
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCancelEdit} disabled={isUpdatingProfile}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isUpdatingProfile} className="bg-blue-600 hover:bg-blue-700">
                {isUpdatingProfile ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : "Save Changes"}
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Card */}
        <Card className="md:col-span-1">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={profileData.image} alt="Profile" />
                  <AvatarFallback className="text-lg">
                    {getInitials(profileData.firstName, profileData.lastName)}
                  </AvatarFallback>
                </Avatar>
                {isEditing && (
                  <Button size="icon" variant="outline" className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full">
                    <Camera className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            <CardTitle>
              {profileData.firstName} {profileData.lastName}
            </CardTitle>
            <CardDescription>
              <Badge className={getLevelColor(profileData.reviewerLevel)}>{profileData.reviewerLevel} Reviewer</Badge>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center text-sm text-gray-600">
              <Mail className="h-4 w-4 mr-2" />
              {profileData.email}
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <MapPin className="h-4 w-4 mr-2" />
              {profileData.location||"Unknown"}
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <Calendar className="h-4 w-4 mr-2" />
              Joined {profileData.joinDate ? new Date(profileData.joinDate).toLocaleDateString() : "N/A"}
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <Award className="h-4 w-4 mr-2" />
              {profileData.accuracy}% Accuracy Rate
            </div>
          </CardContent>
        </Card>

        {/* Profile Details */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>Manage your personal information and reviewer details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={profileData.firstName}
                  onChange={(e) => handleInputChange("firstName", e.target.value)}
                  disabled={!isEditing || isUpdatingProfile}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={profileData.lastName}
                  onChange={(e) => handleInputChange("lastName", e.target.value)}
                  disabled={!isEditing || isUpdatingProfile}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={profileData.email}
                readOnly
                className="bg-gray-100 cursor-not-allowed"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={profileData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  disabled={!isEditing || isUpdatingProfile}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  value={profileData.department || ""}
                  onChange={(e) => handleInputChange("department", e.target.value)}
                  disabled={!isEditing || isUpdatingProfile}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={profileData.location}
                onChange={(e) => handleInputChange("location", e.target.value)}
                disabled={!isEditing || isUpdatingProfile}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                rows={4}
                value={profileData.bio}
                onChange={(e) => handleInputChange("bio", e.target.value)}
                disabled={!isEditing || isUpdatingProfile}
                placeholder="Tell us about your reviewing experience..."
              />
            </div>

            <div className="space-y-2">
              <Label>Areas of Expertise (Not Saved)</Label>
              <div className="flex flex-wrap gap-2">
                {(profileData.expertise || []).map((skill, index) => (
                  <Badge key={index} variant="secondary">
                    {skill}
                  </Badge>
                ))}
              </div>
               {isEditing && <Input placeholder="Add expertise (comma-separated)" defaultValue={(profileData.expertise || []).join(", ")} onChange={(e) => handleInputChange("expertise", e.target.value.split(",").map(s => s.trim()))} />}
            </div>
          </CardContent>
        </Card>

        {/* Review Statistics and Recent Activity cards remain as mock/local data */}
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Review Performance</CardTitle>
            <CardDescription>Your reviewing statistics and performance metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-5">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{profileData.totalReviews}</div>
                <div className="text-sm text-gray-600">Total Reviews</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{profileData.approvedReviews}</div>
                <div className="text-sm text-gray-600">Approved</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{profileData.rejectedReviews}</div>
                <div className="text-sm text-gray-600">Rejected</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{profileData.avgReviewTime}</div>
                <div className="text-sm text-gray-600">Avg Review Time</div>
              </div>
              <div className="text-center p-4 bg-amber-50 rounded-lg">
                <div className="text-2xl font-bold text-amber-600">{profileData.accuracy}%</div>
                <div className="text-sm text-gray-600">Accuracy Rate</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest review activities</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Mock recent activity - replace with dynamic data if needed */}
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                  <div>
                    <p className="font-medium">Approved "Holiday Special" ad</p>
                    <p className="text-sm text-gray-500">2 hours ago</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-green-600 border-green-600">Approved</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
