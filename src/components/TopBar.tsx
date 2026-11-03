import React, { useState, useRef, useEffect } from 'react';
import type { InventoryItem, CustomHabit, SkillNode, AppSettings, Quest, NumberGroupingOption, BucketListEntry, Account } from '../types';
import type { NavTab } from './Sidebar';
import { 
  Search, 
  Settings, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Package, 
  CalendarCheck2, 
  CheckSquare, 
  Target,
  Eye,
  EyeOff,
  Archive,
  Compass,
  Landmark,
} from 'lucide-react';
import { sfx } from '../utils/audio';

interface TopBarProps {
  activeTab: NavTab;
  selectedDate: string;
  onShiftDate: (delta: number) => void;
  onResetToday: () => void;
  onOpenAddItem?: () => void;
  onOpenAddTask?: () => void;
  onOpenImportItems?: () => void;
  onOpenBackup?: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  items: InventoryItem[];
  habits: CustomHabit[];
  skills: SkillNode[];
  quests?: Quest[];
  bucketListEntries?: BucketListEntry[];
  accounts?: Account[];
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
  onOpenAddTask,
  onOpenBackup,
  searchQuery,
  onSearchChange,
  items,
  habits,
  skills,
  quests = [],
  bucketListEntries = [],
  accounts = [],
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
  const [tempUnitSystem, setTempUnitSystem] = useState<'metric' | 'imperial' | 'hybrid'>(settings.unitSystem || 'hybrid');
  const [tempTargetWeight, setTempTargetWeight] = useState(settings.targetWeightKg !== undefined ? String(settings.targetWeightKg) : '85');

  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Sync settings when opened
  useEffect(() => {
    setTempCurrency(settings.currencySymbol || '৳');
    setTempNumberGrouping(settings.numberGrouping || 'bangladeshi');
    setTempUnitSystem(settings.unitSystem || 'hybrid');
    setTempTargetWeight(settings.targetWeightKg !== undefined ? String(settings.targetWeightKg) : '85');
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
          !q.deletedAt && !q.deleted_at &&
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

  const matchingBucketEntries = cleanQ
    ? bucketListEntries.filter(
        b =>
          b.title.toLowerCase().includes(cleanQ) ||
          (b.category && b.category.toLowerCase().includes(cleanQ)) ||
          (b.notes && b.notes.toLowerCase().includes(cleanQ))
      ).slice(0, 3)
    : [];

  const matchingAccounts = cleanQ
    ? accounts.filter(
        a =>
          !a.archived &&
          (a.name.toLowerCase().includes(cleanQ) || a.type.toLowerCase().includes(cleanQ))
      ).slice(0, 3)
    : [];

  const hasSearchResults = cleanQ.length > 0;
  const totalResults =
    matchingItems.length +
    matchingHabits.length +
    matchingTasks.length +
    matchingSkills.length +
    matchingBucketEntries.length +
    matchingAccounts.length;

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
    <header className="bg-[#FFFFFF] border-b border-[#E2E8F0] px-8 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 z-20">
      {/* Left: Modern Page Title (omitted on overview to maintain clean date lead) */}
      <div>
        {activeTab !== 'overview' && (
          <h1 className="text-[26px] leading-tight font-semibold text-[#0F172A] tracking-tight">
            {currentTitle}
          </h1>
        )}
      </div>

      {/* Right: Search + Date Selector + Settings + Primary Action */}
      <div className="flex items-center gap-2.5">
        {/* On Routine, show date navigator */}
        {activeTab === 'routine' && (
          <div className="flex items-center bg-[#F8FAFC] border border-[#E2E8F0] rounded-[6px] p-0.5 text-[13px]">
            <button
              onClick={() => {
                sfx.playClick();
                onShiftDate(-1);
              }}
              className="p-1 rounded-[4px] text-[#64748B] hover:text-[#0F172A] hover:bg-[#FFFFFF] transition-colors cursor-pointer"
              title="Previous Day"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                sfx.playClick();
                onResetToday();
              }}
              className="px-2.5 py-0.5 font-medium text-[#0F172A] hover:text-[#2563EB] transition-colors cursor-pointer tabular-nums"
              title="Jump to Today"
            >
              {selectedDate}
            </button>
            <button
              onClick={() => {
                sfx.playClick();
                onShiftDate(1);
              }}
              className="p-1 rounded-[4px] text-[#64748B] hover:text-[#0F172A] hover:bg-[#FFFFFF] transition-colors cursor-pointer"
              title="Next Day"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Global Omnisearch Bar */}
        <div ref={searchContainerRef} className="relative w-60 md:w-72">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B] pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                onSearchChange(e.target.value);
                setIsSearchFocused(true);
              }}
              onFocus={() => setIsSearchFocused(true)}
              placeholder="Search..."
              className="w-full bg-[#FFFFFF] border border-[#E2E8F0] focus:border-[#0F172A] rounded-[6px] pl-9 pr-3 py-1.5 text-[13px] text-[#0F172A] placeholder-[#64748B]/70 outline-none transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-[#64748B] hover:text-[#0F172A] cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Search Dropdown Palette */}
          {isSearchFocused && hasSearchResults && (
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-[#FFFFFF] border border-[#E2E8F0] rounded-[6px] shadow-none overflow-hidden z-50 divide-y divide-[#E2E8F0] animate-in fade-in duration-100">
              <div className="p-2.5 bg-[#F8FAFC] flex items-center justify-between text-[11px] text-[#64748B]">
                <span>Results ({totalResults})</span>
                <span className="text-[10px]">Esc to close</span>
              </div>

              {totalResults === 0 ? (
                <div className="p-4 text-center text-[13px] text-[#64748B]">
                  No matching items, tasks, or habits found.
                </div>
              ) : (
                <div className="max-h-80 overflow-y-auto divide-y divide-[#E2E8F0]/60">
                  {matchingItems.length > 0 && (
                    <div className="p-2">
                      <div className="text-[11px] font-medium text-[#64748B] uppercase tracking-wider px-2 py-1">
                        Inventory
                      </div>
                      <div className="space-y-0.5">
                        {matchingItems.map(item => (
                          <div
                            key={item.id}
                            onClick={() => {
                              onInspectItem(item);
                              setIsSearchFocused(false);
                            }}
                            className="flex items-center justify-between p-2 rounded-[4px] hover:bg-[#F8FAFC] cursor-pointer transition-colors"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <Package className="w-3.5 h-3.5 text-[#64748B] shrink-0" />
                              <div className="truncate">
                                <span className="text-[13px] font-medium text-[#0F172A] truncate block">{item.name}</span>
                                <span className="text-[11px] text-[#64748B] truncate block">{item.subCategory} • {item.location || 'Vault'}</span>
                              </div>
                            </div>
                            <span className={`text-[11px] text-[#64748B] shrink-0 tabular-nums ${privacyMode ? 'filter blur-[5px]' : ''}`}>
                              {settings.currencySymbol || '৳'}{item.goldValue.toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {matchingBucketEntries.length > 0 && (
                    <div className="p-2">
                      <div className="text-[11px] font-medium text-[#64748B] uppercase tracking-wider px-2 py-1">
                        Bucket List
                      </div>
                      <div className="space-y-0.5">
                        {matchingBucketEntries.map(entry => (
                          <div
                            key={entry.id}
                            onClick={() => {
                              onSelectTab('bucket-list');
                              setIsSearchFocused(false);
                            }}
                            className="flex items-center justify-between p-2 rounded-[4px] hover:bg-[#F8FAFC] cursor-pointer transition-colors"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <Compass className="w-3.5 h-3.5 text-[#059669] shrink-0" />
                              <div className="truncate">
                                <span className="text-[13px] font-medium text-[#0F172A] truncate block">{entry.title}</span>
                                <span className="text-[11px] text-[#64748B] truncate block">{entry.category || 'General'}</span>
                              </div>
                            </div>
                            <span className="text-[11px] text-[#64748B] uppercase tracking-wider shrink-0">
                              {entry.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {matchingAccounts.length > 0 && (
                    <div className="p-2">
                      <div className="text-[11px] font-medium text-[#64748B] uppercase tracking-wider px-2 py-1">
                        Money Accounts
                      </div>
                      <div className="space-y-0.5">
                        {matchingAccounts.map(acc => (
                          <div
                            key={acc.id}
                            onClick={() => {
                              onSelectTab('money');
                              setIsSearchFocused(false);
                            }}
                            className="flex items-center justify-between p-2 rounded-[4px] hover:bg-[#F8FAFC] cursor-pointer transition-colors"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <Landmark className="w-3.5 h-3.5 text-[#2563EB] shrink-0" />
                              <span className="text-[13px] font-medium text-[#0F172A] truncate">{acc.name}</span>
                            </div>
                            <span className="text-[11px] text-[#64748B] uppercase tracking-wider shrink-0">
                              {acc.type}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {matchingTasks.length > 0 && (
                    <div className="p-2">
                      <div className="text-[11px] font-medium text-[#64748B] uppercase tracking-wider px-2 py-1">
                        Tasks
                      </div>
                      <div className="space-y-0.5">
                        {matchingTasks.map(task => (
                          <div
                            key={task.id}
                            onClick={() => {
                              if (onSelectTask) onSelectTask(task);
                              onSelectTab('tasks');
                              setIsSearchFocused(false);
                            }}
                            className="flex items-center justify-between p-2 rounded-[4px] hover:bg-[#F8FAFC] cursor-pointer transition-colors"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <CheckSquare className="w-3.5 h-3.5 text-[#2563EB] shrink-0" />
                              <div className="truncate">
                                <span className="text-[13px] font-medium text-[#0F172A] truncate block">{task.title}</span>
                                <span className="text-[11px] text-[#64748B] truncate block">{task.pillar} • {task.difficulty}</span>
                              </div>
                            </div>
                            <span className={`text-[11px] px-1.5 py-0.5 rounded-[4px] border ${
                              task.status === 'done' ? 'text-[#059669] border-[#059669]/30' : 'text-[#64748B] border-[#E2E8F0]'
                            }`}>
                              {task.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {matchingHabits.length > 0 && (
                    <div className="p-2">
                      <div className="text-[11px] font-medium text-[#64748B] uppercase tracking-wider px-2 py-1">
                        Habits & Routines
                      </div>
                      <div className="space-y-0.5">
                        {matchingHabits.map(habit => (
                          <div
                            key={habit.id}
                            onClick={() => {
                              onSelectTab('routine');
                              setIsSearchFocused(false);
                            }}
                            className="flex items-center justify-between p-2 rounded-[4px] hover:bg-[#F8FAFC] cursor-pointer transition-colors"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <CalendarCheck2 className="w-3.5 h-3.5 text-[#D97706] shrink-0" />
                              <span className="text-[13px] font-medium text-[#0F172A] truncate">{habit.name}</span>
                            </div>
                            <span className="text-[11px] text-[#64748B] uppercase tracking-wider">
                              {habit.attribute}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {matchingSkills.length > 0 && (
                    <div className="p-2">
                      <div className="text-[11px] font-medium text-[#64748B] uppercase tracking-wider px-2 py-1">
                        Milestones
                      </div>
                      <div className="space-y-0.5">
                        {matchingSkills.map(skill => (
                          <div
                            key={skill.id}
                            onClick={() => {
                              onSelectTab('character');
                              setIsSearchFocused(false);
                            }}
                            className="flex items-center justify-between p-2 rounded-[4px] hover:bg-[#F8FAFC] cursor-pointer transition-colors"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <Target className="w-3.5 h-3.5 text-[#E11D48] shrink-0" />
                              <div className="truncate">
                                <span className="text-[13px] font-medium text-[#0F172A] truncate block">{skill.title}</span>
                                <span className="text-[11px] text-[#64748B] truncate block">{skill.attribute} • Tier {skill.tier}</span>
                              </div>
                            </div>
                            <span className="text-[11px] text-[#64748B] shrink-0">
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

        {/* App-wide Privacy Mode Toggle Button (Icon-Only) */}
        {onTogglePrivacyMode && (
          <button
            onClick={() => {
              sfx.playClick();
              onTogglePrivacyMode();
            }}
            className={`p-2 rounded-[6px] border text-xs transition-colors cursor-pointer ${
              privacyMode
                ? 'bg-[#F8FAFC] text-[#0F172A] border-[#0F172A]'
                : 'bg-[#FFFFFF] border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
            }`}
            title={privacyMode ? 'Privacy Mode Active (Click to Reveal)' : 'Enable Privacy Mode (Blur Sensitive Data)'}
          >
            {privacyMode ? <EyeOff className="w-4 h-4 text-[#0F172A]" /> : <Eye className="w-4 h-4" />}
          </button>
        )}

        {/* Settings Button (Icon-Only) */}
        <button
          onClick={() => {
            sfx.playClick();
            setIsSettingsOpen(true);
          }}
          className="p-2 rounded-[6px] bg-[#FFFFFF] border border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] transition-colors cursor-pointer"
          title="Settings"
        >
          <Settings className="w-4 h-4" />
        </button>



        {activeTab === 'tasks' && onOpenAddTask && (
          <button
            onClick={() => {
              sfx.playClick();
              onOpenAddTask();
            }}
            className="px-3.5 py-1.5 rounded-[6px] bg-[#0F172A] hover:bg-[#342F29] text-[#FFFFFF] text-[13px] font-medium transition-colors cursor-pointer"
          >
            New Task
          </button>
        )}
      </div>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div
          onClick={() => setIsSettingsOpen(false)}
          className="fixed inset-0 z-50 bg-[#0F172A]/30 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-[#FFFFFF] border border-[#E2E8F0] rounded-[6px] shadow-none p-6 cursor-default animate-in fade-in zoom-in-95"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0] mb-4">
              <div>
                <h3 className="font-serif text-[20px] font-normal text-[#0F172A]">Settings</h3>
                <p className="text-[13px] text-[#64748B] mt-0.5">Preferences and local data settings</p>
              </div>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="p-1 rounded-[4px] text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div>
                <label className="block text-[11px] font-medium text-[#64748B] uppercase tracking-wider mb-1.5">
                  Currency Symbol
                </label>
                <div className="flex items-center gap-1.5 mb-2">
                  {['৳', '$', '€', '£', '¥', 'CHF'].map(sym => (
                    <button
                      key={sym}
                      type="button"
                      onClick={() => setTempCurrency(sym)}
                      className={`px-3 py-1 rounded-[6px] border text-[13px] transition-colors cursor-pointer ${
                        tempCurrency === sym
                          ? 'bg-[#0F172A] border-[#0F172A] text-[#FFFFFF]'
                          : 'bg-[#FFFFFF] border-[#E2E8F0] text-[#64748B] hover:border-[#0F172A]'
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
                  className="w-full bg-[#FFFFFF] border border-[#E2E8F0] focus:border-[#0F172A] rounded-[6px] px-3 py-1.5 text-[13px] text-[#0F172A] outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#64748B] uppercase tracking-wider mb-1.5">
                  Number Grouping
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTempNumberGrouping('bangladeshi')}
                    className={`px-3 py-2 rounded-[6px] border text-left text-[13px] transition-colors cursor-pointer ${
                      tempNumberGrouping === 'bangladeshi'
                        ? 'bg-[#0F172A] border-[#0F172A] text-[#FFFFFF]'
                        : 'bg-[#FFFFFF] border-[#E2E8F0] text-[#64748B] hover:border-[#0F172A]'
                    }`}
                  >
                    <div className="font-medium">Bangladeshi</div>
                    <div className={`text-[11px] ${tempNumberGrouping === 'bangladeshi' ? 'text-[#E2E8F0]' : 'text-[#64748B]'}`}>
                      1,00,000 (Lakh / Crore)
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTempNumberGrouping('international')}
                    className={`px-3 py-2 rounded-[6px] border text-left text-[13px] transition-colors cursor-pointer ${
                      tempNumberGrouping === 'international'
                        ? 'bg-[#0F172A] border-[#0F172A] text-[#FFFFFF]'
                        : 'bg-[#FFFFFF] border-[#E2E8F0] text-[#64748B] hover:border-[#0F172A]'
                    }`}
                  >
                    <div className="font-medium">International</div>
                    <div className={`text-[11px] ${tempNumberGrouping === 'international' ? 'text-[#E2E8F0]' : 'text-[#64748B]'}`}>
                      100,000 (Standard)
                    </div>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#64748B] uppercase tracking-wider mb-1.5">
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
                  className="w-full bg-[#FFFFFF] border border-[#E2E8F0] focus:border-[#0F172A] rounded-[6px] px-3 py-1.5 text-[13px] text-[#0F172A] outline-none tabular-nums"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#64748B] uppercase tracking-wider mb-1.5">
                  Measurements Unit
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setTempUnitSystem('hybrid')}
                    className={`px-2.5 py-1.5 rounded-[6px] border text-[12px] font-medium transition-colors cursor-pointer text-center ${
                      tempUnitSystem === 'hybrid'
                        ? 'bg-[#0F172A] border-[#0F172A] text-[#FFFFFF]'
                        : 'bg-[#FFFFFF] border-[#E2E8F0] text-[#64748B] hover:border-[#0F172A]'
                    }`}
                  >
                    Hybrid (kg & in)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTempUnitSystem('metric')}
                    className={`px-2.5 py-1.5 rounded-[6px] border text-[12px] font-medium transition-colors cursor-pointer text-center ${
                      tempUnitSystem === 'metric'
                        ? 'bg-[#0F172A] border-[#0F172A] text-[#FFFFFF]'
                        : 'bg-[#FFFFFF] border-[#E2E8F0] text-[#64748B] hover:border-[#0F172A]'
                    }`}
                  >
                    Metric (kg / cm)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTempUnitSystem('imperial')}
                    className={`px-2.5 py-1.5 rounded-[6px] border text-[12px] font-medium transition-colors cursor-pointer text-center ${
                      tempUnitSystem === 'imperial'
                        ? 'bg-[#0F172A] border-[#0F172A] text-[#FFFFFF]'
                        : 'bg-[#FFFFFF] border-[#E2E8F0] text-[#64748B] hover:border-[#0F172A]'
                    }`}
                  >
                    Imperial (lbs / in)
                  </button>
                </div>
              </div>

              {onOpenBackup && (
                <div className="pt-2 border-t border-[#E2E8F0]">
                  <label className="block text-[11px] font-medium text-[#64748B] uppercase tracking-wider mb-1.5">
                    Data & Storage
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsSettingsOpen(false);
                      onOpenBackup();
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-[6px] border border-[#E2E8F0] hover:bg-[#F8FAFC] text-[13px] font-medium text-[#0F172A] transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Archive className="w-4 h-4 text-[#64748B]" />
                      <span>Backups & Folder Auto-Save</span>
                    </div>
                    <span className="text-[#64748B] text-xs">Manage →</span>
                  </button>
                </div>
              )}

              <div className="pt-3 border-t border-[#E2E8F0] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(false)}
                  className="px-3.5 py-1.5 rounded-[6px] text-[13px] text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-[6px] text-[13px] font-medium bg-[#0F172A] hover:bg-[#342F29] text-[#FFFFFF] cursor-pointer transition-colors"
                >
                  Save Settings
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};
