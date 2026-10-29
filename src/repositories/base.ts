import type { Table } from 'dexie';
import type { BaseEntity } from '../types';

export function generateUuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export interface IRepository<T extends BaseEntity> {
  list(includeDeleted?: boolean): Promise<T[]>;
  get(id: string): Promise<T | undefined>;
  create(data: Omit<T, 'id' | 'created_at' | 'updated_at' | 'revision'> & Partial<BaseEntity>): Promise<T>;
  update(id: string, patch: Partial<T>): Promise<T>;
  softDelete(id: string): Promise<void>;
  hardDelete(id: string): Promise<void>;
  count(includeDeleted?: boolean): Promise<number>;
  batchPut(entities: T[]): Promise<void>;
  clear(): Promise<void>;
}

export class BaseRepository<T extends BaseEntity> implements IRepository<T> {
  protected table: Table<T, string>;

  constructor(table: Table<T, string>) {
    this.table = table;
  }

  async list(includeDeleted = false): Promise<T[]> {
    const all = await this.table.toArray();
    if (includeDeleted) return all;
    return all.filter((item) => {
      // Check both snake_case deleted_at and legacy camelCase deletedAt
      const isDeleted = Boolean(item.deleted_at || (item as unknown as { deletedAt?: string }).deletedAt);
      return !isDeleted;
    });
  }

  async get(id: string): Promise<T | undefined> {
    return this.table.get(id);
  }

  async create(data: Omit<T, 'id' | 'created_at' | 'updated_at' | 'revision'> & Partial<BaseEntity>): Promise<T> {
    const now = new Date().toISOString();
    const entity = {
      ...data,
      id: data.id || generateUuid(),
      created_at: data.created_at || now,
      updated_at: now,
      deleted_at: null,
      revision: data.revision || 1,
    } as unknown as T;

    await this.table.put(entity);
    return entity;
  }

  async update(id: string, patch: Partial<T>): Promise<T> {
    const existing = await this.table.get(id);
    if (!existing) {
      throw new Error(`Record with id ${id} not found in repository`);
    }

    const now = new Date().toISOString();
    const currentRev = typeof existing.revision === 'number' ? existing.revision : 1;
    const updated = {
      ...existing,
      ...patch,
      id, // Preserve id
      updated_at: now,
      revision: currentRev + 1,
    } as T;

    await this.table.put(updated);
    return updated;
  }

  async softDelete(id: string): Promise<void> {
    const existing = await this.table.get(id);
    if (!existing) return;

    const now = new Date().toISOString();
    const currentRev = typeof existing.revision === 'number' ? existing.revision : 1;
    const updated = {
      ...existing,
      deleted_at: now,
      deletedAt: now, // For legacy compatibility
      updated_at: now,
      revision: currentRev + 1,
    } as T;

    await this.table.put(updated);
  }

  async hardDelete(id: string): Promise<void> {
    await this.table.delete(id);
  }

  async count(includeDeleted = false): Promise<number> {
    if (includeDeleted) {
      return this.table.count();
    }
    const items = await this.list(false);
    return items.length;
  }

  async batchPut(entities: T[]): Promise<void> {
    const now = new Date().toISOString();
    const normalized = entities.map((e) => {
      return {
        ...e,
        id: e.id || generateUuid(),
        created_at: e.created_at || now,
        updated_at: e.updated_at || now,
        deleted_at: e.deleted_at ?? null,
        revision: typeof e.revision === 'number' ? e.revision : 1,
      } as T;
    });

    await this.table.bulkPut(normalized);
  }

  async clear(): Promise<void> {
    await this.table.clear();
  }
}
