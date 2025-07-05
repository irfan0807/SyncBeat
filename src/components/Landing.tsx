import React, { useState } from 'react';
import { Music, Users, MessageCircle, Play, Wifi, WifiOff, LogOut, User } from 'lucide-react';
import { User as UserType } from '../types';

interface LandingProps {
  currentUser: UserType;
  onCreateRoom: (userName: string) => void;
  onJoinRoom: (roomId: string, userName: string) => void;
  onLogout: () => void;
  isConnected: boolean;
  isLoading: boolean;
}

const Landing: React.FC<LandingProps> = ({ 
  currentUser,
  onCreateRoom, 
  onJoinRoom, 
  onLogout,
  isConnected, 
  isLoading 
}) => {
  const [roomId, setRoomId] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  const handleCreateRoom = () => {
    if (isConnected) {
      onCreateRoom(currentUser.name);
    }
  };

  const handleJoinRoom = () => {
    if (roomId.trim() && isConnected) {
      onJoinRoom(roomId.trim().toUpperCase(), currentUser.name);
    }
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
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-pink-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>
      
      <div className="absolute inset-0 bg-black/20"></div>
      
      {/* User Profile & Connection Status */}
      <div className="absolute top-4 right-4 flex items-center space-x-4">
        {/* Connection Status */}
        <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-lg rounded-lg px-3 py-2 border border-white/20">
          {isConnected ? (
            <>
              <Wifi className="w-4 h-4 text-green-400" />
              <span className="text-green-300 text-sm">Connected</span>
            </>
          ) : (
            <>
              <WifiOff className="w-4 h-4 text-red-400" />
              <span className="text-red-300 text-sm">Disconnected</span>
            </>
          )}
        </div>

        {/* User Profile */}
        <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-lg rounded-lg px-4 py-2 border border-white/20">
          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
            <span className="text-white font-medium text-sm">
              {getInitials(currentUser.name)}
            </span>
          </div>
          <div className="hidden sm:block">
            <p className="text-white font-medium text-sm">{currentUser.name}</p>
            <p className="text-gray-400 text-xs">Online</p>
          </div>
          <button
            onClick={onLogout}
            className="text-gray-400 hover:text-white transition-colors p-1"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <div className="relative z-10 max-w-md w-full animate-fade-in">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4 rounded-full shadow-2xl">
              <Music className="w-12 h-12 text-white" />
            </div>
          </div>
          <h1 className="text-5xl font-bold text-white mb-3">
            Sync<span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Play</span>
          </h1>
          <p className="text-gray-300 text-xl leading-relaxed">
            Listen to music together with friends in perfect sync
          </p>
          <div className="mt-4 bg-white/10 backdrop-blur-lg rounded-lg px-4 py-2 inline-block">
            <p className="text-white text-sm">
              Welcome back, <span className="font-medium text-purple-300">{currentUser.name}</span>!
            </p>
          </div>
        </div>

        <div className="glass rounded-2xl p-8 shadow-2xl border border-white/20 backdrop-blur-lg">
          <div className="space-y-6">
            <button
              onClick={handleCreateRoom}
              disabled={!isConnected || isLoading}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-500 disabled:to-gray-600 text-white font-medium py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed shadow-lg"
            >
              <div className="flex items-center justify-center space-x-2">
                {isLoading ? (
                  <>
                    <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                    <span>Creating Room...</span>
                  </>
                ) : (
                  <>
                    <Users className="w-5 h-5" />
                    <span>Create New Room</span>
                  </>
                )}
              </div>
            </button>

            <div className="text-center">
              <span className="text-gray-400 bg-white/5 px-4 py-1 rounded-full text-sm">or</span>
            </div>

            <button
              onClick={() => setIsJoining(!isJoining)}
              disabled={isLoading}
              className="w-full bg-white/10 hover:bg-white/20 text-white font-medium py-4 px-6 rounded-xl transition-all duration-200 border border-white/20 hover:border-white/40 disabled:opacity-50"
            >
              <div className="flex items-center justify-center space-x-2">
                <Play className="w-5 h-5" />
                <span>Join Existing Room</span>
              </div>
            </button>

            {isJoining && (
              <div className="space-y-4 mt-4 animate-fade-in">
                <input
                  type="text"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  placeholder="Enter room code (e.g. ABC123)"
                  maxLength={6}
                  disabled={isLoading}
                />
                <button
                  onClick={handleJoinRoom}
                  disabled={!roomId.trim() || !isConnected || isLoading}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 disabled:from-gray-500 disabled:to-gray-600 text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                      <span>Joining...</span>
                    </div>
                  ) : (
                    'Join Room'
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="text-center mt-8">
          <div className="flex items-center justify-center space-x-8 text-gray-400">
            <div className="flex items-center space-x-2 group">
              <Music className="w-5 h-5 group-hover:text-purple-400 transition-colors" />
              <span>Sync Music</span>
            </div>
            <div className="flex items-center space-x-2 group">
              <MessageCircle className="w-5 h-5 group-hover:text-purple-400 transition-colors" />
              <span>Live Chat</span>
            </div>
          </div>
          
          <p className="text-gray-500 text-sm mt-4">
            Create or join a room to start listening together
          </p>
        </div>
      </div>
    </div>
  );
};

export default Landing;