"use client";

import { useEffect, useRef } from 'react';
// Remove direct import of useNotifications and UINotification if not used elsewhere in this file after context integration
// import { UINotification } from '@/hooks/use-notifications'; 
import { useUserProfile } from '@/hooks/use-user-profile'; // Keep for isLoadingProfile check
import { useNotificationContext } from '@/contexts/NotificationContext'; // Import the context hook
import { toast } from 'sonner';
import { CheckCircle, XCircle, Info, AlertTriangle } from 'lucide-react';

export function NotificationDisplay() {
  const { isLoading: isLoadingProfile } = useUserProfile(); // Only need isLoadingProfile
  const { notifications, isConnected } = useNotificationContext(); // Get data from context
  const displayedNotificationIds = useRef(new Set<string>());

  useEffect(() => {
    if (notifications.length > 0) {
      const newUnreadNotifications = notifications.filter(
        n => !n.isRead && !displayedNotificationIds.current.has(n._id || n.clientGeneratedId || '')
      );

      newUnreadNotifications.forEach(notification => {
        const notificationId = notification._id || notification.clientGeneratedId;
        if (!notificationId) {
          console.warn("[NotificationDisplay] Notification missing ID, cannot display toast:", notification);
          return; 
        }

        let iconComponent;
        let toastFunction: (typeof toast | typeof toast.success | typeof toast.error | typeof toast.warning | typeof toast.info) = toast;

        switch (notification.level) {
          case 'success':
            iconComponent = <CheckCircle className="h-5 w-5 text-green-500" />;
            toastFunction = toast.success;
            break;
          case 'error':
            iconComponent = <XCircle className="h-5 w-5 text-red-500" />;
            toastFunction = toast.error;
            break;
          case 'warning':
            iconComponent = <AlertTriangle className="h-5 w-5 text-yellow-500" />;
            toastFunction = toast.warning;
            break;
          case 'info':
          default:
            iconComponent = <Info className="h-5 w-5 text-blue-500" />;
            toastFunction = toast.info; // or just toast for default
            break;
        }
        
        toastFunction(notification.title, {
          description: notification.message,
          duration: notification.level === 'error' ? 8000 : 5000,
          icon: iconComponent,
          // Add other sonner options if needed, e.g., actions, links
        });
        
        displayedNotificationIds.current.add(notificationId);
      });
    }

    // Clean up old IDs from the displayed set if notifications are cleared/reduced elsewhere
    // This prevents re-displaying toasts if the notifications array is manipulated externally
    // in a way that re-introduces old notifications as "new" to this component's logic.
    const currentNotificationKeys = new Set(notifications.map(n => n._id || n.clientGeneratedId).filter(Boolean));
    displayedNotificationIds.current.forEach(id => {
      if (!currentNotificationKeys.has(id)) {
        displayedNotificationIds.current.delete(id);
      }
    });

  }, [notifications]);

  // Optional: Display connection status for debugging or UI feedback
  useEffect(() => {
    // Check isConnected from context, and isLoadingProfile to avoid premature toasts
    // The userId check is removed as useNotificationContext handles its own user context
    if (isConnected !== undefined && !isLoadingProfile) {
      // This might be too noisy, enable for debugging if needed.
      // if (isConnected) {
      //   toast.message("Notifications Connected", { icon: <CheckCircle className="text-green-500" />, duration: 2000 });
      // } else {
      //   // toast.error("Notifications Disconnected", { icon: <XCircle className="text-red-500" />, duration: 2000 });
      // }
    }
  }, [isConnected, isLoadingProfile]);

  if (isLoadingProfile) {
    return null; 
  }

  return null; 
}
