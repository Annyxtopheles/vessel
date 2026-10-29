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
  Quest,
  QuestEvidence,
  BodyMeasurement,
  CharacterAppearance,
  PaletteColor,
  PersonalityEntry,
  CharacterTrait,
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
  QUESTS: 'vessel_quests_v1',
  QUEST_EVIDENCE: 'vessel_quest_evidence_v1',
  BODY_MEASUREMENTS: 'vessel_body_measurements_v1',
  APPEARANCE: 'vessel_character_appearance_v1',
  COLOR_PALETTE: 'vessel_color_palette_v1',
  PERSONALITY: 'vessel_personality_v1',
  TRAITS: 'vessel_character_traits_v1',
};

export const INITIAL_QUESTS: Quest[] = [
  {
    id: 'quest-1',
    title: 'Benchpress Bodyweight Milestone',
    description: 'Achieve a clean single repetition of bodyweight (75 kg) with paused form.',
    status: 'doing',
    pillar: 'STR',
    difficulty: 'Hard',
    dueDate: '2026-11-05',
    evidenceRequired: true,
    linkedItemId: 'item-wish-1',
    createdAt: '2026-10-20',
  },
  {
    id: 'quest-2',
    title: 'Audit & Refactor Event Bus Architecture',
    description: 'Replace polling listeners with decoupled event-driven reactive stores.',
    status: 'todo',
    pillar: 'INT',
    difficulty: 'Medium',
    dueDate: '2026-10-30',
    evidenceRequired: false,
    createdAt: '2026-10-24',
  },
  {
    id: 'quest-3',
    title: 'Memorize Surah Al-Mulk with Tajweed',
    description: 'Commit all 30 verses of the protective Surah to daily recitation memory.',
    status: 'doing',
    pillar: 'WIS',
    difficulty: 'Hard',
    dueDate: '2026-11-15',
    evidenceRequired: true,
    linkedItemId: 'item-wish-2',
    createdAt: '2026-10-18',
  },
  {
    id: 'quest-4',
    title: 'Conduct Q4 Architecture Onboarding',
    description: 'Pair with 2 engineering apprentices to walk through state machines.',
    status: 'done',
    pillar: 'CHA',
    difficulty: 'Easy',
    dueDate: '2026-10-27',
    evidenceRequired: false,
    createdAt: '2026-10-22',
    completedAt: '2026-10-27',
  },
];

export const INITIAL_QUEST_EVIDENCE: QuestEvidence[] = [
  {
    id: 'ev-1',
    questId: 'quest-1',
    type: 'note',
    content: 'Hit 70kg for 3 reps comfortably on Tuesday. Will test 75kg next session.',
    addedAt: '2026-10-25',
  },
];

export const DEFAULT_SETTINGS: AppSettings = {
  currencySymbol: '$',
  maxEncumbranceKg: 12.0,
  unitSystem: 'metric',
  targetWeightKg: 73.0,
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

export function loadQuests(): Quest[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.QUESTS);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load quests', err);
  }
  saveQuests(INITIAL_QUESTS);
  return INITIAL_QUESTS;
}

export function saveQuests(quests: Quest[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.QUESTS, JSON.stringify(quests));
  } catch (err) {
    console.error('Failed to save quests', err);
  }
}

export function loadQuestEvidence(): QuestEvidence[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.QUEST_EVIDENCE);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load quest evidence', err);
  }
  saveQuestEvidence(INITIAL_QUESTEVIDENCE_FALLBACK);
  return INITIAL_QUESTEVIDENCE_FALLBACK;
}

const INITIAL_QUESTEVIDENCE_FALLBACK = INITIAL_QUEST_EVIDENCE;

export function saveQuestEvidence(evidence: QuestEvidence[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.QUEST_EVIDENCE, JSON.stringify(evidence));
  } catch (err) {
    console.error('Failed to save quest evidence', err);
  }
}

