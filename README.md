# Smart Attendance & Recognition System

A real-time face recognition system using OpenCV and Python that identifies employees and students through webcam or CCTV feed. The system logs attendance, tracks entry/exit times, and displays live analytics on an interactive dashboard.

## Features

### Core Features
- **Real-Time Face Recognition**: Uses OpenCV and face_recognition library for accurate face detection and recognition
- **Webcam/IP Camera Support**: Capture video streams from webcam or IP cameras
- **Automatic Attendance Logging**: Logs attendance with timestamps when faces are recognized
- **Unknown Face Detection**: Handles and logs unrecognized faces
- **Interactive Dashboard**: Real-time analytics and statistics
- **User Management**: Register new users with face embeddings
- **Live Camera Feed**: View live camera feed with face detection bounding boxes
- **Attendance Reports**: Export attendance logs to CSV format

### Security Features
- JWT-based authentication for dashboard access
- Secure storage of face embeddings
- Role-based access control (Admin authentication)

## Tech Stack

### Backend
- **Framework**: FastAPI
- **Database**: SQLite (default) / PostgreSQL
- **Face Recognition**: OpenCV, face_recognition, dlib
- **Authentication**: JWT tokens, bcrypt
- **ORM**: SQLAlchemy

### Frontend
- **Framework**: React.js with Vite
- **Routing**: React Router
- **Styling**: Tailwind CSS
- **Charts**: Chart.js with react-chartjs-2
- **Icons**: Lucide React
- **HTTP Client**: Axios
- **Notifications**: React Hot Toast

## Project Structure

```
Re-EmployeesandStudents/
├── backend/
│   ├── api/                    # API endpoints
│   │   ├── auth.py            # Authentication routes
│   │   ├── users.py           # User management routes
│   │   ├── attendance.py      # Attendance routes
│   │   └── camera.py          # Camera and live feed routes
│   ├── database/              # Database configuration
│   │   └── connection.py      # SQLAlchemy setup
│   ├── models/                # Data models
│   │   ├── models.py          # SQLAlchemy models
│   │   └── schemas.py         # Pydantic schemas
│   ├── services/              # Business logic
│   │   ├── face_recognition_service.py
│   │   └── camera_service.py
│   ├── utils/                 # Utilities
│   │   └── auth.py           # JWT and password utilities
│   ├── config.py             # Configuration settings
│   └── main.py               # FastAPI application
├── frontend/
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── pages/            # Page components
│   │   ├── services/         # API services
│   │   ├── App.jsx          # Main app component
│   │   └── main.jsx         # Entry point
│   ├── package.json
│   └── vite.config.js
├── models/
│   └── face_embeddings/      # Stored face encodings
├── database/                  # SQLite database
├── uploads/                   # User photos
├── logs/                      # Application logs
├── requirements.txt           # Python dependencies
├── .env.example              # Environment variables template
└── README.md                 # This file
```

## Installation

### Prerequisites
- Python 3.8 or higher
- Node.js 16 or higher
- Webcam or IP camera
- CMake (required for dlib installation)

### Backend Setup

1. **Create and activate virtual environment**
```bash
python -m venv venv

# On macOS/Linux
source venv/bin/activate

# On Windows
venv\Scripts\activate
```

2. **Install Python dependencies**
```bash
pip install -r requirements.txt
```

**Note for dlib installation issues:**
- macOS: `brew install cmake`
- Ubuntu/Debian: `sudo apt-get install cmake build-essential`
- Windows: Install Visual Studio Build Tools

3. **Configure environment variables**
```bash
cp .env.example .env
# Edit .env with your settings
```

4. **Initialize the database**
```bash
python -c "from backend.database.connection import init_db; init_db()"
```

5. **Create an admin user**
```bash
python -c "
from backend.database.connection import SessionLocal
from backend.models.models import Admin
from backend.utils.auth import get_password_hash

db = SessionLocal()
admin = Admin(
    username='admin',
    email='admin@example.com',
    full_name='System Administrator',
    hashed_password=get_password_hash('admin123'),
    is_superuser=True
)
db.add(admin)
db.commit()
print('Admin user created: username=admin, password=admin123')
"
```

6. **Start the backend server**
```bash
cd backend
python main.py
```

The API will be available at `http://localhost:8000`
API documentation at `http://localhost:8000/docs`

### Frontend Setup

1. **Install Node.js dependencies**
```bash
cd frontend
npm install
```

2. **Start the development server**
```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`

## Usage

### 1. Login to Dashboard
- Navigate to `http://localhost:3000/login`
- Use the admin credentials created during setup
- Default: `username: admin`, `password: admin123`

### 2. Register Users
- Go to **Users** page
- Click **Add User** button
- Fill in user details:
  - User ID (e.g., EMP001, STU001)
  - Name
  - Email (optional)
  - Role (Employee or Student)
  - Department/Class
  - Upload a clear photo with only one face
