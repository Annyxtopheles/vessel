import React, { useState } from 'react';
import type {
  InventoryItem,
  CustomHabit,
  DayRecord,
  Quest,
  XpEvent,
  Reminder,
  BucketListEntry,
  Account,
  Transaction,
  SavingsGoal,
  Debt,
  NetWorthSnapshot,
  SalahStatus,
  NumberGroupingOption,
} from '../types';
import type { NavTab } from './Sidebar';
import { Check } from 'lucide-react';
import { sfx } from '../utils/audio';
import { getTodayLocalDateStr } from '../utils/date';
import { getQuestXp, XP_DISCIPLINE_REWARDS } from '../data/xpConfig';
import { formatCurrency } from '../utils/numberFormat';
import {
  getActiveNonNegotiableItems,
  isNonNegotiableItemDone,
  calculateNonNegotiableStreak,
  ALL_PRAYER_KEYS,
  type NonNegotiableItem,
} from '../utils/nonNegotiables';
import {
  deriveNetWorth,
  deriveMonthlyCashFlow,
  deriveDebtBalance,
  deriveGoalProgress,
} from '../utils/finance';

interface OverviewViewProps {
  items: InventoryItem[];
  habits: CustomHabit[];
  dayRecords: Record<string, DayRecord>;
  quests: Quest[];
  xpEvents: XpEvent[];
  reminders: Reminder[];
  bucketListEntries: BucketListEntry[];
  accounts: Account[];
  transactions: Transaction[];
  savingsGoals: SavingsGoal[];
  debts: Debt[];
  netWorthSnapshots: NetWorthSnapshot[];
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
  onAddBucketEntry: (entry: Omit<BucketListEntry, 'id' | 'created_at'>) => void;
  onInspectItem?: (item: InventoryItem) => void;
  onOpenAddItem?: () => void;
  onOpenAddTask?: () => void;
  privacyMode?: boolean;
}

const PILLAR_BADGES = {
  STR: 'text-[#E11D48] bg-[#F8FAFC] border-[#E11D48]/30',
  INT: 'text-[#2563EB] bg-[#F8FAFC] border-[#2563EB]/30',
  WIS: 'text-[#D97706] bg-[#F8FAFC] border-[#D97706]/30',
  CHA: 'text-[#059669] bg-[#F8FAFC] border-[#059669]/30',
};

