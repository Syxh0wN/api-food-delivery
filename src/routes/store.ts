import { Router } from 'express';
import { 
  createStore,
  getStoreById,
  getMyStores,
  getAllStores,
  updateStore,
  deleteStore,
  toggleStoreStatus
} from '../controllers/storeController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Rotas públicas
router.get('/stores', getAllStores);
router.get('/stores/:id', getStoreById);

// Rotas para donos de loja
router.post('/stores', authenticate, authorize(['STORE_OWNER']), createStore);
router.get('/stores/my', authenticate, authorize(['STORE_OWNER']), getMyStores);
router.put('/stores/:id', authenticate, authorize(['STORE_OWNER']), updateStore);
router.delete('/stores/:id', authenticate, authorize(['STORE_OWNER']), deleteStore);
router.patch('/stores/:id/toggle', authenticate, authorize(['STORE_OWNER']), toggleStoreStatus);

export default router;
