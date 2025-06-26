// "use client";

// import { useParams } from 'next/navigation';
// import { useEffect, useState } from 'react';
// import { Mail, Calendar, MapPin, Award, AlertTriangle, Loader2, Briefcase, Link as LinkIcon, User, Shield, CheckCircle, XCircle, Clock } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// import { Badge } from "@/components/ui/badge";
// import { Label } from "@/components/ui/label";
// import { usePublicUserProfile, type PublicProfileViewData } from "@/hooks/use-user-profile";
// import { useReviewerProfileData, type RecentActivityItem } from "@/hooks/use-reviewer-profile-data";
// import { useSession } from 'next-auth/react';
// import Link from 'next/link';
// import { formatDistanceToNow } from 'date-fns';

// interface DisplayProfileData extends PublicProfileViewData {
//   expertise?: string[];
// }

// const initialDisplayProfileData: DisplayProfileData = {
//   firstName: "",
//   lastName: "",
//   role: "",
//   image: undefined,
//   bio: "",
//   joinDate: "",
//   company: "",
//   website: "",
//   department: "",
//   reviewerLevel: "",
//   expertise: [], 
//   accuracy: 0,
//   totalAds: 0,
//   approvedAds: 0,
//   pendingAds: 0, 
//   rejectedAds: 0, 
//   email: "", 
//   profileVisibility: "public",
//   submitterType: "",
//   registrationNumber: "",
//   sector: "",
//   officeAddress: "",
//   state: "",
//   country: "",
//   businessDescription: "",
// };

// const calculateReviewerLevel = (totalReviews?: number): string => {
//   if (totalReviews === undefined || totalReviews === null) return "Junior";
//   if (totalReviews >= 500) return "Lead";
//   if (totalReviews >= 200) return "Senior";
//   if (totalReviews >= 50) return "Mid-Level";
//   return "Junior";
// };

// export default function UserProfilePage() {
//   const params = useParams();
//   const userId = typeof params.userId === 'string' ? params.userId : undefined;
  
//   const { data: session } = useSession();
//   const loggedInUserId = session?.user?.id; 

//   const [profileData, setProfileData] = useState<DisplayProfileData>(initialDisplayProfileData);
//   const { data: fetchedProfileData, isLoading, error, refetch } = usePublicUserProfile(userId);

//   const isReviewerProfile = fetchedProfileData?.role?.toLowerCase() === 'reviewer';
//   const { 
//     data: reviewerProfileData, 
//     isLoading: isLoadingReviewerData, 
//     error: reviewerDataError 
//   } = useReviewerProfileData(userId, { enabled: !!userId && isReviewerProfile });

//   useEffect(() => {
//     if (fetchedProfileData) {
//       setProfileData(prev => ({
//         ...prev,
//         ...fetchedProfileData,
//         firstName: fetchedProfileData.firstName || "",
//         lastName: fetchedProfileData.lastName || "",
//         role: fetchedProfileData.role || "",
//         image: fetchedProfileData.image || undefined,
//         bio: fetchedProfileData.bio || "",
//         joinDate: fetchedProfileData.joinDate || "",
//         company: fetchedProfileData.company || "",
//         website: fetchedProfileData.website || "",
//         department: fetchedProfileData.department || "",
//         reviewerLevel: fetchedProfileData.reviewerLevel || prev.reviewerLevel || "Junior", 
//         expertise: fetchedProfileData.expertise || [],
//         accuracy: fetchedProfileData.accuracy || 0,
//         totalAds: fetchedProfileData.totalAds || 0,
//         approvedAds: fetchedProfileData.approvedAds || 0,
//         pendingAds: fetchedProfileData.pendingAds || 0,
//         rejectedAds: fetchedProfileData.rejectedAds || 0,
//         email: fetchedProfileData.email || "",
//         profileVisibility: fetchedProfileData.profileVisibility || "public",
//         submitterType: fetchedProfileData.submitterType || "",
//         registrationNumber: fetchedProfileData.registrationNumber || "",
//         sector: fetchedProfileData.sector || "",
//         officeAddress: fetchedProfileData.officeAddress || "",
//         state: fetchedProfileData.state || "",
//         country: fetchedProfileData.country || "",
//         businessDescription: fetchedProfileData.businessDescription || "",
//       }));
//     }
//   }, [fetchedProfileData]);

