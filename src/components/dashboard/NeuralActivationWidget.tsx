import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Network, Activity } from 'lucide-react';
import * as tf from '@tensorflow/tfjs';
import * as cocossd from '@tensorflow-models/coco-ssd';

const NeuralActivationWidget: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activations, setActivations] = useState<number[]>([]);

  useEffect(() => {
    let isMounted = true;
    let model: cocossd.ObjectDetection;

    const init = async () => {
      await tf.ready();
      model = await cocossd.load();
      
      // Simulate activation visualization
      const animate = () => {
        if (!isMounted) return;
        
        // Simulate neuron firing patterns
        const newActivations = Array.from({ length: 64 }, () => Math.random() * 255);
        setActivations(newActivations);
        
        if (canvasRef.current) {
          const ctx = canvasRef.current.getContext('2d');
          if (ctx) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
            ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            
            newActivations.forEach((val, i) => {
              ctx.fillStyle = `rgb(34, ${val}, 238)`;
              const x = (i % 8) * 20;
              const y = Math.floor(i / 8) * 20;
              ctx.fillRect(x + 2, y + 2, 16, 16);
            });
          }
        }
        requestAnimationFrame(animate);
      };
      animate();
    };

    init();
    return () => { isMounted = false; };
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative bg-cyan-950/20 border border-cyan-500/30 p-5 rounded-none backdrop-blur-sm h-64 flex flex-col"
    >
      <h3 className="text-cyan-400 text-[10px] font-bold uppercase tracking-[0.3em] flex items-center gap-2 mb-4">
        <Network className="w-4 h-4" /> Neural.Activation.Map
      </h3>
      <canvas ref={canvasRef} width={160} height={160} className="w-full h-full bg-black/50 border border-cyan-900/50" />
      <div className="absolute bottom-2 right-2 text-[8px] text-cyan-500/60 font-mono tracking-widest">
        GPU_LOAD: 42%
      </div>
    </motion.div>
  );
};

export default NeuralActivationWidget;
