export type AttributeType = 'STR' | 'INT' | 'WIS' | 'CHA';

export type ItemCategory = 'apparel' | 'tech' | 'tomes' | 'edc';

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
  equipSlot?: EquipSlot;
  rarity: ItemRarity;
  colorName: string;
  colorHex: string;
  condition: ItemCondition;
  season: ItemSeason;
  weightKg: number;
  goldValue: number; // Value in currency/gold
  isLocked: boolean; // Wishlist / Locked Loot
  lockRequirement?: string; // Goal needed to unlock
  buffs: ItemBuff[];
  lore: string;
  isEquipped?: boolean;
  imageUri?: string;
  dateAcquired?: string;
  quantity?: number;
}

export interface SalahStatus {
  fajr: boolean;
  dhuhr: boolean;
  asr: boolean;
  maghrib: boolean;
  isha: boolean;
}

export interface DailyLog {
  date: string; // YYYY-MM-DD
  salah: SalahStatus;
  pushups: number;
  squats: number;
  workoutCompleted: boolean;
  deepWorkMinutes: number;
  projectShippedNotes?: string;
  surahStudyNotes?: string;
  mentorshipNotes?: string;
}

export interface SkillNode {
  id: string;
  attribute: AttributeType;
  title: string;
  description: string;
  tier: 1 | 2 | 3;
  iconName: string;
  unlocked: boolean;
  requirement: string;
  bonus: string;
  progressPercent: number;
}

export interface CharacterProfile {
  name: string;
  title: string;
  avatarUrl?: string;
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
  equippedSlots: Partial<Record<EquipSlot, string>>; // slot -> itemId
  streaks: {
    salahStreak: number;
    workoutStreak: number;
    craftStreak: number;
  };
}
