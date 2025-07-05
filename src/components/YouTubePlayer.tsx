import React, { useEffect, useRef, useState } from 'react';
import { Track } from '../types';

interface YouTubePlayerProps {
  track: Track | null;
  isPlaying: boolean;
  position: number;
  volume: number;
  onReady: () => void;
  onStateChange: (state: number) => void;
  onTimeUpdate: (currentTime: number) => void;
  onError: (error: any) => void;
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

const YouTubePlayer: React.FC<YouTubePlayerProps> = ({
  track,
  isPlaying,
  position,
  volume,
  onReady,
  onStateChange,
  onTimeUpdate,
  onError
}) => {
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isAPIReady, setIsAPIReady] = useState(false);
  const timeUpdateIntervalRef = useRef<NodeJS.Timeout>();

  // Load YouTube IFrame API
  useEffect(() => {
    if (window.YT && window.YT.Player) {
      setIsAPIReady(true);
      return;
    }

    // Load the YouTube IFrame API
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

    window.onYouTubeIframeAPIReady = () => {
      setIsAPIReady(true);
    };
  }, []);

  // Initialize player when API is ready
  useEffect(() => {
    if (!isAPIReady || !containerRef.current) return;

    playerRef.current = new window.YT.Player(containerRef.current, {
      height: '0',
      width: '0',
      playerVars: {
        autoplay: 0,
        controls: 0,
        disablekb: 1,
        enablejsapi: 1,
        fs: 0,
        iv_load_policy: 3,
        modestbranding: 1,
        playsinline: 1,
        rel: 0,
        showinfo: 0
      },
      events: {
        onReady: (event: any) => {
          console.log('YouTube player ready');
          onReady();
        },
        onStateChange: (event: any) => {
          onStateChange(event.data);
          
          // Start time updates when playing
          if (event.data === window.YT.PlayerState.PLAYING) {
            timeUpdateIntervalRef.current = setInterval(() => {
              if (playerRef.current && playerRef.current.getCurrentTime) {
                const currentTime = playerRef.current.getCurrentTime() * 1000;
                onTimeUpdate(currentTime);
              }
            }, 1000);
          } else {
            if (timeUpdateIntervalRef.current) {
              clearInterval(timeUpdateIntervalRef.current);
            }
          }
        },
        onError: (event: any) => {
          console.error('YouTube player error:', event.data);
          onError(event.data);
        }
      }
    });

    return () => {
      if (timeUpdateIntervalRef.current) {
        clearInterval(timeUpdateIntervalRef.current);
      }
      if (playerRef.current && playerRef.current.destroy) {
        playerRef.current.destroy();
      }
    };
  }, [isAPIReady, onReady, onStateChange, onTimeUpdate, onError]);

  // Handle track changes
  useEffect(() => {
    if (!playerRef.current || !track?.youtube_id) return;

    try {
      playerRef.current.loadVideoById({
        videoId: track.youtube_id,
        startSeconds: position / 1000
      });
    } catch (error) {
      console.error('Error loading video:', error);
    }
  }, [track?.youtube_id]);

  // Handle play/pause changes
  useEffect(() => {
    if (!playerRef.current) return;

    try {
      if (isPlaying) {
        playerRef.current.playVideo();
      } else {
        playerRef.current.pauseVideo();
      }
    } catch (error) {
      console.error('Error controlling playback:', error);
    }
  }, [isPlaying]);

  // Handle position changes (seeking)
  useEffect(() => {
    if (!playerRef.current || !track) return;

    try {
      const currentTime = playerRef.current.getCurrentTime() * 1000;
      const timeDiff = Math.abs(currentTime - position);
      
      // Only seek if the difference is significant (more than 2 seconds)
      if (timeDiff > 2000) {
        playerRef.current.seekTo(position / 1000, true);
      }
    } catch (error) {
      console.error('Error seeking:', error);
    }
  }, [position, track]);

  // Handle volume changes
  useEffect(() => {
    if (!playerRef.current) return;

    try {
      playerRef.current.setVolume(volume * 100);
    } catch (error) {
      console.error('Error setting volume:', error);
    }
  }, [volume]);

  return <div ref={containerRef} style={{ display: 'none' }} />;
};

export default YouTubePlayer;