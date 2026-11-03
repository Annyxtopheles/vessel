import { db } from '../services/db';
import { BaseRepository, generateUuid } from './base';
import type {
  InventoryItem,
  PhotoRecord,
  Quest,
  QuestEvidence,
  CustomHabit,
  DayRecord,
  WearEvent,
  XpEvent,
  SkillNode,
  BodyMeasurement,
  CharacterAppearance,
  PaletteColor,
  PersonalityEntry,
  CharacterTrait,
  AppSettings,
  CharacterProfile,
  Reminder,
  BucketListEntry,
  Account,
  FinanceCategory,
  Transaction,
  SavingsGoal,
  Debt,
  NetWorthSnapshot,
} from '../types';
import {
  INITIAL_ITEMS,
  INITIAL_PROFILE,
  INITIAL_SKILLS,
  INITIAL_DAY_RECORDS,
  INITIAL_HABITS,
  INITIAL_REMINDERS,
  INITIAL_BUCKET_LIST,
  INITIAL_XP_EVENTS,
  INITIAL_QUESTS,
  INITIAL_QUEST_EVIDENCE,
  DEFAULT_SETTINGS,
  INITIAL_BODY_MEASUREMENTS,
  INITIAL_APPEARANCE,
  INITIAL_COLOR_PALETTE,
  INITIAL_PERSONALITY,
  INITIAL_TRAITS,
  INITIAL_WEAR_EVENTS,
} from '../data/mockData';
import {
  INITIAL_ACCOUNTS,
  INITIAL_FINANCE_CATEGORIES,
  INITIAL_TRANSACTIONS,
  INITIAL_SAVINGS_GOALS,
  INITIAL_DEBTS,
  INITIAL_NET_WORTH_SNAPSHOTS,
} from '../utils/finance';

export class ItemRepository extends BaseRepository<InventoryItem> {
  async findByExternalId(externalId: string): Promise<InventoryItem | undefined> {
    if (!externalId) return undefined;
    const match = await this.table.where('external_id').equals(externalId).first();
    if (match && !match.deleted_at && !(match as unknown as { deletedAt?: string }).deletedAt) {
      return match;
    }
    return undefined;
  }
}

export class PhotoRepository extends BaseRepository<PhotoRecord> {
  async getByItemId(itemId: string): Promise<PhotoRecord[]> {
    const photos = await this.list();
    return photos.filter((p) => p.itemId === itemId);
  }
}

export class QuestRepository extends BaseRepository<Quest> {}

export class QuestEvidenceRepository extends BaseRepository<QuestEvidence> {
  async getByQuestId(questId: string): Promise<QuestEvidence[]> {
    const list = await this.list();
    return list.filter((e) => e.questId === questId);
  }
}

export class HabitRepository extends BaseRepository<CustomHabit> {}

export class DayRecordRepository extends BaseRepository<DayRecord> {
  async getByDate(date: string): Promise<DayRecord | undefined> {
    const all = await this.list();
    return all.find((r) => r.date === date);
  }

  async getAllAsMap(): Promise<Record<string, DayRecord>> {
    const records = await this.list();
    const map: Record<string, DayRecord> = {};
    records.forEach((r) => {
      map[r.date] = r;
    });
    return map;
  }
}

export class WearEventRepository extends BaseRepository<WearEvent> {
  async getByItemId(itemId: string): Promise<WearEvent[]> {
    const events = await this.list();
    return events.filter((e) => e.itemId === itemId);
  }
}

export class XpEventRepository extends BaseRepository<XpEvent> {}

export class SkillRepository extends BaseRepository<SkillNode> {}

export class MeasurementRepository extends BaseRepository<BodyMeasurement> {}

export class PaletteRepository extends BaseRepository<PaletteColor> {}

export class PersonalityRepository extends BaseRepository<PersonalityEntry> {}

export class TraitRepository extends BaseRepository<CharacterTrait> {}

export class AppearanceRepository extends BaseRepository<CharacterAppearance> {
  private SINGLETON_ID = 'default_appearance';

