import type {
  InventoryItem,
  CharacterProfile,
  SkillNode,
  DayRecord,
  CustomHabit,
  WearEvent,
  SavedLoadout,
  XpEvent,
  AppSettings,
} from '../types';
import {
  INITIAL_ITEMS,
  INITIAL_PROFILE,
  INITIAL_SKILLS,
  INITIAL_DAY_RECORDS,
  INITIAL_HABITS,
} from '../data/mockData';
import { XP_DISCIPLINE_REWARDS } from '../data/xpConfig';

const STORAGE_KEYS = {
  ITEMS: 'vessel_inventory_items_v4',
  PROFILE: 'vessel_character_profile_v3',
  SKILLS: 'vessel_skill_tree_v3',
  DAY_RECORDS: 'vessel_day_records_v3',
  HABITS: 'vessel_custom_habits_v3',
  WEAR_EVENTS: 'vessel_wear_events_v1',
  LOADOUTS: 'vessel_saved_loadouts_v1',
  XP_EVENTS: 'vessel_xp_events_v1',
  SETTINGS: 'vessel_app_settings_v1',
};

export const DEFAULT_SETTINGS: AppSettings = {
  currencySymbol: '$',
  maxEncumbranceKg: 12.0,
};

export const INITIAL_SAVED_LOADOUTS: SavedLoadout[] = [
  {
    id: 'loadout-office',
    name: 'Office & Deep Work',
    equippedItemIds: [
      'item-apparel-1',
      'item-apparel-2',
      'item-apparel-3',
      'item-apparel-4',
      'item-apparel-5',
      'item-tech-1',
      'item-tome-1',
      'item-edc-1',
    ],
    createdAt: '2026-10-25',
  },
  {
    id: 'loadout-travel',
    name: 'Minimal Travel Pack',
    equippedItemIds: [
      'item-apparel-2',
      'item-apparel-3',
      'item-apparel-4',
      'item-tech-2',
      'item-edc-1',
    ],
    createdAt: '2026-10-26',
  },
];

// Seed initial authentic wear events for default owned items
function generateInitialWearEvents(): WearEvent[] {
  const events: WearEvent[] = [];
  const wearCounts: Record<string, number> = {
    'item-apparel-1': 24, // Field Overshirt
    'item-apparel-2': 42, // Merino Base Layer
    'item-apparel-3': 38, // Twill Trousers
    'item-apparel-4': 56, // Field Boots
    'item-apparel-5': 18, // Cashmere Cap
    'item-tech-1': 140, // Laptop
    'item-tech-2': 110, // Headphones
    'item-tome-1': 85,  // Holy Quran
    'item-tome-2': 12,  // Design book
    'item-edc-1': 165,  // Automatic Watch
    'item-edc-2': 45,   // Bolt-Action Pen
  };

  Object.entries(wearCounts).forEach(([itemId, count]) => {
    for (let i = 0; i < count; i++) {
      events.push({
        id: `wear-${itemId}-${i}`,
        itemId,
        type: 'worn',
        date: '2026-10-01',
      });
    }
  });

  return events;
}

