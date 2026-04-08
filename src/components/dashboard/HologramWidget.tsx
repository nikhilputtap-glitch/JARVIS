import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere, MeshDistortMaterial, Icosahedron, Octahedron } from '@react-three/drei';
import { motion } from 'motion/react';
import { Globe, RotateCw } from 'lucide-react';

const AnimatedCore = ({ status }: { status: string }) => {
  const meshRef = useRef<any>(null);
  const outerRef = useRef<any>(null);
  
  useFrame((state) => {
    const speed = status === 'RECALIBRATING' ? 5 : 1;
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.2 * speed;
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.3 * speed;
    }
    if (outerRef.current) {
      outerRef.current.rotation.x = -state.clock.elapsedTime * 0.1 * speed;
      outerRef.current.rotation.y = -state.clock.elapsedTime * 0.15 * speed;
    }
  });

  return (
    <group>
      <Icosahedron ref={outerRef} args={[2, 1]}>
        <meshBasicMaterial 
          color={status === 'RECALIBRATING' ? "#fbbf24" : "#22d3ee"} 
          wireframe 
          transparent 
          opacity={0.3} 
        />
      </Icosahedron>
      <Octahedron ref={meshRef} args={[1.2, 0]}>
        <meshBasicMaterial 
          color={status === 'RECALIBRATING' ? "#f59e0b" : "#0ea5e9"} 
          wireframe 
        />
      </Octahedron>
      <Sphere args={[0.5, 16, 16]}>
        <meshBasicMaterial color="#ffffff" />
      </Sphere>
    </group>
  );
};

const HologramWidget: React.FC = () => {
  const [status, setStatus] = useState('STABLE');

  useEffect(() => {
    const handleGesture = (e: any) => {
      if (e.detail === 'swipe' || e.detail === 'pinch') {
        setStatus('RECALIBRATING');
        setTimeout(() => setStatus('STABLE'), 2000);
      }
    };
    window.addEventListener('jarvis-gesture', handleGesture);
    return () => window.removeEventListener('jarvis-gesture', handleGesture);
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.1 }}
      className="relative bg-cyan-950/20 border border-cyan-500/30 p-5 rounded-none backdrop-blur-sm h-64 flex flex-col"
    >
      <div className="flex justify-between items-start mb-2 border-b border-cyan-900/50 pb-2 z-10">
        <h3 className="text-cyan-400 text-[10px] font-bold uppercase tracking-[0.3em] flex items-center gap-2">
          <Globe className="w-4 h-4" /> Spatial.Projection
        </h3>
        <span className={`text-[9px] tracking-widest flex items-center gap-1 ${status === 'RECALIBRATING' ? 'text-amber-400 animate-pulse' : 'text-cyan-500/60'}`}>
          {status === 'RECALIBRATING' && <RotateCw className="w-3 h-3 animate-spin" />}
          {status}
        </span>
      </div>

      <div className="flex-1 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.1)_0%,transparent_70%)]" />
        <Canvas camera={{ position: [0, 0, 5] }}>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} color="#22d3ee" intensity={1} />
          <AnimatedCore status={status} />
        </Canvas>
        
        {/* Overlay Data */}
        <div className="absolute bottom-2 left-2 text-[8px] tracking-widest text-cyan-500/60 font-mono">
          <div>ENERGY OUTPUT: {status === 'RECALIBRATING' ? 'FLUCTUATING' : '98.4%'}</div>
          <div>CONTAINMENT: SECURE</div>
        </div>
        <div className="absolute bottom-2 right-2 text-[8px] tracking-widest text-cyan-500/60 font-mono text-right">
          <div>TEMP: {status === 'RECALIBRATING' ? '4200K' : '3400K'}</div>
          <div>SPIN: {status === 'RECALIBRATING' ? '3600 RPM' : '1200 RPM'}</div>
        </div>
      </div>

      {/* Corner accents */}
      <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-cyan-400" />
      <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-cyan-400" />
      <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-cyan-400" />
      <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-cyan-400" />
    </motion.div>
  );
};

export default HologramWidget;
