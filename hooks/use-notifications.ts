import { useCallback, useMemo } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { ClientNotification } from '@/app/api/notifications/route'; // Import the interface

// UINotification is the type used within this hook and exposed to components.
export type UINotification = ClientNotification;

export function useNotifications(userId: string | null | undefined, userRoleForNotifications: string | undefined, messageCallbacks: { DASHBOARD_REFRESH_REQUESTED: () => void; }) {
  const queryClient = useQueryClient();

  // Fetch notifications using React Query
  const { data: notifications = [], isLoading, error: queryError, refetch: refetchNotificationsQuery } = useQuery<UINotification[], Error>({
    queryKey: ['notifications', userId],
    queryFn: async () => {
      if (!userId) return [];
      const response = await fetch('/api/notifications');
      if (!response.ok) {
        const errorText = await response.text();
        console.error("[useNotifications] API Error fetching notifications:", response.status, errorText);
        throw new Error(`Failed to fetch notifications: ${response.status} - ${errorText}`);
      }
      const fetchedData: ClientNotification[] = await response.json();
      console.log("[useNotifications] Fetched notifications via React Query:", fetchedData);
      return fetchedData;
    },
    enabled: !!userId,
    refetchInterval: 120000, // 2 minutes
    staleTime: 60000, // 1 minute
  });

  // Mutation for marking a single notification as read
  const markAsReadMutation = useMutation<unknown, Error, string, { previousNotifications?: UINotification[] }>({
    mutationFn: async (notificationId: string) => {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds: [notificationId] }),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API call to mark as read failed: ${errorText}`);
      }
      return response.json();
    },
    onMutate: async (notificationId: string) => {
      await queryClient.cancelQueries({ queryKey: ['notifications', userId] });
      const previousNotifications = queryClient.getQueryData<UINotification[]>(['notifications', userId]);
      queryClient.setQueryData<UINotification[]>(['notifications', userId], (old) =>
        old?.map(n => n._id === notificationId ? { ...n, isRead: true } : n)
      );
      return { previousNotifications };
    },
    onError: (err: Error, notificationId: string, context?: { previousNotifications?: UINotification[] }) => {
      if (context?.previousNotifications) {
        queryClient.setQueryData<UINotification[]>(['notifications', userId], context.previousNotifications);
      }
      console.error(`[useNotifications] Error marking notification ${notificationId} as read:`, err);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
    },
  });

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await markAsReadMutation.mutateAsync(notificationId);
      console.log(`[useNotifications] Marked notification ${notificationId} as read.`);
    } catch (error) { /* Handled by onError */ }
  }, [markAsReadMutation]);

  // Mutation for marking all notifications as read
  const markAllAsReadMutation = useMutation<unknown, Error, string[], { previousNotifications?: UINotification[] }>({
    mutationFn: async (unreadDbNotificationIds: string[]) => {
      if (unreadDbNotificationIds.length === 0) return { message: "No unread server notifications to mark." };
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds: unreadDbNotificationIds }),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API call to mark all as read failed: ${errorText}`);
      }
      return response.json();
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['notifications', userId] });
      const previousNotifications = queryClient.getQueryData<UINotification[]>(['notifications', userId]);
      queryClient.setQueryData<UINotification[]>(['notifications', userId], (old) =>
        old?.map(n => ({ ...n, isRead: true }))
      );
      return { previousNotifications };
    },
    onError: (err: Error, variables: string[], context?: { previousNotifications?: UINotification[] }) => {
      if (context?.previousNotifications) {
        queryClient.setQueryData<UINotification[]>(['notifications', userId], context.previousNotifications);
      }
      console.error('[useNotifications] Error marking all notifications as read:', err);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
    },
  });

  const markAllAsRead = useCallback(async () => {
    const unreadDbNotificationIds = notifications.filter(n => !n.isRead && n._id).map(n => n._id);
    if (unreadDbNotificationIds.length > 0) {
      try {
        await markAllAsReadMutation.mutateAsync(unreadDbNotificationIds);
        console.log('[useNotifications] Marked all displayable DB notifications as read.');
      } catch (error) { /* Handled by onError */ }
    } else if (notifications.some(n => !n.isRead)) {
      queryClient.setQueryData<UINotification[]>(['notifications', userId], (old) => old?.map(n => ({...n, isRead: true})));
      console.log('[useNotifications] Marked all client-side notifications as read.');
    }
  }, [notifications, markAllAsReadMutation, queryClient, userId]);

  // Mutation for clearing all notifications
  const clearAllNotificationsMutation = useMutation<unknown, Error, void, { previousNotifications?: UINotification[] }>({
    mutationFn: async () => {
      const response = await fetch('/api/notifications', { method: 'DELETE' });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API call to clear all notifications failed: ${errorText}`);
      }
      return response.json();
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['notifications', userId] });
      const previousNotifications = queryClient.getQueryData<UINotification[]>(['notifications', userId]);
      queryClient.setQueryData<UINotification[]>(['notifications', userId], []);
      return { previousNotifications };
    },
    onError: (err: Error, variables: void, context?: { previousNotifications?: UINotification[] }) => {
      if (context?.previousNotifications) {
        queryClient.setQueryData<UINotification[]>(['notifications', userId], context.previousNotifications);
      }
      console.error('[useNotifications] Error clearing all notifications:', err);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
    },
  });

  const clearNotifications = useCallback(async () => {
    try {
      await clearAllNotificationsMutation.mutateAsync();
      console.log('[useNotifications] Cleared all notifications.');
    } catch (error) { /* Handled by onError */ }
  }, [clearAllNotificationsMutation]);

  // Mutation for clearing read notifications
  const clearReadNotificationsMutation = useMutation<unknown, Error, string[], { previousNotifications?: UINotification[] }>({
    mutationFn: async (readNotificationIds: string[]) => {
      if (readNotificationIds.length === 0) return { message: "No read server notifications to clear." };
      const response = await fetch('/api/notifications', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds: readNotificationIds, action: 'clearRead' }),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API call to clear read notifications failed: ${errorText}`);
      }
      return response.json();
    },
    onMutate: async (readNotificationIds: string[]) => {
      await queryClient.cancelQueries({ queryKey: ['notifications', userId] });
      const previousNotifications = queryClient.getQueryData<UINotification[]>(['notifications', userId]);
      queryClient.setQueryData<UINotification[]>(['notifications', userId], (old) =>
        old?.filter(n => !readNotificationIds.includes(n._id))
      );
      return { previousNotifications };
    },
    onError: (err: Error, variables: string[], context?: { previousNotifications?: UINotification[] }) => {
      if (context?.previousNotifications) {
        queryClient.setQueryData<UINotification[]>(['notifications', userId], context.previousNotifications);
      }
      console.error('[useNotifications] Error clearing read notifications:', err);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
    },
  });

  const clearReadNotifications = useCallback(async () => {
    const readNotificationServerIds = notifications.filter(n => n.isRead && n._id).map(n => n._id);
    if (readNotificationServerIds.length > 0) {
      try {
        await clearReadNotificationsMutation.mutateAsync(readNotificationServerIds);
        console.log('[useNotifications] Cleared read notifications from server.');
      } catch (error) { /* Handled by onError */ }
    } else if (notifications.some(n => n.isRead)) {
      queryClient.setQueryData<UINotification[]>(['notifications', userId], (old) => old?.filter(n => !n.isRead));
      console.log('[useNotifications] Cleared client-side read notifications.');
    }
  }, [notifications, clearReadNotificationsMutation, queryClient, userId]);

  if (queryError) {
    console.error("[useNotifications] React Query error fetching notifications:", queryError.message);
  }

  const refetchNotifications = useCallback(() => {
    if (userId) { // Only refetch if there's a user
      console.log("[useNotifications] Manually refetching notifications.");
      refetchNotificationsQuery();
    }
  }, [userId, refetchNotificationsQuery]);

  return useMemo(() => ({
    notifications,
    isLoading,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    clearReadNotifications,
    refetchNotifications, // Expose the refetch function
    error: queryError?.message || null,
  }), [notifications, isLoading, markAsRead, markAllAsRead, clearNotifications, clearReadNotifications, refetchNotifications, queryError]);
}
