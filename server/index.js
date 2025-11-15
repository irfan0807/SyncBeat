import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import rateLimit from 'express-rate-limit';

const app = express();
const server = createServer(app);

// Environment configuration
const NODE_ENV = process.env.NODE_ENV || 'development';
const PORT = process.env.PORT || 3001;
const CORS_ORIGINS = process.env.CORS_ORIGINS 
  ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim())
  : ['http://localhost:5173'];

// CORS configuration for production
const corsOptions = {
  origin: CORS_ORIGINS,
  methods: ['GET', 'POST'],
  credentials: true
};

const io = new Server(server, {
  cors: corsOptions,
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000
});

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to API routes
app.use('/api/', apiLimiter);

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} ${res.statusCode} - ${duration}ms`);
  });
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: NODE_ENV,
    stats: {
      activeRooms: rooms.size,
      activeUsers: userSessions.size,
      activeConnections: io.sockets.sockets.size
    }
  });
});

// API endpoints
app.get('/api/stats', (req, res) => {
  res.json({
    rooms: rooms.size,
    users: userSessions.size,
    connections: io.sockets.sockets.size
  });
});

// Serve static files in production
if (NODE_ENV === 'production') {
  // Rate limit static files
  const staticLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500, // Higher limit for static files
    message: 'Too many requests, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  });
  
  app.use(express.static('dist', { maxAge: '1d' }));
  app.get('*', staticLimiter, (req, res) => {
    if (!req.path.startsWith('/api') && !req.path.startsWith('/socket.io')) {
      res.sendFile('dist/index.html', { root: '.' });
    }
  });
}

// Enhanced room management with better state tracking
const rooms = new Map();
const userSessions = new Map();
const connectionHeartbeats = new Map();

class Room {
  constructor(id, hostId, hostName) {
    this.id = id;
    this.hostId = hostId;
    this.hostName = hostName;
    this.users = new Map();
    this.messages = [];
    this.currentTrack = null;
    this.isPlaying = false;
    this.position = 0;
    this.lastUpdateTime = Date.now();
    this.createdAt = Date.now();
    this.playbackState = {
      isPlaying: false,
      position: 0,
      timestamp: Date.now(),
      trackId: null
    };
    this.typingUsers = new Set();
  }

  addUser(userId, userName, socketId) {
    const user = {
      id: userId,
      name: userName,
      socketId,
      joinedAt: Date.now(),
      isOnline: true,
      lastSeen: Date.now()
    };
    this.users.set(userId, user);
    return user;
  }

  removeUser(userId) {
    this.users.delete(userId);
    this.typingUsers.delete(userId);
  }

  addMessage(message) {
    const messageObj = {
      id: uuidv4(),
      ...message,
      timestamp: Date.now(),
      delivered: true
    };
    this.messages.push(messageObj);
    
    // Keep only last 100 messages for performance
    if (this.messages.length > 100) {
      this.messages = this.messages.slice(-100);
    }
    
    return messageObj;
  }

  updateTrack(trackData, timestamp = Date.now()) {
    this.currentTrack = trackData;
    this.playbackState.trackId = trackData?.id || null;
    this.playbackState.timestamp = timestamp;
    this.lastUpdateTime = timestamp;
  }

  updatePlaybackState(isPlaying, position, timestamp = Date.now()) {
    this.playbackState = {
      isPlaying,
      position,
      timestamp,
      trackId: this.currentTrack?.id || null
    };
    this.isPlaying = isPlaying;
    this.position = position;
    this.lastUpdateTime = timestamp;
  }

  setUserTyping(userId, isTyping) {
    if (isTyping) {
      this.typingUsers.add(userId);
    } else {
      this.typingUsers.delete(userId);
    }
  }

  getCurrentState() {
    return {
      id: this.id,
      hostId: this.hostId,
      hostName: this.hostName,
      users: Array.from(this.users.values()),
      messages: this.messages.slice(-50),
      currentTrack: this.currentTrack,
      playbackState: this.playbackState,
      isPlaying: this.isPlaying,
      position: this.position,
      lastUpdateTime: this.lastUpdateTime,
      typingUsers: Array.from(this.typingUsers),
      memberCount: this.users.size
    };
  }

  getPlaybackSync() {
    const currentTime = Date.now();
    const timeDiff = currentTime - this.playbackState.timestamp;
    
    let calculatedPosition = this.playbackState.position;
    if (this.playbackState.isPlaying && this.currentTrack) {
      calculatedPosition += timeDiff;
      // Don't exceed track duration
      calculatedPosition = Math.min(calculatedPosition, this.currentTrack.duration);
    }

    return {
      ...this.playbackState,
      calculatedPosition,
      serverTimestamp: currentTime
    };
  }
}

// Connection heartbeat system
const startHeartbeat = (socketId) => {
  const interval = setInterval(() => {
    const socket = io.sockets.sockets.get(socketId);
    if (socket) {
      socket.emit('ping');
    } else {
      clearInterval(interval);
      connectionHeartbeats.delete(socketId);
    }
  }, 30000); // 30 seconds

  connectionHeartbeats.set(socketId, interval);
};

const stopHeartbeat = (socketId) => {
  const interval = connectionHeartbeats.get(socketId);
  if (interval) {
    clearInterval(interval);
    connectionHeartbeats.delete(socketId);
  }
};

// Input validation helpers
const validateRoomData = (data) => {
  if (!data || typeof data !== 'object') return false;
  if (!data.userName || typeof data.userName !== 'string') return false;
  if (data.userName.length < 1 || data.userName.length > 50) return false;
  return true;
};

const validateJoinData = (data) => {
  if (!data || typeof data !== 'object') return false;
  if (!data.roomId || typeof data.roomId !== 'string') return false;
  if (!data.userName || typeof data.userName !== 'string') return false;
  if (data.userName.length < 1 || data.userName.length > 50) return false;
  if (data.roomId.length !== 6) return false;
  return true;
};

const validateMessage = (data) => {
  if (!data || typeof data !== 'object') return false;
  if (!data.message || typeof data.message !== 'string') return false;
  if (data.message.length < 1 || data.message.length > 1000) return false;
  return true;
};

const sanitizeString = (str) => {
  return String(str).trim().substring(0, 1000);
};

// Enhanced socket connection handling
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id} at ${new Date().toISOString()}`);
  
  // Start heartbeat for connection monitoring
  startHeartbeat(socket.id);

  // Handle pong response
  socket.on('pong', () => {
    const session = userSessions.get(socket.id);
    if (session) {
      session.lastPing = Date.now();
    }
  });

  // Enhanced room creation
  socket.on('create-room', (data) => {
    try {
      // Validate input
      if (!validateRoomData(data)) {
        socket.emit('room-error', { message: 'Invalid room data' });
        return;
      }

      const userName = sanitizeString(data.userName);
      const roomId = Math.random().toString(36).substr(2, 6).toUpperCase();
      const room = new Room(roomId, socket.id, userName);
      const user = room.addUser(socket.id, userName, socket.id);
      
      rooms.set(roomId, room);
      userSessions.set(socket.id, {
        userId: socket.id,
        userName: userName,
        roomId: roomId,
        joinedAt: Date.now(),
        lastPing: Date.now()
      });
      
      socket.join(roomId);
      
      const response = {
        success: true,
        roomId,
        room: room.getCurrentState(),
        user
      };
      
      socket.emit('room-created', response);
      
      console.log(`Room ${roomId} created by ${userName} (${socket.id})`);
    } catch (error) {
      console.error('Error creating room:', error);
      socket.emit('room-error', { message: 'Failed to create room' });
    }
  });

  // Enhanced room joining
  socket.on('join-room', (data) => {
    try {
      // Validate input
      if (!validateJoinData(data)) {
        socket.emit('room-error', { message: 'Invalid join data' });
        return;
      }

      const roomId = data.roomId.toUpperCase();
      const userName = sanitizeString(data.userName);
      const room = rooms.get(roomId);
      
      if (!room) {
        socket.emit('room-error', { message: 'Room not found' });
        return;
      }

      // Check if room is full (optional limit)
      if (room.users.size >= 10) {
        socket.emit('room-error', { message: 'Room is full' });
        return;
      }

      const user = room.addUser(socket.id, userName, socket.id);
      userSessions.set(socket.id, {
        userId: socket.id,
        userName: userName,
        roomId: roomId,
        joinedAt: Date.now(),
        lastPing: Date.now()
      });
      
      socket.join(roomId);
      
      const roomState = room.getCurrentState();
      socket.emit('room-joined', { room: roomState, user });
      
      // Notify other users
      socket.to(roomId).emit('user-joined', { 
        user,
        room: roomState,
        message: `${userName} joined the room`
      });

      // Send current playback state for sync
      const playbackSync = room.getPlaybackSync();
      socket.emit('playback-sync', playbackSync);
      
      console.log(`${userName} (${socket.id}) joined room ${roomId}`);
    } catch (error) {
      console.error('Error joining room:', error);
      socket.emit('room-error', { message: 'Failed to join room' });
    }
  });

  // Enhanced message handling
  socket.on('send-message', (data) => {
    try {
      // Validate input
      if (!validateMessage(data)) {
        socket.emit('message-error', { message: 'Invalid message' });
        return;
      }

      const session = userSessions.get(socket.id);
      if (!session) {
        socket.emit('message-error', { message: 'Not in a room' });
        return;
      }

      const room = rooms.get(session.roomId);
      if (!room) {
        socket.emit('message-error', { message: 'Room not found' });
        return;
      }

      const user = room.users.get(socket.id);
      if (!user) {
        socket.emit('message-error', { message: 'User not found in room' });
        return;
      }

      // Stop typing indicator
      room.setUserTyping(socket.id, false);
      io.to(session.roomId).emit('user-typing', {
        typingUsers: Array.from(room.typingUsers).map(id => room.users.get(id)?.name).filter(Boolean)
      });

      const message = room.addMessage({
        userId: socket.id,
        userName: user.name,
        message: sanitizeString(data.message),
        type: data.type || 'text'
      });

      io.to(session.roomId).emit('new-message', {
        ...message,
        roomId: session.roomId
      });

      console.log(`Message from ${user.name} in room ${session.roomId}: ${data.message}`);
    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('message-error', { message: 'Failed to send message' });
    }
  });

  // Typing indicator
  socket.on('typing-start', () => {
    const session = userSessions.get(socket.id);
    if (session) {
      const room = rooms.get(session.roomId);
      if (room) {
        room.setUserTyping(socket.id, true);
        socket.to(session.roomId).emit('user-typing', {
          typingUsers: Array.from(room.typingUsers).map(id => room.users.get(id)?.name).filter(Boolean)
        });
      }
    }
  });

  socket.on('typing-stop', () => {
    const session = userSessions.get(socket.id);
    if (session) {
      const room = rooms.get(session.roomId);
      if (room) {
        room.setUserTyping(socket.id, false);
        socket.to(session.roomId).emit('user-typing', {
          typingUsers: Array.from(room.typingUsers).map(id => room.users.get(id)?.name).filter(Boolean)
        });
      }
    }
  });

  // Enhanced track update
  socket.on('track-update', (data) => {
    try {
      const session = userSessions.get(socket.id);
      if (!session) return;

      const room = rooms.get(session.roomId);
      if (!room || room.hostId !== socket.id) {
        socket.emit('action-error', { message: 'Only host can change tracks' });
        return;
      }

      const timestamp = Date.now();
      room.updateTrack(data.track, timestamp);
      
      const trackChangeData = {
        track: data.track,
        timestamp,
        changedBy: session.userName
      };

      socket.to(session.roomId).emit('track-changed', trackChangeData);
      
      console.log(`Track changed in room ${session.roomId} by ${session.userName}`);
    } catch (error) {
      console.error('Error updating track:', error);
      socket.emit('action-error', { message: 'Failed to update track' });
    }
  });

  // Enhanced playback state
  socket.on('playback-state', (data) => {
    try {
      const session = userSessions.get(socket.id);
      if (!session) return;

      const room = rooms.get(session.roomId);
      if (!room || room.hostId !== socket.id) {
        socket.emit('action-error', { message: 'Only host can control playback' });
        return;
      }

      const timestamp = Date.now();
      room.updatePlaybackState(data.isPlaying, data.position, timestamp);
      
      const syncData = {
        isPlaying: data.isPlaying,
        position: data.position,
        timestamp,
        trackId: room.currentTrack?.id,
        controlledBy: session.userName
      };

      socket.to(session.roomId).emit('playback-sync', syncData);
      
      console.log(`Playback ${data.isPlaying ? 'started' : 'paused'} in room ${session.roomId}`);
    } catch (error) {
      console.error('Error updating playback state:', error);
    }
  });

  // Request sync (for when users need to resync)
  socket.on('request-sync', () => {
    const session = userSessions.get(socket.id);
    if (session) {
      const room = rooms.get(session.roomId);
      if (room) {
        const syncData = room.getPlaybackSync();
        socket.emit('playback-sync', syncData);
      }
    }
  });

  // Enhanced disconnect handling
  socket.on('disconnect', (reason) => {
    try {
      console.log(`User disconnected: ${socket.id}, reason: ${reason}`);
      
      stopHeartbeat(socket.id);
      
      const session = userSessions.get(socket.id);
      if (session) {
        const room = rooms.get(session.roomId);
        
        if (room) {
          const user = room.users.get(socket.id);
          room.removeUser(socket.id);
          
          if (room.users.size === 0) {
            // Room is empty, clean it up
            rooms.delete(session.roomId);
            console.log(`Room ${session.roomId} deleted (empty)`);
          } else if (room.hostId === socket.id) {
            // Transfer host to another user
            const newHost = Array.from(room.users.values())[0];
            room.hostId = newHost.id;
            room.hostName = newHost.name;
            
            const hostChangeData = {
              newHostId: newHost.id,
              newHostName: newHost.name,
              room: room.getCurrentState(),
              message: `${newHost.name} is now the host`
            };
            
            io.to(session.roomId).emit('host-changed', hostChangeData);
            console.log(`Host transferred to ${newHost.name} in room ${session.roomId}`);
          }
          
          // Notify remaining users
          if (room.users.size > 0) {
            socket.to(session.roomId).emit('user-left', { 
              userId: socket.id,
              userName: user?.name || 'Unknown',
              room: room.getCurrentState(),
              message: `${user?.name || 'A user'} left the room`
            });
          }
        }
        
        userSessions.delete(socket.id);
      }
    } catch (error) {
      console.error('Error handling disconnect:', error);
    }
  });

  // Room info request
  socket.on('get-room-info', () => {
    const session = userSessions.get(socket.id);
    if (session) {
      const room = rooms.get(session.roomId);
      if (room) {
        socket.emit('room-info', room.getCurrentState());
      }
    }
  });
});

// Cleanup inactive rooms periodically
setInterval(() => {
  const now = Date.now();
  const ROOM_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours

  for (const [roomId, room] of rooms) {
    if (now - room.lastUpdateTime > ROOM_TIMEOUT && room.users.size === 0) {
      rooms.delete(roomId);
      console.log(`Cleaned up inactive room: ${roomId}`);
    }
  }
}, 60 * 60 * 1000); // Check every hour

// Enhanced error handling
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // In production, you might want to log to an external service
  if (NODE_ENV !== 'production') {
    process.exit(1);
  }
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
  console.log(`\n${signal} received. Starting graceful shutdown...`);
  
  // Stop accepting new connections
  server.close(() => {
    console.log('HTTP server closed');
    
    // Close all socket connections
    io.close(() => {
      console.log('Socket.IO server closed');
      process.exit(0);
    });
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

server.listen(PORT, () => {
  console.log(`🎵 SyncBeat server running on port ${PORT}`);
  console.log(`🕒 Started at ${new Date().toISOString()}`);
  console.log(`🌍 Environment: ${NODE_ENV}`);
  console.log(`🔗 CORS origins:`, CORS_ORIGINS);
});
