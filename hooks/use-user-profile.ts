import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

// Define the expected shape of the profile data
export interface UserProfileData {
  _id: string; // Assuming MongoDB ObjectId string is the primary ID from the DB
  id?: string;  // NextAuth session often uses 'id', this could be the same as _id or different depending on session setup
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  phone?: string;
  company?: string; // For Submitter's company or Reviewer's affiliated company
  // location?: string; // Removed
  bio?: string;
  website?: string; // Submitter's website
  joinDate?: string; 
  profileImageUrl?: string;
  // Submitter specific fields
  submitterType?: "business" | "agency" | ""; // "business" or "agency"
  registrationNumber?: string; // CAC or Agency Reg No.
  sector?: string; // Business sector
  officeAddress?: string; // Business address
  state?: string; // Business state
  country?: string; // Business country
  businessDescription?: string; // Business description
  // Reviewer specific fields
  department?: string; // Reviewer's internal department
  expertise?: string[]; // Reviewer's areas of expertise
  // Agency Submitter specific
  letterOfAuthorityUrl?: string | null;
  letterOfAuthorityPublicId?: string | null;
}

// Interface for data returned by the public profile endpoint /api/user/profile/[userId]
export interface PublicProfileViewData {
  // Assuming this might also need an ID if it's fetched for a specific user context
  _id?: string;
  id?: string;
  firstName: string;
  lastName: string;
  role: string;
  // location?: string; // Removed
  bio?: string;
  joinDate?: string;
  image?: string;
  company?: string; // For Submitter's company or Reviewer's affiliated company
  website?: string; // Submitter's website
  
  // Submitter specific fields
  submitterType?: "business" | "agency" | "";
  registrationNumber?: string;
  sector?: string;
  officeAddress?: string;
  state?: string;
  country?: string;
  businessDescription?: string;

  // Reviewer specific fields
  department?: string;
  reviewerLevel?: string;
  expertise?: string[];
  accuracy?: number;
  profileVisibility?: "public" | "private" | "reviewers-only";

  // Submitter-specific stats
  totalAds?: number;
  approvedAds?: number;
  pendingAds?: number;
  rejectedAds?: number;

  // Common fields
  email?: string; // Added email
}


const fetchUserProfile = async (): Promise<UserProfileData> => {
  const { data } = await axios.get<UserProfileData>("/api/user/profile");
  return data;
};

export const useUserProfile = () => {
  return useQuery<UserProfileData, Error>({
    queryKey: ["userProfile"],
    queryFn: fetchUserProfile,
    // staleTime: 5 * 60 * 1000, 
    // cacheTime: 10 * 60 * 1000, 
  });
};

const fetchPublicUserProfileById = async (userId: string): Promise<PublicProfileViewData> => {
  if (!userId) throw new Error("User ID is required to fetch public profile.");
  const { data } = await axios.get<PublicProfileViewData>(`/api/user/profile/${userId}`);
  return data;
};

export const usePublicUserProfile = (userId: string | null | undefined) => {
  return useQuery<PublicProfileViewData, Error>({
    queryKey: ["publicUserProfile", userId],
    queryFn: () => {
      if (!userId) {
        return Promise.reject(new Error("User ID not provided for public profile fetch."));
      }
      return fetchPublicUserProfileById(userId);
    },
    enabled: !!userId, 
    // staleTime: 10 * 60 * 1000, 
  });
};

export interface UpdateUserProfilePayload {
  profileImageUrl?: string;
  firstName?: string; // Make fields optional for partial updates
  lastName?: string;
  phone?: string;
  company?: string;
  // location?: string; // Removed
  bio?: string;
  website?: string; // Submitter's website

  // Submitter specific fields (mirroring UserProfileData for consistency if needed)
  submitterType?: "business" | "agency" | "";
  registrationNumber?: string;
  sector?: string;
  officeAddress?: string;
  state?: string;
  country?: string;
  businessDescription?: string;

  // Reviewer specific fields
  department?: string;
  expertise?: string[];
  // Letter of Authority fields for update
  newLetterOfAuthorityUrl?: string | null;
  newLetterOfAuthorityPublicId?: string | null;
  currentLetterOfAuthorityPublicId?: string | null; // To delete old one if new is uploaded or type changes
}

interface UpdateUserProfileResponse {
  message: string;
  user: UserProfileData; 
}

const updateUserProfile = async (payload: UpdateUserProfilePayload): Promise<UpdateUserProfileResponse> => {
  const { data } = await axios.put<UpdateUserProfileResponse>("/api/user/profile", payload);
  return data;
};

export const useUpdateUserProfile = () => {
  const queryClient = useQueryClient();

  return useMutation<UpdateUserProfileResponse, Error, UpdateUserProfilePayload>({
    mutationFn: updateUserProfile,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
      // queryClient.setQueryData(["userProfile"], data.user); // Optionally update cache directly
    },
    onError: (error) => {
      console.error("Error updating profile:", error);
    },
  });
};
