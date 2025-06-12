import { WebSocketServer, WebSocket } from 'ws';
import http from 'http'; // Import http module

const WS_PORT = 3001;
const HTTP_PORT = 3002; // Port for internal HTTP calls

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
    req.on('end', () => {
      try {
        const { userId, messageData } = JSON.parse(body);
        if (userId && messageData) {
          const success = sendNotificationToUser(userId, messageData);
          if (success) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'User notification sent' }));
          } else {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Failed to send user notification via WebSocket' }));
          }
        } else {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: 'Missing userId or messageData in request body' }));
        }
      } catch (e) {
        console.error("Error parsing JSON for /internal/send-user-notification:", e);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Invalid JSON in request body' }));
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
  // For now, let's use simple query parameters for userId and role
  const url = new URL(req.url || '', `http://${req.headers.host}`);
  const userId = url.searchParams.get('userId');
  const role = url.searchParams.get('role');

  if (!userId) { // Role can be optional for some connections, but userId is essential
    console.log('Connection attempt without userId, closing.');
    ws.close();
    return;
  }

  ws.userId = userId;
  ws.role = role || undefined; // Store the role
  ws.isAlive = true;
  clients.set(userId, ws); // Keep track of all clients by userId

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
    // Handle incoming messages if needed
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

// Keep-alive mechanism
const interval = setInterval(() => {
  clients.forEach((ws) => {
    if (ws.isAlive === false) {
      console.log(`Client ${ws.userId} not responding, terminating.`);
      return ws.terminate();
    }
    ws.isAlive = false;
    ws.ping(() => {});
  });
}, 30000); // 30 seconds

wss.on('close', () => {
  clearInterval(interval);
});

export function sendNotificationToUser(userId: string, message: any) {
  const client = clients.get(userId);
  if (client && client.readyState === WebSocket.OPEN) {
    try {
      client.send(JSON.stringify(message));
      console.log(`Notification sent to ${userId}:`, message);
      return true;
    } catch (error) {
      console.error(`Error sending notification to ${userId}:`, error);
      return false;
    }
  } else {
    console.log(`Client ${userId} not connected or not ready.`);
    return false;
  }
}

export function broadcastNotification(message: any) {
  let count = 0;
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(JSON.stringify(message));
        count++;
      } catch (error) {
        console.error(`Error broadcasting to ${client.userId}:`, error);
      }
    }
  });
  console.log(`Broadcasted notification to ${count} clients:`, message);
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
  const client = clients.get(submitterId); // Get specific submitter client by their ID
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

// Example: Graceful shutdown (optional, depends on how you run the server)
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
