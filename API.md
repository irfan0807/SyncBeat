# SyncBeat API Documentation

## Table of Contents
- [REST API](#rest-api)
- [WebSocket API](#websocket-api)
- [Data Models](#data-models)
- [Error Handling](#error-handling)

## REST API

### Base URL
- Development: `http://localhost:3001`
- Production: `https://yourdomain.com`

### Endpoints

#### Health Check
```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-11-14T18:00:00.000Z",
  "uptime": 3600,
  "environment": "production",
  "stats": {
    "activeRooms": 5,
    "activeUsers": 23,
    "activeConnections": 23
  }
}
```

#### Statistics
```http
GET /api/stats
```

**Response:**
```json
{
  "rooms": 5,
  "users": 23,
  "connections": 23
}
```

**Rate Limit:** 100 requests per 15 minutes per IP

## WebSocket API

### Connection
Connect to the WebSocket server:
```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001', {
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5
});
```

### Events

#### Client → Server Events

##### 1. Create Room
Create a new music room.

**Event:** `create-room`

**Payload:**
```typescript
{
  userName: string;  // 1-50 characters
  userId?: string;   // Optional user ID
}
```

**Response Event:** `room-created`

**Example:**
```javascript
socket.emit('create-room', {
  userName: 'John Doe',
  userId: 'user-123'
});

socket.on('room-created', (data) => {
  console.log('Room created:', data);
});
```

##### 2. Join Room
Join an existing room.

**Event:** `join-room`

**Payload:**
```typescript
{
  roomId: string;    // 6 uppercase alphanumeric characters
  userName: string;  // 1-50 characters
  userId?: string;   // Optional user ID
}
```

**Response Event:** `room-joined`

**Example:**
```javascript
socket.emit('join-room', {
  roomId: 'ABC123',
  userName: 'Jane Doe',
  userId: 'user-456'
});

socket.on('room-joined', (data) => {
  console.log('Joined room:', data);
});
```

##### 3. Send Message
Send a chat message in the room.

**Event:** `send-message`

**Payload:**
```typescript
{
  message: string;   // 1-1000 characters
  type?: 'text' | 'system';  // Default: 'text'
}
```

**Broadcast Event:** `new-message`

**Example:**
```javascript
socket.emit('send-message', {
  message: 'Hello everyone!',
  type: 'text'
});

socket.on('new-message', (message) => {
  console.log('New message:', message);
});
```

##### 4. Update Track
Update the current playing track (host only).

**Event:** `track-update`

**Payload:**
```typescript
{
  track: {
    id: string;
    name: string;
    artist: string;
    album: string;
    image: string;
    duration: number;    // milliseconds
    youtube_id?: string;
  }
}
```

**Broadcast Event:** `track-changed`

**Example:**
```javascript
socket.emit('track-update', {
  track: {
    id: 'video-123',
    name: 'Song Title',
    artist: 'Artist Name',
    album: 'Album Name',
    image: 'https://...',
    duration: 240000,
    youtube_id: 'abc123'
  }
});
```

##### 5. Update Playback State
Control playback (host only).

**Event:** `playback-state`

**Payload:**
```typescript
{
  isPlaying: boolean;
  position: number;  // milliseconds
}
```

**Broadcast Event:** `playback-sync`

**Example:**
```javascript
socket.emit('playback-state', {
  isPlaying: true,
  position: 30000  // 30 seconds
});
```

##### 6. Request Sync
Request current playback state.

**Event:** `request-sync`

**Payload:** None

**Response Event:** `playback-sync`

##### 7. Typing Indicators

**Start Typing:**
```javascript
socket.emit('typing-start');
```

**Stop Typing:**
```javascript
socket.emit('typing-stop');
```

**Broadcast Event:** `user-typing`

##### 8. Ping/Pong (Heartbeat)

**Client Responds to Ping:**
```javascript
socket.on('ping', () => {
  socket.emit('pong');
});
```

#### Server → Client Events

##### 1. Room Created
**Event:** `room-created`

**Payload:**
```typescript
{
  success: boolean;
  roomId: string;
  room: Room;
  user: User;
}
```

##### 2. Room Joined
**Event:** `room-joined`

**Payload:**
```typescript
{
  room: Room;
  user: User;
}
```

##### 3. User Joined
**Event:** `user-joined`

**Payload:**
```typescript
{
  user: User;
  room: Room;
  message: string;
}
```

##### 4. User Left
**Event:** `user-left`

**Payload:**
```typescript
{
  userId: string;
  userName: string;
  room: Room;
  message: string;
}
```

##### 5. Host Changed
**Event:** `host-changed`

**Payload:**
```typescript
{
  newHostId: string;
  newHostName: string;
  room: Room;
  message: string;
}
```

##### 6. New Message
**Event:** `new-message`

**Payload:**
```typescript
{
  id: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: number;
  delivered: boolean;
  type: 'text' | 'system';
  roomId: string;
}
```

##### 7. Track Changed
**Event:** `track-changed`

**Payload:**
```typescript
{
  track: Track;
  timestamp: number;
  changedBy: string;
}
```

##### 8. Playback Sync
**Event:** `playback-sync`

**Payload:**
```typescript
{
  isPlaying: boolean;
  position: number;
  timestamp: number;
  trackId: string | null;
  controlledBy?: string;
}
```

##### 9. User Typing
**Event:** `user-typing`

**Payload:**
```typescript
{
  typingUsers: string[];  // Array of user names
}
```

##### 10. Error Events

**Room Error:**
```typescript
{
  message: string;
}
```

**Message Error:**
```typescript
{
  message: string;
}
```

**Action Error:**
```typescript
{
  message: string;
}
```

## Data Models

### User
```typescript
interface User {
  id: string;
  name: string;
  socketId: string;
  joinedAt: number;
  isOnline: boolean;
  lastSeen?: number;
}
```

### Room
```typescript
interface Room {
  id: string;
  hostId: string;
  hostName: string;
  users: User[];
  messages: Message[];
  currentTrack: Track | null;
  isPlaying: boolean;
  position: number;
  lastUpdateTime: number;
  playbackState?: PlaybackState;
  typingUsers?: string[];
  memberCount?: number;
  createdAt?: number;
}
```

### Track
```typescript
interface Track {
  id: string;
  name: string;
  artist: string;
  album: string;
  image: string;
  duration: number;  // milliseconds
  preview_url?: string;
  youtube_id?: string;
}
```

### Message
```typescript
interface Message {
  id: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: number;
  delivered?: boolean;
  type?: 'text' | 'system';
}
```

### PlaybackState
```typescript
interface PlaybackState {
  isPlaying: boolean;
  position: number;  // milliseconds
  timestamp: number;
  trackId: string | null;
}
```

## Error Handling

### Error Types

1. **Room Errors** (`room-error`)
   - Room not found
   - Room is full
   - Invalid room data
   - Failed to create/join room

2. **Message Errors** (`message-error`)
   - Not in a room
   - Room not found
   - User not found in room
   - Invalid message
   - Failed to send message

3. **Action Errors** (`action-error`)
   - Only host can change tracks
   - Only host can control playback
   - Failed to update track
   - Failed to update playback state

### Example Error Handling

```javascript
socket.on('room-error', (error) => {
  console.error('Room error:', error.message);
  // Display error to user
});

socket.on('message-error', (error) => {
  console.error('Message error:', error.message);
  // Retry or notify user
});

socket.on('action-error', (error) => {
  console.error('Action error:', error.message);
  // Show permission error to user
});

socket.on('disconnect', (reason) => {
  console.log('Disconnected:', reason);
  if (reason === 'io server disconnect') {
    // Server disconnected, manual reconnect needed
    socket.connect();
  }
  // Auto-reconnect for other reasons
});
```

## Rate Limiting

- **API Endpoints**: 100 requests per 15 minutes per IP
- **WebSocket Events**: Monitored via heartbeat (ping/pong every 30 seconds)
- **Message Length**: Maximum 1000 characters
- **Room Capacity**: Maximum 10 users per room

## Best Practices

1. **Connection Management**
   - Implement reconnection logic
   - Handle disconnection gracefully
   - Use heartbeat for connection monitoring

2. **State Management**
   - Sync state on connection
   - Request sync when needed
   - Handle state conflicts

3. **Error Recovery**
   - Implement retry logic
   - Show user-friendly errors
   - Log errors for debugging

4. **Performance**
   - Debounce typing indicators
   - Limit message history
   - Paginate user lists

5. **Security**
   - Validate all inputs
   - Sanitize user content
   - Use HTTPS in production
   - Implement authentication

## Examples

### Complete Room Workflow

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001');

// Create room
socket.emit('create-room', {
  userName: 'John Doe'
});

socket.on('room-created', ({ roomId, room }) => {
  console.log('Room created:', roomId);
  
  // Send message
  socket.emit('send-message', {
    message: 'Welcome to my room!'
  });
  
  // Update track
  socket.emit('track-update', {
    track: {
      id: 'video-1',
      name: 'Song Name',
      artist: 'Artist Name',
      album: 'Album',
      image: 'https://...',
      duration: 240000,
      youtube_id: 'abc123'
    }
  });
  
  // Start playback
  socket.emit('playback-state', {
    isPlaying: true,
    position: 0
  });
});

// Listen for events
socket.on('user-joined', ({ user }) => {
  console.log('User joined:', user.name);
});

socket.on('new-message', (message) => {
  console.log('Message:', message.userName, message.message);
});

socket.on('playback-sync', (state) => {
  console.log('Playback state:', state);
});
```

---

For more information, see [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment instructions.
