let socketInstance = null;

function initializeBroadcaster(io) {
    socketInstance = io;
    console.log('📡 Socket broadcaster initialized');
}

function getSocketInstance() {
    return socketInstance;
}

function broadcastJobProgress(jobId, progress, message, processorType = null) {
    if (socketInstance) {
        socketInstance.to(`job-${jobId}`).emit('job-progress', {
            jobId,
            progress,
            message,
            processorType,
            timestamp: new Date().toISOString()
        });
    }
}

function broadcastJobComplete(jobId, outputFile, message, processorType = null) {
    if (socketInstance) {
        socketInstance.to(`job-${jobId}`).emit('job-complete', {
            jobId,
            outputFile,
            message,
            processorType,
            timestamp: new Date().toISOString()
        });
    }
}

function broadcastJobError(jobId, error, message, processorType = null) {
    if (socketInstance) {
        socketInstance.to(`job-${jobId}`).emit('job-error', {
            jobId,
            error,
            message,
            processorType,
            timestamp: new Date().toISOString()
        });
    }
}

// System-Statistiken senden
function broadcastSystemStats() {
    if (socketInstance) {
        const stats = {
            uptime: process.uptime(),
            memoryUsage: process.memoryUsage(),
            activeJobs: 0, // Active jobs are now tracked internally by processor services
            timestamp: new Date().toISOString()
        };
        
        socketInstance.emit('system-stats', stats);
    }
}

// Periodische System-Statistiken
setInterval(broadcastSystemStats, 30000); // Alle 30 Sekunden

module.exports = {
    initializeBroadcaster,
    getSocketInstance,
    broadcastJobProgress,
    broadcastJobComplete,
    broadcastJobError,
    broadcastSystemStats
};