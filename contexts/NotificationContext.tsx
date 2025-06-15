"use client";

import React, { createContext, useContext, ReactNode, useMemo, useEffect } from 'react';
import { useNotifications, UINotification } from '@/hooks/use-notifications';
import { useUserProfile } from '@/hooks/use-user-profile'; // To get userId and role

interface NotificationContextType {
  notifications: UINotification[];
  isLoading: boolean;
  isConnected: boolean;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearNotifications: () => void;
  clearReadNotifications: () => void;
  unreadNotificationCount: number; // Add unread count here
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const { data: userProfile } = useUserProfile();
  const userId = userProfile?._id || userProfile?.id;
  const role = userProfile?.role;

  // Memoize onMessageCallbacks to prevent unnecessary re-renders/effect runs in useNotifications
  const onMessageCallbacks = useMemo(() => ({}), []); 

  // Pass an empty onMessageCallbacks object or define specific ones if needed globally
  const notificationState = useNotifications(userId, role, onMessageCallbacks); 

  // Log the state from useNotifications as seen by the Provider
  console.log('[NotificationProvider] notificationState from useNotifications:', notificationState);

  // Log the specific notifications array being used for the count
  console.log('[NotificationProvider] notifications array for count:', notificationState.notifications);

  useEffect(() => {
    console.log('[NotificationProvider EFFECT] notificationState.notifications changed (or component re-rendered with new ref):', notificationState.notifications);
  }, [notificationState.notifications]);
  
  const unreadNotificationCount = useMemo(() => {
    const count = notificationState.notifications.filter(n => !n.isRead).length;
    // Log the calculated unread count
    console.log('[NotificationProvider] calculated unreadNotificationCount (inside useMemo):', count);
    return count;
  }, [notificationState.notifications]);

  const value = useMemo(() => ({
    ...notificationState,
    unreadNotificationCount, // Provide the count through context
  }), [notificationState, unreadNotificationCount]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotificationContext = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotificationContext must be used within a NotificationProvider');
  }
  return context;
};
