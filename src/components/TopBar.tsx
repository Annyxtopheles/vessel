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
    <header className="h-14 border-b border-[#1a1d26] bg-[#090b0e]/95 backdrop-blur-md sticky top-0 z-20 px-6 flex items-center justify-between">
      {/* Left: View Title & Breadcrumb */}
      <div className="flex items-center gap-3 min-w-0">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0ea5e9]" />
            <span className="font-semibold text-xs text-white tracking-tight">
              {current.title}
            </span>
          </div>
          <p className="text-[11px] text-[#94a3b8] truncate hidden sm:block mt-0.5">
            {current.subtitle}
          </p>
        </div>
      </div>

      {/* Right: Contextual Controls */}
      <div className="flex items-center gap-2.5">
        {activeTab === 'rituals' && (
          <>
            {/* Date Navigator */}
            <div className="flex items-center bg-[#10131a] border border-[#1d222e] rounded-lg p-0.5 text-xs">
              <button
                onClick={() => {
                  sfx.playClick();
                  onShiftDate(-1);
                }}
                className="p-1 rounded text-[#94a3b8] hover:text-white hover:bg-[#181d29] transition-colors"
                title="Previous Day"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              <span className="px-3 py-0.5 text-xs text-[#f1f5f9] font-medium">
                {formatHumanDate(selectedDate)}
              </span>

              <button
                onClick={() => {
                  sfx.playClick();
                  onShiftDate(1);
                }}
                className="p-1 rounded text-[#94a3b8] hover:text-white hover:bg-[#181d29] transition-colors"
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
                className="px-2.5 py-1 rounded-md text-xs bg-[#0c1f2e] hover:bg-[#0e2a3f] text-[#38bdf8] border border-[#075985]/40 transition-colors font-medium"
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
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-semibold shadow-xs transition-colors"
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
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Item</span>
          </button>
        )}
      </div>
    </header>
  );
};
