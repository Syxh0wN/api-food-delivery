import { swaggerDocument } from './swagger';
import { authSwaggerPaths } from './auth.swagger';
import { storesSwaggerPaths } from './stores.swagger';
import { productsSwaggerPaths } from './products.swagger';
import { cartSwaggerPaths } from './cart.swagger';
import { ordersSwaggerPaths } from './orders.swagger';
import { favoritesSwaggerPaths } from './favorites.swagger';
import { deliverySwaggerPaths } from './delivery.swagger';
import { couponsSwaggerPaths } from './coupons.swagger';
import { reviewsSwaggerPaths } from './reviews.swagger';

// Combinar todos os paths
const allPaths = {
  ...authSwaggerPaths,
  ...storesSwaggerPaths,
  ...productsSwaggerPaths,
  ...cartSwaggerPaths,
  ...ordersSwaggerPaths,
  ...favoritesSwaggerPaths,
  ...deliverySwaggerPaths,
  ...couponsSwaggerPaths,
  ...reviewsSwaggerPaths
};

// Documento Swagger completo
export const completeSwaggerDocument = {
  ...swaggerDocument,
  paths: {
    ...swaggerDocument.paths,
    ...allPaths
  }
};

export { serveSwaggerUI, serveSwaggerJSON } from './swagger';