//   useEffect(() => {
//     if (reviewerProfileData && isReviewerProfile) {
//       const newLevel = calculateReviewerLevel(reviewerProfileData.performanceStats?.totalReviews);
//       setProfileData(prev => ({
//         ...prev,
//         reviewerLevel: newLevel,
//         accuracy: reviewerProfileData.performanceStats?.accuracy ?? prev.accuracy,
//       }));
//     }
//   }, [reviewerProfileData, isReviewerProfile]);

//   const getInitials = (firstName?: string, lastName?: string) => {
//     if (!firstName || !lastName) return "U";
//     return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
//   };

//   const getReviewerLevelColor = (level?: string) => {
//     switch (level) {
//       case "Lead": return "bg-indigo-100 text-indigo-800";
//       case "Senior": return "bg-purple-100 text-purple-800";
//       case "Mid-Level": return "bg-green-100 text-green-800";
//       case "Junior": return "bg-gray-100 text-gray-800";
//       default: return "bg-gray-100 text-gray-800";
//     }
//   };

//   const formatAvgReviewTime = (ms?: number) => {
//     if (ms === undefined || ms === null) return "N/A";
//     const minutes = Math.round(ms / (1000 * 60));
//     if (minutes < 1) return "<1m";
//     return `${minutes}m`;
//   };

//   const userRole = profileData.role?.toLowerCase();
//   const viewingUserRole = session?.user?.role?.toLowerCase(); 
//   const isOwnProfile = loggedInUserId === userId;
  
//   return (
//     <div className="space-y-6 p-4 md:p-6">
//       {isLoading && (
//         <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
//           <Loader2 className="h-12 w-12 animate-spin text-green-600" />
//           <p className="ml-4 text-lg">Loading profile...</p>
//         </div>
//       )}
//       {!isLoading && error && (
//         <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-red-600">
//           <AlertTriangle className="h-12 w-12 mb-4" />
//           <p className="text-lg">Error loading profile: {error.message}</p>
//           <Button onClick={() => refetch()} className="mt-4">Try Again</Button>
//         </div>
//       )}
//       {!isLoading && !error && !fetchedProfileData && (
//          <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
//            <User className="h-12 w-12 mb-4 text-gray-400" />
//            <p className="text-lg text-gray-500">Profile not found or not available.</p>
//          </div>
//       )}
//       {!isLoading && !error && fetchedProfileData && !isOwnProfile && profileData.profileVisibility === "private" && (
//         <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
//           <Shield className="h-12 w-12 mb-4 text-gray-400" />
//           <p className="text-lg text-gray-500">This profile is private.</p>
//         </div>
//       )}
//       {!isLoading && !error && fetchedProfileData && !isOwnProfile && profileData.profileVisibility === "reviewers-only" && viewingUserRole !== "reviewer" && (
//         <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
//           <Shield className="h-12 w-12 mb-4 text-gray-400" />
//           <p className="text-lg text-gray-500">This profile is only visible to reviewers.</p>
//         </div>
//       )}
//       {!isLoading && !error && fetchedProfileData && (isOwnProfile || (profileData.profileVisibility !== "private" && (profileData.profileVisibility !== "reviewers-only" || viewingUserRole === "reviewer"))) && (
//       <>
//       <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
//         <h1 className="text-2xl font-bold tracking-tight capitalize">{profileData.firstName} {profileData.lastName}'s Profile</h1>
//         {isOwnProfile && (
//           <Button asChild className="bg-green-600 hover:bg-green-700 mt-2 sm:mt-0">
//             <Link href="/profile">Edit My Profile</Link>
//           </Button>
//         )}
//       </div>

