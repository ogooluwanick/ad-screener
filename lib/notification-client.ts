// This is a placeholder for client-side logic to trigger notifications.
// In a real application, this would likely make an HTTP request
// This client sends HTTP requests to the Next.js API routes for notifications.

interface UserNotificationData {
  title: string;
  message: string;
  level: 'info' | 'success' | 'warning' | 'error';
  deepLink?: string;
}

export async function sendNotificationToUser(userId: string, messageData: UserNotificationData) {
  // Calls the new Next.js API route for creating notifications
  const endpoint = '/api/notifications/create'; 
  console.log(`[NotificationClient] Attempting to send notification to user ${userId} via ${endpoint}:`, messageData);
  try {
    // The /api/notifications/create route expects userId and messageData fields (title, message, level, etc.) at the top level of the body
    const payload = {
      userId,
      ...messageData, // Spread title, message, level, deepLink from messageData
    };
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[NotificationClient] Failed to create user notification via API. Status: ${response.status}, Body: ${errorText}`);
      // Optionally, throw an error or return a more detailed error object
      return false; 
    }
    const responseData = await response.json();
    console.log(`[NotificationClient] Successfully created user notification for ${userId}:`, responseData);
    return true;
  } catch (error) {
    console.error('[NotificationClient] Error calling notification creation API:', error);
    return false;
  }
}

// The following functions are commented out as their functionality (direct WebSocket triggers)
// is being replaced by client-side polling or is out of scope for this immediate refactor.

/*
export async function triggerReviewerDashboardUpdate() {
  // This functionality is now handled by client-side polling of dashboard data
  console.warn("[NotificationClient] triggerReviewerDashboardUpdate is deprecated.");
  return Promise.resolve(true); // Or simply remove
}

export async function triggerSubmitterDashboardUpdate(submitterId: string) {
  // This functionality is now handled by client-side polling of dashboard data
  console.warn(`[NotificationClient] triggerSubmitterDashboardUpdate for ${submitterId} is deprecated.`);
  return Promise.resolve(true); // Or simply remove
}

export async function broadcastNotification(messageData: UserNotificationData) {
  // Broadcast functionality needs to be re-evaluated.
  // The current /api/notifications/create is for single users.
  // A new API endpoint or logic would be needed for true broadcast.
  console.warn("[NotificationClient] broadcastNotification is deprecated pending new implementation.");
  // const endpoint = `${INTERNAL_HTTP_SERVER_URL}/internal/broadcast-notification`;
  // console.log(`[NotificationClient] Attempting to broadcast notification via ${endpoint}:`, messageData);
  // try {
  //   const response = await fetch(endpoint, {
  //     method: 'POST',
  //     headers: { 'Content-Type': 'application/json' },
  //     body: JSON.stringify({ messageData }), 
  //   });
  //   if (!response.ok) {
  //     const errorText = await response.text();
  //     console.error(`[NotificationClient] Failed to trigger broadcast notification via HTTP. Status: ${response.status}, Body: ${errorText}`);
  //     return false;
  //   }
  //   console.log('[NotificationClient] Successfully triggered broadcast notification.');
  //   return true;
  // } catch (error) {
  //   console.error('[NotificationClient] Error calling internal HTTP server for broadcast notification:', error);
  //   return false;
  // }
  return Promise.resolve(false); // Placeholder
}
*/
