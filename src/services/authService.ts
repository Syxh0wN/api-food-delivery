import { prisma } from '../config/database';
import { hashPassword, comparePassword } from '../utils/hash';
import { generateToken } from '../utils/jwt';
import { LoginRequest, RegisterRequest, AuthResponse } from '../types/auth';
import { HistoryHelper } from '../utils/historyHelper';
import { HistoryAction, HistoryEntity } from '@prisma/client';

export class AuthService {
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email }
    });

    if (existingUser) {
      throw new Error('Email já está em uso');
    }

    const hashedPassword = await hashPassword(data.password);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.name,
        phone: data.phone || null,
        role: data.role || 'CLIENT'
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true
      }
    });

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role
    });

    await HistoryHelper.logUserAction(
      user.id,
      HistoryAction.CREATE,
      `Usuário registrado com sucesso`,
      undefined,
      { email: user.email, role: user.role }
    );

    return {
      user,
      token
    };
  }

  async login(data: LoginRequest): Promise<AuthResponse> {
    const user = await prisma.user.findUnique({
      where: { email: data.email }
    });

    if (!user || !user.isActive) {
      throw new Error('Credenciais inválidas');
    }

    const isPasswordValid = await comparePassword(data.password, user.password);

    if (!isPasswordValid) {
      throw new Error('Credenciais inválidas');
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role
    });

    await HistoryHelper.logUserAction(
      user.id,
      HistoryAction.LOGIN,
      `Usuário fez login com sucesso`,
      undefined,
      { email: user.email, role: user.role }
    );

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar
      },
      token
    };
  }

  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        avatar: true,
        createdAt: true
      }
    });

    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    return user;
  }
}
