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
    <div className="ui-card p-5 mb-6">
      {/* Header bar */}
      <div className="flex items-center justify-between pb-3 border-b border-[#23262f]">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#1c1f26] border border-[#2b2e38] text-[#e5b869]">
            <Shirt className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white tracking-tight">Active Loadout & Daily Equips</h2>
            <p className="text-xs text-neutral-400">
              Items currently worn or carried that provide active character attribute bonuses
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-[#1c1f26] border border-[#282b35] text-neutral-300">
            {equippedItems.length} / 8 slots active
          </span>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded text-neutral-400 hover:text-white transition-colors"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <>
          {/* Active Buffs Summary Row with Full Clear Names */}
          {Object.keys(aggregateBuffs).length > 0 && (
            <div className="pt-3 pb-4 flex flex-wrap items-center gap-2 border-b border-[#23262f]/60">
              <span className="text-xs font-semibold text-neutral-400 mr-1 uppercase tracking-wider text-[11px]">
                Active Modifiers:
              </span>
              {Object.entries(aggregateBuffs).map(([stat, val]) => (
                <span
                  key={stat}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1b1e26] border border-[#2d313d] text-xs font-medium text-neutral-200"
                >
                  <span className="text-[#e5b869] font-bold">+{val}</span>
                  <span>{FULL_MODIFIER_NAMES[stat] || stat}</span>
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
                  className={`p-3 rounded-lg border transition-all text-left flex items-center gap-3 min-h-[80px] ${
                    item
                      ? 'bg-[#181a21] border-[#2c303c] hover:border-[#3d4354]'
                      : 'bg-[#121317]/50 border-dashed border-[#23262e]'
                  }`}
                >
                  {/* Thumbnail */}
                  <div className="w-14 h-14 rounded-md bg-[#0f1115] border border-[#23262e] flex-shrink-0 overflow-hidden flex items-center justify-center">
                    {item && item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <IconComponent className="w-5 h-5 text-neutral-600" />
                    )}
                  </div>

                  {/* Slot Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between text-xs text-neutral-400 mb-0.5">
                      <span className="font-medium text-neutral-400 truncate">{label}</span>
                      {item && (
                        <span className="text-[11px] font-mono text-neutral-500">{item.weightKg}kg</span>
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
                            className="font-medium text-xs text-white hover:text-[#e5b869] transition-colors truncate text-left"
                            title={item.name}
                          >
                            {item.name}
                          </button>
                          <button
                            onClick={() => {
                              sfx.playClick();
                              onUnequipItem(item);
                            }}
                            className="text-[10px] text-neutral-500 hover:text-rose-400 transition-colors ml-1"
                          >
                            Unequip
                          </button>
                        </div>

                        <div className="flex items-center gap-1.5 mt-1">
                          <span
                            className="w-2 h-2 rounded-full border border-black/40"
                            style={{ backgroundColor: item.colorHex }}
                          />
                          <span className="text-[11px] text-neutral-400 truncate">{item.colorName}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-[11px] text-neutral-600 italic">
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
