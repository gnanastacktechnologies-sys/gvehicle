import React, { useState, useRef, useEffect } from 'react';
import Modal from './Modal';
import { FaCamera, FaUpload, FaCheck, FaTimes, FaRedo, FaExclamationCircle, FaEdit } from 'react-icons/fa';
import { createWorker } from 'tesseract.js';

const OdometerScannerModal = ({ isOpen, onClose, onConfirm, initialValue = '' }) => {
  const [stream, setStream] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [extractedValue, setExtractedValue] = useState('');
  const [editedValue, setEditedValue] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [cameraActive, setCameraActive] = useState(false);

  const videoRef = useRef(null);
  const fileInputRef = useRef(null);

  // Start Camera Stream
  const startCamera = async () => {
    setError('');
    setCameraActive(true);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraActive(false);
        setError('Camera streaming requires HTTPS or localhost. Please use the "Take Photo / Upload Image" button below to take a picture with your phone camera.');
        return;
      }

      let mediaStream;
      try {
        // Try requesting back camera with ideal constraint
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
        });
      } catch (err) {
        console.warn('Ideal camera request failed, trying fallback standard video stream...', err);
        // Fallback to basic video stream (works on laptops & desktop webcams)
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
      }

      setStream(mediaStream);
    } catch (err) {
      console.warn('Camera access error:', err);
      setCameraActive(false);
      setError('Could not access live camera. Please check camera permissions, privacy shutter, or use the "Take Photo / Upload Image" button below.');
    }
  };

  // Bind mediaStream to videoRef whenever stream or cameraActive updates
  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current
        .play()
        .catch((err) => console.warn('Video play deferred:', err));
    }
  }, [stream, cameraActive]);

  // Stop Camera Stream
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setCameraActive(false);
  };

  useEffect(() => {
    if (isOpen) {
      setCapturedImage(null);
      setExtractedValue('');
      setEditedValue('');
      setError('');
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen]);


let cachedWorkerPromise = null;

const getWorker = async () => {
  if (!cachedWorkerPromise) {
    cachedWorkerPromise = (async () => {
      try {
        const worker = await createWorker('eng');
        await worker.setParameters({
          tessedit_char_whitelist: '0123456789',
        });
        return worker;
      } catch (err) {
        cachedWorkerPromise = null;
        throw err;
      }
    })();
  }
  return cachedWorkerPromise;
};

  // Process image with OCR
  const processImage = async (imageSrc) => {
    setProcessing(true);
    setError('');
    try {
      const worker = await getWorker();
      const { data } = await worker.recognize(imageSrc);

      // Extract all numeric sequences
      const cleanDigits = data.text.replace(/[^0-9]/g, '');
      
      if (cleanDigits) {
        setExtractedValue(cleanDigits);
        setEditedValue(cleanDigits);
      } else {
        setExtractedValue('');
        setEditedValue(initialValue ? String(initialValue) : '');
        setError('Could not clearly detect numbers in the image. Please verify or type manually.');
      }
    } catch (err) {
      console.error('OCR Processing error:', err);
      setExtractedValue('');
      setEditedValue(initialValue ? String(initialValue) : '');
      setError('Failed to scan image. Please enter the odometer reading manually.');
    } finally {
      setProcessing(false);
    }
  };

  // Capture Photo from Video Stream
  const handleCapture = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg');

    stopCamera();
    setCapturedImage(dataUrl);
    processImage(dataUrl);
  };

  // File Upload Fallback
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result;
      if (dataUrl) {
        stopCamera();
        setCapturedImage(dataUrl);
        processImage(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  // Retake Photo
  const handleRetake = () => {
    setCapturedImage(null);
    setExtractedValue('');
    setEditedValue('');
    setError('');
    startCamera();
  };

  // Confirm Final Value
  const handleConfirm = () => {
    const num = Number(editedValue);
    if (isNaN(num) || editedValue === '') {
      setError('Please enter a valid numeric odometer reading.');
      return;
    }
    stopCamera();
    onConfirm(num);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="📷 Scan Vehicle Odometer" maxWidth="max-w-lg">
      <div className="space-y-4">
        {error && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center space-x-2 text-xs text-amber-800">
            <FaExclamationCircle className="w-4 h-4 flex-shrink-0 text-amber-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Camera Live Feed View */}
        {!capturedImage && (
          <div className="space-y-3">
            <div className="relative bg-slate-900 rounded-2xl overflow-hidden aspect-[4/3] flex items-center justify-center border border-slate-800 shadow-inner min-h-[240px]">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={cameraActive ? 'w-full h-full object-cover' : 'hidden'}
              />

              {cameraActive && (
                <div className="absolute inset-x-8 top-1/3 bottom-1/3 border-2 border-dashed border-amber-400/80 rounded-xl flex items-center justify-center bg-amber-400/10 backdrop-blur-[1px] pointer-events-none">
                  <span className="text-[11px] font-bold text-white bg-slate-900/80 px-2 py-1 rounded-md shadow-xs">
                    Align Odometer Numbers Inside Box
                  </span>
                </div>
              )}

              {!cameraActive && (
                <div className="text-center p-6 text-slate-400 space-y-2">
                  <FaCamera className="w-10 h-10 mx-auto opacity-50" />
                  <p className="text-xs font-medium">Camera stream inactive or unsecure HTTP domain.</p>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              {cameraActive && (
                <button
                  type="button"
                  onClick={handleCapture}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-xs flex items-center justify-center space-x-2 shadow-md shadow-indigo-100 cursor-pointer"
                >
                  <FaCamera className="w-4 h-4" />
                  <span>Capture Photo</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-xs flex items-center justify-center space-x-2 cursor-pointer border border-slate-200"
              >
                <FaUpload className="w-3.5 h-3.5 text-indigo-600" />
                <span>Take Photo / Upload Image 📷</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          </div>
        )}


        {/* Processing State */}
        {processing && (
          <div className="py-8 text-center space-y-3">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-3 border-indigo-600 border-t-transparent" />
            <p className="text-xs font-bold text-slate-700">Scanning image & extracting odometer digits...</p>
          </div>
        )}

        {/* Verification Preview Card */}
        {capturedImage && !processing && (
          <div className="space-y-4">
            <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-900 max-h-48 flex items-center justify-center">
              <img src={capturedImage} alt="Captured Odometer" className="max-h-48 object-contain" />
              <button
                onClick={handleRetake}
                className="absolute top-2 right-2 p-2 bg-slate-900/80 hover:bg-slate-900 text-white rounded-lg text-xs font-medium flex items-center space-x-1 backdrop-blur-xs cursor-pointer"
              >
                <FaRedo className="w-3 h-3" />
                <span>Retake</span>
              </button>
            </div>

            <div className="p-4 bg-indigo-50/60 border border-indigo-100 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-900">Extracted Odometer Reading:</span>
                <span className="text-[10px] font-semibold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                  Please Confirm or Edit
                </span>
              </div>

              <div className="relative">
                <input
                  type="number"
                  value={editedValue}
                  onChange={(e) => setEditedValue(e.target.value)}
                  placeholder="Enter odometer"
                  className="w-full px-4 py-2.5 bg-white border border-indigo-200 rounded-xl text-lg font-bold text-slate-800 tracking-wider focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
                <FaEdit className="absolute right-3.5 top-3.5 text-slate-400 w-4 h-4 pointer-events-none" />
              </div>

              <p className="text-[11px] text-slate-500 leading-snug">
                Check if the extracted number matches your meter display. You can type to correct any digit.
              </p>

              {editedValue.length >= 6 && (
                <button
                  type="button"
                  onClick={() => setEditedValue(editedValue.slice(0, -1))}
                  className="w-full text-left text-[11px] font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-3 py-1.5 rounded-xl flex items-center justify-between cursor-pointer transition-colors"
                >
                  <span>🔴 Is 6th digit RED (Tenths)? Click to trim 6th digit</span>
                  <span className="bg-amber-200/80 px-2 py-0.5 rounded text-[10px] font-mono">Use {editedValue.slice(0, -1)} KM</span>
                </button>
              )}
            </div>

            <div className="flex justify-end space-x-3 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 flex items-center space-x-1.5 shadow-md shadow-indigo-100 cursor-pointer"
              >
                <FaCheck className="w-3.5 h-3.5" />
                <span>Confirm & Use Reading</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default OdometerScannerModal;
