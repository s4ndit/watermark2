import { useSocketContext } from '../contexts/SocketContext';

export const useSocket = () => {
  const { socket, isConnected, connectionAttempts } = useSocketContext();

  const subscribeToJob = (jobId) => {
    if (socket && jobId) {
      socket.emit('subscribe-job', jobId);
    }
  };

  const unsubscribeFromJob = (jobId) => {
    if (socket && jobId) {
      socket.emit('unsubscribe-job', jobId);
    }
  };

  const onJobProgress = (callback) => {
    if (socket) {
      socket.on('job-progress', callback);
      return () => socket.off('job-progress', callback);
    }
  };

  const onJobComplete = (callback) => {
    if (socket) {
      socket.on('job-complete', callback);
      return () => socket.off('job-complete', callback);
    }
  };

  const onJobError = (callback) => {
    if (socket) {
      socket.on('job-error', callback);
      return () => socket.off('job-error', callback);
    }
  };

  const onSystemStats = (callback) => {
    if (socket) {
      socket.on('system-stats', callback);
      return () => socket.off('system-stats', callback);
    }
  };

  return {
    socket,
    isConnected,
    connectionAttempts,
    subscribeToJob,
    unsubscribeFromJob,
    onJobProgress,
    onJobComplete,
    onJobError,
    onSystemStats
  };
}; 