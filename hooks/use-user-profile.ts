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

// Define the expected shape of the data for updating the profile
export interface UpdateUserProfilePayload {
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
