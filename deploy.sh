#!/bin/bash

# ERP Deployment Script for Digital Ocean
# Run this script on your Digital Ocean server

echo "🚀 Starting ERP deployment on Digital Ocean..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Run this script from your project root."
    exit 1
fi

# Create missing directories and files
echo "📁 Creating missing components..."
mkdir -p src/components/barcode

# Create BarcodeScanner component if missing
if [ ! -f "src/components/barcode/BarcodeScanner.tsx" ]; then
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
fi

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "❌ Error: .env.local file not found!"
    echo "Please create .env.local with your Supabase credentials:"
    echo "NEXT_PUBLIC_SUPABASE_URL=your_supabase_url"
    echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key"
    exit 1
fi

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose down 2>/dev/null

# Clean up Docker
echo "🧹 Cleaning Docker cache..."
docker system prune -f

# Build with no cache
echo "🔨 Building Docker containers..."
docker-compose build --no-cache

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
else
    echo "❌ Build failed. Trying alternative approach..."

    # Try building just the app first
    docker build -t erp-app .

    if [ $? -eq 0 ]; then
        echo "✅ App build successful!"
    else
        echo "❌ Build still failing. Check the errors above."
        exit 1
    fi
fi

# Start containers
echo "🚀 Starting containers..."
docker-compose up -d

# Wait a bit for containers to start
echo "⏳ Waiting for containers to start..."
sleep 10

# Check container status
echo "📊 Checking container status..."
docker-compose ps

# Test if the app is responding
echo "🔍 Testing application..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:8002 | grep -q "200\|301\|302"; then
    echo "✅ Application is responding!"
    echo ""
    echo "🎉 Deployment complete!"
    echo "📱 Your ERP is running at: http://$(curl -s ifconfig.me):8002"
    echo ""
    echo "📋 Useful commands:"
    echo "  View logs: docker-compose logs -f"
    echo "  Restart:   docker-compose restart"
    echo "  Stop:      docker-compose down"
    echo ""
else
    echo "⚠️  Application might not be responding yet..."
    echo "Check logs: docker-compose logs -f"
fi

# Open firewall if ufw is installed
if command -v ufw >/dev/null; then
    echo "🔒 Opening firewall port 8002..."
    sudo ufw allow 8002 2>/dev/null || echo "⚠️  Could not modify firewall (might need sudo)"
fi

echo "✅ Deployment script completed!"