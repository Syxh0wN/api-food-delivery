import { prisma } from "../config/database";
import {
  UpdateUserInput,
  CreateAddressInput,
  UpdateAddressInput,
  UserResponse,
  AddressResponse,
} from "../types/user";

export class UserService {
  async getProfile(userId: string): Promise<UserResponse> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        avatar: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new Error("Usuário não encontrado");
    }

    return user;
  }

  async updateProfile(
    userId: string,
    data: UpdateUserInput
  ): Promise<UserResponse> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error("Usuário não encontrado");
    }

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.avatar !== undefined) updateData.avatar = data.avatar;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        avatar: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return updatedUser;
  }

  async getUserAddresses(userId: string): Promise<AddressResponse[]> {
    const addresses = await prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });

    return addresses as AddressResponse[];
  }

  async createAddress(
    userId: string,
    data: CreateAddressInput
  ): Promise<AddressResponse> {
    if (data.isDefault) {
      await prisma.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    const address = await prisma.address.create({
      data: {
        street: data.street,
        number: data.number,
        complement: data.complement || null,
        neighborhood: data.neighborhood,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
        isDefault: data.isDefault || false,
        userId,
      },
    });

    return address as AddressResponse;
  }

  async updateAddress(
    userId: string,
    addressId: string,
    data: UpdateAddressInput
  ): Promise<AddressResponse> {
    const address = await prisma.address.findFirst({
      where: {
        id: addressId,
        userId,
      },
    });

    if (!address) {
      throw new Error("Endereço não encontrado");
    }

    if (data.isDefault) {
      await prisma.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    const updateData: any = {};
    if (data.street !== undefined) updateData.street = data.street;
    if (data.number !== undefined) updateData.number = data.number;
    if (data.complement !== undefined) updateData.complement = data.complement || null;
    if (data.neighborhood !== undefined) updateData.neighborhood = data.neighborhood;
    if (data.city !== undefined) updateData.city = data.city;
    if (data.state !== undefined) updateData.state = data.state;
    if (data.zipCode !== undefined) updateData.zipCode = data.zipCode;
    if (data.isDefault !== undefined) updateData.isDefault = data.isDefault;

    const updatedAddress = await prisma.address.update({
      where: { id: addressId },
      data: updateData,
    });

    return updatedAddress as AddressResponse;
  }

  async deleteAddress(userId: string, addressId: string): Promise<void> {
    const address = await prisma.address.findFirst({
      where: {
        id: addressId,
        userId,
      },
    });

    if (!address) {
      throw new Error("Endereço não encontrado");
    }

    await prisma.address.delete({
      where: { id: addressId },
    });
  }

  async setDefaultAddress(
    userId: string,
    addressId: string
  ): Promise<AddressResponse> {
    const address = await prisma.address.findFirst({
      where: {
        id: addressId,
        userId,
      },
    });

    if (!address) {
      throw new Error("Endereço não encontrado");
    }

    await prisma.address.updateMany({
      where: { userId },
      data: { isDefault: false },
    });

    const updatedAddress = await prisma.address.update({
      where: { id: addressId },
      data: { isDefault: true },
    });

    return updatedAddress as AddressResponse;
  }
}
