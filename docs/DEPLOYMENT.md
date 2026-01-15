# Deployment Guide

This guide covers deploying ScaleOn Commerce Engine to various platforms.

## Prerequisites

- Node.js 18+ (for non-Docker deployments)
- MongoDB 6.0+
- Docker & Docker Compose (for containerized deployment)

---

## Local Development

```bash
# Clone and install
git clone <repository-url>
cd Module_E-Com
npm install

# Configure environment
cp .env.example .env
# Edit .env with your settings

# Start MongoDB
mongod

# Seed database
npm run seed

# Start development servers
npm run dev
```

---

## Docker Deployment

### Quick Start

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### With Custom Environment

```bash
# Create production env file
cp .env.example .env.production

# Edit with production values
nano .env.production

# Start with production config
docker-compose --env-file .env.production up -d
```

---

## Cloud Deployment Options

### 1. Railway

1. Create a Railway account
2. Connect your GitHub repository
3. Add MongoDB service
4. Set environment variables
5. Deploy

### 2. Render

1. Create a Render account
2. Create a new Web Service
3. Connect repository
4. Set build command: `npm install && cd frontend && npm run build`
5. Set start command: `cd backend && node server.js`
6. Add MongoDB Atlas connection string

### 3. DigitalOcean App Platform

1. Create a new App
2. Connect GitHub
3. Configure build settings
4. Add managed MongoDB
5. Deploy

### 4. AWS (EC2 + DocumentDB)

```bash
# On EC2 instance
sudo yum install docker docker-compose -y
sudo systemctl start docker

# Clone repository
git clone <repository-url>
cd Module_E-Com

# Configure environment
cp .env.example .env
# Set MONGODB_URI to DocumentDB connection string

# Deploy
docker-compose up -d
```

---

## Production Checklist

### Security
- [ ] Strong JWT secrets (64+ random bytes)
- [ ] HTTPS enabled (use reverse proxy)
- [ ] CORS configured for your domain
- [ ] Rate limiting enabled
- [ ] Admin password changed from default

### Performance
- [ ] Node.js production mode (`NODE_ENV=production`)
- [ ] MongoDB indexes created
- [ ] Static files cached (nginx)
- [ ] Gzip compression enabled

### Monitoring
- [ ] Health check endpoint accessible
- [ ] Error logging configured
- [ ] Uptime monitoring set up

### Backup
- [ ] MongoDB backup schedule
- [ ] Environment variables backed up

---

## Environment-Specific Configuration

### Development
```env
NODE_ENV=development
PORT=5001
MONGODB_URI=mongodb://localhost:27017/scaleon_dev
```

### Staging
```env
NODE_ENV=staging
PORT=5001
MONGODB_URI=<staging-database-url>
CORS_ORIGIN=https://staging.yourdomain.com
```

### Production
```env
NODE_ENV=production
PORT=5001
MONGODB_URI=<production-database-url>
CORS_ORIGIN=https://yourdomain.com
```

---

## Reverse Proxy (Nginx)

For production, use nginx as a reverse proxy:

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## SSL Certificate (Let's Encrypt)

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d yourdomain.com

# Auto-renewal
sudo certbot renew --dry-run
```

---

## Troubleshooting

### MongoDB Connection Issues
```bash
# Check MongoDB is running
mongosh --eval 'db.runCommand("ping")'

# Check connection from container
docker exec scaleon-backend wget -qO- http://mongodb:27017
```

### Port Already in Use
```bash
# Find process using port
lsof -i :5001

# Kill process
kill -9 <PID>
```

### Container Won't Start
```bash
# Check logs
docker-compose logs backend

# Restart containers
docker-compose restart
```
