// src/socket.ts
import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { Driver } from './modules/Driver/driver.model';

let io: SocketIOServer;

export const onlineUsers: Record<string, string> = {}; // userId -> socketId

export const initSocket = (server: HTTPServer) => {
  io = new SocketIOServer(server, {
    cors: {
      origin: '*', // frontend URL
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log('⚡ User connected:', socket.id);

    // Register user
    socket.on('register', (userId: string) => {
      onlineUsers[userId] = socket.id;
      console.log(`✅ User ${userId} registered`);
    });

    socket.on('updateLocation', async (data) => {
      try {
        const { userId, lat, lng } = data;

        // Validate coordinates
        if (
          lat == null ||
          lng == null ||
          isNaN(lat) ||
          isNaN(lng) ||
          (lat === 0 && lng === 0)
        ) {
          console.warn(`Invalid coordinates received for driver ${userId}`);
          return;
        }
        // Update currentLocation in DB
        const updatedDriver = await Driver.findOneAndUpdate(
          { user: userId }, // make sure userId matches your DB field
          {
            currentLocation: { lat, lon: lng },
            // optionally, you can also update your GeoJSON location here
          },
          { new: true },
        );

        if (!updatedDriver) {
          console.warn(`Driver not found: ${userId}`);
          return;
        }
        console.log({ updatedDriver });

        // Emit to passengers
        io.emit(`driverLocation-${userId}`, { userId, lat, lng });

        console.log(`Location updated for driver ${userId}`);
      } catch (err) {
        console.error('Error updating driver location:', err);
      }
    });

    socket.on('disconnect', () => {
      console.log('❌ Disconnected:', socket.id);
      Object.keys(onlineUsers).forEach((userId) => {
        if (onlineUsers[userId] === socket.id) {
          delete onlineUsers[userId];
        }
      });
    });
  });

  return io;
};

// Export io for emitting events from other files
export const getIO = () => {
  if (!io) throw new Error('Socket.io not initialized!');
  return io;
};
