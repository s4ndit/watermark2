import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Maximize2, ZoomIn, ZoomOut, RotateCw, FileImage, FileVideo } from 'lucide-react';

const Preview = ({ currentFile, previewUrl, watermarkSettings }) => {
  const [showPreview, setShowPreview] = useState(true);
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 25, 200));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 25, 25));
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const resetView = () => {
    setZoom(100);
    setRotation(0);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="bg-white rounded-xl shadow-sm border border-secondary-200 p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-secondary-900">
          Vorschau
        </h2>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={handleZoomOut}
            className="p-2 rounded-lg hover:bg-secondary-100 transition-colors"
            disabled={zoom <= 25}
          >
            <ZoomOut className="w-4 h-4 text-secondary-600" />
          </button>
          
          <span className="text-sm font-medium text-secondary-600 min-w-[50px] text-center">
            {zoom}%
          </span>
          
          <button
            onClick={handleZoomIn}
            className="p-2 rounded-lg hover:bg-secondary-100 transition-colors"
            disabled={zoom >= 200}
          >
            <ZoomIn className="w-4 h-4 text-secondary-600" />
          </button>
          
          <button
            onClick={handleRotate}
            className="p-2 rounded-lg hover:bg-secondary-100 transition-colors"
          >
            <RotateCw className="w-4 h-4 text-secondary-600" />
          </button>
          
          <button
            onClick={resetView}
            className="px-3 py-1 text-sm bg-secondary-100 rounded-lg hover:bg-secondary-200 transition-colors"
          >
            Reset
          </button>
          
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="p-2 rounded-lg hover:bg-secondary-100 transition-colors"
          >
            {showPreview ? (
              <EyeOff className="w-4 h-4 text-secondary-600" />
            ) : (
              <Eye className="w-4 h-4 text-secondary-600" />
            )}
          </button>
        </div>
      </div>

      <div className="relative">
        {!currentFile && (
          <div className="aspect-video bg-secondary-50 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <FileImage className="w-16 h-16 text-secondary-300 mx-auto mb-4" />
              <p className="text-secondary-500 font-medium">
                Keine Datei ausgewählt
              </p>
              <p className="text-sm text-secondary-400">
                Laden Sie eine Datei hoch, um die Vorschau zu sehen
              </p>
            </div>
          </div>
        )}

        {currentFile && !previewUrl && (
          <div className="aspect-video bg-secondary-50 rounded-lg flex items-center justify-center">
            <div className="text-center">
              {currentFile.type === 'image' ? (
                <FileImage className="w-16 h-16 text-secondary-300 mx-auto mb-4" />
              ) : (
                <FileVideo className="w-16 h-16 text-secondary-300 mx-auto mb-4" />
              )}
              <p className="text-secondary-500 font-medium">
                {currentFile.originalName}
              </p>
              <p className="text-sm text-secondary-400">
                Klicken Sie auf "Vorschau" um eine Vorschau mit Wasserzeichen zu generieren
              </p>
            </div>
          </div>
        )}

        {previewUrl && showPreview && (
          <div className="relative overflow-hidden rounded-lg bg-secondary-50">
            <img
              src={previewUrl}
              alt="Vorschau mit Wasserzeichen"
              className="w-full h-auto max-h-96 object-contain transition-transform duration-300"
              style={{
                transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                transformOrigin: 'center center'
              }}
            />
            
            {/* Wasserzeichen-Info-Overlay */}
            <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-3 py-1 rounded-lg text-sm">
              <span className="font-medium">Vorschau</span>
              {watermarkSettings.type === 'text' && (
                <span className="ml-2">"{watermarkSettings.text}"</span>
              )}
            </div>
          </div>
        )}

        {/* Wasserzeichen-Einstellungen-Zusammenfassung */}
        {currentFile && (
          <div className="mt-4 p-4 bg-secondary-50 rounded-lg">
            <h3 className="font-medium text-secondary-900 mb-2">
              Aktuelle Einstellungen
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-secondary-600">Typ:</span>
                <span className="ml-2 font-medium text-secondary-900">
                  {watermarkSettings.type === 'text' ? 'Text' : 
                   watermarkSettings.type === 'image' ? 'Bild' : 'Beide'}
                </span>
              </div>
              
              {(watermarkSettings.type === 'text' || watermarkSettings.type === 'both') && (
                <div>
                  <span className="text-secondary-600">Text:</span>
                  <span className="ml-2 font-medium text-secondary-900">
                    "{watermarkSettings.text}"
                  </span>
                </div>
              )}
              
              <div>
                <span className="text-secondary-600">Position:</span>
                <span className="ml-2 font-medium text-secondary-900">
                  {watermarkSettings.position.split('-').map(word => 
                    word.charAt(0).toUpperCase() + word.slice(1)
                  ).join(' ')}
                </span>
              </div>
              
              <div>
                <span className="text-secondary-600">Transparenz:</span>
                <span className="ml-2 font-medium text-secondary-900">
                  {Math.round(watermarkSettings.opacity * 100)}%
                </span>
              </div>
              
              <div>
                <span className="text-secondary-600">Größe:</span>
                <span className="ml-2 font-medium text-secondary-900">
                  {watermarkSettings.size}%
                </span>
              </div>
              
              <div>
                <span className="text-secondary-600">Rotation:</span>
                <span className="ml-2 font-medium text-secondary-900">
                  {watermarkSettings.rotation}°
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default Preview; 