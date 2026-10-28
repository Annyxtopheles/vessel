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
  pristine: { label: 'Pristine (Like New)', pct: 100, color: 'bg-[#8ebd9b]' },
  seasoned: { label: 'Seasoned (Well-Kept)', pct: 75, color: 'bg-[#d8b46b]' },
  worn: { label: 'Worn (Heavy Use)', pct: 45, color: 'bg-[#e08279]' },
  needs_repair: { label: 'Needs Repair / Tailoring', pct: 20, color: 'bg-[#c45a4f]' },
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
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
    >
      <div 
        className="w-full max-w-lg bg-[#12141a] border border-[#20232c] rounded-xl overflow-hidden shadow-2xl relative animate-in fade-in zoom-in-95 cursor-default max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header / Actions */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#20232c] bg-[#12141a]">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-wider text-[#8a8f98]">
              {isEditing ? 'Editing Item Details' : 'Item Codex Record'}
            </span>
            <span className="linear-tag">
              {item.rarity}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {!isEditing ? (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-1.5 rounded-md text-[#8a8f98] hover:text-[#f3f4f6] hover:bg-[#161822] transition-colors"
                  title="Edit item attributes"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                {onDuplicateItem && (
                  <button
                    onClick={handleDuplicate}
                    className="p-1.5 rounded-md text-[#8a8f98] hover:text-[#f3f4f6] hover:bg-[#161822] transition-colors"
                    title="Duplicate as new item"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                )}
              </>
            ) : (
              <button
                onClick={handleSaveEdits}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#d8b46b] text-[#0d0e12] text-xs font-semibold hover:bg-[#c5a059]"
              >
                <Check className="w-3.5 h-3.5" /> Save
              </button>
            )}

            <button
              onClick={() => {
                sfx.playClick();
                onClose();
              }}
              className="p-1.5 rounded-md text-[#8a8f98] hover:text-[#f3f4f6] hover:bg-[#161822] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1">
          {/* Item Image Showcase */}
          {(!isEditing && item.imageUrl) && (
            <div className="w-full h-52 bg-[#0d0e12] relative overflow-hidden border-b border-[#20232c]">
              <img
                src={item.imageUrl}
                alt={item.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#12141a] via-transparent to-transparent" />
            </div>
          )}

          <div className="p-6">
            {isEditing ? (
              /* Inline Edit Mode Form */
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-[#8a8f98] mb-1">
                    Item Name
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-1.5 bg-[#0d0e12] border border-[#20232c] rounded-md text-sm text-[#f3f4f6] focus:outline-none focus:border-[#d8b46b]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-[#8a8f98] mb-1">
                      Category
                    </label>
                    <select
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value as ItemCategory)}
                      className="w-full px-2.5 py-1.5 bg-[#0d0e12] border border-[#20232c] rounded-md text-xs text-[#f3f4f6]"
                    >
                      <option value="apparel">Apparel & Wardrobe</option>
                      <option value="tech">Tech & Hardware</option>
                      <option value="tomes">Book / Tome</option>
                      <option value="edc">Everyday Carry (EDC)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-[#8a8f98] mb-1">
                      Subcategory Tag
                    </label>
                    <input
                      type="text"
                      value={editSubCategory}
                      onChange={(e) => setEditSubCategory(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-[#0d0e12] border border-[#20232c] rounded-md text-xs text-[#f3f4f6]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-[#8a8f98] mb-1">
                      Weight (kg)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={editWeightKg}
                      onChange={(e) => setEditWeightKg(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-[#0d0e12] border border-[#20232c] rounded-md text-xs text-[#f3f4f6]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-[#8a8f98] mb-1">
                      Value ($)
                    </label>
                    <input
                      type="number"
                      value={editGoldValue}
                      onChange={(e) => setEditGoldValue(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-[#0d0e12] border border-[#20232c] rounded-md text-xs text-[#f3f4f6]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-[#8a8f98] mb-1">
                      Condition
                    </label>
                    <select
                      value={editCondition}
                      onChange={(e) => setEditCondition(e.target.value as ItemCondition)}
                      className="w-full px-2.5 py-1.5 bg-[#0d0e12] border border-[#20232c] rounded-md text-xs text-[#f3f4f6]"
                    >
                      <option value="pristine">Pristine</option>
                      <option value="seasoned">Seasoned</option>
                      <option value="worn">Worn</option>
                      <option value="needs_repair">Needs Repair</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-[#8a8f98] mb-1">
                    Image (URL or Local File Upload)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editImageUrl}
                      onChange={(e) => setEditImageUrl(e.target.value)}
                      placeholder="https://... or upload file"
                      className="flex-1 px-3 py-1.5 bg-[#0d0e12] border border-[#20232c] rounded-md text-xs text-[#f3f4f6]"
                    />
                    <label className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#161822] border border-[#20232c] text-xs font-mono text-[#8a8f98] hover:text-[#f3f4f6] hover:bg-[#202330] transition-colors">
                      <Upload className="w-3.5 h-3.5" />
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
                  <label className="block text-xs font-mono uppercase tracking-wider text-[#8a8f98] mb-1">
                    Lore / Functional Purpose
                  </label>
                  <textarea
                    rows={3}
                    value={editLore}
                    onChange={(e) => setEditLore(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0d0e12] border border-[#20232c] rounded-md text-xs text-[#f3f4f6] focus:outline-none focus:border-[#d8b46b]"
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
                  <span className="linear-tag flex items-center gap-1">
                    {currentStatus === 'owned' && <span className="text-[#8ebd9b]">● Owned</span>}
                    {currentStatus === 'wishlist' && <span className="text-[#d8b46b]">● Wishlist</span>}
                    {currentStatus === 'past' && <span className="text-[#85a6cf]">● Past Possession ({item.pastReason || 'archived'})</span>}
                  </span>

                  {item.equipSlot && (
                    <span className="linear-tag">
                      Slot: {item.equipSlot}
                    </span>
                  )}
                </div>

                {/* Title & Metadata */}
                <div className="mb-4">
                  <h2 className="text-lg font-semibold text-[#f3f4f6] tracking-tight">
                    {item.name}
                  </h2>
                  <div className="flex items-center gap-2 text-xs text-[#8a8f98] mt-1 font-mono">
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
                <div className="mb-4 p-3 rounded-lg bg-[#0d0e12] border border-[#20232c]">
                  <div className="flex justify-between items-center text-xs text-[#8a8f98] mb-1.5 font-mono">
                    <span>Condition Status</span>
                    <span className="text-[#f3f4f6]">{conditionInfo.label}</span>
                  </div>
                  <div className="h-1 w-full bg-[#161822] rounded-full overflow-hidden">
                    <div
                      className={`h-full ${conditionInfo.color} transition-all duration-300`}
                      style={{ width: `${conditionInfo.pct}%` }}
                    />
                  </div>
                </div>

                {/* Lore / Description */}
                <div className="mb-4 p-3.5 rounded-lg bg-[#0d0e12] border border-[#20232c] text-xs text-[#8a8f98] leading-relaxed">
                  {item.lore}
                </div>

                {/* Wishlist Goal if wishlist */}
                {currentStatus === 'wishlist' && (
                  <div className="mb-4 p-3.5 rounded-lg bg-[#0d0e12] border border-[#d8b46b]/30 text-xs">
                    <div className="flex items-center gap-1.5 font-medium text-[#d8b46b] mb-1 font-mono uppercase tracking-wider text-[11px]">
                      <Lock className="w-3.5 h-3.5" /> Acquisition Milestone Goal
                    </div>
                    <p className="text-[#8a8f98]">{item.lockRequirement || 'Target purchase / discipline milestone.'}</p>
                  </div>
                )}

                {/* Past Ownership Memory Notes */}
                {currentStatus === 'past' && (
                  <div className="mb-4 p-3.5 rounded-lg bg-[#0d0e12] border border-[#85a6cf]/30 text-xs">
                    <div className="flex items-center gap-1.5 font-medium text-[#85a6cf] mb-1 font-mono uppercase tracking-wider text-[11px]">
                      <History className="w-3.5 h-3.5" /> Possession Archive
                    </div>
                    <p className="text-[#8a8f98]">
                      Parted with via <strong className="capitalize text-[#f3f4f6]">{item.pastReason || 'retiring'}</strong>
                      {item.pastDate ? ` on ${item.pastDate}` : ''}. Preserved in your life history without adding to active wardrobe carry weight.
                    </p>
                  </div>
                )}

                {/* Conferred Buffs */}
                <div className="mb-4">
                  <h3 className="text-[11px] font-mono text-[#8a8f98] mb-2 uppercase tracking-wider">
                    Conferred Life Modifiers
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {item.buffs.map((buff, i) => (
                      <div key={i} className="p-2 rounded-lg bg-[#0d0e12] border border-[#20232c] flex items-center justify-between text-xs">
                        <span className="text-[#8a8f98]">{buff.label}</span>
                        <span className="linear-tag font-mono text-[#d8b46b]">
                          +{buff.value} {FULL_MODIFIER_NAMES[buff.stat] || buff.stat}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Ownership Lifecycle Transition Control */}
                <div className="p-3.5 rounded-lg bg-[#0d0e12] border border-[#20232c]">
                  <span className="text-[11px] font-mono text-[#8a8f98] block uppercase tracking-wider mb-2">
                    Possession State:
                  </span>

                  <div className="flex flex-wrap items-center gap-2">
                    {currentStatus !== 'owned' && (
                      <button
                        onClick={() => {
                          sfx.playEquip();
                          onChangeStatus(item, 'owned');
                        }}
                        className="px-3 py-1.5 rounded-md bg-[#161822] hover:bg-[#202330] text-[#f3f4f6] border border-[#20232c] text-xs font-mono transition-colors"
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
                        className="px-3 py-1.5 rounded-md bg-[#161822] hover:bg-[#202330] text-[#f3f4f6] border border-[#20232c] text-xs font-mono transition-colors"
                      >
                        Move to Wishlist
                      </button>
                    )}

                    {currentStatus !== 'past' && !isChoosingPastReason && (
                      <button
                        onClick={() => setIsChoosingPastReason(true)}
                        className="px-3 py-1.5 rounded-md bg-[#161822] hover:bg-[#202330] text-[#f3f4f6] border border-[#20232c] text-xs font-mono transition-colors"
                      >
                        Parted With
                      </button>
                    )}
                  </div>

                  {/* Sub-form when choosing Parted With reason */}
                  {isChoosingPastReason && (
                    <div className="mt-3 pt-3 border-t border-[#20232c] flex items-center gap-2">
                      <span className="text-xs text-[#8a8f98] font-mono">Reason:</span>
                      <select
                        value={selectedPastReason}
                        onChange={(e) => setSelectedPastReason(e.target.value as PastReason)}
                        className="px-2.5 py-1 bg-[#161822] border border-[#20232c] rounded text-xs text-[#f3f4f6]"
                      >
                        <option value="sold">Sold</option>
                        <option value="gifted">Gifted</option>
                        <option value="donated">Donated</option>
                        <option value="retired">Retired / Worn Out</option>
                        <option value="lost">Lost / Discarded</option>
                      </select>

                      <button
                        onClick={() => handleSetPast(selectedPastReason)}
                        className="px-3 py-1 rounded bg-[#85a6cf] text-[#0d0e12] text-xs font-semibold hover:bg-[#7292b8]"
                      >
                        Confirm Archive
                      </button>
                      <button
                        onClick={() => setIsChoosingPastReason(false)}
                        className="px-2 py-1 rounded text-[#8a8f98] text-xs hover:text-[#f3f4f6]"
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
        <div className="p-4 bg-[#12141a] border-t border-[#20232c] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-4 text-xs font-mono text-[#8a8f98]">
            <span className="flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5 text-[#8a8f98]" /> {item.weightKg} kg
            </span>
            <span className="text-[#f3f4f6]">
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
              className="p-2 rounded-md bg-[#161822] hover:bg-rose-950/40 text-[#8a8f98] hover:text-rose-400 border border-[#20232c] transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            {currentStatus === 'owned' && (
              <button
                onClick={() => {
                  sfx.playEquip();
                  onToggleEquip(item);
                }}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                  item.isEquipped
                    ? 'bg-[#161822] hover:bg-rose-950/60 text-[#f3f4f6] hover:text-rose-300 border border-[#20232c]'
                    : 'bg-[#d8b46b] hover:bg-[#c5a059] text-[#0d0e12] font-semibold'
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
