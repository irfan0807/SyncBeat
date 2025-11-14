# Production Deployment Guide

## Table of Contents
- [Prerequisites](#prerequisites)
- [Docker Deployment](#docker-deployment)
- [Environment Variables](#environment-variables)
- [Security Considerations](#security-considerations)
- [Monitoring and Logging](#monitoring-and-logging)
- [Scaling](#scaling)
- [Troubleshooting](#troubleshooting)

## Prerequisites

- Docker and Docker Compose installed
- Supabase account and project
- YouTube Data API v3 key
- Domain name (for production)
- SSL certificate (recommended: Let's Encrypt)

## Docker Deployment

### Quick Start with Docker Compose

1. Clone the repository:
```bash
git clone <repository-url>
cd syncbeat
```

2. Create a `.env` file from the example:
```bash
cp .env.example .env
```

3. Edit `.env` with your credentials:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_YOUTUBE_API_KEY=your_youtube_api_key
PORT=3001
NODE_ENV=production
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

4. Build and run with Docker Compose:
```bash
docker-compose up -d
```

5. Check the logs:
```bash
docker-compose logs -f syncbeat
```

6. Access the application:
- Application: http://localhost:3001
- Health check: http://localhost:3001/health

### Manual Docker Build

```bash
# Build the image
docker build -t syncbeat:latest .

# Run the container
docker run -d \
  --name syncbeat \
  -p 3001:3001 \
  -e NODE_ENV=production \
  -e PORT=3001 \
  -e VITE_SUPABASE_URL=your_url \
  -e VITE_SUPABASE_ANON_KEY=your_key \
  -e VITE_YOUTUBE_API_KEY=your_key \
  -e CORS_ORIGINS=https://yourdomain.com \
  syncbeat:latest
```

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key | `eyJhbG...` |
| `VITE_YOUTUBE_API_KEY` | YouTube Data API v3 key | `AIza...` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3001` |
| `NODE_ENV` | Environment mode | `development` |
| `CORS_ORIGINS` | Allowed CORS origins (comma-separated) | `http://localhost:5173` |

## Security Considerations

### 1. HTTPS/TLS
Always use HTTPS in production. Use a reverse proxy like Nginx:

```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 2. Rate Limiting
The application includes built-in rate limiting:
- API endpoints: 100 requests per 15 minutes per IP
- WebSocket connections are monitored with heartbeats

### 3. Input Validation
All user inputs are validated and sanitized:
- Username: 1-50 characters
- Messages: 1-1000 characters
- Room codes: Exactly 6 uppercase alphanumeric characters

### 4. Environment Security
- Never commit `.env` files to version control
- Use secrets management in production (AWS Secrets Manager, HashiCorp Vault, etc.)
- Rotate API keys regularly
- Use read-only database credentials where possible

### 5. CORS Configuration
Configure CORS origins appropriately:
```env
# Development
CORS_ORIGINS=http://localhost:5173

# Production
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

## Monitoring and Logging

### Health Checks

The application provides a health check endpoint at `/health`:

```bash
curl http://localhost:3001/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2024-11-14T18:00:00.000Z",
  "uptime": 3600,
  "environment": "production",
  "stats": {
    "activeRooms": 5,
    "activeUsers": 23,
    "activeConnections": 23
  }
}
```

### Application Logs

View logs with Docker:
```bash
# Follow logs
docker-compose logs -f syncbeat

# Last 100 lines
docker-compose logs --tail=100 syncbeat

# Since timestamp
docker-compose logs --since 2024-11-14T10:00:00 syncbeat
```

### External Monitoring

Consider integrating with:
- **Application Performance Monitoring**: New Relic, Datadog, Application Insights
- **Error Tracking**: Sentry, Rollbar
- **Log Aggregation**: ELK Stack, Splunk, CloudWatch Logs
- **Uptime Monitoring**: UptimeRobot, Pingdom, StatusCake

## Scaling

### Horizontal Scaling

For high traffic, use multiple instances with a load balancer:

1. Use Redis for shared session storage
2. Configure Socket.IO with Redis adapter
3. Use a load balancer (Nginx, HAProxy, AWS ALB)

Example with Redis adapter:
```javascript
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

const pubClient = createClient({ url: 'redis://redis:6379' });
const subClient = pubClient.duplicate();

await Promise.all([pubClient.connect(), subClient.connect()]);

io.adapter(createAdapter(pubClient, subClient));
```

### Vertical Scaling

Resource recommendations:
- **Small** (< 100 concurrent users): 512MB RAM, 1 CPU
- **Medium** (100-500 users): 1GB RAM, 2 CPUs
- **Large** (500-2000 users): 2GB RAM, 4 CPUs

## Database Optimization

### Supabase Configuration

1. Enable connection pooling
2. Add indexes on frequently queried columns:
```sql
CREATE INDEX idx_rooms_active ON rooms(is_active, created_at);
CREATE INDEX idx_messages_room ON messages(room_id, created_at);
CREATE INDEX idx_room_members_active ON room_members(room_id, is_active);
```

3. Set up automated backups
4. Monitor query performance

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker-compose logs syncbeat

# Check container status
docker ps -a

# Rebuild without cache
docker-compose build --no-cache
```

### Connection Issues

1. Verify CORS origins are correct
2. Check firewall rules allow port 3001
3. Ensure WebSocket connections are not blocked
4. Test health endpoint: `curl http://localhost:3001/health`

### High Memory Usage

1. Check for memory leaks:
```bash
docker stats syncbeat
```

2. Implement room cleanup more aggressively
3. Limit message history per room
4. Consider Redis for session storage

### Database Connection Errors

1. Verify Supabase credentials
2. Check network connectivity to Supabase
3. Review connection limits
4. Enable connection pooling

## Performance Tips

1. **CDN**: Use a CDN for static assets
2. **Caching**: Implement Redis for frequently accessed data
3. **Compression**: Enable gzip compression in Nginx
4. **Minification**: Ensure production build is minified
5. **Image Optimization**: Optimize YouTube thumbnails caching

## Backup and Recovery

### Automated Backups

1. Database: Use Supabase automated backups
2. Application state: Store room configurations in database
3. Container volumes: Regular volume snapshots

### Disaster Recovery

1. Document restoration procedures
2. Test recovery process quarterly
3. Keep multiple backup copies in different regions
4. Maintain infrastructure as code (IaC)

## Support

For issues and questions:
1. Check GitHub Issues
2. Review logs and health endpoints
3. Contact support team
4. Consult documentation

---

**Note**: This is a production-grade deployment guide. Always test changes in a staging environment before deploying to production.
