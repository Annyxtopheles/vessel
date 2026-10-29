import React, { useState, useEffect } from 'react';
import type { InventoryItem, ItemCondition, OwnershipStatus, PastReason, ItemCategory, NumberGroupingOption } from '../types';
import { X, Trash2, History, Edit3, Check, Upload, Copy, Sparkles, MapPin } from 'lucide-react';
import { sfx } from '../utils/audio';
import { CustomSelect } from './CustomSelect';
import { processAndStorePhoto, getPhotoBlobUrl } from '../services/photoService';
import { formatCurrency } from '../utils/numberFormat';

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
  onChangeStatus: (item: InventoryItem, newStatus: OwnershipStatus, pastReason?: PastReason, pastDate?: string) => void;
  onDeleteItem: (itemId: string) => void;
  onUpdateItem?: (updated: InventoryItem) => void;
  onDuplicateItem?: (item: InventoryItem) => void;
  currencySymbol?: string;
  numberGrouping?: NumberGroupingOption;
  wearCount?: number;
}

const CONDITION_MAP: Record<ItemCondition, { label: string; pct: number; color: string }> = {
  pristine: { label: 'Pristine (Like New)', pct: 100, color: 'bg-[#16A34A]' },
  seasoned: { label: 'Seasoned (Well-Kept)', pct: 75, color: 'bg-[#0891B2]' },
  worn: { label: 'Worn (Heavy Use)', pct: 45, color: 'bg-[#F59E0B]' },
  needs_repair: { label: 'Needs Repair / Tailoring', pct: 20, color: 'bg-[#DC2626]' },
};

