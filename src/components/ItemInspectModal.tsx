import React, { useState } from 'react';
import type { InventoryItem, ItemCondition, OwnershipStatus, PastReason } from '../types';
import { X, Lock, Trash2, Scale, History } from 'lucide-react';
import { sfx } from '../utils/audio';

interface ItemInspectModalProps {
  item: InventoryItem | null;
  onClose: () => void;
  onToggleEquip: (item: InventoryItem) => void;
  onChangeStatus: (item: InventoryItem, newStatus: OwnershipStatus, pastReason?: PastReason, pastDate?: string) => void;
  onDeleteItem: (itemId: string) => void;
}

const CONDITION_MAP: Record<ItemCondition, { label: string; pct: number; color: string }> = {
  pristine: { label: 'Pristine (Like New)', pct: 100, color: 'bg-neutral-300' },
  seasoned: { label: 'Seasoned (Well-Kept)', pct: 75, color: 'bg-neutral-400' },
  worn: { label: 'Worn (Heavy Use)', pct: 45, color: 'bg-neutral-500' },
  needs_repair: { label: 'Needs Repair / Tailoring', pct: 20, color: 'bg-rose-400' },
};

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

export const ItemInspectModal: React.FC<ItemInspectModalProps> = ({
  item,
  onClose,
  onToggleEquip,
  onChangeStatus,
  onDeleteItem,
}) => {
  const [selectedPastReason, setSelectedPastReason] = useState<PastReason>('sold');
  const [isChoosingPastReason, setIsChoosingPastReason] = useState(false);

  if (!item) return null;

  const currentStatus: OwnershipStatus = item.ownershipStatus || (item.isLocked ? 'wishlist' : 'owned');
  const conditionInfo = CONDITION_MAP[item.condition] || CONDITION_MAP.pristine;

  const handleSetPast = (reason: PastReason) => {
    sfx.playClick();
    const today = new Date().toISOString().split('T')[0];
    onChangeStatus(item, 'past', reason, today);
    setIsChoosingPastReason(false);
  };

  return (
    <div
      onClick={() => {
        sfx.playClick();
        onClose();
      }}
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
    >
      <div 
        className="ui-card w-full max-w-lg bg-[#14161a] border border-[#2b2e38] overflow-hidden shadow-2xl relative animate-in fade-in zoom-in-95 cursor-default max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={() => {
            sfx.playClick();
            onClose();
          }}
          className="absolute right-4 top-4 z-10 text-neutral-300 hover:text-white p-1.5 rounded-full bg-black/60 hover:bg-black/90 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1">
          {/* Item Image Showcase */}
          {item.imageUrl && (
            <div className="w-full h-52 bg-[#0f1115] relative overflow-hidden border-b border-[#23262e]">
              <img
                src={item.imageUrl}
                alt={item.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#14161a] via-transparent to-transparent" />
            </div>
          )}

          <div className="p-6 pt-4">
            {/* Top Badges */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#1c1f26] border border-[#2d313d] text-neutral-300">
                {item.rarity} • {item.category}
              </span>

              {/* Ownership Status Badge */}
              <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full border bg-[#181a20] text-neutral-300 border-[#2b2e38]">
                {currentStatus === 'owned' && 'Currently Owned'}
                {currentStatus === 'wishlist' && 'Wish to Own'}
                {currentStatus === 'past' && `Used to Own (${item.pastReason || 'archived'})`}
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

            {/* Wishlist Goal if wishlist */}
            {currentStatus === 'wishlist' && (
              <div className="mb-4 p-3.5 rounded-lg bg-amber-950/20 border border-amber-800/30 text-xs text-amber-200">
                <div className="flex items-center gap-1.5 font-semibold text-amber-300 mb-1">
                  <Lock className="w-3.5 h-3.5" /> Wishlist Acquisition Goal
                </div>
                <p className="text-neutral-300">{item.lockRequirement || 'Target purchase / discipline milestone.'}</p>
              </div>
            )}

            {/* Past Ownership Memory Notes */}
            {currentStatus === 'past' && (
              <div className="mb-4 p-3.5 rounded-lg bg-sky-950/20 border border-sky-800/30 text-xs text-sky-200">
                <div className="flex items-center gap-1.5 font-semibold text-sky-300 mb-1">
                  <History className="w-3.5 h-3.5" /> Past Possession Archive
                </div>
                <p className="text-neutral-300">
                  Parted with via <strong className="capitalize text-white">{item.pastReason || 'retiring'}</strong>
                  {item.pastDate ? ` on ${item.pastDate}` : ''}. Preserved in your life history without adding to active wardrobe carry weight.
                </p>
              </div>
            )}

            {/* Conferred Buffs */}
            <div className="mb-4">
              <h3 className="text-xs font-semibold text-neutral-400 mb-2 uppercase tracking-wider text-[11px]">
                Conferred Life Modifiers
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {item.buffs.map((buff, i) => (
                  <div key={i} className="p-2 rounded-lg bg-[#101216] border border-[#20232b] flex items-center justify-between text-xs">
                    <span className="text-neutral-300">{buff.label}</span>
                    <span className="px-2 py-0.5 rounded font-mono font-bold text-[#e5b869] bg-[#1c1f26] border border-[#2d313d]">
                      +{buff.value} {FULL_MODIFIER_NAMES[buff.stat] || buff.stat}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Ownership Lifecycle Transition Control */}
            <div className="p-3.5 rounded-lg bg-[#101216] border border-[#20232b]">
              <span className="text-[11px] font-semibold text-neutral-400 block uppercase tracking-wider mb-2">
                Update Possession State:
              </span>

              <div className="flex flex-wrap items-center gap-2">
                {currentStatus !== 'owned' && (
                  <button
                    onClick={() => {
                      sfx.playEquip();
                      onChangeStatus(item, 'owned');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-[#181a20] hover:bg-emerald-950/40 text-neutral-200 hover:text-emerald-300 border border-[#272a34] text-xs font-medium transition-colors"
                  >
                    Mark as Owned (Acquired)
                  </button>
                )}

                {currentStatus !== 'wishlist' && (
                  <button
                    onClick={() => {
                      sfx.playClick();
                      onChangeStatus(item, 'wishlist');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-[#181a20] hover:bg-amber-950/40 text-neutral-200 hover:text-amber-300 border border-[#272a34] text-xs font-medium transition-colors"
                  >
                    Move to Wishlist
                  </button>
                )}

                {currentStatus !== 'past' && !isChoosingPastReason && (
                  <button
                    onClick={() => setIsChoosingPastReason(true)}
                    className="px-3 py-1.5 rounded-lg bg-[#181a20] hover:bg-sky-950/40 text-neutral-200 hover:text-sky-300 border border-[#272a34] text-xs font-medium transition-colors"
                  >
                    Parted With (Used to Own)
                  </button>
                )}
              </div>

              {/* Sub-form when choosing Parted With reason */}
              {isChoosingPastReason && (
                <div className="mt-3 pt-3 border-t border-[#1d2027] flex items-center gap-2">
                  <span className="text-xs text-neutral-400">Reason:</span>
                  <select
                    value={selectedPastReason}
                    onChange={(e) => setSelectedPastReason(e.target.value as PastReason)}
                    className="px-2.5 py-1 bg-[#181a20] border border-[#272a34] rounded text-xs text-white"
                  >
                    <option value="sold">Sold</option>
                    <option value="gifted">Gifted</option>
                    <option value="donated">Donated</option>
                    <option value="retired">Retired / Worn Out</option>
                    <option value="lost">Lost / Discarded</option>
                  </select>

                  <button
                    onClick={() => handleSetPast(selectedPastReason)}
                    className="px-3 py-1 rounded bg-sky-600 text-white text-xs font-semibold hover:bg-sky-500"
                  >
                    Confirm Archive
                  </button>
                  <button
                    onClick={() => setIsChoosingPastReason(false)}
                    className="px-2 py-1 rounded text-neutral-400 text-xs hover:text-white"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Metrics & Actions */}
        <div className="p-4 bg-[#111317] border-t border-[#23262f] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
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
                if (confirm(`Completely purge "${item.name}" from the database?`)) {
                  onDeleteItem(item.id);
                  onClose();
                }
              }}
              title="Delete item permanently"
              className="p-2 rounded-lg bg-[#181a20] hover:bg-rose-950/40 text-neutral-400 hover:text-rose-400 border border-[#272a34] transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            {currentStatus === 'owned' && (
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