export const OverviewView: React.FC<OverviewViewProps> = ({
  items,
  habits,
  dayRecords,
  quests,
  reminders,
  bucketListEntries,
  accounts,
  transactions,
  savingsGoals,
  debts,
  nonNegotiablePrayers = ALL_PRAYER_KEYS,
  currencySymbol = '৳',
  numberGrouping = 'bangladeshi',
  onNavigate,
  onUpdateDayRecord,
  onRecordXpEvent,
  onAddBucketEntry,
  onInspectItem,
  onOpenAddItem,
  onOpenAddTask,
  privacyMode = false,
}) => {
  const blurClass = privacyMode ? 'filter blur-[6px] hover:filter-none transition-all select-none' : '';
  const todayStr = getTodayLocalDateStr();
  const todayRecord = dayRecords[todayStr];

  // Quick add bucket entry state
  const [quickBucketTitle, setQuickBucketTitle] = useState('');

  // Formatted date for header (e.g. "Thursday, October 29, 2026")
  const dateObj = new Date();
  const formattedDate = dateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // 1. Non-negotiables & Streak
  const nonNegotiables = getActiveNonNegotiableItems(habits, nonNegotiablePrayers);
  const completedCount = nonNegotiables.filter((item) =>
    isNonNegotiableItemDone(todayRecord, item)
  ).length;
  const totalCount = nonNegotiables.length;
  const streak = calculateNonNegotiableStreak(dayRecords, nonNegotiables, todayStr);
  const nonNegotiableProgressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const pinnedReminders = reminders.filter((r) => r.pinned);

  // 2. Tasks: Due soon and in progress (overdue in red)
  const activeTasks = quests.filter((q) => !q.deletedAt && !q.deleted_at && q.status !== 'done');
  const tasksDueOrInProgress = activeTasks
    .filter((q) => q.status === 'doing' || q.dueDate)
    .sort((a, b) => {
      const aOverdue = a.dueDate && a.dueDate < todayStr ? 1 : 0;
      const bOverdue = b.dueDate && b.dueDate < todayStr ? 1 : 0;
      if (aOverdue !== bOverdue) return bOverdue - aOverdue;
      if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
      if (a.dueDate && !b.dueDate) return -1;
      if (!a.dueDate && b.dueDate) return 1;
      return 0;
    });
  // If no tasks are specifically due soon or in progress, show next active tasks
  const displayTasks = tasksDueOrInProgress.length > 0 ? tasksDueOrInProgress.slice(0, 4) : activeTasks.slice(0, 3);

  // 3. Bucket List: Three entries ("next up")
  const activeBucket = bucketListEntries.filter(
    (b) => !b.deleted_at && !(b as any).deletedAt && b.status !== 'done'
  );
  const nextUpBucket = activeBucket.slice(0, 3);

  // 4. Money metrics
  const { netWorth } = deriveNetWorth(accounts, debts, transactions);
  const { net: monthlyCashFlow } = deriveMonthlyCashFlow(transactions);
  const totalDebt = debts
    .filter((d) => !d.deleted_at && !(d as any).deletedAt)
    .reduce((sum, d) => sum + deriveDebtBalance(d, transactions).remaining, 0);
  const activeGoals = savingsGoals.filter((g) => !g.deleted_at && !(g as any).deletedAt).slice(0, 3);

  // 5. Possessions
  const ownedItems = items.filter((i) => (i.ownershipStatus || (i.isLocked ? 'wishlist' : 'owned')) === 'owned');
  const wishlistItems = items.filter((i) => (i.ownershipStatus || (i.isLocked ? 'wishlist' : 'owned')) === 'wishlist');
  const ownedCount = ownedItems.length;
  const totalValue = ownedItems.reduce((acc, it) => acc + (it.goldValue || 0), 0);
  const wishlistCost = wishlistItems.reduce((acc, it) => acc + (it.targetPrice || it.goldValue || 0), 0);
  const recentItems = [...items]
    .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || '') || b.id.localeCompare(a.id))
    .slice(0, 3);

  // Handlers
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
      const prevSalahCount = Object.values(current.salah).filter(Boolean).length;
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

      if (onRecordXpEvent) {
        const nextSalahCount = Object.values(updated.salah).filter(Boolean).length;
        if (nextVal) {
          onRecordXpEvent({
            action: `Salah: ${item.name}`,
            pillar: 'WIS',
            points: XP_DISCIPLINE_REWARDS.SALAH_PRAYER,
            date: todayStr,
            refId: `salah-${item.prayerKey}-${todayStr}`,
          });
          if (nextSalahCount === 5) {
            onRecordXpEvent({
              action: 'Perfect Salah Day (5/5)',
              pillar: 'WIS',
              points: XP_DISCIPLINE_REWARDS.PERFECT_SALAH_DAY_BONUS,
              date: todayStr,
              refId: `salah-perfect-${todayStr}`,
            });
          }
        } else {
          onRecordXpEvent({
            action: `Salah Unchecked: ${item.name}`,
            pillar: 'WIS',
            points: -XP_DISCIPLINE_REWARDS.SALAH_PRAYER,
            date: todayStr,
            refId: `salah-${item.prayerKey}-${todayStr}-undo`,
          });
          if (prevSalahCount === 5) {
            onRecordXpEvent({
              action: 'Perfect Salah Day Reversed',
              pillar: 'WIS',
              points: -XP_DISCIPLINE_REWARDS.PERFECT_SALAH_DAY_BONUS,
              date: todayStr,
              refId: `salah-perfect-${todayStr}-undo`,
            });
          }
        }
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

      if (onRecordXpEvent) {
        onRecordXpEvent({
          action: isCompleted ? `Habit Unchecked: ${item.name}` : `Habit: ${item.name}`,
          pillar: item.pillar,
          points: isCompleted ? -XP_DISCIPLINE_REWARDS.HABIT_COMPLETION : XP_DISCIPLINE_REWARDS.HABIT_COMPLETION,
          date: todayStr,
          refId: `habit-${item.habitId}-${todayStr}`,
        });
      }
    }
  };

  const handleQuickAddBucketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickBucketTitle.trim()) return;
    sfx.playClick();
    onAddBucketEntry({
      title: quickBucketTitle.trim(),
      category: 'General',
      status: 'someday',
    });
    setQuickBucketTitle('');
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="border-b border-[#E2E8F0] pb-5">
        <h1 className="text-[26px] font-semibold text-[#0F172A] leading-tight tracking-tight">
          {formattedDate}
        </h1>
        <p className="text-[14px] text-[#64748B] mt-1 tabular-nums font-medium">
          {completedCount} of {totalCount} done today
        </p>
      </div>

      {/* Two Column Layout: Main (approx 65%) and Right Rail (approx 35%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* ===================================================================== */}
        {/* MAIN COLUMN (about 65%)                                               */}
        {/* ===================================================================== */}
        <div className="lg:col-span-8 space-y-10">
          {/* 1. NON-NEGOTIABLES */}
          <section className="space-y-4">
            <div className="flex items-baseline justify-between border-b border-[#E2E8F0] pb-2">
              <h2 className="text-[17px] font-semibold text-[#0F172A]">Non-negotiables</h2>
              <button
                type="button"
                onClick={() => onNavigate('routine')}
                className="text-[13px] text-[#64748B] hover:text-[#0F172A] underline-offset-4 hover:underline cursor-pointer"
              >
                View all
              </button>
            </div>

            {/* Pinned Reminders Block */}
            {pinnedReminders.length > 0 && (
              <div className="border-l-2 border-[#0F172A] pl-4 py-1.5 space-y-2 bg-[#FFFFFF] rounded-r-[6px] border-y border-r border-[#E2E8F0]">
                {pinnedReminders.map((rem) => (
                  <p key={rem.id} className="text-[14px] text-[#0F172A] font-medium leading-relaxed">
                    "{rem.text}"
                  </p>
                ))}
              </div>
            )}

            {/* Progress & Current Streak bar */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-[13px] tabular-nums">
                <span className="text-[#64748B]">
                  {completedCount} of {totalCount} completed
                </span>
                <span className="font-medium text-[#0F172A]">
                  {streak} {streak === 1 ? 'day' : 'days'} streak
                </span>
              </div>
              <div className="w-full h-1 bg-[#E2E8F0] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#0F172A] transition-all duration-300"
                  style={{ width: `${nonNegotiableProgressPct}%` }}
                />
              </div>
            </div>

            {/* Today's Checklist with Inline Check-off */}
            {nonNegotiables.length === 0 ? (
              <div className="py-8 text-center border border-dashed border-[#E2E8F0] rounded-[6px] p-6 text-[14px] text-[#64748B] space-y-3">
                <p>No non-negotiables designated yet.</p>
                <button
                  type="button"
                  onClick={() => onNavigate('routine')}
                  className="editorial-btn-primary text-[13px] py-1.5 px-3"
                >
                  Configure in Routine
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {nonNegotiables.map((item) => {
                  const isDone = isNonNegotiableItemDone(todayRecord, item);

                  return (
                    <div
                      key={item.id}
                      onClick={() => handleToggleNonNegotiable(item)}
                      className="p-3.5 rounded-[6px] border border-[#E2E8F0] bg-[#FFFFFF] flex items-center justify-between gap-3 cursor-pointer hover:border-[#0F172A] transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-5 h-5 rounded-[4px] border flex items-center justify-center transition-colors shrink-0 ${
                            isDone
                              ? 'bg-[#0F172A] border-[#0F172A] text-[#FFFFFF]'
                              : 'bg-[#FFFFFF] border-[#E2E8F0] text-transparent'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        </div>
                        <span
                          className={`text-[14px] truncate transition-colors ${
                            isDone ? 'line-through text-[#64748B]' : 'text-[#0F172A] font-medium'
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
                })}
              </div>
            )}
          </section>

          {/* 2. TASKS */}
          <section className="space-y-4">
            <div className="flex items-baseline justify-between border-b border-[#E2E8F0] pb-2">
              <h2 className="text-[17px] font-semibold text-[#0F172A]">Tasks</h2>
              <button
                type="button"
                onClick={() => onNavigate('tasks')}
                className="text-[13px] text-[#64748B] hover:text-[#0F172A] underline-offset-4 hover:underline cursor-pointer"
              >
                View all
              </button>
            </div>

            {displayTasks.length === 0 ? (
              <div className="py-8 text-center border border-dashed border-[#E2E8F0] rounded-[6px] p-6 text-[14px] text-[#64748B] space-y-3">
                <p>No tasks currently in progress or due soon.</p>
                <button
                  type="button"
                  onClick={() => (onOpenAddTask ? onOpenAddTask() : onNavigate('tasks'))}
                  className="editorial-btn-primary text-[13px] py-1.5 px-3"
                >
                  Create a Task
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {displayTasks.map((task) => {
                  const isOverdue = task.dueDate ? task.dueDate < todayStr : false;

                  return (
                    <div
                      key={task.id}
                      onClick={() => {
                        sfx.playClick();
                        onNavigate('tasks');
                      }}
                      className="p-3.5 rounded-[6px] border border-[#E2E8F0] bg-[#FFFFFF] hover:border-[#0F172A] transition-colors cursor-pointer flex items-center justify-between gap-4"
                    >
                      <div className="min-w-0 flex-1">
                        <span className="text-[14px] font-medium text-[#0F172A] truncate block">
                          {task.title}
                        </span>
                        <div className="text-[12px] tabular-nums mt-0.5">
                          {isOverdue ? (
                            <span className="text-[#E11D48] font-medium">
                              Overdue · Due {task.dueDate}
                            </span>
                          ) : task.dueDate ? (
                            <span className="text-[#64748B]">Due {task.dueDate}</span>
                          ) : task.status === 'doing' ? (
                            <span className="text-[#2563EB]">In progress</span>
                          ) : (
                            <span className="text-[#64748B]">To do</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
                        <span className="text-[12px] font-medium tabular-nums text-[#64748B]">
                          +{getQuestXp(task.difficulty)} XP
                        </span>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-[4px] border font-medium ${
                            PILLAR_BADGES[task.pillar]
                          }`}
                        >
                          {task.pillar}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* 3. BUCKET LIST */}
          <section className="space-y-4">
            <div className="flex items-baseline justify-between border-b border-[#E2E8F0] pb-2">
              <h2 className="text-[17px] font-semibold text-[#0F172A]">Bucket List</h2>
              <button
                type="button"
                onClick={() => onNavigate('bucket-list')}
                className="text-[13px] text-[#64748B] hover:text-[#0F172A] underline-offset-4 hover:underline cursor-pointer"
              >
                View all
              </button>
            </div>

            {/* Quick Add Row */}
            <form onSubmit={handleQuickAddBucketSubmit} className="flex gap-2">
              <input
                type="text"
                value={quickBucketTitle}
                onChange={(e) => setQuickBucketTitle(e.target.value)}
                placeholder="Add to bucket list..."
                className="ship-input flex-1 text-[14px] py-1.5"
              />
              <button type="submit" className="editorial-btn-primary text-[13px] py-1.5 px-3.5 shrink-0">
                Add
              </button>
            </form>

            {/* Three Entries ("Next Up") */}
            {nextUpBucket.length === 0 ? (
              <div className="py-6 text-center border border-dashed border-[#E2E8F0] rounded-[6px] p-6 text-[13px] text-[#64748B]">
                No active pursuits in your bucket list. Enter one above to get started.
              </div>
            ) : (
              <div className="space-y-2">
                {nextUpBucket.map((entry) => (
                  <div
                    key={entry.id}
                    onClick={() => {
                      sfx.playClick();
                      onNavigate('bucket-list');
                    }}
                    className="p-3.5 rounded-[6px] border border-[#E2E8F0] bg-[#FFFFFF] hover:border-[#0F172A] transition-colors cursor-pointer flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <span className="text-[14px] font-medium text-[#0F172A] truncate block">
                        {entry.title}
                      </span>
                      <span className="text-[12px] text-[#64748B]">
                        {entry.category || 'General'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {entry.pillar && (
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-[4px] border font-medium ${
                            PILLAR_BADGES[entry.pillar]
                          }`}
                        >
                          {entry.pillar}
                        </span>
                      )}
                      <span className="text-[11px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#F1F5F9] text-[#64748B]">
                        {entry.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* ===================================================================== */}
        {/* RIGHT RAIL (about 35%)                                                */}
        {/* ===================================================================== */}
        <div className="lg:col-span-4 space-y-10">
          {/* 4. MONEY */}
          <section className="space-y-4">
            <div className="flex items-baseline justify-between border-b border-[#E2E8F0] pb-2">
              <h2 className="text-[17px] font-semibold text-[#0F172A]">Money</h2>
              <button
                type="button"
                onClick={() => onNavigate('money')}
                className="text-[13px] text-[#64748B] hover:text-[#0F172A] underline-offset-4 hover:underline cursor-pointer"
              >
                View all
              </button>
            </div>

            {accounts.length === 0 ? (
              <div className="py-8 text-center border border-dashed border-[#E2E8F0] rounded-[6px] p-6 text-[14px] text-[#64748B] space-y-3">
                <p>No financial accounts set up yet.</p>
                <button
                  type="button"
                  onClick={() => onNavigate('money')}
                  className="editorial-btn-primary text-[13px] py-1.5 px-3"
                >
                  Set up Money
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Net Worth & Change This Month */}
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-[#64748B] font-medium block">
                    Net Worth
                  </span>
                  <div className={`text-[28px] font-bold text-[#0F172A] tabular-nums leading-tight mt-0.5 ${blurClass}`}>
                    {formatCurrency(netWorth, currencySymbol, numberGrouping)}
                  </div>
                  <div className={`text-[13px] tabular-nums text-[#64748B] mt-1 font-medium ${blurClass}`}>
                    {monthlyCashFlow >= 0 ? '+' : ''}
                    {formatCurrency(monthlyCashFlow, currencySymbol, numberGrouping)} this month
                  </div>
                </div>

                {/* Savings Goals Progress Bars */}
                {activeGoals.length > 0 && (
                  <div className="pt-3 border-t border-[#E2E8F0] space-y-3">
                    <span className="text-[11px] uppercase tracking-wider text-[#64748B] font-medium block">
                      Savings Goals
                    </span>
                    <div className="space-y-2.5">
                      {activeGoals.map((goal) => {
                        const linkedAcc = accounts.find((a) => a.id === goal.account_id);
                        const { current, target, percent } = deriveGoalProgress(
                          goal,
                          linkedAcc,
                          transactions
                        );

                        return (
                          <div key={goal.id} className="space-y-1">
                            <div className="flex items-baseline justify-between text-[13px]">
                              <span className="font-medium text-[#0F172A] truncate max-w-[170px]">
                                {goal.name}
                              </span>
                              <span className={`tabular-nums text-[#64748B] text-[12px] shrink-0 ${blurClass}`}>
                                {formatCurrency(current, currencySymbol, numberGrouping)} / {formatCurrency(target, currencySymbol, numberGrouping)} ({percent}%)
                              </span>
                            </div>
                            <div className="w-full h-1.5 bg-[#E2E8F0] rounded-full overflow-hidden">
                              <div
                                className="h-full bg-[#0F172A] transition-all"
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Total Debt */}
                <div className="pt-3 border-t border-[#E2E8F0] flex items-baseline justify-between">
                  <span className="text-[13px] text-[#64748B]">Total Debt</span>
                  <span className={`text-[17px] font-semibold text-[#E11D48] tabular-nums ${blurClass}`}>
                    {formatCurrency(totalDebt, currencySymbol, numberGrouping)}
                  </span>
                </div>
              </div>
            )}
          </section>

          {/* 5. POSSESSIONS */}
          <section className="space-y-4">
            <div className="flex items-baseline justify-between border-b border-[#E2E8F0] pb-2">
              <h2 className="text-[17px] font-semibold text-[#0F172A]">Possessions</h2>
              <button
                type="button"
                onClick={() => onNavigate('inventory')}
                className="text-[13px] text-[#64748B] hover:text-[#0F172A] underline-offset-4 hover:underline cursor-pointer"
              >
                View all
              </button>
            </div>

            {items.length === 0 ? (
              <div className="py-8 text-center border border-dashed border-[#E2E8F0] rounded-[6px] p-6 text-[14px] text-[#64748B] space-y-3">
                <p>No possessions recorded yet.</p>
                <button
                  type="button"
                  onClick={() => (onOpenAddItem ? onOpenAddItem() : onNavigate('inventory'))}
                  className="editorial-btn-primary text-[13px] py-1.5 px-3"
                >
                  Add an Item
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-2 py-3 border-y border-[#E2E8F0]">
                  <div>
                    <span className="text-[11px] uppercase tracking-wider text-[#64748B] block">
                      Owned
                    </span>
                    <span className="text-[20px] font-semibold text-[#0F172A] tabular-nums block mt-0.5">
                      {ownedCount}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] uppercase tracking-wider text-[#64748B] block">
                      Total value
                    </span>
                    <span className={`text-[17px] font-semibold text-[#0F172A] tabular-nums block truncate mt-0.5 ${blurClass}`}>
                      {formatCurrency(totalValue, currencySymbol, numberGrouping)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] uppercase tracking-wider text-[#64748B] block">
                      Wishlist
                    </span>
                    <span className={`text-[17px] font-semibold text-[#0F172A] tabular-nums block truncate mt-0.5 ${blurClass}`}>
                      {formatCurrency(wishlistCost, currencySymbol, numberGrouping)}
                    </span>
                  </div>
                </div>

                {/* 3 Most Recently Added Items */}
                <div className="space-y-2">
                  <span className="text-[11px] uppercase tracking-wider text-[#64748B] font-medium block">
                    Recently Added
                  </span>
                  {recentItems.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => {
                        sfx.playClick();
                        if (onInspectItem) onInspectItem(item);
                        else onNavigate('inventory');
                      }}
                      className="p-2.5 rounded-[6px] border border-[#E2E8F0] bg-[#FFFFFF] hover:border-[#0F172A] transition-colors cursor-pointer flex items-center gap-3"
                    >
                      {/* Photo Thumbnail with standard 16:9 ratio */}
                      <div className="w-16 h-9 rounded-[4px] bg-[#F1F5F9] border border-[#E2E8F0] overflow-hidden flex items-center justify-center shrink-0">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-[13px] font-medium text-[#64748B]">
                            {(item.name[0] || 'V').toUpperCase()}
                          </span>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <span className="text-[13px] font-medium text-[#0F172A] truncate block">
                          {item.name}
                        </span>
                        <span className="text-[11px] text-[#64748B] block truncate">
                          {item.subCategory} · {item.location || 'Vault'}
                        </span>
                        <span className={`text-[12px] font-medium tabular-nums text-[#0F172A] block mt-0.5 ${blurClass}`}>
                          {formatCurrency(item.goldValue, currencySymbol, numberGrouping)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};
