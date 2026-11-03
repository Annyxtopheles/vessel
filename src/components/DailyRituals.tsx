import React from 'react';
import type { DayRecord, SalahStatus, CustomHabit, AttributeType, XpEvent, Quest, Reminder } from '../types';
import { Check, RotateCcw, AlertCircle, ChevronRight } from 'lucide-react';
import { sfx } from '../utils/audio';
import { getTodayLocalDateStr, getRelativeDayStrip } from '../utils/date';
import { XP_DISCIPLINE_REWARDS, getQuestXp } from '../data/xpConfig';
import { RemindersBlock } from './RemindersBlock';
import {
  getActiveNonNegotiableItems,
  isDayRecordFullyComplete,
  calculateNonNegotiableStreak,
  ALL_PRAYER_KEYS,
} from '../utils/nonNegotiables';

interface DailyRitualsProps {
  dayRecords: Record<string, DayRecord>;
  habits: CustomHabit[];
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  onUpdateDayRecord: (record: DayRecord, xpGained?: { attr: 'STR' | 'INT' | 'WIS' | 'CHA'; xp: number }) => void;
  onAddHabit?: (habit: CustomHabit) => void;
  onUpdateHabit?: (habit: CustomHabit) => void;
  onDeleteHabit?: (habitId: string) => void;
  onRestoreHabit?: (habitId: string) => void;
  onPermanentDeleteHabit?: (habitId: string) => void;
  onRecordXpEvent?: (event: Omit<XpEvent, 'id'>) => void;
  quests?: Quest[];
  onNavigateToQuests?: () => void;
  onCompleteQuest?: (quest: Quest) => void;
  nonNegotiablePrayers?: (keyof SalahStatus)[];
  onTogglePrayerNonNegotiable?: (prayerKey: keyof SalahStatus) => void;
  reminders?: Reminder[];
  onAddReminder?: (text: string) => void;
  onUpdateReminder?: (reminder: Reminder) => void;
  onDeleteReminder?: (id: string) => void;
  onReorderReminders?: (reminders: Reminder[]) => void;
}

const SALAH_LIST: { key: keyof SalahStatus; name: string; timeOfDay: string }[] = [
  { key: 'fajr', name: 'Fajr', timeOfDay: 'Dawn' },
  { key: 'dhuhr', name: 'Dhuhr', timeOfDay: 'Noon' },
  { key: 'asr', name: 'Asr', timeOfDay: 'Afternoon' },
  { key: 'maghrib', name: 'Maghrib', timeOfDay: 'Sunset' },
  { key: 'isha', name: 'Isha', timeOfDay: 'Night' },
];

const HABIT_ATTR_BADGES: Record<AttributeType, string> = {
  STR: 'text-[#E11D48] bg-[#F8FAFC] border-[#E11D48]/30',
  INT: 'text-[#2563EB] bg-[#F8FAFC] border-[#2563EB]/30',
  WIS: 'text-[#D97706] bg-[#F8FAFC] border-[#D97706]/30',
  CHA: 'text-[#059669] bg-[#F8FAFC] border-[#059669]/30',
};