// 1. Body Measurements
export const INITIAL_BODY_MEASUREMENTS: BodyMeasurement[] = [
  { id: 'bm-1', type: 'weight', value: 76.2, unit: 'kg', date: '2026-10-07', note: 'Baseline weight' },
  { id: 'bm-2', type: 'weight', value: 75.8, unit: 'kg', date: '2026-10-14', note: 'Calisthenics volume increase' },
  { id: 'bm-3', type: 'weight', value: 75.0, unit: 'kg', date: '2026-10-21', note: 'Fasting day hydration' },
  { id: 'bm-4', type: 'weight', value: 74.5, unit: 'kg', date: '2026-10-28', note: 'Target reached' },
  { id: 'bm-5', type: 'height', value: 178, unit: 'cm', date: '2026-09-01', note: 'Morning measured height' },
  { id: 'bm-6', type: 'waist', value: 79, unit: 'cm', date: '2026-10-20', note: 'Natural waist circumference' },
  { id: 'bm-7', type: 'chest', value: 100, unit: 'cm', date: '2026-10-20', note: 'Chest under arms' },
];

export function loadBodyMeasurements(): BodyMeasurement[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.BODY_MEASUREMENTS);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load body measurements', err);
  }
  saveBodyMeasurements(INITIAL_BODY_MEASUREMENTS);
  return INITIAL_BODY_MEASUREMENTS;
}

export function saveBodyMeasurements(measurements: BodyMeasurement[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.BODY_MEASUREMENTS, JSON.stringify(measurements));
  } catch (err) {
    console.error('Failed to save body measurements', err);
  }
}

// 2. Appearance
export const INITIAL_APPEARANCE: CharacterAppearance = {
  skinToneHex: '#D7A781',
  skinToneNote: 'Warm golden olive undertones; thrives in rich earth tones, muted teal, charcoal.',
  hair: 'Dark Espresso Brown, medium textured crop',
  eyeColor: 'Deep Hazel / Amber',
  photoUrl: '/avatar.jpg',
  updatedAt: '2026-10-28',
};

export function loadAppearance(): CharacterAppearance {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.APPEARANCE);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load appearance', err);
  }
  saveAppearance(INITIAL_APPEARANCE);
  return INITIAL_APPEARANCE;
}

export function saveAppearance(appearance: CharacterAppearance): void {
  try {
    localStorage.setItem(STORAGE_KEYS.APPEARANCE, JSON.stringify(appearance));
  } catch (err) {
    console.error('Failed to save appearance', err);
  }
}

// 3. Color Palette
export const INITIAL_COLOR_PALETTE: PaletteColor[] = [
  { id: 'pal-1', colorHex: '#18181B', label: 'Deep Carbon', verdict: 'suits', note: 'High contrast foundational base' },
  { id: 'pal-2', colorHex: '#0891B2', label: 'Celeste Teal', verdict: 'suits', note: 'Signature accent & talisman' },
  { id: 'pal-3', colorHex: '#3F4E28', label: 'Olive Drab', verdict: 'suits', note: 'Harmonizes with warm olive skin' },
  { id: 'pal-4', colorHex: '#27272A', label: 'Charcoal Heather', verdict: 'suits', note: 'Sophisticated neutral' },
  { id: 'pal-5', colorHex: '#451A03', label: 'Espresso Brown', verdict: 'suits', note: 'Warm grounding leather tone' },
  { id: 'pal-6', colorHex: '#064E3B', label: 'Forest Emerald', verdict: 'suits', note: 'Rich jewel tone' },
  { id: 'pal-7', colorHex: '#F4EFE6', label: 'Natural Linen', verdict: 'neutral', note: 'Gentle contrast against dark outerwear' },
  { id: 'pal-8', colorHex: '#71717A', label: 'Slate Grey', verdict: 'neutral', note: 'Balanced middle ground' },
  { id: 'pal-9', colorHex: '#FDE047', label: 'Electric Yellow', verdict: 'avoid', note: 'Washes out warm undertones' },
  { id: 'pal-10', colorHex: '#F43F5E', label: 'Vivid Magenta', verdict: 'avoid', note: 'Clashes with olive undertones' },
  { id: 'pal-11', colorHex: '#D97706', label: 'High-Vis Amber', verdict: 'avoid', note: 'Overpowering artificial saturation' },
];

export function loadColorPalette(): PaletteColor[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.COLOR_PALETTE);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load color palette', err);
  }
  saveColorPalette(INITIAL_COLOR_PALETTE);
  return INITIAL_COLOR_PALETTE;
}

export function saveColorPalette(palette: PaletteColor[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.COLOR_PALETTE, JSON.stringify(palette));
  } catch (err) {
    console.error('Failed to save color palette', err);
  }
}

