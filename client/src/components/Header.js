import React from 'react';
import { motion } from 'framer-motion';
import { ImageIcon, VideoIcon, Settings } from 'lucide-react';

const Header = () => {
  return (
    <header className="bg-white shadow-sm border-b border-secondary-200">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center space-x-3"
          >
            <div className="bg-primary-500 p-2 rounded-lg">
              <ImageIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-secondary-900">
                Wasserzeichen-Tool
              </h1>
              <p className="text-sm text-secondary-600">
                Professionelle Wasserzeichen für Bilder und Videos
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex items-center space-x-4"
          >
            <div className="flex items-center space-x-2 text-sm text-secondary-600">
              <ImageIcon className="w-4 h-4" />
              <span>Bilder</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-secondary-600">
              <VideoIcon className="w-4 h-4" />
              <span>Videos</span>
            </div>
            <button className="p-2 rounded-lg hover:bg-secondary-100 transition-colors">
              <Settings className="w-5 h-5 text-secondary-600" />
            </button>
          </motion.div>
        </div>
      </div>
    </header>
  );
};

export default Header; 