import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { SketchPicker } from 'react-color';
import { 
  Type, 
  Image, 
  RotateCw, 
  Move, 
  Palette, 
  Sliders, 
  Eye,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

const WatermarkControls = ({ 
  settings, 
  onSettingsChange, 
  currentFile, 
  watermarkFile, 
  onPreviewGenerate 
}) => {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    type: true,
    text: true,
    appearance: true,
    position: true
  });

  const positions = [
    { value: 'top-left', label: 'Oben Links' },
    { value: 'top-center', label: 'Oben Mitte' },
    { value: 'top-right', label: 'Oben Rechts' },
    { value: 'center-left', label: 'Mitte Links' },
    { value: 'center', label: 'Mitte' },
    { value: 'center-right', label: 'Mitte Rechts' },
    { value: 'bottom-left', label: 'Unten Links' },
    { value: 'bottom-center', label: 'Unten Mitte' },
    { value: 'bottom-right', label: 'Unten Rechts' }
  ];

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleChange = (field, value) => {
    onSettingsChange({
      ...settings,
      [field]: value
    });
  };

  const generatePreview = async () => {
    if (!currentFile) {
      toast.error('Bitte laden Sie zuerst eine Datei hoch');
      return;
    }

    if (settings.type === 'image' && !watermarkFile) {
      toast.error('Bitte laden Sie ein Wasserzeichen-Bild hoch');
      return;
    }

    if (settings.type === 'text' && !settings.text) {
      toast.error('Bitte geben Sie einen Text ein');
      return;
    }

    try {
      const response = await axios.post('/api/watermark/preview', {
        sourceFile: currentFile.filename,
        watermarkType: settings.type,
        watermarkFile: watermarkFile?.filename,
        textWatermark: settings.text,
        params: settings
      });

      if (response.data.success) {
        onPreviewGenerate(response.data.previewUrl);
        toast.success('Vorschau generiert!');
      }
    } catch (error) {
      console.error('Vorschau-Fehler:', error);
      toast.error(error.response?.data?.error || 'Fehler beim Generieren der Vorschau');
    }
  };

  const SectionHeader = ({ title, icon: Icon, section }) => (
    <button
      onClick={() => toggleSection(section)}
      className="flex items-center justify-between w-full p-4 bg-secondary-50 rounded-lg hover:bg-secondary-100 transition-colors"
    >
      <div className="flex items-center space-x-3">
        <Icon className="w-5 h-5 text-primary-500" />
        <h3 className="font-medium text-secondary-900">{title}</h3>
      </div>
      {expandedSections[section] ? (
        <ChevronUp className="w-5 h-5 text-secondary-400" />
      ) : (
        <ChevronDown className="w-5 h-5 text-secondary-400" />
      )}
    </button>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="bg-white rounded-xl shadow-sm border border-secondary-200 p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-secondary-900">
          3. Wasserzeichen-Einstellungen
        </h2>
        <button
          onClick={generatePreview}
          className="flex items-center space-x-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
        >
          <Eye className="w-4 h-4" />
          <span>Vorschau</span>
        </button>
      </div>

      <div className="space-y-4">
        {/* Typ Auswahl */}
        <div>
          <SectionHeader title="Wasserzeichen-Typ" icon={Type} section="type" />
          {expandedSections.type && (
            <div className="mt-4 p-4 bg-white rounded-lg border border-secondary-200">
              <div className="grid grid-cols-3 gap-2">
                {['text', 'image', 'both'].map((type) => (
                  <button
                    key={type}
                    onClick={() => handleChange('type', type)}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      settings.type === type
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-secondary-200 hover:border-primary-300'
                    }`}
                  >
                    {type === 'text' && <Type className="w-5 h-5 mx-auto mb-1" />}
                    {type === 'image' && <Image className="w-5 h-5 mx-auto mb-1" />}
                    {type === 'both' && <Sliders className="w-5 h-5 mx-auto mb-1" />}
                    <span className="text-sm font-medium capitalize">
                      {type === 'text' ? 'Text' : type === 'image' ? 'Bild' : 'Beide'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Text Einstellungen */}
        {(settings.type === 'text' || settings.type === 'both') && (
          <div>
            <SectionHeader title="Text-Einstellungen" icon={Type} section="text" />
            {expandedSections.text && (
              <div className="mt-4 p-4 bg-white rounded-lg border border-secondary-200 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Wasserzeichen-Text
                  </label>
                  <input
                    type="text"
                    value={settings.text}
                    onChange={(e) => handleChange('text', e.target.value)}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Ihr Wasserzeichen-Text"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Schriftgröße: {settings.fontSize}px
                  </label>
                  <input
                    type="range"
                    min="12"
                    max="72"
                    value={settings.fontSize}
                    onChange={(e) => handleChange('fontSize', parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Textfarbe
                  </label>
                  <div className="relative">
                    <button
                      onClick={() => setShowColorPicker(!showColorPicker)}
                      className="flex items-center space-x-2 px-3 py-2 border border-secondary-300 rounded-lg hover:border-secondary-400 transition-colors"
                    >
                      <div
                        className="w-6 h-6 rounded border border-secondary-300"
                        style={{ backgroundColor: settings.fontColor }}
                      />
                      <span className="text-sm text-secondary-700">
                        {settings.fontColor}
                      </span>
                    </button>
                    {showColorPicker && (
                      <div className="absolute top-full left-0 mt-2 z-10">
                        <div
                          className="fixed inset-0"
                          onClick={() => setShowColorPicker(false)}
                        />
                        <SketchPicker
                          color={settings.fontColor}
                          onChange={(color) => handleChange('fontColor', color.hex)}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Erscheinung */}
        <div>
          <SectionHeader title="Erscheinung" icon={Palette} section="appearance" />
          {expandedSections.appearance && (
            <div className="mt-4 p-4 bg-white rounded-lg border border-secondary-200 space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Transparenz: {Math.round(settings.opacity * 100)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={settings.opacity}
                  onChange={(e) => handleChange('opacity', parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Größe: {settings.size}%
                </label>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={settings.size}
                  onChange={(e) => handleChange('size', parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Rotation: {settings.rotation}°
                </label>
                <input
                  type="range"
                  min="-180"
                  max="180"
                  value={settings.rotation}
                  onChange={(e) => handleChange('rotation', parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          )}
        </div>

        {/* Position */}
        <div>
          <SectionHeader title="Position" icon={Move} section="position" />
          {expandedSections.position && (
            <div className="mt-4 p-4 bg-white rounded-lg border border-secondary-200 space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Position
                </label>
                <select
                  value={settings.position}
                  onChange={(e) => handleChange('position', e.target.value)}
                  className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  {positions.map((pos) => (
                    <option key={pos.value} value={pos.value}>
                      {pos.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Rand: {settings.margin}px
                </label>
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={settings.margin}
                  onChange={(e) => handleChange('margin', parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default WatermarkControls; 