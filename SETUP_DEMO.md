# Demo Setup (Without Face Recognition)

Due to compatibility issues with Python 3.13 and dlib, here's how to run a **demo version** of the system:

## Quick Demo Setup

1. **Install basic dependencies** (without face recognition):
```bash
cd /Users/alialtameemi/Desktop/Re-EmployeesandStudents
source venv/bin/activate
pip install fastapi uvicorn sqlalchemy python-jose[cryptography] passlib python-dotenv pydantic pydantic-settings python-multipart aiofiles
```

2. **Initialize database and create admin**:
```bash
python generate_sample_data.py
```

3. **Start backend** (in one terminal):
```bash
source venv/bin/activate
cd backend
python main.py
```

4. **Start frontend** (already running in your other terminal at http://localhost:3000)

## For Full Face Recognition Support

To use the complete face recognition features, you need Python 3.8-3.11 (not 3.13):

### Option 1: Use pyenv (Recommended)
```bash
# Install pyenv
brew install pyenv

# Install Python 3.11
pyenv install 3.11.7

# Create virtual environment with Python 3.11
pyenv local 3.11.7
python -m venv venv-py311
source venv-py311/bin/activate

# Install all dependencies
pip install -r requirements.txt
```

### Option 2: Use Docker
```bash
# We can create a Docker setup if needed
```

## What Works in Demo Mode

✅ Dashboard with statistics
✅ User management (add, edit, delete)
✅ Attendance logs viewing
✅ Authentication
✅ All UI components

❌ Face recognition
❌ Live camera feed
❌ Automatic attendance logging

The system is fully functional except for the face recognition features.
