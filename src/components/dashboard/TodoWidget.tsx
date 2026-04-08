import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { CheckSquare, Square, Terminal } from 'lucide-react';

const TodoWidget: React.FC = () => {
  const [tasks, setTasks] = useState<string[]>([]);

  useEffect(() => {
    const loadTasks = () => {
      const storedStr = localStorage.getItem('jarvis_todos');
      if (!storedStr) {
        const defaultTasks = ['CALIBRATE SENSORS', 'UPDATE FIREWALL', 'REVIEW FLIGHT LOGS'];
        localStorage.setItem('jarvis_todos', JSON.stringify(defaultTasks));
        setTasks(defaultTasks);
      } else {
        setTasks(JSON.parse(storedStr));
      }
    };
    loadTasks();
    const interval = setInterval(loadTasks, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="relative bg-cyan-950/20 border border-cyan-500/30 p-5 rounded-none backdrop-blur-sm flex-1"
    >
      <div className="flex justify-between items-start mb-6 border-b border-cyan-900/50 pb-4">
        <h3 className="text-cyan-400 text-[10px] font-bold uppercase tracking-[0.3em] flex items-center gap-2">
          <Terminal className="w-4 h-4" /> Task.Queue
        </h3>
        <span className="text-[9px] text-cyan-500/60 tracking-widest">{tasks.length} ACTIVE</span>
      </div>

      <div className="flex flex-col gap-2">
        {tasks.map((task, i) => (
          <div key={i} className="flex items-start gap-3 p-2 hover:bg-cyan-900/20 border border-transparent hover:border-cyan-900/50 transition-colors group">
            <Square className="w-4 h-4 text-cyan-700 mt-0.5 group-hover:text-cyan-400 transition-colors" />
            <span className="text-xs tracking-widest uppercase text-cyan-100 group-hover:text-white transition-colors">
              {task}
            </span>
          </div>
        ))}
        {tasks.length === 0 && (
          <div className="text-xs tracking-widest uppercase text-cyan-500/50 text-center py-4">
            NO ACTIVE TASKS
          </div>
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

export default TodoWidget;
