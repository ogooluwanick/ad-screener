import { useState, useEffect, useCallback, useRef } from 'react';

// Extended NotificationMessage to better suit the panel's needs
export interface NotificationMessage {
  data: any;
  id: string; // WebSocket messages will get a client-side generated ID
  title: string;
  message: string; // Main content from server's message.data
  type: 'success' | 'error' | 'info' | 'default'; // Corresponds to panel's types
  timestamp: string; // From server
  read: boolean;
  originalServerType?: string; // To store the original type from server if needed
  rawData?: any; // To store the original data from server if needed
}

interface MessageCallbacks {
  [messageType: string]: (data: any) => void;
}

const WEBSOCKET_URL = 'ws://localhost:3001';

export function useNotifications(
  userId: string | null | undefined,
  role?: string | null | undefined, // Added role parameter
  onMessageCallbacks?: MessageCallbacks // Added callbacks for specific message types
) {
  const [notifications, setNotifications] = useState<NotificationMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const ws = useRef<WebSocket | null>(null);

  const connectWebSocket = useCallback(() => {
    if (!userId || ws.current?.readyState === WebSocket.OPEN) {
      if (ws.current?.readyState === WebSocket.OPEN) setIsConnected(true);
      return;
    }

    let url = `${WEBSOCKET_URL}?userId=${userId}`;
    if (role) {
      url += `&role=${role}`;
    }
    const socket = new WebSocket(url);
    ws.current = socket;

    socket.onopen = () => {
      console.log(`WebSocket connected for user: ${userId}, role: ${role || 'N/A'}`);
      setIsConnected(true);
    };

    socket.onmessage = (event) => {
      try {
        const serverMessage = JSON.parse(event.data as string);
        console.log('Received WebSocket message:', serverMessage);

        // Check if there's a specific callback for this message type
        if (serverMessage.type && onMessageCallbacks && onMessageCallbacks[serverMessage.type]) {
          console.log(`Executing callback for message type: ${serverMessage.type}`);
          onMessageCallbacks[serverMessage.type](serverMessage.data);
        } else {
          // Process as a generic notification
          console.log('Processing as generic notification:', serverMessage);
          const newNotification: NotificationMessage = {
            id: Date.now().toString() + Math.random().toString(36).substring(2),
            title: serverMessage.data?.title || serverMessage.type || 'New Notification',
            message: typeof serverMessage.data === 'string' ? serverMessage.data : serverMessage.data?.body || serverMessage.data?.message || 'You have a new update.',
            type: serverMessage.data?.level || 'info', // Assuming server might send a 'level' like 'success', 'error'
            timestamp: serverMessage.timestamp || new Date().toISOString(),
            read: false,
            originalServerType: serverMessage.type,
            rawData: serverMessage.data,
            data: undefined
          };

          setNotifications((prevNotifications) =>
            [newNotification, ...prevNotifications].slice(0, 20) // Keep latest 20
          );
        }
      } catch (error) {
        console.error('Failed to parse or handle WebSocket message:', error);
      }
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    };

    socket.onclose = (event) => {
      console.log('WebSocket disconnected:', event.reason, event.code);
      setIsConnected(false);
      ws.current = null;
      // Attempt to reconnect after a delay if not an intentional close (e.g., user logout)
      // This is a simple reconnect, more robust logic might be needed
      if (userId && event.code !== 1000) { // 1000 is normal closure
        console.log('Attempting to reconnect WebSocket in 5 seconds...');
        setTimeout(() => {
          connectWebSocket();
        }, 5000);
      }
    };
  }, [userId, role, onMessageCallbacks]); // Added role and onMessageCallbacks to dependencies

  useEffect(() => {
    if (userId) {
      connectWebSocket();
    } else {
      // User logged out or userId became null
      if (ws.current) {
        console.log('Closing WebSocket due to user logout or missing userId.');
        ws.current.close(1000, 'User logged out or userId cleared'); // 1000 indicates a normal closure
        ws.current = null;
        setIsConnected(false);
        // Optionally clear notifications on logout, or keep them for next session
        // setNotifications([]);
      }
    }

    // Cleanup function for when the hook unmounts or dependencies change
    return () => {
      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        console.log('Closing WebSocket on component unmount or dependency change.');
        ws.current.close(1000, 'Component unmounting or dependencies changed');
        ws.current = null;
      }
    };
  }, [userId, role, connectWebSocket, onMessageCallbacks]); // Ensure all dependencies are listed

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications((prevs) =>
      prevs.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prevs) => prevs.map((n) => ({ ...n, read: true })));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const clearReadNotifications = useCallback(() => {
    setNotifications((prevs) => prevs.filter(n => !n.read));
  }, []);


  return {
    notifications,
    isConnected,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    clearReadNotifications, // New function
  };
}
