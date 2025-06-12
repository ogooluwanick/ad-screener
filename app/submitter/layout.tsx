"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation" // Import usePathname
import { useSession, signIn } from "next-auth/react"
import DashboardHeader from "@/components/dashboard-header"
import NotificationPanel, { type Notification } from "@/components/notification-panel"
import { toast } from "@/hooks/use-toast"
import { Shield } from "lucide-react"

// Mock notifications data (can be removed if notifications are fetched from backend)
const mockNotifications: Notification[] = [
  {
    id: "1",
    title: "Ad Approved",
    message: "Your ad 'Summer Sale Campaign' has been approved and is ready to go live.",
    date: "Just now",
    read: false,
    type: "success",
  },
  {
    id: "2",
    title: "Ad Rejected",
    message: "Your ad 'New Product Launch' was rejected. Reason: Image resolution too low.",
    date: "2 hours ago",
    read: false,
    type: "error",
  },
  {
    id: "3",
    title: "Payment Confirmed",
    message: "Your payment of $50.00 for ad submission has been processed successfully.",
    date: "Yesterday",
    read: true,
    type: "info",
  },
]

export default function SubmitterLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname() // Get current pathname
  const { data: session, status } = useSession()
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications)

  useEffect(() => {
    if (status === "loading") {
      return
    }

    if (status === "unauthenticated") {
      signIn(undefined, { callbackUrl: pathname }) // Use pathname
      return
    }

    if (session?.user?.role !== "submitter") {
      toast({
        title: "Access Denied",
        description: "You do not have permission to access this page.",
        variant: "destructive",
      })
      router.push("/")
    }
  }, [status, session, router, pathname])

  const unreadCount = notifications.filter((n: Notification) => !n.read).length

  const handleMarkAsRead = (id: string) => {
    setNotifications((prev: Notification[]) =>
      prev.map((notification: Notification) => (notification.id === id ? { ...notification, read: true } : notification)),
    )
  }

  const handleClearAll = () => {
    setNotifications([])
    setShowNotifications(false)
    toast({
      title: "Notifications cleared",
      description: "All notifications have been cleared",
    })
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
        <Shield className="h-16 w-16 text-blue-600 animate-pulse mb-4" />
        <p className="text-lg text-gray-700">Loading your dashboard...</p>
      </div>
    )
  }

  if (status === "authenticated" && session?.user?.role === "submitter") {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader
          role="submitter"
          // userName={session.user.name || undefined} // Removed for now
          // userImage={session.user.image || undefined} // Removed for now
          notificationCount={unreadCount}
          onNotificationsClick={() => setShowNotifications(true)}
        />

        <main className="container mx-auto px-4 py-6">{children}</main>

        {showNotifications && (
          <NotificationPanel
            notifications={notifications}
            onClose={() => setShowNotifications(false)}
            onMarkAsRead={handleMarkAsRead}
            onClearAll={handleClearAll}
          />
        )}
      </div>
    )
  }
  
  return null; // Fallback
}