//       <div className="grid gap-6 md:grid-cols-3">
//         <Card className="md:col-span-1">
//           <CardHeader className="text-center">
//             <div className="flex justify-center mb-4">
//               <Avatar className="h-24 w-24">
//                 <AvatarImage src={profileData.image} alt={`${profileData.firstName} ${profileData.lastName}`} />
//                 <AvatarFallback className="text-lg">
//                   {getInitials(profileData.firstName, profileData.lastName)}
//                 </AvatarFallback>
//               </Avatar>
//             </div>
//             <CardTitle className="capitalize">{profileData.firstName} {profileData.lastName}</CardTitle>
//             <CardDescription>
//               {userRole === 'reviewer' && profileData.reviewerLevel && (
//                 <Badge className={getReviewerLevelColor(profileData.reviewerLevel)}>{profileData.reviewerLevel} Reviewer</Badge>
//               )}
//               {userRole === 'submitter' && (
//                 <Badge variant="secondary">Submitter {profileData.submitterType && `(${profileData.submitterType.charAt(0).toUpperCase() + profileData.submitterType.slice(1)})`}</Badge>
//               )}
//               {!userRole && <Badge variant="outline">User</Badge>}
//             </CardDescription>
//           </CardHeader>
//           <CardContent className="space-y-4">
//             {profileData.email && <div className="flex items-center text-sm text-gray-600"><Mail className="h-4 w-4 mr-2" />{profileData.email}</div>}
//             <div className="flex items-center text-sm text-gray-600"><Calendar className="h-4 w-4 mr-2" />Joined {profileData.joinDate ? new Date(profileData.joinDate).toLocaleDateString() : "N/A"}</div>
            
//             {userRole === 'reviewer' && (
//               <>
//                 {profileData.accuracy !== undefined && (<div className="flex items-center text-sm text-gray-600"><Award className="h-4 w-4 mr-2" />{profileData.accuracy}% Accuracy Rate</div>)}
//                 {profileData.department && (<div className="flex items-center text-sm text-gray-600"><Briefcase className="h-4 w-4 mr-2" />Department: {profileData.department}</div>)}
//                 {profileData.company && (<div className="flex items-center text-sm text-gray-600"><Briefcase className="h-4 w-4 mr-2" />Affiliated: {profileData.company}</div>)}
//               </>
//             )}

//             {userRole === 'submitter' && (
//               <>
//                 {profileData.company && (<div className="flex items-center text-sm text-gray-600"><Briefcase className="h-4 w-4 mr-2" />{profileData.company}</div>)}
//                 {profileData.registrationNumber && (<div className="flex items-center text-sm text-gray-600"><Award className="h-4 w-4 mr-2" />Reg No: {profileData.registrationNumber}</div>)}
//                 {profileData.website && (<div className="flex items-center text-sm text-gray-600"><LinkIcon className="h-4 w-4 mr-2" /><a href={profileData.website.startsWith('http') ? profileData.website : `https://${profileData.website}`} target="_blank" rel="noopener noreferrer" className="hover:underline break-all">{profileData.website}</a></div>)}
//                 {profileData.submitterType === 'business' && (
//                   <>
//                     {profileData.sector && (<div className="flex items-center text-sm text-gray-600"><MapPin className="h-4 w-4 mr-2" />Sector: {profileData.sector}</div>)}
//                     {profileData.officeAddress && (<div className="flex items-center text-sm text-gray-600"><MapPin className="h-4 w-4 mr-2" />Address: {profileData.officeAddress}</div>)}
//                     {profileData.state && (<div className="flex items-center text-sm text-gray-600"><MapPin className="h-4 w-4 mr-2" />State: {profileData.state}</div>)}
//                     {profileData.country && (<div className="flex items-center text-sm text-gray-600"><MapPin className="h-4 w-4 mr-2" />Country: {profileData.country}</div>)}
//                   </>
//                 )}
//               </>
//             )}
//           </CardContent>
//         </Card>

