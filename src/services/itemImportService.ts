import { itemRepo } from '../repositories';
import { generateUuid } from '../repositories/base';
import type {
  InventoryItem,
  ItemCategory,
  OwnershipStatus,
  ItemCondition,
  PastReason,
  ItemColorEntry,
} from '../types';

export interface RowValidationError {
  row: number;
  field: string;
  message: string;
}

export interface ParsedImportItem {
  external_id?: string;
  name: string;
  brand?: string;
  category: ItemCategory;
  location?: string;
  quantity?: number;
  status: 'owned' | 'wanted' | 'former';
  colors?: ItemColorEntry[];
  size?: string;
  condition?: ItemCondition;
  price_paid?: number;
  current_value?: number;
  acquired_date?: string;
  left_date?: string;
  left_reason?: PastReason | string;
  notes?: string;
  tags?: string[];
  photo?: string;
}

export interface ImportValidationReport {
  isValid: boolean;
  totalRows: number;
  validRows: number;
  errorRows: number;
  errors: RowValidationError[];
  items: ParsedImportItem[];
}

export type DuplicateStrategy = 'skip' | 'overwrite' | 'create_new';

const VALID_CATEGORIES: ItemCategory[] = ['apparel', 'tech', 'tomes', 'edc'];
const VALID_CONDITIONS: ItemCondition[] = ['pristine', 'seasoned', 'worn', 'needs_repair'];

/**
 * Robust CSV Line Parser taking quoted fields and commas into account
 */
export function parseCSV(text: string): Record<string, string>[] {
  const lines: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if ((char === '\r' && next === '\n') || char === '\n' || char === '\r') {
      if (inQuotes) {
        current += '\n';
      } else {
        if (current.trim().length > 0) {
          lines.push(current);
        }
        current = '';
        if (char === '\r' && next === '\n') i++;
      }
    } else {
      current += char;
    }
  }
  if (current.trim().length > 0) {
    lines.push(current);
  }

  if (lines.length < 2) return [];

  // Parse Header
  const headers = splitCSVLine(lines[0]).map((h) => h.trim().toLowerCase());

  // Parse Rows
  const results: Record<string, string>[] = [];
  for (let idx = 1; idx < lines.length; idx++) {
    const values = splitCSVLine(lines[idx]);
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => {
      obj[h] = values[i] !== undefined ? values[i].trim() : '';
    });
    results.push(obj);
  }

  return results;
}

function splitCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      values.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current);
  return values;
}

/**
 * Validates and normalizes raw parsed JSON or CSV objects
 */
export function validateImportData(rawRows: any[]): ImportValidationReport {
  const errors: RowValidationError[] = [];
  const validItems: ParsedImportItem[] = [];

  rawRows.forEach((row, index) => {
    const rowNum = index + 1;
    const rowErrors: RowValidationError[] = [];

    // 1. Name
    const name = String(row.name || '').trim();
    if (!name) {
      rowErrors.push({ row: rowNum, field: 'name', message: 'Item name is required.' });
    }

    // 2. Category
    const category = String(row.category || '').toLowerCase().trim() as ItemCategory;
    if (!category || !VALID_CATEGORIES.includes(category)) {
      rowErrors.push({
        row: rowNum,
        field: 'category',
        message: `Category "${row.category}" is invalid. Must be one of: ${VALID_CATEGORIES.join(', ')}.`,
      });
    }

    // 3. Status
    let statusRaw = String(row.status || '').toLowerCase().trim();
    if (statusRaw === 'wishlist') statusRaw = 'wanted';
    if (statusRaw === 'past') statusRaw = 'former';

    if (!statusRaw || !['owned', 'wanted', 'former'].includes(statusRaw)) {
      rowErrors.push({
        row: rowNum,
        field: 'status',
        message: `Status "${row.status}" is invalid. Must be owned, wanted, or former.`,
      });
    }
    const status = statusRaw as 'owned' | 'wanted' | 'former';

    // 4. Condition
    let condition: ItemCondition | undefined;
    if (row.condition) {
      const cond = String(row.condition).toLowerCase().trim() as ItemCondition;
      if (VALID_CONDITIONS.includes(cond)) {
        condition = cond;
      } else {
        rowErrors.push({
          row: rowNum,
          field: 'condition',
          message: `Condition "${row.condition}" is invalid. Must be one of: ${VALID_CONDITIONS.join(', ')}.`,
        });
      }
    }

    // 5. Numbers: quantity, price_paid, current_value
    let quantity: number | undefined;
    if (row.quantity !== undefined && row.quantity !== '') {
      const q = Number(row.quantity);
      if (isNaN(q) || q < 1) {
        rowErrors.push({ row: rowNum, field: 'quantity', message: 'Quantity must be a positive number.' });
      } else {
        quantity = Math.floor(q);
      }
    }

    let price_paid: number | undefined;
    if (row.price_paid !== undefined && row.price_paid !== '') {
      const p = Number(row.price_paid);
      if (isNaN(p) || p < 0) {
        rowErrors.push({ row: rowNum, field: 'price_paid', message: 'Price paid must be a non-negative number.' });
      } else {
        price_paid = p;
      }
    }

    let current_value: number | undefined;
    if (row.current_value !== undefined && row.current_value !== '') {
      const v = Number(row.current_value);
      if (isNaN(v) || v < 0) {
        rowErrors.push({ row: rowNum, field: 'current_value', message: 'Current value must be a non-negative number.' });
      } else {
        current_value = v;
      }
    }

    // 6. Colors
    let colors: ItemColorEntry[] = [];
    if (Array.isArray(row.colors)) {
      colors = row.colors;
    } else if (typeof row.colors === 'string' && row.colors.trim().length > 0) {
      // Parse "Black:#1A1A1A;Charcoal:#2C2C2E"
      const parts = row.colors.split(';');
      parts.forEach((p: string) => {
        const [cName, cHex] = p.split(':');
        if (cName && cHex) {
          colors.push({ name: cName.trim(), hex: cHex.trim() });
        }
      });
    }

    // 7. Tags
    let tags: string[] = [];
    if (Array.isArray(row.tags)) {
      tags = row.tags.map((t: any) => String(t).trim());
    } else if (typeof row.tags === 'string' && row.tags.trim().length > 0) {
      tags = row.tags.split(',').map((t: string) => t.trim()).filter(Boolean);
    }

    if (rowErrors.length > 0) {
      errors.push(...rowErrors);
    } else {
      validItems.push({
        external_id: row.external_id ? String(row.external_id).trim() : undefined,
        name,
        brand: row.brand ? String(row.brand).trim() : undefined,
        category,
        location: row.location ? String(row.location).trim() : undefined,
        quantity: quantity || 1,
        status,
        colors: colors.length > 0 ? colors : undefined,
        size: row.size ? String(row.size).trim() : undefined,
        condition: condition || 'pristine',
        price_paid,
        current_value: current_value !== undefined ? current_value : price_paid,
        acquired_date: row.acquired_date ? String(row.acquired_date).trim() : undefined,
        left_date: row.left_date ? String(row.left_date).trim() : undefined,
        left_reason: row.left_reason ? (String(row.left_reason).trim() as PastReason) : undefined,
        notes: row.notes ? String(row.notes).trim() : undefined,
        tags: tags.length > 0 ? tags : undefined,
        photo: row.photo ? String(row.photo).trim() : undefined,
      });
    }
  });

  return {
    isValid: errors.length === 0,
    totalRows: rawRows.length,
    validRows: validItems.length,
    errorRows: errors.length > 0 ? new Set(errors.map((e) => e.row)).size : 0,
    errors,
    items: validItems,
  };
}

