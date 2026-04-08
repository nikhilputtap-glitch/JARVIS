import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Globe, Radio } from 'lucide-react';
import axios from 'axios';

interface NewsItem {
  title: string;
  source: { name: string };
}

const NewsFeedWidget: React.FC = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newsIndex, setNewsIndex] = useState(0);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const response = await axios.get('/api/news');
        setNews(response.data.articles);
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch news", error);
        setLoading(false);
      }
    };
    fetchNews();
  }, []);

  // Rotate news every 1 minute
  useEffect(() => {
    if (news.length === 0) return;
    const rotateInterval = setInterval(() => {
      setNewsIndex((prev) => (prev + 3) % news.length);
    }, 60000); // 1 minute
    return () => clearInterval(rotateInterval);
  }, [news]);

  const displayNews = news.length > 0 ? news.slice(newsIndex, newsIndex + 3) : [];
  if (displayNews.length < 3 && news.length > 0) {
    displayNews.push(...news.slice(0, 3 - displayNews.length));
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className="relative bg-cyan-950/20 border border-cyan-500/30 p-5 rounded-none backdrop-blur-sm"
    >
      {/* Scanning line */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-cyan-400/50 shadow-[0_0_10px_#22d3ee] animate-[scan_3s_ease-in-out_infinite]" />
      
      <div className="flex justify-between items-start mb-6 border-b border-cyan-900/50 pb-4">
        <h3 className="text-cyan-400 text-[10px] font-bold uppercase tracking-[0.3em] flex items-center gap-2">
          <Globe className="w-4 h-4" /> Global.Intel
        </h3>
        <span className="text-[9px] text-cyan-500/60 tracking-widest animate-pulse flex items-center gap-1">
          <Radio className="w-3 h-3" /> LIVE UPDATE
        </span>
      </div>

      <div className="flex flex-col gap-3 h-32 overflow-hidden relative">
        {loading ? (
          <div className="text-xs tracking-widest uppercase text-cyan-500/50 text-center py-4">
            ESTABLISHING SECURE CONNECTION...
          </div>
        ) : (
          <motion.div 
            key={newsIndex}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col gap-4"
          >
            {displayNews.map((item, i) => (
              <div key={i} className="border-l-2 border-cyan-500/50 pl-3 py-1">
                <div className="text-[8px] text-cyan-300/70 tracking-widest mb-1">{item.source.name}</div>
                <div className="text-xs text-cyan-100 uppercase tracking-wider font-mono leading-relaxed">
                  {item.title}
                </div>
              </div>
            ))}
          </motion.div>
        )}
        {/* Fade gradients for scroll effect */}
        <div className="absolute top-0 left-0 w-full h-4 bg-gradient-to-b from-[#020617] to-transparent pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-full h-4 bg-gradient-to-t from-[#020617] to-transparent pointer-events-none" />
      </div>

      {/* Corner accents */}
      <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-cyan-400" />
      <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-cyan-400" />
      <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-cyan-400" />
      <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-cyan-400" />
    </motion.div>
  );
};

export default NewsFeedWidget;
