import React, { useState } from 'react';
import type { 
  CharacterProfile, 
  InventoryItem, 
  CustomHabit, 
  DayRecord, 
  XpEvent 
} from '../types';
import { 
  LayoutDashboard, 
  Package, 
  CalendarCheck2, 
  CheckSquare, 
  Sparkles, 
  DollarSign, 
  Target, 
  ChevronDown, 
  ChevronRight, 
  Folder, 
  MapPin, 
  Volume2, 
  VolumeX, 
  Download, 
  Upload 
} from 'lucide-react';
import { sfx } from '../utils/audio';
import { getTodayLocalDateStr } from '../utils/date';
import { deriveTotalXp, getOverallLevelProgress } from '../data/xpConfig';

export type NavTab = 'overview' | 'inventory' | 'routine' | 'tasks' | 'bucket-list' | 'money' | 'character';

export type InventoryTreeNode =
  | { type: 'all' }
  | { type: 'status'; status: 'owned' | 'wishlist' | 'past' }
  | { type: 'category'; category: string }
  | { type: 'location'; location: string };

interface SidebarProps {
  profile: CharacterProfile;
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  inventoryFilter: InventoryTreeNode;
  onSelectInventoryNode: (node: InventoryTreeNode) => void;
  items: InventoryItem[];
  habits: CustomHabit[];
  dayRecords: Record<string, DayRecord>;
  xpEvents: XpEvent[];
  openTasksCount?: number;
  isMuted: boolean;
  setIsMuted: (muted: boolean) => void;
  onExport: () => void;
  onImport: () => void;
}

const CATEGORY_NAMES: Record<string, string> = {
  apparel: 'Clothing & Wardrobe',
  tech: 'Tech & Hardware',
  tomes: 'Books & Tomes',
  edc: 'Everyday Carry',
};

