import { prisma } from '../config/database';
import { CreateStoreInput, UpdateStoreInput, StoreResponse, StoreListResponse } from '../types/store';

export class StoreService {
  async createStore(ownerId: string, data: CreateStoreInput): Promise<StoreResponse> {
    const owner = await prisma.user.findUnique({
      where: { id: ownerId },
      select: { email: true }
    });

    if (!owner) {
      throw new Error('Usuário não encontrado');
    }

    const store = await prisma.store.create({
      data: {
        name: data.name,
        description: data.description,
        phone: data.phone,
        email: owner.email,
        address: JSON.stringify(data.address),
        deliveryRadius: data.deliveryRadius,
        estimatedDeliveryTime: data.estimatedDeliveryTime,
        minimumOrderValue: data.minimumOrderValue,
              isOpen: data.isOpen ?? true,
        logo: data.logo || null,
        coverImage: data.coverImage || null,
        ownerId: ownerId
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return {
      ...store,
      address: JSON.parse(store.address as string)
    } as unknown as StoreResponse;
  }

  async getStoreById(storeId: string): Promise<StoreResponse | null> {
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (!store) {
      return null;
    }

    return {
      ...store,
      address: JSON.parse(store.address as string)
    } as unknown as StoreResponse;
  }

  async getStoresByOwner(ownerId: string): Promise<StoreListResponse[]> {
    const stores = await prisma.store.findMany({
      where: { ownerId },
      orderBy: { createdAt: 'desc' }
    });

    return stores as StoreListResponse[];
  }

  async getAllStores(): Promise<StoreListResponse[]> {
    const stores = await prisma.store.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    });

    return stores as StoreListResponse[];
  }

  async updateStore(storeId: string, ownerId: string, data: UpdateStoreInput): Promise<StoreResponse> {
    const existingStore = await prisma.store.findFirst({
      where: {
        id: storeId,
        ownerId: ownerId
      }
    });

    if (!existingStore) {
      throw new Error('Loja não encontrada ou não pertence ao usuário');
    }

    const updateData: any = {};
    
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.deliveryRadius !== undefined) updateData.deliveryRadius = data.deliveryRadius;
    if (data.estimatedDeliveryTime !== undefined) updateData.estimatedDeliveryTime = data.estimatedDeliveryTime;
    if (data.minimumOrderValue !== undefined) updateData.minimumOrderValue = data.minimumOrderValue;
    if (data.isOpen !== undefined) updateData.isOpen = data.isOpen;
    if (data.logo !== undefined) updateData.logo = data.logo;
    if (data.coverImage !== undefined) updateData.coverImage = data.coverImage;

    if (data.address) {
      const currentAddress = existingStore.address as any;
      updateData.address = {
        street: data.address.street ?? currentAddress.street,
        number: data.address.number ?? currentAddress.number,
        complement: data.address.complement ?? currentAddress.complement,
        neighborhood: data.address.neighborhood ?? currentAddress.neighborhood,
        city: data.address.city ?? currentAddress.city,
        state: data.address.state ?? currentAddress.state,
        zipCode: data.address.zipCode ?? currentAddress.zipCode,
      };
    }

    const updatedStore = await prisma.store.update({
      where: { id: storeId },
      data: updateData,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return {
      ...updatedStore,
      address: updatedStore.address
    } as unknown as StoreResponse;
  }

  async deleteStore(storeId: string, ownerId: string): Promise<void> {
    const store = await prisma.store.findFirst({
      where: {
        id: storeId,
        ownerId: ownerId
      }
    });

    if (!store) {
      throw new Error('Loja não encontrada ou não pertence ao usuário');
    }

    await prisma.store.update({
      where: { id: storeId },
      data: { isActive: false }
    });
  }

  async toggleStoreStatus(storeId: string, ownerId: string): Promise<StoreResponse> {
    const store = await prisma.store.findFirst({
      where: {
        id: storeId,
        ownerId: ownerId
      }
    });

    if (!store) {
      throw new Error('Loja não encontrada ou não pertence ao usuário');
    }

    const updatedStore = await prisma.store.update({
      where: { id: storeId },
      data: { isOpen: !store.isOpen },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return {
      ...updatedStore,
      address: updatedStore.address
    } as unknown as StoreResponse;
  }
}
