import React, { useState } from 'react';
import type { 
  CharacterProfile, 
  InventoryItem, 
  CustomHabit, 
  DayRecord, 
  XpEvent,
  SalahStatus
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
import { isBackupDue } from '../services/backupService';
import {
  getActiveNonNegotiableItems,
  isNonNegotiableItemDone,
  ALL_PRAYER_KEYS,
} from '../utils/nonNegotiables';

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
  lastBackupAt?: string;
  nonNegotiablePrayers?: (keyof SalahStatus)[];
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
  lastBackupAt,
  nonNegotiablePrayers = ALL_PRAYER_KEYS,
}) => {
  const [isInventoryTreeOpen, setIsInventoryTreeOpen] = useState(true);
  const [isCategoriesSubTreeOpen, setIsCategoriesSubTreeOpen] = useState(true);
  const [isLocationsSubTreeOpen, setIsLocationsSubTreeOpen] = useState(true);

  // Derive level and XP progression
  const totalXp = deriveTotalXp(xpEvents);
  const overall = getOverallLevelProgress(totalXp);

  // Compute non-negotiables for today (single source of truth)
  const todayStr = getTodayLocalDateStr();
  const todayRecord = dayRecords[todayStr];
  const nonNegotiables = getActiveNonNegotiableItems(habits, nonNegotiablePrayers);
  const completedNonNegotiables = nonNegotiables.filter(item => isNonNegotiableItemDone(todayRecord, item)).length;
  const totalNonNegotiables = nonNegotiables.length;

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

  const navItemClass = (isActive: boolean) =>
    `w-full flex items-center justify-between px-3 py-2 rounded-[6px] text-[14px] transition-colors cursor-pointer ${
      isActive
        ? 'bg-[#F6F2EA] text-[#1F1B16] font-medium border border-[#E4DED2]'
        : 'text-[#6B645A] hover:bg-[#F6F2EA]/60 hover:text-[#1F1B16] border border-transparent'
    }`;

  const treeItemClass = (isActive: boolean) =>
    `w-full flex items-center justify-between px-2.5 py-1.5 rounded-[6px] text-[13px] transition-colors cursor-pointer ${
      isActive
        ? 'bg-[#F6F2EA] text-[#1F1B16] font-medium border border-[#E4DED2]'
        : 'text-[#6B645A] hover:bg-[#F6F2EA]/60 hover:text-[#1F1B16] border border-transparent'
    }`;

  const initialLetter = (profile.name || 'V').trim().charAt(0).toUpperCase();

  return (
    <aside className="w-64 flex-shrink-0 bg-[#FBF9F4] border-r border-[#E4DED2] flex flex-col justify-between h-screen select-none z-30">
      {/* Top Header & Scrollable Nav */}
      <div className="flex flex-col min-h-0 flex-1 overflow-hidden">
        
        {/* User Workspace Profile Header */}
        <div className="p-4 border-b border-[#E4DED2] flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-[6px] bg-[#EFEAE0] border border-[#E4DED2] text-[#1F1B16] font-serif flex items-center justify-center text-sm font-medium flex-shrink-0">
              {initialLetter}
            </div>
            <div className="min-w-0">
              <div className="font-serif text-[15px] font-medium text-[#1F1B16] truncate tracking-tight">
                {profile.name}
              </div>
              <div className="text-[12px] text-[#6B645A] truncate">
                {profile.title}
              </div>
            </div>
          </div>
        </div>

        {/* Primary Navigation List (Scrollable) */}
        <nav className="p-3 space-y-1 overflow-y-auto flex-1 text-[14px]">
          
          {/* Overview */}
          <button
            type="button"
            onClick={() => {
              sfx.playClick();
              setActiveTab('overview');
            }}
            className={navItemClass(activeTab === 'overview')}
          >
            <div className="flex items-center gap-2.5">
              <LayoutDashboard className={`w-4 h-4 ${activeTab === 'overview' ? 'text-[#1F1B16]' : 'text-[#6B645A]'}`} />
              <span>Overview</span>
            </div>
          </button>

          {/* Inventory (Expandable Tree) */}
          <div className="space-y-0.5">
            <div
              className={navItemClass(activeTab === 'inventory' && inventoryFilter.type === 'all')}
              onClick={() => {
                sfx.playClick();
                setActiveTab('inventory');
                onSelectInventoryNode({ type: 'all' });
              }}
            >
              <div className="flex items-center gap-2.5">
                <Package className={`w-4 h-4 ${activeTab === 'inventory' ? 'text-[#1F1B16]' : 'text-[#6B645A]'}`} />
                <span>Inventory</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-medium tabular-nums text-[#6B645A] px-1.5 py-0.5 rounded-[4px] bg-[#EFEAE0] border border-[#E4DED2]">
                  {items.length}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsInventoryTreeOpen(!isInventoryTreeOpen);
                  }}
                  className="p-0.5 hover:bg-[#EFEAE0] rounded-[4px] transition-colors text-[#6B645A]"
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
              <div className="pl-4 pr-1 py-1 space-y-0.5 border-l border-[#E4DED2] ml-4 text-[13px]">
                
                {/* Node: All */}
                <button
                  type="button"
                  onClick={() => {
                    sfx.playClick();
                    setActiveTab('inventory');
                    onSelectInventoryNode({ type: 'all' });
                  }}
                  className={treeItemClass(isNodeActive({ type: 'all' }))}
                >
                  <span>All</span>
                  <span className="text-[11px] tabular-nums text-[#6B645A]">{items.length}</span>
                </button>

                {/* Node: Owned */}
                <button
                  type="button"
                  onClick={() => {
                    sfx.playClick();
                    setActiveTab('inventory');
                    onSelectInventoryNode({ type: 'status', status: 'owned' });
                  }}
                  className={treeItemClass(isNodeActive({ type: 'status', status: 'owned' }))}
                >
                  <span>Owned</span>
                  <span className="text-[11px] tabular-nums text-[#6B645A]">{ownedCount}</span>
                </button>

                {/* Node: Wishlist */}
                <button
                  type="button"
                  onClick={() => {
                    sfx.playClick();
                    setActiveTab('inventory');
                    onSelectInventoryNode({ type: 'status', status: 'wishlist' });
                  }}
                  className={treeItemClass(isNodeActive({ type: 'status', status: 'wishlist' }))}
                >
                  <span>Wishlist</span>
                  <span className="text-[11px] tabular-nums text-[#6B645A]">{wishlistCount}</span>
                </button>

                {/* Node: Parted With */}
                <button
                  type="button"
                  onClick={() => {
                    sfx.playClick();
                    setActiveTab('inventory');
                    onSelectInventoryNode({ type: 'status', status: 'past' });
                  }}
                  className={treeItemClass(isNodeActive({ type: 'status', status: 'past' }))}
                >
                  <span>Parted With</span>
                  <span className="text-[11px] tabular-nums text-[#6B645A]">{pastCount}</span>
                </button>

                {/* Sub-Branch: Categories */}
                <div className="pt-2">
                  <div
                    onClick={() => setIsCategoriesSubTreeOpen(!isCategoriesSubTreeOpen)}
                    className="flex items-center justify-between px-2 py-1 text-[11px] font-medium uppercase tracking-wider text-[#6B645A] hover:text-[#1F1B16] cursor-pointer"
                  >
                    <div className="flex items-center gap-1.5">
                      <Folder className="w-3 h-3 text-[#6B645A]" />
                      <span>Categories</span>
                    </div>
                    {isCategoriesSubTreeOpen ? (
                      <ChevronDown className="w-3 h-3" />
                    ) : (
                      <ChevronRight className="w-3 h-3" />
                    )}
                  </div>

                  {isCategoriesSubTreeOpen && (
                    <div className="pl-1.5 space-y-0.5 mt-0.5">
                      {categoriesWithCounts.map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => {
                            sfx.playClick();
                            setActiveTab('inventory');
                            onSelectInventoryNode({ type: 'category', category: cat.id });
                          }}
                          className={treeItemClass(isNodeActive({ type: 'category', category: cat.id }))}
                        >
                          <span className="truncate pr-1">{cat.label}</span>
                          <span className="text-[11px] tabular-nums text-[#6B645A] shrink-0">{cat.count}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Sub-Branch: Locations */}
                {locationsWithCounts.length > 0 && (
                  <div className="pt-2">
                    <div
                      onClick={() => setIsLocationsSubTreeOpen(!isLocationsSubTreeOpen)}
                      className="flex items-center justify-between px-2 py-1 text-[11px] font-medium uppercase tracking-wider text-[#6B645A] hover:text-[#1F1B16] cursor-pointer"
                    >
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3 h-3 text-[#6B645A]" />
                        <span>Locations</span>
                      </div>
                      {isLocationsSubTreeOpen ? (
                        <ChevronDown className="w-3 h-3" />
                      ) : (
                        <ChevronRight className="w-3 h-3" />
                      )}
                    </div>

                    {isLocationsSubTreeOpen && (
                      <div className="pl-1.5 space-y-0.5 mt-0.5">
                        {locationsWithCounts.map((loc) => (
                          <button
                            key={loc.name}
                            type="button"
                            onClick={() => {
                              sfx.playClick();
                              setActiveTab('inventory');
                              onSelectInventoryNode({ type: 'location', location: loc.name });
                            }}
                            className={treeItemClass(isNodeActive({ type: 'location', location: loc.name }))}
                          >
                            <span className="truncate pr-1">{loc.name}</span>
                            <span className="text-[11px] tabular-nums text-[#6B645A] shrink-0">{loc.count}</span>
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
            className={navItemClass(activeTab === 'routine')}
          >
            <div className="flex items-center gap-2.5">
              <CalendarCheck2 className={`w-4 h-4 ${activeTab === 'routine' ? 'text-[#1F1B16]' : 'text-[#6B645A]'}`} />
              <span>Routine</span>
            </div>
            <span className="text-[11px] px-1.5 py-0.5 rounded-[4px] tabular-nums font-medium bg-[#EFEAE0] text-[#6B645A] border border-[#E4DED2]">
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
            className={navItemClass(activeTab === 'tasks')}
          >
            <div className="flex items-center gap-2.5">
              <CheckSquare className={`w-4 h-4 ${activeTab === 'tasks' ? 'text-[#1F1B16]' : 'text-[#6B645A]'}`} />
              <span>Tasks</span>
            </div>
            {openTasksCount > 0 && (
              <span className="text-[11px] px-1.5 py-0.5 rounded-[4px] tabular-nums font-medium bg-[#EFEAE0] text-[#6B645A] border border-[#E4DED2]">
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
            className={navItemClass(activeTab === 'bucket-list')}
          >
            <div className="flex items-center gap-2.5">
              <Sparkles className={`w-4 h-4 ${activeTab === 'bucket-list' ? 'text-[#1F1B16]' : 'text-[#6B645A]'}`} />
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
            className={navItemClass(activeTab === 'money')}
          >
            <div className="flex items-center gap-2.5">
              <DollarSign className={`w-4 h-4 ${activeTab === 'money' ? 'text-[#1F1B16]' : 'text-[#6B645A]'}`} />
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
            className={navItemClass(activeTab === 'character')}
          >
            <div className="flex items-center gap-2.5">
              <Target className={`w-4 h-4 ${activeTab === 'character' ? 'text-[#1F1B16]' : 'text-[#6B645A]'}`} />
              <span>Character</span>
            </div>
            <span className="text-[11px] px-1.5 py-0.5 rounded-[4px] tabular-nums font-medium bg-[#EFEAE0] text-[#6B645A] border border-[#E4DED2]">
              Lvl {overall.level}
            </span>
          </button>
        </nav>

      </div>

      {/* Sidebar Footer: Always Visible */}
      <div className="p-4 border-t border-[#E4DED2] bg-[#FBF9F4] flex flex-col gap-3 flex-shrink-0">
        
        {/* Today: X of Y non-negotiables done */}
        <div className="space-y-1.5">
          <div className="text-[12px] font-medium text-[#1F1B16] flex items-center justify-between">
            <span>Today: {completedNonNegotiables} of {totalNonNegotiables} non-negotiables done</span>
          </div>
          <div className="w-full h-1 bg-[#E4DED2] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#3F6B4F] transition-all"
              style={{
                width: `${totalNonNegotiables > 0 ? Math.min(100, Math.round((completedNonNegotiables / totalNonNegotiables) * 100)) : 0}%`,
              }}
            />
          </div>
        </div>

        {/* Overall Level with thin XP bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] tabular-nums">
            <span className="font-medium text-[#1F1B16]">Level {overall.level}</span>
            <span className="text-[#6B645A]">{overall.currentXp} / {overall.xpNeededForNext} XP</span>
          </div>
          <div className="w-full h-1 bg-[#E4DED2] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#1F1B16] transition-all"
              style={{ width: `${Math.min(100, overall.progressPercent)}%` }}
            />
          </div>
        </div>

        {/* Bottom Actions Row: Audio Mute, Export, Import */}
        <div className="pt-2 border-t border-[#E4DED2] flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                sfx.playClick();
                setIsMuted(!isMuted);
              }}
              className={`p-1.5 rounded-[6px] border text-xs transition-colors cursor-pointer ${
                isMuted
                  ? 'bg-[#EFEAE0] text-[#9C3D2A] border-[#E4DED2]'
                  : 'bg-[#FBF9F4] text-[#6B645A] hover:text-[#1F1B16] border-[#E4DED2] hover:bg-[#F6F2EA]'
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
              className="relative p-1.5 rounded-[6px] bg-[#FBF9F4] text-[#6B645A] hover:text-[#1F1B16] border border-[#E4DED2] hover:bg-[#F6F2EA] transition-colors cursor-pointer"
              title={isBackupDue(lastBackupAt) ? "Backups & Archives (Backup recommended)" : "Backups & Archives (ZIP)"}
            >
              <Download className="w-3.5 h-3.5" />
              {isBackupDue(lastBackupAt) && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#9C3D2A] animate-pulse" />
              )}
            </button>

            <button
              onClick={() => {
                sfx.playClick();
                onImport();
              }}
              className="p-1.5 rounded-[6px] bg-[#FBF9F4] text-[#6B645A] hover:text-[#1F1B16] border border-[#E4DED2] hover:bg-[#F6F2EA] transition-colors cursor-pointer"
              title="Import Items (JSON / CSV)"
            >
              <Upload className="w-3.5 h-3.5" />
            </button>
          </div>

          <span className="text-[12px] font-serif text-[#6B645A] tracking-tight">
            Vessel
          </span>
        </div>

      </div>
    </aside>
  );
};
