"use client";
import { X, Bell, CheckCircle, XCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotifications, NotificationMessage } from "@/hooks/use-notifications";
import { useUserProfile } from "@/hooks/use-user-profile";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DotsHorizontalIcon } from "@radix-ui/react-icons";

// The Notification interface is now imported from useNotifications as NotificationMessage

interface NotificationPanelProps {
  // onClose is the only prop needed now, as the panel manages its own notification state
  onClose: () => void;
  isOpen: boolean; // To control visibility from parent
}

export default function NotificationPanel({
  onClose,
  isOpen,
}: NotificationPanelProps) {
  const { data: userProfile } = useUserProfile();
  const userId = userProfile?.email;

  const {
    notifications,
    markAsRead,
    markAllAsRead,
    clearNotifications, // This clears ALL notifications
    clearReadNotifications, // This clears only read notifications
  } = useNotifications(userId);

  if (!isOpen) {
    return null;
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-white dark:bg-gray-900 shadow-lg z-50 flex flex-col border-l border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
        <div className="flex items-center">
          <Bell className="h-5 w-5 text-blue-600 mr-2" />
          <h2 className="font-semibold text-lg text-gray-800 dark:text-gray-100">
            Notifications {unreadCount > 0 && <span className="text-xs bg-red-500 text-white rounded-full px-1.5 py-0.5 ml-2">{unreadCount}</span>}
          </h2>
        </div>
        <div className="flex items-center space-x-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <DotsHorizontalIcon className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={markAllAsRead} disabled={notifications.length === 0 || unreadCount === 0}>
                Mark all as read
              </DropdownMenuItem>
              <DropdownMenuItem onClick={clearReadNotifications} disabled={notifications.filter(n => n.read).length === 0}>
                Clear read notifications
              </DropdownMenuItem>
              <DropdownMenuItem onClick={clearNotifications} disabled={notifications.length === 0} className="text-red-600">
                Clear all notifications
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400 p-4">
            <Bell className="h-12 w-12 mb-2 opacity-20" />
            <p>No notifications yet</p>
            <p className="text-xs mt-1">Updates will appear here.</p>
          </div>
        ) : (
          <div className="divide-y dark:divide-gray-700">
            {notifications.map((notification: NotificationMessage) => (
              <div
                key={notification.id}
                className={`p-4 cursor-pointer group ${
                  notification.read ? "opacity-70 hover:bg-gray-50 dark:hover:bg-gray-800" : "bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-800/50"
                }`}
                onClick={() => !notification.read && markAsRead(notification.id)}
              >
                <div className="flex items-start">
                  {notification.type === "success" && (
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                  )}
                  {notification.type === "error" && (
                    <XCircle className="h-5 w-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
                  )}
                  {(notification.type === "info" || notification.type === "default") && (
                    <Bell className="h-5 w-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h3 className={`font-medium ${notification.read ? "text-gray-700 dark:text-gray-300" : "text-gray-900 dark:text-gray-50"}`}>
                        {notification.title}
                      </h3>
                      <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {new Date(notification.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className={`text-sm mt-1 ${notification.read ? "text-gray-500 dark:text-gray-400" : "text-gray-700 dark:text-gray-300"}`}>
                      {notification.message}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
