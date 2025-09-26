import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import userRoutes from './routes/user';
import storeRoutes from './routes/store';
import productRoutes from './routes/product';
import cartRoutes from './routes/cart';
import orderRoutes from './routes/order';
import couponRoutes from './routes/coupon';
import paymentRoutes from './routes/payment';
import notificationRoutes from './routes/notification';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3010;

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Muitas tentativas, tente novamente em 15 minutos'
});

app.use(helmet());
app.use(cors());
app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.json({
    message: 'MyFood API - Sistema de Delivery',
    version: '1.0.0',
    status: 'online',
    endpoints: {
      auth: '/api/auth',
      health: '/health'
    }
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'Test endpoint working' });
});

// Rotas públicas de cupons primeiro
app.get('/api/coupons/active', async (req, res) => {
  const { getActiveCoupons } = await import('./controllers/couponController');
  getActiveCoupons(req, res);
});
app.get('/api/coupons/code/:code', async (req, res) => {
  const { getCouponByCode } = await import('./controllers/couponController');
  getCouponByCode(req, res);
});

// Rota de validação (qualquer usuário autenticado)
app.post('/api/coupons/validate', async (req, res, next) => {
  const { authenticate } = await import('./middleware/auth');
  const { validateCoupon } = await import('./controllers/couponController');
  authenticate(req, res, (err) => {
    if (err) return next(err);
    validateCoupon(req, res);
  });
});

app.post('/api/payment-intent', async (req, res, next) => {
  const { authenticate } = await import('./middleware/auth');
  const { createPaymentIntent } = await import('./controllers/paymentController');
  authenticate(req, res, (err) => {
    if (err) return next(err);
    createPaymentIntent(req, res);
  });
});

app.post('/api/confirm/:paymentIntentId', async (req, res, next) => {
  const { authenticate } = await import('./middleware/auth');
  const { confirmPayment } = await import('./controllers/paymentController');
  authenticate(req, res, (err) => {
    if (err) return next(err);
    confirmPayment(req, res);
  });
});

app.get('/api/status/:paymentIntentId', async (req, res, next) => {
  const { authenticate } = await import('./middleware/auth');
  const { getPaymentStatus } = await import('./controllers/paymentController');
  authenticate(req, res, (err) => {
    if (err) return next(err);
    getPaymentStatus(req, res);
  });
});

app.post('/api/refund', async (req, res, next) => {
  const { authenticate } = await import('./middleware/auth');
  const { createRefund } = await import('./controllers/paymentController');
  authenticate(req, res, (err) => {
    if (err) return next(err);
    createRefund(req, res);
  });
});

app.post('/api/webhook', async (req, res) => {
  const { handleWebhook } = await import('./controllers/paymentController');
  handleWebhook(req, res);
});

app.use('/api/auth', authRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api', productRoutes);
app.use('/api', storeRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Rota ${req.originalUrl} não encontrada`
  });
});

let server: any;

if (process.env.NODE_ENV !== 'test') {
  server = app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    console.log(`Ambiente: ${process.env.NODE_ENV || 'development'}`);
    console.log(`API Base: http://localhost:${PORT}/api`);
  });
}

export default app;
export { server };
