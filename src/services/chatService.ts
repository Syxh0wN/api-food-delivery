import { prisma } from '../config/database';
import {
  CreateMessageInput,
  ChatRoomResponse,
  MessageResponse,
  ChatHistoryResponse,
  ChatRoomListResponse,
  ChatFilter,
  ChatRoomFilter,
  ChatSystemMessage,
  ChatStats
} from '../types/chat';
import { SenderType, MessageType } from '@prisma/client';

export class ChatService {
  async createChatRoom(orderId: string): Promise<ChatRoomResponse> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: true,
        store: true
      }
    });

    if (!order) {
      throw new Error('Pedido não encontrado');
    }

    const existingRoom = await prisma.chatRoom.findUnique({
      where: { orderId }
    });

    if (existingRoom) {
      return this.getChatRoomById(existingRoom.id);
    }

    const chatRoom = await prisma.chatRoom.create({
      data: {
        orderId,
        clientId: order.userId,
        storeId: order.store.ownerId
      },
      include: {
        client: true,
        store: true,
        order: true,
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    return this.formatChatRoomResponse(chatRoom);
  }

  async sendMessage(userId: string, input: CreateMessageInput): Promise<MessageResponse> {
    const room = await prisma.chatRoom.findUnique({
      where: { orderId: input.orderId },
      include: { order: true }
    });

    if (!room) {
      throw new Error('Sala de chat não encontrada');
    }

    const isClient = room.clientId === userId;
    const isStore = room.storeId === userId;

    if (!isClient && !isStore) {
      throw new Error('Usuário não tem permissão para enviar mensagem nesta sala');
    }

    const senderType = isClient ? SenderType.CLIENT : SenderType.STORE;

    const message = await prisma.chatMessage.create({
      data: {
        roomId: room.id,
        senderId: userId,
        senderType,
        message: input.message,
        messageType: input.messageType || MessageType.TEXT
      },
      include: {
        sender: true,
        room: true
      }
    });

    await prisma.chatRoom.update({
      where: { id: room.id },
      data: { updatedAt: new Date() }
    });

    return this.formatMessageResponse(message);
  }

  async getChatHistory(orderId: string, userId: string, limit: number = 50, offset: number = 0): Promise<ChatHistoryResponse> {
    const room = await prisma.chatRoom.findUnique({
      where: { orderId },
      include: {
        client: true,
        store: true
      }
    });

    if (!room) {
      throw new Error('Sala de chat não encontrada');
    }

    const isClient = room.clientId === userId;
    const isStore = room.storeId === userId;

    if (!isClient && !isStore) {
      throw new Error('Usuário não tem permissão para acessar esta sala');
    }

    const messages = await prisma.chatMessage.findMany({
      where: { roomId: room.id },
      include: { sender: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    });

    const totalCount = await prisma.chatMessage.count({
      where: { roomId: room.id }
    });

    const formattedMessages = messages.map(msg => this.formatMessageResponse(msg));

    return {
      messages: formattedMessages,
      hasMore: offset + limit < totalCount,
      totalCount
    };
  }

  async markMessagesAsRead(orderId: string, userId: string): Promise<void> {
    const room = await prisma.chatRoom.findUnique({
      where: { orderId }
    });

    if (!room) {
      throw new Error('Sala de chat não encontrada');
    }

    const isClient = room.clientId === userId;
    const isStore = room.storeId === userId;

    if (!isClient && !isStore) {
      throw new Error('Usuário não tem permissão para marcar mensagens como lidas');
    }

    const senderType = isClient ? SenderType.CLIENT : SenderType.STORE;

    await prisma.chatMessage.updateMany({
      where: {
        roomId: room.id,
        senderType: { not: senderType },
        isRead: false
      },
      data: { isRead: true }
    });
  }

  async getChatRooms(userId: string, filter: ChatRoomFilter = {}): Promise<ChatRoomListResponse> {
    const where: any = {
      OR: [
        { clientId: userId },
        { storeId: userId }
      ]
    };

    if (filter.isActive !== undefined) {
      where.isActive = filter.isActive;
    }

    if (filter.dateFrom || filter.dateTo) {
      where.createdAt = {};
      if (filter.dateFrom) where.createdAt.gte = filter.dateFrom;
      if (filter.dateTo) where.createdAt.lte = filter.dateTo;
    }

    const rooms = await prisma.chatRoom.findMany({
      where,
      include: {
        client: true,
        store: true,
        order: true,
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      orderBy: { updatedAt: 'desc' },
      take: filter.limit || 20,
      skip: filter.offset || 0
    });

    const totalCount = await prisma.chatRoom.count({ where });

    const formattedRooms = await Promise.all(
      rooms.map(async room => {
        const unreadCount = await this.getUnreadCount(room.id, userId);
        return {
          ...this.formatChatRoomResponse(room),
          unreadCount
        };
      })
    );

    return {
      rooms: formattedRooms,
      totalCount,
      hasMore: (filter.offset || 0) + (filter.limit || 20) < totalCount
    };
  }

  async getChatRoomById(roomId: string): Promise<ChatRoomResponse> {
    const room = await prisma.chatRoom.findUnique({
      where: { id: roomId },
      include: {
        client: true,
        store: true,
        order: true,
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    if (!room) {
      throw new Error('Sala de chat não encontrada');
    }

    return this.formatChatRoomResponse(room);
  }

  async getChatRoomByOrderId(orderId: string): Promise<ChatRoomResponse> {
    const room = await prisma.chatRoom.findUnique({
      where: { orderId },
      include: {
        client: true,
        store: true,
        order: true,
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    if (!room) {
      throw new Error('Sala de chat não encontrada');
    }

    return this.formatChatRoomResponse(room);
  }

  async sendSystemMessage(systemMessage: ChatSystemMessage): Promise<MessageResponse> {
    const room = await prisma.chatRoom.findUnique({
      where: { orderId: systemMessage.orderId }
    });

    if (!room) {
      throw new Error('Sala de chat não encontrada');
    }

    const message = await prisma.chatMessage.create({
      data: {
        roomId: room.id,
        senderId: room.storeId,
        senderType: SenderType.STORE,
        message: systemMessage.message,
        messageType: MessageType.SYSTEM,
        metadata: systemMessage.metadata || {}
      },
      include: {
        sender: true,
        room: true
      }
    });

    await prisma.chatRoom.update({
      where: { id: room.id },
      data: { updatedAt: new Date() }
    });

    return this.formatMessageResponse(message);
  }

  async getChatStats(userId: string, period: { start: Date; end: Date }): Promise<ChatStats> {
    const rooms = await prisma.chatRoom.findMany({
      where: {
        OR: [
          { clientId: userId },
          { storeId: userId }
        ],
        createdAt: {
          gte: period.start,
          lte: period.end
        }
      }
    });

    const roomIds = rooms.map(room => room.id);

    const totalMessages = await prisma.chatMessage.count({
      where: {
        roomId: { in: roomIds },
        createdAt: {
          gte: period.start,
          lte: period.end
        }
      }
    });

    const unreadMessages = await prisma.chatMessage.count({
      where: {
        roomId: { in: roomIds },
        isRead: false,
        senderId: { not: userId }
      }
    });

    const activeRooms = await prisma.chatRoom.count({
      where: {
        OR: [
          { clientId: userId },
          { storeId: userId }
        ],
        isActive: true
      }
    });

    return {
      totalMessages,
      unreadMessages,
      activeRooms,
      averageResponseTime: 0
    };
  }

  async closeChatRoom(orderId: string, userId: string): Promise<void> {
    const room = await prisma.chatRoom.findUnique({
      where: { orderId }
    });

    if (!room) {
      throw new Error('Sala de chat não encontrada');
    }

    const isStore = room.storeId === userId;

    if (!isStore) {
      throw new Error('Apenas a loja pode fechar a sala de chat');
    }

    await prisma.chatRoom.update({
      where: { id: room.id },
      data: { isActive: false }
    });
  }

  private async getUnreadCount(roomId: string, userId: string): Promise<{ client: number; store: number }> {
    const room = await prisma.chatRoom.findUnique({
      where: { id: roomId }
    });

    if (!room) {
      return { client: 0, store: 0 };
    }

    const isClient = room.clientId === userId;
    const senderType = isClient ? SenderType.CLIENT : SenderType.STORE;

    const unreadCount = await prisma.chatMessage.count({
      where: {
        roomId,
        senderType: { not: senderType },
        isRead: false
      }
    });

    return {
      client: isClient ? 0 : unreadCount,
      store: isClient ? unreadCount : 0
    };
  }

  private formatChatRoomResponse(room: any): ChatRoomResponse {
    return {
      id: room.id,
      orderId: room.orderId,
      client: {
        id: room.client.id,
        name: room.client.name,
        avatar: room.client.avatar
      },
      store: {
        id: room.store.id,
        name: room.store.name,
        avatar: room.store.avatar
      },
      order: {
        id: room.order.id,
        status: room.order.status,
        total: Number(room.order.total)
      },
      isActive: room.isActive,
      lastMessage: room.messages[0] ? this.formatMessageResponse(room.messages[0]) as any : undefined,
      unreadCount: { client: 0, store: 0 },
      createdAt: room.createdAt,
      updatedAt: room.updatedAt
    };
  }

  private formatMessageResponse(message: any): MessageResponse {
    return {
      id: message.id,
      orderId: message.room.orderId,
      senderId: message.senderId,
      senderType: message.senderType,
      senderName: message.sender.name,
      senderAvatar: message.sender.avatar,
      message: message.message,
      messageType: message.messageType,
      isRead: message.isRead,
      createdAt: message.createdAt
    };
  }
}

export const chatService = new ChatService();
