"use client";

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Mail, Calendar, MapPin, Award, AlertTriangle, Loader2, Briefcase, Link as LinkIcon, User, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label"; // Import Label
import { usePublicUserProfile, type PublicProfileViewData } from "@/hooks/use-user-profile";
import { useSession } from 'next-auth/react';
import Link from 'next/link';

interface DisplayProfileData extends PublicProfileViewData {
  expertise?: string[]; // Added for reviewers
}

const initialDisplayProfileData: DisplayProfileData = {
  firstName: "",
  lastName: "",
  role: "",
  image: undefined,
  location: "",
  bio: "",
  joinDate: "",
  company: "",
  website: "",
  department: "",
  reviewerLevel: "",
  expertise: [], // Added for reviewers
  profileVisibility: "public", // Default to public
};

export default function UserProfilePage() {
  const params = useParams();
  const userId = typeof params.userId === 'string' ? params.userId : undefined;
  
  const { data: session } = useSession();
  const loggedInUserId = session?.user?.id; 

  const [profileData, setProfileData] = useState<DisplayProfileData>(initialDisplayProfileData);
  const { data: fetchedProfileData, isLoading, error, refetch } = usePublicUserProfile(userId);

  useEffect(() => {
    if (fetchedProfileData) {
      setProfileData({
        firstName: fetchedProfileData.firstName || "",
        lastName: fetchedProfileData.lastName || "",
        role: fetchedProfileData.role || "",
        image: fetchedProfileData.image || undefined,
        location: fetchedProfileData.location || "",
        bio: fetchedProfileData.bio || "",
        joinDate: fetchedProfileData.joinDate || "",
        company: fetchedProfileData.company || "",
        website: fetchedProfileData.website || "",
        department: fetchedProfileData.department || "",
        reviewerLevel: fetchedProfileData.reviewerLevel || "",
        expertise: (fetchedProfileData as any).expertise || [], // Cast to any if expertise is not in PublicProfileViewData by default
        profileVisibility: fetchedProfileData.profileVisibility || "public", // Set profile visibility
      });
    }
  }, [fetchedProfileData]);

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName || !lastName) return "U";
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getReviewerLevelColor = (level?: string) => {
    switch (level) {
      case "Senior": return "bg-purple-100 text-purple-800";
      case "Lead": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
        <p className="ml-4 text-lg">Loading profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-red-600">
        <AlertTriangle className="h-12 w-12 mb-4" />
        <p className="text-lg">Error loading profile: {error.message}</p>
        <Button onClick={() => refetch()} className="mt-4">Try Again</Button>
      </div>
    );
  }

  if (!fetchedProfileData) {
     return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <User className="h-12 w-12 mb-4 text-gray-400" />
        <p className="text-lg text-gray-500">Profile not found or not available.</p>
      </div>
    );
  }
  
  const userRole = profileData.role?.toLowerCase();
  const viewingUserRole = session?.user?.role?.toLowerCase(); // Role of the person viewing the profile
  const isOwnProfile = loggedInUserId === userId;

  // Handle profile visibility
  if (!isOwnProfile && profileData.profileVisibility === "private") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Shield className="h-12 w-12 mb-4 text-gray-400" />
        <p className="text-lg text-gray-500">This profile is private.</p>
      </div>
    );
  }

  if (!isOwnProfile && profileData.profileVisibility === "reviewers-only" && viewingUserRole !== "reviewer") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Shield className="h-12 w-12 mb-4 text-gray-400" />
        <p className="text-lg text-gray-500">This profile is only visible to reviewers.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight">{profileData.firstName} {profileData.lastName}'s Profile</h1>
        {isOwnProfile && (
          <Button asChild className="bg-blue-600 hover:bg-blue-700 mt-2 sm:mt-0">
            <Link href="/profile">Edit My Profile</Link>
          </Button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profileData.image} alt={`${profileData.firstName} ${profileData.lastName}`} />
                <AvatarFallback className="text-lg">
                  {getInitials(profileData.firstName, profileData.lastName)}
                </AvatarFallback>
              </Avatar>
            </div>
            <CardTitle>{profileData.firstName} {profileData.lastName}</CardTitle>
            <CardDescription>
              {userRole === 'reviewer' && profileData.reviewerLevel && (
                <Badge className={getReviewerLevelColor(profileData.reviewerLevel)}>{profileData.reviewerLevel} Reviewer</Badge>
              )}
              {userRole === 'submitter' && (
                <Badge variant="secondary">Submitter</Badge>
              )}
              {!userRole && <Badge variant="outline">User</Badge>}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {profileData.location && <div className="flex items-center text-sm text-gray-600"><MapPin className="h-4 w-4 mr-2" />{profileData.location}</div>}
            {profileData.joinDate && <div className="flex items-center text-sm text-gray-600"><Calendar className="h-4 w-4 mr-2" />Joined {new Date(profileData.joinDate).toLocaleDateString()}</div>}
            {userRole === 'submitter' && profileData.company && (
              <div className="flex items-center text-sm text-gray-600"><Briefcase className="h-4 w-4 mr-2" />{profileData.company}</div>
            )}
            {userRole === 'submitter' && profileData.website && (
              <div className="flex items-center text-sm text-gray-600"><LinkIcon className="h-4 w-4 mr-2" /><a href={profileData.website.startsWith('http') ? profileData.website : `https://${profileData.website}`} target="_blank" rel="noopener noreferrer" className="hover:underline break-all">{profileData.website}</a></div>
            )}
             {userRole === 'reviewer' && profileData.department && (
              <div className="flex items-center text-sm text-gray-600"><Briefcase className="h-4 w-4 mr-2" />Department: {profileData.department}</div>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>About {profileData.firstName}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {profileData.bio && (
              <div className="space-y-2">
                <Label>Bio</Label>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{profileData.bio}</p>
              </div>
            )}
            {!profileData.bio && <p className="text-sm text-gray-500">No bio provided.</p>}

            {userRole === 'reviewer' && profileData.expertise && profileData.expertise.length > 0 && (
              <div className="space-y-2">
                <Label>Areas of Expertise</Label>
                <div className="flex flex-wrap gap-2">
                  {profileData.expertise.map((skill: string, index: number) => (
                    <Badge key={index} variant="secondary">{skill}</Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
