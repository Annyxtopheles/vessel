import React from 'react';
import type { InventoryItem, ItemCondition } from '../types';
import { X, Lock, Unlock, Trash2, Scale, Sparkles } from 'lucide-react';
import { sfx } from '../utils/audio';

interface ItemInspectModalProps {
  item: InventoryItem | null;
  onClose: () => void;
  onToggleEquip: (item: InventoryItem) => void;
  onToggleLock: (item: InventoryItem) => void;
  onDeleteItem: (itemId: string) => void;
}

const CONDITION_MAP: Record<ItemCondition, { label: string; pct: number; color: string }> = {
  pristine: { label: 'Pristine (Unblemished)', pct: 100, color: 'bg-emerald-500' },
  seasoned: { label: 'Seasoned (Character Patina)', pct: 75, color: 'bg-[#C5A059]' },
  worn: { label: 'Worn (Field-Tested)', pct: 45, color: 'bg-amber-600' },
  needs_repair: { label: 'Needs Repair / Tailoring', pct: 20, color: 'bg-rose-500' },
};

export const ItemInspectModal: React.FC<ItemInspectModalProps> = ({
  item,
  onClose,
  onToggleEquip,
  onToggleLock,
  onDeleteItem,
}) => {
  if (!item) return null;

  const conditionInfo = CONDITION_MAP[item.condition] || CONDITION_MAP.pristine;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div 
        className="arcane-card w-full max-w-lg rounded-xl border border-[#C5A059]/40 bg-gradient-to-b from-[#13161F] via-[#0D0E14] to-[#08090C] p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={() => {
            sfx.playClick();
            onClose();
          }}
          className="absolute right-4 top-4 text-[#8C8578] hover:text-[#F3ECE0] p-1 rounded hover:bg-[#1A1C24] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Header Badge */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[10px] font-mono uppercase tracking-widest px-2.5 py-0.5 rounded bg-[#C5A059]/15 text-[#E5C378] border border-[#C5A059]/30">
            {item.rarity} {item.category.toUpperCase()}
          </span>
          {item.equipSlot && (
            <span className="text-[10px] font-mono text-[#8C8578] px-2 py-0.5 rounded bg-[#171A22] border border-[#262A36]">
              SLOT: {item.equipSlot.toUpperCase()}
            </span>
          )}
        </div>

        {/* Name and Color */}
        <div className="mb-4">
          <h2 className="font-cinzel text-xl sm:text-2xl font-bold text-[#F4EDE2] tracking-wide">
            {item.name}
          </h2>
          <div className="flex items-center gap-2 text-xs font-mono text-[#9C9487] mt-1">
            <span
              className="w-3 h-3 rounded-full border border-black/50"
              style={{ backgroundColor: item.colorHex }}
            />
            <span>{item.colorName}</span>
            <span>•</span>
            <span className="capitalize">{item.subCategory}</span>
            <span>•</span>
            <span className="capitalize">{item.season} season</span>
          </div>
        </div>

        {/* Durability / Condition Gauge */}
        <div className="mb-5 p-3 rounded-lg bg-[#0E1016] border border-[#232734]">
          <div className="flex justify-between items-center text-xs font-mono text-[#999285] mb-1.5">
            <span>CONDITION INTEGRITY</span>
            <span className="font-semibold text-[#E5C378]">{conditionInfo.label}</span>
          </div>
          <div className="h-1.5 w-full bg-[#181B24] rounded-full overflow-hidden">
            <div 
              className={`h-full ${conditionInfo.color} transition-all duration-300`}
              style={{ width: `${conditionInfo.pct}%` }}
            />
          </div>
        </div>

        {/* Lore Quote */}
        <div className="mb-5 p-3.5 rounded-lg bg-[#11131A] border-l-2 border-[#C5A059] italic font-serif text-sm text-[#BFB7A8] leading-relaxed">
          "{item.lore}"
        </div>

        {/* Locked Loot Notice if locked */}
        {item.isLocked && (
          <div className="mb-5 p-3.5 rounded-lg bg-amber-950/30 border border-amber-500/30 text-xs font-mono text-amber-300">
            <div className="flex items-center gap-1.5 font-bold text-[#E5C378] mb-1">
              <Lock className="w-3.5 h-3.5" /> WISHLIST / UNLOCK REQUISITE:
            </div>
            <p className="font-serif italic text-amber-200/90">{item.lockRequirement || 'Attain higher character level and discipline.'}</p>
          </div>
        )}

        {/* Conferred Buffs */}
        <div className="mb-6">
          <h3 className="text-xs font-cinzel font-bold text-[#E5C378] tracking-wider mb-2 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" /> ATTRIBUTE MODIFIERS & EFFECTS
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {item.buffs.map((buff, i) => (
              <div key={i} className="p-2 rounded bg-[#0E1015] border border-[#232733] flex items-center justify-between text-xs font-mono">
                <span className="text-[#968F83]">{buff.label}</span>
                <span className="px-2 py-0.5 rounded bg-[#181B24] text-[#E5C378] font-bold border border-[#C5A059]/30">
                  +{buff.value} {buff.stat}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Stats & Action Buttons */}
        <div className="pt-4 border-t border-[#232734] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-xs font-mono text-[#A8A194]">
            <span className="flex items-center gap-1">
              <Scale className="w-3.5 h-3.5 text-[#736D62]" /> {item.weightKg} kg
            </span>
            <span className="flex items-center gap-1 text-[#E5C378]">
              ⚜ ${item.goldValue.toLocaleString()}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Delete button */}
            <button
              onClick={() => {
                sfx.playClick();
                if (confirm(`Vanish ${item.name} from the ledger?`)) {
                  onDeleteItem(item.id);
                  onClose();
                }
              }}
              title="Delete item"
              className="p-2 rounded bg-[#151720] hover:bg-rose-950/60 text-[#7D766A] hover:text-rose-400 border border-[#262A36] transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            {/* Lock / Unlock Toggle */}
            <button
              onClick={() => {
                sfx.playEquip();
                onToggleLock(item);
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded bg-[#151720] hover:bg-[#1D212E] text-xs font-cinzel text-[#A8A194] hover:text-[#E5C378] border border-[#282C3B] transition-colors"
            >
              {item.isLocked ? (
                <>
                  <Unlock className="w-3.5 h-3.5 text-emerald-400" /> CLAIM AS POSSESSION
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5 text-amber-400" /> MOVE TO WISHLIST
                </>
              )}
            </button>

            {/* Equip / Unequip Toggle */}
            {!item.isLocked && (
              <button
                onClick={() => {
                  sfx.playEquip();
                  onToggleEquip(item);
                }}
                className={`flex items-center gap-1.5 px-4 py-2 rounded text-xs font-cinzel font-bold tracking-wider transition-all shadow-md ${
                  item.isEquipped
                    ? 'bg-[#1E222D] hover:bg-rose-950/80 text-[#C4BCAD] hover:text-rose-300 border border-[#333849]'
                    : 'bg-gradient-to-r from-[#C5A059] to-[#DFBC78] hover:from-[#B89248] hover:to-[#CEAA64] text-[#121318]'
                }`}
              >
                {item.isEquipped ? 'UNEQUIP FROM LOADOUT' : 'EQUIP TO LOADOUT'}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
