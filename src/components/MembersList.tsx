import React from 'react';
import { User } from '../types';
import { Crown, User as UserIcon, X, Wifi, WifiOff } from 'lucide-react';

interface MembersListProps {
  users: User[];
  hostId: string;
  currentUserId: string;
  onClose: () => void;
}

const MembersList: React.FC<MembersListProps> = ({ 
  users, 
  hostId, 
  currentUserId, 
  onClose 
}) => {
  const formatJoinTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just joined';
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarColor = (userId: string) => {
    const colors = [
      'from-blue-500 to-purple-500',
      'from-green-500 to-blue-500',
      'from-purple-500 to-pink-500',
      'from-yellow-500 to-orange-500',
      'from-red-500 to-pink-500',
      'from-indigo-500 to-blue-500',
    ];
    
    const index = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[index % colors.length];
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-white font-medium text-lg">Room Members</h3>
          <p className="text-gray-400 text-sm">
            {users.length} {users.length === 1 ? 'member' : 'members'} online
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
        {users
          .sort((a, b) => {
            // Host first, then by join time
            if (a.id === hostId) return -1;
            if (b.id === hostId) return 1;
            return (a.joinedAt || 0) - (b.joinedAt || 0);
          })
          .map((user) => {
            const isHost = user.id === hostId;
            const isCurrentUser = user.id === currentUserId;
            const isOnline = user.isOnline !== false; // Default to true if not specified

            return (
              <div
                key={user.id}
                className={`flex items-center space-x-3 p-3 rounded-lg transition-all ${
                  isCurrentUser 
                    ? 'bg-purple-500/20 border border-purple-500/30' 
                    : 'bg-white/10 hover:bg-white/15'
                }`}
              >
                <div className="flex-shrink-0 relative">
                  <div className={`w-10 h-10 bg-gradient-to-r ${getAvatarColor(user.id)} rounded-full flex items-center justify-center`}>
                    <span className="text-white font-medium text-sm">
                      {getInitials(user.name)}
                    </span>
                  </div>
                  
                  {/* Online status indicator */}
                  <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-gray-800 ${
                    isOnline ? 'bg-green-400' : 'bg-gray-400'
                  }`}></div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <p className="text-white font-medium truncate">
                      {user.name}
                      {isCurrentUser && (
                        <span className="text-purple-400 text-sm ml-1">(You)</span>
                      )}
                    </p>
                    {isHost && (
                      <Crown className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2 text-xs text-gray-400">
                    <span>{isHost ? 'Host' : 'Member'}</span>
                    {user.joinedAt && (
                      <>
                        <span>•</span>
                        <span>{formatJoinTime(user.joinedAt)}</span>
                      </>
                    )}
                  </div>
                  
                  {!isOnline && (
                    <div className="flex items-center space-x-1 text-xs text-gray-500 mt-1">
                      <WifiOff className="w-3 h-3" />
                      <span>Offline</span>
                    </div>
                  )}
                </div>

                {/* Connection status */}
                <div className="flex-shrink-0">
                  {isOnline ? (
                    <Wifi className="w-4 h-4 text-green-400" />
                  ) : (
                    <WifiOff className="w-4 h-4 text-gray-400" />
                  )}
                </div>
              </div>
            );
          })}
      </div>

      <div className="pt-4 border-t border-white/20">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="text-white font-medium">
              {users.filter(u => u.isOnline !== false).length}
            </p>
            <p className="text-gray-400 text-sm">Online</p>
          </div>
          <div>
            <p className="text-white font-medium">
              {users.filter(u => u.id === hostId).length ? '1' : '0'}
            </p>
            <p className="text-gray-400 text-sm">Host</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MembersList;