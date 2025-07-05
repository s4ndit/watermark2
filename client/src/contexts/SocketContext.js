import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

export const useSocketContext = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocketContext must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionAttempts, setConnectionAttempts] = useState(0);

  useEffect(() => {
    const newSocket = io(process.env.NODE_ENV === 'production' ? window.location.origin : 'http://localhost:3001', {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      console.log('🔗 Socket verbunden:', newSocket.id);
      setIsConnected(true);
      setConnectionAttempts(0);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('🔌 Socket getrennt:', reason);
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ Socket-Verbindungsfehler:', error);
      setConnectionAttempts(prev => prev + 1);
    });

    newSocket.on('reconnect', (attemptNumber) => {
      console.log('🔄 Socket wiederverbunden nach', attemptNumber, 'Versuchen');
      setIsConnected(true);
      setConnectionAttempts(0);
    });

    newSocket.on('reconnect_error', (error) => {
      console.error('❌ Socket-Wiederverbindungsfehler:', error);
      setConnectionAttempts(prev => prev + 1);
    });

    newSocket.on('reconnect_failed', () => {
      console.error('💥 Socket-Wiederverbindung fehlgeschlagen');
      setIsConnected(false);
    });

    // Ping-Pong für Verbindungstest
    const pingInterval = setInterval(() => {
      if (newSocket.connected) {
        newSocket.emit('ping');
      }
    }, 30000);

    newSocket.on('pong', (data) => {
      console.log('🏓 Pong erhalten:', data);
    });

    setSocket(newSocket);

    return () => {
      clearInterval(pingInterval);
      newSocket.close();
    };
  }, []);

  const value = {
    socket,
    isConnected,
    connectionAttempts
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}; 