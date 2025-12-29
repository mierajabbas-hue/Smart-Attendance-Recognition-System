import { useState, useEffect, useRef } from 'react';
import { Camera, AlertCircle, RefreshCw, Play, Square, Webcam } from 'lucide-react';
import toast from 'react-hot-toast';
import { cameraAPI } from '../services/api';

const LiveFeed = () => {
  const [recognizing, setRecognizing] = useState(false);
  const [lastRecognition, setLastRecognition] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    // Auto-start camera when page loads
    startCamera();

    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      // Check if browser supports camera
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast.error('Camera access is not supported in your browser. Please use Chrome, Firefox, or Safari.');
        return;
      }

      // Request camera access
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
        setCameraActive(true);
        toast.success('Camera started successfully!');
      }
    } catch (error) {
      console.error('Error accessing camera:', error);

      // Provide specific error messages
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        toast.error('Camera permission denied. Please click the camera icon in your browser address bar and allow camera access, then refresh the page.');
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
            setCameraActive(true);
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

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      setCameraActive(false);
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      toast.success('Camera stopped');
    }
  };

  const handleRecognize = async () => {
    if (!videoRef.current || !cameraActive) {
      toast.error('Camera is not active. Please start the camera first.');
      return;
    }

    setRecognizing(true);
    try {
      // Capture frame from video
      const canvas = canvasRef.current || document.createElement('canvas');
      const video = videoRef.current;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);

      // Convert canvas to blob
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.95));

      // Send to backend for recognition
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
        <p className="text-gray-600 mt-1">Real-time face recognition and attendance logging using your computer camera</p>
      </div>

      {/* Important Notice */}
      {!cameraActive && (
        <div className="card bg-yellow-50 border border-yellow-200">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-yellow-900 mb-1">Camera Permission Required</h3>
              <p className="text-sm text-yellow-800 mb-2">
                This page requires access to your computer's camera. When you click "Start Camera",
                your browser will ask for permission.
              </p>
              <p className="text-xs text-yellow-700">
                💡 <strong>Tip:</strong> Look for a popup at the top of your browser or a camera icon in the address bar, then click "Allow".
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Camera Controls */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <h2 className="text-2xl font-bold text-gray-900">Camera Feed</h2>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${cameraActive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
              <span className="text-sm font-medium text-gray-700">
                {cameraActive ? 'Live' : 'Inactive'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleReloadFaces}
              className="btn btn-secondary flex items-center"
            >
              <RefreshCw className="w-5 h-5 mr-2" />
              Reload Faces
            </button>

            {cameraActive ? (
              <button
                onClick={stopCamera}
                className="btn btn-danger flex items-center"
              >
                <Square className="w-5 h-5 mr-2" />
                Stop Camera
              </button>
            ) : (
              <button
                onClick={startCamera}
                className="btn btn-primary flex items-center"
              >
                <Play className="w-5 h-5 mr-2" />
                Start Camera
              </button>
            )}

            <button
              onClick={handleRecognize}
              disabled={!cameraActive || recognizing}
              className="btn btn-primary flex items-center disabled:opacity-50"
            >
              <Camera className="w-5 h-5 mr-2" />
              {recognizing ? 'Recognizing...' : 'Recognize Now'}
            </button>
          </div>
        </div>

        <div className="bg-gray-900 rounded-lg overflow-hidden" style={{ minHeight: '500px' }}>
          {cameraActive ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-contain transform scale-x-[-1]"
              style={{ minHeight: '500px' }}
            />
          ) : (
            <div className="flex items-center justify-center h-full" style={{ minHeight: '500px' }}>
              <div className="text-center">
                <Webcam className="w-20 h-20 text-gray-600 mx-auto mb-4" />
                <p className="text-xl text-gray-400 mb-2">Camera is not active</p>
                <p className="text-sm text-gray-500 mb-4">Click "Start Camera" to begin face recognition</p>
                <button
                  onClick={startCamera}
                  className="btn btn-primary inline-flex items-center"
                >
                  <Play className="w-5 h-5 mr-2" />
                  Start Camera
                </button>
              </div>
            </div>
          )}
        </div>
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Recognition Results & Instructions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Last Recognition Results</h2>
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
        </div>

        <div className="card bg-blue-50 border border-blue-200">
          <h3 className="text-xl font-semibold text-blue-900 mb-3">How to Use</h3>
          <ul className="text-sm text-blue-800 space-y-2">
            <li className="flex items-start">
              <span className="font-bold mr-2">1.</span>
              <span>Click "Start Camera" to activate your computer's camera</span>
            </li>
            <li className="flex items-start">
              <span className="font-bold mr-2">2.</span>
              <span>Allow browser access to your camera when prompted</span>
            </li>
            <li className="flex items-start">
              <span className="font-bold mr-2">3.</span>
              <span>Position yourself or others in front of the camera</span>
            </li>
            <li className="flex items-start">
              <span className="font-bold mr-2">4.</span>
              <span>Click "Recognize Now" to detect and identify faces</span>
            </li>
            <li className="flex items-start">
              <span className="font-bold mr-2">5.</span>
              <span>Attendance is logged automatically for recognized users</span>
            </li>
          </ul>

          <div className="mt-4 pt-4 border-t border-blue-300">
            <h4 className="text-sm font-semibold text-blue-900 mb-2">💡 Tips:</h4>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• Make sure you're in a well-lit area</li>
              <li>• Look directly at the camera for best results</li>
              <li>• The video is mirrored (flipped) like a mirror</li>
              <li>• You can recognize multiple people at once</li>
              <li>• Click "Reload Faces" after adding new users</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveFeed;
