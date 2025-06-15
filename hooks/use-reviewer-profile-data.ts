import { useQuery } from "@tanstack/react-query";
import axios from "axios";

// Mirror the interfaces from the API route
export interface ReviewerPerformanceStats {
  totalReviews: number;
  approvedReviews: number;
  rejectedReviews: number;
  avgReviewTimeMs?: number;
  accuracy?: number; // Added accuracy
}

export interface RecentActivityItem {
  id: string;
  title: string;
  status: 'approved' | 'rejected';
  reviewedAt: string; 
}

export interface ReviewerProfileData {
  performanceStats: ReviewerPerformanceStats;
  recentActivities: RecentActivityItem[];
}

const fetchReviewerProfileData = async (userId: string): Promise<ReviewerProfileData> => {
  if (!userId) {
    // This case should ideally be handled by the `enabled` option in useQuery,
    // but as a safeguard:
    throw new Error("User ID is required to fetch reviewer profile data.");
  }
  const { data } = await axios.get<ReviewerProfileData>(`/api/reviewer/profile-data?userId=${userId}`);
  return data;
};

export const useReviewerProfileData = (userId?: string, options?: { enabled?: boolean }) => {
  return useQuery<ReviewerProfileData, Error>({
    // Query key now includes userId to differentiate between profiles
    queryKey: ["reviewerProfileData", userId], 
    // Pass userId to the fetch function
    queryFn: () => fetchReviewerProfileData(userId!), // userId will be defined if enabled is true
    // Enable the query only if userId is provided and options.enabled is not explicitly false.
    // The hook on the page already handles enabling based on role, this adds the userId check.
    enabled: !!userId && (options?.enabled !== undefined ? options.enabled : true),
    // staleTime: 5 * 60 * 1000, // Optional: 5 minutes
    // cacheTime: 10 * 60 * 1000, // Optional: 10 minutes
  });
};
