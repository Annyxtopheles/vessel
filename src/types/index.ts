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
  goldValue: number;
  lockRequirement?: string; // If wishlist
  buffs: ItemBuff[];
  lore: string;
  isEquipped?: boolean;
  dateAcquired?: string;
  imageUrl?: string;
  // Backward compatibility helper
  isLocked?: boolean;
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