/**
 * Maps a ParsedImportItem to full InventoryItem conforming to BaseEntity
 */
function toInventoryItem(parsed: ParsedImportItem, existing?: InventoryItem): InventoryItem {
  const now = new Date().toISOString();
  const ownershipStatus: OwnershipStatus =
    parsed.status === 'wanted' ? 'wishlist' : parsed.status === 'former' ? 'past' : 'owned';

  const defaultColor = parsed.colors?.[0] || { name: 'Neutral', hex: '#6B6B76' };

  return {
    id: existing?.id || generateUuid(),
    external_id: parsed.external_id || existing?.external_id,
    name: parsed.name,
    brand: parsed.brand,
    category: parsed.category,
    subCategory: parsed.brand || 'Standard',
    ownershipStatus,
    pastReason: parsed.left_reason as PastReason,
    pastDate: parsed.left_date,
    rarity: 'common',
    colorName: defaultColor.name,
    colorHex: defaultColor.hex,
    colors: parsed.colors,
    condition: parsed.condition || 'pristine',
    season: 'all',
    goldValue: parsed.current_value || parsed.price_paid || 0,
    targetPrice: ownershipStatus === 'wishlist' ? parsed.current_value || parsed.price_paid : undefined,
    location: parsed.location || 'Storage',
    lore: parsed.notes || '',
    dateAcquired: parsed.acquired_date,
    imageUrl: parsed.photo || existing?.imageUrl,
    quantity: parsed.quantity || 1,
    size: parsed.size,
    price_paid: parsed.price_paid,
    current_value: parsed.current_value,
    notes: parsed.notes,
    tags: parsed.tags,
    created_at: existing?.created_at || now,
    updated_at: now,
    deleted_at: null,
    revision: existing ? (existing.revision || 1) + 1 : 1,
  };
}

/**
 * Executes idempotent import into Dexie ItemRepository
 */
export async function executeItemImport(
  items: ParsedImportItem[],
  duplicateStrategy: DuplicateStrategy = 'overwrite'
): Promise<{ created: number; updated: number; skipped: number }> {
  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const item of items) {
    let existing: InventoryItem | undefined;

    if (item.external_id && duplicateStrategy !== 'create_new') {
      existing = await itemRepo.findByExternalId(item.external_id);
    }

    if (existing) {
      if (duplicateStrategy === 'skip') {
        skipped++;
        continue;
      } else if (duplicateStrategy === 'overwrite') {
        const merged = toInventoryItem(item, existing);
        await itemRepo.update(existing.id, merged);
        updated++;
      }
    } else {
      const newItem = toInventoryItem(item);
      await itemRepo.batchPut([newItem]);
      created++;
    }
  }

  return { created, updated, skipped };
}
