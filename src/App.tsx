import React, { useState, useEffect } from 'react';
import { useSocket } from './hooks/useSocket';
import { DatabaseService } from './services/database';
import { Room as RoomType, User, Message, Track } from './types';
import Auth from './components/Auth';
import Landing from './components/Landing';
import Room from './components/Room';

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentRoom, setCurrentRoom] = useState<RoomType | null>(null);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  
  const { socket, isConnected, isConnecting, error: connectionError, connect } = useSocket('http://localhost:3001');

  // Check for existing user session on app load
  useEffect(() => {
    const checkExistingSession = async () => {
      const storedUser = localStorage.getItem('syncplay_user');
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          const dbUser = await DatabaseService.getUser(userData.id);
          if (dbUser) {
            setCurrentUser({
              id: dbUser.id,
              name: dbUser.name,
              socketId: '',
              joinedAt: new Date(dbUser.created_at).getTime(),
              isOnline: true
            });
            
            // Update online status
            await DatabaseService.updateUserOnlineStatus(dbUser.id, true);
          } else {
            localStorage.removeItem('syncplay_user');
          }
        } catch (error) {
          console.error('Error checking existing session:', error);
          localStorage.removeItem('syncplay_user');
        }
      }
    };

    checkExistingSession();
  }, []);

  // Update user online status when connection changes
  useEffect(() => {
    if (currentUser) {
      DatabaseService.updateUserOnlineStatus(currentUser.id, isConnected);
    }
  }, [currentUser, isConnected]);

  useEffect(() => {
    if (!socket || !currentUser) return;

    const handleRoomCreated = async (data: { roomId: string; room: RoomType; user: User }) => {
      // Save room to database
      await DatabaseService.createRoom({
        id: data.roomId,
        name: `${currentUser.name}'s Room`,
        hostId: currentUser.id
      });

      setCurrentRoom(data.room);
      setError('');
      setIsLoading(false);
    };

    const handleRoomJoined = async (data: { room: RoomType; user: User }) => {
      // Add user to room in database
      await DatabaseService.addRoomMember(data.room.id, currentUser.id);
      
      // Load existing messages and playback state
      const messages = await DatabaseService.getRoomMessages(data.room.id);
      const playbackState = await DatabaseService.getPlaybackState(data.room.id);
      
      setCurrentRoom({
        ...data.room,
        messages,
        currentTrack: playbackState?.track || null,
        isPlaying: playbackState?.isPlaying || false,
        position: playbackState?.position || 0
      });
      setError('');
      setIsLoading(false);
    };

    const handleRoomError = (data: { message: string }) => {
      setError(data.message);
      setIsLoading(false);
    };

    const handleUserJoined = (data: { room: RoomType }) => {
      setCurrentRoom(data.room);
    };

    const handleUserLeft = (data: { room: RoomType }) => {
      setCurrentRoom(data.room);
    };

    const handleHostChanged = (data: { room: RoomType }) => {
      setCurrentRoom(data.room);
    };

    const handleNewMessage = async (message: Message & { roomId: string }) => {
      // Save message to database
      if (currentRoom) {
        await DatabaseService.saveMessage({
          roomId: currentRoom.id,
          userId: message.userId,
          content: message.message,
          messageType: message.type
        });
      }
    };

    const handleTrackChanged = async (data: { track: Track | null }) => {
      // Save playback state to database
      if (currentRoom) {
        await DatabaseService.savePlaybackState(
          currentRoom.id,
          data.track,
          false,
          0
        );
      }
    };

    const handlePlaybackSync = async (data: { isPlaying: boolean; position: number }) => {
      // Save playback state to database
      if (currentRoom) {
        await DatabaseService.savePlaybackState(
          currentRoom.id,
          currentRoom.currentTrack,
          data.isPlaying,
          data.position
        );
      }
    };

    const handleDisconnect = () => {
      setError('Connection lost. Attempting to reconnect...');
    };

    const handleReconnect = () => {
      setError('');
      if (currentRoom) {
        socket.emit('get-room-info');
      }
    };

    socket.on('room-created', handleRoomCreated);
    socket.on('room-joined', handleRoomJoined);
    socket.on('room-error', handleRoomError);
    socket.on('user-joined', handleUserJoined);
    socket.on('user-left', handleUserLeft);
    socket.on('host-changed', handleHostChanged);
    socket.on('new-message', handleNewMessage);
    socket.on('track-changed', handleTrackChanged);
    socket.on('playback-sync', handlePlaybackSync);
    socket.on('disconnect', handleDisconnect);
    socket.on('reconnect', handleReconnect);

    return () => {
      socket.off('room-created', handleRoomCreated);
      socket.off('room-joined', handleRoomJoined);
      socket.off('room-error', handleRoomError);
      socket.off('user-joined', handleUserJoined);
      socket.off('user-left', handleUserLeft);
      socket.off('host-changed', handleHostChanged);
      socket.off('new-message', handleNewMessage);
      socket.off('track-changed', handleTrackChanged);
      socket.off('playback-sync', handlePlaybackSync);
      socket.off('disconnect', handleDisconnect);
      socket.off('reconnect', handleReconnect);
    };
  }, [socket, currentUser, currentRoom]);

  const handleAuth = async (userData: { name: string; email?: string }) => {
    setIsAuthenticating(true);
    setError('');

    try {
      const dbUser = await DatabaseService.createUser(userData);
      if (dbUser) {
        const user: User = {
          id: dbUser.id,
          name: dbUser.name,
          socketId: '',
          joinedAt: new Date(dbUser.created_at).getTime(),
          isOnline: true
        };
        
        setCurrentUser(user);
        localStorage.setItem('syncplay_user', JSON.stringify(user));
      } else {
        setError('Failed to create user profile. Please try again.');
      }
    } catch (error) {
      console.error('Authentication error:', error);
      setError('Authentication failed. Please try again.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleCreateRoom = () => {
    if (socket && isConnected && currentUser) {
      setIsLoading(true);
      setError('');
      socket.emit('create-room', { userName: currentUser.name, userId: currentUser.id });
    } else {
      setError('Not connected to server. Please wait and try again.');
    }
  };

  const handleJoinRoom = async (roomId: string) => {
    if (socket && isConnected && currentUser) {
      // Check if room exists in database
      const room = await DatabaseService.getRoom(roomId);
      if (!room) {
        setError('Room not found or no longer active.');
        return;
      }

      setIsLoading(true);
      setError('');
      socket.emit('join-room', { roomId, userName: currentUser.name, userId: currentUser.id });
    } else {
      setError('Not connected to server. Please wait and try again.');
    }
  };

  const handleLeaveRoom = async () => {
    if (currentRoom && currentUser) {
      // Remove user from room in database
      await DatabaseService.removeRoomMember(currentRoom.id, currentUser.id);
      
      // If user was host and room is empty, deactivate room
      if (currentRoom.hostId === currentUser.id && currentRoom.users.length <= 1) {
        await DatabaseService.deactivateRoom(currentRoom.id);
      }
    }

    setCurrentRoom(null);
    setError('');
    setIsLoading(false);
    
    if (socket) {
      socket.disconnect();
      setTimeout(() => {
        connect();
      }, 1000);
    }
  };

  const handleReconnect = () => {
    connect();
    setError('');
  };

  const handleLogout = async () => {
    if (currentUser) {
      await DatabaseService.updateUserOnlineStatus(currentUser.id, false);
    }
    
    setCurrentUser(null);
    setCurrentRoom(null);
    localStorage.removeItem('syncplay_user');
    
    if (socket) {
      socket.disconnect();
    }
  };

  // Show loading screen while connecting initially
  if (isConnecting && !socket) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-lg">Connecting to SyncPlay...</p>
          <p className="text-gray-300 text-sm mt-2">Please wait while we establish connection</p>
        </div>
      </div>
    );
  }

  // Show authentication if no user
  if (!currentUser) {
    return <Auth onAuth={handleAuth} isLoading={isAuthenticating} />;
  }

  // Show current room if user is in one
  if (currentRoom && socket) {
    return (
      <Room
        socket={socket}
        room={currentRoom}
        currentUserId={currentUser.id}
        isConnected={isConnected}
        onLeaveRoom={handleLeaveRoom}
        onReconnect={handleReconnect}
        onLogout={handleLogout}
      />
    );
  }

  // Show landing page
  return (
    <div>
      <Landing 
        currentUser={currentUser}
        onCreateRoom={handleCreateRoom} 
        onJoinRoom={handleJoinRoom} 
        onLogout={handleLogout}
        isConnected={isConnected}
        isLoading={isLoading}
      />
      
      {/* Error Messages */}
      {(error || connectionError) && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 max-w-md w-full px-4">
          <div className="bg-red-500/90 backdrop-blur-sm border border-red-400 text-white px-6 py-4 rounded-xl shadow-lg">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-red-300 rounded-full animate-pulse"></div>
              <div>
                <p className="font-medium">{error || connectionError}</p>
                {connectionError && (
                  <button
                    onClick={handleReconnect}
                    className="text-red-200 hover:text-white text-sm underline mt-1"
                  >
                    Try reconnecting
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;