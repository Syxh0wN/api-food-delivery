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

// Rotas protegidas - requer autenticação
router.use(authenticate);

// Rotas para donos de loja
router.post('/stores', authorize(['STORE_OWNER']), createStore);
router.get('/stores/my', authorize(['STORE_OWNER']), getMyStores);
router.put('/stores/:id', authorize(['STORE_OWNER']), updateStore);
router.delete('/stores/:id', authorize(['STORE_OWNER']), deleteStore);
router.patch('/stores/:id/toggle', authorize(['STORE_OWNER']), toggleStoreStatus);

// Rota para visualizar loja específica (qualquer usuário autenticado)
router.get('/stores/:id', getStoreById);

export default router;
