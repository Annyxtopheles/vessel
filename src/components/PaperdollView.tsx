import React, { useState } from 'react';
import type { InventoryItem, EquipSlot } from '../types';
import { Shirt, Footprints, Laptop, BookOpen, Watch, Layers, ChevronDown, ChevronUp } from 'lucide-react';
import { sfx } from '../utils/audio';

interface PaperdollViewProps {
  equippedItems: InventoryItem[];
  onInspectItem: (item: InventoryItem) => void;
  onUnequipItem: (item: InventoryItem) => void;
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
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

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

  return (
    <div className="bg-[#12141a] border border-[#20232c] rounded-xl p-5 mb-6">
      {/* Header bar */}
      <div className="flex items-center justify-between pb-3 border-b border-[#20232c]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#161822] border border-[#20232c] flex items-center justify-center text-[#d8b46b]">
            <Shirt className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-medium text-[#f3f4f6] tracking-tight">Active Loadout & Daily Equips</h2>
            <p className="text-xs text-[#8a8f98]">
              Items currently worn or carried that confer character attribute bonuses
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="linear-tag">
            {equippedItems.length} / 8 slots active
          </span>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded text-[#8a8f98] hover:text-[#f3f4f6] transition-colors"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <>
          {/* Active Buffs Summary Row with Linear tags */}
          {Object.keys(aggregateBuffs).length > 0 && (
            <div className="pt-3 pb-3 flex flex-wrap items-center gap-2 border-b border-[#20232c]">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#8a8f98] mr-1">
                Active Modifiers:
              </span>
              {Object.entries(aggregateBuffs).map(([stat, val]) => (
                <span
                  key={stat}
                  className="linear-tag flex items-center gap-1.5"
                >
                  <span className="text-[#d8b46b] font-semibold">+{val}</span>
                  <span className="text-[#f3f4f6]">{FULL_MODIFIER_NAMES[stat] || stat}</span>
                </span>
              ))}
            </div>
          )}

          {/* Clean 4-column Slot Cards with Thumbnail Preview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
            {SLOT_CONFIG.map(({ slot, label, icon: IconComponent }) => {
              const item = getItemInSlot(slot);

              return (
                <div
                  key={slot}
                  className={`p-3 rounded-lg border transition-all text-left flex items-center gap-3 min-h-[76px] ${
                    item
                      ? 'bg-[#15171f] border-[#20232c] hover:border-[#2e323e]'
                      : 'bg-[#0d0e12]/60 border-dashed border-[#1f222b]'
                  }`}
                >
                  {/* Thumbnail */}
                  <div className="w-12 h-12 rounded-md bg-[#0d0e12] border border-[#20232c] flex-shrink-0 overflow-hidden flex items-center justify-center">
                    {item && item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <IconComponent className="w-4 h-4 text-[#4e5360]" />
                    )}
                  </div>

                  {/* Slot Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between text-xs mb-0.5">
                      <span className="text-[11px] font-mono uppercase tracking-wider text-[#8a8f98] truncate">{label}</span>
                      {item && (
                        <span className="text-[11px] font-mono text-[#8a8f98]">{item.weightKg}kg</span>
                      )}
                    </div>

                    {item ? (
                      <div>
                        <div className="flex items-center justify-between gap-1">
                          <button
                            onClick={() => {
                              sfx.playClick();
                              onInspectItem(item);
                            }}
                            className="font-medium text-xs text-[#f3f4f6] hover:text-[#d8b46b] transition-colors truncate text-left"
                            title={item.name}
                          >
                            {item.name}
                          </button>
                          <button
                            onClick={() => {
                              sfx.playClick();
                              onUnequipItem(item);
                            }}
                            className="text-[10px] text-[#8a8f98] hover:text-rose-400 transition-colors ml-1"
                          >
                            Unequip
                          </button>
                        </div>

                        <div className="flex items-center gap-1.5 mt-1">
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: item.colorHex }}
                          />
                          <span className="text-[11px] text-[#8a8f98] truncate">{item.colorName}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-[11px] text-[#4e5360]">
                        Empty Slot
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
