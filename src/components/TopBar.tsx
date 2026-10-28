import React, { useState, useRef, useEffect } from 'react';
import { Plus, Search, ChevronLeft, ChevronRight, Settings, X, Package, CheckSquare, Target, Check, Compass } from 'lucide-react';
import { sfx } from '../utils/audio';
import { formatHumanDate, getTodayLocalDateStr } from '../utils/date';
import type { InventoryItem, CustomHabit, SkillNode, AppSettings, Quest } from '../types';

interface TopBarProps {
  activeTab: 'rituals' | 'inventory' | 'quests' | 'codex';
  selectedDate: string;
  onShiftDate: (delta: number) => void;
  onResetToday: () => void;
  onOpenAddItem: () => void;
  onOpenAddQuest?: () => void;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  items?: InventoryItem[];
  habits?: CustomHabit[];
  skills?: SkillNode[];
  quests?: Quest[];
  onSelectTab?: (tab: 'inventory' | 'rituals' | 'quests' | 'codex') => void;
  onInspectItem?: (item: InventoryItem) => void;
  onSelectQuest?: (quest: Quest) => void;
  settings?: AppSettings;
  onUpdateSettings?: (updated: Partial<AppSettings>) => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  selectedDate,
  onShiftDate,
  onResetToday,
  onOpenAddItem,
  onOpenAddQuest,
  searchQuery = '',
  onSearchChange,
  items = [],
  habits = [],
  skills = [],
  quests = [],
  onSelectTab,
  onInspectItem,
  onSelectQuest,
  settings = { currencySymbol: '$', maxEncumbranceKg: 12.0 },
  onUpdateSettings,
}) => {
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [tempCurrency, setTempCurrency] = useState(settings.currencySymbol || '$');
  const [tempMaxWeight, setTempMaxWeight] = useState(String(settings.maxEncumbranceKg || 12.0));
  const [tempUnitSystem, setTempUnitSystem] = useState<'metric' | 'imperial'>(settings.unitSystem || 'metric');
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const todayStr = getTodayLocalDateStr();
  const isToday = selectedDate === todayStr;

  useEffect(() => {
    setTempCurrency(settings.currencySymbol || '$');
    setTempMaxWeight(String(settings.maxEncumbranceKg || 12.0));
    setTempUnitSystem(settings.unitSystem || 'metric');
  }, [settings]);

  // Click outside search popover
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const tabConfig: Record<'rituals' | 'inventory' | 'quests' | 'codex', { breadcrumb: string; title: string }> = {
    inventory: {
      breadcrumb: 'Personal Inventory / Wardrobe & Relics',
      title: 'Life Inventory',
    },
    rituals: {
      breadcrumb: 'Daily Practice / Circadian Anchors',
      title: 'Daily Cadence',
    },
    quests: {
      breadcrumb: 'Tactical Objectives / Actionable Milestones',
      title: 'Active Quests',
    },
    codex: {
      breadcrumb: 'Character System / Four Life Pillars',
      title: 'Character Codex',
    },
  };

  const current = tabConfig[activeTab];

  // Global search filtering
  const cleanQ = searchQuery.trim().toLowerCase();
  const matchingItems = cleanQ
    ? items.filter(
        i =>
          i.name.toLowerCase().includes(cleanQ) ||
          i.subCategory.toLowerCase().includes(cleanQ) ||
          (i.location && i.location.toLowerCase().includes(cleanQ))
      ).slice(0, 4)
    : [];

  const matchingHabits = cleanQ
    ? habits.filter(
        h =>
          h.name.toLowerCase().includes(cleanQ) ||
          (h.description && h.description.toLowerCase().includes(cleanQ))
      ).slice(0, 3)
    : [];

  const matchingQuests = cleanQ
    ? quests.filter(
        q =>
          !q.deletedAt &&
          (q.title.toLowerCase().includes(cleanQ) ||
           q.description.toLowerCase().includes(cleanQ))
      ).slice(0, 3)
    : [];

  const matchingSkills = cleanQ
    ? skills.filter(
        s =>
          s.title.toLowerCase().includes(cleanQ) ||
          s.description.toLowerCase().includes(cleanQ) ||
          s.requirement.toLowerCase().includes(cleanQ)
      ).slice(0, 3)
    : [];

  const hasSearchResults = cleanQ.length > 0;
  const totalResults = matchingItems.length + matchingHabits.length + matchingQuests.length + matchingSkills.length;

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdateSettings) {
      onUpdateSettings({
        currencySymbol: tempCurrency.trim() || '$',
        maxEncumbranceKg: Math.max(1, parseFloat(tempMaxWeight) || 12.0),
        unitSystem: tempUnitSystem,
      });
    }
    sfx.playClick();
    setIsSettingsOpen(false);
  };

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

      {/* Right: Search + Date Selector + Settings + Primary Action */}
      <div className="flex items-center gap-3">
        {/* On Rituals, show date navigator */}
        {activeTab === 'rituals' && (
          <div className="flex items-center bg-[#F4F4F6] border border-[#ECECF0] rounded-xl p-1 text-xs">
            <button
              onClick={() => {
                sfx.playClick();
                onShiftDate(-1);
              }}
              className="p-1.5 rounded-lg text-[#6B6B76] hover:text-[#111113] hover:bg-white transition-colors cursor-pointer"
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
              className="p-1.5 rounded-lg text-[#6B6B76] hover:text-[#111113] hover:bg-white transition-colors cursor-pointer"
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
                className="ml-1 px-2.5 py-1 rounded-lg text-xs bg-white text-[#0891B2] font-semibold shadow-xs cursor-pointer"
              >
                Today
              </button>
            )}
          </div>
        )}

        {/* Global Search Bar */}
        {onSearchChange && (
          <div ref={searchContainerRef} className="relative w-64 md:w-80">
            <Search className="w-4 h-4 text-[#9A9AA5] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onFocus={() => setIsSearchFocused(true)}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search everything…"
              className="ship-input ship-input-search w-full pr-3.5 text-sm py-2"
            />

            {/* Global Search Popover Dropdown */}
            {isSearchFocused && hasSearchResults && (
              <div className="absolute right-0 left-0 mt-2 bg-white border border-[#ECECF0] rounded-2xl shadow-xl overflow-hidden z-50 p-2 text-left">
                {totalResults === 0 ? (
                  <div className="p-4 text-center text-xs text-[#9A9AA5]">
                    No possessions, habits, or perks match "{searchQuery}"
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto p-1">
                    {/* Items Section */}
                    {matchingItems.length > 0 && (
                      <div>
                        <div className="text-[11px] font-bold uppercase tracking-wider text-[#9A9AA5] px-2.5 py-1 flex items-center gap-1.5">
                          <Package className="w-3.5 h-3.5 text-[#0891B2]" />
                          <span>Possessions ({matchingItems.length})</span>
                        </div>
                        <div className="space-y-1 mt-1">
                          {matchingItems.map(item => (
                            <button
                              key={item.id}
                              onClick={() => {
                                sfx.playClick();
                                setIsSearchFocused(false);
                                if (onSelectTab) onSelectTab('inventory');
                                if (onInspectItem) onInspectItem(item);
                              }}
                              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl hover:bg-[#F4F4F6] text-left transition-colors cursor-pointer"
                            >
                              <div className="truncate mr-2">
                                <span className="text-sm font-semibold text-[#111113] block truncate">
                                  {item.name}
                                </span>
                                <span className="text-xs text-[#6B6B76]">
                                  {item.subCategory} • {item.weightKg} kg
                                </span>
                              </div>
                              <span className="text-xs font-semibold text-[#0891B2]">
                                {settings.currencySymbol}{item.goldValue}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Habits Section */}
                    {matchingHabits.length > 0 && (
                      <div>
                        <div className="text-[11px] font-bold uppercase tracking-wider text-[#9A9AA5] px-2.5 py-1 flex items-center gap-1.5">
                          <CheckSquare className="w-3.5 h-3.5 text-[#16A34A]" />
                          <span>Habits ({matchingHabits.length})</span>
                        </div>
                        <div className="space-y-1 mt-1">
                          {matchingHabits.map(habit => (
                            <button
                              key={habit.id}
                              onClick={() => {
                                sfx.playClick();
                                setIsSearchFocused(false);
                                if (onSelectTab) onSelectTab('rituals');
                              }}
                              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl hover:bg-[#F4F4F6] text-left transition-colors cursor-pointer"
                            >
                              <span className="text-sm font-semibold text-[#111113] truncate">
                                {habit.name}
                              </span>
                              <span className="text-xs px-2 py-0.5 rounded-md bg-[#F4F4F6] text-[#6B6B76] font-medium">
                                {habit.attribute}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Quests Section */}
                    {matchingQuests.length > 0 && (
                      <div>
                        <div className="text-[11px] font-bold uppercase tracking-wider text-[#9A9AA5] px-2.5 py-1 flex items-center gap-1.5">
                          <Compass className="w-3.5 h-3.5 text-[#0891B2]" />
                          <span>Quests ({matchingQuests.length})</span>
                        </div>
                        <div className="space-y-1 mt-1">
                          {matchingQuests.map(quest => (
                            <button
                              key={quest.id}
                              onClick={() => {
                                sfx.playClick();
                                setIsSearchFocused(false);
                                if (onSelectTab) onSelectTab('quests');
                                if (onSelectQuest) onSelectQuest(quest);
                              }}
                              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl hover:bg-[#F4F4F6] text-left transition-colors cursor-pointer"
                            >
                              <div className="truncate mr-2">
                                <span className="text-sm font-semibold text-[#111113] block truncate">
                                  {quest.title}
                                </span>
                                <span className="text-xs text-[#6B6B76] truncate block">
                                  {quest.description}
                                </span>
                              </div>
                              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-[#E6F7F9] text-[#0891B2]">
                                {quest.difficulty}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Codex Section */}
                    {matchingSkills.length > 0 && (
                      <div>
                        <div className="text-[11px] font-bold uppercase tracking-wider text-[#9A9AA5] px-2.5 py-1 flex items-center gap-1.5">
                          <Target className="w-3.5 h-3.5 text-[#7C6CF0]" />
                          <span>Codex Perks ({matchingSkills.length})</span>
                        </div>
                        <div className="space-y-1 mt-1">
                          {matchingSkills.map(skill => (
                            <button
                              key={skill.id}
                              onClick={() => {
                                sfx.playClick();
                                setIsSearchFocused(false);
                                if (onSelectTab) onSelectTab('codex');
                              }}
                              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl hover:bg-[#F4F4F6] text-left transition-colors cursor-pointer"
                            >
                              <div className="truncate mr-2">
                                <span className="text-sm font-semibold text-[#111113] block truncate">
                                  {skill.title}
                                </span>
                                <span className="text-xs text-[#6B6B76] truncate block">
                                  {skill.requirement}
                                </span>
                              </div>
                              <span className="text-xs font-semibold text-[#0891B2]">
                                Tier {skill.tier}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Settings Button */}
        <button
          onClick={() => {
            sfx.playClick();
            setIsSettingsOpen(true);
          }}
          className="p-2 rounded-xl bg-white border border-[#ECECF0] text-[#6B6B76] hover:text-[#111113] hover:bg-[#F4F4F6] transition-colors cursor-pointer shadow-xs"
          title="App Settings (Currency & Capacity)"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* Primary Action Button */}
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

        {activeTab === 'quests' && onOpenAddQuest && (
          <button
            onClick={() => {
              sfx.playClick();
              onOpenAddQuest();
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0891B2] hover:bg-[#0E7490] text-white text-sm font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Quest</span>
          </button>
        )}
      </div>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div
          onClick={() => setIsSettingsOpen(false)}
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white border border-[#ECECF0] rounded-2xl shadow-xl p-6 cursor-default animate-in fade-in zoom-in-95"
          >
            <div className="flex items-center justify-between pb-4 border-b border-[#ECECF0] mb-4">
              <div>
                <h3 className="text-base font-semibold text-[#111113]">Vault Settings</h3>
                <p className="text-xs text-[#6B6B76] mt-0.5">Customize currency symbol and carry capacity</p>
              </div>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="p-1.5 rounded-lg text-[#6B6B76] hover:text-[#111113] hover:bg-[#F4F4F6]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#6B6B76] uppercase tracking-wider mb-1.5">
                  Currency Symbol
                </label>
                <div className="flex items-center gap-2 mb-2">
                  {['$', '€', '£', '৳', '¥', 'CHF'].map(sym => (
                    <button
                      key={sym}
                      type="button"
                      onClick={() => setTempCurrency(sym)}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                        tempCurrency === sym
                          ? 'bg-[#E6F7F9] border-[#0891B2] text-[#0891B2]'
                          : 'bg-white border-[#ECECF0] text-[#6B6B76] hover:border-[#BEBEC6]'
                      }`}
                    >
                      {sym}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  maxLength={5}
                  value={tempCurrency}
                  onChange={(e) => setTempCurrency(e.target.value)}
                  placeholder="$"
                  className="ship-input w-full px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6B6B76] uppercase tracking-wider mb-1.5">
                  Carry Load Capacity (kg)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  max="100"
                  value={tempMaxWeight}
                  onChange={(e) => setTempMaxWeight(e.target.value)}
                  placeholder="12.0"
                  className="ship-input w-full px-3 py-2 text-sm"
                />
                <span className="text-[11px] text-[#9A9AA5] mt-1 block">
                  Default: 12.0 kg. Used for today's carry load capacity indicator.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6B6B76] uppercase tracking-wider mb-1.5">
                  Body Measurements Unit Preference
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTempUnitSystem('metric')}
                    className={`px-3 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                      tempUnitSystem === 'metric'
                        ? 'bg-[#E6F7F9] border-[#0891B2] text-[#0891B2]'
                        : 'bg-white border-[#ECECF0] text-[#6B6B76] hover:border-[#BEBEC6]'
                    }`}
                  >
                    Metric (kg / cm)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTempUnitSystem('imperial')}
                    className={`px-3 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                      tempUnitSystem === 'imperial'
                        ? 'bg-[#E6F7F9] border-[#0891B2] text-[#0891B2]'
                        : 'bg-white border-[#ECECF0] text-[#6B6B76] hover:border-[#BEBEC6]'
                    }`}
                  >
                    Imperial (lbs / in)
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-[#ECECF0] flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#6B6B76] hover:bg-[#F4F4F6]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-[#0891B2] hover:bg-[#0E7490] text-white shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Settings</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};
