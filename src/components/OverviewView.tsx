import React from 'react';
import type { 
  InventoryItem, 
  CustomHabit, 
  DayRecord, 
  Quest, 
  XpEvent 
} from '../types';
import type { NavTab } from './Sidebar';
import { 
  Package, 
  CalendarCheck2, 
  CheckSquare, 
  Target, 
  ChevronRight, 
  AlertCircle
} from 'lucide-react';
import { sfx } from '../utils/audio';
import { getTodayLocalDateStr } from '../utils/date';
import { deriveTotalXp, getOverallLevelProgress } from '../data/xpConfig';
import { formatCurrency } from '../utils/numberFormat';
import type { NumberGroupingOption } from '../types';

interface OverviewViewProps {
  items: InventoryItem[];
  habits: CustomHabit[];
  dayRecords: Record<string, DayRecord>;
  quests: Quest[];
  xpEvents: XpEvent[];
  currencySymbol?: string;
  numberGrouping?: NumberGroupingOption;
  onNavigate: (tab: NavTab) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  items,
  habits,
  dayRecords,
  quests,
  xpEvents,
  currencySymbol = '৳',
  numberGrouping = 'bangladeshi',
  onNavigate,
}) => {
  const todayStr = getTodayLocalDateStr();
  const todayRecord = dayRecords[todayStr];

  // Derived inventory numbers
  const ownedItems = items.filter(i => (i.ownershipStatus || 'owned') === 'owned');
  const ownedCount = ownedItems.length;
  const vaultValuation = ownedItems.reduce((acc, it) => acc + (it.goldValue || 0), 0);

  // Non-negotiables
  const activeHabits = habits.filter(h => !h.isArchived);
  const prayersDone = todayRecord ? Object.values(todayRecord.salah).filter(Boolean).length : 0;
  const habitsDone = todayRecord
    ? (todayRecord.completedHabitIds || []).filter(id => activeHabits.some(h => h.id === id)).length
    : 0;
  const totalNonNegotiables = 5 + activeHabits.length;
  const completedNonNegotiables = prayersDone + habitsDone;

  // Tasks
  const openTasks = quests.filter(q => !q.deletedAt && q.status !== 'done');
  const tasksDueSoon = openTasks
    .filter(q => q.dueDate)
    .sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''));

  // Character progression
  const totalXp = deriveTotalXp(xpEvents);
  const overall = getOverallLevelProgress(totalXp);

  return (
    <div className="space-y-6">
      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Items */}
        <div 
          onClick={() => {
            sfx.playClick();
            onNavigate('inventory');
          }}
          className="ship-card p-4 sm:p-4.5 flex flex-col justify-between cursor-pointer hover:border-[#BEBEC6] transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-[#6B6B76]">Items</span>
            <div className="ship-icon-tile">
              <Package className="w-4 h-4 text-[#0891B2]" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-[26px] font-bold text-[#111113] leading-none tracking-tight">
              {ownedCount}
            </div>
            <div className="text-[12px] text-[#6B6B76] mt-1.5 truncate">
              {formatCurrency(vaultValuation, currencySymbol, numberGrouping)} Total value
            </div>
          </div>
        </div>

        {/* Card 2: Today's Non-Negotiables */}
        <div 
          onClick={() => {
            sfx.playClick();
            onNavigate('routine');
          }}
          className="ship-card p-4 sm:p-4.5 flex flex-col justify-between cursor-pointer hover:border-[#BEBEC6] transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-[#6B6B76]">Due today</span>
            <div className="ship-icon-tile">
              <CalendarCheck2 className="w-4 h-4 text-[#16A34A]" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-[26px] font-bold text-[#111113] leading-none tracking-tight">
              {completedNonNegotiables} / {totalNonNegotiables}
            </div>
            <div className="text-[12px] text-[#6B6B76] mt-1.5 truncate">
              Non-negotiables completed
            </div>
          </div>
        </div>

        {/* Card 3: Open Tasks */}
        <div 
          onClick={() => {
            sfx.playClick();
            onNavigate('tasks');
          }}
          className="ship-card p-4 sm:p-4.5 flex flex-col justify-between cursor-pointer hover:border-[#BEBEC6] transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-[#6B6B76]">Tasks</span>
            <div className="ship-icon-tile">
              <CheckSquare className="w-4 h-4 text-[#0891B2]" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-[26px] font-bold text-[#111113] leading-none tracking-tight">
              {openTasks.length}
            </div>
            <div className="text-[12px] text-[#6B6B76] mt-1.5 truncate">
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
          className="ship-card p-4 sm:p-4.5 flex flex-col justify-between cursor-pointer hover:border-[#BEBEC6] transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-[#6B6B76]">Character</span>
            <div className="ship-icon-tile">
              <Target className="w-4 h-4 text-[#0891B2]" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-[26px] font-bold text-[#111113] leading-none tracking-tight">
              Level {overall.level}
            </div>
            <div className="text-[12px] text-[#6B6B76] mt-1.5 truncate">
              {totalXp.toLocaleString()} Total XP
            </div>
          </div>
        </div>

      </div>

      {/* Main Content Columns: Routine Snapshot + Due Soon Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Routine Snapshot */}
        <div className="ship-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-[#ECECF0]">
              <div className="flex items-center gap-2.5">
                <CalendarCheck2 className="w-4 h-4 text-[#16A34A]" />
                <h3 className="text-[15px] font-semibold text-[#111113]">Today's Routine</h3>
              </div>
              <span className="ship-pill-accent text-xs">
                {completedNonNegotiables} of {totalNonNegotiables} done
              </span>
            </div>

            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#F4F4F6] text-xs">
                <span className="font-medium text-[#111113]">Daily Prayers (Salah)</span>
                <span className="font-semibold text-[#0891B2]">{prayersDone} / 5</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#F4F4F6] text-xs">
                <span className="font-medium text-[#111113]">Habits & Disciplines</span>
                <span className="font-semibold text-[#16A34A]">{habitsDone} / {activeHabits.length}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#F4F4F6] text-xs">
                <span className="font-medium text-[#111113]">Movement & Conditioning</span>
                <span className={`font-semibold ${todayRecord?.workoutCompleted ? 'text-[#16A34A]' : 'text-[#9A9AA5]'}`}>
                  {todayRecord?.workoutCompleted ? 'Completed' : 'Pending'}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-[#ECECF0]">
            <button
              type="button"
              onClick={() => {
                sfx.playClick();
                onNavigate('routine');
              }}
              className="w-full py-2 rounded-xl text-xs font-semibold text-[#0891B2] hover:bg-[#E6F7F9] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Open Routine</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Tasks Due Soon */}
        <div className="ship-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-[#ECECF0]">
              <div className="flex items-center gap-2.5">
                <CheckSquare className="w-4 h-4 text-[#0891B2]" />
                <h3 className="text-[15px] font-semibold text-[#111113]">Due soon</h3>
              </div>
              <span className="text-xs text-[#9A9AA5]">
                {tasksDueSoon.length} pending
              </span>
            </div>

            <div className="mt-4 space-y-2">
              {tasksDueSoon.length === 0 ? (
                <div className="p-6 text-center text-xs text-[#9A9AA5]">
                  No upcoming task deadlines scheduled.
                </div>
              ) : (
                tasksDueSoon.slice(0, 3).map((task) => {
                  const isOverdue = task.dueDate! < todayStr;
                  return (
                    <div
                      key={task.id}
                      onClick={() => {
                        sfx.playClick();
                        onNavigate('tasks');
                      }}
                      className="p-3 rounded-xl border border-[#ECECF0] hover:bg-[#F4F4F6] transition-all cursor-pointer flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <span className="text-xs font-semibold text-[#111113] truncate block">
                          {task.title}
                        </span>
                        <span className={`text-[11px] flex items-center gap-1 mt-0.5 ${
                          isOverdue ? 'text-[#DC2626] font-semibold' : 'text-[#6B6B76]'
                        }`}>
                          {isOverdue && <AlertCircle className="w-3 h-3 text-[#DC2626]" />}
                          <span>{isOverdue ? `Overdue (${task.dueDate})` : `Due: ${task.dueDate}`}</span>
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#F4F4F6] text-[#6B6B76] shrink-0">
                        {task.pillar}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-[#ECECF0]">
            <button
              type="button"
              onClick={() => {
                sfx.playClick();
                onNavigate('tasks');
              }}
              className="w-full py-2 rounded-xl text-xs font-semibold text-[#0891B2] hover:bg-[#E6F7F9] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Open Tasks</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
