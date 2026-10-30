import React from 'react';
import type { 
  InventoryItem, 
  CustomHabit, 
  DayRecord, 
  Quest, 
  XpEvent,
  Reminder,
  SalahStatus,
  NumberGroupingOption
} from '../types';
import type { NavTab } from './Sidebar';
import { AlertCircle, Check } from 'lucide-react';
import { sfx } from '../utils/audio';
import { getTodayLocalDateStr } from '../utils/date';
import { deriveTotalXp, getOverallLevelProgress, XP_DISCIPLINE_REWARDS } from '../data/xpConfig';
import { formatCurrency } from '../utils/numberFormat';
import { RemindersBlock } from './RemindersBlock';
import {
  getActiveNonNegotiableItems,
  isNonNegotiableItemDone,
  calculateNonNegotiableStreak,
  ALL_PRAYER_KEYS,
  type NonNegotiableItem,
} from '../utils/nonNegotiables';

interface OverviewViewProps {
  items: InventoryItem[];
  habits: CustomHabit[];
  dayRecords: Record<string, DayRecord>;
  quests: Quest[];
  xpEvents: XpEvent[];
  reminders: Reminder[];
  nonNegotiablePrayers?: (keyof SalahStatus)[];
  currencySymbol?: string;
  numberGrouping?: NumberGroupingOption;
  onNavigate: (tab: NavTab) => void;
  onUpdateDayRecord: (record: DayRecord, xpGained?: { attr: 'STR' | 'INT' | 'WIS' | 'CHA'; xp: number }) => void;
  onRecordXpEvent?: (event: Omit<XpEvent, 'id'>) => void;
  onAddReminder: (text: string) => void;
  onUpdateReminder: (reminder: Reminder) => void;
  onDeleteReminder: (id: string) => void;
  onReorderReminders: (reminders: Reminder[]) => void;
}

const PILLAR_BADGES = {
  STR: 'text-[#9C3D2A] bg-[#F6F2EA] border-[#9C3D2A]/30',
  INT: 'text-[#2D4A6B] bg-[#F6F2EA] border-[#2D4A6B]/30',
  WIS: 'text-[#7A5C1E] bg-[#F6F2EA] border-[#7A5C1E]/30',
  CHA: 'text-[#3F6B4F] bg-[#F6F2EA] border-[#3F6B4F]/30',
};