//         <Card className="md:col-span-2">
//           <CardHeader>
//             <CardTitle>About {profileData.firstName}</CardTitle>
//           </CardHeader>
//           <CardContent className="space-y-6">
//             {profileData.bio && (
//               <div className="space-y-2">
//                 <Label>Bio</Label>
//                 <p className="text-sm text-gray-700 whitespace-pre-wrap">{profileData.bio}</p>
//               </div>
//             )}
            
//             {userRole === 'submitter' && profileData.submitterType === 'business' && profileData.businessDescription && (
//               <div className="space-y-2">
//                 <Label>Business Description</Label>
//                 <p className="text-sm text-gray-700 whitespace-pre-wrap">{profileData.businessDescription}</p>
//               </div>
//             )}

//             {!profileData.bio && !(userRole === 'submitter' && profileData.submitterType === 'business' && profileData.businessDescription) && (
//               <p className="text-sm text-gray-500">No detailed information provided.</p>
//             )}

//             {userRole === 'reviewer' && profileData.expertise && profileData.expertise.length > 0 && (
//               <div className="space-y-2">
//                 <Label>Areas of Expertise</Label>
//                 <div className="flex flex-wrap gap-2">
//                   {profileData.expertise.map((skill: string, index: number) => (
//                     <Badge key={index} variant="secondary">{skill}</Badge>
//                   ))}
//                 </div>
//               </div>
//             )}
//           </CardContent>
//         </Card>

//         {userRole === 'reviewer' && (
//           <>
//             <Card className="md:col-span-3">
//               <CardHeader>
//                 <CardTitle>Review Performance</CardTitle>
//                 <CardDescription>Reviewing statistics and performance metrics.</CardDescription>
//               </CardHeader>
//               <CardContent>
//                 {isLoadingReviewerData && (
//                   <div className="flex items-center justify-center p-8">
//                     <Loader2 className="h-8 w-8 animate-spin text-green-600" />
//                     <p className="ml-3 text-gray-500">Loading performance data...</p>
//                   </div>
//                 )}
//                 {reviewerDataError && (
//                   <div className="text-center p-8 text-red-500">
//                     <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
//                     <p>Error loading performance data: {reviewerDataError.message}</p>
//                   </div>
//                 )}
//                 {reviewerProfileData && !isLoadingReviewerData && !reviewerDataError && (
//                   <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
//                     <div className="text-center p-4 bg-green-50 rounded-lg">
//                       <div className="text-2xl font-bold text-green-600">{reviewerProfileData.performanceStats.totalReviews || 0}</div>
//                       <div className="text-sm text-gray-600">Total Reviews</div>
//                     </div>
//                     <div className="text-center p-4 bg-green-50 rounded-lg">
//                       <div className="text-2xl font-bold text-green-600">{reviewerProfileData.performanceStats.approvedReviews || 0}</div>
//                       <div className="text-sm text-gray-600">Approved</div>
//                     </div>
//                     <div className="text-center p-4 bg-red-50 rounded-lg">
//                       <div className="text-2xl font-bold text-red-600">{reviewerProfileData.performanceStats.rejectedReviews || 0}</div>
//                       <div className="text-sm text-gray-600">Rejected</div>
//                     </div>
//                     <div className="text-center p-4 bg-purple-50 rounded-lg">
//                       <div className="text-2xl font-bold text-purple-600">{formatAvgReviewTime(reviewerProfileData.performanceStats.avgReviewTimeMs)}</div>
//                       <div className="text-sm text-gray-600">Avg Review Time</div>
//                     </div>
//                     <div className="text-center p-4 bg-amber-50 rounded-lg">
//                       <div className="text-2xl font-bold text-amber-600">{reviewerProfileData.performanceStats.accuracy || profileData.accuracy || 0}%</div>
//                       <div className="text-sm text-gray-600">Accuracy Rate</div>
//                     </div>
//                   </div>
//                 )}
//               </CardContent>
//             </Card>
//             <Card className="md:col-span-3">
//               <CardHeader>
//                 <CardTitle>Recent Activity</CardTitle>
//                 <CardDescription>Latest review activities.</CardDescription>
//               </CardHeader>
//               <CardContent>
//                 {isLoadingReviewerData && (
//                   <div className="flex items-center justify-center p-8">
//                     <Loader2 className="h-8 w-8 animate-spin text-green-600" />
//                     <p className="ml-3 text-gray-500">Loading recent activities...</p>
//                   </div>
//                 )}
//                 {reviewerDataError && (
//                   <div className="text-center p-8 text-red-500">
//                     <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
//                     <p>Error loading recent activities: {reviewerDataError.message}</p>
//                   </div>
//                 )}
//                 {reviewerProfileData && !isLoadingReviewerData && !reviewerDataError && (
//                   reviewerProfileData.recentActivities.length > 0 ? (
//                     <div className="space-y-4">
//                       {reviewerProfileData.recentActivities.map((activity: RecentActivityItem) => (
//                         <div key={activity.id} className={`flex items-center justify-between p-3 rounded-lg ${activity.status === 'approved' ? 'bg-green-50' : 'bg-red-50'}`}>
//                           <div className="flex items-center">
//                             {activity.status === 'approved' ? <CheckCircle className="h-5 w-5 text-green-600 mr-3" /> : <XCircle className="h-5 w-5 text-red-600 mr-3" />}
//                             <div>
//                               <p className="font-medium">
//                                 {activity.status === 'approved' ? 'Approved' : 'Rejected'} "{activity.title}" Ad
//                               </p>
//                               <p className="text-sm text-gray-500">
//                                 {formatDistanceToNow(new Date(activity.reviewedAt), { addSuffix: true })}
//                               </p>
//                             </div>
//                           </div>
//                           <Badge variant="outline" className={activity.status === 'approved' ? 'text-green-600 border-green-600' : 'text-red-600 border-red-600'}>
//                             {activity.status === 'approved' ? 'Approved' : 'Rejected'}
//                           </Badge>
//                         </div>
//                       ))}
//                     </div>
//                   ) : (
//                     <div className="text-center p-8 text-gray-500">
//                       <Clock className="h-8 w-8 mx-auto mb-2 text-gray-400" />
//                       <p>No recent review activities found.</p>
//                     </div>
//                   )
//                 )}
//               </CardContent>
//             </Card>
//           </>
//         )}

