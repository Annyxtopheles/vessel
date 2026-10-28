import React from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { sfx } from '../utils/audio';
import { formatHumanDate, getTodayLocalDateStr } from '../utils/date';

interface TopBarProps {
  activeTab: 'rituals' | 'inventory' | 'codex';
  selectedDate: string;
  onShiftDate: (delta: number) => void;
  onResetToday: () => void;
  onOpenAddItem: () => void;
  onOpenAddHabit?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  selectedDate,
  onShiftDate,
  onResetToday,
  onOpenAddItem,
  onOpenAddHabit,
}) => {
  const todayStr = getTodayLocalDateStr();
  const isToday = selectedDate === todayStr;

  const titles: Record<'rituals' | 'inventory' | 'codex', { title: string; subtitle: string }> = {
    rituals: {
      title: 'Daily Cadence & Rituals',
      subtitle: 'Circadian prayer rhythm, daily disciplines, and physical volume',
    },
    inventory: {
      title: 'Life Inventory & Wardrobe',
      subtitle: 'Active loadout, physical possessions, EDC gear, and wishlists',
    },
    codex: {
      title: 'Character Codex',
      subtitle: 'Four life pillars, attribute milestones, and trait progression',
    },
  };

  const current = titles[activeTab];

  return (
    <header className="h-14 border-b border-[#1f222b] bg-[#0d0e12]/95 backdrop-blur-md sticky top-0 z-20 px-6 flex items-center justify-between">
      {/* Left: View Title & Breadcrumb (Pinned position) */}
      <div className="flex items-center gap-3 min-w-0">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-xs text-white tracking-tight">
              {current.title}
            </span>
          </div>
          <p className="text-[11px] text-[#8a8f98] truncate hidden sm:block">
            {current.subtitle}
          </p>
        </div>
      </div>

      {/* Right: Contextual Controls (Pinned right position) */}
      <div className="flex items-center gap-2.5">
        {activeTab === 'rituals' && (
          <>
            {/* Date Navigator */}
            <div className="flex items-center bg-[#12141a] border border-[#20232c] rounded-lg p-0.5 text-xs">
              <button
                onClick={() => {
                  sfx.playClick();
                  onShiftDate(-1);
                }}
                className="p-1 rounded text-[#8a8f98] hover:text-white hover:bg-[#1a1d26] transition-colors"
                title="Previous Day"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              <span className="px-2.5 py-0.5 font-mono text-[11px] text-[#f3f4f6]">
                {formatHumanDate(selectedDate)}
              </span>

              <button
                onClick={() => {
                  sfx.playClick();
                  onShiftDate(1);
                }}
                className="p-1 rounded text-[#8a8f98] hover:text-white hover:bg-[#1a1d26] transition-colors"
                title="Next Day"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {!isToday && (
              <button
                onClick={() => {
                  sfx.playClick();
                  onResetToday();
                }}
                className="px-2.5 py-1 rounded-md text-[11px] font-mono bg-[#161824] hover:bg-[#1f2233] text-[#c7d2fe] border border-[#2d3148] transition-colors"
              >
                Jump to Today
              </button>
            )}

            {onOpenAddHabit && (
              <button
                onClick={() => {
                  sfx.playClick();
                  onOpenAddHabit();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#5e6ad2] hover:bg-[#4f56e9] text-white text-xs font-medium shadow-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Discipline</span>
              </button>
            )}
          </>
        )}

        {activeTab === 'inventory' && (
          <button
            onClick={() => {
              sfx.playClick();
              onOpenAddItem();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#5e6ad2] hover:bg-[#4f56e9] text-white text-xs font-medium shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Item</span>
          </button>
        )}
      </div>
    </header>
  );
};