export const OverviewView: React.FC<OverviewViewProps> = ({
  items,
  habits,
  dayRecords,
  quests,
  xpEvents,
  reminders,
  nonNegotiablePrayers = ALL_PRAYER_KEYS,
  currencySymbol = '৳',
  numberGrouping = 'bangladeshi',
  onNavigate,
  onUpdateDayRecord,
  onRecordXpEvent,
  onAddReminder,
  onUpdateReminder,
  onDeleteReminder,
  onReorderReminders,
}) => {
  const todayStr = getTodayLocalDateStr();
  const todayRecord = dayRecords[todayStr];

  // Derived inventory numbers
  const ownedItems = items.filter((i) => (i.ownershipStatus || 'owned') === 'owned');
  const ownedCount = ownedItems.length;
  const vaultValuation = ownedItems.reduce((acc, it) => acc + (it.goldValue || 0), 0);

  // Active Non-negotiables & Streak (single source of truth)
  const nonNegotiables = getActiveNonNegotiableItems(habits, nonNegotiablePrayers);
  const completedCount = nonNegotiables.filter((item) =>
    isNonNegotiableItemDone(todayRecord, item)
  ).length;
  const totalCount = nonNegotiables.length;
  const streak = calculateNonNegotiableStreak(dayRecords, nonNegotiables, todayStr);

  // Tasks
  const openTasks = quests.filter((q) => !q.deletedAt && q.status !== 'done');
  const tasksDueSoon = openTasks
    .filter((q) => q.dueDate)
    .sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''));

  // Character progression
  const totalXp = deriveTotalXp(xpEvents);
  const overall = getOverallLevelProgress(totalXp);

  // Toggle non-negotiable from the checklist (same record as Routine)
  const handleToggleNonNegotiable = (item: NonNegotiableItem) => {
    sfx.playClick();
    const current: DayRecord = todayRecord || {
      date: todayStr,
      salah: { fajr: false, dhuhr: false, asr: false, maghrib: false, isha: false },
      pushups: 0,
      squats: 0,
      workoutCompleted: false,
      deepWorkMinutes: 0,
      completedHabitIds: [],
      notes: '',
    };

    if (item.type === 'prayer' && item.prayerKey) {
      const nextVal = !current.salah[item.prayerKey];
      const updated: DayRecord = {
        ...current,
        salah: {
          ...current.salah,
          [item.prayerKey]: nextVal,
        },
      };

      onUpdateDayRecord(
        updated,
        nextVal ? { attr: 'WIS', xp: XP_DISCIPLINE_REWARDS.SALAH_PRAYER } : undefined
      );

      if (nextVal && onRecordXpEvent) {
        onRecordXpEvent({
          action: `Salah: ${item.name}`,
          pillar: 'WIS',
          points: XP_DISCIPLINE_REWARDS.SALAH_PRAYER,
          date: todayStr,
          refId: `salah-${item.prayerKey}-${todayStr}`,
        });
      }
    } else if (item.type === 'habit' && item.habitId) {
      const isCompleted = current.completedHabitIds.includes(item.habitId);
      const nextIds = isCompleted
        ? current.completedHabitIds.filter((id) => id !== item.habitId)
        : [...current.completedHabitIds, item.habitId];

      const updated: DayRecord = {
        ...current,
        completedHabitIds: nextIds,
      };

      onUpdateDayRecord(
        updated,
        !isCompleted ? { attr: item.pillar, xp: XP_DISCIPLINE_REWARDS.HABIT_COMPLETION } : undefined
      );

      if (!isCompleted && onRecordXpEvent) {
        onRecordXpEvent({
          action: `Habit: ${item.name}`,
          pillar: item.pillar,
          points: XP_DISCIPLINE_REWARDS.HABIT_COMPLETION,
          date: todayStr,
          refId: `habit-${item.habitId}-${todayStr}`,
        });
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. 4 Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Items */}
        <div
          onClick={() => {
            sfx.playClick();
            onNavigate('inventory');
          }}
          className="bg-[#FBF9F4] border border-[#E4DED2] rounded-[6px] p-4 flex flex-col justify-between cursor-pointer hover:border-[#1F1B16] transition-colors"
        >
          <span className="text-[13px] font-medium text-[#6B645A]">Items</span>
          <div className="mt-2">
            <div className="editorial-stat-num">{ownedCount}</div>
            <div className="text-[12px] text-[#6B645A] mt-1 tabular-nums truncate">
              {formatCurrency(vaultValuation, currencySymbol, numberGrouping)} Total value
            </div>
          </div>
        </div>

        {/* Card 2: Today's Non-Negotiables & Streak */}
        <div
          onClick={() => {
            sfx.playClick();
            onNavigate('routine');
          }}
          className="bg-[#FBF9F4] border border-[#E4DED2] rounded-[6px] p-4 flex flex-col justify-between cursor-pointer hover:border-[#1F1B16] transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-[#6B645A]">Non-negotiables</span>
            <span className="text-[11px] tabular-nums font-serif text-[#1F1B16] bg-[#EFEAE0] px-1.5 py-0.5 rounded-[4px] border border-[#E4DED2]">
              {streak}d streak
            </span>
          </div>
          <div className="mt-2">
            <div className="editorial-stat-num">
              {completedCount} / {totalCount}
            </div>
            <div className="text-[12px] text-[#6B645A] mt-1 truncate">
              {completedCount === totalCount && totalCount > 0
                ? 'All non-negotiables fulfilled'
                : `${totalCount - completedCount} items pending today`}
            </div>
          </div>
        </div>

        {/* Card 3: Tasks */}
        <div
          onClick={() => {
            sfx.playClick();
            onNavigate('tasks');
          }}
          className="bg-[#FBF9F4] border border-[#E4DED2] rounded-[6px] p-4 flex flex-col justify-between cursor-pointer hover:border-[#1F1B16] transition-colors"
        >
          <span className="text-[13px] font-medium text-[#6B645A]">Tasks</span>
          <div className="mt-2">
            <div className="editorial-stat-num">{openTasks.length}</div>
            <div className="text-[12px] text-[#6B645A] mt-1 truncate tabular-nums">
              {tasksDueSoon.length} with upcoming deadlines
            </div>
          </div>
        </div>

        {/* Card 4: Level */}
        <div
          onClick={() => {
            sfx.playClick();
            onNavigate('character');
          }}
          className="bg-[#FBF9F4] border border-[#E4DED2] rounded-[6px] p-4 flex flex-col justify-between cursor-pointer hover:border-[#1F1B16] transition-colors"
        >
          <span className="text-[13px] font-medium text-[#6B645A]">Character</span>
          <div className="mt-2">
            <div className="editorial-stat-num">Level {overall.level}</div>
            <div className="text-[12px] text-[#6B645A] mt-1 truncate tabular-nums">
              {totalXp.toLocaleString()} Total XP
            </div>
          </div>
        </div>
      </div>

      {/* 2. Reminders & Principles Typographic Block */}
      <RemindersBlock
        reminders={reminders}
        onAddReminder={onAddReminder}
        onUpdateReminder={onUpdateReminder}
        onDeleteReminder={onDeleteReminder}
        onReorderReminders={onReorderReminders}
      />

      {/* 3. Main Columns: Today's Non-Negotiables Checklist + Tasks Due Soon */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Non-Negotiables Checklist (Interactive, Single Source of Truth) */}
        <div className="bg-[#FBF9F4] border border-[#E4DED2] rounded-[6px] p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#E4DED2]">
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-[18px] font-normal text-[#1F1B16]">
                  Today's Non-Negotiables
                </h3>
                <span className="text-[11px] tabular-nums text-[#6B645A] px-1.5 py-0.5 rounded-[4px] bg-[#EFEAE0] border border-[#E4DED2]">
                  {completedCount}/{totalCount}
                </span>
              </div>

              <div className="flex items-center gap-2 text-[12px] text-[#6B645A]">
                <span>Streak:</span>
                <span className="font-serif text-[15px] font-medium text-[#1F1B16] tabular-nums">
                  {streak} {streak === 1 ? 'day' : 'days'}
                </span>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              {nonNegotiables.length === 0 ? (
                <div className="py-6 text-center text-[13px] text-[#6B645A]">
                  No non-negotiables designated yet. Configure them in Routine.
                </div>
              ) : (
                nonNegotiables.map((item) => {
                  const isDone = isNonNegotiableItemDone(todayRecord, item);

                  return (
                    <div
                      key={item.id}
                      onClick={() => handleToggleNonNegotiable(item)}
                      className={`p-3 rounded-[6px] border flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                        isDone
                          ? 'bg-[#FBF9F4] border-[#E4DED2]'
                          : 'bg-[#FBF9F4] border-[#E4DED2] hover:border-[#1F1B16]'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-5 h-5 rounded-[4px] border flex items-center justify-center transition-colors shrink-0 ${
                            isDone
                              ? 'bg-[#1F1B16] border-[#1F1B16] text-[#FBF9F4]'
                              : 'bg-[#FBF9F4] border-[#E4DED2] text-transparent'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        </div>
                        <span
                          className={`text-[14px] truncate transition-colors ${
                            isDone ? 'line-through text-[#6B645A]' : 'text-[#1F1B16] font-medium'
                          }`}
                        >
                          {item.name}
                        </span>
                      </div>

                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-[4px] border font-medium shrink-0 ${
                          PILLAR_BADGES[item.pillar]
                        }`}
                      >
                        {item.pillar}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-[#E4DED2]">
            <button
              type="button"
              onClick={() => {
                sfx.playClick();
                onNavigate('routine');
              }}
              className="editorial-btn-secondary w-full"
            >
              Open Full Routine
            </button>
          </div>
        </div>

        {/* Tasks Due Soon */}
        <div className="bg-[#FBF9F4] border border-[#E4DED2] rounded-[6px] p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#E4DED2]">
              <h3 className="font-serif text-[18px] font-normal text-[#1F1B16]">Due soon</h3>
              <span className="text-[12px] tabular-nums text-[#6B645A]">
                {tasksDueSoon.length} pending
              </span>
            </div>

            <div className="mt-4 space-y-2">
              {tasksDueSoon.length === 0 ? (
                <div className="p-6 text-center text-[13px] text-[#6B645A]">
                  No upcoming task deadlines scheduled.
                </div>
              ) : (
                tasksDueSoon.slice(0, 4).map((task) => {
                  const isOverdue = task.dueDate! < todayStr;
                  const linkedItem = items.find((i) => i.id === task.linkedItemId);

                  return (
                    <div
                      key={task.id}
                      onClick={() => {
                        sfx.playClick();
                        onNavigate('tasks');
                      }}
                      className="p-3 rounded-[6px] border border-[#E4DED2] hover:border-[#1F1B16] bg-[#FBF9F4] transition-colors cursor-pointer flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <span className="text-[14px] font-medium text-[#1F1B16] truncate block">
                          {task.title}
                        </span>
                        <span
                          className={`text-[12px] tabular-nums flex items-center gap-1 mt-0.5 ${
                            isOverdue ? 'text-[#9C3D2A] font-medium' : 'text-[#6B645A]'
                          }`}
                        >
                          {isOverdue && <AlertCircle className="w-3 h-3 text-[#9C3D2A]" />}
                          <span>
                            {isOverdue ? `Overdue (${task.dueDate})` : `Due: ${task.dueDate}`}
                          </span>
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {linkedItem && (
                          <div
                            className="w-5 h-5 rounded-[4px] border border-[#E4DED2] bg-[#EFEAE0] flex items-center justify-center overflow-hidden shrink-0"
                            title={`Linked item: ${linkedItem.name}`}
                          >
                            {linkedItem.imageUrl ? (
                              <img
                                src={linkedItem.imageUrl}
                                alt={linkedItem.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="font-serif text-[10px] font-medium text-[#1F1B16]">
                                {(linkedItem.name || '?')[0].toUpperCase()}
                              </span>
                            )}
                          </div>
                        )}
                        <span className="px-1.5 py-0.5 rounded-[4px] text-[10px] font-medium bg-[#EFEAE0] text-[#6B645A] border border-[#E4DED2]">
                          {task.pillar}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-[#E4DED2]">
            <button
              type="button"
              onClick={() => {
                sfx.playClick();
                onNavigate('tasks');
              }}
              className="editorial-btn-secondary w-full"
            >
              Open Tasks
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
