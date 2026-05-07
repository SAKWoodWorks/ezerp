# Docker Compose Deployment Design

**Date:** 2026-05-07  
**Project:** EZ-ERP Next.js Application  
**Deployment Target:** Digital Ocean Server

## Overview

Deploy the Next.js ERP application using Docker Compose with Nginx reverse proxy to run alongside an existing website on port 8002.

## Architecture

```
Internet → Digital Ocean Server:
  ├── Existing website (other ports)
  └── ERP System (Port 8002):
      ├── Nginx Container (Port 8002 → 80 internal)
      └── Next.js Container (Port 3000 internal) → Supabase (External)
```

## Components

### 1. Next.js Application Container
- **Base:** Existing multi-stage Dockerfile
- **Environment:** Uses existing Supabase project (same as development)
- **Internal Port:** 3000
- **Environment Variables:**
  - `NEXT_PUBLIC_SUPABASE_URL` 
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 2. Nginx Reverse Proxy Container
- **Image:** nginx:alpine
- **External Port:** 8002 (user-specified)
- **Internal Port:** 80
- **Purpose:** Forward requests to Next.js container, serve static files efficiently
- **Configuration:** Custom nginx.conf mounted as volume

## File Structure

```
/project-root/
├── docker-compose.yml     # Main orchestration file
├── nginx.conf            # Nginx reverse proxy configuration
├── .env.local            # Environment variables (existing)
├── Dockerfile            # Application build (existing)
└── ... (rest of application files)
```

## Environment Configuration

**Production Environment Variables (.env.local):**
```env
NEXT_PUBLIC_SUPABASE_URL=existing_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=existing_supabase_anon_key
```

**Strategy:** Reuse existing Supabase project from development environment to simplify deployment and reduce infrastructure costs.

## Deployment Process

### Initial Setup
1. Create `docker-compose.yml` in project root
2. Create `nginx.conf` in project root  
3. Ensure `.env.local` exists with Supabase credentials

### Deploy Commands
```bash
# Build the application image
docker-compose build

# Start all services in detached mode
docker-compose up -d

# Verify deployment
docker-compose ps
docker-compose logs
```

### Access
- **Application URL:** `http://server-ip:8002`
- **Coexistence:** Runs alongside existing website without conflicts

## Container Communication

- **Nginx → Next.js:** Internal Docker network communication
- **Next.js → Supabase:** External HTTPS to existing Supabase project
- **User → Nginx:** External access on port 8002

## Monitoring & Troubleshooting

### Log Access
```bash
# All containers
docker-compose logs -f

# Specific container
docker-compose logs -f nextjs-app
docker-compose logs -f nginx
```

### Container Management
```bash
# Restart services
docker-compose restart

# Stop services
docker-compose down

# Rebuild and restart
docker-compose up --build -d
```

## Error Handling

### Common Issues
1. **Port conflicts:** Port 8002 must be available
2. **Environment variables:** Missing Supabase credentials
3. **Build failures:** Node.js version compatibility, dependency issues
4. **Network issues:** Nginx unable to reach Next.js container

### Resolution Strategies
- Check port availability: `netstat -tulpn | grep 8002`
- Validate environment file exists and has correct values
- Review container logs for specific error messages
- Ensure Docker daemon is running and has sufficient resources

## Security Considerations

- **Container isolation:** Each service runs in separate container
- **Environment variables:** Sensitive data stored in .env.local file
- **Network security:** Internal container communication only
- **Future enhancement:** SSL/TLS termination can be added to Nginx configuration

## Success Criteria

1. ✅ Application accessible at `http://server-ip:8002`
2. ✅ All application features functional (login, database operations, Google Sheets integration)
3. ✅ Containers start automatically and remain stable
4. ✅ No interference with existing website
5. ✅ Logs accessible for troubleshooting

## Future Enhancements

- **SSL/HTTPS:** Add Let's Encrypt certificates to Nginx
- **Domain setup:** Configure custom domain with DNS
- **Health checks:** Add container health monitoring
- **Backup strategy:** Database backup automation
- **CI/CD:** Automated deployment pipeline

## Implementation Files

This design requires creation of:
1. `docker-compose.yml` - Container orchestration
2. `nginx.conf` - Reverse proxy configuration

Both files will be created in the project root directory and committed to the repository.