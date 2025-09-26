import { Router } from 'express';
import {
  createHistory,
  getHistories,
  getHistoryById,
  getHistoryStats,
  getAuditLogs,
  deleteHistory,
  deleteOldHistories,
  getUserActivity,
  getEntityHistory
} from '../controllers/historyController';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/auth';

const router = Router();

router.post('/', authenticate, createHistory);

router.get('/', authenticate, getHistories);

router.get('/stats', authenticate, authorize(['ADMIN']), getHistoryStats);

router.get('/audit', authenticate, authorize(['ADMIN']), getAuditLogs);

router.get('/user/:userId', authenticate, getUserActivity);

router.get('/entity/:entityType/:entityId', authenticate, getEntityHistory);

router.get('/:id', authenticate, getHistoryById);

router.delete('/:id', authenticate, authorize(['ADMIN']), deleteHistory);

router.delete('/cleanup/old', authenticate, authorize(['ADMIN']), deleteOldHistories);

export default router;
