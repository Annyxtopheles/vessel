import React, { useState, useRef, useEffect } from 'react';
import type { InventoryItem, EquipSlot, SavedLoadout } from '../types';
import {
  Scale,
  Shirt,
  DollarSign,
  Package,
  Layers,
  Footprints,
  Laptop,
  BookOpen,
  Watch,
  ChevronDown,
  ChevronUp,
  BookmarkPlus,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { sfx } from '../utils/audio';

interface PaperdollViewProps {
  equippedItems: InventoryItem[];
  onInspectItem: (item: InventoryItem) => void;
  onUnequipItem: (item: InventoryItem) => void;
  carriedWeight?: number;
  totalPossessionsWeight?: number;
  maxEncumbranceKg?: number;
  vaultValuation?: number;
  wishlistCost?: number;
  ownedCount?: number;
  wishlistCount?: number;
  pastCount?: number;
  currencySymbol?: string;
  savedLoadouts?: SavedLoadout[];
  onSaveCurrentLoadout?: (name: string) => void;
  onLoadPreset?: (loadout: SavedLoadout) => void;
  onDeletePreset?: (loadoutId: string) => void;
}

const SLOT_CONFIG: { slot: EquipSlot; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { slot: 'head', label: 'Headwear', icon: Layers },
  { slot: 'outerwear', label: 'Outerwear', icon: Shirt },
  { slot: 'innerwear', label: 'Base Layer', icon: Layers },
  { slot: 'legs', label: 'Pants', icon: Layers },
  { slot: 'footwear', label: 'Footwear', icon: Footprints },
  { slot: 'tech_relic', label: 'Tech Gear', icon: Laptop },
  { slot: 'tome', label: 'Book / Tome', icon: BookOpen },
  { slot: 'wrist_edc', label: 'Wrist / EDC', icon: Watch },
];

const FULL_MODIFIER_NAMES: Record<string, string> = {
  STR: 'Strength',
  INT: 'Intellect',
  WIS: 'Wisdom',
  CHA: 'Charisma',
  FOCUS: 'Focus',
  STYLE: 'Style',
  COMFORT: 'Comfort',
  WARMTH: 'Warmth',
};

export const PaperdollView: React.FC<PaperdollViewProps> = ({
  equippedItems,
  onInspectItem,
  onUnequipItem,
  carriedWeight = 0,
  totalPossessionsWeight = 0,
  maxEncumbranceKg = 12,
  vaultValuation = 0,
  wishlistCost = 0,
  ownedCount = 0,
  wishlistCount = 0,
  pastCount = 0,
  currencySymbol = '$',
  savedLoadouts = [],
  onSaveCurrentLoadout,
  onLoadPreset,
  onDeletePreset,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isSavingLoadout, setIsSavingLoadout] = useState(false);
  const [newLoadoutName, setNewLoadoutName] = useState('');
  const [isPresetsOpen, setIsPresetsOpen] = useState(false);
  const presetsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (presetsRef.current && !presetsRef.current.contains(e.target as Node)) {
        setIsPresetsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute aggregate stats and buffs
  const aggregateBuffs: Record<string, number> = {};
  equippedItems.forEach(item => {
    item.buffs.forEach(buff => {
      aggregateBuffs[buff.stat] = (aggregateBuffs[buff.stat] || 0) + buff.value;
    });
  });

  const getItemInSlot = (slot: EquipSlot) => {
    return equippedItems.find(it => it.equipSlot === slot);
  };

  const encumbrancePercent = Math.min(
    100,
    Math.round((carriedWeight / (maxEncumbranceKg || 1)) * 100)
  );

  const activeModifiersSummary = Object.entries(aggregateBuffs)
    .map(([stat, val]) => `+${val} ${FULL_MODIFIER_NAMES[stat] || stat}`)
    .join('  •  ');

  const handleSaveLoadoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLoadoutName.trim() || !onSaveCurrentLoadout) return;
    sfx.playClick();
    onSaveCurrentLoadout(newLoadoutName.trim());
    setNewLoadoutName('');
    setIsSavingLoadout(false);
  };

  return (
    <div className="space-y-6">
      {/* 4-Card KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* KPI 1: Carry Load (carried items against capacity) */}
        <div className="ship-card p-5 lg:p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-normal text-[#6B6B76]">Carry Load</span>
            <div className="ship-icon-tile">
              <Scale className="w-5 h-5 text-[#0891B2]" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-[28px] font-semibold text-[#111113] leading-none tracking-tight">
              {carriedWeight.toFixed(1)}{' '}
              <span className="text-base font-normal text-[#6B6B76]">/ {maxEncumbranceKg.toFixed(1)} kg</span>
            </div>
            <div className="w-full bg-[#ECECF0] h-1.5 rounded-full overflow-hidden mt-3">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  encumbrancePercent > 90 ? 'bg-[#DC2626]' : 'bg-[#0891B2]'
                }`}
                style={{ width: `${encumbrancePercent}%` }}
              />
            </div>
            <div className="text-[12px] text-[#6B6B76] mt-3 truncate">
              Total possessions weight: <span className="font-semibold text-[#111113]">{totalPossessionsWeight.toFixed(1)} kg</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Equipped Slots */}
        <div className="ship-card p-5 lg:p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-normal text-[#6B6B76]">Equipped Slots</span>
            <div className="ship-icon-tile">
              <Shirt className="w-5 h-5 text-[#0891B2]" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-[28px] font-semibold text-[#111113] leading-none tracking-tight">
              {equippedItems.length}{' '}
              <span className="text-base font-normal text-[#6B6B76]">/ 8</span>
            </div>
            <div className="text-[12px] text-[#16A34A] font-medium mt-3 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
              {equippedItems.length === 8 ? 'Full loadout active' : `${8 - equippedItems.length} slots available`}
            </div>
            <div className="text-[12px] text-[#6B6B76] mt-1.5">
              Active daily modifiers equipped
            </div>
          </div>
        </div>

        {/* KPI 3: Vault Valuation (OWNED ITEMS ONLY + Wishlist Cost) */}
        <div className="ship-card p-5 lg:p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-normal text-[#6B6B76]">Vault Valuation</span>
            <div className="ship-icon-tile">
              <DollarSign className="w-5 h-5 text-[#0891B2]" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-[28px] font-semibold text-[#111113] leading-none tracking-tight">
              {currencySymbol}{vaultValuation.toLocaleString()}
            </div>
            <div className="text-[12px] text-[#6B6B76] mt-3">
              Owned assets • <span className="font-medium text-[#111113]">Wishlist cost: {currencySymbol}{wishlistCost.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* KPI 4: Total Possessions (OWNED ONLY in Headline + breakdown) */}
        <div className="ship-card p-5 lg:p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-normal text-[#6B6B76]">Total Possessions</span>
            <div className="ship-icon-tile">
              <Package className="w-5 h-5 text-[#0891B2]" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-[28px] font-semibold text-[#111113] leading-none tracking-tight">
              {ownedCount}
            </div>
            <div className="text-[12px] text-[#6B6B76] mt-3 truncate">
              {ownedCount} owned • {wishlistCount} wishlist • {pastCount} parted
            </div>
          </div>
        </div>
      </div>

      {/* Today's Loadout Card */}
      <div className="ship-card p-6">
        {/* Card Header Pattern */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#ECECF0]">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-[15px] font-semibold text-[#111113]">Today's Loadout</h2>
              <span className="ship-pill-accent">
                {equippedItems.length} / 8 slots active
              </span>
            </div>
            <p className="text-[13px] text-[#6B6B76] mt-0.5">
              Active equipped items imparting passive character attribute bonuses
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Load Saved Loadout Presets Dropdown */}
            {savedLoadouts.length > 0 && onLoadPreset && (
              <div className="relative" ref={presetsRef}>
                <button
                  type="button"
                  onClick={() => setIsPresetsOpen(!isPresetsOpen)}
                  className="px-3 py-1.5 rounded-xl border border-[#ECECF0] bg-white text-[13px] font-medium text-[#111113] hover:border-[#0891B2]/40 transition-colors flex items-center gap-2 shadow-xs cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#0891B2]" />
                  <span>Load Preset</span>
                  <ChevronDown className="w-3 h-3 text-[#9A9AA5]" />
                </button>

                {isPresetsOpen && (
                  <div className="absolute right-0 top-full mt-1.5 min-w-[200px] bg-white border border-[#ECECF0] rounded-xl shadow-lg p-1.5 z-40 animate-in fade-in zoom-in-95">
                    <div className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-[#9A9AA5]">
                      Saved Presets
                    </div>
                    {savedLoadouts.map((loadout) => (
                      <div
                        key={loadout.id}
                        className="w-full px-3 py-2 rounded-lg text-[13px] text-left transition-colors flex items-center justify-between hover:bg-[#E6F7F9] text-[#111113] group"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            sfx.playEquip();
                            onLoadPreset(loadout);
                            setIsPresetsOpen(false);
                          }}
                          className="flex-1 text-left flex items-center justify-between mr-2 cursor-pointer"
                        >
                          <span className="font-medium group-hover:text-[#0891B2]">{loadout.name}</span>
                          <span className="text-[11px] text-[#9A9AA5]">{loadout.equippedItemIds.length} items</span>
                        </button>
                        {onDeletePreset && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeletePreset(loadout.id);
                            }}
                            className="p-1 rounded text-[#9A9AA5] hover:text-[#DC2626] transition-colors"
                            title="Delete Preset"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Save Current as Loadout Preset Button */}
            {onSaveCurrentLoadout && (
              <button
                type="button"
                onClick={() => setIsSavingLoadout(true)}
                className="px-3 py-1.5 rounded-xl border border-[#ECECF0] bg-white text-[13px] font-medium text-[#111113] hover:border-[#0891B2]/40 transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <BookmarkPlus className="w-3.5 h-3.5 text-[#0891B2]" />
                <span>Save Current</span>
              </button>
            )}

            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 rounded-xl text-[#6B6B76] hover:text-[#111113] hover:bg-[#F4F4F6] transition-colors"
              title={isExpanded ? 'Collapse loadout' : 'Expand loadout'}
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Modal / Prompt to Save Current Loadout */}
        {isSavingLoadout && (
          <form
            onSubmit={handleSaveLoadoutSubmit}
            className="mt-4 p-4 rounded-xl bg-[#F4F4F6] border border-[#ECECF0] flex flex-col sm:flex-row items-stretch sm:items-center gap-3 animate-in fade-in"
          >
            <div className="flex-1">
              <label className="block text-[12px] font-semibold text-[#111113] mb-1">
                Save Current Loadout as Named Preset
              </label>
              <input
                type="text"
                required
                autoFocus
                placeholder="e.g. Office & Deep Work, Travel Pack, Weekend Hike..."
                value={newLoadoutName}
                onChange={(e) => setNewLoadoutName(e.target.value)}
                className="ship-input w-full py-1.5 text-[13px]"
              />
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto pt-4 sm:pt-4">
              <button
                type="submit"
                className="ship-btn-primary px-4 py-2 text-[13px] font-semibold shadow-xs"
              >
                Save Preset
              </button>
              <button
                type="button"
                onClick={() => setIsSavingLoadout(false)}
                className="px-3 py-2 rounded-xl bg-white border border-[#ECECF0] text-[#6B6B76] text-[13px] hover:text-[#111113]"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {isExpanded && (
          <>
            {/* Consolidated Modifiers Summary Row */}
            {activeModifiersSummary ? (
              <div className="mt-4 px-4 py-2.5 bg-[#F4F4F6] rounded-xl text-[13px] text-[#111113] flex items-center gap-2 overflow-x-auto">
                <span className="text-[#6B6B76] font-medium flex-shrink-0">Active Modifiers:</span>
                <span className="text-[#111113] font-medium">{activeModifiersSummary}</span>
              </div>
            ) : (
              <div className="mt-4 px-4 py-2 bg-[#F4F4F6] rounded-xl text-[13px] text-[#6B6B76] italic">
                No active modifiers currently equipped
              </div>
            )}

            {/* 8 Compact Slots Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
              {SLOT_CONFIG.map(({ slot, label, icon: IconComponent }) => {
                const item = getItemInSlot(slot);

                return (
                  <div
                    key={slot}
                    className={`p-3 rounded-xl border transition-all text-left flex items-center gap-3 ${
                      item
                        ? 'bg-white border-[#ECECF0] hover:border-[#0891B2]/40'
                        : 'bg-[#F4F4F6]/50 border-dashed border-[#ECECF0]'
                    }`}
                  >
                    {/* 40x40 Thumbnail */}
                    <div className="w-10 h-10 rounded-lg bg-[#F4F4F6] border border-[#ECECF0] flex-shrink-0 overflow-hidden flex items-center justify-center">
                      {item && item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <IconComponent className="w-4 h-4 text-[#9A9AA5]" />
                      )}
                    </div>

                    {/* Slot Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between text-[11px] mb-0.5">
                        <span className="text-[#6B6B76] font-medium truncate">{label}</span>
                        {item && <span className="text-[#9A9AA5]">{item.weightKg} kg</span>}
                      </div>

                      {item ? (
                        <div>
                          <div className="flex items-center justify-between gap-1">
                            <button
                              onClick={() => {
                                sfx.playClick();
                                onInspectItem(item);
                              }}
                              className="font-medium text-[13px] text-[#111113] hover:text-[#0891B2] transition-colors truncate text-left"
                              title={item.name}
                            >
                              {item.name}
                            </button>
                            <button
                              onClick={() => {
                                sfx.playClick();
                                onUnequipItem(item);
                              }}
                              className="text-[11px] text-[#9A9AA5] hover:text-[#DC2626] transition-colors ml-1 flex-shrink-0 cursor-pointer"
                            >
                              Unequip
                            </button>
                          </div>

                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span
                              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                              style={{ backgroundColor: item.colorHex || '#9A9AA5' }}
                            />
                            <span className="text-[11px] text-[#6B6B76] truncate">{item.colorName || 'Default'}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-[12px] text-[#9A9AA5] italic">Empty slot</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
