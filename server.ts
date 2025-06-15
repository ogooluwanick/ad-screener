import path from 'path';
import dotenv from 'dotenv';
import fs from 'fs'; // Import fs for file system checks

// Explicitly load .env.local and override existing env vars if any conflict
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath, override: true });
} else {
  // Fallback or error if .env.local is critical and not found
  console.error(`[SERVER] CRITICAL: .env.local file NOT FOUND at: ${envPath}. Server may not function correctly.`);
}

// The following lines that logged specific env vars have been removed for security.
// console.log('[SERVER] MONGODB_URI from process.env after dotenv attempt:', process.env.MONGODB_URI);
// console.log('[SERVER] WEBSOCKET_SERVER_PORT from process.env after dotenv:', process.env.WEBSOCKET_SERVER_PORT);
// console.log('[SERVER] INTERNAL_HTTP_SERVER_PORT from process.env after dotenv:', process.env.INTERNAL_HTTP_SERVER_PORT);


import { WebSocketServer, WebSocket } from 'ws';
import http from 'http'; // Import http module
import clientPromise from './lib/mongodb'; // Import MongoDB client
import { ObjectId } from 'mongodb';

const WS_PORT = parseInt(process.env.WEBSOCKET_SERVER_PORT || '6868', 10); // Default changed to 6868
const HTTP_PORT = parseInt(process.env.INTERNAL_HTTP_SERVER_PORT || '3002', 10); // Port for internal HTTP calls
// Note: The default for INTERNAL_HTTP_SERVER_PORT is 3002 here, but .env.local has 6969, which will take precedence.

const wss = new WebSocketServer({ port: WS_PORT });

interface ExtendedWebSocket extends WebSocket {
  isAlive?: boolean;
  userId?: string;
  role?: string; // Added to store user role
}

// Store clients by userId, value can be the WebSocket or an object with more details
const clients = new Map<string, ExtendedWebSocket>();
// Store reviewer clients separately for targeted updates
const reviewerClients = new Set<ExtendedWebSocket>();

// Define Notification structure for DB
interface NotificationDocument {
  _id: ObjectId;
  userId: string; // The user who should receive this notification
  title: string;
  message: string;
  level: 'info' | 'success' | 'warning' | 'error';
  deepLink?: string;
  createdAt: Date;
  isRead: boolean;
  type?: string; // General purpose type, e.g., 'ad_submitted', 'ad_reviewed'
}

type NotificationInsertData = Omit<NotificationDocument, '_id'>;


console.log(`WebSocket server started on port ${WS_PORT}`);

// --- HTTP Server for Internal Triggers ---
const httpServer = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/internal/notify-reviewer-dashboard-update') {
    notifyReviewersDashboardUpdate();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'Reviewer dashboard update notification triggered' }));
  } else if (req.method === 'POST' && req.url === '/internal/notify-submitter-dashboard-update') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const { submitterId } = JSON.parse(body);
        if (submitterId) {
          notifySubmitterDashboardUpdate(submitterId);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: `Submitter ${submitterId} dashboard update notification triggered` }));
        } else {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: 'Missing submitterId in request body' }));
        }
      } catch (e) {
        console.error("Error parsing JSON for /internal/notify-submitter-dashboard-update:", e);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Invalid JSON in request body' }));
      }
    });
  } else if (req.method === 'POST' && req.url === '/internal/send-user-notification') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString(); // convert Buffer to string
    });
    req.on('end', async () => { // Make this async to await DB operation
      try {
        const { userId, messageData, type: notificationType } = JSON.parse(body); // Expect 'type' for categorization
        
        if (userId && messageData) {
          // 1. Store notification in DB
          let storedNotificationId: string | null = null;
          let notificationForWs: any = messageData; // Fallback to original messageData

          try {
            const mongoClient = await clientPromise(); // Call the function to get the promise
            const db = mongoClient.db();
            const notificationsCollection = db.collection<NotificationInsertData>('notifications');
            
            const notificationToInsert: NotificationInsertData = {
              userId,
              title: messageData.title,
              message: messageData.message,
              level: messageData.level,
              deepLink: messageData.deepLink,
              createdAt: new Date(),
              isRead: false,
              type: notificationType || messageData.type || 'general', // Use provided type or default
            };
            const insertResult = await notificationsCollection.insertOne(notificationToInsert);
            storedNotificationId = insertResult.insertedId.toString();
            console.log(`[HTTP Server] Notification for ${userId} stored in DB with ID: ${storedNotificationId}.`);

            // Prepare a more complete payload for WebSocket, including DB _id and createdAt
            notificationForWs = {
              _id: storedNotificationId,
              userId: notificationToInsert.userId,
              title: notificationToInsert.title,
              message: notificationToInsert.message,
              level: notificationToInsert.level,
              deepLink: notificationToInsert.deepLink,
              createdAt: notificationToInsert.createdAt.toISOString(), // Use ISO string
              isRead: notificationToInsert.isRead,
              type: notificationToInsert.type,
            };

          } catch (dbError) {
            console.error(`[HTTP Server] Failed to store notification in DB for user ${userId}:`, dbError);
            // Continue to send WebSocket notification if possible, but log DB error
            // notificationForWs remains the original messageData in this case
          }

          // 2. Send real-time notification via WebSocket
          const wsSuccess = sendNotificationToUserWs(userId, notificationForWs); 
          
          if (wsSuccess) { // Consider success if WebSocket send is attempted
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'User notification processed (DB store attempted, WebSocket sent)' }));
          } else {
            // This path means WebSocket send failed. DB might have succeeded.
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Failed to send user notification via WebSocket (DB store may have succeeded)' }));
          }
        } else {
          console.error("[HTTP Server] Missing userId or messageData in /internal/send-user-notification request body:", body);
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: 'Missing userId or messageData in request body' }));
        }
      } catch (e) {
        console.error("Error processing /internal/send-user-notification:", e);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Invalid JSON or error processing request' }));
      }
    });
  } else if (req.method === 'POST' && req.url === '/internal/broadcast-notification') { // Added handler for broadcast
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', async () => {
      try {
        const { messageData, type: notificationType } = JSON.parse(body);
        if (messageData) {
          // For broadcast, we might not store in individual user's notifications unless a system-wide log is desired.
          // For now, just broadcast via WebSocket.
          // If DB storage is needed for broadcasted messages, it would require a different strategy (e.g., a separate collection or no userId).
          console.log(`[HTTP Server] Broadcasting notification:`, messageData);
          broadcastNotificationWs(messageData); // Assuming a broadcastWs function
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: 'Broadcast notification triggered' }));
        } else {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: 'Missing messageData for broadcast' }));
        }
      } catch (e) {
        console.error("Error processing /internal/broadcast-notification:", e);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Invalid JSON or error processing broadcast request' }));
      }
    });
  }
  else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'Not Found' }));
  }
});