// Seed baseline XP events from recorded historical days and base profile
function generateInitialXpEvents(): XpEvent[] {
  const events: XpEvent[] = [];
  let evId = 1;

  // 1. Generate from INITIAL_DAY_RECORDS
  Object.values(INITIAL_DAY_RECORDS).forEach(rec => {
    // Salah prayers
    const prayerCount = Object.values(rec.salah).filter(Boolean).length;
    if (prayerCount > 0) {
      events.push({
        id: `xp-init-${evId++}`,
        action: `Salah Prayers (${prayerCount}/5)`,
        pillar: 'WIS',
        points: prayerCount * XP_DISCIPLINE_REWARDS.SALAH_PRAYER,
        date: rec.date,
      });
    }
    if (prayerCount === 5) {
      events.push({
        id: `xp-init-${evId++}`,
        action: 'Perfect 5/5 Prayers Day Bonus',
        pillar: 'WIS',
        points: XP_DISCIPLINE_REWARDS.PERFECT_SALAH_DAY_BONUS,
        date: rec.date,
      });
    }

    // Pushups & Squats
    if (rec.pushups > 0) {
      events.push({
        id: `xp-init-${evId++}`,
        action: `${rec.pushups} Pushup Reps`,
        pillar: 'STR',
        points: rec.pushups * XP_DISCIPLINE_REWARDS.PUSHUP_REP,
        date: rec.date,
      });
    }
    if (rec.squats > 0) {
      events.push({
        id: `xp-init-${evId++}`,
        action: `${rec.squats} Squat Reps`,
        pillar: 'STR',
        points: rec.squats * XP_DISCIPLINE_REWARDS.SQUAT_REP,
        date: rec.date,
      });
    }
    if (rec.workoutCompleted) {
      events.push({
        id: `xp-init-${evId++}`,
        action: 'Full Movement Workout Bonus',
        pillar: 'STR',
        points: XP_DISCIPLINE_REWARDS.FULL_WORKOUT_BONUS,
        date: rec.date,
      });
    }

    // Deep work
    if (rec.deepWorkMinutes > 0) {
      events.push({
        id: `xp-init-${evId++}`,
        action: `${rec.deepWorkMinutes}m Deep Work Trance`,
        pillar: 'INT',
        points: rec.deepWorkMinutes * XP_DISCIPLINE_REWARDS.DEEP_WORK_PER_MINUTE,
        date: rec.date,
      });
    }

    // Habits
    rec.completedHabitIds.forEach(hId => {
      const habit = INITIAL_HABITS.find(h => h.id === hId);
      events.push({
        id: `xp-init-${evId++}`,
        action: habit ? habit.name : 'Daily Discipline',
        pillar: habit ? habit.attribute : 'WIS',
        points: XP_DISCIPLINE_REWARDS.HABIT_COMPLETION,
        date: rec.date,
      });
    });
  });

  // 2. Add foundational baseline milestones to reach Sadman's archetype baseline
  events.push(
    { id: `xp-init-${evId++}`, action: 'Historical Iron Movement Mastery', pillar: 'STR', points: 1400, date: '2026-10-01' },
    { id: `xp-init-${evId++}`, action: 'Architectural Systems Shipped', pillar: 'INT', points: 3600, date: '2026-10-01' },
    { id: `xp-init-${evId++}`, action: 'Foundational Sacred Studies & Memorization', pillar: 'WIS', points: 2600, date: '2026-10-01' },
    { id: `xp-init-${evId++}`, action: 'Kindred Enablement & Community Leadership', pillar: 'CHA', points: 2100, date: '2026-10-01' },
  );

  return events;
}

export function loadItems(): InventoryItem[] {
  try {
    let raw = localStorage.getItem(STORAGE_KEYS.ITEMS);
    if (!raw) {
      raw = localStorage.getItem('vessel_inventory_items_v3');
    }
    if (!raw) {
      raw = localStorage.getItem('vessel_inventory_items_v2');
    }

    if (raw) {
      const parsed: InventoryItem[] = JSON.parse(raw);
      const healed: InventoryItem[] = parsed.map((item: InventoryItem) => {
        const match = INITIAL_ITEMS.find(init => init.id === item.id);
        const status = item.ownershipStatus || (item.isLocked ? 'wishlist' : match?.ownershipStatus || 'owned');
        const img = item.imageUrl || match?.imageUrl;
        return {
          ...item,
          ownershipStatus: status,
          imageUrl: img,
          pastReason: item.pastReason || match?.pastReason,
          pastDate: item.pastDate || match?.pastDate,
          carried: item.carried !== undefined ? item.carried : (item.isEquipped ?? (status === 'owned')),
          targetPrice: item.targetPrice || item.goldValue || match?.goldValue,
          location: item.location || (status === 'owned' ? (item.isEquipped ? 'On Person' : 'Vault Wardrobe') : 'Wishlist'),
        };
      });

      const existingIds = new Set(healed.map(i => i.id));
      INITIAL_ITEMS.forEach(init => {
        if (!existingIds.has(init.id)) {
          healed.push({
            ...init,
            carried: init.isEquipped ?? true,
            location: init.isEquipped ? 'On Person' : 'Vault Wardrobe',
          });
        }
      });

      return healed;
    }
  } catch (err) {
    console.error('Failed to load items', err);
  }

  return INITIAL_ITEMS.map(i => ({
    ...i,
    carried: i.isEquipped ?? (i.ownershipStatus === 'owned'),
    location: i.isEquipped ? 'On Person' : 'Vault Wardrobe',
  }));
}

export function saveItems(items: InventoryItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(items));
  } catch (err) {
    console.error('Failed to save items', err);
  }
}