  async getAppearance(): Promise<CharacterAppearance> {
    const existing = await this.get(this.SINGLETON_ID);
    if (existing) return existing;

    const initial: CharacterAppearance = {
      id: this.SINGLETON_ID,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
      revision: 1,
      skinToneHex: '#D4AA78',
      skinToneNote: 'Neutral olive / warm undertone',
      hair: 'Dark Charcoal (#2C2C2E)',
      eyeColor: 'Deep Umber Brown',
      photoUrl: undefined,
    };
    await this.table.put(initial);
    return initial;
  }

  async saveAppearance(patch: Partial<CharacterAppearance>): Promise<CharacterAppearance> {
    await this.getAppearance();
    return this.update(this.SINGLETON_ID, patch);
  }
}

export class SettingsRepository extends BaseRepository<AppSettings> {
  private SINGLETON_ID = 'default_settings';

  async getSettings(): Promise<AppSettings> {
    const existing = await this.get(this.SINGLETON_ID);
    if (existing) return existing;

    const initial: AppSettings = {
      id: this.SINGLETON_ID,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
      revision: 1,
      currencySymbol: '৳',
      numberGrouping: 'bangladeshi',
      unitSystem: 'metric',
      targetWeightKg: 73.0,
      privacyMode: false,
    };
    await this.table.put(initial);
    return initial;
  }

  async saveSettings(patch: Partial<AppSettings>): Promise<AppSettings> {
    await this.getSettings();
    return this.update(this.SINGLETON_ID, patch);
  }
}

export class ProfileRepository extends BaseRepository<CharacterProfile> {
  private SINGLETON_ID = 'default_profile';

  async getProfile(): Promise<CharacterProfile> {
    const existing = await this.get(this.SINGLETON_ID);
    if (existing) return existing;

    const now = new Date().toISOString();
    const initial: CharacterProfile = {
      ...INITIAL_PROFILE,
      id: this.SINGLETON_ID,
      created_at: now,
      updated_at: now,
      deleted_at: null,
      revision: 1,
    };
    await this.table.put(initial);
    return initial;
  }

  async saveProfile(patch: Partial<CharacterProfile>): Promise<CharacterProfile> {
    await this.getProfile();
    return this.update(this.SINGLETON_ID, patch);
  }
}

export class ReminderRepository extends BaseRepository<Reminder> {
  async listOrdered(): Promise<Reminder[]> {
    const all = await this.list();
    return all.sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return a.order - b.order;
    });
  }
}

export class BucketListRepository extends BaseRepository<BucketListEntry> {
  async listActive(): Promise<BucketListEntry[]> {
    const all = await this.list();
    return all.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
  }
}

export class AccountRepository extends BaseRepository<Account> {
  async listActive(): Promise<Account[]> {
    const all = await this.list();
    return all.filter((a) => !a.archived);
  }
}

export class FinanceCategoryRepository extends BaseRepository<FinanceCategory> {}

export class TransactionRepository extends BaseRepository<Transaction> {
  async listByAccount(accountId: string): Promise<Transaction[]> {
    const all = await this.list();
    return all.filter((t) => t.account_id === accountId);
  }

  async listRecent(limitCount: number = 50): Promise<Transaction[]> {
    const all = await this.list();
    return all
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
      .slice(0, limitCount);
  }
}

export class SavingsGoalRepository extends BaseRepository<SavingsGoal> {}

export class DebtRepository extends BaseRepository<Debt> {}

export class NetWorthSnapshotRepository extends BaseRepository<NetWorthSnapshot> {
  async listOrdered(): Promise<NetWorthSnapshot[]> {
    const all = await this.list();
    return all.sort((a, b) => a.date.localeCompare(b.date));
  }
}

