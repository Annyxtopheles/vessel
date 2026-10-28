import React, { useState, useEffect } from 'react';
import type { InventoryItem, ItemCondition, OwnershipStatus, PastReason, ItemCategory } from '../types';
import { X, Lock, Trash2, Scale, History, Edit3, Check, Upload, Copy } from 'lucide-react';
import { sfx } from '../utils/audio';

interface ItemInspectModalProps {
  item: InventoryItem | null;
  onClose: () => void;
  onToggleEquip: (item: InventoryItem) => void;
  onChangeStatus: (item: InventoryItem, newStatus: OwnershipStatus, pastReason?: PastReason, pastDate?: string) => void;
  onDeleteItem: (itemId: string) => void;
  onUpdateItem?: (updated: InventoryItem) => void;
  onDuplicateItem?: (item: InventoryItem) => void;
}

const CONDITION_MAP: Record<ItemCondition, { label: string; pct: number; color: string }> = {
  pristine: { label: 'Pristine (Like New)', pct: 100, color: 'bg-[#34d399]' },
  seasoned: { label: 'Seasoned (Well-Kept)', pct: 75, color: 'bg-[#38bdf8]' },
  worn: { label: 'Worn (Heavy Use)', pct: 45, color: 'bg-[#f87171]' },
  needs_repair: { label: 'Needs Repair / Tailoring', pct: 20, color: 'bg-[#dc2626]' },
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
  onUpdateItem,
  onDuplicateItem,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedPastReason, setSelectedPastReason] = useState<PastReason>('sold');
  const [isChoosingPastReason, setIsChoosingPastReason] = useState(false);

  // Editable fields
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState<ItemCategory>('apparel');
  const [editSubCategory, setEditSubCategory] = useState('');
  const [editWeightKg, setEditWeightKg] = useState('0.5');
  const [editGoldValue, setEditGoldValue] = useState('100');
  const [editCondition, setEditCondition] = useState<ItemCondition>('pristine');
  const [editImageUrl, setEditImageUrl] = useState('');
  const [editLore, setEditLore] = useState('');

  // Sync edit state when item changes
  useEffect(() => {
    if (item) {
      setEditName(item.name);
      setEditCategory(item.category);
      setEditSubCategory(item.subCategory);
      setEditWeightKg(item.weightKg.toString());
      setEditGoldValue(item.goldValue.toString());
      setEditCondition(item.condition);
      setEditImageUrl(item.imageUrl || '');
      setEditLore(item.lore);
      setIsEditing(false);
      setIsChoosingPastReason(false);
    }
  }, [item]);

  if (!item) return null;

  const currentStatus: OwnershipStatus = item.ownershipStatus || (item.isLocked ? 'wishlist' : 'owned');
  const conditionInfo = CONDITION_MAP[item.condition] || CONDITION_MAP.pristine;

  const handleSetPast = (reason: PastReason) => {
    sfx.playClick();
    const today = new Date().toISOString().split('T')[0];
    onChangeStatus(item, 'past', reason, today);
    setIsChoosingPastReason(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setEditImageUrl(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveEdits = () => {
    if (!editName.trim()) return;
    sfx.playClick();

    const updated: InventoryItem = {
      ...item,
      name: editName.trim(),
      category: editCategory,
      subCategory: editSubCategory.trim() || 'General',
      weightKg: Math.max(0.01, parseFloat(editWeightKg) || 0.1),
      goldValue: Math.max(0, parseInt(editGoldValue, 10) || 0),
      condition: editCondition,
      imageUrl: editImageUrl.trim() || undefined,
      lore: editLore.trim() || 'Personal item in inventory.',
    };

    if (onUpdateItem) {
      onUpdateItem(updated);
    }
    setIsEditing(false);
  };

  const handleDuplicate = () => {
    sfx.playClick();
    if (onDuplicateItem) {
      const clone: InventoryItem = {
        ...item,
        id: `item-${Date.now()}`,
        name: `${item.name} (Copy)`,
        isEquipped: false,
      };
      onDuplicateItem(clone);
      onClose();
    }
  };

  return (
    <div
      onClick={() => {
        sfx.playClick();
        onClose();
      }}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
    >
      <div 
        className="w-full max-w-lg bg-[#101217] border border-[#1a1d26] rounded-xl overflow-hidden shadow-2xl relative animate-in fade-in zoom-in-95 cursor-default max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header / Actions */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#181b24] bg-[#101217]">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider font-semibold text-[#94a3b8]">
              {isEditing ? 'Editing Item Details' : 'Item Codex Record'}
            </span>
            <span className="linear-tag font-medium">
              {item.rarity}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {!isEditing ? (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-1.5 rounded-md text-[#94a3b8] hover:text-white hover:bg-[#151922] transition-colors"
                  title="Edit item attributes"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                {onDuplicateItem && (
                  <button
                    onClick={handleDuplicate}
                    className="p-1.5 rounded-md text-[#94a3b8] hover:text-white hover:bg-[#151922] transition-colors"
                    title="Duplicate as new item"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                )}
              </>
            ) : (
              <button
                onClick={handleSaveEdits}
                className="flex items-center gap-1 px-3 py-1 rounded bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-semibold shadow-xs"
              >
                <Check className="w-3.5 h-3.5" /> Save
              </button>
            )}

            <button
              onClick={() => {
                sfx.playClick();
                onClose();
              }}
              className="p-1.5 rounded-md text-[#94a3b8] hover:text-white hover:bg-[#151922] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1">
          {/* Item Image Showcase */}
          {(!isEditing && item.imageUrl) && (
            <div className="w-full h-52 bg-[#090b0e] relative overflow-hidden border-b border-[#181b24]">
              <img
                src={item.imageUrl}
                alt={item.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#101217] via-transparent to-transparent" />
            </div>
          )}

          <div className="p-6">
            {isEditing ? (
              /* Inline Edit Mode Form */
              <div className="space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider font-semibold text-[#94a3b8] mb-1">
                    Item Name
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-1.5 bg-[#0b0d12] border border-[#1a1d26] rounded-md text-sm text-white focus:outline-none focus:border-[#0ea5e9]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs uppercase tracking-wider font-semibold text-[#94a3b8] mb-1">
                      Category
                    </label>
                    <select
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value as ItemCategory)}
                      className="w-full px-2.5 py-1.5 bg-[#0b0d12] border border-[#1a1d26] rounded-md text-xs text-white"
                    >
                      <option value="apparel">Apparel & Wardrobe</option>
                      <option value="tech">Tech & Hardware</option>
                      <option value="tomes">Book / Tome</option>
                      <option value="edc">Everyday Carry (EDC)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider font-semibold text-[#94a3b8] mb-1">
                      Subcategory Tag
                    </label>
                    <input
                      type="text"
                      value={editSubCategory}
                      onChange={(e) => setEditSubCategory(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-[#0b0d12] border border-[#1a1d26] rounded-md text-xs text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs uppercase tracking-wider font-semibold text-[#94a3b8] mb-1">
                      Weight (kg)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={editWeightKg}
                      onChange={(e) => setEditWeightKg(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-[#0b0d12] border border-[#1a1d26] rounded-md text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider font-semibold text-[#94a3b8] mb-1">
                      Value ($)
                    </label>
                    <input
                      type="number"
                      value={editGoldValue}
                      onChange={(e) => setEditGoldValue(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-[#0b0d12] border border-[#1a1d26] rounded-md text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider font-semibold text-[#94a3b8] mb-1">
                      Condition
                    </label>
                    <select
                      value={editCondition}
                      onChange={(e) => setEditCondition(e.target.value as ItemCondition)}
                      className="w-full px-2.5 py-1.5 bg-[#0b0d12] border border-[#1a1d26] rounded-md text-xs text-white"
                    >
                      <option value="pristine">Pristine</option>
                      <option value="seasoned">Seasoned</option>
                      <option value="worn">Worn</option>
                      <option value="needs_repair">Needs Repair</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider font-semibold text-[#94a3b8] mb-1">
                    Image (URL or Local File Upload)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editImageUrl}
                      onChange={(e) => setEditImageUrl(e.target.value)}
                      placeholder="https://... or upload file"
                      className="flex-1 px-3 py-1.5 bg-[#0b0d12] border border-[#1a1d26] rounded-md text-xs text-white focus:outline-none focus:border-[#0ea5e9]"
                    />
                    <label className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#121620] border border-[#1d222e] text-xs text-[#94a3b8] hover:text-white hover:bg-[#1a202d] transition-colors font-medium">
                      <Upload className="w-3.5 h-3.5 text-[#38bdf8]" />
                      <span>Upload</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider font-semibold text-[#94a3b8] mb-1">
                    Lore / Functional Purpose
                  </label>
                  <textarea
                    rows={3}
                    value={editLore}
                    onChange={(e) => setEditLore(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0b0d12] border border-[#1a1d26] rounded-md text-xs text-white focus:outline-none focus:border-[#0ea5e9]"
                  />
                </div>
              </div>
            ) : (
              /* View Mode */
              <>
                {/* Top Badges */}
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="linear-tag">
                    {item.category} • {item.subCategory}
                  </span>

                  {/* Ownership Status Badge */}
                  <span className="linear-tag flex items-center gap-1.5 font-medium">
                    {currentStatus === 'owned' && <span className="text-[#34d399]">● Owned</span>}
                    {currentStatus === 'wishlist' && <span className="text-[#38bdf8]">● Wishlist</span>}
                    {currentStatus === 'past' && <span className="text-[#60a5fa]">● Past Possession ({item.pastReason || 'archived'})</span>}
                  </span>

                  {item.equipSlot && (
                    <span className="linear-tag">
                      Slot: {item.equipSlot}
                    </span>
                  )}
                </div>

                {/* Title & Metadata */}
                <div className="mb-4">
                  <h2 className="text-lg font-semibold text-white tracking-tight">
                    {item.name}
                  </h2>
                  <div className="flex items-center gap-2 text-xs text-[#94a3b8] mt-1 font-medium">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: item.colorHex }}
                    />
                    <span>{item.colorName}</span>
                    <span>•</span>
                    <span className="capitalize">{item.season} season</span>
                  </div>
                </div>

                {/* Condition Bar */}
                <div className="mb-4 p-3 rounded-lg bg-[#0b0d12] border border-[#1a1d26]">
                  <div className="flex justify-between items-center text-xs text-[#94a3b8] mb-1.5 font-medium">
                    <span>Condition Status</span>
                    <span className="text-white">{conditionInfo.label}</span>
                  </div>
                  <div className="h-1.5 w-full bg-[#121620] rounded-full overflow-hidden">
                    <div
                      className={`h-full ${conditionInfo.color} transition-all duration-300`}
                      style={{ width: `${conditionInfo.pct}%` }}
                    />
                  </div>
                </div>

                {/* Lore / Description */}
                <div className="mb-4 p-3.5 rounded-lg bg-[#0b0d12] border border-[#1a1d26] text-xs text-[#94a3b8] leading-relaxed">
                  {item.lore}
                </div>

                {/* Wishlist Goal if wishlist */}
                {currentStatus === 'wishlist' && (
                  <div className="mb-4 p-3.5 rounded-lg bg-[#081b26] border border-[#075985]/50 text-xs">
                    <div className="flex items-center gap-1.5 font-semibold text-[#38bdf8] mb-1 text-xs">
                      <Lock className="w-3.5 h-3.5" /> Acquisition Milestone Goal
                    </div>
                    <p className="text-[#94a3b8]">{item.lockRequirement || 'Target purchase / discipline milestone.'}</p>
                  </div>
                )}

                {/* Past Ownership Memory Notes */}
                {currentStatus === 'past' && (
                  <div className="mb-4 p-3.5 rounded-lg bg-[#0f1d2d] border border-[#1e3a5f] text-xs">
                    <div className="flex items-center gap-1.5 font-semibold text-[#60a5fa] mb-1 text-xs">
                      <History className="w-3.5 h-3.5" /> Possession Archive
                    </div>
                    <p className="text-[#94a3b8]">
                      Parted with via <strong className="capitalize text-white">{item.pastReason || 'retiring'}</strong>
                      {item.pastDate ? ` on ${item.pastDate}` : ''}. Preserved in your life history without adding to active wardrobe carry weight.
                    </p>
                  </div>
                )}

                {/* Conferred Buffs */}
                <div className="mb-4">
                  <h3 className="text-xs uppercase tracking-wider font-semibold text-[#94a3b8] mb-2">
                    Conferred Life Modifiers
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {item.buffs.map((buff, i) => (
                      <div key={i} className="p-2.5 rounded-lg bg-[#0b0d12] border border-[#1a1d26] flex items-center justify-between text-xs">
                        <span className="text-[#94a3b8]">{buff.label}</span>
                        <span className="linear-tag text-[#38bdf8] bg-[#0c1f2e] border-[#075985]/40 font-semibold">
                          +{buff.value} {FULL_MODIFIER_NAMES[buff.stat] || buff.stat}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Ownership Lifecycle Transition Control */}
                <div className="p-3.5 rounded-lg bg-[#0b0d12] border border-[#1a1d26]">
                  <span className="text-xs uppercase tracking-wider font-semibold text-[#94a3b8] block mb-2">
                    Possession State:
                  </span>

                  <div className="flex flex-wrap items-center gap-2">
                    {currentStatus !== 'owned' && (
                      <button
                        onClick={() => {
                          sfx.playEquip();
                          onChangeStatus(item, 'owned');
                        }}
                        className="px-3 py-1.5 rounded-md bg-[#121620] hover:bg-[#1a202d] text-white border border-[#1d222e] text-xs font-medium transition-colors"
                      >
                        Mark as Owned
                      </button>
                    )}

                    {currentStatus !== 'wishlist' && (
                      <button
                        onClick={() => {
                          sfx.playClick();
                          onChangeStatus(item, 'wishlist');
                        }}
                        className="px-3 py-1.5 rounded-md bg-[#121620] hover:bg-[#1a202d] text-white border border-[#1d222e] text-xs font-medium transition-colors"
                      >
                        Move to Wishlist
                      </button>
                    )}

                    {currentStatus !== 'past' && !isChoosingPastReason && (
                      <button
                        onClick={() => setIsChoosingPastReason(true)}
                        className="px-3 py-1.5 rounded-md bg-[#121620] hover:bg-[#1a202d] text-white border border-[#1d222e] text-xs font-medium transition-colors"
                      >
                        Parted With
                      </button>
                    )}
                  </div>

                  {/* Sub-form when choosing Parted With reason */}
                  {isChoosingPastReason && (
                    <div className="mt-3 pt-3 border-t border-[#181b24] flex items-center gap-2">
                      <span className="text-xs text-[#94a3b8] font-medium">Reason:</span>
                      <select
                        value={selectedPastReason}
                        onChange={(e) => setSelectedPastReason(e.target.value as PastReason)}
                        className="px-2.5 py-1 bg-[#121620] border border-[#1d222e] rounded text-xs text-white"
                      >
                        <option value="sold">Sold</option>
                        <option value="gifted">Gifted</option>
                        <option value="donated">Donated</option>
                        <option value="retired">Retired / Worn Out</option>
                        <option value="lost">Lost / Discarded</option>
                      </select>

                      <button
                        onClick={() => handleSetPast(selectedPastReason)}
                        className="px-3 py-1 rounded bg-[#0284c7] text-white text-xs font-semibold hover:bg-[#0369a1]"
                      >
                        Confirm Archive
                      </button>
                      <button
                        onClick={() => setIsChoosingPastReason(false)}
                        className="px-2 py-1 rounded text-[#94a3b8] text-xs hover:text-white"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer Metrics & Actions */}
        <div className="p-4 bg-[#0e1015] border-t border-[#181b24] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-4 text-xs text-[#94a3b8]">
            <span className="flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5 text-[#64748b]" /> {item.weightKg} kg
            </span>
            <span className="text-white font-semibold">
              ${item.goldValue.toLocaleString()}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                sfx.playClick();
                if (confirm(`Completely delete "${item.name}" from your vault?`)) {
                  onDeleteItem(item.id);
                  onClose();
                }
              }}
              title="Delete item permanently"
              className="p-2 rounded-md bg-[#121620] hover:bg-rose-950/40 text-[#94a3b8] hover:text-rose-400 border border-[#1d222e] transition-colors"
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
                    ? 'bg-[#121620] hover:bg-rose-950/60 text-white hover:text-rose-300 border border-[#1d222e]'
                    : 'bg-[#0284c7] hover:bg-[#0369a1] text-white shadow-xs'
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
