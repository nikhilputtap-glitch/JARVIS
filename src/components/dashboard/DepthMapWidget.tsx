import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Layers } from 'lucide-react';
import { FilesetResolver, ImageSegmenter } from '@mediapipe/tasks-vision';

const DepthMapWidget: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    
    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          // Wait for metadata to load before playing
          await new Promise((resolve) => {
            if (videoRef.current!.readyState >= 2) resolve(undefined);
            else videoRef.current!.onloadedmetadata = () => resolve(undefined);
          });
          // Only play if the video element is still mounted
          if (isMounted) {
            try {
              await videoRef.current.play();
            } catch (playErr) {
              console.error("Video play error:", playErr);
            }
          }
        }

        console.log("Initializing MediaPipe...");
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );
        console.log("Vision resolver initialized");
        const segmenter = await ImageSegmenter.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/image_segmenter/deeplab_v3/float32/1/deeplab_v3.tflite`
          },
          runningMode: "VIDEO"
        });
        console.log("Segmenter created");

        const process = () => {
          if (!isMounted || !videoRef.current || !canvasRef.current) return;
          console.log("Processing frame...");
          
          segmenter.segmentForVideo(videoRef.current, performance.now(), (result) => {
            if (!isMounted) return;
            if (!result.categoryMask) {
              console.log("No categoryMask found in result");
              return;
            }
            console.log("Mask data length:", result.categoryMask.getAsUint8Array().length);
            
            const ctx = canvasRef.current!.getContext('2d');
            if (ctx) {
              // Test rectangle
              ctx.fillStyle = 'red';
              ctx.fillRect(0, 0, 50, 50);
              
              const maskData = result.categoryMask.getAsUint8Array();
              console.log("Canvas dim:", canvasRef.current.width, canvasRef.current.height);
              console.log("Mask dim:", result.categoryMask.width, result.categoryMask.height);
              console.log("Video dim:", videoRef.current!.videoWidth, videoRef.current!.videoHeight);

              if (canvasRef.current.width !== result.categoryMask.width) {
                canvasRef.current.width = result.categoryMask.width;
                canvasRef.current.height = result.categoryMask.height;
              }
              
              // Draw video frame first
              ctx.drawImage(videoRef.current!, 0, 0, canvasRef.current.width, canvasRef.current.height);
              
              const imageData = ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height);
              
              // Overlay the mask
              for (let i = 0; i < maskData.length; i++) {
                const categoryId = maskData[i];
                if (categoryId !== 0) { // If not background
                  const val = categoryId * 50;
                  imageData.data[i * 4] = (imageData.data[i * 4] + val) / 2; // Blend
                  imageData.data[i * 4 + 1] = (imageData.data[i * 4 + 1] + val) / 2;
                  imageData.data[i * 4 + 2] = (imageData.data[i * 4 + 2] + 255 - val) / 2;
                  imageData.data[i * 4 + 3] = 200; // Semi-transparent
                }
              }
              ctx.putImageData(imageData, 0, 0);
            }
          });
          requestAnimationFrame(process);
        };
        process();
      } catch (err) {
        console.error("DepthMapWidget init error:", err);
        setError(`DEPTH_MAP_OFFLINE: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    };

    start();
    return () => { isMounted = false; };
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative bg-cyan-950/20 border border-cyan-500/30 p-5 rounded-none backdrop-blur-sm h-64 flex flex-col"
    >
      <h3 className="text-cyan-400 text-[10px] font-bold uppercase tracking-[0.3em] flex items-center gap-2 mb-4">
        <Layers className="w-4 h-4" /> Spatial.Depth.Map
      </h3>
      <div className="relative flex-1 overflow-hidden border border-cyan-900/50 bg-black/50">
        <video ref={videoRef} className="hidden" />
        <canvas ref={canvasRef} width={640} height={480} className="absolute inset-0 w-full h-full object-cover" />
      </div>
      {error && <div className="text-red-400 text-[8px] mt-2">{error}</div>}
    </motion.div>
  );
};

export default DepthMapWidget;
