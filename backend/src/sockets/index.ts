import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';

let io: SocketIOServer;

export function initializeSocket(httpServer: HTTPServer) {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('join-event', (eventId: string) => {
      socket.join(`event:${eventId}`);
      console.log(`Client ${socket.id} joined event:${eventId}`);
    });

    socket.on('leave-event', (eventId: string) => {
      socket.leave(`event:${eventId}`);
      console.log(`Client ${socket.id} left event:${eventId}`);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  return io;
}

export function getIO() {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
}

// Helper functions to broadcast events
export function broadcastEventUpdate(eventId: number, data: any) {
  const socketIO = getIO();
  socketIO.to(`event:${eventId}`).emit('event:update', {
    eventId,
    ...data,
  });
}

export function broadcastOddsUpdate(eventId: number, marketId: number, odds: any[]) {
  const socketIO = getIO();
  socketIO.to(`event:${eventId}`).emit('odds:update', {
    eventId,
    marketId,
    odds,
  });
}

export function broadcastBetPlaced(userId: number, bet: any) {
  const socketIO = getIO();
  socketIO.emit('bet:placed', {
    userId,
    bet,
  });
}

export function broadcastBetSettled(userId: number, bet: any) {
  const socketIO = getIO();
  socketIO.emit('bet:settled', {
    userId,
    bet,
  });
}

export function broadcastWalletUpdate(userId: number, wallet: any) {
  const socketIO = getIO();
  socketIO.emit('wallet:update', {
    userId,
    wallet,
  });
}
