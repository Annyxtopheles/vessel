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
  pristine: { label: 'Pristine (Like New)', pct: 100, color: 'bg-emerald-500' },
  seasoned: { label: 'Seasoned (Well-Kept)', pct: 75, color: 'bg-[#e5b869]' },
  worn: { label: 'Worn (Heavy Use)', pct: 45, color: 'bg-amber-600' },
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
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div 
        className="ui-card w-full max-w-lg bg-[#14161a] border border-[#2b2e38] p-6 shadow-2xl relative animate-in fade-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={() => {
            sfx.playClick();
            onClose();
          }}
          className="absolute right-4 top-4 text-neutral-400 hover:text-white p-1 rounded-md hover:bg-[#1f2229] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Badges */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[11px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#1c1f26] border border-[#2d313d] text-neutral-300">
            {item.rarity} • {item.category}
          </span>
          {item.equipSlot && (
            <span className="text-[11px] font-medium text-neutral-400 px-2.5 py-0.5 rounded-full bg-[#1c1f26] border border-[#2d313d]">
              Slot: {item.equipSlot}
            </span>
          )}
        </div>

        {/* Title & Metadata */}
        <div className="mb-4">
          <h2 className="text-xl font-bold text-white tracking-tight">
            {item.name}
          </h2>
          <div className="flex items-center gap-2 text-xs text-neutral-400 mt-1">
            <span
              className="w-3 h-3 rounded-full border border-black/40"
              style={{ backgroundColor: item.colorHex }}
            />
            <span className="font-medium text-neutral-300">{item.colorName}</span>
            <span>•</span>
            <span>{item.subCategory}</span>
            <span>•</span>
            <span className="capitalize">{item.season} season</span>
          </div>
        </div>

        {/* Condition Bar */}
        <div className="mb-4 p-3 rounded-lg bg-[#101216] border border-[#20232b]">
          <div className="flex justify-between items-center text-xs text-neutral-400 mb-1.5">
            <span>Condition Status</span>
            <span className="font-medium text-white">{conditionInfo.label}</span>
          </div>
          <div className="h-1.5 w-full bg-[#1d2027] rounded-full overflow-hidden">
            <div
              className={`h-full ${conditionInfo.color} transition-all duration-300`}
              style={{ width: `${conditionInfo.pct}%` }}
            />
          </div>
        </div>

        {/* Lore / Description */}
        <div className="mb-4 p-3.5 rounded-lg bg-[#101216] border border-[#20232b] text-sm text-neutral-300 leading-relaxed">
          {item.lore}
        </div>

        {/* Wishlist Notice if locked */}
        {item.isLocked && (
          <div className="mb-4 p-3.5 rounded-lg bg-amber-950/20 border border-amber-800/30 text-xs text-amber-200">
            <div className="flex items-center gap-1.5 font-semibold text-amber-300 mb-1">
              <Lock className="w-3.5 h-3.5" /> Wishlist Acquisition Goal
            </div>
            <p className="text-neutral-300">{item.lockRequirement || 'No unlock criteria specified.'}</p>
          </div>
        )}

        {/* Conferred Buffs */}
        <div className="mb-6">
          <h3 className="text-xs font-semibold text-neutral-400 mb-2 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#e5b869]" /> Conferred Life Attributes
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {item.buffs.map((buff, i) => (
              <div key={i} className="p-2 rounded-lg bg-[#101216] border border-[#20232b] flex items-center justify-between text-xs">
                <span className="text-neutral-300">{buff.label}</span>
                <span className="px-2 py-0.5 rounded font-mono font-bold text-[#e5b869] bg-[#1c1f26] border border-[#2d313d]">
                  +{buff.value} {buff.stat}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Metrics & Actions */}
        <div className="pt-4 border-t border-[#23262f] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-4 text-xs text-neutral-400">
            <span className="flex items-center gap-1">
              <Scale className="w-3.5 h-3.5 text-neutral-500" /> {item.weightKg} kg
            </span>
            <span className="font-medium text-white">
              ${item.goldValue.toLocaleString()}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                sfx.playClick();
                if (confirm(`Remove "${item.name}" from inventory?`)) {
                  onDeleteItem(item.id);
                  onClose();
                }
              }}
              title="Delete item"
              className="p-2 rounded-lg bg-[#181a20] hover:bg-rose-950/40 text-neutral-400 hover:text-rose-400 border border-[#272a34] transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                sfx.playEquip();
                onToggleLock(item);
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#181a20] hover:bg-[#20232b] text-xs font-medium text-neutral-300 border border-[#272a34] transition-colors"
            >
              {item.isLocked ? (
                <>
                  <Unlock className="w-3.5 h-3.5 text-emerald-400" /> Mark as Acquired
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5 text-amber-400" /> Move to Wishlist
                </>
              )}
            </button>

            {!item.isLocked && (
              <button
                onClick={() => {
                  sfx.playEquip();
                  onToggleEquip(item);
                }}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                  item.isEquipped
                    ? 'bg-[#1e222a] hover:bg-rose-950/60 text-neutral-200 hover:text-rose-300 border border-[#2d313d]'
                    : 'bg-[#e5b869] hover:bg-[#d8a857] text-[#0f1115] shadow-sm'
                }`}
              >
                {item.isEquipped ? 'Unequip from Loadout' : 'Equip to Loadout'}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
