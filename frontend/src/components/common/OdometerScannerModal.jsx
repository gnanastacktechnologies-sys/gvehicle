import React, { useState, useRef, useEffect } from 'react';
import Modal from './Modal';
import { FaCamera, FaUpload, FaCheck, FaTimes, FaRedo, FaExclamationCircle, FaEdit, FaBolt } from 'react-icons/fa';
import { createWorker } from 'tesseract.js';

const OdometerScannerModal = ({ isOpen, onClose, onConfirm, initialValue = '' }) => {
  const [stream, setStream] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [extractedValue, setExtractedValue] = useState('');
  const [editedValue, setEditedValue] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [torchAvailable, setTorchAvailable] = useState(false);

  const [candidates, setCandidates] = useState([]);

  const videoRef = useRef(null);
  const fileInputRef = useRef(null);

  // Detect Flashlight / Torch capability on active video track
  useEffect(() => {
    if (stream) {
      const track = stream.getVideoTracks()?.[0];
      if (track && typeof track.getCapabilities === 'function') {
        const caps = track.getCapabilities();
        if (caps.torch) {
          setTorchAvailable(true);
        } else {
          setTorchAvailable(false);
        }
      }
    } else {
      setTorchAvailable(false);
      setTorchOn(false);
    }
  }, [stream]);

  // Toggle physical LED camera flashlight on/off
  const toggleTorch = async () => {
    if (!stream) return;
    const track = stream.getVideoTracks()?.[0];
    if (track && torchAvailable) {
      try {
        const nextState = !torchOn;
        await track.applyConstraints({
          advanced: [{ torch: nextState }],
        });
        setTorchOn(nextState);
      } catch (err) {
        console.warn('Torch activation error:', err);
      }
    }
  };

  // Start Camera Stream
  const startCamera = async () => {
    setError('');
    setCameraActive(true);
    setTorchOn(false);
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
      setCandidates([]);
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

  // Parse raw OCR text into discrete numeric tokens & filter out gear shift marks & speedometer noise
  const parseNumericCandidates = (rawText) => {
    if (!rawText) return [];

    const candidatesSet = new Set();
    const initNum = Number(initialValue) || 0;

    // 1. Join spaced digit sequences and strip dots/dashes (e.g. "1542 3" -> "15423", "1542.3" -> "15423")
    const cleanedRaw = rawText.replace(/[\.\,\-\_]+/g, ' ');
    const joinedSpacedText = cleanedRaw
      .replace(/(\d)\s+(\d)/g, '$1$2')
      .replace(/(\d)\s+(\d)/g, '$1$2')
      .replace(/(\d)\s+(\d)/g, '$1$2');

    // 2. Extract all numeric tokens from raw text, cleaned text, and joined text
    const rawTokens = (rawText + ' ' + cleanedRaw + ' ' + joinedSpacedText).split(/[^0-9]+/);

    const gearShiftMarks = new Set(['1', '2', '3', '4', '5', '6']);
    const speedometerSteps = new Set(['0', '20', '40', '60', '80', '100', '120', '140', '160', '180', '200', '220']);

    rawTokens.forEach((token) => {
      const cleaned = token.trim();
      if (cleaned.length >= 1) {
        candidatesSet.add(cleaned);
        if (cleaned.length === 6) {
          candidatesSet.add(cleaned.slice(0, 5));
        }
      }
    });

    // If candidate has 4 digits (e.g. "1542") and a 1-digit token ("3") exists separately due to spacing/glare, combine them ("15423")
    const initialTokens = Array.from(candidatesSet);
    for (let i = 0; i < initialTokens.length; i++) {
      const t1 = initialTokens[i];
      if (t1.length === 4) {
        for (let j = 0; j < initialTokens.length; j++) {
          const t2 = initialTokens[j];
          if (t2.length === 1) {
            candidatesSet.add(t1 + t2);
          }
        }
      }
    }

    const uniqueTokens = Array.from(candidatesSet);

    // Sort candidates:
    // 1st Priority: Numbers close to initial vehicle odometer reading (initNum <= val <= initNum + 50000)
    // 2nd Priority: Valid 4 to 7 digit odometer numbers
    // 3rd Priority: Non-noise numbers
    // 4th Priority: Length
    uniqueTokens.sort((a, b) => {
      const numA = Number(a);
      const numB = Number(b);

      const aCloseToInit = initNum > 0 && numA >= Math.max(0, initNum - 100) && numA <= initNum + 50000;
      const bCloseToInit = initNum > 0 && numB >= Math.max(0, initNum - 100) && numB <= initNum + 50000;

      if (aCloseToInit && !bCloseToInit) return -1;
      if (!aCloseToInit && bCloseToInit) return 1;

      if (aCloseToInit && bCloseToInit) {
        return Math.abs(numA - initNum) - Math.abs(numB - initNum);
      }

      const aIsOdometer = a.length >= 4 && a.length <= 7 && !speedometerSteps.has(a);
      const bIsOdometer = b.length >= 4 && b.length <= 7 && !speedometerSteps.has(b);

      const aIsNoise = gearShiftMarks.has(a) || speedometerSteps.has(a);
      const bIsNoise = gearShiftMarks.has(b) || speedometerSteps.has(b);

      if (aIsOdometer && !bIsOdometer) return -1;
      if (!aIsOdometer && bIsOdometer) return 1;

      if (!aIsNoise && bIsNoise) return -1;
      if (aIsNoise && !bIsNoise) return 1;

      return b.length - a.length;
    });

    const hasValidCandidates = uniqueTokens.some((t) => t.length >= 4 || (initNum > 0 && Number(t) >= Math.max(0, initNum - 100)));
    if (hasValidCandidates) {
      return uniqueTokens.filter((t) => !gearShiftMarks.has(t) && !speedometerSteps.has(t));
    }

    return uniqueTokens;
  };

  // Process image with OCR
  const processImage = async (imageSrc) => {
    setProcessing(true);
    setError('');
    setCandidates([]);
    try {
      const worker = await getWorker();
      const { data } = await worker.recognize(imageSrc);

      // Extract discrete numeric tokens instead of raw concatenated text
      const foundCandidates = parseNumericCandidates(data.text);
      setCandidates(foundCandidates);

      if (foundCandidates.length > 0) {
        // Pick top candidate (ideal 4-7 digit odometer number)
        const primaryMatch = foundCandidates[0];
        setExtractedValue(primaryMatch);
        setEditedValue(primaryMatch);
      } else {
        setExtractedValue('');
        setEditedValue(initialValue ? String(initialValue) : '');
        setError('Could not clearly detect numbers inside alignment box. Please verify or select/type manually.');
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

  // Capture Photo from Video Stream (Cropped to wide ROI Box with 1.5x scaling and contrast enhancement)
  const handleCapture = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const vWidth = video.videoWidth || 640;
    const vHeight = video.videoHeight || 480;

    // Use full 98% width crop box so 5th & 6th rightmost digits are never clipped
    const cropX = Math.floor(vWidth * 0.01);
    const cropY = Math.floor(vHeight * 0.20);
    const cropW = Math.floor(vWidth * 0.98);
    const cropH = Math.floor(vHeight * 0.60);

    const cropCanvas = document.createElement('canvas');
    // Upscale by 1.5x for higher OCR resolution
    const scale = 1.5;
    cropCanvas.width = Math.floor(cropW * scale);
    cropCanvas.height = Math.floor(cropH * scale);
    const cropCtx = cropCanvas.getContext('2d');

    // Contrast & brightness enhancement for OCR accuracy
    if ('filter' in cropCtx) {
      cropCtx.filter = 'contrast(140%) brightness(105%)';
    }
    cropCtx.drawImage(video, cropX, cropY, cropW, cropH, 0, 0, cropCanvas.width, cropCanvas.height);

    const croppedDataUrl = cropCanvas.toDataURL('image/jpeg', 0.95);

    stopCamera();
    setCapturedImage(croppedDataUrl);
    processImage(croppedDataUrl);
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
                <>
                  <div className="absolute inset-x-2.5 top-1/4 bottom-1/4 border-2 border-dashed border-amber-400/80 rounded-xl flex items-center justify-center bg-amber-400/10 backdrop-blur-[1px] pointer-events-none">
                    <span className="text-[11px] font-bold text-white bg-slate-900/80 px-2 py-1 rounded-md shadow-xs">
                      Align Odometer Numbers Inside Box
                    </span>
                  </div>

                  {torchAvailable && (
                    <button
                      type="button"
                      onClick={toggleTorch}
                      className={`absolute top-3 right-3 px-3 py-1.5 rounded-full text-xs font-bold flex items-center space-x-1.5 transition-all shadow-md cursor-pointer ${
                        torchOn
                          ? 'bg-amber-400 text-slate-900 ring-2 ring-amber-300'
                          : 'bg-slate-800/80 text-white hover:bg-slate-700 backdrop-blur-xs'
                      }`}
                    >
                      <FaBolt className={`w-3.5 h-3.5 ${torchOn ? 'text-slate-900 animate-pulse' : 'text-amber-400'}`} />
                      <span>{torchOn ? 'Flashlight ON' : 'Flashlight OFF'}</span>
                    </button>
                  )}
                </>
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

              {/* Detected Candidate Number Chips */}
              {candidates.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-bold text-slate-700 block">
                    Detected Numbers ({candidates.length}) - Tap to select correct reading:
                  </span>
                  <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-1.5 bg-white border border-indigo-150 rounded-xl shadow-xs">
                    {candidates.map((cand, idx) => {
                      const isSelected = editedValue === cand;
                      const isRecommended = cand.length >= 4 && cand.length <= 7;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setEditedValue(cand)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center space-x-1 ${
                            isSelected
                              ? 'bg-indigo-600 text-white shadow-xs ring-2 ring-indigo-300'
                              : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200'
                          }`}
                        >
                          <span>{cand} KM</span>
                          {isRecommended && <span className="text-[10px]" title="Recommended odometer length">⭐</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <p className="text-[11px] text-slate-500 leading-snug">
                Check if the extracted number matches your meter display. You can tap any detected number above or type to correct any digit.
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
