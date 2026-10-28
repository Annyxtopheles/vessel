import type { AttributeType, XpEvent } from '../types';

/**
 * VESSEL XP ENGINE CONFIGURATION
 * Single source of truth for all character progression, discipline rewards,
 * quest difficulty multipliers, pillar leveling tables, and overall level formulas.
 */

export const XP_DISCIPLINE_REWARDS = {
  // Spiritual (Wisdom)
  SALAH_PRAYER: 50,
  PERFECT_SALAH_DAY_BONUS: 150,

  // Physical (Strength)
  PUSHUP_REP: 2,
  SQUAT_REP: 2,
  FULL_WORKOUT_BONUS: 120,

  // Professional (Intellect)
  DEEP_WORK_PER_MINUTE: 1, // 60 XP per full hour of deep work
  DEEP_WORK_BLOCK_BONUS: 30, // Extra bonus for >90m uninterrupted trance

  // Habits & Disciplines
  HABIT_COMPLETION: 35,

  // Codex Milestones
  PERK_UNLOCKED: 150,
} as const;

export const XP_QUEST_DIFFICULTY = {
  TRIVIAL: 25,
  EASY: 50,
  MEDIUM: 100,
  HARD: 200,
  EPIC: 400,
} as const;

/**
 * Cumulative XP thresholds per pillar level (1 through 15).
 * Calibrated so normal daily use advances pillars harmoniously:
 * - Strength: ~200-250 XP/day
 * - Intellect: ~180-240 XP/day
 * - Wisdom: ~250-300 XP/day
 * - Charisma: ~150-220 XP/day
 */
export const PILLAR_LEVEL_THRESHOLDS: number[] = [
  0,      // Level 1
  250,    // Level 2
  600,    // Level 3
  1100,   // Level 4
  1750,   // Level 5
  2550,   // Level 6
  3500,   // Level 7
  4600,   // Level 8
  5850,   // Level 9
  7250,   // Level 10
  8800,   // Level 11
  10500,  // Level 12
  12350,  // Level 13
  14350,  // Level 14
  16500,  // Level 15
];

/**
 * Cumulative XP thresholds for overall Character Level.
 * Overall level reflects total cumulative XP across all 4 pillars combined.
 */
export const OVERALL_LEVEL_THRESHOLDS: number[] = [
  0,       // Level 1
  800,     // Level 2
  2000,    // Level 3
  3800,    // Level 4
  6200,    // Level 5
  9200,    // Level 6
  12800,   // Level 7
  17000,   // Level 8
  21800,   // Level 9
  27200,   // Level 10
  33200,   // Level 11
  39800,   // Level 12
  47000,   // Level 13
  54800,   // Level 14
  63200,   // Level 15
];

export interface LevelProgress {
  level: number;
  currentXp: number;
  xpInLevel: number;
  xpNeededForNext: number;
  progressPercent: number;
}

/**
 * Calculate level and progress for a single pillar from its cumulative XP.
 */
export function getPillarLevelProgress(xp: number): LevelProgress {
  let level = 1;
  while (level < PILLAR_LEVEL_THRESHOLDS.length && xp >= PILLAR_LEVEL_THRESHOLDS[level]) {
    level++;
  }

  const currentLevelFloor = PILLAR_LEVEL_THRESHOLDS[level - 1] ?? 0;
  const nextLevelCeil = PILLAR_LEVEL_THRESHOLDS[level] ?? (currentLevelFloor + level * 300);
  const xpInLevel = Math.max(0, xp - currentLevelFloor);
  const span = Math.max(1, nextLevelCeil - currentLevelFloor);
  const progressPercent = Math.min(100, Math.round((xpInLevel / span) * 100));

  return {
    level,
    currentXp: xp,
    xpInLevel,
    xpNeededForNext: nextLevelCeil,
    progressPercent,
  };
}

/**
 * Calculate overall character level and progress from total XP across all pillars.
 */
export function getOverallLevelProgress(totalXp: number): LevelProgress {
  let level = 1;
  while (level < OVERALL_LEVEL_THRESHOLDS.length && totalXp >= OVERALL_LEVEL_THRESHOLDS[level]) {
    level++;
  }

  const currentLevelFloor = OVERALL_LEVEL_THRESHOLDS[level - 1] ?? 0;
  const nextLevelCeil = OVERALL_LEVEL_THRESHOLDS[level] ?? (currentLevelFloor + level * 1000);
  const xpInLevel = Math.max(0, totalXp - currentLevelFloor);
  const span = Math.max(1, nextLevelCeil - currentLevelFloor);
  const progressPercent = Math.min(100, Math.round((xpInLevel / span) * 100));

  return {
    level,
    currentXp: totalXp,
    xpInLevel,
    xpNeededForNext: nextLevelCeil,
    progressPercent,
  };
}

/**
 * Derive total XP for a specific pillar from an append-only event log.
 */
export function derivePillarXp(events: XpEvent[], pillar: AttributeType): number {
  return events
    .filter(ev => ev.pillar === pillar)
    .reduce((sum, ev) => sum + (ev.points || 0), 0);
}

/**
 * Derive total XP across all pillars from the append-only event log.
 */
export function deriveTotalXp(events: XpEvent[]): number {
  return events.reduce((sum, ev) => sum + (ev.points || 0), 0);
}
