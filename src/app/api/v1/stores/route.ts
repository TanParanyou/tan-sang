import { NextRequest } from 'next/server';
import { z } from 'zod';
import {
  CreateMenuOptionInputSchema,
  DeleteStoreInputSchema,
  UpdateMenuInputSchema,
  UpdateMenuOptionInputSchema,
  UpdateStoreInputSchema,
  UpsertMenuInputSchema,
  UpsertStoreInputSchema,
  VoteBanMenuInputSchema,
} from '@/features/admin-store/admin-store.schema';
import { MenuStatusSchema } from '@/features/store-catalog/store-catalog.schema';
import { getRepositories } from '@/server/container';
import { apiSuccess, handleApiError } from '@/server/http/api-response';

const AdminStoreMutationSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('UPSERT_STORE'),
    payload: UpsertStoreInputSchema,
  }),
  z.object({
    action: z.literal('UPDATE_STORE'),
    payload: UpdateStoreInputSchema,
  }),
  z.object({
    action: z.literal('DELETE_STORE'),
    payload: DeleteStoreInputSchema,
  }),
  z.object({
    action: z.literal('CREATE_MENU'),
    payload: UpsertMenuInputSchema,
  }),
  z.object({
    action: z.literal('UPDATE_MENU'),
    payload: UpdateMenuInputSchema,
  }),
  z.object({
    action: z.literal('CREATE_OPTION'),
    payload: CreateMenuOptionInputSchema,
  }),
  z.object({
    action: z.literal('UPDATE_OPTION'),
    payload: UpdateMenuOptionInputSchema,
  }),
  z.object({
    action: z.literal('UPDATE_MENU_STATUS'),
    payload: z.object({
      menuId: z.string().uuid(),
      status: MenuStatusSchema,
    }),
  }),
  z.object({
    action: z.literal('VOTE_BAN_MENU'),
    payload: VoteBanMenuInputSchema,
  }),
  z.object({
    action: z.literal('DELETE_MENU'),
    payload: z.object({
      menuId: z.string().uuid(),
    }),
  }),
  z.object({
    action: z.literal('DELETE_OPTION'),
    payload: z.object({
      optionId: z.string().uuid(),
    }),
  }),
]);

export async function GET(request: NextRequest) {
  try {
    const { storeRepo } = getRepositories();
    const storeId = request.nextUrl.searchParams.get('storeId');

    if (storeId) {
      const catalog = await storeRepo.findStoreCatalogById(storeId);
      return apiSuccess(catalog);
    }

    const stores = await storeRepo.findAllStores();
    return apiSuccess(stores);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { storeRepo } = getRepositories();
    const body: unknown = await request.json();
    const command = AdminStoreMutationSchema.parse(body);

    if (command.action === 'UPSERT_STORE') {
      const store = await storeRepo.upsertStore(command.payload);
      return apiSuccess(store, 201);
    }

    if (command.action === 'UPDATE_STORE') {
      const store = await storeRepo.updateStore(command.payload);
      return apiSuccess(store);
    }

    if (command.action === 'DELETE_STORE') {
      await storeRepo.deleteStore(command.payload.storeId);
      return apiSuccess({ deleted: true });
    }

    if (command.action === 'CREATE_MENU') {
      const menu = await storeRepo.createMenu(command.payload);
      return apiSuccess(menu, 201);
    }

    if (command.action === 'UPDATE_MENU') {
      const menu = await storeRepo.updateMenu(command.payload);
      return apiSuccess(menu);
    }

    if (command.action === 'CREATE_OPTION') {
      const option = await storeRepo.createMenuOption(command.payload);
      return apiSuccess(option, 201);
    }

    if (command.action === 'UPDATE_OPTION') {
      const option = await storeRepo.updateMenuOption(command.payload);
      return apiSuccess(option);
    }

    if (command.action === 'VOTE_BAN_MENU') {
      const updatedMenu = await storeRepo.incrementMenuVoteBan(
        command.payload.menuId,
        command.payload.autoBanThreshold,
      );
      return apiSuccess(updatedMenu);
    }

    if (command.action === 'DELETE_MENU') {
      await storeRepo.deleteMenu(command.payload.menuId);
      return apiSuccess({ deleted: true });
    }

    if (command.action === 'DELETE_OPTION') {
      await storeRepo.deleteMenuOption(command.payload.optionId);
      return apiSuccess({ deleted: true });
    }

    await storeRepo.updateMenuStatus(command.payload.menuId, command.payload.status);
    return apiSuccess({ updated: true });
  } catch (error) {
    return handleApiError(error);
  }
}
