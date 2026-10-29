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
}) => {
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
      {/* Editorial Header */}
      <div className="border-b border-[#E4DED2] pb-5">
        <h1 className="font-serif text-[32px] font-normal text-[#1F1B16] leading-tight tracking-tight">
          {formattedDate}
        </h1>
        <p className="text-[15px] text-[#6B645A] mt-1 tabular-nums">
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
            <div className="flex items-baseline justify-between border-b border-[#E4DED2] pb-2">
              <h2 className="font-serif text-[20px] font-normal text-[#1F1B16]">Non-negotiables</h2>
              <button
                type="button"
                onClick={() => onNavigate('routine')}
                className="text-[13px] text-[#6B645A] hover:text-[#1F1B16] underline-offset-4 hover:underline cursor-pointer"
              >
                View all
              </button>
            </div>

            {/* Pinned Reminders Typographic Block */}
            {pinnedReminders.length > 0 && (
              <div className="border-l-2 border-[#1F1B16] pl-4 py-1.5 space-y-2 bg-[#FBF9F4] rounded-r-[6px] border-y border-r border-[#E4DED2]">
                {pinnedReminders.map((rem) => (
                  <p key={rem.id} className="font-serif text-[16px] text-[#1F1B16] italic leading-relaxed">
                    "{rem.text}"
                  </p>
                ))}
              </div>
            )}

            {/* Progress & Current Streak bar */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-[13px] tabular-nums">
                <span className="text-[#6B645A]">
                  {completedCount} of {totalCount} completed
                </span>
                <span className="font-medium text-[#1F1B16]">
                  {streak} {streak === 1 ? 'day' : 'days'} streak
                </span>
              </div>
              <div className="w-full h-1 bg-[#E4DED2] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#1F1B16] transition-all duration-300"
                  style={{ width: `${nonNegotiableProgressPct}%` }}
                />
              </div>
            </div>

            {/* Today's Checklist with Inline Check-off */}
            {nonNegotiables.length === 0 ? (
              <div className="py-8 text-center border border-dashed border-[#E4DED2] rounded-[6px] p-6 text-[14px] text-[#6B645A] space-y-3">
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
                      className="p-3.5 rounded-[6px] border border-[#E4DED2] bg-[#FBF9F4] flex items-center justify-between gap-3 cursor-pointer hover:border-[#1F1B16] transition-colors"
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
                })}
              </div>
            )}
          </section>

          {/* 2. TASKS */}
          <section className="space-y-4">
            <div className="flex items-baseline justify-between border-b border-[#E4DED2] pb-2">
              <h2 className="font-serif text-[20px] font-normal text-[#1F1B16]">Tasks</h2>
              <button
                type="button"
                onClick={() => onNavigate('tasks')}
                className="text-[13px] text-[#6B645A] hover:text-[#1F1B16] underline-offset-4 hover:underline cursor-pointer"
              >
                View all
              </button>
            </div>

            {displayTasks.length === 0 ? (
              <div className="py-8 text-center border border-dashed border-[#E4DED2] rounded-[6px] p-6 text-[14px] text-[#6B645A] space-y-3">
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
                      className="p-3.5 rounded-[6px] border border-[#E4DED2] bg-[#FBF9F4] hover:border-[#1F1B16] transition-colors cursor-pointer flex items-center justify-between gap-4"
                    >
                      <div className="min-w-0 flex-1">
                        <span className="text-[14px] font-medium text-[#1F1B16] truncate block">
                          {task.title}
                        </span>
                        <div className="text-[12px] tabular-nums mt-0.5">
                          {isOverdue ? (
                            <span className="text-[#9C3D2A] font-medium">
                              Overdue · Due {task.dueDate}
                            </span>
                          ) : task.dueDate ? (
                            <span className="text-[#6B645A]">Due {task.dueDate}</span>
                          ) : task.status === 'doing' ? (
                            <span className="text-[#2D4A6B]">In progress</span>
                          ) : (
                            <span className="text-[#6B645A]">To do</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
                        <span className="text-[12px] font-serif tabular-nums text-[#6B645A]">
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
            <div className="flex items-baseline justify-between border-b border-[#E4DED2] pb-2">
              <h2 className="font-serif text-[20px] font-normal text-[#1F1B16]">Bucket List</h2>
              <button
                type="button"
                onClick={() => onNavigate('bucket-list')}
                className="text-[13px] text-[#6B645A] hover:text-[#1F1B16] underline-offset-4 hover:underline cursor-pointer"
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
              <div className="py-6 text-center border border-dashed border-[#E4DED2] rounded-[6px] p-6 text-[13px] text-[#6B645A]">
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
                    className="p-3.5 rounded-[6px] border border-[#E4DED2] bg-[#FBF9F4] hover:border-[#1F1B16] transition-colors cursor-pointer flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <span className="text-[14px] font-medium text-[#1F1B16] truncate block">
                        {entry.title}
                      </span>
                      <span className="text-[12px] text-[#6B645A]">
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
                      <span className="text-[11px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#EFEAE0] text-[#6B645A]">
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
            <div className="flex items-baseline justify-between border-b border-[#E4DED2] pb-2">
              <h2 className="font-serif text-[20px] font-normal text-[#1F1B16]">Money</h2>
              <button
                type="button"
                onClick={() => onNavigate('money')}
                className="text-[13px] text-[#6B645A] hover:text-[#1F1B16] underline-offset-4 hover:underline cursor-pointer"
              >
                View all
              </button>
            </div>

            {accounts.length === 0 ? (
              <div className="py-8 text-center border border-dashed border-[#E4DED2] rounded-[6px] p-6 text-[14px] text-[#6B645A] space-y-3">
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
                  <span className="text-[11px] uppercase tracking-wider text-[#6B645A] font-medium block">
                    Net Worth
                  </span>
                  <div className="font-serif text-[32px] text-[#1F1B16] tabular-nums font-normal leading-tight mt-0.5">
                    {formatCurrency(netWorth, currencySymbol, numberGrouping)}
                  </div>
                  <div className="text-[13px] tabular-nums text-[#6B645A] mt-1">
                    {monthlyCashFlow >= 0 ? '+' : ''}
                    {formatCurrency(monthlyCashFlow, currencySymbol, numberGrouping)} this month
                  </div>
                </div>

                {/* Savings Goals Progress Bars */}
                {activeGoals.length > 0 && (
                  <div className="pt-3 border-t border-[#E4DED2] space-y-3">
                    <span className="text-[11px] uppercase tracking-wider text-[#6B645A] font-medium block">
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
                              <span className="font-medium text-[#1F1B16] truncate max-w-[170px]">
                                {goal.name}
                              </span>
                              <span className="tabular-nums text-[#6B645A] text-[12px] shrink-0">
                                {formatCurrency(current, currencySymbol, numberGrouping)} / {formatCurrency(target, currencySymbol, numberGrouping)} ({percent}%)
                              </span>
                            </div>
                            <div className="w-full h-1.5 bg-[#E4DED2] rounded-full overflow-hidden">
                              <div
                                className="h-full bg-[#1F1B16] transition-all"
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
                <div className="pt-3 border-t border-[#E4DED2] flex items-baseline justify-between">
                  <span className="text-[13px] text-[#6B645A]">Total Debt</span>
                  <span className="font-serif text-[18px] text-[#9C3D2A] tabular-nums font-medium">
                    {formatCurrency(totalDebt, currencySymbol, numberGrouping)}
                  </span>
                </div>
              </div>
            )}
          </section>

          {/* 5. POSSESSIONS */}
          <section className="space-y-4">
            <div className="flex items-baseline justify-between border-b border-[#E4DED2] pb-2">
              <h2 className="font-serif text-[20px] font-normal text-[#1F1B16]">Possessions</h2>
              <button
                type="button"
                onClick={() => onNavigate('inventory')}
                className="text-[13px] text-[#6B645A] hover:text-[#1F1B16] underline-offset-4 hover:underline cursor-pointer"
              >
                View all
              </button>
            </div>

            {items.length === 0 ? (
              <div className="py-8 text-center border border-dashed border-[#E4DED2] rounded-[6px] p-6 text-[14px] text-[#6B645A] space-y-3">
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
                <div className="grid grid-cols-3 gap-2 py-3 border-y border-[#E4DED2]">
                  <div>
                    <span className="text-[11px] uppercase tracking-wider text-[#6B645A] block">
                      Owned
                    </span>
                    <span className="font-serif text-[20px] text-[#1F1B16] tabular-nums block font-normal mt-0.5">
                      {ownedCount}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] uppercase tracking-wider text-[#6B645A] block">
                      Total value
                    </span>
                    <span className="font-serif text-[18px] text-[#1F1B16] tabular-nums block font-normal truncate mt-0.5">
                      {formatCurrency(totalValue, currencySymbol, numberGrouping)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] uppercase tracking-wider text-[#6B645A] block">
                      Wishlist
                    </span>
                    <span className="font-serif text-[18px] text-[#1F1B16] tabular-nums block font-normal truncate mt-0.5">
                      {formatCurrency(wishlistCost, currencySymbol, numberGrouping)}
                    </span>
                  </div>
                </div>

                {/* 3 Most Recently Added Items */}
                <div className="space-y-2">
                  <span className="text-[11px] uppercase tracking-wider text-[#6B645A] font-medium block">
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
                      className="p-2.5 rounded-[6px] border border-[#E4DED2] bg-[#FBF9F4] hover:border-[#1F1B16] transition-colors cursor-pointer flex items-center gap-3"
                    >
                      {/* Photo Thumbnail with 4:5 aspect ratio */}
                      <div className="w-10 h-[50px] rounded-[4px] bg-[#EFEAE0] border border-[#E4DED2] overflow-hidden flex items-center justify-center shrink-0">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="font-serif text-[15px] text-[#6B645A]">
                            {(item.name[0] || 'V').toUpperCase()}
                          </span>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <span className="text-[13px] font-medium text-[#1F1B16] truncate block">
                          {item.name}
                        </span>
                        <span className="text-[11px] text-[#6B645A] block truncate">
                          {item.subCategory} · {item.location || 'Vault'}
                        </span>
                        <span className="text-[12px] font-serif tabular-nums text-[#1F1B16] block mt-0.5">
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
