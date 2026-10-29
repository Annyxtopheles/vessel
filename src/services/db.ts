import Dexie, { type Table } from 'dexie';
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
} from '../types';

export interface KeyValRecord {
  key: string;
  value: any;
}

export class VesselDatabase extends Dexie {
  items!: Table<InventoryItem, string>;
  photos!: Table<PhotoRecord, string>;
  quests!: Table<Quest, string>;
  questEvidence!: Table<QuestEvidence, string>;
  habits!: Table<CustomHabit, string>;
  dayRecords!: Table<DayRecord, string>;
  wearEvents!: Table<WearEvent, string>;
  xpEvents!: Table<XpEvent, string>;
  skills!: Table<SkillNode, string>;
  measurements!: Table<BodyMeasurement, string>;
  appearance!: Table<CharacterAppearance, string>;
  palette!: Table<PaletteColor, string>;
  personality!: Table<PersonalityEntry, string>;
  traits!: Table<CharacterTrait, string>;
  settings!: Table<AppSettings, string>;
  profile!: Table<CharacterProfile, string>;
  keyval!: Table<KeyValRecord, string>;

  constructor() {
    super('vessel_local_first_db');
    this.version(1).stores({
      items: 'id, external_id, category, ownershipStatus, deleted_at, updated_at',
      photos: 'id, itemId, deleted_at, updated_at',
      quests: 'id, status, pillar, deleted_at, updated_at',
      questEvidence: 'id, questId, deleted_at, updated_at',
      habits: 'id, deleted_at, updated_at',
      dayRecords: 'id, date, deleted_at, updated_at',
      wearEvents: 'id, itemId, date, deleted_at, updated_at',
      xpEvents: 'id, pillar, date, deleted_at, updated_at',
      skills: 'id, attribute, deleted_at, updated_at',
      measurements: 'id, type, date, deleted_at, updated_at',
      appearance: 'id, deleted_at, updated_at',
      palette: 'id, verdict, deleted_at, updated_at',
      personality: 'id, dateTaken, deleted_at, updated_at',
      traits: 'id, kind, deleted_at, updated_at',
      settings: 'id, deleted_at, updated_at',
      profile: 'id, deleted_at, updated_at',
      keyval: 'key',
    });
  }
}

export const db = new VesselDatabase();
