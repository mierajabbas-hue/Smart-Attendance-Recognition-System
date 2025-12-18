#!/bin/bash

# Fly.io Secrets Configuration Script

echo "🔐 Setting up Fly.io Secrets..."
echo ""

# App name
APP_NAME="smart-attendance-backend"

# Generate JWT Secret
echo "🔑 Generating JWT Secret..."
SECRET_KEY=$(openssl rand -hex 32)

# Set secrets
echo "📝 Setting environment variables..."

fly secrets set \
  DATABASE_URL="postgresql://postgres:xeJaGUCU1lLsIfti@db.ibbdiuqcnlfenqwnqcsx.supabase.co:5432/postgres" \
  SECRET_KEY="$SECRET_KEY" \
  DEBUG="false" \
  ALGORITHM="HS256" \
  ACCESS_TOKEN_EXPIRE_MINUTES="30" \
  -a $APP_NAME

echo ""
echo "⚠️  IMPORTANT: Set CORS_ORIGINS with your Vercel URL:"
echo "   fly secrets set CORS_ORIGINS='[\"https://your-app.vercel.app\"]' -a $APP_NAME"
echo ""
echo "✅ Secrets configured!"
echo ""
echo "To view all secrets:"
echo "   fly secrets list -a $APP_NAME"
