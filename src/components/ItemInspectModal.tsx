import React, { useState, useEffect } from 'react';
import type { InventoryItem, ItemCondition, OwnershipStatus, PastReason, ItemCategory } from '../types';
import { X, Lock, Trash2, Scale, History, Edit3, Check, Upload, Copy, Backpack, Sparkles } from 'lucide-react';
import { sfx } from '../utils/audio';
import { CustomSelect } from './CustomSelect';

const CATEGORY_OPTIONS = [
  { id: 'apparel', label: 'Apparel & Wardrobe' },
  { id: 'tech', label: 'Tech & Hardware' },
  { id: 'tomes', label: 'Book / Tome' },
  { id: 'edc', label: 'Everyday Carry (EDC)' },
];

const CONDITION_OPTIONS = [
  { id: 'pristine', label: 'Pristine' },
  { id: 'seasoned', label: 'Seasoned' },
  { id: 'worn', label: 'Worn' },
  { id: 'needs_repair', label: 'Needs Repair' },
];

const PAST_REASON_OPTIONS = [
  { id: 'sold', label: 'Sold' },
  { id: 'gifted', label: 'Gifted' },
  { id: 'donated', label: 'Donated' },
  { id: 'retired', label: 'Retired / Worn Out' },
  { id: 'lost', label: 'Lost / Discarded' },
];

interface ItemInspectModalProps {
  item: InventoryItem | null;
  onClose: () => void;
  onToggleEquip: (item: InventoryItem) => void;
  onChangeStatus: (item: InventoryItem, newStatus: OwnershipStatus, pastReason?: PastReason, pastDate?: string) => void;
  onDeleteItem: (itemId: string) => void;
  onUpdateItem?: (updated: InventoryItem) => void;
  onDuplicateItem?: (item: InventoryItem) => void;
  currencySymbol?: string;
  wearCount?: number;
}

