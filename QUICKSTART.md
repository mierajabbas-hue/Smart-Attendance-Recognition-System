# Quick Start Guide

Get the Smart Attendance & Recognition System up and running in minutes!

## Prerequisites

- Python 3.8+
- Node.js 16+
- Webcam
- CMake (for dlib installation)

## Installation (5 Minutes)

### Step 1: Backend Setup

```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# macOS/Linux:
source venv/bin/activate
# Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp .env.example .env

# Initialize database
python -c "from backend.database.connection import init_db; init_db()"

# Create admin user
python setup_admin.py
# Or generate sample data (includes admin):
python generate_sample_data.py
```

### Step 2: Frontend Setup

```bash
cd frontend
npm install
```

## Running the Application

### Option 1: Using Scripts (Recommended)

**macOS/Linux:**
```bash
# Terminal 1 - Backend
./run_backend.sh

# Terminal 2 - Frontend
cd frontend && npm run dev
```

**Windows:**
```bash
# Terminal 1 - Backend
run_backend.bat

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### Option 2: Manual Start

**Backend:**
```bash
source venv/bin/activate  # or venv\Scripts\activate on Windows
cd backend
python main.py
```

**Frontend:**
```bash
cd frontend
npm run dev
```

## First Steps

1. **Login** at `http://localhost:3000`
   - Default: username=`admin`, password=`admin123` (if you used generate_sample_data.py)

2. **Add Your First User**
   - Go to Users page
   - Click "Add User"
   - Fill in details and upload a clear photo
   - Photo should contain only ONE face

3. **Test Face Recognition**
   - Go to Live Feed page
   - Click "Start Camera"
   - Click "Recognize Now"
   - Your attendance will be logged!

4. **View Analytics**
   - Go to Dashboard to see statistics
   - Go to Attendance to view logs

## Default Admin Credentials

If you ran `generate_sample_data.py`:
- Username: `admin`
- Password: `admin123`

If you ran `setup_admin.py`:
- Use the credentials you entered

## Troubleshooting

### Camera Not Working
- Check camera permissions in system settings
- Try changing `CAMERA_ID` in `.env` (0, 1, 2, etc.)

### dlib Installation Fails
```bash
# macOS
brew install cmake

# Ubuntu/Debian
sudo apt-get install cmake build-essential

# Windows
# Install Visual Studio Build Tools
```

### Face Not Recognized
- Ensure good lighting
- Face the camera directly
- Upload a clear registration photo
- Adjust `FACE_RECOGNITION_TOLERANCE` in `.env` (try 0.7 for less strict)

## What's Next?

- Add more users through the web interface
- Customize camera settings in `.env`
- Export attendance reports as CSV
- Review the full [README.md](README.md) for advanced features

## Quick Commands

```bash
# Create admin user
python setup_admin.py

# Generate test data
python generate_sample_data.py

# Run backend
python backend/main.py

# Run frontend
cd frontend && npm run dev

# View API docs
# Visit http://localhost:8000/docs
```

## Need Help?

- Check [README.md](README.md) for detailed documentation
- Review API docs at `http://localhost:8000/docs`
- Common issues are covered in README troubleshooting section

Enjoy your Smart Attendance System!
