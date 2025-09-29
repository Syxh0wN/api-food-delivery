import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { validateBody, validateParams, validateQuery } from '../middleware/validation';
import { asyncAuthenticatedHandler, asyncHandler } from '../middleware/asyncHandler';
import {
  createReviewSchema,
  updateReviewSchema,
  reviewFilterSchema
} from '../types/review';
import {
  reviewIdSchema,
  storeIdSchema,
  storeReviewsQuerySchema,
  userReviewsQuerySchema,
  canReviewQuerySchema
} from '../schemas/reviewSchemas';
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

router.post('/', authenticate, validateBody(createReviewSchema), asyncAuthenticatedHandler(createReview));

router.put('/:reviewId', authenticate, validateParams(reviewIdSchema), validateBody(updateReviewSchema), asyncAuthenticatedHandler(updateReview));

router.delete('/:reviewId', authenticate, validateParams(reviewIdSchema), asyncAuthenticatedHandler(deleteReview));

router.get('/:reviewId', validateParams(reviewIdSchema), asyncHandler(getReviewById));

router.get('/', validateQuery(reviewFilterSchema), asyncHandler(getReviews));

router.get('/store/:storeId', validateParams(storeIdSchema), validateQuery(storeReviewsQuerySchema), asyncHandler(getStoreReviews));

router.get('/user/my-reviews', authenticate, validateQuery(userReviewsQuerySchema), asyncAuthenticatedHandler(getUserReviews));

router.get('/store/:storeId/stats', validateParams(storeIdSchema), asyncHandler(getStoreStats));

router.get('/store/:storeId/can-review', authenticate, validateParams(storeIdSchema), validateQuery(canReviewQuerySchema), asyncAuthenticatedHandler(canUserReviewStore));

export default router;
