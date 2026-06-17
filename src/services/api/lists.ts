/**
 * Service de listas de compras — implementação REAL (back-end FastAPI).
 *
 * Cobre o CRUD de listas e itens. Retorna sempre o contrato `ShoppingList`
 * completo (itens + colaboradores), como o back-end devolve.
 */
import type { ShoppingList } from '@/types';
import { apiDelete, apiGet, apiPatch, apiPost } from '../http';

export async function getLists(): Promise<ShoppingList[]> {
  return apiGet<ShoppingList[]>('/lists');
}

export async function getList(id: string): Promise<ShoppingList> {
  return apiGet<ShoppingList>(`/lists/${encodeURIComponent(id)}`);
}

export async function createList(name: string): Promise<ShoppingList> {
  return apiPost<ShoppingList>('/lists', { name });
}

export async function renameList(id: string, name: string): Promise<ShoppingList> {
  return apiPatch<ShoppingList>(`/lists/${encodeURIComponent(id)}`, { name });
}

export async function deleteList(id: string): Promise<void> {
  await apiDelete<void>(`/lists/${encodeURIComponent(id)}`);
}

export async function addItem(
  listId: string,
  productId: string,
  quantity = 1,
): Promise<ShoppingList> {
  return apiPost<ShoppingList>(`/lists/${encodeURIComponent(listId)}/items`, {
    productId,
    quantity,
  });
}

export async function updateItemQuantity(
  listId: string,
  productId: string,
  quantity: number,
): Promise<ShoppingList> {
  return apiPatch<ShoppingList>(
    `/lists/${encodeURIComponent(listId)}/items/${encodeURIComponent(productId)}`,
    { quantity },
  );
}

export async function removeItem(listId: string, productId: string): Promise<ShoppingList> {
  return apiDelete<ShoppingList>(
    `/lists/${encodeURIComponent(listId)}/items/${encodeURIComponent(productId)}`,
  );
}

export async function clearList(listId: string): Promise<ShoppingList> {
  return apiDelete<ShoppingList>(`/lists/${encodeURIComponent(listId)}/items`);
}
