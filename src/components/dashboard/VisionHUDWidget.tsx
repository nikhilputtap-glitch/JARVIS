import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Scan, AlertTriangle, Fingerprint, Eye } from 'lucide-react';
import * as tf from '@tensorflow/tfjs';
import * as cocossd from '@tensorflow-models/coco-ssd';
import * as handPoseDetection from '@tensorflow-models/hand-pose-detection';

// Persistent model references to avoid re-downloading
let objectModel: cocossd.ObjectDetection | null = null;
let handModel: handPoseDetection.HandDetector | null = null;

const VisionHUDWidget: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCamera, setHasCamera] = useState(false);
  const [error, setError] = useState('');
  const [predictions, setPredictions] = useState<cocossd.DetectedObject[]>([]);
  const [handKeypoints, setHandKeypoints] = useState<{x: number, y: number}[]>([]);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [faceAuthStatus, setFaceAuthStatus] = useState<'IDLE' | 'SCANNING' | 'VERIFIED'>('IDLE');
  const [arPassthrough, setArPassthrough] = useState(false);
  
  const authTimerRef = useRef<NodeJS.Timeout | null>(null);
  const authStatusRef = useRef<'IDLE' | 'SCANNING' | 'VERIFIED'>('IDLE');

  // Initialize Camera First (Non-blocking)
  useEffect(() => {
    let isMounted = true;
    
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (!isMounted) return;
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play();
            setHasCamera(true);
          };
        }
      } catch (err) {
        console.error("Camera access denied", err);
        if (isMounted) setError('OPTICS OFFLINE');
      }
    };

    startCamera();

    return () => {
      isMounted = false;
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Initialize AI Models once
  useEffect(() => {
    if (!hasCamera) return;

    let animationFrameId: number;
    let isMounted = true;
    let lastGestureTime = 0;
    let prevWristX = 0;

    const loadAI = async () => {
      try {
        await tf.ready();
        if (!objectModel) objectModel = await cocossd.load();
        
        if (!handModel) {
          const handModelConfig = {
            runtime: 'tfjs' as const,
            modelType: 'lite' as const
          };
          handModel = await handPoseDetection.createDetector(
            handPoseDetection.SupportedModels.MediaPipeHands, 
            handModelConfig
          );
        }

        if (!isMounted) return;
        setModelLoaded(true);
        detectFrame();
      } catch (aiErr) {
        console.error("AI Model failed to load", aiErr);
      }
    };

    const detectFrame = async () => {
      if (!isMounted) return;
      if (videoRef.current && objectModel && handModel && videoRef.current.readyState === 4) {
        const video = videoRef.current;
        try {
          // Object Detection
          const preds = await objectModel.detect(video);
          const mappedPreds = preds.map(p => ({
            ...p,
            bbox: [
              (p.bbox[0] / video.videoWidth) * 100,
              (p.bbox[1] / video.videoHeight) * 100,
              (p.bbox[2] / video.videoWidth) * 100,
              (p.bbox[3] / video.videoHeight) * 100,
            ] as [number, number, number, number]
          }));
          setPredictions(mappedPreds);

          // Simulated Facial Recognition Logic
          const personDetected = preds.some(p => p.class === 'person');
          if (personDetected) {
            if (authStatusRef.current === 'IDLE') {
              authStatusRef.current = 'SCANNING';
              setFaceAuthStatus('SCANNING');
              authTimerRef.current = setTimeout(() => {
                authStatusRef.current = 'VERIFIED';
                setFaceAuthStatus('VERIFIED');
              }, 3000); // 3 seconds to verify
            }
          } else {
            if (authStatusRef.current !== 'IDLE') {
              authStatusRef.current = 'IDLE';
              setFaceAuthStatus('IDLE');
              if (authTimerRef.current) clearTimeout(authTimerRef.current);
            }
          }

          // Hand Gesture Detection
          const hands = await handModel.estimateHands(video);
          if (hands.length > 0) {
            const hand = hands[0];
            
            // Map keypoints for visual feedback
            const mappedKeypoints = hand.keypoints.map(k => ({
              x: (k.x / video.videoWidth) * 100,
              y: (k.y / video.videoHeight) * 100
            }));
            setHandKeypoints(mappedKeypoints);

            const thumbTip = hand.keypoints.find(k => k.name === 'thumb_tip');
            const indexTip = hand.keypoints.find(k => k.name === 'index_finger_tip');
            const wrist = hand.keypoints.find(k => k.name === 'wrist');

            if (thumbTip && indexTip && wrist) {
              const pinchDist = Math.hypot(thumbTip.x - indexTip.x, thumbTip.y - indexTip.y);
              const openDist = Math.hypot(wrist.x - indexTip.x, wrist.y - indexTip.y);
              const now = Date.now();

              if (now - lastGestureTime > 1500) {
                // Tuned thresholds for easier triggering
                if (pinchDist < 40) {
                  window.dispatchEvent(new CustomEvent('jarvis-gesture', { detail: 'pinch' }));
                  lastGestureTime = now;
                } else if (openDist > 120) {
                  window.dispatchEvent(new CustomEvent('jarvis-gesture', { detail: 'open-hand' }));
                  lastGestureTime = now;
                } else if (prevWristX !== 0 && Math.abs(wrist.x - prevWristX) > 80) {
                  window.dispatchEvent(new CustomEvent('jarvis-gesture', { detail: 'swipe' }));
                  lastGestureTime = now;
                }
              }
              prevWristX = wrist.x;
            }
          } else {
            setHandKeypoints([]);
          }
        } catch (e) {
          console.error("Detection error", e);
        }
      }
      animationFrameId = requestAnimationFrame(detectFrame);
    };

    loadAI();

    return () => {
      isMounted = false;
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (authTimerRef.current) clearTimeout(authTimerRef.current);
    };
  }, [hasCamera]);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.2 }}
      className={`relative border border-cyan-500/30 p-5 rounded-none backdrop-blur-sm h-[400px] flex flex-col overflow-hidden ${arPassthrough ? 'bg-transparent' : 'bg-cyan-950/20'}`}
    >
      <div className="flex justify-between items-start mb-2 border-b border-cyan-900/50 pb-2 z-10">
        <h3 className="text-cyan-400 text-[10px] font-bold uppercase tracking-[0.3em] flex items-center gap-2">
          <Scan className="w-4 h-4" /> Threat.Assessment.HUD
        </h3>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setArPassthrough(!arPassthrough)}
            className={`text-[9px] tracking-widest flex items-center gap-1 ${arPassthrough ? 'text-cyan-300' : 'text-cyan-500/60'}`}
          >
            <Eye className="w-3 h-3" /> AR_MODE: {arPassthrough ? 'ON' : 'OFF'}
          </button>
          {faceAuthStatus !== 'IDLE' && (
            <span className={`text-[9px] tracking-widest flex items-center gap-1 ${faceAuthStatus === 'VERIFIED' ? 'text-emerald-400' : 'text-amber-400 animate-pulse'}`}>
              <Fingerprint className="w-3 h-3" />
              {faceAuthStatus === 'VERIFIED' ? 'IDENTITY VERIFIED: ADMIN' : 'SCANNING BIOMETRICS...'}
            </span>
          )}
          <span className="text-[9px] text-cyan-500/60 tracking-widest animate-pulse">
            {!modelLoaded ? 'LOADING NEURAL NET...' : (hasCamera ? 'SCANNING...' : 'OFFLINE')}
          </span>
        </div>
      </div>

      <div className="flex-1 relative overflow-hidden border border-cyan-900/50 bg-black/50 flex items-center justify-center">
        {error ? (
          <div className="flex items-center gap-2 text-red-400 text-xs tracking-widest p-4 bg-red-950/20 border border-red-900/50 z-10">
            <AlertTriangle className="w-4 h-4" /> {error}
          </div>
        ) : (
          <>
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className={`absolute inset-0 w-full h-full object-fill ${arPassthrough ? 'opacity-100' : 'opacity-60 grayscale contrast-150 brightness-75'}`}
            />
            
            {/* HUD Overlays */}
            {hasCamera && (
              <>
                {/* Scanning line */}
                <div className="absolute top-0 left-0 w-full h-1 bg-cyan-400/50 shadow-[0_0_15px_#22d3ee] animate-[scan_3s_ease-in-out_infinite]" />

                {/* Hand Tracking Visual Feedback */}
                <div className="absolute inset-0 w-full h-full pointer-events-none z-20">
                  {handKeypoints.map((kp, idx) => (
                    <div 
                      key={`kp-${idx}`}
                      className="absolute w-1.5 h-1.5 bg-cyan-400 rounded-full shadow-[0_0_5px_#22d3ee] transform -translate-x-1/2 -translate-y-1/2"
                      style={{ left: `${kp.x}%`, top: `${kp.y}%` }}
                    />
                  ))}
                </div>

                {/* Real AI Bounding Boxes */}
                <div className="absolute inset-0 w-full h-full pointer-events-none z-10">
                  {predictions.map((pred, idx) => {
                    const isPerson = pred.class === 'person';
                    const isThreat = pred.class === 'cell phone';
                    
                    let colorClass = 'border-cyan-500';
                    let bgClass = 'bg-cyan-500/10';
                    let textClass = 'text-cyan-400';
                    let label = `${pred.class.toUpperCase()} [${Math.round(pred.score * 100)}%]`;

                    if (isThreat) {
                      colorClass = 'border-red-500';
                      bgClass = 'bg-red-500/10';
                      textClass = 'text-red-400';
                    } else if (isPerson) {
                      if (faceAuthStatus === 'VERIFIED') {
                        colorClass = 'border-emerald-500';
                        bgClass = 'bg-emerald-500/10';
                        textClass = 'text-emerald-400';
                        label = `ADMIN_ID_MATCH [99.9%]`;
                      } else {
                        colorClass = 'border-amber-500';
                        bgClass = 'bg-amber-500/10';
                        textClass = 'text-amber-400';
                        label = `ANALYZING_BIOMETRICS...`;
                      }
                    }

                    return (
                      <div 
                        key={idx}
                        className={`absolute border ${colorClass} ${bgClass} transition-all duration-75`}
                        style={{
                          left: `${pred.bbox[0]}%`,
                          top: `${pred.bbox[1]}%`,
                          width: `${pred.bbox[2]}%`,
                          height: `${pred.bbox[3]}%`,
                        }}
                      >
                        {/* Biometric Scanning Effect for Person */}
                        {isPerson && faceAuthStatus === 'SCANNING' && (
                          <div className="absolute top-0 left-0 w-full h-1 bg-amber-400/80 shadow-[0_0_10px_#fbbf24] animate-[scan_1.5s_ease-in-out_infinite]" />
                        )}

                        <div className={`absolute -top-4 left-0 text-[8px] ${textClass} font-mono tracking-widest bg-black/80 px-1 whitespace-nowrap`}>
                          {label}
                        </div>
                        <div className={`absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 ${colorClass}`} />
                        <div className={`absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 ${colorClass}`} />
                        <div className={`absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 ${colorClass}`} />
                        <div className={`absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 ${colorClass}`} />
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* Corner accents */}
      <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-cyan-400" />
      <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-cyan-400" />
      <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-cyan-400" />
      <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-cyan-400" />
    </motion.div>
  );
};

export default VisionHUDWidget;
