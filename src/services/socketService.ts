import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { verify } from 'jsonwebtoken';
import { prisma } from '../config/database';
import { SocketUser, ChatEvent, TypingIndicator } from '../types/chat';

export class SocketService {
  private io: SocketIOServer;
  private connectedUsers: Map<string, SocketUser> = new Map();
  private typingUsers: Map<string, TypingIndicator> = new Map();

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    this.setupSocketHandlers();
  }

  private setupSocketHandlers(): void {
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
          return next(new Error('Token de autenticação não fornecido'));
        }

        const decoded = verify(token, process.env.JWT_SECRET || '') as any;
        
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          select: { id: true, name: true, role: true, avatar: true }
        });

        if (!user) {
          return next(new Error('Usuário não encontrado'));
        }

        socket.data.user = user;
        next();
      } catch (error) {
        next(new Error('Token inválido'));
      }
    });

    this.io.on('connection', (socket) => {
      console.log(`Usuário conectado: ${socket.data.user.name} (${socket.id})`);

      socket.on('join_room', async (data) => {
        await this.handleJoinRoom(socket, data);
      });

      socket.on('leave_room', async (data) => {
        await this.handleLeaveRoom(socket, data);
      });

      socket.on('send_message', async (data) => {
        await this.handleSendMessage(socket, data);
      });

      socket.on('typing_start', async (data) => {
        await this.handleTypingStart(socket, data);
      });

      socket.on('typing_stop', async (data) => {
        await this.handleTypingStop(socket, data);
      });

      socket.on('mark_read', async (data) => {
        await this.handleMarkRead(socket, data);
      });

      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });
    });
  }

  private async handleJoinRoom(socket: any, data: { orderId: string }): Promise<void> {
    try {
      const { orderId } = data;
      const user = socket.data.user;

      if (!orderId) {
        socket.emit('error', { message: 'ID do pedido é obrigatório' });
        return;
      }

      const room = await prisma.chatRoom.findUnique({
        where: { orderId },
        include: {
          client: true,
          store: true
        }
      });

      if (!room) {
        socket.emit('error', { message: 'Sala de chat não encontrada' });
        return;
      }

      const isClient = room.clientId === user.id;
      const isStore = room.storeId === user.id;

      if (!isClient && !isStore) {
        socket.emit('error', { message: 'Usuário não tem permissão para acessar esta sala' });
        return;
      }

      const roomName = `order_${orderId}`;
      await socket.join(roomName);

      const socketUser: SocketUser = {
        userId: user.id,
        userType: isClient ? 'CLIENT' : 'STORE',
        socketId: socket.id,
        orderId
      };

      this.connectedUsers.set(socket.id, socketUser);

      socket.emit('joined_room', {
        roomId: room.id,
        orderId,
        userType: socketUser.userType
      });

      socket.to(roomName).emit('user_joined', {
        userId: user.id,
        userName: user.name,
        userType: socketUser.userType,
        timestamp: new Date()
      });

      console.log(`Usuário ${user.name} entrou na sala ${roomName}`);
    } catch (error: any) {
      socket.emit('error', { message: error.message });
    }
  }

  private async handleLeaveRoom(socket: any, data: { orderId: string }): Promise<void> {
    try {
      const { orderId } = data;
      const user = socket.data.user;
      const roomName = `order_${orderId}`;

      await socket.leave(roomName);
      this.connectedUsers.delete(socket.id);

      socket.to(roomName).emit('user_left', {
        userId: user.id,
        userName: user.name,
        timestamp: new Date()
      });

      console.log(`Usuário ${user.name} saiu da sala ${roomName}`);
    } catch (error: any) {
      socket.emit('error', { message: error.message });
    }
  }

  private async handleSendMessage(socket: any, data: any): Promise<void> {
    try {
      const { orderId, message, messageType = 'TEXT' } = data;
      const user = socket.data.user;

      if (!orderId || !message) {
        socket.emit('error', { message: 'orderId e message são obrigatórios' });
        return;
      }

      const room = await prisma.chatRoom.findUnique({
        where: { orderId },
        include: {
          client: true,
          store: true
        }
      });

      if (!room) {
        socket.emit('error', { message: 'Sala de chat não encontrada' });
        return;
      }

      const isClient = room.clientId === user.id;
      const isStore = room.storeId === user.id;

      if (!isClient && !isStore) {
        socket.emit('error', { message: 'Usuário não tem permissão para enviar mensagem nesta sala' });
        return;
      }

      const { chatService } = await import('./chatService');
      const messageResponse = await chatService.sendMessage(user.id, {
        orderId,
        message,
        messageType
      });

      const roomName = `order_${orderId}`;
      const chatEvent: ChatEvent = {
        type: 'MESSAGE_SENT',
        data: messageResponse,
        timestamp: new Date()
      };

      this.io.to(roomName).emit('new_message', chatEvent);

      console.log(`Mensagem enviada na sala ${roomName} por ${user.name}`);
    } catch (error: any) {
      socket.emit('error', { message: error.message });
    }
  }

  private async handleTypingStart(socket: any, data: { orderId: string }): Promise<void> {
    try {
      const { orderId } = data;
      const user = socket.data.user;
      const roomName = `order_${orderId}`;

      const typingIndicator: TypingIndicator = {
        userId: user.id,
        userType: this.connectedUsers.get(socket.id)?.userType || 'CLIENT',
        userName: user.name,
        isTyping: true
      };

      this.typingUsers.set(socket.id, typingIndicator);

      socket.to(roomName).emit('typing_start', typingIndicator);
    } catch (error: any) {
      socket.emit('error', { message: error.message });
    }
  }

  private async handleTypingStop(socket: any, data: { orderId: string }): Promise<void> {
    try {
      const { orderId } = data;
      const user = socket.data.user;
      const roomName = `order_${orderId}`;

      const typingIndicator: TypingIndicator = {
        userId: user.id,
        userType: this.connectedUsers.get(socket.id)?.userType || 'CLIENT',
        userName: user.name,
        isTyping: false
      };

      this.typingUsers.delete(socket.id);

      socket.to(roomName).emit('typing_stop', typingIndicator);
    } catch (error: any) {
      socket.emit('error', { message: error.message });
    }
  }

  private async handleMarkRead(socket: any, data: { orderId: string }): Promise<void> {
    try {
      const { orderId } = data;
      const user = socket.data.user;

      const { chatService } = await import('./chatService');
      await chatService.markMessagesAsRead(orderId, user.id);

      const roomName = `order_${orderId}`;
      const chatEvent: ChatEvent = {
        type: 'MESSAGE_READ',
        data: { userId: user.id, orderId },
        timestamp: new Date()
      };

      socket.to(roomName).emit('messages_read', chatEvent);
    } catch (error: any) {
      socket.emit('error', { message: error.message });
    }
  }

  private handleDisconnect(socket: any): void {
    const user = socket.data.user;
    const socketUser = this.connectedUsers.get(socket.id);

    if (socketUser) {
      const roomName = `order_${socketUser.orderId}`;
      socket.to(roomName).emit('user_left', {
        userId: user.id,
        userName: user.name,
        timestamp: new Date()
      });

      this.connectedUsers.delete(socket.id);
    }

    this.typingUsers.delete(socket.id);
    console.log(`Usuário ${user.name} desconectado (${socket.id})`);
  }

  public emitToRoom(roomId: string, event: string, data: any): void {
    this.io.to(`order_${roomId}`).emit(event, data);
  }

  public emitToUser(userId: string, event: string, data: any): void {
    const userSocket = Array.from(this.connectedUsers.values()).find(
      user => user.userId === userId
    );

    if (userSocket) {
      this.io.to(userSocket.socketId).emit(event, data);
    }
  }

  public getConnectedUsers(): SocketUser[] {
    return Array.from(this.connectedUsers.values());
  }

  public getTypingUsers(): TypingIndicator[] {
    return Array.from(this.typingUsers.values());
  }
}

let socketService: SocketService | null = null;

export const initializeSocketService = (server: HTTPServer): SocketService => {
  if (!socketService) {
    socketService = new SocketService(server);
  }
  return socketService;
};

export const getSocketService = (): SocketService | null => {
  return socketService;
};
