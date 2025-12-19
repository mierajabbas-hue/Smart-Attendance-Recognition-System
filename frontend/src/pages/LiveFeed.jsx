import { useState, useEffect, useRef } from 'react';
import { Video, Camera, AlertCircle, RefreshCw, Play, Square, Monitor, Webcam } from 'lucide-react';
import toast from 'react-hot-toast';
import { cameraAPI } from '../services/api';

const LiveFeed = () => {
  const [cameraInfo, setCameraInfo] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [recognizing, setRecognizing] = useState(false);
  const [lastRecognition, setLastRecognition] = useState(null);

  // Browser camera states
  const [useBrowserCamera, setUseBrowserCamera] = useState(true); // Default to browser camera
  const [browserCameraActive, setBrowserCameraActive] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    fetchCameraInfo();
    const interval = setInterval(fetchCameraInfo, 5000);
    return () => {
      clearInterval(interval);
      stopBrowserCamera();
    };
  }, []);

  const fetchCameraInfo = async () => {
    try {
      const info = await cameraAPI.getInfo();
      setCameraInfo(info);
      setIsRunning(info.is_running);
    } catch (error) {
      console.error('Failed to fetch camera info');
    } finally {
      setLoading(false);
    }
  };

  // Browser camera functions
  const startBrowserCamera = async () => {
    try {
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
        toast.success('Browser camera started');
      }
    } catch (error) {
      console.error('Error accessing browser camera:', error);
      toast.error('Failed to access camera. Please allow camera access in your browser.');
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
      toast.success('Browser camera stopped');
    }
  };

  const captureBrowserFrame = async () => {
    if (!videoRef.current || !browserCameraActive) {
      toast.error('Browser camera is not active');
      return;
    }

    setRecognizing(true);
    try {
      // Create canvas to capture frame
      const canvas = canvasRef.current || document.createElement('canvas');
      const video = videoRef.current;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);

      // Convert canvas to blob
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.95));

      // Send to backend
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

  // Server camera functions
  const handleStartCamera = async () => {
    try {
      await cameraAPI.start(0);
      toast.success('Server camera started');
      setIsRunning(true);
      fetchCameraInfo();
    } catch (error) {
      toast.error('Failed to start camera: ' + (error.response?.data?.detail || 'Server camera not available'));
    }
  };

  const handleStopCamera = async () => {
    try {
      await cameraAPI.stop();
      toast.success('Server camera stopped');
      setIsRunning(false);
      fetchCameraInfo();
    } catch (error) {
      toast.error('Failed to stop camera');
    }
  };

  const handleRecognize = async () => {
    if (useBrowserCamera) {
      await captureBrowserFrame();
    } else {
      setRecognizing(true);
      try {
        const result = await cameraAPI.recognize();
        setLastRecognition(result);
        toast.success(`Recognized ${result.recognized} faces`);
      } catch (error) {
        toast.error('Failed to perform recognition');
      } finally {
        setRecognizing(false);
      }
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

  const toggleCameraMode = () => {
    if (useBrowserCamera) {
      stopBrowserCamera();
    } else if (isRunning) {
      handleStopCamera();
    }
    setUseBrowserCamera(!useBrowserCamera);
  };

  const isCameraActive = useBrowserCamera ? browserCameraActive : isRunning;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Live Camera Feed</h1>
        <p className="text-gray-600 mt-1">Real-time face recognition and attendance logging</p>
      </div>

      {/* Camera Mode Toggle */}
      <div className="card bg-blue-50 border border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-blue-900 mb-1">Camera Mode</h3>
            <p className="text-sm text-blue-700">
              {useBrowserCamera ? 'Using your device camera (Browser)' : 'Using server camera'}
            </p>
          </div>
          <button
            onClick={toggleCameraMode}
            className="btn btn-secondary flex items-center"
          >
            {useBrowserCamera ? <Monitor className="w-5 h-5 mr-2" /> : <Webcam className="w-5 h-5 mr-2" />}
            Switch to {useBrowserCamera ? 'Server' : 'Browser'} Camera
          </button>
        </div>
      </div>

      {/* Camera Controls */}
      <div className="card">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isCameraActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm font-medium text-gray-700">
              {isCameraActive ? 'Camera Active' : 'Camera Inactive'}
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

          {isCameraActive ? (
            <button
              onClick={useBrowserCamera ? stopBrowserCamera : handleStopCamera}
              className="btn btn-danger flex items-center"
            >
              <Square className="w-5 h-5 mr-2" />
              Stop Camera
            </button>
          ) : (
            <button
              onClick={useBrowserCamera ? startBrowserCamera : handleStartCamera}
              className="btn btn-primary flex items-center"
            >
              <Play className="w-5 h-5 mr-2" />
              Start Camera
            </button>
          )}

          <button
            onClick={handleRecognize}
            disabled={!isCameraActive || recognizing}
            className="btn btn-primary flex items-center disabled:opacity-50"
          >
            <Camera className="w-5 h-5 mr-2" />
            {recognizing ? 'Recognizing...' : 'Recognize Now'}
          </button>
        </div>

        {!useBrowserCamera && cameraInfo && (
          <div className="mt-4 pt-4 border-t grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-500">Camera ID</p>
              <p className="text-lg font-semibold text-gray-900">{cameraInfo.camera_id}</p>
            </div>
            {cameraInfo.width && (
              <>
                <div>
                  <p className="text-sm text-gray-500">Resolution</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {cameraInfo.width}x{cameraInfo.height}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">FPS</p>
                  <p className="text-lg font-semibold text-gray-900">{cameraInfo.fps}</p>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Video Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {useBrowserCamera ? 'Browser Camera' : 'Server Camera Feed'}
            </h2>
            <div className="bg-gray-900 rounded-lg overflow-hidden aspect-video flex items-center justify-center">
              {useBrowserCamera ? (
                browserCameraActive ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-contain transform scale-x-[-1]"
                  />
                ) : (
                  <div className="text-center">
                    <Webcam className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">Browser camera is not active</p>
                    <p className="text-sm text-gray-500 mt-2">Click "Start Camera" to begin</p>
                  </div>
                )
              ) : (
                isCameraActive ? (
                  <img
                    src={cameraAPI.getFeedUrl()}
                    alt="Live Camera Feed"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="text-center">
                    <Video className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">Server camera is not active</p>
                    <p className="text-sm text-gray-500 mt-2">Click "Start Camera" to begin</p>
                  </div>
                )
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
              <li>1. Choose camera mode (Browser or Server)</li>
              <li>2. Start the camera to begin live feed</li>
              <li>3. Click "Recognize Now" to detect faces</li>
              <li>4. Attendance is logged automatically</li>
              <li>5. Unknown faces are recorded separately</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveFeed;
