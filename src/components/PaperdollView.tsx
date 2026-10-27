import React from 'react';
import type { InventoryItem, EquipSlot } from '../types';
import { Sparkles, BookOpen, Laptop, Watch, Shirt, Footprints, Disc, Layers } from 'lucide-react';
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
  { slot: 'legs', label: 'Trousers', icon: Layers },
  { slot: 'footwear', label: 'Footwear', icon: Footprints },
  { slot: 'tech_relic', label: 'Tech Relic', icon: Laptop },
  { slot: 'tome', label: 'Tome / Lore', icon: BookOpen },
  { slot: 'wrist_edc', label: 'Wrist / EDC', icon: Watch },
];

export const PaperdollView: React.FC<PaperdollViewProps> = ({
  equippedItems,
  onInspectItem,
  onUnequipItem,
}) => {
  // Compute aggregate stats and buffs
  const aggregateBuffs: Record<string, number> = {};
  equippedItems.forEach(item => {
    item.buffs.forEach(buff => {
      aggregateBuffs[buff.stat] = (aggregateBuffs[buff.stat] || 0) + buff.value;
    });
  });

  const totalEquippedWeight = equippedItems.reduce((acc, it) => acc + it.weightKg, 0);

  const getItemInSlot = (slot: EquipSlot) => {
    return equippedItems.find(it => it.equipSlot === slot);
  };

  return (
    <div className="arcane-card rounded-xl p-5 border border-[#C5A059]/25 bg-gradient-to-b from-[#12141A] to-[#0A0B0E] relative overflow-hidden">
      {/* Background Runic Watermark */}
      <div className="absolute right-4 top-4 text-[#C5A059]/5 pointer-events-none select-none font-cinzel text-9xl font-black">
        VESSEL
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start relative z-10">
        
        {/* Left Column: Equipment Slots Matrix */}
        <div className="flex-1 w-full">
          <div className="flex items-center justify-between pb-3 border-b border-[#232732] mb-4">
            <div>
              <h2 className="font-cinzel text-base font-bold text-[#E5C378] tracking-wider flex items-center gap-2">
                <Disc className="w-4 h-4 text-[#C5A059]" /> ACTIVE LOADOUT & PAPERDOLL
              </h2>
              <p className="text-xs text-[#8E887B]">Equipped artifacts currently conferring real-world attribute modifiers</p>
            </div>
            <span className="text-xs font-mono text-[#A89F91] px-2 py-0.5 rounded bg-[#181A22] border border-[#2B2E3A]">
              {equippedItems.length} / 8 SLOTS FILLED
            </span>
          </div>

          {/* Grid of 8 Equip Slots */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {SLOT_CONFIG.map(({ slot, label, icon: IconComponent }) => {
              const item = getItemInSlot(slot);
              return (
                <div
                  key={slot}
                  className={`p-3 rounded-lg border transition-all ${
                    item
                      ? 'bg-[#15171F] border-[#C5A059]/30 hover:border-[#C5A059]/60 shadow-md'
                      : 'bg-[#0E1015]/60 border-dashed border-[#262934] text-[#55524B]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs font-cinzel text-[#A69E90]">
                      <IconComponent className="w-3.5 h-3.5 text-[#C5A059]" />
                      <span>{label.toUpperCase()}</span>
                    </div>

                    {item && (
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#C5A059]/10 text-[#E5C378] border border-[#C5A059]/20">
                        {item.weightKg}kg
                      </span>
                    )}
                  </div>

                  {item ? (
                    <div className="mt-2">
                      <div className="flex items-start justify-between gap-2">
                        <button
                          onClick={() => {
                            sfx.playClick();
                            onInspectItem(item);
                          }}
                          className="text-left font-serif text-sm font-semibold text-[#F1E9DB] hover:text-[#E5C378] transition-colors leading-snug line-clamp-1"
                        >
                          {item.name}
                        </button>
                        <button
                          onClick={() => {
                            sfx.playClick();
                            onUnequipItem(item);
                          }}
                          title="Unequip to bag"
                          className="text-[10px] text-[#8C8477] hover:text-rose-400 font-mono transition-colors"
                        >
                          [UNEQUIP]
                        </button>
                      </div>

                      {/* Buff chips */}
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {item.buffs.map((buff, i) => (
                          <span
                            key={i}
                            className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#1D212B] text-[#C5A059] border border-[#C5A059]/20"
                          >
                            +{buff.value} {buff.stat}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2 text-xs text-[#524E46] italic font-serif">
                      Empty Slot — equip an item from inventory
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Dynamic Buffs Tally & Encumbrance */}
        <div className="w-full lg:w-72 bg-[#0E1015] border border-[#232733] rounded-lg p-4 flex flex-col justify-between">
          <div>
            <h3 className="font-cinzel text-xs font-bold text-[#E5C378] tracking-wider pb-2 border-b border-[#232733] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" /> CONFERRED REAL-LIFE BUFFS
            </h3>

            <div className="space-y-2 mt-3">
              {Object.keys(aggregateBuffs).length === 0 ? (
                <p className="text-xs text-[#635D52] italic font-serif">No active buffs conferred. Equip artifacts to activate life bonuses.</p>
              ) : (
                Object.entries(aggregateBuffs).map(([stat, val]) => (
                  <div key={stat} className="flex justify-between items-center text-xs font-mono">
                    <span className="text-[#A39B8E]">{stat} MODIFIER</span>
                    <span className="px-2 py-0.5 rounded bg-[#1B1F2A] border border-[#C5A059]/30 text-[#E5C378] font-bold">
                      +{val}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Loadout Weight Stats */}
          <div className="mt-6 pt-3 border-t border-[#232733] text-xs font-mono">
            <div className="flex justify-between items-center text-[#9E9789] mb-1">
              <span>EQUIPPED LOAD:</span>
              <span className="text-[#F1E8D9] font-medium">{totalEquippedWeight.toFixed(2)} kg</span>
            </div>
            <p className="text-[10px] text-[#6E685C] leading-normal">
              Items worn directly reduce mental friction and augment readiness for active tasks.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
};
