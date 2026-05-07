#!/bin/bash

echo "🔧 Fixing Docker build issues..."

# Fix 1: Remove version from docker-compose.yml (obsolete warning)
sed -i '/^version:/d' docker-compose.yml
echo "✅ Removed obsolete version from docker-compose.yml"

# Fix 2: Create missing BarcodeScanner component
mkdir -p src/components/barcode
cat > src/components/barcode/BarcodeScanner.tsx << 'EOF'
"use client"

export default function BarcodeScanner() {
  return (
    <div className="p-4 border border-dashed border-gray-300 rounded-lg text-center">
      <p className="text-gray-500">Barcode Scanner</p>
      <p className="text-sm text-gray-400">Component placeholder</p>
    </div>
  )
}
EOF
echo "✅ Created BarcodeScanner component"

# Fix 3: Update Dockerfile to fix npm/Tailwind issues
cat > Dockerfile << 'EOF'
# Stage 1: Dependencies
FROM node:18-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN rm -rf node_modules package-lock.json
RUN npm install --legacy-peer-deps

# Stage 2: Build
FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# Stage 3: Production
FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT 3000
CMD ["node", "server.js"]
EOF
echo "✅ Updated Dockerfile with dependency fixes"

echo "🚀 Now try building again..."
docker-compose build --no-cache