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
            // Note: Job status is now handled internally by the processor services
            // This will be handled by the individual services when they emit status updates
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