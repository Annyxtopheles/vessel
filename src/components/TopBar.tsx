import React from 'react';
import { Plus, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { sfx } from '../utils/audio';
import { formatHumanDate, getTodayLocalDateStr } from '../utils/date';

interface TopBarProps {
  activeTab: 'rituals' | 'inventory' | 'codex';
  selectedDate: string;
  onShiftDate: (delta: number) => void;
  onResetToday: () => void;
  onOpenAddItem: () => void;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  selectedDate,
  onShiftDate,
  onResetToday,
  onOpenAddItem,
  searchQuery = '',
  onSearchChange,
}) => {
  const todayStr = getTodayLocalDateStr();
  const isToday = selectedDate === todayStr;

  const tabConfig: Record<'rituals' | 'inventory' | 'codex', { breadcrumb: string; title: string }> = {
    inventory: {
      breadcrumb: 'Personal Inventory / Wardrobe & Relics',
      title: 'Life Inventory',
    },
    rituals: {
      breadcrumb: 'Daily Practice / Ciradian Anchors',
      title: 'Daily Cadence',
    },
    codex: {
      breadcrumb: 'Character System / Four Life Pillars',
      title: 'Character Codex',
    },
  };

  const current = tabConfig[activeTab];

  return (
    <header className="bg-white border-b border-[#ECECF0] px-8 py-5 flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 z-20">
      {/* Left: Eyebrow Breadcrumb + Large Page Title */}
      <div>
        <div className="text-[13px] text-[#6B6B76] font-medium mb-1">
          {current.breadcrumb}
        </div>
        <h1 className="text-[28px] leading-[32px] font-semibold text-[#111113] tracking-tight">
          {current.title}
        </h1>
      </div>

      {/* Right: Search + Primary Action */}
      <div className="flex items-center gap-3">
        {/* On Rituals, show date navigator */}
        {activeTab === 'rituals' && (
          <div className="flex items-center bg-[#F4F4F6] border border-[#ECECF0] rounded-xl p-1 text-xs">
            <button
              onClick={() => {
                sfx.playClick();
                onShiftDate(-1);
              }}
              className="p-1.5 rounded-lg text-[#6B6B76] hover:text-[#111113] hover:bg-white transition-colors"
              title="Previous Day"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-3 text-xs text-[#111113] font-semibold">
              {formatHumanDate(selectedDate)}
            </span>

            <button
              onClick={() => {
                sfx.playClick();
                onShiftDate(1);
              }}
              className="p-1.5 rounded-lg text-[#6B6B76] hover:text-[#111113] hover:bg-white transition-colors"
              title="Next Day"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {!isToday && (
              <button
                onClick={() => {
                  sfx.playClick();
                  onResetToday();
                }}
                className="ml-1 px-2.5 py-1 rounded-lg text-xs bg-white text-[#0891B2] font-semibold shadow-xs"
              >
                Today
              </button>
            )}
          </div>
        )}

        {/* Search Bar (if search handler provided) */}
        {onSearchChange && (
          <div className="relative w-64 md:w-72">
            <Search className="w-4 h-4 text-[#9A9AA5] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search possessions, tags..."
              className="ship-input ship-input-search w-full pr-3.5 text-sm py-2"
            />
          </div>
        )}

        {/* Primary Action Button (Single Accent Button on Screen) */}
        {activeTab === 'inventory' && (
          <button
            onClick={() => {
              sfx.playClick();
              onOpenAddItem();
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0891B2] hover:bg-[#0E7490] text-white text-sm font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Item</span>
          </button>
        )}
      </div>
    </header>
  );
};
