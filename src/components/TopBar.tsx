import React, { useState, useRef, useEffect } from 'react';
import type { InventoryItem, CustomHabit, SkillNode, AppSettings, Quest, NumberGroupingOption } from '../types';
import type { NavTab } from './Sidebar';
import { 
  Search, 
  Settings, 
  Plus, 
  X, 
  Check, 
  ChevronLeft, 
  ChevronRight, 
  Package, 
  CalendarCheck2, 
  CheckSquare, 
  Target,
  Eye,
  EyeOff,
  Archive,
  Upload
} from 'lucide-react';
import { sfx } from '../utils/audio';

interface TopBarProps {
  activeTab: NavTab;
  selectedDate: string;
  onShiftDate: (delta: number) => void;
  onResetToday: () => void;
  onOpenAddItem: () => void;
  onOpenAddTask?: () => void;
  onOpenImportItems?: () => void;
  onOpenBackup?: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  items: InventoryItem[];
  habits: CustomHabit[];
  skills: SkillNode[];
  quests?: Quest[];
  onSelectTab: (tab: NavTab) => void;
  onInspectItem: (item: InventoryItem) => void;
  onSelectTask?: (task: Quest) => void;
  settings: AppSettings;
  onUpdateSettings?: (updated: Partial<AppSettings>) => void;
  privacyMode?: boolean;
  onTogglePrivacyMode?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  selectedDate,
  onShiftDate,
  onResetToday,
  onOpenAddItem,
  onOpenAddTask,
  onOpenImportItems,
  onOpenBackup,
  searchQuery,
  onSearchChange,
  items,
  habits,
  skills,
  quests = [],
  onSelectTab,
  onInspectItem,
  onSelectTask,
  settings,
  onUpdateSettings,
  privacyMode = false,
  onTogglePrivacyMode,
}) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [tempCurrency, setTempCurrency] = useState(settings.currencySymbol || '৳');
  const [tempNumberGrouping, setTempNumberGrouping] = useState<NumberGroupingOption>(settings.numberGrouping || 'bangladeshi');
  const [tempUnitSystem, setTempUnitSystem] = useState<'metric' | 'imperial'>(settings.unitSystem || 'metric');
  const [tempTargetWeight, setTempTargetWeight] = useState(settings.targetWeightKg !== undefined ? String(settings.targetWeightKg) : '');

  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Sync settings when opened
  useEffect(() => {
    setTempCurrency(settings.currencySymbol || '৳');
    setTempNumberGrouping(settings.numberGrouping || 'bangladeshi');
    setTempUnitSystem(settings.unitSystem || 'metric');
    setTempTargetWeight(settings.targetWeightKg !== undefined ? String(settings.targetWeightKg) : '');
  }, [settings, isSettingsOpen]);

  // Click outside search container to close results
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const tabTitles: Record<NavTab, string> = {
    overview: 'Overview',
    inventory: 'Inventory',
    routine: 'Routine',
    tasks: 'Tasks',
    'bucket-list': 'Bucket List',
    money: 'Money',
    character: 'Character',
  };

  const currentTitle = tabTitles[activeTab] || 'Vessel';

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

  const matchingTasks = cleanQ
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
  const totalResults = matchingItems.length + matchingHabits.length + matchingTasks.length + matchingSkills.length;

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdateSettings) {
      onUpdateSettings({
        currencySymbol: tempCurrency.trim() || '৳',
        numberGrouping: tempNumberGrouping,
        unitSystem: tempUnitSystem,
        targetWeightKg: tempTargetWeight.trim() ? parseFloat(tempTargetWeight) : undefined,
      });
    }
    sfx.playClick();
    setIsSettingsOpen(false);
  };

  return (
    <header className="bg-white border-b border-[#ECECF0] px-8 py-5 flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 z-20">
      {/* Left: Plain Page Title (No breadcrumb above title) */}
      <div>
        <h1 className="text-[28px] leading-[32px] font-semibold text-[#111113] tracking-tight">
          {currentTitle}
        </h1>
      </div>

      {/* Right: Search + Date Selector + Settings + Primary Action */}
      <div className="flex items-center gap-3">
        {/* On Routine, show date navigator */}
        {activeTab === 'routine' && (
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
            <button
              onClick={() => {
                sfx.playClick();
                onResetToday();
              }}
              className="px-2.5 py-1 font-semibold text-[#111113] hover:text-[#0891B2] transition-colors cursor-pointer"
              title="Jump to Today"
            >
              {selectedDate}
            </button>
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
          </div>
        )}

        {/* Global Omnisearch Bar */}
        <div ref={searchContainerRef} className="relative w-64 md:w-80">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9A9AA5] pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                onSearchChange(e.target.value);
                setIsSearchFocused(true);
              }}
              onFocus={() => setIsSearchFocused(true)}
              placeholder="Search everything…"
              className="ship-input ship-input-search py-2 pl-9 pr-8 text-xs w-full shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  onSearchChange('');
                  setIsSearchFocused(false);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9A9AA5] hover:text-[#111113] p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Omnisearch Floating Results Dropdown */}
          {isSearchFocused && hasSearchResults && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-[#ECECF0] rounded-2xl shadow-xl overflow-hidden z-50 max-h-[460px] overflow-y-auto animate-in fade-in zoom-in-95">
              <div className="p-3 border-b border-[#ECECF0] bg-[#F4F4F6]/60 flex items-center justify-between text-xs">
                <span className="font-semibold text-[#111113]">Search Results</span>
                <span className="text-[11px] text-[#9A9AA5]">{totalResults} matches</span>
              </div>

              {totalResults === 0 ? (
                <div className="p-6 text-center text-xs text-[#9A9AA5]">
                  No items, habits, tasks, or milestones match "{searchQuery}"
                </div>
              ) : (
                <div className="p-2 space-y-3">
                  {/* Items Section */}
                  {matchingItems.length > 0 && (
                    <div>
                      <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#9A9AA5] flex items-center gap-1.5">
                        <Package className="w-3 h-3 text-[#0891B2]" />
                        <span>Inventory Items ({matchingItems.length})</span>
                      </div>
                      <div className="space-y-0.5 mt-1">
                        {matchingItems.map(item => (
                          <div
                            key={item.id}
                            onClick={() => {
                              sfx.playClick();
                              onSelectTab('inventory');
                              onInspectItem(item);
                              setIsSearchFocused(false);
                            }}
                            className="p-2 rounded-xl hover:bg-[#F4F4F6] transition-colors cursor-pointer flex items-center justify-between group"
                          >
                            <div className="min-w-0 pr-2">
                              <span className="text-xs font-semibold text-[#111113] group-hover:text-[#0891B2] truncate block">
                                {item.name}
                              </span>
                              <span className="text-[11px] text-[#9A9AA5] truncate block">
                                {item.subCategory} • {settings.currencySymbol || '$'}{item.goldValue.toLocaleString()}
                              </span>
                            </div>
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-[#ECECF0] text-[#6B6B76] capitalize shrink-0">
                              {item.ownershipStatus || 'owned'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Habits Section */}
                  {matchingHabits.length > 0 && (
                    <div>
                      <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#9A9AA5] flex items-center gap-1.5">
                        <CalendarCheck2 className="w-3 h-3 text-[#16A34A]" />
                        <span>Routines & Habits ({matchingHabits.length})</span>
                      </div>
                      <div className="space-y-0.5 mt-1">
                        {matchingHabits.map(habit => (
                          <div
                            key={habit.id}
                            onClick={() => {
                              sfx.playClick();
                              onSelectTab('routine');
                              setIsSearchFocused(false);
                            }}
                            className="p-2 rounded-xl hover:bg-[#F4F4F6] transition-colors cursor-pointer flex items-center justify-between group"
                          >
                            <div className="min-w-0 pr-2">
                              <span className="text-xs font-semibold text-[#111113] group-hover:text-[#0891B2] truncate block">
                                {habit.name}
                              </span>
                              <span className="text-[11px] text-[#9A9AA5] truncate block">
                                {habit.description || 'Daily discipline'}
                              </span>
                            </div>
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-[#ECECF0] text-[#6B6B76] shrink-0">
                              {habit.attribute}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tasks Section */}
                  {matchingTasks.length > 0 && (
                    <div>
                      <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#9A9AA5] flex items-center gap-1.5">
                        <CheckSquare className="w-3 h-3 text-[#0891B2]" />
                        <span>Tasks ({matchingTasks.length})</span>
                      </div>
                      <div className="space-y-0.5 mt-1">
                        {matchingTasks.map(task => (
                          <div
                            key={task.id}
                            onClick={() => {
                              sfx.playClick();
                              onSelectTab('tasks');
                              if (onSelectTask) onSelectTask(task);
                              setIsSearchFocused(false);
                            }}
                            className="p-2 rounded-xl hover:bg-[#F4F4F6] transition-colors cursor-pointer flex items-center justify-between group"
                          >
                            <div className="min-w-0 pr-2">
                              <span className="text-xs font-semibold text-[#111113] group-hover:text-[#0891B2] truncate block">
                                {task.title}
                              </span>
                              <span className="text-[11px] text-[#9A9AA5] truncate block">
                                {task.pillar} • {task.difficulty}
                              </span>
                            </div>
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-[#ECECF0] text-[#6B6B76] capitalize shrink-0">
                              {task.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Milestones Section */}
                  {matchingSkills.length > 0 && (
                    <div>
                      <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#9A9AA5] flex items-center gap-1.5">
                        <Target className="w-3 h-3 text-[#DC2626]" />
                        <span>Milestones ({matchingSkills.length})</span>
                      </div>
                      <div className="space-y-0.5 mt-1">
                        {matchingSkills.map(skill => (
                          <div
                            key={skill.id}
                            onClick={() => {
                              sfx.playClick();
                              onSelectTab('character');
                              setIsSearchFocused(false);
                            }}
                            className="p-2 rounded-xl hover:bg-[#F4F4F6] transition-colors cursor-pointer flex items-center justify-between group"
                          >
                            <div className="min-w-0 pr-2">
                              <span className="text-xs font-semibold text-[#111113] group-hover:text-[#0891B2] truncate block">
                                {skill.title}
                              </span>
                              <span className="text-[11px] text-[#9A9AA5] truncate block">
                                {skill.requirement}
                              </span>
                            </div>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                              skill.unlocked ? 'bg-[#E6F6EC] text-[#16A34A]' : 'bg-[#ECECF0] text-[#6B6B76]'
                            } shrink-0`}>
                              {skill.unlocked ? 'Unlocked' : 'In Progress'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* App-wide Privacy Mode Toggle Button */}
        {onTogglePrivacyMode && (
          <button
            onClick={() => {
              sfx.playClick();
              onTogglePrivacyMode();
            }}
            className={`p-2 rounded-xl border text-xs transition-colors cursor-pointer shadow-xs ${
              privacyMode
                ? 'bg-[#E6F7F9] text-[#0891B2] border-[#0891B2]/40'
                : 'bg-white border-[#ECECF0] text-[#6B6B76] hover:text-[#111113] hover:bg-[#F4F4F6]'
            }`}
            title={privacyMode ? 'Privacy Mode Active (Click to Reveal)' : 'Enable Privacy Mode (Blur Sensitive Data)'}
          >
            {privacyMode ? <EyeOff className="w-4 h-4 text-[#0891B2]" /> : <Eye className="w-4 h-4" />}
          </button>
        )}

        {/* Settings Button */}
        <button
          onClick={() => {
            sfx.playClick();
            setIsSettingsOpen(true);
          }}
          className="p-2 rounded-xl bg-white border border-[#ECECF0] text-[#6B6B76] hover:text-[#111113] hover:bg-[#F4F4F6] transition-colors cursor-pointer shadow-xs"
          title="Settings"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* Primary Action Button */}
        {activeTab === 'inventory' && (
          <div className="flex items-center gap-2">
            {onOpenImportItems && (
              <button
                onClick={() => {
                  sfx.playClick();
                  onOpenImportItems();
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-[#ECECF0] hover:bg-[#F4F4F6] text-[#111113] text-sm font-semibold shadow-xs transition-colors cursor-pointer"
                title="Import Items (JSON / CSV)"
              >
                <Upload className="w-4 h-4 text-[#6B6B76]" />
                <span>Import</span>
              </button>
            )}
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
          </div>
        )}

        {activeTab === 'tasks' && onOpenAddTask && (
          <button
            onClick={() => {
              sfx.playClick();
              onOpenAddTask();
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0891B2] hover:bg-[#0E7490] text-white text-sm font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Task</span>
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
                <h3 className="text-base font-semibold text-[#111113]">Settings</h3>
                <p className="text-xs text-[#6B6B76] mt-0.5">Customize currency and biometrics units</p>
              </div>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="p-1.5 rounded-lg text-[#6B6B76] hover:text-[#111113] hover:bg-[#F4F4F6] cursor-pointer"
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
                  {['৳', '$', '€', '£', '¥', 'CHF'].map(sym => (
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
                  placeholder="৳"
                  className="ship-input w-full px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6B6B76] uppercase tracking-wider mb-1.5">
                  Number Grouping
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTempNumberGrouping('bangladeshi')}
                    className={`px-3 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer text-left ${
                      tempNumberGrouping === 'bangladeshi'
                        ? 'bg-[#E6F7F9] border-[#0891B2] text-[#0891B2]'
                        : 'bg-white border-[#ECECF0] text-[#6B6B76] hover:border-[#BEBEC6]'
                    }`}
                  >
                    <div>Bangladeshi</div>
                    <div className="text-[10px] font-normal opacity-80">1,00,000 (Lakh/Crore)</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTempNumberGrouping('international')}
                    className={`px-3 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer text-left ${
                      tempNumberGrouping === 'international'
                        ? 'bg-[#E6F7F9] border-[#0891B2] text-[#0891B2]'
                        : 'bg-white border-[#ECECF0] text-[#6B6B76] hover:border-[#BEBEC6]'
                    }`}
                  >
                    <div>International</div>
                    <div className="text-[10px] font-normal opacity-80">100,000 (Standard)</div>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6B6B76] uppercase tracking-wider mb-1.5">
                  Target Body Weight (kg, optional)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="20"
                  max="300"
                  value={tempTargetWeight}
                  onChange={(e) => setTempTargetWeight(e.target.value)}
                  placeholder="e.g. 73.0"
                  className="ship-input w-full px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6B6B76] uppercase tracking-wider mb-1.5">
                  Measurements Unit
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

              {onOpenBackup && (
                <div className="pt-2 border-t border-[#ECECF0]">
                  <label className="block text-xs font-semibold text-[#6B6B76] uppercase tracking-wider mb-1.5">
                    Data & Storage
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsSettingsOpen(false);
                      onOpenBackup();
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-xl border border-[#ECECF0] hover:bg-[#F4F4F6] text-xs font-medium text-[#111113] transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Archive className="w-4 h-4 text-[#0891B2]" />
                      <span>Backups & Folder Auto-Save</span>
                    </div>
                    <span className="text-[#6B6B76]">Manage →</span>
                  </button>
                </div>
              )}

              <div className="pt-4 border-t border-[#ECECF0] flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#6B6B76] hover:bg-[#F4F4F6] cursor-pointer"
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
