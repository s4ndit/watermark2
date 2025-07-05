import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Pause, 
  Download, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Loader2,
  AlertCircle 
} from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { useSocket } from '../hooks/useSocket';

const ProcessingStatus = ({ 
  isProcessing, 
  currentJobId, 
  onProcessingStart, 
  onJobIdChange,
  currentFile,
  watermarkFile,
  watermarkSettings
}) => {
  const [jobStatus, setJobStatus] = useState(null);
  const [processingHistory, setProcessingHistory] = useState([]);
  const { socket, isConnected } = useSocket();

  useEffect(() => {
    if (socket && currentJobId) {
      socket.emit('subscribe-job', currentJobId);
      
      socket.on('job-progress', (data) => {
        if (data.jobId === currentJobId) {
          setJobStatus(data);
        }
      });

      socket.on('job-complete', (data) => {
        if (data.jobId === currentJobId) {
          setJobStatus({
            status: 'completed',
            progress: 100,
            message: data.message,
            outputFile: data.outputFile
          });
          
          onProcessingStart(false);
          toast.success('Verarbeitung erfolgreich abgeschlossen!');
          
          // Zu Historie hinzufügen
          setProcessingHistory(prev => [{
            id: currentJobId,
            filename: currentFile?.originalName,
            outputFile: data.outputFile,
            completedAt: new Date().toLocaleString(),
            status: 'completed'
          }, ...prev.slice(0, 4)]);
        }
      });

      socket.on('job-error', (data) => {
        if (data.jobId === currentJobId) {
          setJobStatus({
            status: 'error',
            progress: 0,
            message: data.message,
            error: data.error
          });
          
          onProcessingStart(false);
          toast.error('Fehler bei der Verarbeitung!');
        }
      });

      return () => {
        socket.off('job-progress');
        socket.off('job-complete');
        socket.off('job-error');
        socket.emit('unsubscribe-job', currentJobId);
      };
    }
  }, [socket, currentJobId]);

  const startProcessing = async () => {
    if (!currentFile) {
      toast.error('Bitte laden Sie zuerst eine Datei hoch');
      return;
    }

    if (watermarkSettings.type === 'image' && !watermarkFile) {
      toast.error('Bitte laden Sie ein Wasserzeichen-Bild hoch');
      return;
    }

    if (watermarkSettings.type === 'text' && !watermarkSettings.text) {
      toast.error('Bitte geben Sie einen Text ein');
      return;
    }

    try {
      const response = await axios.post('/api/watermark/process', {
        sourceFile: currentFile.filename,
        watermarkType: watermarkSettings.type,
        watermarkFile: watermarkFile?.filename,
        textWatermark: watermarkSettings.text,
        params: watermarkSettings
      });

      if (response.data.success) {
        onProcessingStart(true);
        onJobIdChange(response.data.jobId);
        setJobStatus({
          status: 'processing',
          progress: 0,
          message: 'Verarbeitung gestartet...'
        });
        
        toast.success('Verarbeitung gestartet!');
      }
    } catch (error) {
      console.error('Processing-Fehler:', error);
      toast.error(error.response?.data?.error || 'Fehler beim Starten der Verarbeitung');
    }
  };

  const downloadFile = (filename) => {
    const link = document.createElement('a');
    link.href = `/downloads/${filename}`;
    link.download = filename;
    link.click();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'processing':
        return <Loader2 className="w-5 h-5 animate-spin text-primary-500" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-success-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-error-500" />;
      default:
        return <Clock className="w-5 h-5 text-secondary-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'processing':
        return 'bg-primary-50 border-primary-200 text-primary-700';
      case 'completed':
        return 'bg-success-50 border-success-200 text-success-700';
      case 'error':
        return 'bg-error-50 border-error-200 text-error-700';
      default:
        return 'bg-secondary-50 border-secondary-200 text-secondary-700';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="bg-white rounded-xl shadow-sm border border-secondary-200 p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-secondary-900">
          4. Verarbeitung
        </h2>
        
        <div className="flex items-center space-x-2">
          <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
            isConnected ? 'bg-success-100 text-success-700' : 'bg-error-100 text-error-700'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-success-500' : 'bg-error-500'
            }`} />
            <span>{isConnected ? 'Verbunden' : 'Getrennt'}</span>
          </div>
        </div>
      </div>

      {/* Aktueller Status */}
      <div className="mb-6">
        {!isProcessing && !jobStatus && (
          <div className="text-center py-8">
            <Play className="w-12 h-12 text-primary-500 mx-auto mb-4" />
            <p className="text-secondary-600 mb-4">
              Bereit für die Verarbeitung
            </p>
            <button
              onClick={startProcessing}
              disabled={!currentFile}
              className="px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:bg-secondary-300 disabled:cursor-not-allowed transition-colors"
            >
              Verarbeitung starten
            </button>
          </div>
        )}

        {jobStatus && (
          <div className={`p-4 rounded-lg border ${getStatusColor(jobStatus.status)}`}>
            <div className="flex items-center space-x-3 mb-3">
              {getStatusIcon(jobStatus.status)}
              <div className="flex-1">
                <p className="font-medium">
                  {jobStatus.message || 'Verarbeitung läuft...'}
                </p>
                {jobStatus.status === 'processing' && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span>Fortschritt</span>
                      <span>{jobStatus.progress}%</span>
                    </div>
                    <div className="w-full bg-secondary-200 rounded-full h-2">
                      <div
                        className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${jobStatus.progress}%` }}
                      />
                    </div>
                  </div>
                )}
                {jobStatus.status === 'completed' && jobStatus.outputFile && (
                  <button
                    onClick={() => downloadFile(jobStatus.outputFile)}
                    className="mt-2 flex items-center space-x-2 px-4 py-2 bg-success-500 text-white rounded-lg hover:bg-success-600 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Herunterladen</span>
                  </button>
                )}
                {jobStatus.status === 'error' && (
                  <div className="mt-2 flex items-center space-x-2 text-error-600">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm">
                      {jobStatus.error || 'Unbekannter Fehler'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Verarbeitungshistorie */}
      {processingHistory.length > 0 && (
        <div>
          <h3 className="font-medium text-secondary-900 mb-3">
            Kürzliche Verarbeitungen
          </h3>
          <div className="space-y-2">
            {processingHistory.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 bg-secondary-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-4 h-4 text-success-500" />
                  <div>
                    <p className="font-medium text-secondary-900 text-sm">
                      {item.filename}
                    </p>
                    <p className="text-xs text-secondary-500">
                      {item.completedAt}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => downloadFile(item.outputFile)}
                  className="p-2 text-secondary-400 hover:text-primary-500 transition-colors"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default ProcessingStatus; 