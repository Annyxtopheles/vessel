export type AttributeType = 'STR' | 'INT' | 'WIS' | 'CHA';

export const ATTRIBUTE_NAMES: Record<AttributeType, string> = {
  STR: 'Strength',
  INT: 'Intellect',
  WIS: 'Wisdom',
  CHA: 'Charisma',
};

export interface BaseEntity {
  id?: string; // uuid
  created_at?: string; // ISO 8601
  updated_at?: string; // ISO 8601
  deleted_at?: string | null;
  revision?: number; // starts at 1, increments on update
}

export type ItemCategory = 'apparel' | 'tech' | 'tomes' | 'edc';

export type OwnershipStatus = 'owned' | 'wishlist' | 'past';

export type PastReason = 'sold' | 'gifted' | 'donated' | 'retired' | 'lost';

export type ItemRarity = 'common' | 'rare' | 'epic' | 'masterwork' | 'legendary';

export type ItemCondition = 'pristine' | 'seasoned' | 'worn' | 'needs_repair';

export type ItemSeason = 'all' | 'summer' | 'winter' | 'transitional';

export interface ItemColorEntry {
  name: string;
  hex: string;
}

export interface InventoryItem extends BaseEntity {
  id: string;
  name: string;
  category: ItemCategory;
  subCategory: string;
  ownershipStatus: OwnershipStatus; // 'owned' | 'wishlist' | 'past'
  pastReason?: PastReason; // If used to own
  pastDate?: string;
  rarity: ItemRarity;
  colorName: string;
  colorHex: string;
  colors?: ItemColorEntry[];
  condition: ItemCondition;
  season: ItemSeason;
  goldValue: number; // Purchase price / current value
  targetPrice?: number; // Target price for wishlist items
  location?: string; // e.g. Closet, Desk, Travel Pack, Storage
  lockRequirement?: string; // If wishlist
  lore: string;
  dateAcquired?: string;
  imageUrl?: string;
  isLocked?: boolean;
  // Import & sync schema enhancements
  external_id?: string;
  brand?: string;
  quantity?: number;
  size?: string;
  price_paid?: number;
  current_value?: number;
  acquired_date?: string;
  left_date?: string;
  left_reason?: PastReason | string;
  notes?: string;
  tags?: string[];
  photoId?: string;
  photo?: string;
}

export interface PhotoRecord extends BaseEntity {
  id: string;
  itemId?: string;
  fullBlob: Blob;
  thumbBlob: Blob;
  mimeType: string;
  width: number;
  height: number;
  fileName?: string;
}

export interface WearEvent extends BaseEntity {
  id: string;
  itemId: string;
  type: 'worn';
  date: string; // ISO or YYYY-MM-DD
}

export interface XpEvent extends BaseEntity {
  id: string;
  action: string;
  pillar: AttributeType;
  points: number;
  date: string; // YYYY-MM-DD
  refId?: string;
  note?: string;
}

export type NumberGroupingOption = 'bangladeshi' | 'international';

export interface AppSettings extends BaseEntity {
  id?: string;
  currencySymbol: string;
  numberGrouping?: NumberGroupingOption;
  unitSystem?: 'metric' | 'imperial';
  targetWeightKg?: number;
  privacyMode?: boolean;
  lastBackupAt?: string;
  autoBackupEnabled?: boolean;
  autoBackupFolderName?: string;
  nonNegotiablePrayers?: (keyof SalahStatus)[];
}

export interface SalahStatus {
  fajr: boolean;
  dhuhr: boolean;
  asr: boolean;
  maghrib: boolean;
  isha: boolean;
}

export interface CustomHabit extends BaseEntity {
  id: string;
  name: string;
  attribute: AttributeType;
  description?: string;
  non_negotiable?: boolean;
  isArchived?: boolean;
  archivedAt?: string;
}

export interface DayRecord extends BaseEntity {
  id?: string;
  date: string; // YYYY-MM-DD
  salah: SalahStatus;
  pushups: number;
  squats: number;
  workoutCompleted: boolean;
  deepWorkMinutes: number;
  completedHabitIds: string[];
  notes?: string;
}

export interface SkillNode extends BaseEntity {
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

export interface CharacterProfile extends BaseEntity {
  id?: string;
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
  streaks: {
    salahStreak: number;
    workoutStreak: number;
    craftStreak: number;
  };
}

export type QuestStatus = 'todo' | 'doing' | 'done';
export type QuestDifficulty = 'Easy' | 'Medium' | 'Hard';

export interface Quest extends BaseEntity {
  id: string;
  title: string;
  description: string;
  status: QuestStatus;
  pillar: AttributeType;
  difficulty: QuestDifficulty;
  dueDate?: string; // YYYY-MM-DD
  evidenceRequired: boolean;
  linkedItemId?: string;
  bucketEntryId?: string;
  createdAt?: string; // Legacy compatibility
  completedAt?: string;
  deletedAt?: string; // soft delete compatibility
}

export type EvidenceType = 'photo' | 'link' | 'note' | 'file';

export interface QuestEvidence extends BaseEntity {
  id: string;
  questId: string;
  type: EvidenceType;
  content: string;
  addedAt?: string;
}

// STAT SHEET TYPES
export type MeasurementType = 'weight' | 'height' | 'waist' | 'chest' | 'custom';

export interface BodyMeasurement extends BaseEntity {
  id: string;
  type: MeasurementType;
  customLabel?: string;
  value: number;
  unit: string;
  date: string; // YYYY-MM-DD
  note?: string;
  deletedAt?: string;
}

export interface CharacterAppearance extends BaseEntity {
  skinToneHex: string;
  skinToneNote?: string;
  hair: string;
  eyeColor: string;
  photoUrl?: string;
  updatedAt?: string;
}

export type PaletteVerdict = 'suits' | 'neutral' | 'avoid';

export interface PaletteColor extends BaseEntity {
  id: string;
  colorHex: string;
  label: string;
  verdict: PaletteVerdict;
  note?: string;
  deletedAt?: string;
}

export interface PersonalityEntry extends BaseEntity {
  id: string;
  system: string;
  result: string;
  dateTaken: string; // YYYY-MM-DD
  source?: string;
  notes?: string;
  deletedAt?: string;
}

export type TraitKind = 'strength' | 'working_on';

export interface CharacterTrait extends BaseEntity {
  id: string;
  name: string;
  kind: TraitKind;
  level: number; // 1 - 5
  note?: string;
  deletedAt?: string;
}

// REMINDERS & PRINCIPLES
export interface Reminder extends BaseEntity {
  id: string;
  text: string;
  order: number;
  pinned: boolean;
}

// BUCKET LIST
export type BucketListStatus = 'someday' | 'planned' | 'done';

export interface BucketListEntry extends BaseEntity {
  id: string;
  title: string;
  category: string;
  notes?: string;
  status: BucketListStatus;
  created_at?: string;
  done_at?: string;
  evidence?: string;
  pillar?: AttributeType;
  promotedTaskId?: string;
}
