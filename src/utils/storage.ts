import type { InventoryItem, CharacterProfile, SkillNode, DailyLog } from '../types';
import { INITIAL_ITEMS, INITIAL_PROFILE, INITIAL_SKILLS, INITIAL_DAILY_LOG } from '../data/mockData';

const STORAGE_KEYS = {
  ITEMS: 'vessel_inventory_items_v1',
  PROFILE: 'vessel_character_profile_v1',
  SKILLS: 'vessel_skill_tree_v1',
  DAILY: 'vessel_daily_log_v1',
};

export function loadItems(): InventoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ITEMS);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load items from storage', err);
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

export function loadDailyLog(): DailyLog {
  const today = new Date().toISOString().split('T')[0];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DAILY);
    if (raw) {
      const parsed: DailyLog = JSON.parse(raw);
      if (parsed.date === today) {
        return parsed;
      }
      // If new day, return fresh day template with rollover
      return {
        ...INITIAL_DAILY_LOG,
        date: today,
        salah: { fajr: false, dhuhr: false, asr: false, maghrib: false, isha: false },
        pushups: 0,
        squats: 0,
        workoutCompleted: false,
        deepWorkMinutes: 0,
        projectShippedNotes: '',
        surahStudyNotes: '',
        mentorshipNotes: '',
      };
    }
  } catch (err) {
    console.error('Failed to load daily log', err);
  }
  return { ...INITIAL_DAILY_LOG, date: today };
}

export function saveDailyLog(log: DailyLog): void {
  try {
    localStorage.setItem(STORAGE_KEYS.DAILY, JSON.stringify(log));
  } catch (err) {
    console.error('Failed to save daily log', err);
  }
}

export function exportSaveFile(): string {
  const data = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    profile: loadProfile(),
    items: loadItems(),
    skills: loadSkills(),
    daily: loadDailyLog(),
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
      if (parsed.daily) saveDailyLog(parsed.daily);
      return true;
    }
  } catch (err) {
    console.error('Failed to import backup', err);
  }
  return false;
}
