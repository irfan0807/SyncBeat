import React, { useState } from 'react';
import { User, Mail, LogIn } from 'lucide-react';

interface AuthProps {
  onAuth: (userData: { name: string; email?: string }) => void;
  isLoading: boolean;
}

const Auth: React.FC<AuthProps> = ({ onAuth, isLoading }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [showEmail, setShowEmail] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onAuth({
        name: name.trim(),
        email: email.trim() || undefined
      });
    }
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
      
      <div className="relative z-10 max-w-md w-full animate-fade-in">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4 rounded-full shadow-2xl">
              <User className="w-12 h-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">
            Welcome to Sync<span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Play</span>
          </h1>
          <p className="text-gray-300 text-lg leading-relaxed">
            Create your profile to start listening with friends
          </p>
        </div>

        <form onSubmit={handleSubmit} className="glass rounded-2xl p-8 shadow-2xl border border-white/20 backdrop-blur-lg">
          <div className="space-y-6">
            <div>
              <label className="block text-white font-medium mb-2">
                Display Name *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 pl-10 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  placeholder="Enter your name"
                  maxLength={30}
                  required
                  disabled={isLoading}
                />
                <User className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
              </div>
              <p className="text-gray-400 text-xs mt-1">
                This name will be visible to other users in rooms
              </p>
            </div>

            {showEmail && (
              <div className="animate-fade-in">
                <label className="block text-white font-medium mb-2">
                  Email (Optional)
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 pl-10 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    placeholder="your@email.com"
                    disabled={isLoading}
                  />
                  <Mail className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                </div>
                <p className="text-gray-400 text-xs mt-1">
                  For account recovery and notifications
                </p>
              </div>
            )}

            {!showEmail && (
              <button
                type="button"
                onClick={() => setShowEmail(true)}
                className="text-purple-400 hover:text-purple-300 text-sm underline transition-colors"
              >
                Add email (optional)
              </button>
            )}

            <button
              onSubmit={handleSubmit}
              disabled={!name.trim() || isLoading}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-500 disabled:to-gray-600 text-white font-medium py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed shadow-lg"
            >
              <div className="flex items-center justify-center space-x-2">
                {isLoading ? (
                  <>
                    <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                    <span>Creating Profile...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-5 h-5" />
                    <span>Continue to SyncPlay</span>
                  </>
                )}
              </div>
            </button>
          </div>
        </form>

        <div className="text-center mt-6">
          <p className="text-gray-400 text-sm">
            By continuing, you agree to our terms of service and privacy policy
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;