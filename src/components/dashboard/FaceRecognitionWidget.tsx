import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { User, Loader2 } from 'lucide-react';
import * as faceapi from 'face-api.js';

const FaceRecognitionWidget: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [recognized, setRecognized] = useState(false);

  useEffect(() => {
    let isMounted = true;
    let referenceEmbedding: faceapi.FaceMatcher | null = null;

    const loadModels = async () => {
      try {
        const MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models';
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);

        // Load reference image
        // Use a base64 string or a valid public URL if the image is not in /public
        // Assuming the user needs to upload the image to the project
        const img = await faceapi.fetchImage('/nikhil.jpg');
        const detection = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor();
        
        if (detection) {
          referenceEmbedding = new faceapi.FaceMatcher(detection);
        } else {
          throw new Error("Could not detect face in reference image");
        }

        setLoading(false);
      } catch (err) {
        console.error("Model/Ref load error:", err);
        setError(`FACE_REC_OFFLINE: ${err instanceof Error ? err.message : 'Unknown error'}`);
        setLoading(false);
      }
    };

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch (err) {
        console.error("Camera error:", err);
        setError('CAMERA_OFFLINE');
      }
    };

    const runDetection = async () => {
      if (!isMounted || !videoRef.current || !canvasRef.current || !referenceEmbedding) return;

      const detections = await faceapi.detectAllFaces(videoRef.current).withFaceLandmarks().withFaceDescriptors();
      
      const canvas = canvasRef.current;
      const displaySize = { width: videoRef.current.videoWidth, height: videoRef.current.videoHeight };
      faceapi.matchDimensions(canvas, displaySize);
      const resizedDetections = faceapi.resizeResults(detections, displaySize);
      
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);

      let foundNikhil = false;
      resizedDetections.forEach(detection => {
        const bestMatch = referenceEmbedding!.findBestMatch(detection.descriptor);
        if (bestMatch.label !== 'unknown' && bestMatch.distance < 0.6) {
          foundNikhil = true;
          const box = detection.detection.box;
          const drawBox = new faceapi.draw.DrawBox(box, { label: 'Nikhil' });
          drawBox.draw(canvas);
        } else {
          faceapi.draw.drawDetections(canvas, [detection]);
        }
      });
      setRecognized(foundNikhil);

      requestAnimationFrame(runDetection);
    };

    const init = async () => {
      await loadModels();
      await startCamera();
      runDetection();
    };

    init();
    return () => { isMounted = false; };
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative bg-purple-950/20 border border-purple-500/30 p-5 rounded-none backdrop-blur-sm h-64 flex flex-col"
    >
      <h3 className="text-purple-400 text-[10px] font-bold uppercase tracking-[0.3em] flex items-center gap-2 mb-4">
        <User className="w-4 h-4" /> Identity.Recognition
      </h3>
      <div className="relative flex-1 overflow-hidden border border-purple-900/50 bg-black/50">
        <video ref={videoRef} className="hidden" />
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover" />
        {loading && <div className="absolute inset-0 flex items-center justify-center text-purple-400"><Loader2 className="animate-spin" /></div>}
      </div>
      {error && <div className="text-red-400 text-[8px] mt-2">{error}</div>}
      {recognized && <div className="text-green-400 text-[8px] mt-2">Nikhil Recognized!</div>}
    </motion.div>
  );
};

export default FaceRecognitionWidget;
