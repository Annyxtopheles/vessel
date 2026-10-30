import type { AttributeType, XpEvent, SkillNode } from '../types';

/**
 * ============================================================================
 * VESSEL XP ENGINE CONFIGURATION
 * ============================================================================
 * Single source of truth for:
 * 1. XP values across disciplines, habits, tasks, and milestones.
 * 2. Daily XP cap per pillar to maintain harmonious balance.
 * 3. Per-level thresholds for individual Pillars (Levels 1 - 15).
 * 4. Overall Character Level formula and thresholds.
 * 5. Event-sourced calculation of totals and streaks.
 * 6. Multi-condition milestone progression engine.
 */

// ----------------------------------------------------------------------------
// 1. XP VALUES
// ----------------------------------------------------------------------------
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

  // Milestones
  MILESTONE_UNLOCKED: 150,
} as const;

export const XP_QUEST_DIFFICULTY = {
  TRIVIAL: 25,
  EASY: 50,
  MEDIUM: 100,
  HARD: 200,
  EPIC: 400,
} as const;

export function getQuestXp(difficulty: 'Easy' | 'Medium' | 'Hard' | 'Trivial' | 'Epic' | string): number {
  switch (difficulty) {
    case 'Trivial': return XP_QUEST_DIFFICULTY.TRIVIAL;
    case 'Easy': return XP_QUEST_DIFFICULTY.EASY;
    case 'Medium': return XP_QUEST_DIFFICULTY.MEDIUM;
    case 'Hard': return XP_QUEST_DIFFICULTY.HARD;
    case 'Epic': return XP_QUEST_DIFFICULTY.EPIC;
    default: return 50;
  }
}

// ----------------------------------------------------------------------------
// 2. DAILY XP CAP PER PILLAR
// ----------------------------------------------------------------------------
/**
 * Daily XP cap per individual pillar.
 * Prevents a single pillar from leveling disproportionately fast through rep spamming or day surges.
 */
export const DAILY_PILLAR_XP_CAP = 300;

// ----------------------------------------------------------------------------
// 3. PER-LEVEL PILLAR THRESHOLDS (LEVELS 1 - 15)
// ----------------------------------------------------------------------------
export interface LevelTier {
  level: number;
  levelXpRequired: number; // XP span needed within this level to advance to next
  cumulativeFloor: number; // Cumulative XP needed to reach this level
  cumulativeCeil: number;  // Cumulative XP needed to reach next level
}

export const PILLAR_LEVEL_TABLE: LevelTier[] = [
  { level: 1,  levelXpRequired: 250,  cumulativeFloor: 0,     cumulativeCeil: 250 },
  { level: 2,  levelXpRequired: 350,  cumulativeFloor: 250,   cumulativeCeil: 600 },
  { level: 3,  levelXpRequired: 500,  cumulativeFloor: 600,   cumulativeCeil: 1100 },
  { level: 4,  levelXpRequired: 650,  cumulativeFloor: 1100,  cumulativeCeil: 1750 },
  { level: 5,  levelXpRequired: 800,  cumulativeFloor: 1750,  cumulativeCeil: 2550 },
  { level: 6,  levelXpRequired: 950,  cumulativeFloor: 2550,  cumulativeCeil: 3500 },
  { level: 7,  levelXpRequired: 1100, cumulativeFloor: 3500,  cumulativeCeil: 4600 },
  { level: 8,  levelXpRequired: 1250, cumulativeFloor: 4600,  cumulativeCeil: 5850 },
  { level: 9,  levelXpRequired: 1400, cumulativeFloor: 5850,  cumulativeCeil: 7250 },
  { level: 10, levelXpRequired: 1550, cumulativeFloor: 7250,  cumulativeCeil: 8800 },
  { level: 11, levelXpRequired: 1700, cumulativeFloor: 8800,  cumulativeCeil: 10500 },
  { level: 12, levelXpRequired: 1850, cumulativeFloor: 10500, cumulativeCeil: 12350 },
  { level: 13, levelXpRequired: 2000, cumulativeFloor: 12350, cumulativeCeil: 14350 },
  { level: 14, levelXpRequired: 2150, cumulativeFloor: 14350, cumulativeCeil: 16500 },
  { level: 15, levelXpRequired: 2300, cumulativeFloor: 16500, cumulativeCeil: 18800 },
];

export const PILLAR_LEVEL_THRESHOLDS: number[] = PILLAR_LEVEL_TABLE.map((t) => t.cumulativeFloor);

