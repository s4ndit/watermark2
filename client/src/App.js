import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { motion } from 'framer-motion';
import Header from './components/Header';
import FileUpload from './components/FileUpload';
import WatermarkControls from './components/WatermarkControls';
import Preview from './components/Preview';
import ProcessingStatus from './components/ProcessingStatus';
import { SocketProvider } from './contexts/SocketContext';
import { useSocket } from './hooks/useSocket';

function App() {
  const [currentFile, setCurrentFile] = useState(null);
  const [watermarkFile, setWatermarkFile] = useState(null);
  const [watermarkSettings, setWatermarkSettings] = useState({
    type: 'text',
    text: 'WASSERZEICHEN',
    fontSize: 24,
    fontColor: '#ffffff',
    opacity: 0.8,
    position: 'bottom-right',
    rotation: 0,
    size: 20,
    margin: 10
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentJobId, setCurrentJobId] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  return (
    <SocketProvider>
      <div className="min-h-screen bg-gradient-to-br from-secondary-50 to-primary-50">
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#334155',
              color: '#ffffff',
              borderRadius: '12px',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            },
          }}
        />
        
        <Header />
        
        <main className="container mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-7xl mx-auto"
          >
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              {/* Linke Seite - Upload und Einstellungen */}
              <div className="space-y-6">
                <FileUpload
                  onFileUpload={setCurrentFile}
                  onWatermarkUpload={setWatermarkFile}
                  currentFile={currentFile}
                  watermarkFile={watermarkFile}
                />
                
                <WatermarkControls
                  settings={watermarkSettings}
                  onSettingsChange={setWatermarkSettings}
                  currentFile={currentFile}
                  watermarkFile={watermarkFile}
                  onPreviewGenerate={setPreviewUrl}
                />
              </div>

              {/* Rechte Seite - Vorschau und Status */}
              <div className="space-y-6">
                <Preview
                  currentFile={currentFile}
                  previewUrl={previewUrl}
                  watermarkSettings={watermarkSettings}
                />
                
                <ProcessingStatus
                  isProcessing={isProcessing}
                  currentJobId={currentJobId}
                  onProcessingStart={setIsProcessing}
                  onJobIdChange={setCurrentJobId}
                  currentFile={currentFile}
                  watermarkFile={watermarkFile}
                  watermarkSettings={watermarkSettings}
                />
              </div>
            </div>
          </motion.div>
        </main>
      </div>
    </SocketProvider>
  );
}

export default App; 