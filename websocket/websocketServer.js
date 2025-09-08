const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;

class WebSocketServer {
  constructor(server) {
    this.wss = new WebSocket.Server({ server });
    this.clients = new Map(); // Map of userId to WebSocket client
    
    this.wss.on('connection', (ws, req) => {
      console.log('New WebSocket connection');
      
      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message);
          
          if (data.type === 'authenticate') {
            this.authenticateClient(ws, data.token);
          }
        } catch (error) {
          console.error('Error processing message:', error);
          ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
        }
      });
      
      ws.on('close', () => {
        // Remove client from map when disconnected
        for (const [userId, client] of this.clients.entries()) {
          if (client === ws) {
            this.clients.delete(userId);
            console.log(`User ${userId} disconnected`);
            break;
          }
        }
      });
      
      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
      });
    });
  }
  
  authenticateClient(ws, token) {
    try {
      // Check if token exists and is not empty
      if (!token || token.trim() === '') {
        throw new Error('No token provided');
      }

      const decoded = jwt.verify(token, JWT_SECRET);
      const userId = decoded.id;
      
      if (!userId) {
        throw new Error('Invalid token payload');
      }
      
      // Store the authenticated client
      this.clients.set(userId, ws);
      
      ws.userId = userId;
      ws.send(JSON.stringify({ 
        type: 'authenticated', 
        message: 'Successfully authenticated' 
      }));
      
      console.log(`User ${userId} authenticated via WebSocket`);
    } catch (error) {
      console.error('Authentication failed:', error.message);
      ws.send(JSON.stringify({ 
        type: 'error', 
        message: 'Authentication failed: ' + error.message
      }));
      // Don't close immediately, let client handle the error
    }
  }
  
  sendNotification(userId, notification) {
    const client = this.clients.get(userId);
    
    if (client && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({
        type: 'notification',
        data: notification
      }));
      return true;
    }
    
    return false;
  }
  
  broadcastToUser(userId, message) {
    const client = this.clients.get(userId);
    
    if (client && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
      return true;
    }
    
    return false;
  }
}

module.exports = WebSocketServer;