// ----------------------------------------------------------------------------
// 4. OVERALL CHARACTER LEVEL TABLE (LEVELS 1 - 15)
// ----------------------------------------------------------------------------
export const OVERALL_LEVEL_TABLE: LevelTier[] = [
  { level: 1,  levelXpRequired: 800,  cumulativeFloor: 0,     cumulativeCeil: 800 },
  { level: 2,  levelXpRequired: 1200, cumulativeFloor: 800,   cumulativeCeil: 2000 },
  { level: 3,  levelXpRequired: 1800, cumulativeFloor: 2000,  cumulativeCeil: 3800 },
  { level: 4,  levelXpRequired: 2400, cumulativeFloor: 3800,  cumulativeCeil: 6200 },
  { level: 5,  levelXpRequired: 3000, cumulativeFloor: 6200,  cumulativeCeil: 9200 },
  { level: 6,  levelXpRequired: 3600, cumulativeFloor: 9200,  cumulativeCeil: 12800 },
  { level: 7,  levelXpRequired: 4200, cumulativeFloor: 12800, cumulativeCeil: 17000 },
  { level: 8,  levelXpRequired: 4800, cumulativeFloor: 17000, cumulativeCeil: 21800 },
  { level: 9,  levelXpRequired: 5400, cumulativeFloor: 21800, cumulativeCeil: 27200 },
  { level: 10, levelXpRequired: 6000, cumulativeFloor: 27200, cumulativeCeil: 33200 },
  { level: 11, levelXpRequired: 6600, cumulativeFloor: 33200, cumulativeCeil: 39800 },
  { level: 12, levelXpRequired: 7200, cumulativeFloor: 39800, cumulativeCeil: 47000 },
  { level: 13, levelXpRequired: 7800, cumulativeFloor: 47000, cumulativeCeil: 54800 },
  { level: 14, levelXpRequired: 8400, cumulativeFloor: 54800, cumulativeCeil: 63200 },
  { level: 15, levelXpRequired: 9000, cumulativeFloor: 63200, cumulativeCeil: 72200 },
];

export const OVERALL_LEVEL_THRESHOLDS: number[] = OVERALL_LEVEL_TABLE.map((t) => t.cumulativeFloor);

// ----------------------------------------------------------------------------
// 5. PROGRESS STRUCTS & FUNCTIONS
// ----------------------------------------------------------------------------
export interface LevelProgress {
  level: number;
  currentXp: number;        // Total cumulative capped XP
  xpInLevel: number;        // XP accumulated within current level (e.g. 135)
  xpNeededForLevel: number; // XP span needed for this level (e.g. 1100)
  xpNeededForNext: number;  // Total XP needed to reach next level (cumulative ceiling)
  nextLevel: number;        // Next level number (e.g. 8)
  progressPercent: number;  // (xpInLevel / xpNeededForLevel) * 100
  displayText: string;      // "135 / 1,100 to Level 8"
}

/**
 * Calculates level progress for an individual pillar.
 * Guarantees that progress bar width matches the text ("135 / 1,100 to Level 8").
 */
export function getPillarLevelProgress(xp: number): LevelProgress {
  let tier = PILLAR_LEVEL_TABLE[0];
  for (const t of PILLAR_LEVEL_TABLE) {
    if (xp >= t.cumulativeFloor) {
      tier = t;
    } else {
      break;
    }
  }

  const isMaxLevel = tier.level >= PILLAR_LEVEL_TABLE.length;
  const xpInLevel = Math.max(0, xp - tier.cumulativeFloor);
  const span = isMaxLevel ? 1 : tier.levelXpRequired;
  const progressPercent = isMaxLevel ? 100 : Math.min(100, Math.round((xpInLevel / span) * 100));

  const displayText = isMaxLevel
    ? `${xp.toLocaleString()} XP (Max Level ${tier.level})`
    : `${xpInLevel.toLocaleString()} / ${span.toLocaleString()} to Level ${tier.level + 1}`;

  return {
    level: tier.level,
    currentXp: xp,
    xpInLevel,
    xpNeededForLevel: span,
    xpNeededForNext: tier.cumulativeCeil,
    nextLevel: tier.level + 1,
    progressPercent,
    displayText,
  };
}

/**
 * Calculates overall character level and progress from total capped XP.
 */