const CONDITION_MAP: Record<ItemCondition, { label: string; pct: number; color: string }> = {
  pristine: { label: 'Pristine (Like New)', pct: 100, color: 'bg-[#16A34A]' },
  seasoned: { label: 'Seasoned (Well-Kept)', pct: 75, color: 'bg-[#0891B2]' },
  worn: { label: 'Worn (Heavy Use)', pct: 45, color: 'bg-[#F59E0B]' },
  needs_repair: { label: 'Needs Repair / Tailoring', pct: 20, color: 'bg-[#DC2626]' },
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
  currencySymbol = '$',
  wearCount = 0,
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
  const [editTargetPrice, setEditTargetPrice] = useState('100');
  const [editLocation, setEditLocation] = useState('Vault Wardrobe');
  const [editCarried, setEditCarried] = useState(false);
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
      setEditTargetPrice((item.targetPrice || item.goldValue).toString());
      setEditLocation(item.location || 'Vault Wardrobe');
      setEditCarried(item.carried ?? item.isEquipped ?? false);
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
  const costPerWear = wearCount > 0 ? (item.goldValue / wearCount).toFixed(2) : null;

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
      targetPrice: Math.max(0, parseInt(editTargetPrice, 10) || 0),
      location: editLocation.trim() || 'Vault Wardrobe',
      carried: editCarried,
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
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
    >
      <div
        className="w-full max-w-lg bg-white border border-[#ECECF0] rounded-2xl overflow-hidden shadow-xl relative animate-in fade-in zoom-in-95 cursor-default max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header / Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#ECECF0] bg-white">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-semibold text-[#111113]">
              {isEditing ? 'Editing Item Details' : 'Item Details'}
            </span>
            <span className="ship-pill bg-[#F4F4F6] text-[#6B6B76] text-[11px] font-medium capitalize">
              {item.rarity}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {!isEditing ? (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-1.5 rounded-lg text-[#6B6B76] hover:text-[#111113] hover:bg-[#F4F4F6] transition-colors"
                  title="Edit item attributes"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                {onDuplicateItem && (
                  <button
                    onClick={handleDuplicate}
                    className="p-1.5 rounded-lg text-[#6B6B76] hover:text-[#111113] hover:bg-[#F4F4F6] transition-colors"
                    title="Duplicate as new item"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                )}
              </>
            ) : (
              <button
                onClick={handleSaveEdits}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#0891B2] hover:bg-[#0E7490] text-white text-[12px] font-semibold transition-colors"
              >
                <Check className="w-3.5 h-3.5" /> Save
              </button>
            )}

            <button
              onClick={() => {
                sfx.playClick();
                onClose();
              }}
              className="p-1.5 rounded-lg text-[#6B6B76] hover:text-[#111113] hover:bg-[#F4F4F6] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1">
          {/* Item Image Showcase */}
          {!isEditing && item.imageUrl && (
            <div className="w-full h-52 bg-[#F4F4F6] relative overflow-hidden border-b border-[#ECECF0] flex items-center justify-center">
              <img
                src={item.imageUrl}
                alt={item.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="p-6">
            {isEditing ? (
              /* Inline Edit Mode Form */
              <div className="space-y-4">
                <div>
                  <label className="block text-[13px] font-medium text-[#6B6B76] mb-1">
                    Item Name
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="ship-input w-full px-3 py-2 text-[14px]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[13px] font-medium text-[#6B6B76] mb-1">
                      Category
                    </label>
                    <CustomSelect
                      value={editCategory}
                      options={CATEGORY_OPTIONS}
                      onChange={(val) => setEditCategory(val as ItemCategory)}
                    />
                  </div>

                  <div>
                    <label className="block text-[13px] font-medium text-[#6B6B76] mb-1">
                      Subcategory Tag
                    </label>
                    <input
                      type="text"
                      value={editSubCategory}
                      onChange={(e) => setEditSubCategory(e.target.value)}
                      className="ship-input w-full px-3 py-2 text-[13px]"
                    />
                  </div>
                </div>

                {/* Carried in Pack Toggle */}
                <div className="p-3.5 rounded-xl bg-[#F4F4F6] border border-[#ECECF0] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Backpack className="w-4 h-4 text-[#0891B2]" />
                    <div>
                      <div className="text-[13px] font-semibold text-[#111113]">Carried on Pack / Person</div>
                      <div className="text-[11px] text-[#6B6B76]">Counts toward active Carry Load against capacity</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditCarried(!editCarried)}
                    className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-colors cursor-pointer ${
                      editCarried
                        ? 'bg-[#0891B2] text-white shadow-xs'
                        : 'bg-white border border-[#ECECF0] text-[#6B6B76]'
                    }`}
                  >
                    {editCarried ? 'Carried' : 'Stored'}
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[13px] font-medium text-[#6B6B76] mb-1">
                      Weight (kg)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={editWeightKg}
                      onChange={(e) => setEditWeightKg(e.target.value)}
                      className="ship-input w-full px-3 py-2 text-[13px]"
                    />
                  </div>

                  <div>
                    <label className="block text-[13px] font-medium text-[#6B6B76] mb-1">
                      Value ({currencySymbol})
                    </label>
                    <input
                      type="number"
                      value={editGoldValue}
                      onChange={(e) => setEditGoldValue(e.target.value)}
                      className="ship-input w-full px-3 py-2 text-[13px]"
                    />
                  </div>

                  <div>
                    <label className="block text-[13px] font-medium text-[#6B6B76] mb-1">
                      Condition
                    </label>
                    <CustomSelect
                      value={editCondition}
                      options={CONDITION_OPTIONS}
                      onChange={(val) => setEditCondition(val as ItemCondition)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[13px] font-medium text-[#6B6B76] mb-1">
                    Storage Location / Pack
                  </label>
                  <input
                    type="text"
                    value={editLocation}
                    onChange={(e) => setEditLocation(e.target.value)}
                    placeholder="e.g. Closet, Desk, Travel Backpack, EDC Pouch..."
                    className="ship-input w-full px-3 py-2 text-[13px]"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-medium text-[#6B6B76] mb-1">
                    Image (URL or Local File Upload)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editImageUrl}
                      onChange={(e) => setEditImageUrl(e.target.value)}
                      placeholder="https://... or upload file"
                      className="ship-input flex-1 px-3 py-2 text-[13px]"
                    />
                    <label className="cursor-pointer flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#F4F4F6] border border-[#ECECF0] text-[13px] text-[#111113] hover:bg-[#EAEAEF] transition-colors font-medium">
                      <Upload className="w-3.5 h-3.5 text-[#0891B2]" />
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
                  <label className="block text-[13px] font-medium text-[#6B6B76] mb-1">
                    Lore / Purpose Note
                  </label>
                  <textarea
                    rows={3}
                    value={editLore}
                    onChange={(e) => setEditLore(e.target.value)}
                    className="ship-input w-full px-3 py-2 text-[13px]"
                  />
                </div>
              </div>
            ) : (
              /* View Mode */
              <>
                {/* Top Badges */}
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="ship-pill-neutral">
                    {item.category} • {item.subCategory}
                  </span>

                  {currentStatus === 'owned' && (
                    <span className="ship-pill-success">● Owned</span>
                  )}
                  {currentStatus === 'wishlist' && (
                    <span className="ship-pill-accent">● Wishlist</span>
                  )}
                  {currentStatus === 'past' && (
                    <span className="ship-pill-neutral">
                      ● Past ({item.pastReason || 'archived'})
                    </span>
                  )}

                  {item.carried && (
                    <span className="ship-pill-accent">
                      <Backpack className="w-3 h-3" /> Carried in Pack
                    </span>
                  )}

                  <span className="ship-pill-neutral">
                    {item.location || 'Vault Wardrobe'}
                  </span>
                </div>

                {/* Title & Metadata */}
                <div className="mb-4">
                  <h2 className="text-[20px] font-semibold text-[#111113] tracking-tight">
                    {item.name}
                  </h2>
                  <div className="flex items-center gap-2 text-[13px] text-[#6B6B76] mt-1 font-normal">
                    <span
                      className="w-2.5 h-2.5 rounded-full border border-black/10"
                      style={{ backgroundColor: item.colorHex }}
                    />
                    <span>{item.colorName}</span>
                    <span>•</span>
                    <span className="capitalize">{item.season} season</span>
                  </div>
                </div>

                {/* Wear Log & Efficiency Box */}
                {currentStatus === 'owned' && (
                  <div className="mb-4 p-4 rounded-xl bg-[#E6F7F9]/40 border border-[#BCE7EB] flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#0891B2] uppercase tracking-wider">
                        <Sparkles className="w-3.5 h-3.5" /> Wear Log & Efficiency
                      </div>
                      <div className="text-[17px] font-bold text-[#111113] mt-0.5">
                        {wearCount} {wearCount === 1 ? 'Wear Logged' : 'Wears Logged'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[11px] text-[#6B6B76]">Cost Per Wear</div>
                      <div className="text-[17px] font-bold text-[#0891B2]">
                        {costPerWear ? `${currencySymbol}${costPerWear} / wear` : 'Unworn'}
                      </div>
                    </div>
                  </div>
                )}

                {/* Condition Bar */}
                <div className="mb-4 p-3.5 rounded-xl bg-[#F4F4F6] border border-[#ECECF0]">
                  <div className="flex justify-between items-center text-[13px] text-[#6B6B76] mb-2 font-medium">
                    <span>Condition Status</span>
                    <span className="text-[#111113] font-semibold">{conditionInfo.label}</span>
                  </div>
                  <div className="h-1.5 w-full bg-[#ECECF0] rounded-full overflow-hidden">
                    <div
                      className={`h-full ${conditionInfo.color} transition-all duration-300`}
                      style={{ width: `${conditionInfo.pct}%` }}
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="mb-4 p-3.5 rounded-xl bg-[#F4F4F6] border border-[#ECECF0] text-[13px] text-[#6B6B76] leading-relaxed">
                  {item.lore}
                </div>

                {/* Wishlist Goal */}
                {currentStatus === 'wishlist' && (
                  <div className="mb-4 p-3.5 rounded-xl bg-[#E6F7F9] border border-[#0891B2]/30 text-[13px]">
                    <div className="flex items-center gap-1.5 font-semibold text-[#0891B2] mb-1">
                      <Lock className="w-3.5 h-3.5" /> Acquisition Milestone Goal
                    </div>
                    <p className="text-[#111113]">{item.lockRequirement || 'Target purchase / discipline milestone.'}</p>
                    <div className="mt-2 text-[12px] text-[#6B6B76]">
                      Target Price: <span className="font-semibold text-[#111113]">{currencySymbol}{(item.targetPrice || item.goldValue).toLocaleString()}</span>
                    </div>
                  </div>
                )}

                {/* Past Archive Notes */}
                {currentStatus === 'past' && (
                  <div className="mb-4 p-3.5 rounded-xl bg-[#ECECF0] border border-[#ECECF0] text-[13px]">
                    <div className="flex items-center gap-1.5 font-semibold text-[#111113] mb-1">
                      <History className="w-3.5 h-3.5 text-[#6B6B76]" /> Possession Archive
                    </div>
                    <p className="text-[#6B6B76]">
                      Parted with via <strong className="capitalize text-[#111113]">{item.pastReason || 'retiring'}</strong>
                      {item.pastDate ? ` on ${item.pastDate}` : ''}. Preserved in your life history without adding to active wardrobe carry weight.
                    </p>
                  </div>
                )}

                {/* Conferred Buffs */}
                <div className="mb-4">
                  <h3 className="text-[13px] font-semibold text-[#111113] mb-2">
                    Conferred Life Modifiers
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {item.buffs.map((buff, i) => (
                      <div key={i} className="p-3 rounded-xl bg-[#F4F4F6] border border-[#ECECF0] flex items-center justify-between text-[13px]">
                        <span className="text-[#6B6B76]">{buff.label}</span>
                        <span className="ship-pill-accent font-semibold text-[12px]">
                          +{buff.value} {FULL_MODIFIER_NAMES[buff.stat] || buff.stat}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Ownership Lifecycle Transition Control */}
                <div className="p-4 rounded-xl bg-[#F4F4F6] border border-[#ECECF0]">
                  <span className="text-[13px] font-semibold text-[#111113] block mb-2.5">
                    Possession State:
                  </span>

                  <div className="flex flex-wrap items-center gap-2">
                    {currentStatus !== 'owned' && (
                      <button
                        onClick={() => {
                          sfx.playEquip();
                          onChangeStatus(item, 'owned');
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-[#F4F4F6] text-[#111113] border border-[#ECECF0] text-[13px] font-medium transition-colors"
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
                        className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-[#F4F4F6] text-[#111113] border border-[#ECECF0] text-[13px] font-medium transition-colors"
                      >
                        Move to Wishlist
                      </button>
                    )}

                    {currentStatus !== 'past' && !isChoosingPastReason && (
                      <button
                        onClick={() => setIsChoosingPastReason(true)}
                        className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-[#F4F4F6] text-[#111113] border border-[#ECECF0] text-[13px] font-medium transition-colors"
                      >
                        Parted With
                      </button>
                    )}
                  </div>

                  {isChoosingPastReason && (
                    <div className="mt-3 pt-3 border-t border-[#ECECF0] flex items-center gap-2">
                      <span className="text-[13px] text-[#6B6B76] font-medium shrink-0">Reason:</span>
                      <div className="w-48">
                        <CustomSelect
                          value={selectedPastReason}
                          options={PAST_REASON_OPTIONS}
                          onChange={(val) => setSelectedPastReason(val as PastReason)}
                          buttonClassName="py-1 px-2.5 text-xs"
                        />
                      </div>

                      <button
                        onClick={() => handleSetPast(selectedPastReason)}
                        className="px-3 py-1.5 rounded-xl bg-[#0891B2] text-white text-[13px] font-medium hover:bg-[#0E7490] transition-colors shrink-0"
                      >
                        Confirm Archive
                      </button>
                      <button
                        onClick={() => setIsChoosingPastReason(false)}
                        className="px-2 py-1 rounded-xl text-[#6B6B76] text-[13px] hover:text-[#111113]"
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
        <div className="px-6 py-4 bg-white border-t border-[#ECECF0] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-4 text-[13px] text-[#6B6B76]">
            <span className="flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-[#9A9AA5]" /> {item.weightKg} kg
            </span>
            <span className="text-[#111113] font-semibold">
              {currencySymbol}{item.goldValue.toLocaleString()}
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
              className="p-2 rounded-xl bg-[#FDECEC] text-[#DC2626] hover:bg-[#FCD8D8] transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            {currentStatus === 'owned' && (
              <button
                onClick={() => {
                  sfx.playEquip();
                  onToggleEquip(item);
                }}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-medium transition-all ${
                  item.isEquipped
                    ? 'bg-[#FDECEC] text-[#DC2626] hover:bg-[#FCD8D8]'
                    : 'bg-[#0891B2] hover:bg-[#0E7490] text-white'
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
