import { useState, useEffect } from 'react';
import { Video, Camera, AlertCircle, RefreshCw, Play, Square } from 'lucide-react';
import toast from 'react-hot-toast';
import { cameraAPI } from '../services/api';

const LiveFeed = () => {
  const [cameraInfo, setCameraInfo] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [recognizing, setRecognizing] = useState(false);
  const [lastRecognition, setLastRecognition] = useState(null);

  useEffect(() => {
    fetchCameraInfo();
    const interval = setInterval(fetchCameraInfo, 5000);
    return () => clearInterval(interval);
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

  const handleStartCamera = async () => {
    try {
      await cameraAPI.start(0);
      toast.success('Camera started');
      setIsRunning(true);
      fetchCameraInfo();
    } catch (error) {
      toast.error('Failed to start camera');
    }
  };

  const handleStopCamera = async () => {
    try {
      await cameraAPI.stop();
      toast.success('Camera stopped');
      setIsRunning(false);
      fetchCameraInfo();
    } catch (error) {
      toast.error('Failed to stop camera');
    }
  };

  const handleRecognize = async () => {
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
            <div className={`w-3 h-3 rounded-full ${isRunning ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm font-medium text-gray-700">
              {isRunning ? 'Camera Active' : 'Camera Inactive'}
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

          {isRunning ? (
            <button
              onClick={handleStopCamera}
              className="btn btn-danger flex items-center"
            >
              <Square className="w-5 h-5 mr-2" />
              Stop Camera
            </button>
          ) : (
            <button
              onClick={handleStartCamera}
              className="btn btn-primary flex items-center"
            >
              <Play className="w-5 h-5 mr-2" />
              Start Camera
            </button>
          )}

          <button
            onClick={handleRecognize}
            disabled={!isRunning || recognizing}
            className="btn btn-primary flex items-center disabled:opacity-50"
          >
            <Camera className="w-5 h-5 mr-2" />
            {recognizing ? 'Recognizing...' : 'Recognize Now'}
          </button>
        </div>

        {cameraInfo && (
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
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Live Feed</h2>
            <div className="bg-gray-900 rounded-lg overflow-hidden aspect-video flex items-center justify-center">
              {isRunning ? (
                <img
                  src={cameraAPI.getFeedUrl()}
                  alt="Live Camera Feed"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-center">
                  <Video className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">Camera is not active</p>
                  <p className="text-sm text-gray-500 mt-2">Click "Start Camera" to begin</p>
                </div>
              )}
            </div>
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
              <li>1. Start the camera to begin live feed</li>
              <li>2. Click "Recognize Now" to detect faces</li>
              <li>3. Attendance is logged automatically</li>
              <li>4. Unknown faces are recorded separately</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveFeed;
