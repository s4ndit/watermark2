const { getJobStatus: getImageJobStatus } = require('../services/imageProcessor');
const { getJobStatus: getVideoJobStatus } = require('../services/videoProcessor');

let socketInstance = null;

function initializeSocketHandlers(io) {
    socketInstance = io;
    
    io.on('connection', (socket) => {
        console.log(`🔗 Client verbunden: ${socket.id}`);
        
        // Job-Status abonnieren
        socket.on('subscribe-job', (data) => {
            let jobId, jobType;
            
            // Handle both old format (string) and new format (object)
            if (typeof data === 'string') {
                jobId = data;
                jobType = null;
            } else if (typeof data === 'object' && data.jobId) {
                jobId = data.jobId;
                jobType = data.jobType || null;
            } else {
                console.error('Invalid job subscription data:', data);
                return;
            }
            
            console.log(`📊 Client ${socket.id} abonniert Job: ${jobId}${jobType ? ` (${jobType})` : ''}`);
            socket.join(`job-${jobId}`);
            
            // Aktuellen Status senden, falls vorhanden
            const currentStatus = getCurrentJobStatus(jobId, jobType);
            if (currentStatus) {
                // Handle collision case
                if (currentStatus.collision) {
                    console.warn(`Job ID collision for ${jobId}, sending image processor status`);
                    socket.emit('job-status', {
                        jobId,
                        ...currentStatus,
                        timestamp: new Date().toISOString()
                    });
                } else {
                    // Send current status to the subscribing client
                    socket.emit('job-status', {
                        jobId,
                        ...currentStatus,
                        timestamp: new Date().toISOString()
                    });
                }
                
                // Also send specific status event based on current state
                if (currentStatus.status === 'processing') {
                    socket.emit('job-progress', {
                        jobId,
                        progress: currentStatus.progress,
                        message: currentStatus.message,
                        processorType: currentStatus.processorType,
                        timestamp: new Date().toISOString()
                    });
                } else if (currentStatus.status === 'completed') {
                    socket.emit('job-complete', {
                        jobId,
                        outputFile: currentStatus.outputFile,
                        message: currentStatus.message,
                        processorType: currentStatus.processorType,
                        timestamp: new Date().toISOString()
                    });
                } else if (currentStatus.status === 'error') {
                    socket.emit('job-error', {
                        jobId,
                        error: currentStatus.error,
                        message: currentStatus.message,
                        processorType: currentStatus.processorType,
                        timestamp: new Date().toISOString()
                    });
                }
            }
        });

        // Job-Status abmelden
        socket.on('unsubscribe-job', (jobId) => {
            console.log(`📊 Client ${socket.id} meldet sich von Job ab: ${jobId}`);
            socket.leave(`job-${jobId}`);
        });

        // Allgemeine Nachrichten
        socket.on('ping', () => {
            socket.emit('pong', {
                timestamp: new Date().toISOString(),
                serverId: process.env.SERVER_ID || 'server-1'
            });
        });

        // Verbindung getrennt
        socket.on('disconnect', (reason) => {
            console.log(`🔌 Client getrennt: ${socket.id}, Grund: ${reason}`);
        });

        // Fehlerbehandlung
        socket.on('error', (error) => {
            console.error(`❌ Socket-Fehler für ${socket.id}:`, error);
        });
    });

    // Periodische Aufräumarbeiten
    setInterval(() => {
        cleanupOldJobs();
    }, 60000); // Alle 60 Sekunden

    console.log('⚡ Socket.io-Handler initialisiert');
}

function getSocketInstance() {
    return socketInstance;
}

// Helper function to get current job status from processor services
function getCurrentJobStatus(jobId, jobType = null) {
    // If job type is specified, check only that processor
    if (jobType === 'image') {
        return getImageJobStatus(jobId);
    } else if (jobType === 'video') {
        return getVideoJobStatus(jobId);
    }
    
    // If no job type specified, check both processors
    const imageStatus = getImageJobStatus(jobId);
    const videoStatus = getVideoJobStatus(jobId);
    
    // If both processors have the same job ID (edge case), return both with type info
    if (imageStatus && videoStatus) {
        console.warn(`Job ID collision detected for jobId: ${jobId}`);
        return {
            ...imageStatus,
            processorType: 'image',
            collision: true,
            alternativeStatus: {
                ...videoStatus,
                processorType: 'video'
            }
        };
    }
    
    // Return status from whichever processor has the job
    if (imageStatus) {
        return {
            ...imageStatus,
            processorType: 'image'
        };
    }
    
    if (videoStatus) {
        return {
            ...videoStatus,
            processorType: 'video'
        };
    }
    
    return null;
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

function cleanupOldJobs() {
    // Job cleanup is now handled internally by the processor services
    // This function remains for backward compatibility but is no longer needed
    console.log('🧹 Job cleanup is now handled by individual processor services');
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
    initializeSocketHandlers,
    getSocketInstance,
    getCurrentJobStatus,
    broadcastJobProgress,
    broadcastJobComplete,
    broadcastJobError,
    cleanupOldJobs
}; 