import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  createReview,
  updateReview,
  deleteReview,
  getReviewById,
  getReviews,
  getStoreReviews,
  getUserReviews,
  getStoreStats,
  canUserReviewStore
} from '../controllers/reviewController';

const router = Router();

router.post('/', authenticate, createReview);
router.put('/:reviewId', authenticate, updateReview);
router.delete('/:reviewId', authenticate, deleteReview);
router.get('/:reviewId', getReviewById);
router.get('/', getReviews);
router.get('/store/:storeId', getStoreReviews);
router.get('/user/my-reviews', authenticate, getUserReviews);
router.get('/store/:storeId/stats', getStoreStats);
router.get('/store/:storeId/can-review', authenticate, canUserReviewStore);

export default router;