export const ItemInspectModal: React.FC<ItemInspectModalProps> = ({
  item,
  onClose,
  onChangeStatus,
  onDeleteItem,
  onUpdateItem,
  onDuplicateItem,
  currencySymbol = '৳',
  numberGrouping = 'bangladeshi',
  wearCount = 0,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedPastReason, setSelectedPastReason] = useState<PastReason>('sold');
  const [isChoosingPastReason, setIsChoosingPastReason] = useState(false);

  // Editable fields
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState<ItemCategory>('apparel');
  const [editSubCategory, setEditSubCategory] = useState('');
  const [editGoldValue, setEditGoldValue] = useState('100');
  const [editTargetPrice, setEditTargetPrice] = useState('100');
  const [editLocation, setEditLocation] = useState('Closet');
  const [editCondition, setEditCondition] = useState<ItemCondition>('pristine');
  const [editImageUrl, setEditImageUrl] = useState('');
  const [editPhotoId, setEditPhotoId] = useState<string | undefined>(undefined);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [editLore, setEditLore] = useState('');

  // Sync edit state when item changes
  useEffect(() => {
    if (item) {
      setEditName(item.name);
      setEditCategory(item.category);
      setEditSubCategory(item.subCategory);
      setEditGoldValue(item.goldValue.toString());
      setEditTargetPrice((item.targetPrice || item.goldValue).toString());
      setEditLocation(item.location || 'Closet');
      setEditCondition(item.condition);
      setEditImageUrl(item.imageUrl || '');
      setEditPhotoId(item.photoId);
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPhoto(true);
    try {
      const record = await processAndStorePhoto(file, item.id);
      setEditPhotoId(record.id);
      const fullUrl = await getPhotoBlobUrl(record.id, 'full');
      if (fullUrl) {
        setEditImageUrl(fullUrl);
      }
    } catch (err: any) {
      alert(`Photo upload failed: ${err.message}`);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleSaveEdits = () => {
    if (!editName.trim()) return;
    sfx.playClick();

    const now = new Date().toISOString();
    const updated: InventoryItem = {
      ...item,
      name: editName.trim(),
      category: editCategory,
      subCategory: editSubCategory.trim() || 'General',
      goldValue: Math.max(0, parseInt(editGoldValue, 10) || 0),
      targetPrice: Math.max(0, parseInt(editTargetPrice, 10) || 0),
      location: editLocation.trim() || 'Closet',
      condition: editCondition,
      photoId: editPhotoId,
      imageUrl: editImageUrl.trim() || undefined,
      lore: editLore.trim() || 'Personal item in inventory.',
      updated_at: now,
      revision: (item.revision || 1) + 1,
    };

    if (onUpdateItem) {
      onUpdateItem(updated);
    }
    setIsEditing(false);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl bg-white border border-[#ECECF0] rounded-2xl shadow-xl overflow-hidden cursor-default animate-in fade-in zoom-in-95 my-8"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#ECECF0]">
          <div className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: item.colorHex || '#9A9AA5' }}
            />
            <span className="text-[13px] font-semibold text-[#111113]">
              {item.category.toUpperCase()} • {item.subCategory || 'General'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onDuplicateItem && (
              <button
                onClick={() => {
                  sfx.playClick();
                  const dup: InventoryItem = {
                    ...item,
                    id: `item-${Date.now()}`,
                    name: `${item.name} (Copy)`,
                  };
                  onDuplicateItem(dup);
                  onClose();
                }}
                className="p-1.5 rounded-lg text-[#6B6B76] hover:text-[#111113] hover:bg-[#F4F4F6] transition-colors"
                title="Duplicate possession"
              >
                <Copy className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`p-1.5 rounded-lg transition-colors ${
                isEditing
                  ? 'bg-[#E6F7F9] text-[#0891B2]'
                  : 'text-[#6B6B76] hover:text-[#111113] hover:bg-[#F4F4F6]'
              }`}
              title="Edit details"
            >
              <Edit3 className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#6B6B76] hover:text-[#111113] hover:bg-[#F4F4F6] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-6">
          {/* Main Visual Banner */}
          <div className="h-60 rounded-xl bg-[#F4F4F6] border border-[#ECECF0] relative overflow-hidden flex items-center justify-center">
            {(isEditing ? editImageUrl : item.imageUrl) ? (
              <img
                src={isEditing ? editImageUrl : item.imageUrl}
                alt={item.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-center text-[#9A9AA5]">
                <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <span className="text-xs">No visual photo logged</span>
              </div>
            )}

            {isEditing && (
              <label className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-xs text-[#111113] border border-[#ECECF0] hover:bg-white px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer shadow-xs flex items-center gap-1.5 transition-all">
                <Upload className="w-3.5 h-3.5" />
                <span>{isUploadingPhoto ? 'Optimizing...' : 'Upload Photo'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={isUploadingPhoto}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Form Content / View Content */}
          <div>
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-[13px] font-medium text-[#6B6B76] mb-1">
                    Possession Name
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="ship-input w-full"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                      Sub-Category / Type
                    </label>
                    <input
                      type="text"
                      value={editSubCategory}
                      onChange={(e) => setEditSubCategory(e.target.value)}
                      className="ship-input w-full"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[13px] font-medium text-[#6B6B76] mb-1">
                      Value ({currencySymbol})
                    </label>
                    <input
                      type="number"
                      value={editGoldValue}
                      onChange={(e) => setEditGoldValue(e.target.value)}
                      className="ship-input w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium text-[#6B6B76] mb-1">
                      Target Price ({currencySymbol})
                    </label>
                    <input
                      type="number"
                      value={editTargetPrice}
                      onChange={(e) => setEditTargetPrice(e.target.value)}
                      className="ship-input w-full"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[13px] font-medium text-[#6B6B76] mb-1">
                      Storage Location
                    </label>
                    <input
                      type="text"
                      value={editLocation}
                      onChange={(e) => setEditLocation(e.target.value)}
                      placeholder="e.g. Closet, Desk, Storage"
                      className="ship-input w-full"
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
                    Notes & Lore
                  </label>
                  <textarea
                    rows={3}
                    value={editLore}
                    onChange={(e) => setEditLore(e.target.value)}
                    className="ship-input w-full text-[13px]"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-[#6B6B76] hover:bg-[#F4F4F6] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveEdits}
                    className="px-5 py-2 rounded-xl text-xs font-semibold bg-[#0891B2] hover:bg-[#0E7490] text-white shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Save Changes</span>
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Title & Category Bar */}
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-[#111113] tracking-tight">
                      {item.name}
                    </h2>
                    <div className="text-[13px] text-[#6B6B76] mt-0.5 flex items-center gap-2">
                      <span>{item.subCategory}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-[#9A9AA5]" />
                        <span>{item.location || 'Vault'}</span>
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xl font-bold text-[#111113] block">
                      {formatCurrency(item.goldValue, currencySymbol, numberGrouping)}
                    </span>
                    {currentStatus === 'wishlist' && item.targetPrice && (
                      <span className="text-[11px] text-[#6B6B76]">
                        Target: {formatCurrency(item.targetPrice, currencySymbol, numberGrouping)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Wear Log & Efficiency Box */}
                {currentStatus === 'owned' && (
                  <div className="mb-4 p-4 rounded-xl bg-[#F4F4F6] border border-[#ECECF0] flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-[#111113] mb-0.5">
                        <Sparkles className="w-3.5 h-3.5 text-[#0891B2]" /> Wear Log
                      </div>
                      <div className="text-[13px] text-[#6B6B76]">
                        {wearCount} {wearCount === 1 ? 'Wear Logged' : 'Wears Logged'}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-[11px] text-[#6B6B76]">Cost Per Wear</div>
                      <div className="text-[15px] font-bold text-[#0891B2]">
                        {costPerWear ? `${formatCurrency(parseFloat(costPerWear), currencySymbol, numberGrouping)} / wear` : 'Unworn'}
                      </div>
                    </div>
                  </div>
                )}

                {/* Lore / Description */}
                <div className="p-4 rounded-xl bg-[#F4F4F6] border border-[#ECECF0] mb-4">
                  <p className="text-[13px] text-[#6B6B76] leading-relaxed italic">
                    "{item.lore}"
                  </p>
                </div>

                {/* Condition Bar */}
                <div className="mb-4 p-4 rounded-xl border border-[#ECECF0]">
                  <div className="flex items-center justify-between text-[13px] mb-2">
                    <span className="font-semibold text-[#111113]">Physical Condition</span>
                    <span className="text-[#6B6B76]">{conditionInfo.label}</span>
                  </div>
                  <div className="w-full h-2 bg-[#ECECF0] rounded-full overflow-hidden">
                    <div
                      className={`h-full ${conditionInfo.color} rounded-full transition-all`}
                      style={{ width: `${conditionInfo.pct}%` }}
                    />
                  </div>
                </div>

                {/* Past Relic Notice if Parted */}
                {currentStatus === 'past' && (
                  <div className="mb-4 p-3.5 rounded-xl bg-[#ECECF0] border border-[#ECECF0] text-[13px]">
                    <div className="flex items-center gap-1.5 font-semibold text-[#111113] mb-1">
                      <History className="w-3.5 h-3.5 text-[#6B6B76]" /> Possession Archive
                    </div>
                    <p className="text-[#6B6B76]">
                      Parted with via <strong className="capitalize text-[#111113]">{item.pastReason || 'retiring'}</strong>
                      {item.pastDate ? ` on ${item.pastDate}` : ''}. Preserved in your life history.
                    </p>
                  </div>
                )}

                {/* Ownership Lifecycle Transition Control */}
                <div className="p-4 rounded-xl bg-[#F4F4F6] border border-[#ECECF0]">
                  <span className="text-[13px] font-semibold text-[#111113] block mb-2.5">
                    Possession State:
                  </span>

                  <div className="flex flex-wrap items-center gap-2">
                    {currentStatus !== 'owned' && (
                      <button
                        onClick={() => {
                          sfx.playClick();
                          onChangeStatus(item, 'owned');
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-[#F4F4F6] text-[#111113] border border-[#ECECF0] text-[13px] font-medium transition-colors cursor-pointer"
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
                        className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-[#F4F4F6] text-[#111113] border border-[#ECECF0] text-[13px] font-medium transition-colors cursor-pointer"
                      >
                        Move to Wishlist
                      </button>
                    )}

                    {currentStatus !== 'past' && !isChoosingPastReason && (
                      <button
                        onClick={() => setIsChoosingPastReason(true)}
                        className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-[#F4F4F6] text-[#111113] border border-[#ECECF0] text-[13px] font-medium transition-colors cursor-pointer"
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
                        className="px-3 py-1.5 rounded-xl bg-[#0891B2] text-white text-[13px] font-medium hover:bg-[#0E7490] transition-colors shrink-0 cursor-pointer"
                      >
                        Confirm Archive
                      </button>
                      <button
                        onClick={() => setIsChoosingPastReason(false)}
                        className="px-2 py-1 rounded-xl text-[#6B6B76] text-[13px] hover:text-[#111113] cursor-pointer"
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
        <div className="px-6 py-4 bg-white border-t border-[#ECECF0] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-[13px] text-[#6B6B76]">
            <span>Value:</span>
            <span className="text-[#111113] font-semibold">
              {formatCurrency(item.goldValue, currencySymbol, numberGrouping)}
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
              className="p-2 rounded-xl bg-[#FDECEC] text-[#DC2626] hover:bg-[#FCD8D8] transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
