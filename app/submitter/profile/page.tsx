"use client"

import { useState, useEffect } from "react"
import { Camera, Mail, Calendar, MapPin, AlertTriangle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "@/hooks/use-toast"
import { useUserProfile, useUpdateUserProfile, type UserProfileData, type UpdateUserProfilePayload } from "@/hooks/use-user-profile"

interface ExtendedProfileData extends UserProfileData {
  phone: string;
  company: string;
  location: string;
  bio: string;
  website: string;
  joinDate: string;
  totalAds?: number;
  approvedAds?: number;
  rejectedAds?: number;
  pendingAds?: number;
}

const initialProfileData: ExtendedProfileData = {
  firstName: "",
  lastName: "",
  email: "",
  role: "",
  phone: "",
  company: "",
  location: "",
  bio: "",
  website: "",
  joinDate: "",
  totalAds: 0,
  approvedAds: 0,
  rejectedAds: 0,
  pendingAds: 0,
};

export default function SubmitterProfile() {
  const [isEditing, setIsEditing] = useState(false)
  const [profileData, setProfileData] = useState<ExtendedProfileData>(initialProfileData);

  const { data: fetchedProfileData, isLoading: isLoadingProfile, error: profileError, refetch: refetchProfile } = useUserProfile();
  const { mutate: updateProfile, isPending: isUpdatingProfile, error: updateProfileError } = useUpdateUserProfile();

  useEffect(() => {
    if (fetchedProfileData) {
      setProfileData(prev => ({
        ...prev,
        firstName: fetchedProfileData.firstName || "",
        lastName: fetchedProfileData.lastName || "",
        email: fetchedProfileData.email || "",
        role: fetchedProfileData.role || "",
        phone: fetchedProfileData.phone || "",
        company: fetchedProfileData.company || "",
        location: fetchedProfileData.location || "",
        bio: fetchedProfileData.bio || "",
        website: fetchedProfileData.website || "",
        joinDate: fetchedProfileData.joinDate || "",
      }));
    }
  }, [fetchedProfileData]);

  const handleInputChange = (field: keyof ExtendedProfileData, value: string | number) => {
    setProfileData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    const payload: UpdateUserProfilePayload = {
      firstName: profileData.firstName,
      lastName: profileData.lastName,
      phone: profileData.phone,
      company: profileData.company,
      location: profileData.location,
      bio: profileData.bio,
      website: profileData.website,
    };

    updateProfile(payload, {
      onSuccess: (data) => {
        toast({
          title: "Profile Updated",
          description: data.message || "Your profile has been successfully updated.",
        });
        setIsEditing(false);
        // Data will be refetched due to query invalidation in the hook
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
    // Reset form to fetched data if available
    if (fetchedProfileData) {
      setProfileData(prev => ({
        ...prev,
        firstName: fetchedProfileData.firstName || "",
        lastName: fetchedProfileData.lastName || "",
        email: fetchedProfileData.email || "", // email is not editable in this flow
        role: fetchedProfileData.role || "",
        phone: fetchedProfileData.phone || "",
        company: fetchedProfileData.company || "",
        location: fetchedProfileData.location || "",
        bio: fetchedProfileData.bio || "",
        website: fetchedProfileData.website || "",
        joinDate: fetchedProfileData.joinDate || "",
      }));
    }
  };


  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName || !lastName) return "";
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
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
                  <AvatarImage src="/placeholder.svg?height=96&width=96" alt="Profile" />
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
            <CardDescription>{profileData.role || "User"}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center text-sm text-gray-600">
              <Mail className="h-4 w-4 mr-2" />
              {profileData.email}
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <MapPin className="h-4 w-4 mr-2" />
              {profileData.location}
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <Calendar className="h-4 w-4 mr-2" />
              Joined {profileData.joinDate ? new Date(profileData.joinDate).toLocaleDateString() : "N/A"}
            </div>
          </CardContent>
        </Card>

        {/* Profile Details */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>Manage your personal information and preferences</CardDescription>
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
                readOnly // Email should not be editable directly here
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
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  value={profileData.company}
                  onChange={(e) => handleInputChange("company", e.target.value)}
                  disabled={!isEditing || isUpdatingProfile}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
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
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={profileData.website}
                  onChange={(e) => handleInputChange("website", e.target.value)}
                  disabled={!isEditing || isUpdatingProfile}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                rows={4}
                value={profileData.bio}
                onChange={(e) => handleInputChange("bio", e.target.value)}
                disabled={!isEditing || isUpdatingProfile}
                placeholder="Tell us about yourself..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Statistics Card */}
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Account Statistics</CardTitle>
            <CardDescription>Overview of your activity on AdScreener</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{profileData.totalAds}</div>
                <div className="text-sm text-gray-600">Total Ads</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{profileData.approvedAds}</div>
                <div className="text-sm text-gray-600">Approved</div>
              </div>
              <div className="text-center p-4 bg-amber-50 rounded-lg">
                <div className="text-2xl font-bold text-amber-600">{profileData.pendingAds}</div>
                <div className="text-sm text-gray-600">Pending</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{profileData.rejectedAds}</div>
                <div className="text-sm text-gray-600">Rejected</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