export function getOverallLevelProgress(totalXp: number): LevelProgress {
  let tier = OVERALL_LEVEL_TABLE[0];
  for (const t of OVERALL_LEVEL_TABLE) {
    if (totalXp >= t.cumulativeFloor) {
      tier = t;
    } else {
      break;
    }
  }

  const isMaxLevel = tier.level >= OVERALL_LEVEL_TABLE.length;
  const xpInLevel = Math.max(0, totalXp - tier.cumulativeFloor);
  const span = isMaxLevel ? 1 : tier.levelXpRequired;
  const progressPercent = isMaxLevel ? 100 : Math.min(100, Math.round((xpInLevel / span) * 100));

  const displayText = isMaxLevel
    ? `${totalXp.toLocaleString()} XP (Max Level ${tier.level})`
    : `${xpInLevel.toLocaleString()} / ${span.toLocaleString()} to Level ${tier.level + 1}`;

  return {
    level: tier.level,
    currentXp: totalXp,
    xpInLevel,
    xpNeededForLevel: span,
    xpNeededForNext: tier.cumulativeCeil,
    nextLevel: tier.level + 1,
    progressPercent,
    displayText,
  };
}

// ----------------------------------------------------------------------------
// 6. EVENT-SOURCED XP DERIVATION WITH DAILY PILLAR CAP
// ----------------------------------------------------------------------------
/**
 * Derives cumulative XP for a specific pillar from the event log,
 * strictly enforcing the daily XP cap per pillar.
 */
export function derivePillarXp(events: XpEvent[], pillar: AttributeType): number {
  const pillarEvents = events.filter((ev) => ev.pillar === pillar);

  // Group by date (YYYY-MM-DD)
  const byDate: Record<string, number> = {};
  for (const ev of pillarEvents) {
    const d = ev.date || 'legacy';
    byDate[d] = (byDate[d] || 0) + (ev.points || 0);
  }

  // Apply daily cap per pillar
  let total = 0;
  for (const date in byDate) {
    const dailyPoints = byDate[date];
    if (dailyPoints <= 0) {
      total += dailyPoints; // allow negative adjustments (e.g. task reopen)
    } else {
      total += Math.min(dailyPoints, DAILY_PILLAR_XP_CAP);
    }
  }

  return Math.max(0, total);
}

/**
 * Derives total character XP across all pillars combined.
 */
export function deriveTotalXp(events: XpEvent[]): number {
  const pillars: AttributeType[] = ['STR', 'INT', 'WIS', 'CHA'];
  return pillars.reduce((sum, p) => sum + derivePillarXp(events, p), 0);
}

// ----------------------------------------------------------------------------
// 7. EVENT-SOURCED TOTALS & STREAKS
// ----------------------------------------------------------------------------
export interface EventLogTotalsAndStreaks {
  totalPushups: number;
  totalSquats: number;
  totalWorkouts: number;
  movementStreak: number;
  totalDeepWorkMinutes: number;
  totalDeepWorkHours: number;
  salahStreak: number;
  perfectSalahDays: number;
}

/**
 * Computes streaks and cumulative totals strictly derived from the XP event log.
 */
