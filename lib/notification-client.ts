// This is a placeholder for client-side logic to trigger notifications.
// In a real application, this would likely make an HTTP request
// This client sends HTTP requests to the internal HTTP server (part of server.ts)
// which then triggers WebSocket messages.

// Construct the URL based on the defined port, defaulting if necessary.
const INTERNAL_HTTP_PORT = process.env.INTERNAL_HTTP_SERVER_PORT || '3002';
const INTERNAL_HTTP_SERVER_URL = `http://localhost:${INTERNAL_HTTP_PORT}`;

interface UserNotificationData {
  title: string;
  message: string;
  level: 'info' | 'success' | 'warning' | 'error';
  deepLink?: string;
}

export async function sendNotificationToUser(userId: string, messageData: UserNotificationData) {
  const endpoint = `${INTERNAL_HTTP_SERVER_URL}/internal/send-user-notification`;
  console.log(`[NotificationClient] Attempting to send notification to user ${userId} via ${endpoint}:`, messageData);
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, messageData }), // server.ts expects { userId, messageData }
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[NotificationClient] Failed to trigger user notification via HTTP. Status: ${response.status}, Body: ${errorText}`);
      return false;
    }
    console.log(`[NotificationClient] Successfully triggered user notification for ${userId}`);
    return true;
  } catch (error) {
    console.error('[NotificationClient] Error calling internal HTTP server for user notification:', error);
    return false;
  }
}

export async function triggerReviewerDashboardUpdate() {
  const endpoint = `${INTERNAL_HTTP_SERVER_URL}/internal/notify-reviewer-dashboard-update`;
  console.log(`[NotificationClient] Attempting to trigger reviewer dashboard update via ${endpoint}`);
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // No body needed for this specific trigger
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[NotificationClient] Failed to trigger reviewer dashboard update via HTTP. Status: ${response.status}, Body: ${errorText}`);
      return false;
    }
    console.log('[NotificationClient] Successfully triggered reviewer dashboard update.');
    return true;
  } catch (error) {
    console.error('[NotificationClient] Error calling internal HTTP server for dashboard update:', error);
    return false;
  }
}

export async function triggerSubmitterDashboardUpdate(submitterId: string) {
  const endpoint = `${INTERNAL_HTTP_SERVER_URL}/internal/notify-submitter-dashboard-update`;
  console.log(`[NotificationClient] Attempting to trigger submitter dashboard update for ${submitterId} via ${endpoint}`);
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ submitterId }),
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[NotificationClient] Failed to trigger submitter dashboard update for ${submitterId} via HTTP. Status: ${response.status}, Body: ${errorText}`);
      return false;
    }
    console.log(`[NotificationClient] Successfully triggered dashboard update for submitter ${submitterId}.`);
    return true;
  } catch (error) {
    console.error(`[NotificationClient] Error calling internal HTTP server for submitter dashboard update for ${submitterId}:`, error);
    return false;
  }
}

export async function broadcastNotification(messageData: UserNotificationData) {
  const endpoint = `${INTERNAL_HTTP_SERVER_URL}/internal/broadcast-notification`;
  console.log(`[NotificationClient] Attempting to broadcast notification via ${endpoint}:`, messageData);
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messageData }), // server.ts will expect { messageData }
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[NotificationClient] Failed to trigger broadcast notification via HTTP. Status: ${response.status}, Body: ${errorText}`);
      return false;
    }
    console.log('[NotificationClient] Successfully triggered broadcast notification.');
    return true;
  } catch (error) {
    console.error('[NotificationClient] Error calling internal HTTP server for broadcast notification:', error);
    return false;
  }
}