// Repositories singletons
export const itemRepo = new ItemRepository(db.items);
export const photoRepo = new PhotoRepository(db.photos);
export const questRepo = new QuestRepository(db.quests);
export const questEvidenceRepo = new QuestEvidenceRepository(db.questEvidence);
export const habitRepo = new HabitRepository(db.habits);
export const dayRecordRepo = new DayRecordRepository(db.dayRecords);
export const wearEventRepo = new WearEventRepository(db.wearEvents);
export const xpEventRepo = new XpEventRepository(db.xpEvents);
export const skillRepo = new SkillRepository(db.skills);
export const measurementRepo = new MeasurementRepository(db.measurements);
export const appearanceRepo = new AppearanceRepository(db.appearance);
export const paletteRepo = new PaletteRepository(db.palette);
export const personalityRepo = new PersonalityRepository(db.personality);
export const traitRepo = new TraitRepository(db.traits);
export const settingsRepo = new SettingsRepository(db.settings);
export const profileRepo = new ProfileRepository(db.profile);
export const reminderRepo = new ReminderRepository(db.reminders);
export const bucketListRepo = new BucketListRepository(db.bucketList);
export const accountRepo = new AccountRepository(db.accounts);
export const financeCategoryRepo = new FinanceCategoryRepository(db.financeCategories);
export const transactionRepo = new TransactionRepository(db.transactions);
export const savingsGoalRepo = new SavingsGoalRepository(db.savingsGoals);
export const debtRepo = new DebtRepository(db.debts);
export const netWorthSnapshotRepo = new NetWorthSnapshotRepository(db.netWorthSnapshots);

export * from './base';

// Helper to normalize any record to BaseEntity
function normalizeRecord<T extends { id?: string }>(item: T, defaultId?: string): T & {
  id: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  revision: number;
} {
  const now = new Date().toISOString();
  return {
    ...item,
    id: item.id || defaultId || generateUuid(),
    created_at: (item as any).created_at || (item as any).createdAt || now,
    updated_at: (item as any).updated_at || now,
    deleted_at: (item as any).deleted_at || (item as any).deletedAt || null,
    revision: typeof (item as any).revision === 'number' ? (item as any).revision : 1,
  };
}

/**
 * Initializes database from localStorage or mock data if IndexedDB is empty.
 * Runs once smoothly on first boot.
 */
