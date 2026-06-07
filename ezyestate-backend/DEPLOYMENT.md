# EzyEstate Backend Deployment Guide

## Prerequisites

- Node.js 18+ installed on server
- MongoDB instance (Atlas or self-hosted)
- Redis instance (optional but recommended)
- Cloudinary account
- Razorpay account
- Twilio account
- Domain name and SSL certificate (for production)

---

## Deployment Options

### Option 1: Docker (Recommended)

1. **Build Docker image:**
```bash
docker build -t ezyestate-backend:latest .
```

2. **Run container:**
```bash
docker run -d \
  --name ezyestate-api \
  -p 5000:5000 \
  --env-file .env \
  --restart unless-stopped \
  ezyestate-backend:latest
```

3. **With Docker Compose:**
```yaml
# docker-compose.yml
version: '3.8'
services:
  api:
    build: .
    ports:
      - "5000:5000"
    env_file: .env
    depends_on:
      - mongo
      - redis
    restart: unless-stopped

  mongo:
    image: mongo:7
    volumes:
      - mongo_data:/data/db
    ports:
      - "27017:27017"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  mongo_data:
```

Run: `docker-compose up -d`

---

### Option 2: PM2 (Production)

1. **Install PM2 globally:**
```bash
npm install -g pm2
```

2. **Start application:**
```bash
pm2 start ecosystem.config.js
```

3. **Save PM2 configuration:**
```bash
pm2 save
pm2 startup
```

4. **Monitor:**
```bash
pm2 monit
pm2 logs ezyestate-backend
```

---

### Option 3: Cloud Platforms

#### AWS EC2

1. Launch Ubuntu 22.04 EC2 instance
2. Install Node.js 18+
3. Clone repository
4. Set up environment variables
5. Use PM2 or systemd service
6. Configure nginx as reverse proxy

**nginx config:**
```nginx
server {
    listen 80;
    server_name api.ezyestate.in;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### Heroku

```bash
heroku create ezyestate-backend
heroku config:set NODE_ENV=production
heroku config:set MONGO_URI=<your-atlas-uri>
# Set all other env vars
git push heroku main
```

#### DigitalOcean App Platform

1. Connect GitHub repository
2. Select Node.js buildpack
3. Add environment variables
4. Deploy

#### Railway

1. Create new project
2. Connect GitHub
3. Add env variables
4. Deploy

---

## Production Checklist

### Security

- [ ] Change all default secrets (`JWT_SECRET`, etc.)
- [ ] Use strong database passwords
- [ ] Enable HTTPS/SSL
- [ ] Set `NODE_ENV=production`
- [ ] Configure CORS whitelist
- [ ] Enable rate limiting
- [ ] Use Helmet security headers
- [ ] Set up firewall rules

### Database

- [ ] Use MongoDB Atlas (or properly secured self-hosted)
- [ ] Enable authentication
- [ ] Create database backups
- [ ] Set up monitoring/alerts
- [ ] Configure connection pooling

### Redis

- [ ] Use managed Redis (AWS ElastiCache, Redis Cloud)
- [ ] Enable persistence
- [ ] Set maxmemory policy
- [ ] Configure password

### Monitoring

- [ ] Set up application monitoring (PM2, New Relic, DataDog)
- [ ] Configure error tracking (Sentry)
- [ ] Enable log aggregation (CloudWatch, Loggly)
- [ ] Set up uptime monitoring (UptimeRobot)

### Performance

- [ ] Enable Redis caching
- [ ] Configure CDN for static assets
- [ ] Optimize database indexes
- [ ] Enable gzip compression
- [ ] Set up load balancer (if multi-instance)

### Backups

- [ ] Database daily backups
- [ ] File storage backups (Cloudinary auto-handles)
- [ ] Environment config backups

---

## Environment Variables (Production)

```env
NODE_ENV=production
PORT=5000

MONGO_URI_PROD=mongodb+srv://...
REDIS_HOST=your-redis-host.com
REDIS_PASSWORD=your-redis-password
REDIS_TLS=true

JWT_SECRET=<strong-random-256-bit-key>
JWT_REFRESH_SECRET=<different-strong-key>

CLOUDINARY_CLOUD_NAME=production-cloud
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

RAZORPAY_KEY_ID=rzp_live_...
RAZORPAY_KEY_SECRET=...

TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...

SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=<sendgrid-api-key>

FRONTEND_URL=https://ezyestate.in
ADMIN_URL=https://admin.ezyestate.in

LOG_LEVEL=info
```

---

## SSL/HTTPS Setup

### Using Let's Encrypt (Free)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.ezyestate.in
```

### Force HTTPS redirect in nginx:
```nginx
server {
    listen 80;
    server_name api.ezyestate.in;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.ezyestate.in;

    ssl_certificate /etc/letsencrypt/live/api.ezyestate.in/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.ezyestate.in/privkey.pem;

    location / {
        proxy_pass http://localhost:5000;
        # ... other proxy settings
    }
}
```

---

## Scaling

### Horizontal Scaling

Use PM2 cluster mode:
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'ezyestate-backend',
    script: 'src/server.js',
    instances: 'max',  // Use all CPU cores
    exec_mode: 'cluster',
  }],
};
```

### Load Balancer

Use nginx upstream:
```nginx
upstream ezyestate_backend {
    server localhost:5000;
    server localhost:5001;
    server localhost:5002;
}

server {
    location / {
        proxy_pass http://ezyestate_backend;
    }
}
```

---

## Troubleshooting

**Service won't start:**
- Check logs: `pm2 logs ezyestate-backend --lines 100`
- Verify environment variables
- Check MongoDB/Redis connectivity

**High memory usage:**
- Check for memory leaks
- Adjust PM2 max memory restart
- Scale horizontally

**Slow responses:**
- Enable Redis caching
- Add database indexes
- Check external API latencies (Cloudinary, Twilio)

---

## Maintenance

### Database Migrations

Run migration scripts before deployment if schema changes.

### Zero-Downtime Deployment

```bash
pm2 reload ezyestate-backend
# Gracefully restarts with no downtime
```

### Health Check Endpoint

```http
GET /health
Response: 200 OK
```

Add to monitoring tools.

---

## Support

For production issues, check logs first:
```bash
pm2 logs ezyestate-backend
tail -f logs/combined-*.log
tail -f logs/error-*.log
```
