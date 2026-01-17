# Docker Setup Reminder

> **TODO**: Set up Docker for this application before final release.

## Why Docker?

- Easy deployment for clients
- Consistent environment across development/staging/production
- Simple one-command setup for new clients

## Files to Create

- [ ] `Dockerfile` for backend
- [ ] `Dockerfile` for frontend
- [ ] `docker-compose.yml` for full stack
- [ ] `docker-compose.prod.yml` for production
- [ ] `.dockerignore` files

## Suggested Docker Compose Structure

```yaml
services:
  frontend:
    build: ./frontend
    ports:
      - "80:80"
    
  backend:
    build: ./backend
    ports:
      - "5001:5001"
    environment:
      - MONGODB_URI=mongodb://mongo:27017/scaleon
    
  mongo:
    image: mongo:7
    volumes:
      - mongo_data:/data/db
```

## Client Deployment Steps (After Docker Setup)

1. Clone repository
2. Copy `.env.example` to `.env` and configure
3. Run `docker-compose up -d`
4. Access store at `http://localhost`

---

**Priority**: Complete this after all features are implemented.
