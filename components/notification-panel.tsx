"use client";
import { useEffect, useRef } from "react"; // Import useEffect and useRef
import { X, Bell, CheckCircle, XCircle, Info, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
// UINotification might still be needed if it's used for typing within this component
import { UINotification } from "@/hooks/use-notifications"; 
import { useNotificationContext } from "@/contexts/NotificationContext"; // Import the context hook
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DotsHorizontalIcon } from "@radix-ui/react-icons";

interface NotificationPanelProps {
  onClose: () => void;
  isOpen: boolean; 
}

export default function NotificationPanel({
  onClose,
  isOpen,
}: NotificationPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null); // Ref for the panel's main div

  // Get notification data and functions from context
  const {
    notifications,
    isLoading,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    clearReadNotifications,
    unreadNotificationCount, // Use the count from context
    refetchNotifications, // Get the refetch function
  } = useNotificationContext();

  // Refetch notifications when the panel is opened
  useEffect(() => {
    if (isOpen) {
      console.log("[NotificationPanel] Panel opened, refetching notifications.");
      refetchNotifications();
    }
  }, [isOpen, refetchNotifications]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Only act if the panel is open and the click is outside
      if (isOpen && panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    // Add event listener if panel is open
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    // Cleanup function to remove listener
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose, panelRef]); // Add panelRef to dependencies, though it's stable

  if (!isOpen) {
    return null;
  }

  // unreadCount is now unreadNotificationCount from context
  return (
    <div ref={panelRef} className="fixed inset-y-0 right-0 w-full sm:w-96 bg-white dark:bg-gray-900 shadow-lg z-50 flex flex-col border-l border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
        <div className="flex items-center">
          <Bell className="h-5 w-5 text-green-600 mr-2" />
          <h2 className="font-semibold text-lg text-gray-800 dark:text-gray-100">
            Notifications {unreadNotificationCount > 0 && <span className="text-xs bg-red-500 text-white rounded-full px-1.5 py-0.5 ml-2">{unreadNotificationCount}</span>}
          </h2>
        </div>
        <div className="flex items-center space-x-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <DotsHorizontalIcon className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="end"
              onMouseDown={(e) => {
                // Prevent this event from bubbling up to the document listener
                // which closes the notification panel when the dropdown content is clicked.
                e.stopPropagation();
              }}
            >
              <DropdownMenuItem onClick={markAllAsRead} disabled={notifications.length === 0 || unreadNotificationCount === 0}>
                Mark all as read
              </DropdownMenuItem>
              <DropdownMenuItem onClick={clearReadNotifications} disabled={notifications.filter(n => n.isRead).length === 0}>
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
        {isLoading && notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400 p-4">
            <Bell className="h-12 w-12 mb-2 opacity-20 animate-pulse" />
            <p>Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400 p-4">
            <Bell className="h-12 w-12 mb-2 opacity-20" />
            <p>No notifications yet</p>
            <p className="text-xs mt-1">Updates will appear here.</p>
          </div>
        ) : (
          <div className="divide-y dark:divide-gray-700">
            {notifications.map((notification: UINotification) => {
              const NotificationIcon = 
                notification.level === 'success' ? CheckCircle :
                notification.level === 'error' ? XCircle :
                notification.level === 'warning' ? AlertTriangle :
                Info;
              
              const iconColor =
                notification.level === 'success' ? 'text-green-500' :
                notification.level === 'error' ? 'text-red-500' :
                notification.level === 'warning' ? 'text-yellow-500' :
                'text-green-500';

              // Notifications from the server will always have an _id
              const notificationKey = notification._id; 
              const notificationIdForMarkRead = notification._id;

              const content = (
                <div
                  className={`p-4 group ${
                    notification.isRead ? "opacity-70 hover:bg-gray-50 dark:hover:bg-gray-800" : "bg-green-50 dark:bg-green-900/30 hover:bg-green-100 dark:hover:bg-green-800/50"
                  }`}
                  onClick={() => {
                    if (!notification.isRead && notificationIdForMarkRead) {
                      markAsRead(notificationIdForMarkRead);
                    }
                  }}
                >
                  <div className="flex items-start">
                    <NotificationIcon className={`h-5 w-5 ${iconColor} mt-0.5 mr-3 flex-shrink-0`} />
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h3 className={`font-medium ${notification.isRead ? "text-gray-700 dark:text-gray-300" : "text-gray-900 dark:text-gray-50"}`}>
                          {notification.title}
                        </h3>
                        <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                          {new Date(notification.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className={`text-sm mt-1 ${notification.isRead ? "text-gray-500 dark:text-gray-400" : "text-gray-700 dark:text-gray-300"}`}>
                        {notification.message}
                      </p>
                       {notification.type && notification.type !== 'realtime_update' && notification.type !== 'general' && (
                        <p className="text-xs mt-1 text-gray-400 dark:text-gray-500">Category: {notification.type}</p>
                       )}
                    </div>
                  </div>
                </div>
              );

              return (
                <div key={notificationKey} className={notification.deepLink ? "" : "cursor-pointer"}>
                  {notification.deepLink ? (
                    <Link href={notification.deepLink} passHref legacyBehavior>
                      <a 
                        onClick={() => { 
                          if (!notification.isRead && notificationIdForMarkRead) {
                            markAsRead(notificationIdForMarkRead);
                          }
                        }} 
                        className="block no-underline text-inherit"
                      >
                        {content}
                      </a>
                    </Link>
                  ) : (
                    content
                  )}
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
