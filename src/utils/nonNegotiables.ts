import type { DayRecord, CustomHabit, SalahStatus } from '../types';
import { shiftDate } from './date';

export interface NonNegotiableItem {
  id: string;
  type: 'prayer' | 'habit';
  name: string;
  pillar: 'STR' | 'INT' | 'WIS' | 'CHA';
  prayerKey?: keyof SalahStatus;
  habitId?: string;
}

export const ALL_PRAYER_KEYS: (keyof SalahStatus)[] = [
  'fajr',
  'dhuhr',
  'asr',
  'maghrib',
  'isha',
];

export const PRAYER_DISPLAY_NAMES: Record<keyof SalahStatus, string> = {
  fajr: 'Fajr Prayer',
  dhuhr: 'Dhuhr Prayer',
  asr: 'Asr Prayer',
  maghrib: 'Maghrib Prayer',
  isha: 'Isha Prayer',
};

/**
 * Returns the list of active non-negotiable items (prayers and habits).
 */
export function getActiveNonNegotiableItems(
  habits: CustomHabit[],
  nonNegotiablePrayers: (keyof SalahStatus)[] = ALL_PRAYER_KEYS
): NonNegotiableItem[] {
  const items: NonNegotiableItem[] = [];

  // 1. Configured non-negotiable prayers
  for (const pKey of nonNegotiablePrayers) {
    items.push({
      id: `prayer-${pKey}`,
      type: 'prayer',
      name: PRAYER_DISPLAY_NAMES[pKey],
      pillar: 'WIS',
      prayerKey: pKey,
    });
  }

  // 2. Active habits with non_negotiable: true
  const activeHabits = habits.filter((h) => !h.isArchived && h.non_negotiable);
  for (const h of activeHabits) {
    items.push({
      id: `habit-${h.id}`,
      type: 'habit',
      name: h.name,
      pillar: h.attribute,
      habitId: h.id,
    });
  }

  return items;
}

/**
 * Checks whether a given DayRecord satisfies ALL non-negotiables.
 */
export function isDayRecordFullyComplete(
  record: DayRecord | undefined,
  nonNegotiableItems: NonNegotiableItem[]
): boolean {
  if (!record || nonNegotiableItems.length === 0) return false;

  for (const item of nonNegotiableItems) {
    if (item.type === 'prayer' && item.prayerKey) {
      if (!record.salah?.[item.prayerKey]) {
        return false;
      }
    } else if (item.type === 'habit' && item.habitId) {
      if (!record.completedHabitIds?.includes(item.habitId)) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Checks if a specific non-negotiable item is completed on a day.
 */
export function isNonNegotiableItemDone(
  record: DayRecord | undefined,
  item: NonNegotiableItem
): boolean {
  if (!record) return false;
  if (item.type === 'prayer' && item.prayerKey) {
    return !!record.salah?.[item.prayerKey];
  }
  if (item.type === 'habit' && item.habitId) {
    return !!record.completedHabitIds?.includes(item.habitId);
  }
  return false;
}

/**
 * Computes the consecutive streak of days on which every non_negotiable item was completed.
 * Derived directly from the log:
 * - Resets to 0 when a past day was missed.
 * - Always matches the week strip visual indicators.
 */
export function calculateNonNegotiableStreak(
  dayRecords: Record<string, DayRecord>,
  nonNegotiableItems: NonNegotiableItem[],
  todayStr: string
): number {
  if (nonNegotiableItems.length === 0) return 0;

  const todayRecord = dayRecords[todayStr];
  const isTodayComplete = isDayRecordFullyComplete(todayRecord, nonNegotiableItems);

  let streak = 0;
  let checkDate = isTodayComplete ? todayStr : shiftDate(todayStr, -1);

  // If today is incomplete, check yesterday:
  // If yesterday was incomplete, streak is 0 (broken/reset)
  if (!isTodayComplete) {
    const yesterdayRecord = dayRecords[checkDate];
    if (!isDayRecordFullyComplete(yesterdayRecord, nonNegotiableItems)) {
      return 0;
    }
  }

  // Count consecutive days backward
  // Guard max 365 days to prevent any infinite loop
  for (let i = 0; i < 365; i++) {
    const record = dayRecords[checkDate];
    if (isDayRecordFullyComplete(record, nonNegotiableItems)) {
      streak += 1;
      checkDate = shiftDate(checkDate, -1);
    } else {
      break;
    }
  }

  return streak;
}
