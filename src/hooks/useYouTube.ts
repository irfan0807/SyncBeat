import { useState } from 'react';
import { Track } from '../types';

const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;

interface YouTubeSearchItem {
  id: { videoId: string };
  snippet: {
    title: string;
    channelTitle: string;
    thumbnails: {
      default?: { url: string };
      medium?: { url: string };
      high?: { url: string };
    };
  };
}

interface YouTubeVideo {
  id: string;
  snippet: {
    title: string;
    channelTitle: string;
    thumbnails: {
      default?: { url: string };
      medium?: { url: string };
      high?: { url: string };
    };
  };
  contentDetails: {
    duration: string;
  };
}

export const useYouTube = () => {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);

  // Convert YouTube duration format (PT4M13S) to milliseconds
  const parseDuration = (duration: string): number => {
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;
    
    const hours = parseInt(match[1] || '0');
    const minutes = parseInt(match[2] || '0');
    const seconds = parseInt(match[3] || '0');
    
    return (hours * 3600 + minutes * 60 + seconds) * 1000;
  };

  const searchTracks = async (query: string): Promise<Track[]> => {
    if (!YOUTUBE_API_KEY) {
      console.error('YouTube API key not configured');
      return [];
    }

    try {
      // Search for videos
      const searchResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/search?` +
        `part=snippet&type=video&videoCategoryId=10&maxResults=20&q=${encodeURIComponent(query)}&key=${YOUTUBE_API_KEY}`
      );

      if (!searchResponse.ok) throw new Error('Search failed');

      const searchData = await searchResponse.json();
      
      if (!searchData.items || searchData.items.length === 0) {
        return [];
      }

      // Get video details including duration
      const videoIds = searchData.items.map((item: YouTubeSearchItem) => item.id.videoId).join(',');
      const detailsResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?` +
        `part=contentDetails,snippet&id=${videoIds}&key=${YOUTUBE_API_KEY}`
      );

      if (!detailsResponse.ok) throw new Error('Details fetch failed');

      const detailsData = await detailsResponse.json();

      return detailsData.items.map((video: YouTubeVideo) => {
        const snippet = video.snippet;
        const duration = parseDuration(video.contentDetails.duration);
        
        // Extract artist and song name from title
        const title = snippet.title;
        let artist = snippet.channelTitle;
        let name = title;
        
        // Common patterns for music videos
        const patterns = [
          /^(.+?)\s*[-–—]\s*(.+?)(?:\s*\(.*\))?$/,  // Artist - Song
          /^(.+?)\s*:\s*(.+?)(?:\s*\(.*\))?$/,      // Artist: Song
          /^(.+?)\s*by\s*(.+?)(?:\s*\(.*\))?$/i,    // Song by Artist
        ];
        
        for (const pattern of patterns) {
          const match = title.match(pattern);
          if (match) {
            if (title.toLowerCase().includes(' by ')) {
              name = match[1].trim();
              artist = match[2].trim();
            } else {
              artist = match[1].trim();
              name = match[2].trim();
            }
            break;
          }
        }

        return {
          id: video.id,
          name: name.length > 60 ? name.substring(0, 60) + '...' : name,
          artist: artist.length > 40 ? artist.substring(0, 40) + '...' : artist,
          album: 'YouTube',
          image: snippet.thumbnails.high?.url || snippet.thumbnails.medium?.url || snippet.thumbnails.default?.url,
          duration,
          preview_url: `https://www.youtube.com/watch?v=${video.id}`,
          youtube_id: video.id
        };
      }).filter((track: Track) => track.duration > 30000 && track.duration < 600000); // Filter 30s to 10min
    } catch (error) {
      console.error('YouTube search error:', error);
      return [];
    }
  };

  const getPopularTracks = async (): Promise<Track[]> => {
    if (!YOUTUBE_API_KEY) return [];

    try {
      // Get popular music videos
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?` +
        `part=snippet,contentDetails&chart=mostPopular&videoCategoryId=10&maxResults=20&regionCode=US&key=${YOUTUBE_API_KEY}`
      );

      if (!response.ok) throw new Error('Popular tracks fetch failed');

      const data = await response.json();

      return data.items.map((video: YouTubeVideo) => {
        const snippet = video.snippet;
        const duration = parseDuration(video.contentDetails.duration);
        
        const title = snippet.title;
        let artist = snippet.channelTitle;
        let name = title;
        
        // Extract artist and song name
        const patterns = [
          /^(.+?)\s*[-–—]\s*(.+?)(?:\s*\(.*\))?$/,
          /^(.+?)\s*:\s*(.+?)(?:\s*\(.*\))?$/,
          /^(.+?)\s*by\s*(.+?)(?:\s*\(.*\))?$/i,
        ];
        
        for (const pattern of patterns) {
          const match = title.match(pattern);
          if (match) {
            if (title.toLowerCase().includes(' by ')) {
              name = match[1].trim();
              artist = match[2].trim();
            } else {
              artist = match[1].trim();
              name = match[2].trim();
            }
            break;
          }
        }

        return {
          id: video.id,
          name: name.length > 60 ? name.substring(0, 60) + '...' : name,
          artist: artist.length > 40 ? artist.substring(0, 40) + '...' : artist,
          album: 'YouTube',
          image: snippet.thumbnails.high?.url || snippet.thumbnails.medium?.url || snippet.thumbnails.default?.url,
          duration,
          preview_url: `https://www.youtube.com/watch?v=${video.id}`,
          youtube_id: video.id
        };
      }).filter((track: Track) => track.duration > 30000 && track.duration < 600000);
    } catch (error) {
      console.error('Error fetching popular tracks:', error);
      return [];
    }
  };

  return {
    currentTrack,
    isPlaying,
    position,
    searchTracks,
    getPopularTracks,
    setCurrentTrack,
    setIsPlaying,
    setPosition
  };
};