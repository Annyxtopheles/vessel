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
          className="bg-[#FBF9F4] border border-[#E4DED2] rounded-[6px] p-4 flex flex-col justify-between cursor-pointer hover:border-[#1F1B16] transition-colors"
        >
          <span className="text-[13px] font-medium text-[#6B645A]">Items</span>
          <div className="mt-2">
            <div className="editorial-stat-num">
              {ownedCount}
            </div>
            <div className="text-[12px] text-[#6B645A] mt-1 tabular-nums truncate">
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
          className="bg-[#FBF9F4] border border-[#E4DED2] rounded-[6px] p-4 flex flex-col justify-between cursor-pointer hover:border-[#1F1B16] transition-colors"
        >
          <span className="text-[13px] font-medium text-[#6B645A]">Due today</span>
          <div className="mt-2">
            <div className="editorial-stat-num">
              {completedNonNegotiables} / {totalNonNegotiables}
            </div>
            <div className="text-[12px] text-[#6B645A] mt-1 truncate">
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
          className="bg-[#FBF9F4] border border-[#E4DED2] rounded-[6px] p-4 flex flex-col justify-between cursor-pointer hover:border-[#1F1B16] transition-colors"
        >
          <span className="text-[13px] font-medium text-[#6B645A]">Tasks</span>
          <div className="mt-2">
            <div className="editorial-stat-num">
              {openTasks.length}
            </div>
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
            <div className="editorial-stat-num">
              Level {overall.level}
            </div>
            <div className="text-[12px] text-[#6B645A] mt-1 truncate tabular-nums">
              {totalXp.toLocaleString()} Total XP
            </div>
          </div>
        </div>

      </div>

      {/* Main Content Columns: Routine Snapshot + Due Soon Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Routine Snapshot */}
        <div className="bg-[#FBF9F4] border border-[#E4DED2] rounded-[6px] p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#E4DED2]">
              <h3 className="font-serif text-[18px] font-normal text-[#1F1B16]">Today's Routine</h3>
              <span className="text-[12px] tabular-nums text-[#6B645A] px-2 py-0.5 rounded-[4px] bg-[#EFEAE0] border border-[#E4DED2]">
                {completedNonNegotiables} of {totalNonNegotiables} done
              </span>
            </div>

            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between p-3 rounded-[6px] bg-[#F6F2EA] border border-[#E4DED2] text-[13px]">
                <span className="text-[#1F1B16]">Daily Prayers (Salah)</span>
                <span className="font-medium tabular-nums text-[#1F1B16]">{prayersDone} / 5</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-[6px] bg-[#F6F2EA] border border-[#E4DED2] text-[13px]">
                <span className="text-[#1F1B16]">Habits & Disciplines</span>
                <span className="font-medium tabular-nums text-[#1F1B16]">{habitsDone} / {activeHabits.length}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-[6px] bg-[#F6F2EA] border border-[#E4DED2] text-[13px]">
                <span className="text-[#1F1B16]">Movement & Conditioning</span>
                <span className={`font-medium ${todayRecord?.workoutCompleted ? 'text-[#3F6B4F]' : 'text-[#6B645A]'}`}>
                  {todayRecord?.workoutCompleted ? 'Completed' : 'Pending'}
                </span>
              </div>
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
              Open Routine
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
                tasksDueSoon.slice(0, 3).map((task) => {
                  const isOverdue = task.dueDate! < todayStr;
                  return (
                    <div
                      key={task.id}
                      onClick={() => {
                        sfx.playClick();
                        onNavigate('tasks');
                      }}
                      className="p-3 rounded-[6px] border border-[#E4DED2] hover:border-[#1F1B16] bg-[#FBF9F4] transition-colors cursor-pointer flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <span className="text-[14px] font-medium text-[#1F1B16] truncate block">
                          {task.title}
                        </span>
                        <span className={`text-[12px] tabular-nums flex items-center gap-1 mt-0.5 ${
                          isOverdue ? 'text-[#9C3D2A] font-medium' : 'text-[#6B645A]'
                        }`}>
                          {isOverdue && <AlertCircle className="w-3 h-3 text-[#9C3D2A]" />}
                          <span>{isOverdue ? `Overdue (${task.dueDate})` : `Due: ${task.dueDate}`}</span>
                        </span>
                      </div>
                      <span className="px-1.5 py-0.5 rounded-[4px] text-[10px] font-medium bg-[#EFEAE0] text-[#6B645A] border border-[#E4DED2] shrink-0">
                        {task.pillar}
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
