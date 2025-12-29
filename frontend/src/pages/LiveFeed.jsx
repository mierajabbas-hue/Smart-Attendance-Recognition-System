import { useState, useEffect, useRef } from 'react';
import { Camera, AlertCircle, RefreshCw, Play, Square, Webcam } from 'lucide-react';
import toast from 'react-hot-toast';
import { cameraAPI } from '../services/api';

const LiveFeed = () => {
  const [recognizing, setRecognizing] = useState(false);
  const [lastRecognition, setLastRecognition] = useState(null);
  const [browserCameraActive, setBrowserCameraActive] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    return () => {
      stopBrowserCamera();
    };
  }, []);

  const startBrowserCamera = async () => {
    try {
      // Check if mediaDevices is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast.error('Camera access is not supported in your browser. Please use a modern browser like Chrome, Firefox, or Safari.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setBrowserCameraActive(true);
        toast.success('Camera started successfully!');
      }
    } catch (error) {
      console.error('Error accessing camera:', error);

      // Provide specific error messages based on error type
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        toast.error('Camera permission denied. Please click the camera icon in your browser address bar and allow camera access.');
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        toast.error('No camera found. Please make sure your device has a camera connected.');
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        toast.error('Camera is already in use by another application. Please close other apps using the camera.');
      } else if (error.name === 'OverconstrainedError') {
        toast.error('Camera does not support the requested settings. Trying with default settings...');
        // Retry with simpler constraints
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            streamRef.current = stream;
            setBrowserCameraActive(true);
            toast.success('Camera started with default settings!');
          }
        } catch (retryError) {
          toast.error('Failed to start camera even with default settings.');
        }
      } else if (error.name === 'SecurityError') {
        toast.error('Camera access blocked due to security settings. Make sure you are using HTTPS.');
      } else {
        toast.error(`Failed to access camera: ${error.message}`);
      }
    }
  };

  const stopBrowserCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      setBrowserCameraActive(false);
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      toast.success('Camera stopped');
    }
  };

  const handleRecognize = async () => {
    if (!videoRef.current || !browserCameraActive) {
      toast.error('Camera is not active');
      return;
    }

    setRecognizing(true);
    try {
      const canvas = canvasRef.current || document.createElement('canvas');
      const video = videoRef.current;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);

      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.95));
      const result = await cameraAPI.recognizeUpload(blob);
      setLastRecognition(result);

      if (result.recognized > 0) {
        toast.success(`Recognized ${result.recognized} face(s)! Attendance logged.`);
      } else if (result.total_faces > 0) {
        toast.warning(`Detected ${result.total_faces} unknown face(s)`);
      } else {
        toast.info('No faces detected');
      }
    } catch (error) {
      console.error('Recognition error:', error);
      toast.error('Failed to perform recognition');
    } finally {
      setRecognizing(false);
    }
  };

  const handleReloadFaces = async () => {
    try {
      const result = await cameraAPI.reloadFaces();
      toast.success(`Reloaded ${result.total_faces} face encodings`);
    } catch (error) {
      toast.error('Failed to reload faces');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Live Camera Feed</h1>
        <p className="text-gray-600 mt-1">Real-time face recognition and attendance logging</p>
      </div>

      {/* Camera Controls */}
      <div className="card">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${browserCameraActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm font-medium text-gray-700">
              {browserCameraActive ? 'Camera Active' : 'Camera Inactive'}
            </span>
          </div>

          <div className="flex-1"></div>

          <button
            onClick={handleReloadFaces}
            className="btn btn-secondary flex items-center"
          >
            <RefreshCw className="w-5 h-5 mr-2" />
            Reload Faces
          </button>

          {browserCameraActive ? (
            <button
              onClick={stopBrowserCamera}
              className="btn btn-danger flex items-center"
            >
              <Square className="w-5 h-5 mr-2" />
              Stop Camera
            </button>
          ) : (
            <button
              onClick={startBrowserCamera}
              className="btn btn-primary flex items-center"
            >
              <Play className="w-5 h-5 mr-2" />
              Start Camera
            </button>
          )}

          <button
            onClick={handleRecognize}
            disabled={!browserCameraActive || recognizing}
            className="btn btn-primary flex items-center disabled:opacity-50"
          >
            <Camera className="w-5 h-5 mr-2" />
            {recognizing ? 'Recognizing...' : 'Recognize Now'}
          </button>
        </div>
      </div>

      {/* Video Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Camera Feed</h2>
            <div className="bg-gray-900 rounded-lg overflow-hidden aspect-video flex items-center justify-center">
              {browserCameraActive ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-contain transform scale-x-[-1]"
                />
              ) : (
                <div className="text-center">
                  <Webcam className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">Camera is not active</p>
                  <p className="text-sm text-gray-500 mt-2">Click "Start Camera" to begin</p>
                </div>
              )}
            </div>
            <canvas ref={canvasRef} className="hidden" />
          </div>
        </div>

        {/* Recognition Results */}
        <div className="space-y-4">
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Last Recognition</h2>
            {lastRecognition ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <span className="text-sm font-medium text-green-900">Total Faces</span>
                  <span className="text-2xl font-bold text-green-600">{lastRecognition.total_faces}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <span className="text-sm font-medium text-blue-900">Recognized</span>
                  <span className="text-2xl font-bold text-blue-600">{lastRecognition.recognized}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                  <span className="text-sm font-medium text-orange-900">Unknown</span>
                  <span className="text-2xl font-bold text-orange-600">{lastRecognition.unknown}</span>
                </div>

                {lastRecognition.logged_users && lastRecognition.logged_users.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Logged Users</h3>
                    <div className="space-y-2">
                      {lastRecognition.logged_users.map((name, idx) => (
                        <div key={idx} className="p-2 bg-gray-50 rounded text-sm">
                          {name}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No recognition performed yet</p>
              </div>
            )}
          </div>

          <div className="card bg-blue-50 border border-blue-200">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">How it works</h3>
            <ul className="text-sm text-blue-800 space-y-2">
              <li>1. Click "Start Camera" to activate your device camera</li>
              <li>2. Allow browser access to your camera when prompted</li>
              <li>3. Click "Recognize Now" to detect and identify faces</li>
              <li>4. Attendance is logged automatically for recognized users</li>
              <li>5. Unknown faces are recorded separately</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveFeed;
