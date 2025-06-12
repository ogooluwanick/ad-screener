"use client"
import { X, Bell, CheckCircle, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

export interface Notification {
  id: string
  title: string
  message: string
  date: string
  read: boolean
  type: "success" | "error" | "info"
}

interface NotificationPanelProps {
  notifications: Notification[]
  onClose: () => void
  onMarkAsRead: (id: string) => void
  onClearAll: () => void
}

export default function NotificationPanel({
  notifications,
  onClose,
  onMarkAsRead,
  onClearAll,
}: NotificationPanelProps) {
  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-white shadow-lg z-50 flex flex-col border-l border-gray-200">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center">
          <Bell className="h-5 w-5 text-blue-600 mr-2" />
          <h2 className="font-semibold text-lg">Notifications</h2>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" onClick={onClearAll}>
            Clear all
          </Button>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 p-4">
            <Bell className="h-12 w-12 mb-2 opacity-20" />
            <p>No notifications yet</p>
          </div>
        ) : (
          <div className="divide-y">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 hover:bg-gray-50 ${notification.read ? "" : "bg-blue-50"}`}
                onClick={() => onMarkAsRead(notification.id)}
              >
                <div className="flex items-start">
                  {notification.type === "success" && (
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                  )}
                  {notification.type === "error" && (
                    <XCircle className="h-5 w-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
                  )}
                  {notification.type === "info" && <Bell className="h-5 w-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />}
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h3 className="font-medium text-gray-900">{notification.title}</h3>
                      <span className="text-xs text-gray-500">{notification.date}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
