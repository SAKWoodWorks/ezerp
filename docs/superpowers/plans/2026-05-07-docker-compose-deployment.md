# Docker Compose Deployment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deploy Next.js ERP application using Docker Compose with Nginx reverse proxy on Digital Ocean server port 8002.

**Architecture:** Two-container setup with Nginx reverse proxy forwarding requests to Next.js application container, connecting to existing Supabase database.

**Tech Stack:** Docker Compose, Nginx Alpine, Node.js 18 Alpine, Next.js 15 standalone mode

---

## File Structure

```
/project-root/
├── docker-compose.yml     # Container orchestration (create)
├── nginx.conf            # Nginx reverse proxy config (create)
├── .env.local            # Environment variables (verify/update)
├── Dockerfile            # Application build (existing)
├── next.config.ts        # Standalone config (existing)
└── package.json          # Dependencies (existing)
```

---

### Task 1: Create Nginx Configuration

**Files:**
- Create: `nginx.conf`

- [ ] **Step 1: Create nginx.conf with reverse proxy configuration**

```nginx
# Nginx configuration for reverse proxy to Next.js app
events {
    worker_connections 1024;
}

http {
    # Basic settings
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    sendfile on;
    keepalive_timeout 65;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

    # Upstream Next.js app
    upstream nextjs_app {
        server nextjs-app:3000;
    }

    server {
        listen 80;
        server_name localhost;
        
        # Security headers
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        add_header X-XSS-Protection "1; mode=block";

        # Proxy all requests to Next.js
        location / {
            proxy_pass http://nextjs_app;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
            
            # Timeouts
            proxy_connect_timeout 30s;
            proxy_send_timeout 30s;
            proxy_read_timeout 30s;
        }

        # Health check endpoint
        location /health {
            proxy_pass http://nextjs_app/api/health;
            access_log off;
        }

        # Static assets caching
        location /_next/static/ {
            proxy_pass http://nextjs_app;
            expires 1y;
            add_header Cache-Control "public, immutable";
        }

        # Error pages
        error_page 502 503 504 /50x.html;
        location = /50x.html {
            root /usr/share/nginx/html;
        }
    }
}
```

- [ ] **Step 2: Verify nginx.conf syntax**

```bash
# Test nginx configuration syntax
docker run --rm -v "$(pwd)/nginx.conf:/etc/nginx/nginx.conf:ro" nginx:alpine nginx -t
```

Expected output: "nginx: configuration file /etc/nginx/nginx.conf test is successful"

- [ ] **Step 3: Commit nginx configuration**

```bash
git add nginx.conf
git commit -m "feat: add nginx reverse proxy configuration for port 8002"
```

---

### Task 2: Create Docker Compose Configuration

**Files:**
- Create: `docker-compose.yml`

- [ ] **Step 1: Create docker-compose.yml with service definitions**

```yaml
# Docker Compose configuration for Next.js ERP deployment
version: '3.8'

services:
  # Next.js application container
  nextjs-app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: erp-nextjs-app
    restart: unless-stopped
    env_file:
      - .env.local
    environment:
      - NODE_ENV=production
      - PORT=3000
    expose:
      - "3000"
    networks:
      - erp-network
    depends_on:
      - nginx
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  # Nginx reverse proxy container
  nginx:
    image: nginx:alpine
    container_name: erp-nginx
    restart: unless-stopped
    ports:
      - "8002:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    networks:
      - erp-network
    depends_on:
      - nextjs-app
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:80/health"]
      interval: 30s
      timeout: 10s
      retries: 3

# Custom network for container communication
networks:
  erp-network:
    driver: bridge
    name: erp-network

# Named volumes for persistence (if needed later)
volumes:
  nginx-logs:
    driver: local
```

- [ ] **Step 2: Validate docker-compose.yml syntax**

```bash
# Validate docker-compose file syntax
docker-compose config
```

Expected: Should output the parsed configuration without errors

- [ ] **Step 3: Commit docker-compose configuration**

