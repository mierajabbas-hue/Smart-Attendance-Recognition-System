#!/bin/bash

# Fly.io Deployment Script for Smart Attendance Backend

echo "🚀 Starting Fly.io Deployment..."
echo ""

# Check if fly is installed
if ! command -v fly &> /dev/null
then
    echo "❌ Fly CLI not found. Please install it first:"
    echo "   curl -L https://fly.io/install.sh | sh"
    exit 1
fi

# Pull latest changes
echo "📥 Pulling latest changes from GitHub..."
git pull origin main

# Check if logged in
echo "🔐 Checking Fly.io authentication..."
fly auth whoami || fly auth login

# Deploy
echo "🚢 Deploying to Fly.io..."
fly deploy

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📋 Next steps:"
echo "1. Set environment variables: fly secrets set DATABASE_URL=your-url"
echo "2. Check status: fly status"
echo "3. View logs: fly logs"
echo "4. Open app: fly open"
