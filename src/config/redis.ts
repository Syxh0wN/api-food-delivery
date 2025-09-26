import { createClient, RedisClientType } from 'redis';

let redisClient: RedisClientType | null = null;

export const connectRedis = async (): Promise<RedisClientType> => {
  if (redisClient && redisClient.isOpen) {
    return redisClient;
  }

  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  
  redisClient = createClient({
    url: redisUrl,
    socket: {
      reconnectStrategy: (retries) => {
        if (retries > 10) {
          console.error('Redis: Máximo de tentativas de reconexão atingido');
          return false;
        }
        return Math.min(retries * 100, 3000);
      }
    }
  });

  redisClient.on('error', (err) => {
    console.error('Redis Client Error:', err);
  });

  redisClient.on('connect', () => {
    console.log('Redis: Conectado com sucesso');
  });

  redisClient.on('reconnecting', () => {
    console.log('Redis: Reconectando...');
  });

  redisClient.on('ready', () => {
    console.log('Redis: Pronto para uso');
  });

  if (process.env.NODE_ENV !== 'test') {
    await redisClient.connect();
  }

  return redisClient;
};

export const disconnectRedis = async (): Promise<void> => {
  if (redisClient && redisClient.isOpen) {
    await redisClient.quit();
    redisClient = null;
  }
};

export const getRedisClient = (): RedisClientType | null => {
  return redisClient;
};

export const isRedisConnected = (): boolean => {
  return redisClient !== null && redisClient.isOpen;
};
