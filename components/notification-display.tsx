"use client";

import { useEffect } from 'react';
import { useNotifications } from '@/hooks/use-notifications';
import { useUserProfile } from '@/hooks/use-user-profile'; // To get the userId (email in this case)
import { toast } from 'sonner'; // Assuming 'sonner' is set up for toasts

export function NotificationDisplay() {
  const { data: userProfile, isLoading: isLoadingProfile } = useUserProfile();
  // Using email as userId, ensure this is a unique identifier for your users
  // If you use next-auth, session.user.id or session.user.email from useSession() might be more direct
  const userId = userProfile?.email;

  const { notifications, isConnected } = useNotifications(userId);

  useEffect(() => {
    if (notifications.length > 0) {
      const latestNotification = notifications[0]; // sonner typically shows one toast at a time, or stacks them
      
      // Customize toast appearance based on notification type or data
      // For example, you might have different toast functions for 'info', 'success', 'error', 'warning'
      // For now, we'll use a generic toast.
      
      let toastMessage = '';
      if (typeof latestNotification.data === 'string') {
        toastMessage = latestNotification.data;
      } else if (latestNotification.data && typeof latestNotification.data.message === 'string') {
        toastMessage = latestNotification.data.message;
      } else {
        toastMessage = `New notification: ${latestNotification.type}`;
      }

      toast(toastMessage, {
        description: `Type: ${latestNotification.type} - ${new Date(latestNotification.timestamp).toLocaleTimeString()}`,
        // You can add actions or icons here if needed
        // action: {
        //   label: 'Undo',
        //   onClick: () => console.log('Undo!'),
        // },
      });
    }
  }, [notifications]);

  // Optional: Display connection status for debugging or UI feedback
  // useEffect(() => {
  //   if (userId) { // Only show connection status if a user is identified
  //     if (isConnected) {
  //       toast.success("Notification service connected.", { duration: 2000 });
  //     } else {
  //       // Avoid showing disconnected message immediately on load or if connection is pending
  //       // This might need more sophisticated handling if shown persistently
  //       // console.log("Notification service disconnected.");
  //     }
  //   }
  // }, [isConnected, userId]);

  if (isLoadingProfile) {
    return null; // Or a loading indicator if this component is critical path
  }

  // This component doesn't render anything itself directly into the DOM here,
  // as 'sonner' handles the toast display globally.
  // It just needs to be mounted in your application layout.
  return null; 
}

// To use this, you'd typically include <NotificationDisplay /> in your main layout component (e.g., app/layout.tsx)
// And ensure <Toaster /> from 'sonner' is also present in your layout.