export const Sidebar: React.FC<SidebarProps> = ({
  profile,
  activeTab,
  setActiveTab,
  inventoryFilter,
  onSelectInventoryNode,
  items,
  habits,
  dayRecords,
  xpEvents,
  openTasksCount = 0,
  isMuted,
  setIsMuted,
  onExport,
  onImport,
}) => {
  const [isInventoryTreeOpen, setIsInventoryTreeOpen] = useState(true);
  const [isCategoriesSubTreeOpen, setIsCategoriesSubTreeOpen] = useState(true);
  const [isLocationsSubTreeOpen, setIsLocationsSubTreeOpen] = useState(true);

  // Derive level and XP progression
  const totalXp = deriveTotalXp(xpEvents);
  const overall = getOverallLevelProgress(totalXp);

  // Compute non-negotiables for today
  const todayStr = getTodayLocalDateStr();
  const todayRecord = dayRecords[todayStr];
  const activeHabits = habits.filter(h => !h.isArchived);
  const prayersDone = todayRecord ? Object.values(todayRecord.salah).filter(Boolean).length : 0;
  const habitsDone = todayRecord
    ? (todayRecord.completedHabitIds || []).filter(id => activeHabits.some(h => h.id === id)).length
    : 0;
  const totalNonNegotiables = 5 + activeHabits.length;
  const completedNonNegotiables = prayersDone + habitsDone;

  // Inventory Tree Counts
  const ownedCount = items.filter(i => (i.ownershipStatus || 'owned') === 'owned').length;
  const wishlistCount = items.filter(i => i.ownershipStatus === 'wishlist' || i.isLocked).length;
  const pastCount = items.filter(i => i.ownershipStatus === 'past').length;

  // Dynamic Categories with counts
  const categoryKeys = Array.from(new Set(items.map(i => i.category)));
  const categoriesWithCounts = categoryKeys.map(cat => ({
    id: cat,
    label: CATEGORY_NAMES[cat] || cat,
    count: items.filter(i => i.category === cat).length,
  }));

  // Dynamic Locations with counts
  const locationMap = new Map<string, number>();
  items.forEach(it => {
    const loc = (it.location || '').trim();
    if (loc) {
      locationMap.set(loc, (locationMap.get(loc) || 0) + 1);
    }
  });
  const locationsWithCounts = Array.from(locationMap.entries()).map(([loc, count]) => ({
    name: loc,
    count,
  })).sort((a, b) => b.count - a.count);

  const isNodeActive = (node: InventoryTreeNode): boolean => {
    if (activeTab !== 'inventory') return false;
    if (node.type === 'all' && inventoryFilter.type === 'all') return true;
    if (node.type === 'status' && inventoryFilter.type === 'status' && node.status === inventoryFilter.status) return true;
    if (node.type === 'category' && inventoryFilter.type === 'category' && node.category === inventoryFilter.category) return true;
    if (node.type === 'location' && inventoryFilter.type === 'location' && node.location === inventoryFilter.location) return true;
    return false;
  };

  return (
    <aside className="w-64 flex-shrink-0 bg-white border-r border-[#ECECF0] flex flex-col justify-between h-screen select-none z-30">
      {/* Top Header & Scrollable Nav */}
      <div className="flex flex-col min-h-0 flex-1 overflow-hidden">
        
        {/* User Workspace Profile Header */}
        <div className="p-4 border-b border-[#ECECF0] flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src="/avatar.jpg"
              alt={profile.name}
              className="w-9 h-9 rounded-xl object-cover border border-[#ECECF0] flex-shrink-0 shadow-xs"
            />
            <div className="min-w-0">
              <div className="font-semibold text-sm text-[#111113] truncate tracking-tight">
                {profile.name}
              </div>
              <div className="text-xs text-[#6B6B76] truncate">
                {profile.title}
              </div>
            </div>
          </div>
        </div>

        {/* Primary Navigation List (Scrollable) */}
        <nav className="p-3 space-y-1 overflow-y-auto flex-1 text-sm">
          
          {/* Overview */}
          <button
            type="button"
            onClick={() => {
              sfx.playClick();
              setActiveTab('overview');
            }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-[#E6F7F9] text-[#0891B2] font-semibold'
                : 'text-[#6B6B76] hover:bg-[#F4F4F6] hover:text-[#111113]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <LayoutDashboard className={`w-4 h-4 ${activeTab === 'overview' ? 'text-[#0891B2]' : 'text-[#6B6B76]'}`} />
              <span>Overview</span>
            </div>
          </button>

          {/* Inventory (Expandable Tree) */}
          <div className="space-y-0.5">
            <div
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                activeTab === 'inventory' && inventoryFilter.type === 'all'
                  ? 'bg-[#E6F7F9] text-[#0891B2] font-semibold'
                  : 'text-[#6B6B76] hover:bg-[#F4F4F6] hover:text-[#111113]'
              }`}
              onClick={() => {
                sfx.playClick();
                setActiveTab('inventory');
                onSelectInventoryNode({ type: 'all' });
              }}
            >
              <div className="flex items-center gap-2.5">
                <Package className={`w-4 h-4 ${activeTab === 'inventory' ? 'text-[#0891B2]' : 'text-[#6B6B76]'}`} />
                <span>Inventory</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-semibold text-[#9A9AA5] px-1.5 py-0.2 rounded-md bg-[#F4F4F6]">
                  {items.length}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsInventoryTreeOpen(!isInventoryTreeOpen);
                  }}
                  className="p-0.5 hover:bg-[#ECECF0] rounded transition-colors text-[#9A9AA5]"
                >
                  {isInventoryTreeOpen ? (
                    <ChevronDown className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Tree Branch: Statuses, Categories, Locations */}
            {isInventoryTreeOpen && (
              <div className="pl-5 pr-1 py-1 space-y-0.5 border-l-2 border-[#ECECF0] ml-4 text-xs font-medium">
                
                {/* Node: All */}
                <button
                  type="button"
                  onClick={() => {
                    sfx.playClick();
                    setActiveTab('inventory');
                    onSelectInventoryNode({ type: 'all' });
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    isNodeActive({ type: 'all' })
                      ? 'bg-[#E6F7F9] text-[#0891B2] font-semibold'
                      : 'text-[#6B6B76] hover:bg-[#F4F4F6] hover:text-[#111113]'
                  }`}
                >
                  <span>All</span>
                  <span className="text-[11px] text-[#9A9AA5]">{items.length}</span>
                </button>

                {/* Node: Owned */}
                <button
                  type="button"
                  onClick={() => {
                    sfx.playClick();
                    setActiveTab('inventory');
                    onSelectInventoryNode({ type: 'status', status: 'owned' });
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    isNodeActive({ type: 'status', status: 'owned' })
                      ? 'bg-[#E6F7F9] text-[#0891B2] font-semibold'
                      : 'text-[#6B6B76] hover:bg-[#F4F4F6] hover:text-[#111113]'
                  }`}
                >
                  <span>Owned</span>
                  <span className="text-[11px] text-[#9A9AA5]">{ownedCount}</span>
                </button>

                {/* Node: Wishlist */}
                <button
                  type="button"
                  onClick={() => {
                    sfx.playClick();
                    setActiveTab('inventory');
                    onSelectInventoryNode({ type: 'status', status: 'wishlist' });
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    isNodeActive({ type: 'status', status: 'wishlist' })
                      ? 'bg-[#E6F7F9] text-[#0891B2] font-semibold'
                      : 'text-[#6B6B76] hover:bg-[#F4F4F6] hover:text-[#111113]'
                  }`}
                >
                  <span>Wishlist</span>
                  <span className="text-[11px] text-[#9A9AA5]">{wishlistCount}</span>
                </button>

                {/* Node: Parted With */}
                <button
                  type="button"
                  onClick={() => {
                    sfx.playClick();
                    setActiveTab('inventory');
                    onSelectInventoryNode({ type: 'status', status: 'past' });
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    isNodeActive({ type: 'status', status: 'past' })
                      ? 'bg-[#E6F7F9] text-[#0891B2] font-semibold'
                      : 'text-[#6B6B76] hover:bg-[#F4F4F6] hover:text-[#111113]'
                  }`}
                >
                  <span>Parted With</span>
                  <span className="text-[11px] text-[#9A9AA5]">{pastCount}</span>
                </button>

                {/* Sub-Branch: Categories */}
                <div className="pt-1.5">
                  <div
                    onClick={() => setIsCategoriesSubTreeOpen(!isCategoriesSubTreeOpen)}
                    className="flex items-center justify-between px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-[#9A9AA5] hover:text-[#111113] cursor-pointer"
                  >
                    <div className="flex items-center gap-1.5">
                      <Folder className="w-3 h-3 text-[#9A9AA5]" />
                      <span>Categories</span>
                    </div>
                    {isCategoriesSubTreeOpen ? (
                      <ChevronDown className="w-3 h-3" />
                    ) : (
                      <ChevronRight className="w-3 h-3" />
                    )}
                  </div>

                  {isCategoriesSubTreeOpen && (
                    <div className="pl-2 space-y-0.5 mt-0.5">
                      {categoriesWithCounts.map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => {
                            sfx.playClick();
                            setActiveTab('inventory');
                            onSelectInventoryNode({ type: 'category', category: cat.id });
                          }}
                          className={`w-full flex items-center justify-between px-2 py-1 rounded-md transition-colors cursor-pointer ${
                            isNodeActive({ type: 'category', category: cat.id })
                              ? 'bg-[#E6F7F9] text-[#0891B2] font-semibold'
                              : 'text-[#6B6B76] hover:bg-[#F4F4F6] hover:text-[#111113]'
                          }`}
                        >
                          <span className="truncate pr-1">{cat.label}</span>
                          <span className="text-[10px] text-[#9A9AA5] shrink-0">{cat.count}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Sub-Branch: Locations */}
                {locationsWithCounts.length > 0 && (
                  <div className="pt-1.5">
                    <div
                      onClick={() => setIsLocationsSubTreeOpen(!isLocationsSubTreeOpen)}
                      className="flex items-center justify-between px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-[#9A9AA5] hover:text-[#111113] cursor-pointer"
                    >
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3 h-3 text-[#9A9AA5]" />
                        <span>Locations</span>
                      </div>
                      {isLocationsSubTreeOpen ? (
                        <ChevronDown className="w-3 h-3" />
                      ) : (
                        <ChevronRight className="w-3 h-3" />
                      )}
                    </div>

                    {isLocationsSubTreeOpen && (
                      <div className="pl-2 space-y-0.5 mt-0.5">
                        {locationsWithCounts.map((loc) => (
                          <button
                            key={loc.name}
                            type="button"
                            onClick={() => {
                              sfx.playClick();
                              setActiveTab('inventory');
                              onSelectInventoryNode({ type: 'location', location: loc.name });
                            }}
                            className={`w-full flex items-center justify-between px-2 py-1 rounded-md transition-colors cursor-pointer ${
                              isNodeActive({ type: 'location', location: loc.name })
                                ? 'bg-[#E6F7F9] text-[#0891B2] font-semibold'
                                : 'text-[#6B6B76] hover:bg-[#F4F4F6] hover:text-[#111113]'
                            }`}
                          >
                            <span className="truncate pr-1">{loc.name}</span>
                            <span className="text-[10px] text-[#9A9AA5] shrink-0">{loc.count}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Routine (formerly Daily Cadence) */}
          <button
            type="button"
            onClick={() => {
              sfx.playClick();
              setActiveTab('routine');
            }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
              activeTab === 'routine'
                ? 'bg-[#E6F7F9] text-[#0891B2] font-semibold'
                : 'text-[#6B6B76] hover:bg-[#F4F4F6] hover:text-[#111113]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <CalendarCheck2 className={`w-4 h-4 ${activeTab === 'routine' ? 'text-[#0891B2]' : 'text-[#6B6B76]'}`} />
              <span>Routine</span>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-[#F4F4F6] text-[#9A9AA5]">
              {completedNonNegotiables}/{totalNonNegotiables}
            </span>
          </button>

          {/* Tasks (formerly Quests) */}
          <button
            type="button"
            onClick={() => {
              sfx.playClick();
              setActiveTab('tasks');
            }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
              activeTab === 'tasks'
                ? 'bg-[#E6F7F9] text-[#0891B2] font-semibold'
                : 'text-[#6B6B76] hover:bg-[#F4F4F6] hover:text-[#111113]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <CheckSquare className={`w-4 h-4 ${activeTab === 'tasks' ? 'text-[#0891B2]' : 'text-[#6B6B76]'}`} />
              <span>Tasks</span>
            </div>
            {openTasksCount > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-[#F4F4F6] text-[#9A9AA5]">
                {openTasksCount}
              </span>
            )}
          </button>

          {/* Bucket List (New empty page) */}
          <button
            type="button"
            onClick={() => {
              sfx.playClick();
              setActiveTab('bucket-list');
            }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
              activeTab === 'bucket-list'
                ? 'bg-[#E6F7F9] text-[#0891B2] font-semibold'
                : 'text-[#6B6B76] hover:bg-[#F4F4F6] hover:text-[#111113]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Sparkles className={`w-4 h-4 ${activeTab === 'bucket-list' ? 'text-[#0891B2]' : 'text-[#6B6B76]'}`} />
              <span>Bucket List</span>
            </div>
          </button>

          {/* Money (New empty page) */}
          <button
            type="button"
            onClick={() => {
              sfx.playClick();
              setActiveTab('money');
            }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
              activeTab === 'money'
                ? 'bg-[#E6F7F9] text-[#0891B2] font-semibold'
                : 'text-[#6B6B76] hover:bg-[#F4F4F6] hover:text-[#111113]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <DollarSign className={`w-4 h-4 ${activeTab === 'money' ? 'text-[#0891B2]' : 'text-[#6B6B76]'}`} />
              <span>Money</span>
            </div>
          </button>

          {/* Character (formerly Character Codex) */}
          <button
            type="button"
            onClick={() => {
              sfx.playClick();
              setActiveTab('character');
            }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
              activeTab === 'character'
                ? 'bg-[#E6F7F9] text-[#0891B2] font-semibold'
                : 'text-[#6B6B76] hover:bg-[#F4F4F6] hover:text-[#111113]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Target className={`w-4 h-4 ${activeTab === 'character' ? 'text-[#0891B2]' : 'text-[#6B6B76]'}`} />
              <span>Character</span>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-[#F4F4F6] text-[#9A9AA5]">
              Lvl {overall.level}
            </span>
          </button>
        </nav>

      </div>

      {/* Sidebar Footer: Always Visible */}
      <div className="p-4 border-t border-[#ECECF0] bg-white flex flex-col gap-3 flex-shrink-0">
        
        {/* Today: X of Y non-negotiables done */}
        <div className="space-y-1">
          <div className="text-[12px] font-semibold text-[#111113] flex items-center justify-between">
            <span>Today: {completedNonNegotiables} of {totalNonNegotiables} non-negotiables done</span>
          </div>
          <div className="w-full h-1.5 bg-[#ECECF0] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#16A34A] rounded-full transition-all"
              style={{
                width: `${totalNonNegotiables > 0 ? Math.min(100, Math.round((completedNonNegotiables / totalNonNegotiables) * 100)) : 0}%`,
              }}
            />
          </div>
        </div>

        {/* Overall Level with thin XP bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-semibold text-[#111113]">Level {overall.level}</span>
            <span className="text-[#9A9AA5] font-medium">{overall.currentXp} / {overall.xpNeededForNext} XP</span>
          </div>
          <div className="w-full h-1 bg-[#ECECF0] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#0891B2] rounded-full transition-all"
              style={{ width: `${Math.min(100, overall.progressPercent)}%` }}
            />
          </div>
        </div>

        {/* Bottom Actions Row: Audio Mute, Export, Import */}
        <div className="pt-2 border-t border-[#ECECF0] flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                sfx.playClick();
                setIsMuted(!isMuted);
              }}
              className={`p-1.5 rounded-lg border text-xs transition-colors cursor-pointer ${
                isMuted
                  ? 'bg-[#FDECEC] text-[#DC2626] border-[#FDECEC]'
                  : 'bg-white text-[#6B6B76] hover:text-[#111113] border-[#ECECF0] hover:bg-[#F4F4F6]'
              }`}
              title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={() => {
                sfx.playClick();
                onExport();
              }}
              className="p-1.5 rounded-lg bg-white text-[#6B6B76] hover:text-[#111113] border border-[#ECECF0] hover:bg-[#F4F4F6] transition-colors cursor-pointer"
              title="Export Vault JSON"
            >
              <Download className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => {
                sfx.playClick();
                onImport();
              }}
              className="p-1.5 rounded-lg bg-white text-[#6B6B76] hover:text-[#111113] border border-[#ECECF0] hover:bg-[#F4F4F6] transition-colors cursor-pointer"
              title="Import Backup JSON"
            >
              <Upload className="w-3.5 h-3.5" />
            </button>
          </div>

          <span className="text-[11px] text-[#9A9AA5] font-medium tracking-tight">
            Vessel
          </span>
        </div>

      </div>
    </aside>
  );
};