```bash
git add docker-compose.yml
git commit -m "feat: add docker-compose configuration for nginx + nextjs deployment"
```

---

### Task 3: Verify Environment Configuration

**Files:**
- Verify: `.env.local`

- [ ] **Step 1: Check if .env.local exists**

```bash
# Check if environment file exists
ls -la .env.local
```

Expected: File should exist with Supabase credentials

- [ ] **Step 2: Verify environment variables format**

```bash
# Check environment file contains required variables (without showing values)
grep -E "^NEXT_PUBLIC_SUPABASE_URL=" .env.local >/dev/null && echo "SUPABASE_URL: ✓" || echo "SUPABASE_URL: ✗"
grep -E "^NEXT_PUBLIC_SUPABASE_ANON_KEY=" .env.local >/dev/null && echo "SUPABASE_ANON_KEY: ✓" || echo "SUPABASE_ANON_KEY: ✗"
```

Expected: Both variables should show ✓

- [ ] **Step 3: Create .env.local if missing**

```bash
# Create environment file if it doesn't exist
cat > .env.local << 'EOF'
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EOF
```

Note: Replace with actual Supabase credentials from development environment

- [ ] **Step 4: Secure environment file permissions**

```bash
# Set secure permissions on environment file
chmod 600 .env.local
```

Expected: File should be readable only by owner

---

### Task 4: Create Health Check Endpoint

**Files:**
- Create: `src/app/api/health/route.ts`

- [ ] **Step 1: Create health check API route**

```typescript
// Health check endpoint for container monitoring
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Basic health check
    const healthCheck = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version || '1.0.0'
    }

    return NextResponse.json(healthCheck, { status: 200 })
  } catch (error) {
    return NextResponse.json(
      { 
        status: 'unhealthy', 
        timestamp: new Date().toISOString(),
        error: 'Health check failed' 
      }, 
      { status: 503 }
    )
  }
}
```

- [ ] **Step 2: Test health endpoint locally**

```bash
# Start development server to test health endpoint
npm run dev &
DEV_PID=$!

# Wait for server to start
sleep 5

# Test health endpoint
curl -s http://localhost:3000/api/health | grep -q "healthy" && echo "Health endpoint: ✓" || echo "Health endpoint: ✗"

# Stop development server
kill $DEV_PID
```

Expected: Should show "Health endpoint: ✓"

- [ ] **Step 3: Commit health check endpoint**

```bash
git add src/app/api/health/route.ts
git commit -m "feat: add health check endpoint for container monitoring"
```

---

### Task 5: Build and Test Docker Setup

**Files:**
- Test: `docker-compose.yml`, `nginx.conf`, `Dockerfile`

- [ ] **Step 1: Build Docker images**

```bash
# Build the Next.js application image
docker-compose build nextjs-app
```

Expected: Build should complete successfully without errors

- [ ] **Step 2: Start services in detached mode**

```bash
# Start all services
docker-compose up -d
```

Expected: Both containers should start successfully

- [ ] **Step 3: Verify containers are running**

```bash
# Check container status
docker-compose ps
```

Expected output:
```
Name                State           Ports
erp-nextjs-app     Up              3000/tcp
erp-nginx          Up              0.0.0.0:8002->80/tcp
```

- [ ] **Step 4: Test application accessibility**

```bash
# Test if application is accessible on port 8002
curl -s -o /dev/null -w "%{http_code}" http://localhost:8002
```

Expected: HTTP status code 200

- [ ] **Step 5: Test health endpoint through nginx**

```bash
# Test health endpoint through nginx proxy
curl -s http://localhost:8002/health | grep -q "healthy" && echo "Health check through nginx: ✓" || echo "Health check through nginx: ✗"
```

Expected: Should show "Health check through nginx: ✓"

- [ ] **Step 6: Check container logs for errors**

```bash
# Check nginx logs
echo "=== Nginx Logs ==="
docker-compose logs nginx

# Check Next.js logs  
echo "=== Next.js Logs ==="
docker-compose logs nextjs-app
```

