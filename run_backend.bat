@echo off

echo === Smart Attendance System - Backend Server ===
echo.

REM Check if virtual environment exists
if not exist "venv" (
    echo Virtual environment not found. Creating...
    python -m venv venv
    echo Virtual environment created.
)

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate

REM Check if requirements are installed
python -c "import fastapi" 2>nul
if errorlevel 1 (
    echo Installing dependencies...
    pip install -r requirements.txt
)

REM Check if database is initialized
if not exist "database\attendance.db" (
    echo Initializing database...
    python -c "from backend.database.connection import init_db; init_db()"
)

REM Start the server
echo.
echo Starting backend server...
echo API will be available at: http://localhost:8000
echo API docs available at: http://localhost:8000/docs
echo.
echo Press Ctrl+C to stop the server
echo.

cd backend && python main.py
