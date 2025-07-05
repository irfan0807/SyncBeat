# SyncPlay - Listen Together

A real-time music listening app that allows friends to listen to YouTube music together in perfect sync. Built with React, Node.js, WebSockets, and YouTube API.

## Features

- 🎵 **YouTube Integration**: Search and play music from YouTube
- 🔄 **Real-time Sync**: Perfect synchronization across all users
- 💬 **Live Chat**: Chat with friends while listening
- 👥 **Room Management**: Create and join listening rooms
- 🎛️ **Host Controls**: Room host controls playback for everyone
- 📱 **Responsive Design**: Works on desktop and mobile
- 🔐 **User Profiles**: Persistent user accounts with Supabase
- 🎨 **Beautiful UI**: Modern glassmorphism design

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express, Socket.IO
- **Database**: Supabase (PostgreSQL)
- **Music**: YouTube Data API v3, YouTube IFrame Player API
- **Real-time**: WebSockets via Socket.IO

## Setup Instructions

### 1. Clone and Install

```bash
git clone <repository-url>
cd syncplay-music-app
npm install
```

### 2. YouTube API Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable YouTube Data API v3
4. Create credentials (API Key)
5. Copy your API key

### 3. Supabase Setup

1. Go to [Supabase](https://supabase.com) and create a new project
2. Copy your project URL and anon key
3. The database schema will be automatically created

### 4. Environment Variables

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_YOUTUBE_API_KEY=your_youtube_api_key
```

### 5. Run the Application

```bash
# Start the backend server
npm run server

# In another terminal, start the frontend
npm run dev
```

The app will be available at:
- Frontend: http://localhost:5173
- Backend: http://localhost:3001

## How to Use

1. **Create Profile**: Enter your name to create a user profile
2. **Create Room**: Click "Create New Room" to start a listening session
3. **Invite Friends**: Share the room code with friends
4. **Search Music**: Use the search bar to find YouTube videos
5. **Control Playback**: Host can play, pause, and seek tracks
6. **Chat**: Use the chat panel to talk with friends
7. **Sync**: All users hear the same audio at the same time

## Features in Detail

### YouTube Integration
- Search YouTube's music catalog
- Browse popular/trending music
- High-quality audio playback
- Automatic artist/song detection from video titles

### Real-time Synchronization
- WebSocket-based communication
- Latency compensation
- Automatic reconnection
- Position sync for late joiners

### Room Management
- Unique room codes
- Host privileges
- Member list with online status
- Automatic host transfer

### Chat System
- Real-time messaging
- Typing indicators
- Message history
- User avatars

### Database Persistence
- User profiles and preferences
- Room history and settings
- Chat message storage
- Playback state recovery

## API Limits

- YouTube Data API: 10,000 units/day (free tier)
- Each search costs ~100 units
- Each video detail fetch costs ~1 unit
- Monitor usage in Google Cloud Console

## Browser Compatibility

- Chrome/Chromium (recommended)
- Firefox
- Safari
- Edge

Note: YouTube IFrame API works best in Chrome/Chromium browsers.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions:
1. Check the GitHub issues
2. Create a new issue with detailed description
3. Include browser console logs if applicable

---

Built with ❤️ for music lovers who want to listen together!