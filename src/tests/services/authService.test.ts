import { AuthService } from '../../services/authService';
import { prisma } from '../setup';

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
  });

  describe('register', () => {
    it('should register a new user', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        phone: '123456789'
      };

      const result = await authService.register(userData);

      expect(result.user.email).toBe(userData.email);
      expect(result.user.name).toBe(userData.name);
      expect(result.token).toBeDefined();

      const userInDb = await prisma.user.findUnique({
        where: { email: userData.email }
      });

      expect(userInDb).toBeTruthy();
      expect(userInDb?.email).toBe(userData.email);
    });

    it('should throw error for existing email', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      };

      await authService.register(userData);

      await expect(authService.register(userData)).rejects.toThrow('Email já está em uso');
    });
  });

  describe('login', () => {
    beforeEach(async () => {
      await authService.register({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      });
    });

    it('should login with correct credentials', async () => {
      const result = await authService.login({
        email: 'test@example.com',
        password: 'password123'
      });

      expect(result.user.email).toBe('test@example.com');
      expect(result.token).toBeDefined();
    });

    it('should throw error for incorrect password', async () => {
      await expect(authService.login({
        email: 'test@example.com',
        password: 'wrongpassword'
      })).rejects.toThrow('Credenciais inválidas');
    });

    it('should throw error for non-existent user', async () => {
      await expect(authService.login({
        email: 'nonexistent@example.com',
        password: 'password123'
      })).rejects.toThrow('Credenciais inválidas');
    });
  });

  describe('getProfile', () => {
    let userId: string;

    beforeEach(async () => {
      const result = await authService.register({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      });
      userId = result.user.id;
    });

    it('should get user profile', async () => {
      const profile = await authService.getProfile(userId);

      expect(profile.email).toBe('test@example.com');
      expect(profile.name).toBe('Test User');
      expect(profile.id).toBe(userId);
    });

    it('should throw error for non-existent user', async () => {
      await expect(authService.getProfile('non-existent-id')).rejects.toThrow('Usuário não encontrado');
    });
  });
});
