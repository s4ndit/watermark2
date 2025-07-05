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
            if (global.jobStatuses && global.jobStatuses[jobId]) {
                socket.emit('job-status', {
                    jobId,
                    ...global.jobStatuses[jobId]
                });
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
    if (!global.jobStatuses) return;
    
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 Stunden
    
    Object.keys(global.jobStatuses).forEach(jobId => {
        const job = global.jobStatuses[jobId];
        const jobTime = job.endTime || job.startTime || now;
        
        if (now - jobTime > maxAge) {
            console.log(`🧹 Lösche alten Job: ${jobId}`);
            delete global.jobStatuses[jobId];
        }
    });
}

// System-Statistiken senden
function broadcastSystemStats() {
    if (socketInstance) {
        const stats = {
            uptime: process.uptime(),
            memoryUsage: process.memoryUsage(),
            activeJobs: global.jobStatuses ? Object.keys(global.jobStatuses).length : 0,
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