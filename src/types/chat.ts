export interface ChatMessage {
  id: string;
  orderId: string;
  senderId: string;
  senderType: 'CLIENT' | 'STORE';
  message: string;
  messageType: 'TEXT' | 'IMAGE' | 'SYSTEM';
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateMessageInput {
  orderId: string;
  message: string;
  messageType?: 'TEXT' | 'IMAGE' | 'SYSTEM';
}

export interface ChatRoom {
  id: string;
  orderId: string;
  clientId: string;
  storeId: string;
  isActive: boolean;
  lastMessage?: ChatMessage;
  unreadCount: {
    client: number;
    store: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatRoomResponse {
  id: string;
  orderId: string;
  client: {
    id: string;
    name: string;
    avatar?: string;
  };
  store: {
    id: string;
    name: string;
    avatar?: string;
  };
  order: {
    id: string;
    status: string;
    total: number;
  };
  isActive: boolean;
  lastMessage?: ChatMessage;
  unreadCount: {
    client: number;
    store: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface MessageResponse {
  id: string;
  orderId: string;
  senderId: string;
  senderType: 'CLIENT' | 'STORE';
  senderName: string;
  senderAvatar?: string;
  message: string;
  messageType: 'TEXT' | 'IMAGE' | 'SYSTEM';
  isRead: boolean;
  createdAt: Date;
}

export interface ChatHistoryResponse {
  messages: MessageResponse[];
  hasMore: boolean;
  totalCount: number;
}

export interface JoinRoomRequest {
  orderId: string;
  userId: string;
  userType: 'CLIENT' | 'STORE';
}

export interface SocketUser {
  userId: string;
  userType: 'CLIENT' | 'STORE';
  socketId: string;
  orderId: string;
}

export interface ChatEvent {
  type: 'MESSAGE_SENT' | 'MESSAGE_READ' | 'USER_JOINED' | 'USER_LEFT' | 'TYPING_START' | 'TYPING_STOP';
  data: any;
  timestamp: Date;
}

export interface TypingIndicator {
  userId: string;
  userType: 'CLIENT' | 'STORE';
  userName: string;
  isTyping: boolean;
}

export interface ChatNotification {
  orderId: string;
  message: string;
  senderName: string;
  senderType: 'CLIENT' | 'STORE';
  timestamp: Date;
}

export interface ChatStats {
  totalMessages: number;
  unreadMessages: number;
  activeRooms: number;
  averageResponseTime: number;
}

export interface ChatSettings {
  autoReply: boolean;
  autoReplyMessage: string;
  workingHours: {
    start: string;
    end: string;
    timezone: string;
  };
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
}

export interface ChatFilter {
  orderId?: string;
  senderType?: 'CLIENT' | 'STORE';
  messageType?: 'TEXT' | 'IMAGE' | 'SYSTEM';
  dateFrom?: Date;
  dateTo?: Date;
  isRead?: boolean;
  limit?: number;
  offset?: number;
}

export interface ChatSearchResult {
  messages: MessageResponse[];
  totalCount: number;
  hasMore: boolean;
}

export interface ChatAnalytics {
  period: {
    start: Date;
    end: Date;
  };
  totalMessages: number;
  messagesByType: {
    TEXT: number;
    IMAGE: number;
    SYSTEM: number;
  };
  messagesBySender: {
    CLIENT: number;
    STORE: number;
  };
  averageResponseTime: number;
  mostActiveHours: Array<{
    hour: number;
    messageCount: number;
  }>;
  topKeywords: Array<{
    keyword: string;
    count: number;
  }>;
}

export interface ChatRoomListResponse {
  rooms: ChatRoomResponse[];
  totalCount: number;
  hasMore: boolean;
}

export interface ChatRoomFilter {
  isActive?: boolean;
  hasUnread?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
  offset?: number;
}

export interface ChatSystemMessage {
  type: 'ORDER_CREATED' | 'ORDER_UPDATED' | 'ORDER_CANCELLED' | 'PAYMENT_CONFIRMED' | 'DELIVERY_STARTED' | 'DELIVERY_COMPLETED';
  orderId: string;
  message: string;
  metadata?: Record<string, any>;
}

export interface ChatFileUpload {
  orderId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileUrl: string;
  thumbnailUrl?: string;
}

export interface ChatReaction {
  messageId: string;
  userId: string;
  reaction: string;
  createdAt: Date;
}

export interface ChatMessageWithReactions extends MessageResponse {
  reactions: ChatReaction[];
  reactionCounts: Record<string, number>;
}
