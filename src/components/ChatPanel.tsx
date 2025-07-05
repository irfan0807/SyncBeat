import React, { useState, useRef, useEffect } from 'react';
import { Message } from '../types';
import { Send, MessageCircle } from 'lucide-react';
import TypingIndicator from './TypingIndicator';

interface ChatPanelProps {
  messages: Message[];
  currentUserId: string;
  typingUsers: string[];
  onSendMessage: (message: string) => void;
  onTypingStart: () => void;
  onTypingStop: () => void;
}

const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  currentUserId,
  typingUsers,
  onSendMessage,
  onTypingStart,
  onTypingStop,
}) => {
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Handle typing indicator cleanup
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (isTyping) {
        onTypingStop();
      }
    };
  }, [isTyping, onTypingStop]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewMessage(value);

    // Handle typing indicators
    if (value.trim() && !isTyping) {
      setIsTyping(true);
      onTypingStart();
    } else if (!value.trim() && isTyping) {
      setIsTyping(false);
      onTypingStop();
    }

    // Reset typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (value.trim()) {
      typingTimeoutRef.current = setTimeout(() => {
        if (isTyping) {
          setIsTyping(false);
          onTypingStop();
        }
      }, 2000);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedMessage = newMessage.trim();
    
    if (trimmedMessage) {
      onSendMessage(trimmedMessage);
      setNewMessage('');
      
      // Stop typing indicator
      if (isTyping) {
        setIsTyping(false);
        onTypingStop();
      }
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) {
      return 'now';
    } else if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffMins < 1440) {
      const hours = Math.floor(diffMins / 60);
      return `${hours}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const groupedMessages = messages.reduce((groups: Message[][], message, index) => {
    const prevMessage = messages[index - 1];
    const shouldGroup = prevMessage && 
      prevMessage.userId === message.userId &&
      (message.timestamp - prevMessage.timestamp) < 300000; // 5 minutes

    if (shouldGroup) {
      groups[groups.length - 1].push(message);
    } else {
      groups.push([message]);
    }

    return groups;
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="p-4 border-b border-white/20 bg-white/5">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-2 rounded-lg">
            <MessageCircle className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-white font-medium">Live Chat</h3>
            <p className="text-gray-400 text-sm">
              {messages.length} {messages.length === 1 ? 'message' : 'messages'}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {messages.length === 0 ? (
          <div className="text-center text-gray-400 py-12">
            <div className="bg-white/5 rounded-2xl p-8">
              <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-500" />
              <p className="text-lg font-medium mb-2">No messages yet</p>
              <p className="text-sm text-gray-500">Start the conversation!</p>
            </div>
          </div>
        ) : (
          groupedMessages.map((messageGroup, groupIndex) => {
            const firstMessage = messageGroup[0];
            const isOwn = firstMessage.userId === currentUserId;
            
            return (
              <div
                key={`group-${groupIndex}`}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-xs lg:max-w-md space-y-1`}>
                  {!isOwn && (
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                        <span className="text-xs text-white font-medium">
                          {firstMessage.userName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <p className="text-xs text-gray-300 font-medium">
                        {firstMessage.userName}
                      </p>
                    </div>
                  )}
                  
                  {messageGroup.map((message, index) => (
                    <div
                      key={message.id}
                      className={`px-4 py-2 rounded-2xl ${
                        isOwn
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white ml-8'
                          : 'bg-white/10 text-white mr-8'
                      } ${
                        index === 0 ? '' : isOwn ? 'rounded-tr-md' : 'rounded-tl-md'
                      } ${
                        index === messageGroup.length - 1 ? '' : isOwn ? 'rounded-br-md' : 'rounded-bl-md'
                      }`}
                    >
                      <p className="text-sm leading-relaxed">{message.message}</p>
                      {index === messageGroup.length - 1 && (
                        <div className="flex items-center justify-between mt-1">
                          <p className={`text-xs ${
                            isOwn ? 'text-purple-100' : 'text-gray-400'
                          }`}>
                            {formatTime(message.timestamp)}
                          </p>
                          {message.delivered && isOwn && (
                            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
        
        <TypingIndicator typingUsers={typingUsers} />
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-white/20 bg-white/5">
        <div className="flex space-x-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={newMessage}
              onChange={handleInputChange}
              placeholder="Type a message..."
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              maxLength={500}
            />
            <div className="absolute right-3 top-3 text-gray-400 text-xs">
              {newMessage.length}/500
            </div>
          </div>
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-500 disabled:to-gray-600 p-3 rounded-xl transition-all duration-200 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed shadow-lg"
          >
            <Send className="w-5 h-5 text-white" />
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatPanel;