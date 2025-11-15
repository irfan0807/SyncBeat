# SyncBeat - Listen Together 🎵

[![CI/CD Pipeline](https://github.com/irfan0807/SyncBeat/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/irfan0807/SyncBeat/actions/workflows/ci-cd.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org)
[![Docker](https://img.shields.io/badge/docker-ready-blue)](https://www.docker.com/)

A production-grade, real-time music listening application that allows friends to listen to YouTube music together in perfect synchronization. Built with enterprise-level architecture and best practices.

## ✨ Features

### Core Features
- 🎵 **YouTube Integration**: Search and play music from YouTube's vast catalog
- 🔄 **Real-time Synchronization**: Perfect audio sync across all connected users
- 💬 **Live Chat**: Real-time messaging with typing indicators
- 👥 **Room Management**: Create and join listening rooms with unique codes
- 🎛️ **Host Controls**: Designated host controls playback for everyone
- 📱 **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- 🔐 **User Profiles**: Persistent user accounts with Supabase authentication
- 🎨 **Modern UI**: Beautiful glassmorphism design with smooth animations

### Production Features
- 🐳 **Docker Support**: Containerized deployment with Docker and Docker Compose
- 🔒 **Security**: Input validation, rate limiting, CORS protection, and sanitization
- 📊 **Monitoring**: Health checks, metrics, and comprehensive logging
- ⚡ **Performance**: Optimized builds, caching, and resource management
- 🔄 **CI/CD**: Automated testing, building, and deployment with GitHub Actions
- 📚 **Documentation**: Complete API documentation and deployment guides
- 🛡️ **Error Handling**: Graceful error recovery and user-friendly messages
- 🔧 **Scalability**: Designed to scale horizontally with load balancers

## 🚀 Tech Stack

### Frontend
- **React 18** - Modern UI library with hooks
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Vite** - Fast build tool and dev server
- **Socket.IO Client** - Real-time WebSocket client

### Backend
- **Node.js 20** - JavaScript runtime
- **Express 5** - Web application framework
- **Socket.IO** - Real-time bidirectional communication
- **Express Rate Limit** - API rate limiting
- **Express Validator** - Input validation

### Database & External Services
- **Supabase** - PostgreSQL database and authentication
- **YouTube Data API v3** - Music search and metadata
- **YouTube IFrame Player API** - Audio playback

### DevOps & Tools
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **GitHub Actions** - CI/CD pipeline
- **ESLint** - Code linting
- **TypeScript ESLint** - TypeScript-specific linting

## 📋 Prerequisites

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **Docker** >= 20.10 (optional, for containerized deployment)
- **Supabase account** (free tier available)
- **Google Cloud account** (for YouTube API)

## 🛠️ Quick Start

### Development Setup

1. **Clone the repository:**
```bash
git clone https://github.com/irfan0807/SyncBeat.git
cd SyncBeat
npm install
```

2. **Configure environment variables:**
```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_YOUTUBE_API_KEY=your_youtube_api_key
PORT=3001
NODE_ENV=development
CORS_ORIGINS=http://localhost:5173
```

3. **Start development servers:**
```bash
# Terminal 1: Start backend server
npm run server

# Terminal 2: Start frontend dev server
npm run dev
```

4. **Access the application:**
- Frontend: http://localhost:5173
- Backend: http://localhost:3001
- Health Check: http://localhost:3001/health

### Production Deployment with Docker

1. **Quick deploy with Docker Compose:**
```bash
# Configure environment
cp .env.example .env
# Edit .env with production values

# Build and run
docker-compose up -d

# View logs
docker-compose logs -f syncbeat
```

2. **Access the application:**
- Application: http://localhost:3001
- Health Check: http://localhost:3001/health

For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md).

## 📖 Documentation

- **[API Documentation](./API.md)** - Complete WebSocket and REST API reference
- **[Deployment Guide](./DEPLOYMENT.md)** - Production deployment and scaling guide
- **[Contributing Guidelines](./.github/CONTRIBUTING.md)** - How to contribute to the project

## 🏗️ Architecture

### System Overview
```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Browser   │◄───────►│  WebSocket   │◄───────►│  Database   │
│  (React)    │  Socket │   Server     │   API   │ (Supabase)  │
└─────────────┘   .IO   └──────────────┘         └─────────────┘
                              │
                              │ YouTube API
                              ▼
                        ┌─────────────┐
                        │   YouTube   │
                        │   Service   │
                        └─────────────┘
```

### Key Components

- **Frontend (React)**: User interface, state management, WebSocket client
- **Backend (Node.js)**: WebSocket server, API endpoints, business logic
- **Database (Supabase)**: User data, room state, message history
- **YouTube API**: Music search, video metadata, playback

## 🔒 Security Features

- **Input Validation**: All user inputs are validated and sanitized
- **Rate Limiting**: API endpoints limited to 100 requests per 15 minutes
- **CORS Protection**: Configurable cross-origin resource sharing
- **Sanitization**: XSS protection through content sanitization
- **Authentication**: Supabase-based user authentication
- **Session Management**: Secure WebSocket session handling

## 🚦 API Endpoints

### REST API
- `GET /health` - Health check endpoint
- `GET /api/stats` - Server statistics

### WebSocket Events
- Room Management: `create-room`, `join-room`, `leave-room`
- Messaging: `send-message`, `typing-start`, `typing-stop`
- Playback: `track-update`, `playback-state`, `request-sync`
- Events: `user-joined`, `user-left`, `host-changed`

For complete API documentation, see [API.md](./API.md).

## 🧪 Development

### Available Scripts

```bash
# Frontend development
npm run dev          # Start Vite dev server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint

# Backend
npm run server       # Start Node.js server

# Docker
docker-compose up    # Start all services
docker-compose down  # Stop all services
docker-compose logs  # View logs
```

### Code Quality

```bash
# Lint code
npm run lint

# Build TypeScript
npm run build

# Type checking
npx tsc --noEmit
```

## 📊 Monitoring

### Health Check
```bash
curl http://localhost:3001/health
```

### Server Statistics
```bash
curl http://localhost:3001/api/stats
```

### Docker Logs
```bash
docker-compose logs -f syncbeat
```

## 🌐 Browser Compatibility

- ✅ Chrome/Chromium 87+ (recommended)
- ✅ Firefox 78+
- ✅ Safari 14+
- ✅ Edge 88+

**Note**: YouTube IFrame API works best in Chrome/Chromium browsers.

## 📝 API Limits

- **YouTube Data API**: 10,000 units/day (free tier)
  - Search: ~100 units per request
  - Video details: ~1 unit per request
- **Rate Limiting**: 100 API requests per 15 minutes per IP
- **Room Capacity**: Maximum 10 users per room
- **Message Length**: Maximum 1000 characters

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](./.github/CONTRIBUTING.md) for details.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- YouTube for the amazing music catalog and APIs
- Supabase for the excellent backend platform
- Socket.IO for real-time communication
- The open-source community for the tools and libraries

## 📞 Support

- 📧 Email: support@syncbeat.example.com
- 🐛 Issues: [GitHub Issues](https://github.com/irfan0807/SyncBeat/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/irfan0807/SyncBeat/discussions)
- 📖 Documentation: [API Docs](./API.md) | [Deployment Guide](./DEPLOYMENT.md)

## 🗺️ Roadmap

### Completed ✅
- [x] Real-time synchronization
- [x] YouTube integration
- [x] Chat functionality
- [x] Room management
- [x] User authentication
- [x] Docker support
- [x] CI/CD pipeline
- [x] Production deployment
- [x] Security features
- [x] API documentation

### Planned 🎯
- [ ] Spotify integration
- [ ] Playlist management
- [ ] User preferences
- [ ] Mobile app (React Native)
- [ ] Voice chat
- [ ] Screen sharing
- [ ] Analytics dashboard
- [ ] Premium features

---

Built with ❤️ by the SyncBeat team. Star ⭐ this repo if you like it!
