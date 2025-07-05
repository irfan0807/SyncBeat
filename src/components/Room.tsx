import React, { useState, useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { Room as RoomType, Message, Track } from '../types';
import MusicPlayer from './MusicPlayer';
import ChatPanel from './ChatPanel';
import MembersList from './MembersList';
import ConnectionStatus from './ConnectionStatus';
import { Users, MessageCircle, Music, Copy, Check, LogOut, User } from 'lucide-react';

interface RoomProps {
  socket: Socket;
  room: RoomType;
  currentUserId: string;
  isConnected: boolean;
  onLeaveRoom: () => void;
  onReconnect: () => void;
  onLogout: () => void;
}

const Room: React.FC<RoomProps> = ({ 
  socket, 
  room, 
  currentUserId, 
  isConnected,
  onLeaveRoom,
  onReconnect,
  onLogout
}) => {
  const [messages, setMessages] = useState<Message[]>(room.messages || []);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(room.currentTrack);
  const [isPlaying, setIsPlaying] = useState(room.isPlaying);
  const [position, setPosition] = useState(room.position || 0);
  const [showMembers, setShowMembers] = useState(false);
  const [showChat, setShowChat] = useState(true);
  const [copied, setCopied] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [lastSync, setLastSync] = useState<number>(Date.now());
  const [notifications, setNotifications] = useState<string[]>([]);
  
  const syncTimeoutRef = useRef<NodeJS.Timeout>();
  const positionUpdateRef = useRef<NodeJS.Timeout>();

  const isHost = currentUserId === room.hostId;
  const currentUser = room.users.find(user => user.id === currentUserId);

  // Auto-sync position for smooth playback
  useEffect(() => {
    if (isPlaying && currentTrack && !isHost) {
      const updatePosition = () => {
        setPosition(prev => {
          const newPos = prev + 1000; // Add 1 second
          return Math.min(newPos, currentTrack.duration);
        });
      };

      positionUpdateRef.current = setInterval(updatePosition, 1000);
      
      return () => {
        if (positionUpdateRef.current) {
          clearInterval(positionUpdateRef.current);
        }
      };
    }
  }, [isPlaying, currentTrack, isHost]);

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message: Message) => {
      setMessages(prev => [...prev, message]);
      addNotification(`New message from ${message.userName}`);
    };

    const handleTrackChanged = (data: { track: Track; changedBy: string }) => {
      setCurrentTrack(data.track);
      addNotification(`${data.changedBy} changed the track to "${data.track.name}"`);
    };

    const handlePlaybackSync = (data: { 
      isPlaying: boolean; 
      position: number; 
      timestamp: number;
      controlledBy?: string;
    }) => {
      const now = Date.now();
      const latency = now - data.timestamp;
      let adjustedPosition = data.position;

      // Adjust for network latency
      if (data.isPlaying) {
        adjustedPosition += latency;
      }

      setIsPlaying(data.isPlaying);
      setPosition(adjustedPosition);
      setLastSync(now);

      if (data.controlledBy && !isHost) {
        addNotification(`${data.controlledBy} ${data.isPlaying ? 'resumed' : 'paused'} playback`);
      }
    };

    const handleUserJoined = (data: { room: RoomType; message: string }) => {
      addNotification(data.message);
    };

    const handleUserLeft = (data: { room: RoomType; message: string }) => {
      addNotification(data.message);
    };

    const handleHostChanged = (data: { room: RoomType; message: string }) => {
      addNotification(data.message);
    };

    const handleUserTyping = (data: { typingUsers: string[] }) => {
      setTypingUsers(data.typingUsers.filter(name => name !== getCurrentUserName()));
    };

    const handleActionError = (data: { message: string }) => {
      addNotification(`Error: ${data.message}`);
    };

    socket.on('new-message', handleNewMessage);
    socket.on('track-changed', handleTrackChanged);
    socket.on('playback-sync', handlePlaybackSync);
    socket.on('user-joined', handleUserJoined);
    socket.on('user-left', handleUserLeft);
    socket.on('host-changed', handleHostChanged);
    socket.on('user-typing', handleUserTyping);
    socket.on('action-error', handleActionError);

    return () => {
      socket.off('new-message', handleNewMessage);
      socket.off('track-changed', handleTrackChanged);
      socket.off('playback-sync', handlePlaybackSync);
      socket.off('user-joined', handleUserJoined);
      socket.off('user-left', handleUserLeft);
      socket.off('host-changed', handleHostChanged);
      socket.off('user-typing', handleUserTyping);
      socket.off('action-error', handleActionError);
    };
  }, [socket, isHost]);

  const getCurrentUserName = () => {
    return currentUser?.name || 'You';
  };

  const addNotification = (message: string) => {
    setNotifications(prev => [...prev, message]);
    setTimeout(() => {
      setNotifications(prev => prev.slice(1));
    }, 5000);
  };

  const handleSendMessage = (message: string) => {
    if (socket && isConnected) {
      socket.emit('send-message', { message });
    }
  };

  const handleTypingStart = () => {
    if (socket && isConnected) {
      socket.emit('typing-start');
    }
  };

  const handleTypingStop = () => {
    if (socket && isConnected) {
      socket.emit('typing-stop');
    }
  };

  const handleTrackSelect = (track: Track) => {
    if (isHost && socket && isConnected) {
      socket.emit('track-update', { track });
      setCurrentTrack(track);
    }
  };

  const handlePlaybackChange = (isPlaying: boolean, position: number) => {
    if (isHost && socket && isConnected) {
      socket.emit('playback-state', { isPlaying, position });
      setIsPlaying(isPlaying);
      setPosition(position);
    }
  };

  const requestSync = () => {
    if (socket && isConnected) {
      socket.emit('request-sync');
    }
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(room.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative">
      <div className="absolute inset-0 bg-black/20"></div>
      
      {/* Connection Status */}
      <ConnectionStatus
        isConnected={isConnected}
        isConnecting={false}
        error={isConnected ? null : 'Connection lost'}
        onReconnect={onReconnect}
      />

      {/* Notifications */}
      <div className="fixed top-4 left-4 z-40 space-y-2">
        {notifications.map((notification, index) => (
          <div
            key={index}
            className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-lg p-3 text-white text-sm max-w-sm animate-fade-in"
          >
            {notification}
          </div>
        ))}
      </div>
      
      <div className="relative z-10 flex flex-col h-screen">
        {/* Enhanced Header */}
        <div className="bg-white/10 backdrop-blur-lg border-b border-white/20">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-2 rounded-lg">
                  <Music className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white flex items-center space-x-2">
                    <span>Room {room.id}</span>
                    {!isConnected && (
                      <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                    )}
                  </h1>
                  <div className="flex items-center space-x-4 text-sm text-gray-300">
                    <span>Host: {room.hostName}</span>
                    {isHost && (
                      <span className="bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded text-xs">
                        You're the host
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {/* User Profile */}
                {currentUser && (
                  <div className="flex items-center space-x-2 bg-white/10 rounded-lg px-3 py-2">
                    <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-medium text-xs">
                        {getInitials(currentUser.name)}
                      </span>
                    </div>
                    <span className="text-white text-sm hidden sm:inline">{currentUser.name}</span>
                  </div>
                )}
                
                <button
                  onClick={copyRoomCode}
                  className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg text-white transition-colors"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span className="hidden sm:inline">{copied ? 'Copied!' : 'Copy Code'}</span>
                </button>
                
                <button
                  onClick={() => setShowMembers(!showMembers)}
                  className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg text-white transition-colors"
                >
                  <Users className="w-4 h-4" />
                  <span>{room.users.length}</span>
                </button>
                
                <button
                  onClick={() => setShowChat(!showChat)}
                  className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg text-white transition-colors md:hidden"
                >
                  <MessageCircle className="w-4 h-4" />
                </button>
                
                <button
                  onClick={onLogout}
                  className="bg-gray-500 hover:bg-gray-600 px-3 py-2 rounded-lg text-white transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
                
                <button
                  onClick={onLeaveRoom}
                  className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg text-white transition-colors font-medium"
                >
                  Leave
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Music Player */}
          <div className="flex-1 flex flex-col">
            <MusicPlayer
              currentTrack={currentTrack}
              isPlaying={isPlaying}
              position={position}
              isHost={isHost}
              isConnected={isConnected}
              onTrackSelect={handleTrackSelect}
              onPlaybackChange={handlePlaybackChange}
            />
          </div>

          {/* Chat Panel */}
          <div className={`${showChat ? 'flex' : 'hidden'} md:flex w-full md:w-80 lg:w-96 bg-white/5 backdrop-blur-sm border-l border-white/20`}>
            <ChatPanel
              messages={messages}
              currentUserId={currentUserId}
              typingUsers={typingUsers}
              onSendMessage={handleSendMessage}
              onTypingStart={handleTypingStart}
              onTypingStop={handleTypingStop}
            />
          </div>
        </div>

        {/* Members Modal */}
        {showMembers && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 max-w-md w-full border border-white/20 max-h-[80vh] overflow-y-auto">
              <MembersList
                users={room.users}
                hostId={room.hostId}
                currentUserId={currentUserId}
                onClose={() => setShowMembers(false)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Room;