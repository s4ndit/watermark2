import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
import { Upload, X, FileImage, FileVideo, Image } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

const FileUpload = ({ onFileUpload, onWatermarkUpload, currentFile, watermarkFile }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadingWatermark, setUploadingWatermark] = useState(false);

  const uploadFile = async (file, isWatermark = false) => {
    const formData = new FormData();
    formData.append(isWatermark ? 'watermark' : 'file', file);

    try {
      const endpoint = isWatermark ? '/api/upload/watermark' : '/api/upload/file';
      const response = await axios.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        const fileData = isWatermark ? response.data.watermark : response.data.file;
        
        if (isWatermark) {
          onWatermarkUpload(fileData);
          toast.success('Wasserzeichen erfolgreich hochgeladen!');
        } else {
          onFileUpload(fileData);
          toast.success('Datei erfolgreich hochgeladen!');
        }
      }
    } catch (error) {
      console.error('Upload-Fehler:', error);
      toast.error(error.response?.data?.error || 'Fehler beim Hochladen');
    }
  };

  const onMainDrop = useCallback(async (acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      setUploading(true);
      await uploadFile(acceptedFiles[0], false);
      setUploading(false);
    }
  }, []);

  const onWatermarkDrop = useCallback(async (acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      setUploadingWatermark(true);
      await uploadFile(acceptedFiles[0], true);
      setUploadingWatermark(false);
    }
  }, []);

  const mainDropzone = useDropzone({
    onDrop: onMainDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
      'video/*': ['.mp4', '.avi', '.mov', '.mkv', '.webm']
    },
    maxFiles: 1,
    maxSize: 500 * 1024 * 1024, // 500MB
  });

  const watermarkDropzone = useDropzone({
    onDrop: onWatermarkDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const removeFile = (isWatermark = false) => {
    if (isWatermark) {
      onWatermarkUpload(null);
    } else {
      onFileUpload(null);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Hauptdatei Upload */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-xl shadow-sm border border-secondary-200 p-6"
      >
        <h2 className="text-lg font-semibold text-secondary-900 mb-4">
          1. Datei hochladen
        </h2>
        
        {currentFile ? (
          <div className="flex items-center justify-between p-4 bg-primary-50 rounded-lg border border-primary-200">
            <div className="flex items-center space-x-3">
              {currentFile.type === 'image' ? (
                <FileImage className="w-8 h-8 text-primary-500" />
              ) : (
                <FileVideo className="w-8 h-8 text-primary-500" />
              )}
              <div>
                <p className="font-medium text-secondary-900">
                  {currentFile.originalName}
                </p>
                <p className="text-sm text-secondary-600">
                  {formatFileSize(currentFile.size)}
                  {currentFile.width && currentFile.height && 
                    ` • ${currentFile.width}x${currentFile.height}`
                  }
                </p>
              </div>
            </div>
            <button
              onClick={() => removeFile(false)}
              className="p-2 text-secondary-400 hover:text-error-500 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <div
            {...mainDropzone.getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer ${
              mainDropzone.isDragActive
                ? 'border-primary-400 bg-primary-50'
                : 'border-secondary-300 hover:border-primary-400 hover:bg-primary-50'
            }`}
          >
            <input {...mainDropzone.getInputProps()} />
            <Upload className="w-12 h-12 text-secondary-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-secondary-700 mb-2">
              {uploading ? 'Wird hochgeladen...' : 'Datei hier ablegen'}
            </p>
            <p className="text-sm text-secondary-500">
              oder klicken zum Auswählen
            </p>
            <p className="text-xs text-secondary-400 mt-2">
              Unterstützt: Bilder (PNG, JPG, GIF, WebP) und Videos (MP4, AVI, MOV, MKV, WebM)
            </p>
          </div>
        )}
      </motion.div>

      {/* Wasserzeichen Upload */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="bg-white rounded-xl shadow-sm border border-secondary-200 p-6"
      >
        <h2 className="text-lg font-semibold text-secondary-900 mb-4">
          2. Bildwasserzeichen (Optional)
        </h2>
        
        {watermarkFile ? (
          <div className="flex items-center justify-between p-4 bg-success-50 rounded-lg border border-success-200">
            <div className="flex items-center space-x-3">
              <Image className="w-8 h-8 text-success-500" />
              <div>
                <p className="font-medium text-secondary-900">
                  {watermarkFile.originalName}
                </p>
                <p className="text-sm text-secondary-600">
                  {formatFileSize(watermarkFile.size)}
                  {watermarkFile.width && watermarkFile.height && 
                    ` • ${watermarkFile.width}x${watermarkFile.height}`
                  }
                </p>
              </div>
            </div>
            <button
              onClick={() => removeFile(true)}
              className="p-2 text-secondary-400 hover:text-error-500 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <div
            {...watermarkDropzone.getRootProps()}
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-all cursor-pointer ${
              watermarkDropzone.isDragActive
                ? 'border-success-400 bg-success-50'
                : 'border-secondary-300 hover:border-success-400 hover:bg-success-50'
            }`}
          >
            <input {...watermarkDropzone.getInputProps()} />
            <Image className="w-10 h-10 text-secondary-400 mx-auto mb-3" />
            <p className="font-medium text-secondary-700 mb-1">
              {uploadingWatermark ? 'Wird hochgeladen...' : 'Wasserzeichen-Bild'}
            </p>
            <p className="text-sm text-secondary-500">
              PNG oder JPG für beste Qualität
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default FileUpload; 