httpServer.listen(HTTP_PORT, () => {
  console.log(`Internal HTTP server listening on port ${HTTP_PORT}`);
});

// --- WebSocket Server Logic ---
wss.on('connection', (ws: ExtendedWebSocket, req) => {
  const url = new URL(req.url || '', `http://${req.headers.host}`);
  const userId = url.searchParams.get('userId');
  const role = url.searchParams.get('role');

  if (!userId) {
    console.log('Connection attempt without userId, closing.');
    ws.close();
    return;
  }

  ws.userId = userId;
  ws.role = role || undefined;
  ws.isAlive = true;
  clients.set(userId, ws);

  if (role === 'reviewer') {
    reviewerClients.add(ws);
    console.log(`Reviewer client connected: ${userId}`);
  } else {
    console.log(`Client connected: ${userId} (role: ${role || 'N/A'})`);
  }

  ws.on('pong', () => {
    ws.isAlive = true;
  });

  ws.on('message', (message) => {
    console.log(`Received message from ${userId} (role: ${ws.role}): ${message}`);
  });

  ws.on('close', () => {
    clients.delete(userId);
    if (ws.role === 'reviewer') {
      reviewerClients.delete(ws);
      console.log(`Reviewer client disconnected: ${userId}`);
    } else {
      console.log(`Client disconnected: ${userId}`);
    }
  });

  ws.on('error', (error) => {
    console.error(`WebSocket error for client ${userId} (role: ${ws.role}):`, error);
    clients.delete(userId);
    if (ws.role === 'reviewer') {
      reviewerClients.delete(ws);
    }
  });
});

const interval = setInterval(() => {
  clients.forEach((ws) => {
    if (ws.isAlive === false) {
      console.log(`Client ${ws.userId} not responding, terminating.`);
      return ws.terminate();
    }
    ws.isAlive = false;
    ws.ping(() => {});
  });
}, 30000);

wss.on('close', () => {
  clearInterval(interval);
});

export function sendNotificationToUserWs(userId: string, message: any) {
  const client = clients.get(userId);
  if (client && client.readyState === WebSocket.OPEN) {
    try {
      client.send(JSON.stringify(message)); // Send the original messageData object
      console.log(`Notification sent to ${userId} via WebSocket:`, message);
      return true;
    } catch (error) {
      console.error(`Error sending notification to ${userId} via WebSocket:`, error);
      return false;
    }
  } else {
    console.log(`Client ${userId} not connected or not ready for WebSocket.`);
    return false;
  }
}

export function broadcastNotificationWs(message: any) { // Renamed for clarity
  let count = 0;
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(JSON.stringify(message));
        count++;
      } catch (error) {
        console.error(`Error broadcasting to ${client.userId} via WebSocket:`, error);
      }
    }
  });
  console.log(`Broadcasted notification to ${count} clients via WebSocket:`, message);
}

export function notifyReviewersDashboardUpdate() {
  const message = { type: "DASHBOARD_REFRESH_REQUESTED", timestamp: new Date().toISOString() };
  let count = 0;
  reviewerClients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(JSON.stringify(message));
        count++;
      } catch (error) {
        console.error(`Error sending dashboard update to reviewer ${client.userId}:`, error);
      }
    }
  });
  if (count > 0) {
    console.log(`Sent DASHBOARD_REFRESH_REQUESTED to ${count} reviewer clients.`);
  }
}

export function notifySubmitterDashboardUpdate(submitterId: string) {
  const client = clients.get(submitterId);
  if (client && client.role === 'submitter' && client.readyState === WebSocket.OPEN) {
    const message = { type: "SUBMITTER_DASHBOARD_REFRESH_REQUESTED", timestamp: new Date().toISOString() };
    try {
      client.send(JSON.stringify(message));
      console.log(`Sent SUBMITTER_DASHBOARD_REFRESH_REQUESTED to submitter ${submitterId}.`);
      return true;
    } catch (error) {
      console.error(`Error sending dashboard update to submitter ${submitterId}:`, error);
      return false;
    }
  } else {
    console.log(`Submitter client ${submitterId} not found, not a submitter, or not connected.`);
    return false;
  }
}

process.on('SIGINT', () => {
  console.log('Servers shutting down...');
  wss.close(() => {
    console.log('WebSocket server closed.');
    httpServer.close(() => {
      console.log('HTTP server closed.');
      process.exit(0);
    });
  });
});
