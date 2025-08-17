#!/bin/bash

# Development setup script for Instructly platform
# Ensures consistent development environment setup

set -e

echo "🚀 Setting up Instructly development environment..."

# Check Node.js version
echo "📋 Checking Node.js version..."
node_version=$(node --version | cut -d'v' -f2)
required_version="20.0.0"

if [ "$(printf '%s\n' "$required_version" "$node_version" | sort -V | head -n1)" != "$required_version" ]; then
    echo "❌ Node.js version $node_version is too old. Please install Node.js 20.x LTS"
    exit 1
fi
echo "✅ Node.js version $node_version is compatible"

# Check npm version
echo "📋 Checking npm version..."
npm_version=$(npm --version)
required_npm="10.0.0"

if [ "$(printf '%s\n' "$required_npm" "$npm_version" | sort -V | head -n1)" != "$required_npm" ]; then
    echo "❌ npm version $npm_version is too old. Please update npm: npm install -g npm@latest"
    exit 1
fi
echo "✅ npm version $npm_version is compatible"

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Check for environment file
if [ ! -f ".env.local" ]; then
    echo "📝 Creating environment file from template..."
    cp .env.example .env.local
    echo "⚠️  Please edit .env.local with your actual configuration values"
fi

# Build shared packages
echo "🔨 Building shared packages..."
npm run build --filter=@instructly/shared
npm run build --filter=@instructly/ui

# Run type checking
echo "🔍 Running type checks..."
npm run type-check

# Check Docker availability (optional)
if command -v docker &> /dev/null; then
    echo "✅ Docker is available for containerized development"
    
    # Check if Docker is running
    if docker info &> /dev/null; then
        echo "✅ Docker daemon is running"
    else
        echo "⚠️  Docker daemon is not running. Start Docker to use containerized development"
    fi
else
    echo "⚠️  Docker not found. Install Docker for containerized development (optional)"
fi

# Check Supabase CLI (optional)
if command -v supabase &> /dev/null; then
    echo "✅ Supabase CLI is available"
else
    echo "⚠️  Supabase CLI not found. Install with: npm install -g supabase"
fi

echo ""
echo "🎉 Development environment setup complete!"
echo ""
echo "📖 Next steps:"
echo "1. Edit .env.local with your configuration"
echo "2. Run 'npm run dev' to start development servers"
echo "3. Visit http://localhost:3000 for frontend"
echo "4. Visit http://localhost:3001/api/health for backend health check"
echo ""
echo "📚 Available commands:"
echo "  npm run dev          - Start all development servers"
echo "  npm run dev:web      - Start frontend only"
echo "  npm run dev:api      - Start backend only"
echo "  npm run test         - Run all tests"
echo "  npm run lint         - Run linting"
echo "  npm run build        - Build all packages"
echo ""