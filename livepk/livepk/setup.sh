#!/bin/bash
# LivePK — Quick Start Script
# Run this from the livepk/ root directory

echo "
╔══════════════════════════════════════╗
║     🔴 LIVE  LivePK Startup          ║
║     Pakistan Live Commerce Platform  ║
╚══════════════════════════════════════╝
"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install from https://nodejs.org"
    exit 1
fi

echo "✅ Node.js $(node -v) found"

# Backend setup
echo ""
echo "📦 Installing backend dependencies..."
cd backend && npm install --silent

if [ ! -f .env ]; then
    echo "⚠️  No .env found — copying from .env.example"
    cp .env.example .env
    echo "⚠️  Please edit backend/.env with your MONGODB_URI and ANTHROPIC_API_KEY"
fi

# Frontend setup
echo ""
echo "📦 Installing frontend dependencies..."
cd ../frontend && npm install --silent

echo ""
echo "✅ Setup complete!"
echo ""
echo "To start development:"
echo "  Terminal 1: cd backend && npm run dev"
echo "  Terminal 2: cd frontend && npm start"
echo ""
echo "Then open: http://localhost:3000"
