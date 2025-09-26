import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  createChatRoom,
  sendMessage,
  getChatHistory,
  markMessagesAsRead,
  getChatRooms,
  getChatRoom,
  getChatStats,
  closeChatRoom,
  sendSystemMessage
} from '../controllers/chatController';

const router = Router();

// Criar sala de chat para um pedido
router.post('/rooms/:orderId', 
  authenticate, 
  createChatRoom
);

// Enviar mensagem
router.post('/messages', 
  authenticate, 
  sendMessage
);

// Obter histórico de mensagens
router.get('/rooms/:orderId/messages', 
  authenticate, 
  getChatHistory
);

// Marcar mensagens como lidas
router.put('/rooms/:orderId/read', 
  authenticate, 
  markMessagesAsRead
);

// Listar salas de chat do usuário
router.get('/rooms', 
  authenticate, 
  getChatRooms
);

// Obter sala de chat específica
router.get('/rooms/:orderId', 
  authenticate, 
  getChatRoom
);

// Estatísticas de chat
router.get('/stats', 
  authenticate, 
  getChatStats
);

// Fechar sala de chat (apenas loja)
router.put('/rooms/:orderId/close', 
  authenticate, 
  closeChatRoom
);

// Enviar mensagem do sistema (apenas admin/loja)
router.post('/system-messages', 
  authenticate, 
  sendSystemMessage
);

export default router;
