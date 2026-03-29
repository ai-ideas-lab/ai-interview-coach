#!/bin/bash

# AI Interview Coach Development Script
# This script sets up the development environment and starts the server

set -e

echo "🚀 Setting up AI Interview Coach development environment..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Check if Prisma is installed
if ! command -v prisma &> /dev/null; then
    echo "⚠️  Prisma CLI not found. Installing..."
    npm install -g prisma
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Copy environment file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please update .env file with your configuration (database connection, OpenAI API key, etc.)"
fi

# Run database migrations
echo "🗄️  Running database migrations..."
prisma generate
prisma db push

# Build the project
echo "🔨 Building the project..."
npm run build

echo "✅ Setup complete!"
echo ""
echo "🚀 To start the development server:"
echo "   npm run dev"
echo ""
echo "🔧 To start in production mode:"
echo "   npm start"
echo ""
echo "📚 API Documentation will be available at:"
echo "   http://localhost:3000/api"
echo ""
echo "💡 Use Ctrl+C to stop the server"