export function computeTotalsAndStreaksFromXpEvents(events: XpEvent[]): EventLogTotalsAndStreaks {
  let totalPushups = 0;
  let totalSquats = 0;
  let totalDeepWorkMinutes = 0;

  const movementDates = new Set<string>();
  const workoutDates = new Set<string>();
  const salahDates = new Set<string>();
  const salahCountsByDate: Record<string, number> = {};

  for (const ev of events) {
    const actionLower = (ev.action || '').toLowerCase();
    const date = ev.date;

    // Pushups
    if (ev.pillar === 'STR' && actionLower.includes('pushup')) {
      const match = actionLower.match(/([+-]?\d+)\s*reps/);
      if (match) {
        totalPushups += parseInt(match[1], 10);
      } else if (ev.points !== 0) {
        totalPushups += Math.round(ev.points / XP_DISCIPLINE_REWARDS.PUSHUP_REP);
      }
      if (date && ev.points > 0) movementDates.add(date);
    }

    // Squats
    if (ev.pillar === 'STR' && actionLower.includes('squat')) {
      const match = actionLower.match(/([+-]?\d+)\s*reps/);
      if (match) {
        totalSquats += parseInt(match[1], 10);
      } else if (ev.points !== 0) {
        totalSquats += Math.round(ev.points / XP_DISCIPLINE_REWARDS.SQUAT_REP);
      }
      if (date && ev.points > 0) movementDates.add(date);
    }

    // Full Workouts
    if (ev.pillar === 'STR' && (actionLower.includes('workout') || actionLower.includes('full workout'))) {
      if (date && ev.points > 0) {
        workoutDates.add(date);
        movementDates.add(date);
      }
    }

    // Deep Work
    if (ev.pillar === 'INT' && actionLower.includes('deep work')) {
      const match = actionLower.match(/([+-]?\d+)m/);
      if (match) {
        totalDeepWorkMinutes += parseInt(match[1], 10);
      } else if (ev.points !== 0) {
        totalDeepWorkMinutes += Math.round(ev.points / XP_DISCIPLINE_REWARDS.DEEP_WORK_PER_MINUTE);
      }
    }

    // Salah Prayers
    if (ev.pillar === 'WIS' && actionLower.includes('salah')) {
      if (date) {
        if (ev.points > 0) {
          salahDates.add(date);
          if (actionLower.includes('5 daily')) {
            salahCountsByDate[date] = 5;
          } else if (!actionLower.includes('perfect')) {
            salahCountsByDate[date] = (salahCountsByDate[date] || 0) + 1;
          }
        } else if (ev.points < 0 && !actionLower.includes('perfect')) {
          salahCountsByDate[date] = Math.max(0, (salahCountsByDate[date] || 0) - 1);
        }
      }
    }
  }

  totalPushups = Math.max(0, totalPushups);
  totalSquats = Math.max(0, totalSquats);
  totalDeepWorkMinutes = Math.max(0, totalDeepWorkMinutes);

  // Calculate Movement Streak (consecutive days with STR activity up to latest recorded date)
  const movementStreak = calculateConsecutiveDaysStreak(Array.from(movementDates));

  // Calculate Salah Streak (consecutive days with 5 prayers up to latest recorded date)
  const perfectSalahDates = Object.entries(salahCountsByDate)
    .filter((entry) => entry[1] >= 5)
    .map(([d]) => d);
  const salahStreak = calculateConsecutiveDaysStreak(perfectSalahDates);

  return {
    totalPushups,
    totalSquats,
    totalWorkouts: workoutDates.size,
    movementStreak,
    totalDeepWorkMinutes,
    totalDeepWorkHours: Math.round((totalDeepWorkMinutes / 60) * 10) / 10,
    salahStreak,
    perfectSalahDays: perfectSalahDates.length,
  };
}

function calculateConsecutiveDaysStreak(dateStrings: string[]): number {
  if (dateStrings.length === 0) return 0;

  const sorted = Array.from(new Set(dateStrings)).sort().reverse();
  const today = new Date().toISOString().split('T')[0];

  // If latest activity is older than yesterday, streak is broken
  const latest = sorted[0];
  const diffDaysFromToday = getDaysDifference(latest, today);
  if (diffDaysFromToday > 1) {
    return 0;
  }

  let streak = 0;
  let cursor = latest;

  for (const d of sorted) {
    if (d === cursor) {
      streak++;
      cursor = getPreviousDay(cursor);
    } else if (d < cursor) {
      break;
    }
  }

  return streak;
}

function getDaysDifference(d1: string, d2: string): number {
  const ms1 = new Date(d1).getTime();
  const ms2 = new Date(d2).getTime();
  return Math.abs(Math.round((ms2 - ms1) / (1000 * 60 * 60 * 24)));
}

