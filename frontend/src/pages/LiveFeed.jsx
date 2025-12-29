import { useState, useRef } from 'react';
import { Camera, AlertCircle, RefreshCw, Upload, X, Image } from 'lucide-react';
import toast from 'react-hot-toast';
import { cameraAPI } from '../services/api';

const LiveFeed = () => {
  const [recognizing, setRecognizing] = useState(false);
  const [lastRecognition, setLastRecognition] = useState(null);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file');
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Image size must be less than 10MB');
        return;
      }

      setUploadedImage(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);

      toast.success('Image uploaded successfully');
    }
  };

  const handleRecognize = async () => {
    if (!uploadedImage) {
      toast.error('Please upload an image first');
      return;
    }

    setRecognizing(true);
    try {
      const result = await cameraAPI.recognizeUpload(uploadedImage);
      setLastRecognition(result);

      if (result.recognized > 0) {
        toast.success(`Recognized ${result.recognized} face(s)! Attendance logged.`);
      } else if (result.total_faces > 0) {
        toast.warning(`Detected ${result.total_faces} unknown face(s)`);
      } else {
        toast.info('No faces detected in the image');
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

  const handleClearImage = () => {
    setUploadedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Face Recognition</h1>
        <p className="text-gray-600 mt-1">Upload a photo to recognize faces and log attendance</p>
      </div>

      {/* Upload Section */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <h2 className="text-2xl font-bold text-gray-900">Upload Photo</h2>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${uploadedImage ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
              <span className="text-sm font-medium text-gray-700">
                {uploadedImage ? 'Image Ready' : 'No Image'}
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

            {uploadedImage && (
              <button
                onClick={handleClearImage}
                className="btn btn-danger flex items-center"
              >
                <X className="w-5 h-5 mr-2" />
                Clear Image
              </button>
            )}

            <button
              onClick={() => fileInputRef.current?.click()}
              className="btn btn-primary flex items-center"
            >
              <Upload className="w-5 h-5 mr-2" />
              Choose Image
            </button>

            <button
              onClick={handleRecognize}
              disabled={!uploadedImage || recognizing}
              className="btn btn-primary flex items-center disabled:opacity-50"
            >
              <Camera className="w-5 h-5 mr-2" />
              {recognizing ? 'Recognizing...' : 'Recognize Faces'}
            </button>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />

        <div className="bg-gray-900 rounded-lg overflow-hidden" style={{ minHeight: '500px' }}>
          {imagePreview ? (
            <img
              src={imagePreview}
              alt="Uploaded for recognition"
              className="w-full h-full object-contain"
              style={{ minHeight: '500px' }}
            />
          ) : (
            <div className="flex items-center justify-center h-full" style={{ minHeight: '500px' }}>
              <div className="text-center">
                <Image className="w-20 h-20 text-gray-600 mx-auto mb-4" />
                <p className="text-xl text-gray-400 mb-2">No image uploaded</p>
                <p className="text-sm text-gray-500">Click "Choose Image" to upload a photo for face recognition</p>
              </div>
            </div>
          )}
        </div>
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
              <span>Click "Choose Image" to select a photo from your computer</span>
            </li>
            <li className="flex items-start">
              <span className="font-bold mr-2">2.</span>
              <span>The image will be displayed in the preview area</span>
            </li>
            <li className="flex items-start">
              <span className="font-bold mr-2">3.</span>
              <span>Click "Recognize Faces" to detect and identify people in the photo</span>
            </li>
            <li className="flex items-start">
              <span className="font-bold mr-2">4.</span>
              <span>Attendance is logged automatically for recognized users</span>
            </li>
            <li className="flex items-start">
              <span className="font-bold mr-2">5.</span>
              <span>Unknown faces are recorded separately for review</span>
            </li>
          </ul>

          <div className="mt-4 pt-4 border-t border-blue-300">
            <h4 className="text-sm font-semibold text-blue-900 mb-2">💡 Tips:</h4>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• Use clear, well-lit photos for best results</li>
              <li>• Photos can contain multiple people</li>
              <li>• Supported formats: JPG, PNG, GIF</li>
              <li>• Maximum file size: 10MB</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveFeed;
