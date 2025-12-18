#!/bin/bash

# Get the absolute path of the project directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🚀 Starting Chatbot Project..."

# Function to kill background processes on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down servers..."
    kill $(jobs -p)
    exit
}

trap cleanup SIGINT SIGTERM

# 1. Start Backend
echo "📦 Starting Backend (FastAPI) on http://localhost:8000..."
cd "$PROJECT_ROOT/backend"
if [ -d ".venv" ]; then
    source .venv/bin/activate
else
    echo "⚠️ Warning: .venv not found. Attempting to run with system python..."
fi
python -m app.main &

# 2. Start Frontend
echo "💻 Starting Frontend (Vite) on http://localhost:5173..."
cd "$PROJECT_ROOT/frontend"
npm run dev &

echo "✅ Both servers are starting up!"
echo "   - Frontend: http://localhost:5173"
echo "   - Backend/Widget: http://localhost:8000"
echo "   - Test Widget: http://localhost:8000/widget/chat-widget-test.html"
echo ""
echo "Press Ctrl+C to stop both servers."

# Keep script running to wait for background jobs
wait