function getPreviousDay(dStr: string): string {
  const d = new Date(dStr);
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

// ----------------------------------------------------------------------------
// 8. MULTI-CONDITION MILESTONE ENGINE
// ----------------------------------------------------------------------------
export interface MilestoneCondition {
  id: string;
  label: string;
  current: number;
  target: number;
  unit: string;
  isMet: boolean;
  progressPercent: number;
}

export interface MilestoneProgressResult {
  hasDataSource: boolean;
  conditions: MilestoneCondition[];
  isMet: boolean; // TRUE only if ALL conditions are met
  overallPercent: number;
  statusLabel: string;
}

/**
 * Computes live condition progress for any milestone.
 * Tiers with multiple conditions show each condition in its own progress row,
 * and only become attained when ALL conditions are met.
 */
export function computeMilestoneProgress(
  skill: SkillNode,
  events: XpEvent[]
): MilestoneProgressResult {
  const totals = computeTotalsAndStreaksFromXpEvents(events);

  // Skill STR-1: Kinetic Foundation (100 pushups)
  if (skill.id === 'skill-str-1') {
    const cur = totals.totalPushups;
    const tgt = 100;
    const pct = Math.min(100, Math.round((cur / tgt) * 100));
    const met = cur >= tgt;
    return {
      hasDataSource: true,
      conditions: [
        { id: 'pushups', label: 'Pushup volume', current: cur, target: tgt, unit: 'reps', isMet: met, progressPercent: pct },
      ],
      isMet: met,
      overallPercent: pct,
      statusLabel: met ? 'Requirement Fulfilled' : `${cur} / ${tgt} pushups`,
    };
  }

  // Skill STR-2: Iron Core & Posture (5 workout sessions)
  if (skill.id === 'skill-str-2') {
    const cur = totals.totalWorkouts;
    const tgt = 5;
    const pct = Math.min(100, Math.round((cur / tgt) * 100));
    const met = cur >= tgt;
    return {
      hasDataSource: true,
      conditions: [
        { id: 'workouts', label: 'Workout sessions', current: cur, target: tgt, unit: 'sessions', isMet: met, progressPercent: pct },
      ],
      isMet: met,
      overallPercent: pct,
      statusLabel: met ? 'Requirement Fulfilled' : `${cur} / ${tgt} sessions`,
    };
  }

  // Skill STR-3: Primal Endurance (MULTI-CONDITION: 1,000 pushups AND 30-day movement streak)
  if (skill.id === 'skill-str-3') {
    const curPushups = totals.totalPushups;
    const tgtPushups = 1000;
    const pctPushups = Math.min(100, Math.round((curPushups / tgtPushups) * 100));
    const metPushups = curPushups >= tgtPushups;

    const curStreak = totals.movementStreak;
    const tgtStreak = 30;
    const pctStreak = Math.min(100, Math.round((curStreak / tgtStreak) * 100));
    const metStreak = curStreak >= tgtStreak;

    const allMet = metPushups && metStreak;
    const overallPct = Math.min(pctPushups, pctStreak);

    return {
      hasDataSource: true,
      conditions: [
        { id: 'pushups', label: 'Pushup volume', current: curPushups, target: tgtPushups, unit: 'reps', isMet: metPushups, progressPercent: pctPushups },
        { id: 'streak', label: 'Movement streak', current: curStreak, target: tgtStreak, unit: 'days', isMet: metStreak, progressPercent: pctStreak },
      ],
      isMet: allMet,
      overallPercent: overallPct,
      statusLabel: allMet ? 'All Requirements Met' : `${metPushups ? '1' : '0'}/2 conditions met`,
    };
  }

  // Skill INT-2: Deep Work Trance (50 logged hours of deep work)
  if (skill.id === 'skill-int-2') {
    const cur = totals.totalDeepWorkHours;
    const tgt = 50.0;
    const pct = Math.min(100, Math.round((cur / tgt) * 100));
    const met = cur >= tgt;
    return {
      hasDataSource: true,
      conditions: [
        { id: 'deepwork', label: 'Deep work focus', current: cur, target: tgt, unit: 'hrs', isMet: met, progressPercent: pct },
      ],
      isMet: met,
      overallPercent: pct,
      statusLabel: met ? 'Requirement Fulfilled' : `${cur} / ${tgt} hrs`,
    };
  }

  // Skill WIS-1: Five Pillars Cadence (7-day unbroken prayer streak)
  if (skill.id === 'skill-wis-1') {
    const cur = totals.salahStreak;
    const tgt = 7;
    const pct = Math.min(100, Math.round((cur / tgt) * 100));
    const met = cur >= tgt;
    return {
      hasDataSource: true,
      conditions: [
        { id: 'salah_streak', label: 'Salah prayer streak', current: cur, target: tgt, unit: 'days', isMet: met, progressPercent: pct },
      ],
      isMet: met,
      overallPercent: pct,
      statusLabel: met ? 'Requirement Fulfilled' : `${cur} / ${tgt} days`,
    };
  }

  // MANUAL MILESTONES (No automated data source -> requires evidence note or attachment)
  const isManuallyUnlocked = skill.unlocked;
  return {
    hasDataSource: false,
    conditions: [],
    isMet: isManuallyUnlocked,
    overallPercent: isManuallyUnlocked ? 100 : 0,
    statusLabel: isManuallyUnlocked ? 'Verified with Evidence' : 'Requires Evidence Submission',
  };
}
