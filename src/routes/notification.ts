import { Router } from 'express';
import { 
  sendNotification, 
  sendBulkNotification, 
  updateNotificationPreferences,
  updateFCMToken,
  getNotificationHistory,
  getNotificationPreferences
} from '../controllers/notificationController';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '@prisma/client';

const router = Router();

router.post('/send', authenticate, authorize([UserRole.ADMIN, UserRole.STORE_OWNER]), sendNotification);

router.post('/send-bulk', authenticate, authorize([UserRole.ADMIN]), sendBulkNotification);

router.put('/preferences', authenticate, updateNotificationPreferences);

router.put('/fcm-token', authenticate, updateFCMToken);

router.get('/history', authenticate, getNotificationHistory);

router.get('/preferences', authenticate, getNotificationPreferences);

export default router;