- Click **Create User**

### 3. Start Live Recognition
- Go to **Live Feed** page
- Click **Start Camera** to activate webcam
- Click **Recognize Now** to detect and log attendance
- View real-time recognition results

### 4. View Attendance
- Go to **Attendance** page
- Filter logs by date range
- Export attendance reports to CSV

### 5. View Dashboard Analytics
- Go to **Dashboard** page
- View real-time statistics:
  - Total users, employees, students
  - Today's attendance
  - Attendance rate
  - Unknown faces detected
- Charts showing distribution and trends

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register admin user
- `POST /api/v1/auth/login` - Login and get JWT token
- `GET /api/v1/auth/me` - Get current admin info

### Users
- `GET /api/v1/users/` - Get all users
- `POST /api/v1/users/` - Create new user with face encoding
- `GET /api/v1/users/{id}` - Get user by ID
- `PUT /api/v1/users/{id}` - Update user
- `DELETE /api/v1/users/{id}` - Delete user

### Attendance
- `GET /api/v1/attendance/` - Get attendance logs
- `POST /api/v1/attendance/` - Log attendance
- `GET /api/v1/attendance/stats` - Get attendance statistics
- `GET /api/v1/attendance/dashboard` - Get dashboard stats
- `GET /api/v1/attendance/user/{id}` - Get user attendance history

### Camera
- `GET /api/v1/camera/feed` - Live video stream
- `GET /api/v1/camera/info` - Get camera info
- `POST /api/v1/camera/start` - Start camera
- `POST /api/v1/camera/stop` - Stop camera
- `POST /api/v1/camera/recognize` - Recognize faces and log attendance
- `GET /api/v1/camera/reload-faces` - Reload face encodings

## Configuration

### Environment Variables (.env)

```env
# Database
DATABASE_URL=sqlite:///./database/attendance.db
# For PostgreSQL: postgresql://user:password@localhost/dbname

# Security
SECRET_KEY=your-secret-key-change-in-production
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Face Recognition
FACE_RECOGNITION_TOLERANCE=0.6
FACE_DETECTION_MODEL=hog  # or "cnn" for GPU
NUM_JITTERS=1
FACE_ENCODING_MODEL=large

# Camera
CAMERA_ID=0  # Default webcam (0), or IP camera URL
CAMERA_WIDTH=640
CAMERA_HEIGHT=480
CAMERA_FPS=30
```

### Face Recognition Parameters

- **FACE_RECOGNITION_TOLERANCE** (0.0-1.0): Lower = stricter matching, Higher = more lenient
  - Recommended: 0.6 for general use
  - Use 0.5 for higher security
  - Use 0.7 for less strict matching

- **FACE_DETECTION_MODEL**:
  - `hog`: Faster, CPU-based (recommended for webcams)
  - `cnn`: More accurate, requires GPU

## Troubleshooting

### Camera Issues
- **Camera not opening**: Check camera permissions and CAMERA_ID
- **Low FPS**: Reduce resolution or use 'hog' detection model
- **Multiple cameras**: Change CAMERA_ID to 1, 2, etc.

### Face Recognition Issues
- **No face detected**: Ensure good lighting and clear face visibility
- **Poor recognition accuracy**: Adjust FACE_RECOGNITION_TOLERANCE
- **Multiple faces in registration**: Upload photo with single face only

### Installation Issues
- **dlib installation fails**: Install CMake and build tools
- **OpenCV issues**: Install system dependencies for video capture
- **Database errors**: Ensure database directory exists and has write permissions

## Development

### Run Tests
```bash
# Backend tests
pytest tests/

# Frontend tests
cd frontend
npm test
```

### Build for Production

**Backend:**
```bash
# Use gunicorn or uvicorn
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --workers 4
```

**Frontend:**
```bash
cd frontend
npm run build
# Serve the dist/ folder with nginx or similar
```

## Security Considerations

1. **Change default credentials** immediately after installation
2. **Use strong SECRET_KEY** in production
3. **Enable HTTPS** for production deployment
4. **Regularly backup** face embeddings and database
5. **Implement rate limiting** for API endpoints
6. **Review and audit** attendance logs regularly

## Future Enhancements

- [ ] Mask detection
- [ ] Emotion recognition
- [ ] Email/Slack notifications for unknown faces
- [ ] Multi-camera support
- [ ] Mobile app
- [ ] Advanced analytics and reporting
- [ ] Integration with HR systems
- [ ] Temperature screening integration

## License

This project is licensed under the MIT License.

## Support

For issues and questions:
- Create an issue in the repository
- Check the troubleshooting section
- Review API documentation at `/docs`

## Credits

Built with:
- [FastAPI](https://fastapi.tiangolo.com/)
- [face_recognition](https://github.com/ageitgey/face_recognition)
- [OpenCV](https://opencv.org/)
- [React](https://reactjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
