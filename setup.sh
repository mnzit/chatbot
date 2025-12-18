#!/bin/bash

# Get the absolute path of the project directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🏗️ Starting Chatbot Project Setup..."

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# 1. Check Prerequisites
echo "🔍 Checking prerequisites..."

if ! command_exists python3; then
    echo "❌ Error: python3 is not installed."
    exit 1
fi

if ! command_exists npm; then
    echo "❌ Error: npm is not installed."
    exit 1
fi

echo "✅ Prerequisites met."

# 2. Setup Backend
echo "📦 Setting up Backend..."
cd "$PROJECT_ROOT/backend"

# Create virtual environment if it doesn't exist
if [ ! -d ".venv" ]; then
    echo "  - Creating virtual environment..."
    python3 -m venv .venv
fi

# Activate virtual environment and install dependencies
echo "  - Installing Python dependencies..."
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

# Create .env if it doesn't exist (optional, but helpful for user)
if [ ! -f ".env" ]; then
    echo "  - Creating template .env file..."
    echo "GOOGLE_API_KEY=YOUR_API_KEY_HERE" > .env
    echo "  ⚠️ Action Required: Please update backend/.env with your Google API Key."
fi

# 3. Setup Frontend
echo "💻 Setting up Frontend..."
cd "$PROJECT_ROOT/frontend"

echo "  - Installing Node dependencies..."
npm install

echo ""
echo "✨ Setup Complete!"
echo "-------------------------------------------------------"
echo "🚀 To run the project:"
echo "   1. Ensure your GOOGLE_API_KEY is in backend/.env"
echo "   2. Run: ./run.sh"
echo "-------------------------------------------------------"
