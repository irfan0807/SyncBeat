import React, { useState, useRef, useEffect } from 'react';
import { Track } from '../types';
import { Play, Pause, Search, Volume2, SkipBack, SkipForward, Music, Shuffle, Repeat, TrendingUp } from 'lucide-react';
import { useYouTube } from '../hooks/useYouTube';
import YouTubePlayer from './YouTubePlayer';

interface MusicPlayerProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  position: number;
  isHost: boolean;
  isConnected: boolean;
  onTrackSelect: (track: Track) => void;
  onPlaybackChange: (isPlaying: boolean, position: number) => void;
}

const MusicPlayer: React.FC<MusicPlayerProps> = ({
  currentTrack,
  isPlaying,
  position,
  isHost,
  isConnected,
  onTrackSelect,
  onPlaybackChange,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [popularTracks, setPopularTracks] = useState<Track[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [showPopular, setShowPopular] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);
  const [playerState, setPlayerState] = useState(-1);
  
  const { searchTracks, getPopularTracks } = useYouTube();

  // Load popular tracks on component mount
  useEffect(() => {
    const loadPopularTracks = async () => {
      const tracks = await getPopularTracks();
      setPopularTracks(tracks);
    };
    
    if (isHost) {
      loadPopularTracks();
    }
  }, [isHost, getPopularTracks]);

  const handleSearch = async () => {
    if (!searchQuery.trim() || !isHost) return;
    
    setIsSearching(true);
    try {
      const results = await searchTracks(searchQuery);
      setSearchResults(results);
      setShowPopular(false);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleTrackSelect = (track: Track) => {
    onTrackSelect(track);
    setSearchResults([]);
    setSearchQuery('');
    setShowPopular(false);
  };

  const handlePlayPause = () => {
    if (!isHost || !isConnected || !currentTrack) return;
    onPlaybackChange(!isPlaying, position);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isHost || !currentTrack) return;
    
    const newPosition = parseInt(e.target.value);
    onPlaybackChange(isPlaying, newPosition);
  };

  const handlePlayerReady = () => {
    setPlayerReady(true);
  };

  const handlePlayerStateChange = (state: number) => {
    setPlayerState(state);
    
    // YouTube Player States:
    // -1: unstarted, 0: ended, 1: playing, 2: paused, 3: buffering, 5: cued
    if (isHost && currentTrack) {
      const newIsPlaying = state === 1; // YT.PlayerState.PLAYING
      if (newIsPlaying !== isPlaying) {
        onPlaybackChange(newIsPlaying, position);
      }
    }
  };

  const handleTimeUpdate = (currentTime: number) => {
    // Only update position if we're the host and not seeking
    if (isHost && Math.abs(currentTime - position) > 2000) {
      onPlaybackChange(isPlaying, currentTime);
    }
  };

  const handlePlayerError = (error: any) => {
    console.error('YouTube player error:', error);
    // Handle different error codes
    switch (error) {
      case 2:
        console.error('Invalid video ID');
        break;
      case 5:
        console.error('HTML5 player error');
        break;
      case 100:
        console.error('Video not found or private');
        break;
      case 101:
      case 150:
        console.error('Video not allowed to be played in embedded players');
        break;
    }
  };

  const formatTime = (milliseconds: number) => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const showPopularTracks = () => {
    setShowPopular(true);
    setSearchResults([]);
    setSearchQuery('');
  };

  return (
    <div className="flex flex-col h-full">
      {/* YouTube Player (Hidden) */}
      {currentTrack?.youtube_id && (
        <YouTubePlayer
          track={currentTrack}
          isPlaying={isPlaying}
          position={position}
          volume={volume}
          onReady={handlePlayerReady}
          onStateChange={handlePlayerStateChange}
          onTimeUpdate={handleTimeUpdate}
          onError={handlePlayerError}
        />
      )}

      {/* Search Section - Only for host */}
      {isHost && (
        <div className="p-6 border-b border-white/20 bg-white/5">
          <div className="flex items-center space-x-4 mb-4">
            <div className="flex-1 relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search YouTube for music..."
                className="w-full px-4 py-3 pl-10 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                disabled={!isConnected}
              />
              <Search className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
            </div>
            <button
              onClick={handleSearch}
              disabled={!searchQuery.trim() || isSearching || !isConnected}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-500 disabled:to-gray-600 px-6 py-3 rounded-xl text-white font-medium transition-all disabled:cursor-not-allowed"
            >
              {isSearching ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                  <span>Searching...</span>
                </div>
              ) : (
                'Search'
              )}
            </button>
            <button
              onClick={showPopularTracks}
              disabled={!isConnected}
              className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 disabled:from-gray-500 disabled:to-gray-600 px-4 py-3 rounded-xl text-white font-medium transition-all disabled:cursor-not-allowed"
              title="Popular tracks"
            >
              <TrendingUp className="w-4 h-4" />
            </button>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="bg-white/5 rounded-xl p-4 max-h-60 overflow-y-auto custom-scrollbar">
              <h3 className="text-white font-medium mb-3 flex items-center space-x-2">
                <Music className="w-4 h-4" />
                <span>Search Results ({searchResults.length})</span>
              </h3>
              <div className="space-y-2">
                {searchResults.map((track) => (
                  <button
                    key={track.id}
                    onClick={() => handleTrackSelect(track)}
                    className="w-full flex items-center space-x-3 p-3 bg-white/10 hover:bg-white/20 rounded-lg transition-all text-left group"
                  >
                    <img
                      src={track.image}
                      alt={track.name}
                      className="w-12 h-12 rounded-lg object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">{track.name}</p>
                      <p className="text-gray-300 text-sm truncate">{track.artist}</p>
                      <p className="text-gray-400 text-xs">YouTube</p>
                    </div>
                    <div className="text-right">
                      <span className="text-gray-400 text-sm">
                        {formatTime(track.duration)}
                      </span>
                      <div className="w-2 h-2 bg-red-500 rounded-full mt-1 ml-auto opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Popular Tracks */}
          {showPopular && popularTracks.length > 0 && (
            <div className="bg-white/5 rounded-xl p-4 max-h-60 overflow-y-auto custom-scrollbar">
              <h3 className="text-white font-medium mb-3 flex items-center space-x-2">
                <TrendingUp className="w-4 h-4" />
                <span>Popular Music ({popularTracks.length})</span>
              </h3>
              <div className="space-y-2">
                {popularTracks.map((track) => (
                  <button
                    key={track.id}
                    onClick={() => handleTrackSelect(track)}
                    className="w-full flex items-center space-x-3 p-3 bg-white/10 hover:bg-white/20 rounded-lg transition-all text-left group"
                  >
                    <img
                      src={track.image}
                      alt={track.name}
                      className="w-12 h-12 rounded-lg object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">{track.name}</p>
                      <p className="text-gray-300 text-sm truncate">{track.artist}</p>
                      <p className="text-gray-400 text-xs">YouTube</p>
                    </div>
                    <div className="text-right">
                      <span className="text-gray-400 text-sm">
                        {formatTime(track.duration)}
                      </span>
                      <div className="w-2 h-2 bg-red-500 rounded-full mt-1 ml-auto opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Player Section */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        {currentTrack ? (
          <div className="text-center max-w-md w-full">
            {/* Album Art */}
            <div className="mb-8 relative group">
              <img
                src={currentTrack.image}
                alt={currentTrack.name}
                className="w-64 h-64 rounded-2xl shadow-2xl mx-auto object-cover transition-transform group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                {isHost && (
                  <div className="flex space-x-4">
                    <button className="bg-white/20 p-3 rounded-full hover:bg-white/30 transition-colors">
                      <Shuffle className="w-5 h-5 text-white" />
                    </button>
                    <button className="bg-white/20 p-3 rounded-full hover:bg-white/30 transition-colors">
                      <Repeat className="w-5 h-5 text-white" />
                    </button>
                  </div>
                )}
              </div>
              
              {/* Now Playing Indicator */}
              <div className="absolute -top-2 -right-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                <span>{isPlaying ? 'Playing' : 'Paused'}</span>
              </div>
            </div>

            {/* Track Info */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-2 truncate">{currentTrack.name}</h2>
              <p className="text-gray-300 text-lg truncate">{currentTrack.artist}</p>
              <div className="flex items-center justify-center space-x-2 mt-2">
                <div className="w-4 h-4 bg-red-500 rounded-sm flex items-center justify-center">
                  <span className="text-white text-xs font-bold">YT</span>
                </div>
                <p className="text-gray-400 text-sm">YouTube</p>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center space-x-6 mb-6">
              <button 
                className="text-white hover:text-purple-400 transition-colors disabled:opacity-50"
                disabled={!isHost || !isConnected}
              >
                <SkipBack className="w-6 h-6" />
              </button>
              
              {isHost && (
                <button
                  onClick={handlePlayPause}
                  disabled={!isConnected || !playerReady}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-500 disabled:to-gray-600 p-4 rounded-full transition-all duration-200 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed shadow-lg"
                >
                  {isPlaying ? (
                    <Pause className="w-8 h-8 text-white" />
                  ) : (
                    <Play className="w-8 h-8 text-white ml-1" />
                  )}
                </button>
              )}
              
              <button 
                className="text-white hover:text-purple-400 transition-colors disabled:opacity-50"
                disabled={!isHost || !isConnected}
              >
                <SkipForward className="w-6 h-6" />
              </button>
            </div>

            {/* Progress Bar */}
            <div className="w-full mb-4">
              <input
                type="range"
                min="0"
                max={currentTrack.duration}
                value={position}
                onChange={handleSeek}
                disabled={!isHost}
                className="w-full h-2 bg-white/20 rounded-lg appearance-none slider cursor-pointer disabled:cursor-not-allowed"
              />
            </div>

            {/* Time Display */}
            <div className="flex justify-between text-sm text-gray-400 mb-6">
              <span>{formatTime(position)}</span>
              <span>{formatTime(currentTrack.duration)}</span>
            </div>

            {/* Volume Control */}
            <div className="flex items-center justify-center space-x-3">
              <button
                onClick={() => setShowVolumeSlider(!showVolumeSlider)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <Volume2 className="w-5 h-5" />
              </button>
              
              {showVolumeSlider && (
                <div className="flex items-center space-x-3 bg-white/10 rounded-lg px-4 py-2">
                  <span className="text-white text-sm">{Math.round(volume * 100)}%</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={volume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    className="w-20 h-2 bg-white/20 rounded-lg appearance-none slider"
                  />
                </div>
              )}
            </div>

            {/* Connection Status for non-hosts */}
            {!isHost && !isConnected && (
              <div className="mt-4 bg-red-500/20 border border-red-500/30 rounded-lg p-3">
                <p className="text-red-300 text-sm">
                  Connection lost. Playback may be out of sync.
                </p>
              </div>
            )}

            {/* Player Status */}
            {!playerReady && currentTrack && (
              <div className="mt-4 bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-3">
                <p className="text-yellow-300 text-sm">
                  Loading YouTube player...
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center text-gray-400 max-w-md">
            <div className="bg-white/5 p-12 rounded-2xl border border-white/10">
              <Music className="w-16 h-16 mx-auto mb-4 text-gray-500" />
              <p className="text-xl font-medium mb-2">No track selected</p>
              {isHost ? (
                <div className="space-y-2">
                  <p className="text-gray-500">Search YouTube for music to get started</p>
                  <button
                    onClick={showPopularTracks}
                    className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 px-4 py-2 rounded-lg text-white text-sm font-medium transition-all"
                  >
                    Browse Popular Music
                  </button>
                </div>
              ) : (
                <p className="text-gray-500">Waiting for the host to select a track</p>
              )}
              
              {!isConnected && (
                <div className="mt-4 bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-3">
                  <p className="text-yellow-300 text-sm">
                    Connection lost. Some features may not work.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MusicPlayer;