import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { ClientNotification } from '@/app/api/notifications/route'; // Import the interface

// UINotification is the type used within this hook and exposed to components.
// It's based on ClientNotification, which comes from the DB/API.
// WebSocket messages will be transformed into this structure.
export type UINotification = ClientNotification & {
  clientGeneratedId?: string; // For WS messages before they might get a DB _id, or if they don't have one
};

interface MessageCallbacks {
  [messageType: string]: (data: any) => void;
}

const WEBSOCKET_URL = process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'ws://localhost:3001';

export function useNotifications(
  userId: string | null | undefined,
  role?: string | null | undefined,
  onMessageCallbacksProp?: MessageCallbacks // Renamed for clarity
) {
  const [notifications, setNotifications] = useState<UINotification[]>([]);
  const [isLoading, setIsLoading] = useState(false); // For fetching initial notifications
  const [isConnected, setIsConnected] = useState(false);
  const ws = useRef<WebSocket | null>(null);
  const onMessageCallbacksRef = useRef(onMessageCallbacksProp); // Store callbacks in a ref

  // Update ref when prop changes
  useEffect(() => {
    onMessageCallbacksRef.current = onMessageCallbacksProp;
  }, [onMessageCallbacksProp]);

  // Fetch initial notifications from the database
  const fetchInitialNotifications = useCallback(async () => {
    if (userId) {
      setIsLoading(true);
      try {
        const response = await fetch('/api/notifications');
        if (!response.ok) {
          throw new Error(`Failed to fetch notifications: ${response.status}`);
        }
        const data: ClientNotification[] = await response.json();
        console.log("[useNotifications] Fetched initial notifications:", data);
        
        const mappedData: UINotification[] = data.map(n => ({
          ...n, // Spread ClientNotification fields
        }));

        // setNotifications(prev => {
        //   const existingIds = new Set(prev.map(p => p._id || p.clientGeneratedId));
        //   const newNotifications = mappedData.filter(m => !(m._id && existingIds.has(m._id)));
        //   // const combined = [...newNotifications, ...prev];
        //   // return combined.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 50);
        //   return mappedData; // Simplified: directly set, overwriting previous.
        // });
        // For a more robust merge, if the above works, we can refine it.
        // A direct set for now to test state propagation:
        setNotifications(mappedData);


      } catch (error) {
        console.error("[useNotifications] Error fetching initial notifications:", error);
      } finally {
        setIsLoading(false);
      }
    }
  }, [userId]);

  useEffect(() => {
    fetchInitialNotifications();
  }, [fetchInitialNotifications]);


  const connectWebSocket = useCallback(() => {
    if (!userId) { // Simplified initial check for userId
      return;
    }
    // Prevent re-connection if already connected or connecting
    if (ws.current && (ws.current.readyState === WebSocket.OPEN || ws.current.readyState === WebSocket.CONNECTING)) {
      setIsConnected(ws.current.readyState === WebSocket.OPEN);
      console.log('[useNotifications] WebSocket already open or connecting.');
      return;
    }

    // If there's an old socket that's not open/connecting, ensure it's closed and nulled before creating a new one
    if (ws.current) {
        console.log('[useNotifications] Cleaning up previous WebSocket instance.');
        ws.current.close(1000, 'Stale connection cleanup');
        ws.current = null;
    }

    let url = `${WEBSOCKET_URL}?userId=${userId}`;
    if (role) {
      url += `&role=${role}`;
    }
    const socket = new WebSocket(url);
    ws.current = socket;

    console.log(`[useNotifications] Attempting to connect WebSocket to ${url}`);
    // setIsConnected will be set by onopen or onclose

    socket.onopen = () => {
      console.log(`[useNotifications] WebSocket connected for user: ${userId}, role: ${role || 'N/A'}`);
      setIsConnected(true);
      fetchInitialNotifications();
    };

    socket.onmessage = (event) => {
      try {
        const serverMessage = JSON.parse(event.data as string);
        console.log('[useNotifications] Received WebSocket message:', serverMessage);

        // Use the ref for callbacks
        if (serverMessage.type && onMessageCallbacksRef.current && onMessageCallbacksRef.current[serverMessage.type]) {
          console.log(`[useNotifications] Executing callback for message type: ${serverMessage.type}`);
          onMessageCallbacksRef.current[serverMessage.type](serverMessage.data || serverMessage);
        } else {
          const wsNotificationData = serverMessage;

          const newUINotification: UINotification = {
            _id: wsNotificationData._id || '', // If server sends _id for already stored notification
            clientGeneratedId: wsNotificationData._id ? undefined : (Date.now().toString() + Math.random().toString(36).substring(2)),
            userId: userId || '', 
            title: wsNotificationData.title || 'Notification',
            message: wsNotificationData.message || 'You have a new update.',
            level: wsNotificationData.level || 'info',
            deepLink: wsNotificationData.deepLink,
            createdAt: wsNotificationData.createdAt || new Date().toISOString(), 
            isRead: wsNotificationData.isRead || false,
            type: wsNotificationData.type || 'realtime_update',
          };

          setNotifications((prevNotifications) => {
            // Avoid adding if already present (e.g., just fetched)
            if (newUINotification._id && prevNotifications.some(n => n._id === newUINotification._id)) {
              return prevNotifications.map(n => n._id === newUINotification._id ? newUINotification : n);
            }
            return [newUINotification, ...prevNotifications].slice(0, 50);
          });
        }
      } catch (error) {
        console.error('[useNotifications] Failed to parse or handle WebSocket message:', error);
      }
    };

    socket.onerror = (error) => {
      console.error('[useNotifications] WebSocket error:', error);
      setIsConnected(false);
      // ws.current = null; // Let onclose handle nulling if it's the same socket instance
    };

    socket.onclose = (event) => {
      console.log('[useNotifications] WebSocket disconnected:', event.reason, event.code);
      setIsConnected(false);
      // Only set ws.current to null if this specific socket instance is closing
      if (ws.current === socket) {
        ws.current = null;
      }
      // Reconnection logic
      if (userId && event.code !== 1000 && event.code !== 1005) { // 1000 normal, 1005 no status
        console.log('[useNotifications] Attempting to reconnect WebSocket in 5 seconds...');
        setTimeout(() => {
          // Check userId again in case it changed during the timeout
          if (userId) connectWebSocket();
        }, 5000);
      }
    };
  // Dependencies for connectWebSocket: userId, role, fetchInitialNotifications.
  // onMessageCallbacksRef.current is used but the ref object itself is stable.
  }, [userId, role, fetchInitialNotifications]);

  useEffect(() => {
    if (userId) {
      connectWebSocket();
    } else {
      if (ws.current) {
        console.log('[useNotifications] Closing WebSocket due to user logout or missing userId.');
        ws.current.close(1000, 'User logged out or userId cleared');
        ws.current = null; // Ensure ref is cleared
        setIsConnected(false);
      }
    }

    // Cleanup function
    return () => {
      if (ws.current) {
        console.log('[useNotifications] Closing WebSocket on component unmount or main effect re-run.');
        ws.current.close(1000, 'Component unmounting or dependencies changed');
        ws.current = null; // Ensure ref is cleared
        setIsConnected(false);
      }
    };
  // The main effect depends on userId and the connectWebSocket function.
  // If connectWebSocket is stable (due to stable dependencies), this effect only re-runs when userId changes.
  }, [userId, connectWebSocket]);

  const markAsRead = useCallback(async (notificationId: string) => {
    const targetIsDbNotification = notifications.find(n => n._id === notificationId && n._id !== '');
    
    setNotifications((prevs) =>
      prevs.map((n) => (n._id === notificationId || n.clientGeneratedId === notificationId ? { ...n, isRead: true } : n))
    );

    if (targetIsDbNotification) {
      try {
        const response = await fetch('/api/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notificationIds: [notificationId] }),
        });
        if (!response.ok) throw new Error('API call to mark as read failed');
        console.log(`[useNotifications] Marked DB notification ${notificationId} as read via API.`);
      } catch (error) {
        console.error(`[useNotifications] Failed to mark DB notification ${notificationId} as read via API:`, error);
        setNotifications((prevs) =>
          prevs.map((n) => (n._id === notificationId ? { ...n, isRead: false } : n))
        );
      }
    }
  }, [notifications]);

  const markAllAsRead = useCallback(async () => {
    const unreadDbNotificationIds = notifications
      .filter(n => !n.isRead && n._id && n._id !== '')
      .map(n => n._id);

    setNotifications((prevs) => prevs.map((n) => ({ ...n, isRead: true })));

    if (unreadDbNotificationIds.length > 0) {
      try {
        const response = await fetch('/api/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notificationIds: unreadDbNotificationIds }),
        });
        if (!response.ok) throw new Error('API call to mark all as read failed');
        console.log('[useNotifications] Marked all displayable DB notifications as read via API.');
      } catch (error) {
        console.error('[useNotifications] Failed to mark all notifications as read via API:', error);
        setNotifications((prevs) => 
          prevs.map((n) => unreadDbNotificationIds.includes(n._id) ? { ...n, isRead: false } : n)
        );
      }
    }
  }, [notifications]);

  const clearNotifications = useCallback(async () => {
    // Optimistically update UI
    const originalNotifications = notifications;
    setNotifications([]);
    try {
      const response = await fetch('/api/notifications', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        // Optionally, send user ID if backend needs to scope the deletion
        // body: JSON.stringify({ userId }), 
      });
      if (!response.ok) {
        throw new Error('API call to clear all notifications failed');
      }
      console.log('[useNotifications] Cleared all notifications via API.');
    } catch (error) {
      console.error('[useNotifications] Failed to clear all notifications via API:', error);
      // Revert UI update on error
      setNotifications(originalNotifications);
      // Optionally, show an error toast to the user
    }
  }, [notifications, userId]); // Added userId dependency if used in body

  const clearReadNotifications = useCallback(async () => {
    const readNotificationIds = notifications
      .filter(n => n.isRead && n._id && n._id !== '')
      .map(n => n._id as string); // Ensure _id is treated as string

    if (readNotificationIds.length === 0) {
      // No server-side read notifications to clear, just update UI if any client-only read ones exist
      setNotifications((prevs) => prevs.filter(n => !n.isRead));
      return;
    }

    // Optimistically update UI
    const originalNotifications = notifications;
    setNotifications((prevs) => prevs.filter(n => !n.isRead));

    try {
      const response = await fetch('/api/notifications', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds: readNotificationIds, action: 'clearRead' }), // Added action for clarity
      });
      if (!response.ok) {
        throw new Error('API call to clear read notifications failed');
      }
      console.log('[useNotifications] Cleared read notifications via API.');
    } catch (error) {
      console.error('[useNotifications] Failed to clear read notifications via API:', error);
      // Revert UI update on error
      setNotifications(originalNotifications);
      // Optionally, show an error toast to the user
    }
  }, [notifications]);

  return useMemo(() => ({
    notifications,
    isLoading,
    isConnected,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    clearReadNotifications,
  }), [notifications, isLoading, isConnected, markAsRead, markAllAsRead, clearNotifications, clearReadNotifications]);
}