Expected: No critical errors in logs

---

### Task 6: Create Deployment Documentation

**Files:**
- Create: `DEPLOYMENT.md`

- [ ] **Step 1: Create deployment documentation**

```markdown
# ERP Application Deployment Guide

## Production Deployment on Digital Ocean

### Prerequisites
- Docker and Docker Compose installed
- Repository cloned to server
- Environment variables configured

### Quick Deployment

1. **Navigate to project directory:**
   ```bash
   cd /path/to/next-crm
   ```

2. **Build and start services:**
   ```bash
   docker-compose build
   docker-compose up -d
   ```

3. **Verify deployment:**
   ```bash
   docker-compose ps
   curl http://your-server-ip:8002/health
   ```

4. **Access application:**
   - URL: `http://your-server-ip:8002`
   - Login with your existing credentials

### Management Commands

```bash
# View logs
docker-compose logs -f

# Restart services
docker-compose restart

# Stop services
docker-compose down

# Update deployment
git pull
docker-compose build
docker-compose up -d
```

### Troubleshooting

#### Port 8002 not accessible
- Check firewall: `ufw status`
- Verify port binding: `netstat -tulpn | grep 8002`

#### Application errors
- Check container logs: `docker-compose logs nextjs-app`
- Verify environment variables: `docker-compose exec nextjs-app env | grep SUPABASE`

#### Database connection issues
- Test Supabase connectivity from server
- Verify environment variables are correct

### Health Monitoring

- Health endpoint: `http://your-server-ip:8002/health`
- Container status: `docker-compose ps`
- Resource usage: `docker stats`

### Security Considerations

- Environment file permissions: `chmod 600 .env.local`
- Keep Docker images updated: `docker-compose pull && docker-compose build`
- Monitor logs for suspicious activity
```

- [ ] **Step 2: Commit deployment documentation**

```bash
git add DEPLOYMENT.md
git commit -m "docs: add production deployment guide for Docker Compose"
```

---

### Task 7: Final Validation and Cleanup

**Files:**
- Test: All created files and deployment

- [ ] **Step 1: Stop and restart services to test persistence**

```bash
# Stop services
docker-compose down

# Start services again
docker-compose up -d

# Wait for services to be ready
sleep 30
```

- [ ] **Step 2: Final end-to-end test**

```bash
# Test application functionality
echo "Testing application endpoints..."

# Test main page
curl -s -o /dev/null -w "Main page: %{http_code}\n" http://localhost:8002/

# Test health endpoint
curl -s -o /dev/null -w "Health endpoint: %{http_code}\n" http://localhost:8002/health

# Test login page
curl -s -o /dev/null -w "Login page: %{http_code}\n" http://localhost:8002/login
```

Expected: All endpoints should return 200 status codes

- [ ] **Step 3: Verify resource usage**

```bash
# Check Docker resource usage
docker stats --no-stream
```

Expected: Reasonable CPU and memory usage for both containers

- [ ] **Step 4: Create final commit with deployment completion**

```bash
git add .
git commit -m "feat: complete Docker Compose deployment setup

- Nginx reverse proxy on port 8002
- Next.js application container  
- Health monitoring endpoints
- Production deployment documentation
- All services tested and verified"
```

- [ ] **Step 5: Tag deployment version**

```bash
# Create deployment tag
git tag -a v1.0.0-docker-deploy -m "Docker Compose deployment ready for production"
git push origin v1.0.0-docker-deploy
```

---

## Success Criteria

✅ Application accessible at `http://server-ip:8002`  
✅ All Docker containers running and healthy  
✅ Nginx reverse proxy functioning correctly  
✅ Health checks passing  
✅ No critical errors in logs  
✅ Documentation complete and accurate  
✅ Deployment reproducible from documentation  

## Post-Deployment Steps (Manual)

1. **Configure firewall** to allow port 8002
2. **Set up monitoring** for container health
3. **Configure backup strategy** for important data
4. **Plan SSL/domain setup** for production use