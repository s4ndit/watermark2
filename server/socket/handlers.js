const { getJobStatus: getImageJobStatus } = require('../services/imageProcessor');
const { getJobStatus: getVideoJobStatus } = require('../services/videoProcessor');

let socketInstance = null;

function initializeSocketHandlers(io) {
    socketInstance = io;
    
    io.on('connection', (socket) => {
        console.log(`🔗 Client verbunden: ${socket.id}`);
        
        // Job-Status abonnieren
        socket.on('subscribe-job', (jobId) => {
            console.log(`📊 Client ${socket.id} abonniert Job: ${jobId}`);
            socket.join(`job-${jobId}`);
            
            // Aktuellen Status senden, falls vorhanden
            const currentStatus = getCurrentJobStatus(jobId);
            if (currentStatus) {
                // Send current status to the subscribing client
                socket.emit('job-status', {
                    jobId,
                    ...currentStatus,
                    timestamp: new Date().toISOString()
                });
                
                // Also send specific status event based on current state
                if (currentStatus.status === 'processing') {
                    socket.emit('job-progress', {
                        jobId,
                        progress: currentStatus.progress,
                        message: currentStatus.message,
                        timestamp: new Date().toISOString()
                    });
                } else if (currentStatus.status === 'completed') {
                    socket.emit('job-complete', {
                        jobId,
                        outputFile: currentStatus.outputFile,
                        message: currentStatus.message,
                        timestamp: new Date().toISOString()
                    });
                } else if (currentStatus.status === 'error') {
                    socket.emit('job-error', {
                        jobId,
                        error: currentStatus.error,
                        message: currentStatus.message,
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
function getCurrentJobStatus(jobId) {
    // Check image processor first
    let status = getImageJobStatus(jobId);
    if (status) {
        return status;
    }
    
    // Check video processor if not found in image processor
    status = getVideoJobStatus(jobId);
    if (status) {
        return status;
    }
    
    return null;
}

function broadcastJobProgress(jobId, progress, message) {
    if (socketInstance) {
        socketInstance.to(`job-${jobId}`).emit('job-progress', {
            jobId,
            progress,
            message,
            timestamp: new Date().toISOString()
        });
    }
}

function broadcastJobComplete(jobId, outputFile, message) {
    if (socketInstance) {
        socketInstance.to(`job-${jobId}`).emit('job-complete', {
            jobId,
            outputFile,
            message,
            timestamp: new Date().toISOString()
        });
    }
}

function broadcastJobError(jobId, error, message) {
    if (socketInstance) {
        socketInstance.to(`job-${jobId}`).emit('job-error', {
            jobId,
            error,
            message,
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
    broadcastJobProgress,
    broadcastJobComplete,
    broadcastJobError,
    cleanupOldJobs
}; 