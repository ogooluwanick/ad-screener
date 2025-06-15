"use client"

import { useQuery } from "@tanstack/react-query"
import { toast } from "@/hooks/use-toast"

// Interface matching the actual API response structure
interface ApiSubmitterStats {
  totalAds: number;
  pendingReview: number;
  approved: number;
  rejected: number;
}

// Interface for the hook to return, mapping to frontend expectations
export interface SubmitterDashboardStats {
  totalAds: number;
  approvedAds: number;
  pendingAds: number;
  rejectedAds: number;
}


async function fetchSubmitterDashboardStats(): Promise<SubmitterDashboardStats> {
  const response = await fetch('/api/submitter/dashboard-data');
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: "Failed to fetch submitter dashboard data" }));
    throw new Error(errorData.message || "An unknown error occurred");
  }
  const data: { stats: ApiSubmitterStats } = await response.json();
  // Map API response to the structure expected by the frontend hook
  return {
    totalAds: data.stats.totalAds,
    approvedAds: data.stats.approved,
    pendingAds: data.stats.pendingReview,
    rejectedAds: data.stats.rejected,
  };
}

export function useSubmitterDashboardStats(options?: { enabled?: boolean }) {
  return useQuery<SubmitterDashboardStats, Error>({
    queryKey: ['submitterDashboardStats'],
    queryFn: fetchSubmitterDashboardStats,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
    enabled: options?.enabled, // Conditionally enable the query
    // onError callback is handled by checking isError and error properties in the component
  });
}