// 4. Personality
export const INITIAL_PERSONALITY: PersonalityEntry[] = [
  {
    id: 'pers-1',
    system: 'MBTI',
    result: 'INTJ-A (The Architect)',
    dateTaken: '2026-05-12',
    source: '16Personalities',
    notes: 'Strategic long-range synthesis with pragmatic execution and high independence.',
  },
  {
    id: 'pers-2',
    system: 'Enneagram',
    result: 'Type 5w6 (The Investigator with Loyalist Wing)',
    dateTaken: '2026-06-20',
    notes: 'Analytical observer focused on mastery, intellectual competence, and clarity.',
  },
  {
    id: 'pers-3',
    system: 'Big Five',
    result: 'High Conscientiousness (91%), High Openness (86%), Low Neuroticism (22%)',
    dateTaken: '2026-07-15',
    notes: 'Strong executive function, intellectual curiosity, high emotional stability.',
  },
];

export function loadPersonality(): PersonalityEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PERSONALITY);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load personality', err);
  }
  savePersonality(INITIAL_PERSONALITY);
  return INITIAL_PERSONALITY;
}

export function savePersonality(entries: PersonalityEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PERSONALITY, JSON.stringify(entries));
  } catch (err) {
    console.error('Failed to save personality', err);
  }
}

// 5. Traits
export const INITIAL_TRAITS: CharacterTrait[] = [
  {
    id: 'trait-1',
    name: 'Deep Focus & Systems Craft',
    kind: 'strength',
    level: 5,
    note: 'Sustained 3+ hour flow states on engineering architecture and UI systems.',
  },
  {
    id: 'trait-2',
    name: 'Minimalist Restraint',
    kind: 'strength',
    level: 4,
    note: 'Zero tolerance for bloat, clutter, or superfluous tools.',
  },
  {
    id: 'trait-3',
    name: 'Kinetic Consistency',
    kind: 'strength',
    level: 4,
    note: 'Committed bodyweight pushup & squat discipline.',
  },
  {
    id: 'trait-4',
    name: 'Circadian Prayer Anchoring',
    kind: 'strength',
    level: 4,
    note: 'Grounding ambition to the five daily prayers.',
  },
  {
    id: 'trait-5',
    name: 'Verbal Articulation in High Stakes',
    kind: 'working_on',
    level: 3,
    note: 'Framing thoughts into punchy, immediate verbal summaries for stakeholders.',
  },
  {
    id: 'trait-6',
    name: 'Thoracic Mobility & Spinal Integrity',
    kind: 'working_on',
    level: 2,
    note: 'Overcoming prolonged desk postures with daily hangs and spinal extension.',
  },
  {
    id: 'trait-7',
    name: 'Asynchronous Delegation',
    kind: 'working_on',
    level: 3,
    note: 'Providing complete architectural specs before delegating tasks.',
  },
];

export function loadTraits(): CharacterTrait[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TRAITS);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load traits', err);
  }
  saveTraits(INITIAL_TRAITS);
  return INITIAL_TRAITS;
}

export function saveTraits(traits: CharacterTrait[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.TRAITS, JSON.stringify(traits));
  } catch (err) {
    console.error('Failed to save traits', err);
  }
}

export function exportSaveFile(): string {
  const data = {
    version: '3.2',
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
    quests: loadQuests(),
    questEvidence: loadQuestEvidence(),
    bodyMeasurements: loadBodyMeasurements(),
    appearance: loadAppearance(),
    colorPalette: loadColorPalette(),
    personality: loadPersonality(),
    traits: loadTraits(),
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
      if (parsed.quests) saveQuests(parsed.quests);
      if (parsed.questEvidence) saveQuestEvidence(parsed.questEvidence);
      if (parsed.bodyMeasurements) saveBodyMeasurements(parsed.bodyMeasurements);
      if (parsed.appearance) saveAppearance(parsed.appearance);
      if (parsed.colorPalette) saveColorPalette(parsed.colorPalette);
      if (parsed.personality) savePersonality(parsed.personality);
      if (parsed.traits) saveTraits(parsed.traits);
      return true;
    }
  } catch (err) {
    console.error('Failed to import backup', err);
  }
  return false;
}
