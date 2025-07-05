import React from 'react';
import { Wifi, WifiOff, AlertCircle } from 'lucide-react';

interface ConnectionStatusProps {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  onReconnect: () => void;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  isConnected,
  isConnecting,
  error,
  onReconnect
}) => {
  if (isConnected) {
    return null; // Don't show anything when connected
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-4 shadow-lg">
        <div className="flex items-center space-x-3">
          {isConnecting ? (
            <div className="animate-spin">
              <Wifi className="w-5 h-5 text-yellow-400" />
            </div>
          ) : error ? (
            <AlertCircle className="w-5 h-5 text-red-400" />
          ) : (
            <WifiOff className="w-5 h-5 text-red-400" />
          )}
          
          <div className="flex-1">
            <p className="text-white font-medium text-sm">
              {isConnecting
                ? 'Connecting...'
                : error
                ? 'Connection Error'
                : 'Disconnected'
              }
            </p>
            {error && (
              <p className="text-gray-300 text-xs mt-1">{error}</p>
            )}
          </div>
          
          {!isConnecting && (
            <button
              onClick={onReconnect}
              className="bg-blue-500 hover:bg-blue-600 px-3 py-1 rounded text-white text-xs font-medium transition-colors"
            >
              Retry
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConnectionStatus;