export type AttributeType = 'STR' | 'INT' | 'WIS' | 'CHA';

export const ATTRIBUTE_NAMES: Record<AttributeType, string> = {
  STR: 'Strength',
  INT: 'Intellect',
  WIS: 'Wisdom',
  CHA: 'Charisma',
};

export type ItemCategory = 'apparel' | 'tech' | 'tomes' | 'edc';

export type OwnershipStatus = 'owned' | 'wishlist' | 'past';

export type PastReason = 'sold' | 'gifted' | 'donated' | 'retired' | 'lost';

export type EquipSlot = 
  | 'head'
  | 'outerwear'
  | 'innerwear'
  | 'legs'
  | 'footwear'
  | 'wrist_edc'
  | 'tech_relic'
  | 'tome';

export type ItemRarity = 'common' | 'rare' | 'epic' | 'masterwork' | 'legendary';

export type ItemCondition = 'pristine' | 'seasoned' | 'worn' | 'needs_repair';

export type ItemSeason = 'all' | 'summer' | 'winter' | 'transitional';

export interface ItemBuff {
  stat: 'STR' | 'INT' | 'WIS' | 'CHA' | 'FOCUS' | 'COMFORT' | 'WARMTH' | 'STYLE';
  value: number;
  label: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: ItemCategory;
  subCategory: string;
  ownershipStatus: OwnershipStatus; // 'owned' | 'wishlist' | 'past'
  pastReason?: PastReason; // If used to own
  pastDate?: string;
  equipSlot?: EquipSlot;
  rarity: ItemRarity;
  colorName: string;
  colorHex: string;
  condition: ItemCondition;
  season: ItemSeason;
  weightKg: number;
  goldValue: number; // Purchase price / current value
  targetPrice?: number; // Target price for wishlist items
  location?: string; // e.g. Closet, Desk, Travel Pack, Storage
  carried?: boolean; // Whether actively carried on person/pack
  lockRequirement?: string; // If wishlist
  buffs: ItemBuff[];
  lore: string;
  isEquipped?: boolean;
  dateAcquired?: string;
  imageUrl?: string;
  isLocked?: boolean;
}

export interface WearEvent {
  id: string;
  itemId: string;
  type: 'worn';
  date: string; // ISO or YYYY-MM-DD
}

export interface SavedLoadout {
  id: string;
  name: string;
  equippedItemIds: string[];
  createdAt: string;
}

export interface XpEvent {
  id: string;
  action: string;
  pillar: AttributeType;
  points: number;
  date: string; // YYYY-MM-DD
  refId?: string;
  note?: string;
}

export interface AppSettings {
  currencySymbol: string;
  maxEncumbranceKg: number;
}

export interface SalahStatus {
  fajr: boolean;
  dhuhr: boolean;
  asr: boolean;
  maghrib: boolean;
  isha: boolean;
}

export interface CustomHabit {
  id: string;
  name: string;
  attribute: AttributeType;
  description?: string;
}

export interface DayRecord {
  date: string; // YYYY-MM-DD
  salah: SalahStatus;
  pushups: number;
  squats: number;
  workoutCompleted: boolean;
  deepWorkMinutes: number;
  completedHabitIds: string[];
  notes?: string;
}

export interface SkillNode {
  id: string;
  attribute: AttributeType;
  title: string;
  description: string;
  tier: 1 | 2 | 3;
  unlocked: boolean;
  requirement: string;
  bonus: string;
  progressPercent: number;
  dataSource?: 'pushups' | 'workouts' | 'deepwork' | 'salah' | 'salah_streak' | 'habits_cha' | 'manual';
  evidenceNote?: string;
  evidenceUrl?: string;
  unlockedAt?: string;
}

export interface CharacterProfile {
  name: string;
  title: string;
  level: number;
  currentXp: number;
  xpToNextLevel: number;
  attributes: {
    STR: { level: number; xp: number; title: string };
    INT: { level: number; xp: number; title: string };
    WIS: { level: number; xp: number; title: string };
    CHA: { level: number; xp: number; title: string };
  };
  maxEncumbranceKg: number;
  streaks: {
    salahStreak: number;
    workoutStreak: number;
    craftStreak: number;
  };
}
