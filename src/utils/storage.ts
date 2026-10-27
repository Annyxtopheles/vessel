import type { InventoryItem, CharacterProfile, SkillNode, DayRecord, CustomHabit } from '../types';
import { INITIAL_ITEMS, INITIAL_PROFILE, INITIAL_SKILLS, INITIAL_DAY_RECORDS, INITIAL_HABITS } from '../data/mockData';

const STORAGE_KEYS = {
  ITEMS: 'vessel_inventory_items_v2',
  PROFILE: 'vessel_character_profile_v2',
  SKILLS: 'vessel_skill_tree_v2',
  DAY_RECORDS: 'vessel_day_records_v2',
  HABITS: 'vessel_custom_habits_v2',
};

export function loadItems(): InventoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ITEMS);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load items', err);
  }
  return INITIAL_ITEMS;
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
    if (raw) return JSON.parse(raw);
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

export function exportSaveFile(): string {
  const data = {
    version: '2.0',
    exportedAt: new Date().toISOString(),
    profile: loadProfile(),
    items: loadItems(),
    skills: loadSkills(),
    habits: loadHabits(),
    dayRecords: loadDayRecords(),
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
      return true;
    }
  } catch (err) {
    console.error('Failed to import backup', err);
  }
  return false;
}
