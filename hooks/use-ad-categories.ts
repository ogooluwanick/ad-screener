import { useQuery } from "@tanstack/react-query";
import axios from "axios";

interface AdCategoriesResponse {
  categories: string[];
  message?: string; // Optional message from API
}

const fetchAdCategories = async (): Promise<string[]> => {
  const { data } = await axios.get<AdCategoriesResponse>("/api/app-settings/categories");
  // If the API returns a 404 or error structure with an empty categories array, 
  // this will correctly return an empty array.
  // If the API call itself fails (network error, 500), useQuery will catch it.
  return data.categories || []; 
};

export const useAdCategories = () => {
  return useQuery<string[], Error>({
    queryKey: ["adCategories"],
    queryFn: fetchAdCategories,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    // You might want to add a placeholderData or initialData if you have a fallback list
    // placeholderData: ["Loading categories..."], // Or a default small list
  });
};
