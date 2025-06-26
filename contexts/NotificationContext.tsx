"use client";

import React, { createContext, useContext, ReactNode, useMemo, useEffect } from 'react';
import { useNotifications, UINotification } from '@/hooks/use-notifications';
import { useUserProfile } from '@/hooks/use-user-profile'; // To get userId and role

interface NotificationContextType {
  notifications: UINotification[];
  isLoading: boolean;
  // isConnected: boolean; // Removed, no longer part of useNotifications
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refetchNotifications: () => void; // Added refetch function
  clearNotifications: () => void;
  clearReadNotifications: () => void;
  unreadNotificationCount: number; // Add unread count here
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const { data: userProfile } = useUserProfile();
  const userId = userProfile?._id || userProfile?.id;
  const role = userProfile?.role;

  // useNotifications hook no longer takes role or onMessageCallbacks
  const notificationState = useNotifications(userId, role, { DASHBOARD_REFRESH_REQUESTED: () => {} });

  // Log the state from useNotifications as seen by the Provider

  // Log the specific notifications array being used for the count

  useEffect(() => {
  }, [notificationState.notifications]);
  
  const unreadNotificationCount = useMemo(() => {
    const count = notificationState.notifications.filter(n => !n.isRead).length;
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