export function loadProfile(): CharacterProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PROFILE);
    if (raw) {
      const parsed: CharacterProfile = JSON.parse(raw);
      if (parsed.name === 'Mehedi') {
        parsed.name = 'Sadman Zaman Khan';
        saveProfile(parsed);
      }
      return parsed;
    }
  } catch (err) {
    console.error('Failed to load profile', err);
  }
  return INITIAL_PROFILE;
}

export function saveProfile(profile: CharacterProfile): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
  } catch (err) {
    console.error('Failed to save profile', err);
  }
}

export function loadSkills(): SkillNode[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SKILLS);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load skills', err);
  }
  return INITIAL_SKILLS;
}

export function saveSkills(skills: SkillNode[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SKILLS, JSON.stringify(skills));
  } catch (err) {
    console.error('Failed to save skills', err);
  }
}

export function loadHabits(): CustomHabit[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.HABITS);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load habits', err);
  }
  return INITIAL_HABITS;
}

export function saveHabits(habits: CustomHabit[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(habits));
  } catch (err) {
    console.error('Failed to save habits', err);
  }
}

export function loadDayRecords(): Record<string, DayRecord> {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DAY_RECORDS);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load day records', err);
  }
  return INITIAL_DAY_RECORDS;
}

export function saveDayRecords(records: Record<string, DayRecord>): void {
  try {
    localStorage.setItem(STORAGE_KEYS.DAY_RECORDS, JSON.stringify(records));
  } catch (err) {
    console.error('Failed to save day records', err);
  }
}

// Wear Events Log
export function loadWearEvents(): WearEvent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.WEAR_EVENTS);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load wear events', err);
  }
  const initial = generateInitialWearEvents();
  saveWearEvents(initial);
  return initial;
}

export function saveWearEvents(events: WearEvent[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.WEAR_EVENTS, JSON.stringify(events));
  } catch (err) {
    console.error('Failed to save wear events', err);
  }
}

export function recordWearEvent(itemId: string, date?: string): WearEvent {
  const events = loadWearEvents();
  const newEvent: WearEvent = {
    id: `wear-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    itemId,
    type: 'worn',
    date: date || new Date().toISOString().split('T')[0],
  };
  events.push(newEvent);
  saveWearEvents(events);
  return newEvent;
}

// Saved Loadouts
export function loadSavedLoadouts(): SavedLoadout[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LOADOUTS);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load saved loadouts', err);
  }
  saveSavedLoadouts(INITIAL_SAVED_LOADOUTS);
  return INITIAL_SAVED_LOADOUTS;
}

export function saveSavedLoadouts(loadouts: SavedLoadout[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.LOADOUTS, JSON.stringify(loadouts));
  } catch (err) {
    console.error('Failed to save loadouts', err);
  }
}

// Append-only XP Events Log
export function loadXpEvents(): XpEvent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.XP_EVENTS);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load XP events', err);
  }
  const initial = generateInitialXpEvents();
  saveXpEvents(initial);
  return initial;
}

export function saveXpEvents(events: XpEvent[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.XP_EVENTS, JSON.stringify(events));
  } catch (err) {
    console.error('Failed to save XP events', err);
  }
}

// App Settings
export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch (err) {
    console.error('Failed to load settings', err);
  }
  return DEFAULT_SETTINGS;
}

export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save settings', err);
  }
}

export function exportSaveFile(): string {
  const data = {
    version: '3.0',
    exportedAt: new Date().toISOString(),
    profile: loadProfile(),
    items: loadItems(),
    skills: loadSkills(),
    habits: loadHabits(),
    dayRecords: loadDayRecords(),
    wearEvents: loadWearEvents(),
    savedLoadouts: loadSavedLoadouts(),
    xpEvents: loadXpEvents(),
    settings: loadSettings(),
  };
  return JSON.stringify(data, null, 2);
}

export function importSaveFile(jsonString: string): boolean {
  try {
    const parsed = JSON.parse(jsonString);
    if (parsed.profile && parsed.items && parsed.skills) {
      saveProfile(parsed.profile);
      saveItems(parsed.items);
      saveSkills(parsed.skills);
      if (parsed.habits) saveHabits(parsed.habits);
      if (parsed.dayRecords) saveDayRecords(parsed.dayRecords);
      if (parsed.wearEvents) saveWearEvents(parsed.wearEvents);
      if (parsed.savedLoadouts) saveSavedLoadouts(parsed.savedLoadouts);
      if (parsed.xpEvents) saveXpEvents(parsed.xpEvents);
      if (parsed.settings) saveSettings(parsed.settings);
      return true;
    }
  } catch (err) {
    console.error('Failed to import backup', err);
  }
  return false;
}
