# 🐳 Docker Guide

## Docker Yapısı

### Development
- **Docker:** ❌ Kullanılmıyor
- **Yöntem:** `npm run dev` (Native development)
- **Port:** 5173
- **Server:** Vite dev server
- **Hot Reload:** Aktif

### Production
- **Dosya:** `docker-compose.yml`
- **Dockerfile:** `frontend/Dockerfile`
- **Port:** 80
- **Server:** Nginx
- **Build:** Multi-stage

---

## 🚀 Hızlı Başlangıç

### Development (Native - Önerilen) ⭐

```bash
# 1. Environment setup
./setup-env.sh

# 2. Install dependencies
cd frontend
npm install

# 3. Start development server
npm run dev
```

**URL:** http://localhost:5173

### Production (Docker)

```bash
# Production Docker
# frontend/.env dosyasını oluştur (production values)
docker-compose up -d
```

**URL:** http://localhost

---

## 📁 Docker Dosyaları

### docker-compose.local.yml (Development)

```yaml
services:
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.dev
    container_name: davetim-frontend-local
    ports:
      - "5173:5173"
    volumes:
      - ./frontend:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
      - CHOKIDAR_USEPOLLING=true
    env_file:
      - ./frontend/.env.local
    command: npm run dev
```

### docker-compose.yml (Production)

```yaml
services:
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      target: production
    container_name: davetim-frontend-prod
    ports:
      - "80:80"
    environment:
      - NODE_ENV=production
    env_file:
      - ./frontend/.env
    restart: unless-stopped
```

### Dockerfile.dev (Development)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
```

### Dockerfile (Production)

```dockerfile
# Multi-stage Production Dockerfile

# Stage 1: Build
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

# Stage 2: Production
FROM nginx:alpine AS production
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

---

## 🔧 Docker Commands

### Development

```bash
# Start development
docker-compose -f docker-compose.local.yml up

# Start in background
docker-compose -f docker-compose.local.yml up -d

# View logs
docker-compose -f docker-compose.local.yml logs -f

# Stop
docker-compose -f docker-compose.local.yml down
```

### Production

```bash
# Start production
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

### Maintenance

```bash
# Clean up
docker-compose down -v
docker system prune -a

# Rebuild
docker-compose up --build

# Force rebuild
docker-compose build --no-cache
```

---

## 🐳 Nginx Configuration

### nginx.conf

```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # Security headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json application/javascript;

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Health check
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
```

---

## 🆘 Troubleshooting

### "Cannot connect to Docker daemon"

```bash
# Docker running mi kontrol et
docker ps

# Değilse başlat
# Windows: Docker Desktop aç
# Linux: sudo systemctl start docker
```

### "Port already in use"

```bash
# Port kullanımını kontrol et
lsof -i :5173  # Mac/Linux
netstat -ano | findstr :5173  # Windows

# Veya port değiştir
# docker-compose.local.yml'de:
ports:
  - "5174:5173"
```

### "npm install takes forever"

```bash
# Volume cache'i temizle
docker-compose -f docker-compose.local.yml down -v

# Yeniden build
docker-compose -f docker-compose.local.yml up --build
```

### "Production build fails"

```bash
# Environment variables kontrol et
cat frontend/.env

# Manuel build test
cd frontend
npm run build

# Docker log'ları kontrol et
docker-compose logs frontend
```

### "Container won't start"

```bash
# Container log'ları kontrol et
docker-compose logs frontend

# Container'a gir
docker-compose exec frontend sh

# Environment variables kontrol et
docker-compose exec frontend env
```

---

## 📊 Performance Optimization

### Development Optimization

```yaml
# docker-compose.local.yml
services:
  frontend:
    volumes:
      - ./frontend:/app
      - /app/node_modules  # Node modules cache
    environment:
      - CHOKIDAR_USEPOLLING=true  # File watching
```

### Production Optimization

```dockerfile
# Multi-stage build
FROM node:18-alpine AS build
# ... build stage

FROM nginx:alpine AS production
# ... production stage

# Nginx optimization
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json application/javascript;
```

---

## 🔒 Security

### Container Security

```dockerfile
# Non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001
USER nextjs
```

### Network Security

```yaml
# docker-compose.yml
services:
  frontend:
    networks:
      - davetim-network
    restart: unless-stopped

networks:
  davetim-network:
    driver: bridge
```

### Environment Security

```bash
# Environment dosyalarını güvenli tut
chmod 600 frontend/.env
chmod 600 frontend/.env.local
```

---

## 📈 Monitoring

### Container Monitoring

```bash
# Container stats
docker stats

# Container logs
docker-compose logs -f

# Container health
docker-compose ps
```

### Application Monitoring

```bash
# Health check
curl http://localhost/health

# Application logs
docker-compose logs frontend | grep ERROR
```

---

## 🔄 CI/CD Integration

### GitHub Actions

```yaml
# .github/workflows/docker.yml
name: Docker Build
on:
  push:
    branches: [main]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Build Docker image
        run: docker-compose build
      - name: Test Docker image
        run: docker-compose up -d
      - name: Health check
        run: curl -f http://localhost/health
```

### Docker Registry

```bash
# Build and push
docker build -t davetim-app:latest .
docker tag davetim-app:latest your-registry/davetim-app:latest
docker push your-registry/davetim-app:latest
```

---

## ✅ Docker Checklist

### Development
- [ ] Environment setup yapıldı
- [ ] Docker daemon çalışıyor
- [ ] Port 5173 boş
- [ ] Development container çalışıyor
- [ ] Hot reload çalışıyor
- [ ] Logs temiz

### Production
- [ ] Environment variables ayarlandı
- [ ] Production build başarılı
- [ ] Nginx configuration doğru
- [ ] Security headers aktif
- [ ] Gzip compression aktif
- [ ] Health check çalışıyor

### Maintenance
- [ ] Container logs izleniyor
- [ ] Resource usage normal
- [ ] Backup strategy var
- [ ] Update strategy var

---

## 🎯 Hangi Yöntemi Kullanmalıyım?

### Development → Native npm run dev ⭐
- En hızlı
- En kolay
- HMR sorunsuz
- Debug kolay

### Testing → Docker Local
- Production-like ortam
- Nginx configuration test
- Environment isolation

### Production → Vercel/Netlify ⭐
- Otomatik deploy
- CDN
- SSL
- Zero config

### Self-hosting → Docker Production
- Tam kontrol
- Custom infrastructure
- Cost optimization

---

**Süre:** 10 dakika
**Sonuç:** Docker ile çalışan uygulama! 🎉