export async function initDatabase(): Promise<void> {
  // Clean up any legacy unsplash stock photos from existing records to satisfy the editorial rule
  try {
    const unsplashItems = await db.items.filter((i: any) => !!(i.imageUrl && typeof i.imageUrl === 'string' && i.imageUrl.includes('unsplash.com'))).toArray();
    for (const item of unsplashItems) {
      await db.items.update(item.id, { imageUrl: undefined });
    }
  } catch (err) {
    console.warn('[Vessel DB] Could not purge unsplash photos:', err);
  }

  // Ensure reminders table is populated
  try {
    const remindersCount = await db.reminders.count();
    if (remindersCount === 0) {
      await reminderRepo.batchPut(INITIAL_REMINDERS.map((r) => normalizeRecord(r)));
    }
  } catch (err) {
    console.warn('[Vessel DB] Could not seed reminders:', err);
  }

  // Ensure bucketList table is populated
  try {
    const bucketCount = await db.bucketList.count();
    if (bucketCount === 0) {
      await bucketListRepo.batchPut(INITIAL_BUCKET_LIST.map((b) => normalizeRecord(b)));
    }
  } catch (err) {
    console.warn('[Vessel DB] Could not seed bucket list:', err);
  }

  // Ensure accounts table is populated
  try {
    const existingAccounts = await accountRepo.list();
    const hasOldDummyAccount = existingAccounts.some((a) => a.id === 'acc-credit-platinum');
    if (hasOldDummyAccount || existingAccounts.length === 0) {
      if (hasOldDummyAccount) await db.accounts.clear();
      await accountRepo.batchPut(INITIAL_ACCOUNTS.map((a) => normalizeRecord(a)));
    }
  } catch (err) {
    console.warn('[Vessel DB] Could not seed accounts:', err);
  }

  // Ensure financeCategories table is populated
  try {
    const existingCats = await financeCategoryRepo.list();
    const hasOldDummyCats = existingCats.some((c) => c.id === 'cat-living-housing');
    if (hasOldDummyCats || existingCats.length === 0) {
      if (hasOldDummyCats) await db.financeCategories.clear();
      await financeCategoryRepo.batchPut(INITIAL_FINANCE_CATEGORIES.map((c) => normalizeRecord(c)));
    }
  } catch (err) {
    console.warn('[Vessel DB] Could not seed finance categories:', err);
  }

  // Ensure transactions table is populated
  try {
    const existingTx = await transactionRepo.list();
    const hasOldDummyTx = existingTx.some((t) => t.id === 'tx-1');
    if (hasOldDummyTx || existingTx.length === 0) {
      if (hasOldDummyTx) await db.transactions.clear();
      await transactionRepo.batchPut(INITIAL_TRANSACTIONS.map((t) => normalizeRecord(t)));
    }
  } catch (err) {
    console.warn('[Vessel DB] Could not seed transactions:', err);
  }

  // Ensure savingsGoals table is populated
  try {
    const goalsCount = await db.savingsGoals.count();
    const existingGoals = await savingsGoalRepo.list();
    const hasOldGoals = existingGoals.some((g) => g.id === 'goal-macbook');
    if (hasOldGoals || goalsCount === 0) {
      if (hasOldGoals) await db.savingsGoals.clear();
      await savingsGoalRepo.batchPut(INITIAL_SAVINGS_GOALS.map((g) => normalizeRecord(g)));
    }
  } catch (err) {
    console.warn('[Vessel DB] Could not seed savings goals:', err);
  }

  // Ensure debts table is populated
  try {
    const existingDebts = await debtRepo.list();
    const hasOldStudyDebt = existingDebts.some((d) => d.id === 'debt-study');
    if (hasOldStudyDebt || existingDebts.length === 0) {
      if (hasOldStudyDebt) await db.debts.clear();
      await debtRepo.batchPut(INITIAL_DEBTS.map((d) => normalizeRecord(d)));
    }
  } catch (err) {
    console.warn('[Vessel DB] Could not seed debts:', err);
  }

  // Ensure netWorthSnapshots table is populated
  try {
    const nwCount = await db.netWorthSnapshots.count();
    if (nwCount === 0) {
      await netWorthSnapshotRepo.batchPut(INITIAL_NET_WORTH_SNAPSHOTS.map((s) => normalizeRecord(s)));
    }
  } catch (err) {
    console.warn('[Vessel DB] Could not seed net worth snapshots:', err);
  }

  // Synchronize habits with canonical Mind Vault daily operating system
  try {
    const canonicalHabitIds = new Set(INITIAL_HABITS.map((h) => h.id));
    for (const h of INITIAL_HABITS) {
      const existing = await habitRepo.get(h.id);
      if (existing) {
        await habitRepo.update(h.id, {
          name: h.name,
          attribute: h.attribute,
          description: h.description,
          non_negotiable: h.non_negotiable,
          isArchived: false,
          archivedAt: undefined,
          deleted_at: null,
          deletedAt: undefined,
        } as any);
      } else {
        await habitRepo.batchPut([normalizeRecord(h)]);
      }
    }

    // Purge any rogue user-added habits that are not part of the canonical operating system
    const allHabits = await habitRepo.list();
    for (const h of allHabits) {
      if (!canonicalHabitIds.has(h.id)) {
        await habitRepo.hardDelete(h.id);
      }
    }
  } catch (err) {
    console.warn('[Vessel DB] Could not sync canonical habits:', err);
  }

  // Ensure Stat Sheet & event tables are populated if empty
  try {
    const existingMeasurements = await measurementRepo.list();
    const hasOldPlaceholder = existingMeasurements.some((m) => m.id === 'bm-1');
    if (hasOldPlaceholder || existingMeasurements.length === 0) {
      await measurementRepo.batchPut(INITIAL_BODY_MEASUREMENTS.map((m) => normalizeRecord(m)));
    }

    // Purge any rogue 74.5 kg measurement and restore any accidentally deleted baseline measurements
    const allMeasurements = await measurementRepo.list();
    for (const m of allMeasurements) {
      if (m.type === 'weight' && m.value === 74.5) {
        await measurementRepo.hardDelete(m.id);
      } else if ((m as any).deletedAt || m.deleted_at) {
        await measurementRepo.update(m.id, { deleted_at: null, deletedAt: undefined } as any);
      }
    }
    const currentMeasurements = await measurementRepo.list();
    const currentIds = new Set(currentMeasurements.map((m) => m.id));
    const missingMeasurements = INITIAL_BODY_MEASUREMENTS.filter((m) => !currentIds.has(m.id));
    if (missingMeasurements.length > 0) {
      await measurementRepo.batchPut(missingMeasurements.map((m) => normalizeRecord(m)));
    }

    // Update height to exact measured value (67.5 in = 5ft 7.5in)
    const heightRecord = (await measurementRepo.list()).find((m) => m.type === 'height' || m.id === 'bm-height');
    if (heightRecord && (heightRecord.value !== 67.5 || heightRecord.unit !== 'in')) {
      await measurementRepo.update(heightRecord.id, {
        value: 67.5,
        unit: 'in',
        note: 'Measured height (5ft 7.5in / ~171.5cm)',
      });
    }

    const currentSettings = await settingsRepo.get('default_settings');
    if (currentSettings) {
      if (currentSettings.unitSystem !== 'hybrid' || currentSettings.targetWeightKg !== 85) {
        await settingsRepo.update('default_settings', {
          unitSystem: 'hybrid',
          targetWeightKg: 85,
        });
      }
    }

    // Ensure immutable character codex (traits, personality, palette) are restored and never missing
    const allTraits = await traitRepo.list();
    for (const t of allTraits) {
      if ((t as any).deletedAt || t.deleted_at) {
        await traitRepo.update(t.id, { deleted_at: null, deletedAt: undefined } as any);
      }
    }
    const existingTraitIds = new Set(allTraits.map((t) => t.id));
    const missingTraits = INITIAL_TRAITS.filter((t) => !existingTraitIds.has(t.id));
    if (missingTraits.length > 0) {
      await traitRepo.batchPut(missingTraits.map((t) => normalizeRecord(t)));
    }

    // Clean up stale mock personality entries (INTJ-A, 5w6) and ensure canonical Mind Vault typology is active
    const allPersonality = await personalityRepo.list();
    for (const p of allPersonality) {
      if (
        p.id === 'pers-1' ||
        p.id === 'pers-2' ||
        p.id === 'pers-3' ||
        (p.system === 'MBTI' && p.result.includes('INTJ'))
      ) {
        await personalityRepo.hardDelete(p.id);
      } else if ((p as any).deletedAt || p.deleted_at) {
        await personalityRepo.update(p.id, { deleted_at: null, deletedAt: undefined } as any);
      }
    }
    const currentPers = await personalityRepo.list();
    const existingPersIds = new Set(currentPers.map((p) => p.id));
    const missingPers = INITIAL_PERSONALITY.filter((p) => !existingPersIds.has(p.id));
    if (missingPers.length > 0) {
      await personalityRepo.batchPut(missingPers.map((p) => normalizeRecord(p)));
    }

    const allPalette = await paletteRepo.list();
    for (const pal of allPalette) {
      if ((pal as any).deletedAt || pal.deleted_at) {
        await paletteRepo.update(pal.id, { deleted_at: null, deletedAt: undefined } as any);
      }
    }
    const existingPalIds = new Set(allPalette.map((pal) => pal.id));
    const missingPalette = INITIAL_COLOR_PALETTE.filter((pal) => !existingPalIds.has(pal.id));
    if (missingPalette.length > 0) {
      await paletteRepo.batchPut(missingPalette.map((pal) => normalizeRecord(pal)));
    }
    const existingAppearance = await appearanceRepo.get('default_appearance');
    if (!existingAppearance) {
      const raw = localStorage.getItem('vessel_character_appearance_v1');
      const seed: CharacterAppearance = raw ? JSON.parse(raw) : INITIAL_APPEARANCE;
      await appearanceRepo.batchPut([normalizeRecord({
        ...seed,
        shoeSize: INITIAL_APPEARANCE.shoeSize,
        opticalPrescription: INITIAL_APPEARANCE.opticalPrescription,
        geneticHardware: INITIAL_APPEARANCE.geneticHardware,
        neurotype: INITIAL_APPEARANCE.neurotype,
      }, 'default_appearance')]);
    } else if (
      !existingAppearance.shoeSize ||
      !existingAppearance.opticalPrescription ||
      !existingAppearance.geneticHardware ||
      !existingAppearance.neurotype
    ) {
      await appearanceRepo.update('default_appearance', {
        shoeSize: INITIAL_APPEARANCE.shoeSize,
        opticalPrescription: INITIAL_APPEARANCE.opticalPrescription,
        geneticHardware: INITIAL_APPEARANCE.geneticHardware,
        neurotype: INITIAL_APPEARANCE.neurotype,
      });
    }
    if ((await db.xpEvents.count()) === 0) {
      const rawXp = localStorage.getItem('vessel_xp_events_v1');
      const seedXp: XpEvent[] = rawXp ? JSON.parse(rawXp) : INITIAL_XP_EVENTS;
      await xpEventRepo.batchPut(seedXp.map((x) => normalizeRecord(x)));
    }
    if ((await db.wearEvents.count()) === 0) {
      const rawWear = localStorage.getItem('vessel_wear_events_v1');
      const seedWear: WearEvent[] = rawWear ? JSON.parse(rawWear) : INITIAL_WEAR_EVENTS;
      await wearEventRepo.batchPut(seedWear.map((w) => normalizeRecord(w)));
    }
  } catch (err) {
    console.warn('[Vessel DB] Could not seed Stat Sheet / XP tables:', err);
  }

  const itemsCount = await db.items.count();
  if (itemsCount > 0) {
    // Backfill any missing initial items (e.g. newly ingested real items)
    try {
      const existingItems = await itemRepo.list();
      const existingIds = new Set(existingItems.map((i) => i.id));
      const missing = INITIAL_ITEMS.filter((i) => !existingIds.has(i.id));
      if (missing.length > 0) {
        console.log(`[Vessel DB] Backfilling ${missing.length} missing initial items...`);
        await itemRepo.batchPut(missing.map((m) => normalizeRecord(m)));
      }

      // Synchronize canonical item details (pricing, clean names, quantities, notes, lore)
      const canonicalItemsToSync = [
        'item-bottom-jeans-janna-black',
        'item-panjabi-1',
        'item-panjabi-2',
        'item-panjabi-3',
        'item-panjabi-4',
        'item-panjabi-5',
        'item-apparel-overcoat-huaxi-heavy',
        'item-apparel-shirt-arvind-chocolate',
        'item-apparel-shirt-textured-slate-blue',
        'item-bottom-jeans-1',
        'item-bottom-jogger-1',
        'item-bottom-jogger-london-black',
        'item-apparel-trouser-tahari-black',
        'item-apparel-trouser-lowemc-slim',
        'item-apparel-shirt-forest-green',
        'item-apparel-shirt-mpi-cyan',
        'item-apparel-lungi-manikganj',
        'item-edc-towel-1',
        'item-apparel-polo-european-it',
        'item-apparel-shirt-rover-uniform',
        'item-apparel-shirt-dad-striped',
        'item-apparel-sweatshirt-retired-red',
        'item-apparel-panjabi-coral-red',
        'item-apparel-overcoat-1',
        'item-apparel-jacket-1',
        'item-apparel-tshirt-1',
        'item-apparel-shirt-1',
        'item-apparel-tshirt-xios-black',
        'item-apparel-sweater-school-navy',
        'item-apparel-hoodie-blaze-grey',
        'item-apparel-sweater-striped-badol',
        'item-rover-moot-jacket',
        'item-rover-moot-trousers',
        'item-apparel-tshirt-ocean-white',
        'item-apparel-sweater-glitch-stripe',
        'item-apparel-trouser-black-relaxed',
        'item-apparel-hoodie-diploma-black',
        'item-apparel-jeans-indigo-dark',
        'item-apparel-polo-biman-optimizers',
        'item-apparel-trouser-school-rover-navy',
        'item-apparel-shirt-school-white',
        'item-apparel-1',
        'item-apparel-2',
        'item-apparel-3',
        'item-apparel-4',
        'item-apparel-5',
      ];
      for (const id of canonicalItemsToSync) {
        const canonical = INITIAL_ITEMS.find((i) => i.id === id);
        if (canonical && existingIds.has(id)) {
          await itemRepo.update(id, {
            name: canonical.name,
            goldValue: canonical.goldValue,
            quantity: canonical.quantity,
            notes: canonical.notes,
            lore: canonical.lore,
            tags: canonical.tags,
          });
        }
      }

      // Backfill and synchronize quests from Mind Vault
      const existingQuests = await questRepo.list();
      const existingQuestIds = new Set(existingQuests.map((q) => q.id));
      const missingQuests = INITIAL_QUESTS.filter((q) => !existingQuestIds.has(q.id));
      if (missingQuests.length > 0) {
        await questRepo.batchPut(missingQuests.map((q) => normalizeRecord(q)));
      }
      const q1 = await questRepo.get('quest-1');
      if (q1 && q1.title.includes('Benchpress')) {
        const canonicalQ1 = INITIAL_QUESTS.find((q) => q.id === 'quest-1');
        if (canonicalQ1) await questRepo.update('quest-1', canonicalQ1);
      }
      const q2 = await questRepo.get('quest-2');
      if (q2 && q2.title.includes('Event Bus')) {
        const canonicalQ2 = INITIAL_QUESTS.find((q) => q.id === 'quest-2');
        if (canonicalQ2) await questRepo.update('quest-2', canonicalQ2);
      }
      const qEvidence = await questEvidenceRepo.get('ev-1');
      if (qEvidence && qEvidence.content.includes('70kg')) {
        const canonicalEv = INITIAL_QUEST_EVIDENCE.find((e) => e.id === 'ev-1');
        if (canonicalEv) await questEvidenceRepo.update('ev-1', canonicalEv);
      }
    } catch (err) {
      console.warn('[Vessel DB] Could not backfill initial items/quests:', err);
    }
    return;
  }

  console.log('[Vessel DB] Populating Dexie database with initial records...');
  const now = new Date().toISOString();

  // 1. Items
  let loadedItems: InventoryItem[] = [];
  try {
    const raw = localStorage.getItem('vessel_inventory_items_v5') ||
      localStorage.getItem('vessel_inventory_items_v4') ||
      localStorage.getItem('vessel_inventory_items_v3');
    if (raw) {
      loadedItems = JSON.parse(raw);
    }
  } catch {}
  if (!loadedItems || loadedItems.length === 0) {
    loadedItems = INITIAL_ITEMS;
  }
  await itemRepo.batchPut(loadedItems.map((i) => normalizeRecord(i)));

  // 2. Profile
  let loadedProfile: CharacterProfile = INITIAL_PROFILE as unknown as CharacterProfile;
  try {
    const raw = localStorage.getItem('vessel_character_profile_v3');
    if (raw) loadedProfile = JSON.parse(raw);
  } catch {}
  await profileRepo.batchPut([normalizeRecord(loadedProfile, 'default_profile')]);

  // 3. Skills
  let loadedSkills: SkillNode[] = INITIAL_SKILLS as unknown as SkillNode[];
  try {
    const raw = localStorage.getItem('vessel_skill_tree_v3');
    if (raw) loadedSkills = JSON.parse(raw);
  } catch {}
  await skillRepo.batchPut(loadedSkills.map((s) => normalizeRecord(s)));

  // 4. Habits
  let loadedHabits: CustomHabit[] = INITIAL_HABITS as unknown as CustomHabit[];
  try {
    const raw = localStorage.getItem('vessel_custom_habits_v3');
    if (raw) loadedHabits = JSON.parse(raw);
  } catch {}
  await habitRepo.batchPut(loadedHabits.map((h) => normalizeRecord(h)));

  // 5. Day Records
  let loadedDayRecords: DayRecord[] = Object.values(INITIAL_DAY_RECORDS) as unknown as DayRecord[];
  try {
    const raw = localStorage.getItem('vessel_day_records_v3');
    if (raw) {
      const parsed = JSON.parse(raw);
      loadedDayRecords = Object.values(parsed);
    }
  } catch {}
  await dayRecordRepo.batchPut(loadedDayRecords.map((r) => normalizeRecord(r, r.date)));

  // 6. Settings
  let loadedSettings: AppSettings = {
    ...DEFAULT_SETTINGS,
    currencySymbol: '৳',
    numberGrouping: 'bangladeshi',
    id: 'default_settings',
    created_at: now,
    updated_at: now,
    deleted_at: null,
    revision: 1,
  };
  try {
    const raw = localStorage.getItem('vessel_app_settings_v1');
    if (raw) {
      const parsed = JSON.parse(raw);
      loadedSettings = {
        ...loadedSettings,
        ...parsed,
        currencySymbol: parsed.currencySymbol || '৳',
        numberGrouping: parsed.numberGrouping || 'bangladeshi',
      };
    }
  } catch {}
  await settingsRepo.batchPut([normalizeRecord(loadedSettings, 'default_settings')]);

  // 7. Quests & Evidence
  let loadedQuests: Quest[] = INITIAL_QUESTS;
  try {
    const raw = localStorage.getItem('vessel_quests_v1');
    if (raw) loadedQuests = JSON.parse(raw);
  } catch {}
  await questRepo.batchPut(loadedQuests.map((q) => normalizeRecord(q)));

  let loadedEvidence: QuestEvidence[] = INITIAL_QUEST_EVIDENCE;
  try {
    const raw = localStorage.getItem('vessel_quest_evidence_v1');
    if (raw) loadedEvidence = JSON.parse(raw);
  } catch {}
  await questEvidenceRepo.batchPut(loadedEvidence.map((e) => normalizeRecord(e)));

  // 8. Body measurements
  try {
    const raw = localStorage.getItem('vessel_body_measurements_v1');
    if (raw) {
      const parsed: BodyMeasurement[] = JSON.parse(raw);
      await measurementRepo.batchPut(parsed.map((m) => normalizeRecord(m)));
    }
  } catch {}

  // 9. Appearance
  try {
    const raw = localStorage.getItem('vessel_character_appearance_v1');
    if (raw) {
      const parsed: CharacterAppearance = JSON.parse(raw);
      await appearanceRepo.batchPut([normalizeRecord(parsed, 'default_appearance')]);
    }
  } catch {}

  // 10. Palette
  try {
    const raw = localStorage.getItem('vessel_color_palette_v1');
    if (raw) {
      const parsed: PaletteColor[] = JSON.parse(raw);
      await paletteRepo.batchPut(parsed.map((p) => normalizeRecord(p)));
    }
  } catch {}

  // 11. Personality
  try {
    const raw = localStorage.getItem('vessel_personality_v1');
    if (raw) {
      const parsed: PersonalityEntry[] = JSON.parse(raw);
      await personalityRepo.batchPut(parsed.map((p) => normalizeRecord(p)));
    }
  } catch {}

  // 12. Traits
  try {
    const raw = localStorage.getItem('vessel_character_traits_v1');
    if (raw) {
      const parsed: CharacterTrait[] = JSON.parse(raw);
      await traitRepo.batchPut(parsed.map((t) => normalizeRecord(t)));
    }
  } catch {}

  // 13. Wear and XP Events
  try {
    const rawWear = localStorage.getItem('vessel_wear_events_v1');
    if (rawWear) {
      const parsed: WearEvent[] = JSON.parse(rawWear);
      await wearEventRepo.batchPut(parsed.map((w) => normalizeRecord(w)));
    }
    const existingXp = await xpEventRepo.list();
    if (existingXp.length === 0) {
      const rawXp = localStorage.getItem('vessel_xp_events_v1');
      const seedXp = rawXp ? JSON.parse(rawXp) : INITIAL_XP_EVENTS;
      await xpEventRepo.batchPut(seedXp.map((x: any) => normalizeRecord(x)));
    }
  } catch {}

  console.log('[Vessel DB] Dexie database initialized successfully.');
}
