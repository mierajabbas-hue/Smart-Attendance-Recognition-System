#!/bin/bash

# Script to run the backend server

echo "=== Smart Attendance System - Backend Server ==="
echo ""

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Virtual environment not found. Creating..."
    python3 -m venv venv
    echo "Virtual environment created."
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Check if requirements are installed
if ! python -c "import fastapi" 2>/dev/null; then
    echo "Installing dependencies..."
    pip install -r requirements.txt
fi

# Check if database is initialized
if [ ! -f "database/attendance.db" ]; then
    echo "Initializing database..."
    python -c "from backend.database.connection import init_db; init_db()"
fi

# Start the server
echo ""
echo "Starting backend server..."
echo "API will be available at: http://localhost:8000"
echo "API docs available at: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

cd backend && python main.py