//         {userRole === 'submitter' && (
//           <Card className="md:col-span-3">
//             <CardHeader>
//               <CardTitle>Account Statistics</CardTitle>
//               <CardDescription>Overview of Ad submissions.</CardDescription>
//             </CardHeader>
//             <CardContent>
//               {(profileData.totalAds === undefined) && !error && !isLoading && ( 
//                  <div className="text-center p-8 text-gray-500">
//                     <p>Statistics are not available for this user.</p>
//                  </div>
//               )}
//               {profileData.totalAds !== undefined && (
//                 <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
//                   <div className="text-center p-4 bg-green-50 rounded-lg">
//                     <div className="text-2xl font-bold text-green-600">{profileData.totalAds || 0}</div>
//                     <div className="text-sm text-gray-600">Total Ads</div>
//                   </div>
//                   <div className="text-center p-4 bg-green-50 rounded-lg">
//                     <div className="text-2xl font-bold text-green-600">{profileData.approvedAds || 0}</div>
//                     <div className="text-sm text-gray-600">Approved Ads</div>
//                   </div>
//                   <div className="text-center p-4 bg-amber-50 rounded-lg">
//                     <div className="text-2xl font-bold text-amber-600">{profileData.pendingAds || 0}</div>
//                     <div className="text-sm text-gray-600">Pending Ads</div>
//                   </div>
//                   <div className="text-center p-4 bg-red-50 rounded-lg">
//                     <div className="text-2xl font-bold text-red-600">{profileData.rejectedAds || 0}</div>
//                     <div className="text-sm text-gray-600">Rejected Ads</div>
//                   </div>
//                 </div>
//               )}
//             </CardContent>
//           </Card>
//         )}
//       </div>
//       </>
//       )}
//     </div>
//   );
// }
