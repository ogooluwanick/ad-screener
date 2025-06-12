"use client"

import React from "react"
import { SessionProvider } from "next-auth/react"
import { ThemeProvider as NextThemesProvider, type ThemeProviderProps } from "next-themes"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query" // Import React Query components
import { Toaster } from "@/components/ui/toaster"

// Create a single QueryClient instance
// It's often good to instantiate it outside the component or memoize it
// For client components in Next.js App Router, useState is a good way to ensure it's only created once per client session.
function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Default query options can go here, e.g.,
        // staleTime: 60 * 1000, // 1 minute
      },
    },
  })
}

let browserQueryClient: QueryClient | undefined = undefined

function getQueryClient() {
  if (typeof window === "undefined") {
    // Server: alwaysmake a new query client
    return makeQueryClient()
  } else {
    // Browser: make a new query client if we don't already have one
    // This is very important so we don't re-make a new client if React
    // suspends during the initial render. This may not be needed if we
    // have a suspense boundary BELOW the creation of the query client
    if (!browserQueryClient) browserQueryClient = makeQueryClient()
    return browserQueryClient
  }
}


export function Providers({ children, ...props }: ThemeProviderProps) {
  // Initialize queryClient. The same client will be shared across components.
  const queryClient = getQueryClient()

  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <NextThemesProvider {...props}>
          {children}
          <Toaster />
        </NextThemesProvider>
      </SessionProvider>
    </QueryClientProvider>
  )
}
