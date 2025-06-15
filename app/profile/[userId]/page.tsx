"use client";

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Mail, Calendar, MapPin, Award, AlertTriangle, Loader2, Briefcase, Link as LinkIcon, User, Shield, CheckCircle, XCircle } from "lucide-react"; // Added CheckCircle, XCircle
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
  expertise: [], 
  accuracy: 0, // Added for reviewers
  totalAds: 0, // Added for submitters
  approvedAds: 0, // Added for submitters
  pendingAds: 0, // Added for submitters
  rejectedAds: 0, // Added for submitters
  email: "", // Added email
  profileVisibility: "public", 
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
        expertise: fetchedProfileData.expertise || [],
        accuracy: fetchedProfileData.accuracy || 0,
        totalAds: fetchedProfileData.totalAds || 0,
        approvedAds: fetchedProfileData.approvedAds || 0,
        pendingAds: fetchedProfileData.pendingAds || 0,
        rejectedAds: fetchedProfileData.rejectedAds || 0,
        email: fetchedProfileData.email || "",
        profileVisibility: fetchedProfileData.profileVisibility || "public",
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
            {profileData.email && <div className="flex items-center text-sm text-gray-600"><Mail className="h-4 w-4 mr-2" />{profileData.email}</div>}
            {profileData.location && <div className="flex items-center text-sm text-gray-600"><MapPin className="h-4 w-4 mr-2" />{profileData.location}</div>}
            <div className="flex items-center text-sm text-gray-600"><Calendar className="h-4 w-4 mr-2" />Joined {profileData.joinDate ? new Date(profileData.joinDate).toLocaleDateString() : "N/A"}</div>
            {userRole === 'reviewer' && profileData.accuracy !== undefined && (<div className="flex items-center text-sm text-gray-600"><Award className="h-4 w-4 mr-2" />{profileData.accuracy}% Accuracy Rate</div>)}
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
             {userRole === 'reviewer' && (!profileData.expertise || profileData.expertise.length === 0) && !profileData.bio && (
                <p className="text-sm text-gray-500">No additional information provided.</p>
            )}
          </CardContent>
        </Card>

        {/* Reviewer Specific Sections - Mock Data */}
        {userRole === 'reviewer' && (
          <>
            <Card className="md:col-span-3">
              <CardHeader>
                <CardTitle>Review Performance</CardTitle>
                <CardDescription>Reviewing statistics and performance metrics (mock data for public view).</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">120</div> {/* Mock */}
                    <div className="text-sm text-gray-600">Total Reviews</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">100</div> {/* Mock */}
                    <div className="text-sm text-gray-600">Approved</div>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">20</div> {/* Mock */}
                    <div className="text-sm text-gray-600">Rejected</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">15m</div> {/* Mock */}
                    <div className="text-sm text-gray-600">Avg Review Time</div>
                  </div>
                  <div className="text-center p-4 bg-amber-50 rounded-lg">
                    <div className="text-2xl font-bold text-amber-600">{profileData.accuracy || 0}%</div>
                    <div className="text-sm text-gray-600">Accuracy Rate</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="md:col-span-3">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest review activities (mock data for public view).</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                      <div><p className="font-medium">Approved "Example Ad A" ad</p><p className="text-sm text-gray-500">3 hours ago</p></div>
                    </div>
                    <Badge variant="outline" className="text-green-600 border-green-600">Approved</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div className="flex items-center">
                      <XCircle className="h-5 w-5 text-red-600 mr-3" />
                      <div><p className="font-medium">Rejected "Example Ad B" ad</p><p className="text-sm text-gray-500">2 days ago</p></div>
                    </div>
                    <Badge variant="outline" className="text-red-600 border-red-600">Rejected</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Submitter Specific Section - Using Fetched Stats */}
        {userRole === 'submitter' && (
          <Card className="md:col-span-3">
            <CardHeader>
              <CardTitle>Account Statistics</CardTitle>
              <CardDescription>Overview of ad submissions.</CardDescription>
            </CardHeader>
            <CardContent>
              {(profileData.totalAds === undefined) && !error && !isLoading && ( // Check if stats are undefined (not just 0)
                 <div className="text-center p-8 text-gray-500">
                    <p>Statistics are not available for this user.</p>
                 </div>
              )}
              {profileData.totalAds !== undefined && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{profileData.totalAds || 0}</div>
                    <div className="text-sm text-gray-600">Total Ads</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{profileData.approvedAds || 0}</div>
                    <div className="text-sm text-gray-600">Approved Ads</div>
                  </div>
                  <div className="text-center p-4 bg-amber-50 rounded-lg">
                    <div className="text-2xl font-bold text-amber-600">{profileData.pendingAds || 0}</div>
                    <div className="text-sm text-gray-600">Pending Ads</div>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">{profileData.rejectedAds || 0}</div>
                    <div className="text-sm text-gray-600">Rejected Ads</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
