import { Router } from 'express';
import { 
  getProfile, 
  updateProfile, 
  getUserAddresses, 
  createAddress, 
  updateAddress, 
  deleteAddress, 
  setDefaultAddress 
} from '../controllers/userController';
import { authenticate } from '../middleware/auth';
import { validateBody, validateParams } from '../middleware/validation';
import { asyncAuthenticatedHandler } from '../middleware/asyncHandler';
import { 
  updateProfileSchema, 
  createAddressSchema, 
  updateAddressSchema, 
  addressIdSchema 
} from '../schemas/userSchemas';

const router = Router();

router.use(authenticate);

router.get('/profile', asyncAuthenticatedHandler(getProfile));
router.put('/profile', validateBody(updateProfileSchema), asyncAuthenticatedHandler(updateProfile));

router.get('/addresses', asyncAuthenticatedHandler(getUserAddresses));
router.post('/addresses', validateBody(createAddressSchema), asyncAuthenticatedHandler(createAddress));
router.put('/addresses/:addressId', validateParams(addressIdSchema), validateBody(updateAddressSchema), asyncAuthenticatedHandler(updateAddress));
router.delete('/addresses/:addressId', validateParams(addressIdSchema), asyncAuthenticatedHandler(deleteAddress));
router.patch('/addresses/:addressId/default', validateParams(addressIdSchema), asyncAuthenticatedHandler(setDefaultAddress));

export default router;
