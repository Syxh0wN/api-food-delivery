import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validation';
import { asyncHandler, asyncAuthenticatedHandler } from '../middleware/asyncHandler';
import { registerSchema, loginSchema } from '../schemas/authSchemas';

const router = Router();
const authController = new AuthController();

router.post('/register', validateBody(registerSchema), asyncHandler(authController.register.bind(authController)));
router.post('/login', validateBody(loginSchema), asyncHandler(authController.login.bind(authController)));
router.get('/profile', authenticate, asyncAuthenticatedHandler(authController.getProfile.bind(authController)));
router.post('/logout', authenticate, asyncAuthenticatedHandler(authController.logout.bind(authController)));

export default router;
