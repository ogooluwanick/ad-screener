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
  company?: string;
  location?: string;
  bio?: string;
  website?: string;
  joinDate?: string; // Should be string if already formatted, or Date if needs formatting
  profileImageUrl?: string;
}

// Interface for data returned by the public profile endpoint /api/user/profile/[userId]
export interface PublicProfileViewData {
  // Assuming this might also need an ID if it's fetched for a specific user context
  _id?: string; 
  id?: string;
  firstName: string;
  lastName: string;
  role: string;
  location?: string;
  bio?: string;
  joinDate?: string;
  image?: string; 
  company?: string;
  website?: string;
  department?: string;
  reviewerLevel?: string;
  expertise?: string[]; // Added for reviewers
  accuracy?: number; // Added for reviewer's accuracy rate
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
  location?: string;
  bio?: string;
  website?: string;
  department?: string; // Added for reviewers
  expertise?: string[]; // Added for reviewers
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