export const DailyRituals: React.FC<DailyRitualsProps> = ({
  dayRecords,
  habits,
  selectedDate,
  setSelectedDate,
  onUpdateDayRecord,
  onRecordXpEvent,
  quests = [],
  onNavigateToQuests,
  onCompleteQuest: _onCompleteQuest,
  nonNegotiablePrayers = ALL_PRAYER_KEYS,
  reminders = [],
  onAddReminder,
  onUpdateReminder,
  onDeleteReminder,
  onReorderReminders,
}) => {
  const todayStr = getTodayLocalDateStr();

  const activeHabits = habits.filter((h) => !h.isArchived);

  // Non-negotiables & Log-derived Streak
  const nonNegotiables = getActiveNonNegotiableItems(habits, nonNegotiablePrayers);
  const streak = calculateNonNegotiableStreak(dayRecords, nonNegotiables, todayStr);

  // Quests due soon: open quests with due date within 7 days or overdue
  const questsDueSoon = quests
    .filter(q => !q.deletedAt && q.status !== 'done' && q.dueDate)
    .sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''));

  const currentRecord: DayRecord = dayRecords[selectedDate] || {
    date: selectedDate,
    salah: { fajr: false, dhuhr: false, asr: false, maghrib: false, isha: false },
    pushups: 0,
    squats: 0,
    workoutCompleted: false,
    deepWorkMinutes: 0,
    completedHabitIds: [],
    notes: '',
  };

  const dayStrip = getRelativeDayStrip(selectedDate, todayStr);

  const completedSalahCount = Object.values(currentRecord.salah).filter(Boolean).length;
  const isAllSalahCompleted = completedSalahCount === 5;

  const handleToggleSalah = (key: keyof SalahStatus) => {
    sfx.playClick();
    const prevSalahCount = Object.values(currentRecord.salah).filter(Boolean).length;
    const nextVal = !currentRecord.salah[key];
    const updatedRecord: DayRecord = {
      ...currentRecord,
      salah: {
        ...currentRecord.salah,
        [key]: nextVal,
      },
    };

    onUpdateDayRecord(
      updatedRecord,
      nextVal ? { attr: 'WIS', xp: XP_DISCIPLINE_REWARDS.SALAH_PRAYER } : undefined
    );

    if (onRecordXpEvent) {
      const prayerName = SALAH_LIST.find(s => s.key === key)?.name || key;
      const nextSalahCount = Object.values(updatedRecord.salah).filter(Boolean).length;
      if (nextVal) {
        onRecordXpEvent({
          action: `Salah: ${prayerName}`,
          pillar: 'WIS',
          points: XP_DISCIPLINE_REWARDS.SALAH_PRAYER,
          date: selectedDate,
          refId: `salah-${key}-${selectedDate}`,
        });
        if (nextSalahCount === 5) {
          onRecordXpEvent({
            action: 'Perfect Salah Day (5/5)',
            pillar: 'WIS',
            points: XP_DISCIPLINE_REWARDS.PERFECT_SALAH_DAY_BONUS,
            date: selectedDate,
            refId: `salah-perfect-${selectedDate}`,
          });
        }
      } else {
        onRecordXpEvent({
          action: `Salah Unchecked: ${prayerName}`,
          pillar: 'WIS',
          points: -XP_DISCIPLINE_REWARDS.SALAH_PRAYER,
          date: selectedDate,
          refId: `salah-${key}-${selectedDate}-undo`,
        });
        if (prevSalahCount === 5) {
          onRecordXpEvent({
            action: 'Perfect Salah Day Reversed',
            pillar: 'WIS',
            points: -XP_DISCIPLINE_REWARDS.PERFECT_SALAH_DAY_BONUS,
            date: selectedDate,
            refId: `salah-perfect-${selectedDate}-undo`,
          });
        }
      }
    }
  };

  const handleToggleHabit = (habitId: string) => {
    sfx.playClick();
    const isCompleted = currentRecord.completedHabitIds.includes(habitId);
    let nextIds: string[];
    let habitAttr: AttributeType = 'WIS';

    const habitObj = habits.find(h => h.id === habitId);
    if (habitObj) {
      habitAttr = habitObj.attribute;
    }

    if (isCompleted) {
      nextIds = currentRecord.completedHabitIds.filter(id => id !== habitId);
    } else {
      nextIds = [...currentRecord.completedHabitIds, habitId];
    }

    const updatedRecord: DayRecord = {
      ...currentRecord,
      completedHabitIds: nextIds,
    };

    onUpdateDayRecord(
      updatedRecord,
      !isCompleted ? { attr: habitAttr, xp: XP_DISCIPLINE_REWARDS.HABIT_COMPLETION } : undefined
    );

    if (onRecordXpEvent) {
      onRecordXpEvent({
        action: isCompleted ? `Habit Unchecked: ${habitObj?.name || 'Discipline'}` : `Habit: ${habitObj?.name || 'Completed'}`,
        pillar: habitAttr,
        points: isCompleted ? -XP_DISCIPLINE_REWARDS.HABIT_COMPLETION : XP_DISCIPLINE_REWARDS.HABIT_COMPLETION,
        date: selectedDate,
        refId: `habit-${habitId}-${selectedDate}`,
      });
    }
  };

  const handleAdjustPushups = (delta: number) => {
    sfx.playClick();
    const nextVal = Math.max(0, currentRecord.pushups + delta);
    const actualDelta = nextVal - currentRecord.pushups;
    const updatedRecord: DayRecord = {
      ...currentRecord,
      pushups: nextVal,
      workoutCompleted: nextVal >= 50 || currentRecord.squats >= 50,
    };
    onUpdateDayRecord(
      updatedRecord,
      actualDelta > 0 ? { attr: 'STR', xp: actualDelta * XP_DISCIPLINE_REWARDS.PUSHUP_REP } : undefined
    );

    if (actualDelta !== 0 && onRecordXpEvent) {
      const sign = actualDelta > 0 ? '+' : '';
      onRecordXpEvent({
        action: `Pushups (${sign}${actualDelta} reps)`,
        pillar: 'STR',
        points: actualDelta * XP_DISCIPLINE_REWARDS.PUSHUP_REP,
        date: selectedDate,
      });
    }
  };

  const handleSetPushupsDirect = (val: number) => {
    const nextVal = Math.max(0, val);
    const delta = nextVal - currentRecord.pushups;
    const updatedRecord: DayRecord = {
      ...currentRecord,
      pushups: nextVal,
      workoutCompleted: nextVal >= 50 || currentRecord.squats >= 50,
    };
    onUpdateDayRecord(updatedRecord);
    if (delta !== 0 && onRecordXpEvent) {
      const sign = delta > 0 ? '+' : '';
      onRecordXpEvent({
        action: `Pushups (${sign}${delta} reps)`,
        pillar: 'STR',
        points: delta * XP_DISCIPLINE_REWARDS.PUSHUP_REP,
        date: selectedDate,
      });
    }
  };

  const handleAdjustSquats = (delta: number) => {
    sfx.playClick();
    const nextVal = Math.max(0, currentRecord.squats + delta);
    const actualDelta = nextVal - currentRecord.squats;
    const updatedRecord: DayRecord = {
      ...currentRecord,
      squats: nextVal,
      workoutCompleted: currentRecord.pushups >= 50 || nextVal >= 50,
    };
    onUpdateDayRecord(
      updatedRecord,
      actualDelta > 0 ? { attr: 'STR', xp: actualDelta * XP_DISCIPLINE_REWARDS.SQUAT_REP } : undefined
    );

    if (actualDelta !== 0 && onRecordXpEvent) {
      const sign = actualDelta > 0 ? '+' : '';
      onRecordXpEvent({
        action: `Squats (${sign}${actualDelta} reps)`,
        pillar: 'STR',
        points: actualDelta * XP_DISCIPLINE_REWARDS.SQUAT_REP,
        date: selectedDate,
      });
    }
  };

  const handleSetSquatsDirect = (val: number) => {
    const nextVal = Math.max(0, val);
    const delta = nextVal - currentRecord.squats;
    const updatedRecord: DayRecord = {
      ...currentRecord,
      squats: nextVal,
      workoutCompleted: currentRecord.pushups >= 50 || nextVal >= 50,
    };
    onUpdateDayRecord(updatedRecord);
    if (delta !== 0 && onRecordXpEvent) {
      const sign = delta > 0 ? '+' : '';
      onRecordXpEvent({
        action: `Squats (${sign}${delta} reps)`,
        pillar: 'STR',
        points: delta * XP_DISCIPLINE_REWARDS.SQUAT_REP,
        date: selectedDate,
      });
    }
  };

  const handleDeepWorkChange = (minutes: number) => {
    const nextMinutes = Math.max(0, minutes);
    const delta = nextMinutes - (currentRecord.deepWorkMinutes || 0);
    const updatedRecord: DayRecord = {
      ...currentRecord,
      deepWorkMinutes: nextMinutes,
    };
    onUpdateDayRecord(updatedRecord);
    if (delta !== 0 && onRecordXpEvent) {
      const sign = delta > 0 ? '+' : '';
      onRecordXpEvent({
        action: `Deep Work Session (${sign}${delta}m)`,
        pillar: 'INT',
        points: delta * XP_DISCIPLINE_REWARDS.DEEP_WORK_PER_MINUTE,
        date: selectedDate,
      });
    }
  };

  return (
    <div className="space-y-8">
      {/* Editable Reminders Block */}
      {onAddReminder && onUpdateReminder && onDeleteReminder && onReorderReminders && (
        <RemindersBlock
          reminders={reminders}
          onAddReminder={onAddReminder}
          onUpdateReminder={onUpdateReminder}
          onDeleteReminder={onDeleteReminder}
          onReorderReminders={onReorderReminders}
        />
      )}

      {/* 0. Quests Due Soon Section (Editorial hairline section, no nested outer card) */}
      {questsDueSoon.length > 0 && (
        <section className="pb-6 border-b border-[#E2E8F0]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#E2E8F0]">
            <div className="flex items-center gap-2">
              <h3 className="font-serif text-[20px] font-normal text-[#0F172A]">Due soon</h3>
              <span className="text-[11px] tabular-nums text-[#64748B] px-1.5 py-0.5 rounded-[4px] bg-[#F1F5F9] border border-[#E2E8F0]">
                {questsDueSoon.length} pending
              </span>
            </div>

            {onNavigateToQuests && (
              <button
                type="button"
                onClick={() => {
                  sfx.playClick();
                  onNavigateToQuests();
                }}
                className="text-[13px] font-medium text-[#0F172A] hover:underline flex items-center gap-1 self-start sm:self-center transition-colors cursor-pointer"
              >
                <span>Open Tasks</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-3">
            {questsDueSoon.slice(0, 3).map((quest) => {
              const isOverdue = quest.dueDate! < todayStr;
              return (
                <div
                  key={quest.id}
                  onClick={() => {
                    if (onNavigateToQuests) onNavigateToQuests();
                  }}
                  className="p-3 rounded-[6px] border border-[#E2E8F0] bg-[#FFFFFF] hover:border-[#0F172A] transition-colors cursor-pointer flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-[14px] font-medium text-[#0F172A] truncate">
                      {quest.title}
                    </span>
                    <span className="px-1.5 py-0.5 rounded-[4px] text-[10px] font-medium bg-[#F1F5F9] text-[#64748B] border border-[#E2E8F0] flex-shrink-0">
                      {quest.pillar}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[12px] tabular-nums">
                    <span
                      className={`flex items-center gap-1 ${
                        isOverdue ? 'text-[#E11D48] font-medium' : 'text-[#64748B]'
                      }`}
                    >
                      {isOverdue && <AlertCircle className="w-3.5 h-3.5 text-[#E11D48]" />}
                      <span>{isOverdue ? `Overdue (${quest.dueDate})` : `Due: ${quest.dueDate}`}</span>
                    </span>

                    <span className="text-[11px] text-[#64748B]">
                      +{getQuestXp(quest.difficulty)} XP
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 1. 7-Day Navigation Strip & Prayers */}
      <section className="space-y-6">
        
        {/* Strip Header with Streak */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-serif text-[20px] font-normal text-[#0F172A]">
              Daily Checklist
            </h3>
            <p className="text-[12px] text-[#64748B]">
              Selected: {selectedDate === todayStr ? 'Today' : selectedDate}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-[6px] bg-[#FFFFFF] border border-[#E2E8F0] text-[12px]">
              <span className="text-[#64748B]">Streak:</span>
              <span className="font-serif text-[16px] font-medium text-[#0F172A] tabular-nums">
                {streak} {streak === 1 ? 'day' : 'days'}
              </span>
            </div>
          </div>
        </div>

        {/* 7-Day Date Navigation Strip */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-[#E2E8F0]">
          {dayStrip.map((day) => {
            const isSelected = day.dateStr === selectedDate;
            const record = dayRecords[day.dateStr];
            const isDayComplete = isDayRecordFullyComplete(record, nonNegotiables);
            const prayerCount = record ? Object.values(record.salah).filter(Boolean).length : 0;
            const habitCount = record ? record.completedHabitIds.length : 0;

            return (
              <button
                key={day.dateStr}
                onClick={() => {
                  sfx.playClick();
                  setSelectedDate(day.dateStr);
                }}
                className={`flex flex-col items-center px-4 py-2 rounded-[6px] border text-xs transition-colors min-w-[64px] cursor-pointer ${
                  isSelected
                    ? 'bg-[#FFFFFF] border-[#0F172A] text-[#0F172A]'
                    : 'bg-transparent border-[#E2E8F0] text-[#64748B] hover:bg-[#FFFFFF] hover:text-[#0F172A]'
                }`}
              >
                <span className="text-[11px] uppercase tracking-wider text-[#64748B]">{day.dayName}</span>
                <span className="font-serif text-[18px] font-normal my-0.5 text-[#0F172A] tabular-nums">{day.dayNum}</span>

                <div className="flex items-center gap-1 mt-1">
                  <span
                    className={`w-2 h-2 rounded-full transition-colors ${
                      isDayComplete
                        ? 'bg-[#059669]'
                        : prayerCount > 0 || habitCount > 0
                        ? 'bg-[#D97706]'
                        : 'bg-[#E2E8F0]'
                    }`}
                    title={
                      isDayComplete
                        ? 'Every non-negotiable completed on this day'
                        : 'Non-negotiables missed or in-progress'
                    }
                  />
                </div>
              </button>
            );
          })}
        </div>

        {/* 5 Daily Prayers (Salah Cadence) */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2.5">
              <h3 className="font-serif text-[20px] font-normal text-[#0F172A]">
                Daily Prayers
              </h3>
              <span className="text-[12px] tabular-nums text-[#64748B] px-2 py-0.5 rounded-[4px] bg-[#F1F5F9] border border-[#E2E8F0]">
                {completedSalahCount} of 5 completed
              </span>
            </div>

            {isAllSalahCompleted && (
              <span className="text-[12px] font-medium text-[#059669]">
                Perfect 5/5 Day (+150 XP)
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {SALAH_LIST.map(({ key, name, timeOfDay }) => {
              const isDone = currentRecord.salah[key];
              const isNonNeg = (nonNegotiablePrayers || ALL_PRAYER_KEYS).includes(key);

              return (
                <div
                  key={key}
                  className={`p-3.5 rounded-[6px] border flex flex-col items-center justify-between text-center transition-colors ${
                    isDone
                      ? 'bg-[#FFFFFF] border-[#059669] text-[#0F172A]'
                      : 'bg-[#FFFFFF] border-[#E2E8F0] text-[#0F172A]'
                  }`}
                >
                  <div className="flex items-center justify-between w-full text-[11px] mb-1">
                    <span className="text-[#64748B]">{timeOfDay}</span>
                    <span
                      className={`text-[9px] px-1 py-0.5 rounded-[3px] border font-medium select-none ${
                        isNonNeg
                          ? 'bg-[#0F172A] text-[#FFFFFF] border-[#0F172A]'
                          : 'bg-[#F1F5F9] text-[#64748B] border-[#E2E8F0]'
                      }`}
                    >
                      {isNonNeg ? 'Required' : 'Optional'}
                    </span>
                  </div>
                  <div className="font-serif text-[16px] font-normal text-[#0F172A] mb-3">{name}</div>

                  <button
                    type="button"
                    onClick={() => handleToggleSalah(key)}
                    className={`w-7 h-7 rounded-[4px] flex items-center justify-center border transition-colors cursor-pointer ${
                      isDone
                        ? 'bg-[#0F172A] border-[#0F172A] text-[#FFFFFF]'
                        : 'bg-[#FFFFFF] border-[#E2E8F0] text-transparent hover:border-[#0F172A]'
                    }`}
                  >
                    <Check className="w-4 h-4 stroke-[2.5]" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

      </section>

      {/* 2. Habits Checklist */}
      <section className="space-y-4 pt-4 border-t border-[#E2E8F0]">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-serif text-[20px] font-normal text-[#0F172A]">
              Habits & Disciplines
            </h3>
            <p className="text-[12px] text-[#64748B]">
              Daily operating protocols from Mind Vault
            </p>
          </div>
        </div>

        {/* Active Habits List */}
        <div className="space-y-2">
          {activeHabits.length === 0 ? (
            <div className="py-6 text-center text-[13px] text-[#64748B]">
              No active disciplines found in system.
            </div>
          ) : (
            activeHabits.map((habit) => {
              const isCompleted = currentRecord.completedHabitIds.includes(habit.id);

              return (
                <div
                  key={habit.id}
                  onClick={() => handleToggleHabit(habit.id)}
                  className={`group px-4 py-3 rounded-[6px] border flex items-center justify-between cursor-pointer transition-colors ${
                    isCompleted
                      ? 'bg-[#FFFFFF] border-[#E2E8F0]'
                      : 'bg-[#FFFFFF] border-[#E2E8F0] hover:border-[#0F172A]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-5 h-5 rounded-[4px] flex items-center justify-center border transition-colors ${
                        isCompleted
                          ? 'bg-[#0F172A] border-[#0F172A] text-[#FFFFFF]'
                          : 'bg-[#FFFFFF] border-[#E2E8F0] text-transparent'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    </div>

                    <div>
                      <span className={`text-[14px] font-normal block transition-colors ${
                        isCompleted ? 'line-through text-[#64748B]' : 'text-[#0F172A]'
                      }`}>
                        {habit.name}
                      </span>
                      {habit.description && (
                        <span className="text-[12px] text-[#64748B] line-clamp-1">
                          {habit.description}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-[4px] border font-medium select-none ${
                        habit.non_negotiable
                          ? 'bg-[#0F172A] text-[#FFFFFF] border-[#0F172A]'
                          : 'bg-[#F1F5F9] text-[#64748B] border-[#E2E8F0]'
                      }`}
                    >
                      {habit.non_negotiable ? 'Non-negotiable' : 'Optional'}
                    </span>

                    <span className={`text-[11px] px-2 py-0.5 rounded-[4px] border font-medium select-none ${HABIT_ATTR_BADGES[habit.attribute]}`}>
                      {habit.attribute}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* 3. Physical Training Volume & Deep Work */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4 border-t border-[#E2E8F0]">
        
        {/* Pushups & Squats Card */}
        <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-[6px] p-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0] mb-4">
            <h3 className="font-serif text-[18px] font-normal text-[#0F172A]">
              Movement (Strength)
            </h3>

            {currentRecord.workoutCompleted && (
              <span className="text-[12px] font-medium text-[#059669]">
                Full Workout (+120 XP)
              </span>
            )}
          </div>

          <div className="space-y-4">
            {/* Pushups Stepper */}
            <div className="p-3.5 rounded-[6px] bg-[#F8FAFC] border border-[#E2E8F0]">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[13px] font-medium text-[#0F172A]">Pushups</span>
                <span className="text-[12px] tabular-nums text-[#E11D48] font-medium">
                  +{currentRecord.pushups * 2} XP
                </span>
              </div>

              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={currentRecord.pushups === 0 ? '' : currentRecord.pushups}
                    onChange={(e) => {
                      const val = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
                      handleSetPushupsDirect(isNaN(val) ? 0 : val);
                    }}
                    className="w-16 px-2 py-1 bg-[#FFFFFF] border border-[#E2E8F0] rounded-[4px] text-[15px] font-medium tabular-nums text-[#0F172A] text-center focus:outline-none focus:border-[#0F172A]"
                  />
                  <span className="text-[12px] text-[#64748B]">reps</span>
                </div>

                <div className="flex items-center gap-1">
                  {[-10, -5, 5, 10, 25].map((d) => (
                    <button
                      key={d}
                      onClick={() => handleAdjustPushups(d)}
                      className="px-2 py-1 bg-[#FFFFFF] hover:bg-[#F1F5F9] text-[#0F172A] border border-[#E2E8F0] rounded-[4px] text-[12px] tabular-nums font-medium transition-colors cursor-pointer"
                    >
                      {d > 0 ? `+${d}` : d}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Squats Stepper */}
            <div className="p-3.5 rounded-[6px] bg-[#F8FAFC] border border-[#E2E8F0]">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[13px] font-medium text-[#0F172A]">Squats</span>
                <span className="text-[12px] tabular-nums text-[#E11D48] font-medium">
                  +{currentRecord.squats * 2} XP
                </span>
              </div>

              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={currentRecord.squats === 0 ? '' : currentRecord.squats}
                    onChange={(e) => {
                      const val = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
                      handleSetSquatsDirect(isNaN(val) ? 0 : val);
                    }}
                    className="w-16 px-2 py-1 bg-[#FFFFFF] border border-[#E2E8F0] rounded-[4px] text-[15px] font-medium tabular-nums text-[#0F172A] text-center focus:outline-none focus:border-[#0F172A]"
                  />
                  <span className="text-[12px] text-[#64748B]">reps</span>
                </div>

                <div className="flex items-center gap-1">
                  {[-10, -5, 5, 10, 25].map((d) => (
                    <button
                      key={d}
                      onClick={() => handleAdjustSquats(d)}
                      className="px-2 py-1 bg-[#FFFFFF] hover:bg-[#F1F5F9] text-[#0F172A] border border-[#E2E8F0] rounded-[4px] text-[12px] tabular-nums font-medium transition-colors cursor-pointer"
                    >
                      {d > 0 ? `+${d}` : d}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Deep Work Focus Card */}
        <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-[6px] p-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0] mb-4">
            <h3 className="font-serif text-[18px] font-normal text-[#0F172A]">
              Deep Work (Intellect)
            </h3>

            <span className="text-[12px] tabular-nums text-[#2563EB] font-medium">
              +{Math.round((currentRecord.deepWorkMinutes / 60) * 60)} XP
            </span>
          </div>

          <div className="space-y-4">
            <div className="p-3.5 rounded-[6px] bg-[#F8FAFC] border border-[#E2E8F0]">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[13px] text-[#64748B]">Focus Duration</span>
                <span className="font-serif text-[18px] font-normal tabular-nums text-[#0F172A]">
                  {Math.floor(currentRecord.deepWorkMinutes / 60)}h {currentRecord.deepWorkMinutes % 60}m
                </span>
              </div>

              <input
                type="range"
                min="0"
                max="600"
                step="15"
                value={currentRecord.deepWorkMinutes}
                onChange={(e) => handleDeepWorkChange(parseInt(e.target.value, 10))}
                className="w-full accent-[#0F172A] cursor-pointer"
              />

              <div className="flex justify-between text-[11px] tabular-nums text-[#64748B] mt-1.5">
                <span>0h</span>
                <span>2.5h</span>
                <span>5h</span>
                <span>7.5h</span>
                <span>10h</span>
              </div>
            </div>

            {/* Quick Presets */}
            <div className="flex items-center gap-2">
              {[
                { label: '+30m', mins: 30 },
                { label: '+60m', mins: 60 },
                { label: '+90m', mins: 90 },
              ].map((preset) => (
                <button
                  key={preset.mins}
                  onClick={() => {
                    sfx.playClick();
                    handleDeepWorkChange(currentRecord.deepWorkMinutes + preset.mins);
                  }}
                  className="flex-1 py-1.5 rounded-[6px] text-[13px] font-medium bg-[#FFFFFF] hover:bg-[#F1F5F9] text-[#0F172A] border border-[#E2E8F0] transition-colors cursor-pointer"
                >
                  {preset.label}
                </button>
              ))}
              <button
                onClick={() => {
                  sfx.playClick();
                  handleDeepWorkChange(0);
                }}
                className="p-2 rounded-[6px] text-[#64748B] hover:text-[#0F172A] bg-[#FFFFFF] border border-[#E2E8F0] hover:bg-[#F1F5F9] transition-colors cursor-pointer"
                title="Reset duration"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

      </section>

    </div>
  );
};
