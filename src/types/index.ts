export interface User {
  id: string;
  name: string;
  socketId: string;
  joinedAt?: number;
  isOnline?: boolean;
  lastSeen?: number;
}

export interface Message {
  id: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: number;
  delivered?: boolean;
  type?: 'text' | 'system';
}

export interface Track {
  id: string;
  name: string;
  artist: string;
  album: string;
  image: string;
  duration: number;
  preview_url?: string;
  youtube_id?: string; // YouTube video ID
}

export interface PlaybackState {
  isPlaying: boolean;
  position: number;
  timestamp: number;
  trackId: string | null;
}

export interface Room {
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

export interface YouTubeAuth {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface SocketEvents {
  // Room events
  'create-room': { userName: string; userId?: string };
  'join-room': { roomId: string; userName: string; userId?: string };
  'room-created': { roomId: string; room: Room; user: User };
  'room-joined': { room: Room; user: User };
  'room-error': { message: string };
  'user-joined': { user: User; room: Room; message: string };
  'user-left': { userId: string; userName: string; room: Room; message: string };
  'host-changed': { newHostId: string; newHostName: string; room: Room; message: string };

  // Message events
  'send-message': { message: string; type?: string };
  'new-message': Message & { roomId: string };
  'message-error': { message: string };

  // Typing events
  'typing-start': void;
  'typing-stop': void;
  'user-typing': { typingUsers: string[] };

  // Music events
  'track-update': { track: Track };
  'track-changed': { track: Track; timestamp: number; changedBy: string };
  'playback-state': { isPlaying: boolean; position: number };
  'playback-sync': PlaybackState & { controlledBy?: string };
  'request-sync': void;

  // Connection events
  'ping': void;
  'pong': void;
  'action-error': { message: string };
  'get-room-info': void;
  'room-info': Room;
}