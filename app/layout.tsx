import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Providers } from "./providers" // Import the new Providers component
import { Toaster } from "@/components/ui/sonner" // Assuming this is the correct path for sonner's Toaster
import { NotificationDisplay } from "@/components/notification-display" // Import NotificationDisplay

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "AdScreener - Ad Submission & Review Platform",
  description: "Submit and review advertisements with ease",
  icons: {
    icon: '/logo.svg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          {children}
          <Toaster 
            richColors 
            position="top-right" 
            toastOptions={{
              style: { marginTop: '4rem' },
            }}
          /> {/* Or your preferred position and options */}
          <NotificationDisplay />
        </Providers>
      </body>
    </html>
  )
}
