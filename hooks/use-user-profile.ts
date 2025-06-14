import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

// Define the expected shape of the profile data
export interface UserProfileData {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  phone?: string;
  company?: string;
  location?: string;
  bio?: string;
  website?: string;
  joinDate?: string;
  // Add any other fields you expect from the API
  // For the logged-in user, this might include more sensitive or detailed info
  // than a public profile view.
  // The `image` field for profile picture URL might be part of this or handled separately.
  profileImageUrl?: string; // Example if image URL is fetched with main profile
}

// Interface for data returned by the public profile endpoint /api/user/profile/[userId]
// This should match the structure returned by that API route.
export interface PublicProfileViewData {
  firstName: string;
  lastName: string;
  role: string;
  location?: string;
  bio?: string;
  joinDate?: string;
  image?: string; // Profile image URL (mapped from profileImageUrl or similar)
  company?: string;
  website?: string;
  department?: string;
  reviewerLevel?: string;
  // Excludes sensitive data like email, phone, detailed stats
  profileVisibility?: "public" | "private" | "reviewers-only"; // Added for visibility status
}


const fetchUserProfile = async (): Promise<UserProfileData> => {
  const { data } = await axios.get<UserProfileData>("/api/user/profile");
  return data;
};

export const useUserProfile = () => {
  return useQuery<UserProfileData, Error>({
    queryKey: ["userProfile"],
    queryFn: fetchUserProfile,
    // Optional: configure staleTime, cacheTime, refetchOnWindowFocus, etc.
    // staleTime: 5 * 60 * 1000, // 5 minutes
    // cacheTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Fetch public user profile by ID
const fetchPublicUserProfileById = async (userId: string): Promise<PublicProfileViewData> => {
  if (!userId) throw new Error("User ID is required to fetch public profile.");
  const { data } = await axios.get<PublicProfileViewData>(`/api/user/profile/${userId}`);
  return data;
};

// Hook to use for fetching a specific user's public profile
export const usePublicUserProfile = (userId: string | null | undefined) => {
  return useQuery<PublicProfileViewData, Error>({
    queryKey: ["publicUserProfile", userId],
    queryFn: () => {
      if (!userId) {
        // React Query expects a Promise, so if userId is null/undefined,
        // we can return a rejected promise or handle it as an enabled: false case.
        // For simplicity here, let's assume the component disables the query if no userId.
        // Or, throw to indicate bad usage if userId is strictly required for the hook to be called.
        return Promise.reject(new Error("User ID not provided for public profile fetch."));
      }
      return fetchPublicUserProfileById(userId);
    },
    enabled: !!userId, // Only run the query if userId is available
    // Optional: configure staleTime, cacheTime, etc.
    // staleTime: 10 * 60 * 1000, // 10 minutes for public profiles
  });
};


// Define the expected shape of the data for updating the profile
export interface UpdateUserProfilePayload {
  profileImageUrl?: string; // Added to allow updating profile image URL
  firstName: string;
  lastName: string;
  phone?: string;
  company?: string;
  location?: string;
  bio?: string;
  website?: string;
}

// Define the expected response from the PUT request
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
      // Optionally, you can directly set the query data if the mutation returns the updated profile
      // queryClient.setQueryData(["userProfile"], data.user);
    },
    onError: (error) => {
      console.error("Error updating profile:", error);
      // Consider showing a toast notification for errors in the component using the mutation's error state
    },
  });
};
