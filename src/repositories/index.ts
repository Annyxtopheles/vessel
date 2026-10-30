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
} from '../data/mockData';
import {
  INITIAL_ACCOUNTS,
  INITIAL_FINANCE_CATEGORIES,
  INITIAL_TRANSACTIONS,
  INITIAL_SAVINGS_GOALS,
  INITIAL_DEBTS,
  INITIAL_NET_WORTH_SNAPSHOTS,
} from '../utils/finance';
import {
  INITIAL_QUESTS,
  INITIAL_QUEST_EVIDENCE,
  DEFAULT_SETTINGS,
  INITIAL_BODY_MEASUREMENTS,
  INITIAL_APPEARANCE,
  INITIAL_COLOR_PALETTE,
  INITIAL_PERSONALITY,
  INITIAL_TRAITS,
} from '../utils/storage';

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
    const accountsCount = await db.accounts.count();
    if (accountsCount === 0) {
      await accountRepo.batchPut(INITIAL_ACCOUNTS.map((a) => normalizeRecord(a)));
    }
  } catch (err) {
    console.warn('[Vessel DB] Could not seed accounts:', err);
  }

  // Ensure financeCategories table is populated
  try {
    const catCount = await db.financeCategories.count();
    if (catCount === 0) {
      await financeCategoryRepo.batchPut(INITIAL_FINANCE_CATEGORIES.map((c) => normalizeRecord(c)));
    }
  } catch (err) {
    console.warn('[Vessel DB] Could not seed finance categories:', err);
  }

  // Ensure transactions table is populated
  try {
    const txCount = await db.transactions.count();
    if (txCount === 0) {
      await transactionRepo.batchPut(INITIAL_TRANSACTIONS.map((t) => normalizeRecord(t)));
    }
  } catch (err) {
    console.warn('[Vessel DB] Could not seed transactions:', err);
  }

  // Ensure savingsGoals table is populated
  try {
    const goalsCount = await db.savingsGoals.count();
    if (goalsCount === 0) {
      await savingsGoalRepo.batchPut(INITIAL_SAVINGS_GOALS.map((g) => normalizeRecord(g)));
    }
  } catch (err) {
    console.warn('[Vessel DB] Could not seed savings goals:', err);
  }

  // Ensure debts table is populated
  try {
    const debtsCount = await db.debts.count();
    if (debtsCount === 0) {
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

  // Ensure habits have default non_negotiable values if undefined
  try {
    const habits = await db.habits.toArray();
    for (const habit of habits) {
      if (typeof habit.non_negotiable !== 'boolean') {
        const isDefaultNonNeg = habit.id === 'h-1' || habit.id === 'h-2';
        await db.habits.update(habit.id, { non_negotiable: isDefaultNonNeg });
      }
    }
  } catch (err) {
    console.warn('[Vessel DB] Could not migrate habits non_negotiable:', err);
  }

  // Ensure Stat Sheet & event tables are populated if empty
  try {
    if ((await db.measurements.count()) === 0) {
      const raw = localStorage.getItem('vessel_body_measurements_v1');
      const seed: BodyMeasurement[] = raw ? JSON.parse(raw) : INITIAL_BODY_MEASUREMENTS;
      await measurementRepo.batchPut(seed.map((m) => normalizeRecord(m)));
    }
    if ((await db.palette.count()) === 0) {
      const raw = localStorage.getItem('vessel_color_palette_v1');
      const seed: PaletteColor[] = raw ? JSON.parse(raw) : INITIAL_COLOR_PALETTE;
      await paletteRepo.batchPut(seed.map((p) => normalizeRecord(p)));
    }
    if ((await db.personality.count()) === 0) {
      const raw = localStorage.getItem('vessel_personality_v1');
      const seed: PersonalityEntry[] = raw ? JSON.parse(raw) : INITIAL_PERSONALITY;
      await personalityRepo.batchPut(seed.map((p) => normalizeRecord(p)));
    }
    if ((await db.traits.count()) === 0) {
      const raw = localStorage.getItem('vessel_character_traits_v1');
      const seed: CharacterTrait[] = raw ? JSON.parse(raw) : INITIAL_TRAITS;
      await traitRepo.batchPut(seed.map((t) => normalizeRecord(t)));
    }
    if ((await db.appearance.count()) === 0) {
      const raw = localStorage.getItem('vessel_character_appearance_v1');
      const seed: CharacterAppearance = raw ? JSON.parse(raw) : INITIAL_APPEARANCE;
      await appearanceRepo.batchPut([normalizeRecord(seed, 'default_appearance')]);
    }
    if ((await db.xpEvents.count()) === 0) {
      const rawXp = localStorage.getItem('vessel_xp_events_v1');
      const seedXp: XpEvent[] = rawXp ? JSON.parse(rawXp) : INITIAL_XP_EVENTS;
      await xpEventRepo.batchPut(seedXp.map((x) => normalizeRecord(x)));
    }
  } catch (err) {
    console.warn('[Vessel DB] Could not seed Stat Sheet / XP tables:', err);
  }

  const itemsCount = await db.items.count();
  if (itemsCount > 0) {
    // Already populated
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
