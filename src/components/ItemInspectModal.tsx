import React, { useState, useEffect } from 'react';
import type { InventoryItem, ItemCondition, OwnershipStatus, PastReason, ItemCategory, NumberGroupingOption } from '../types';
import { X, Trash2, Edit3, Copy, MapPin } from 'lucide-react';
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
  pristine: { label: 'Pristine (Like New)', pct: 100, color: 'bg-[#3F6B4F]' },
  seasoned: { label: 'Seasoned (Well-Kept)', pct: 75, color: 'bg-[#2D4A6B]' },
  worn: { label: 'Worn (Heavy Use)', pct: 45, color: 'bg-[#7A5C1E]' },
  needs_repair: { label: 'Needs Repair', pct: 20, color: 'bg-[#9C3D2A]' },
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
  const initialChar = (item.name[0] || 'V').toUpperCase();

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
        className="w-full max-w-xl bg-[#FBF9F4] border border-[#E4DED2] rounded-[6px] overflow-hidden cursor-default my-8"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E4DED2]">
          <div className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-[2px]"
              style={{ backgroundColor: item.colorHex || '#6B645A' }}
            />
            <span className="text-[12px] font-medium uppercase tracking-wider text-[#6B645A]">
              {item.category} · {item.subCategory || 'General'}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {onDuplicateItem && (
              <button
                type="button"
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
                className="p-1.5 rounded-[4px] text-[#6B645A] hover:text-[#1F1B16] hover:bg-[#EFEAE0] transition-colors"
                title="Duplicate possession"
              >
                <Copy className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsEditing(!isEditing)}
              className={`p-1.5 rounded-[4px] transition-colors ${
                isEditing
                  ? 'bg-[#EFEAE0] text-[#1F1B16]'
                  : 'text-[#6B645A] hover:text-[#1F1B16] hover:bg-[#EFEAE0]'
              }`}
              title="Edit details"
            >
              <Edit3 className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-[4px] text-[#6B645A] hover:text-[#1F1B16] hover:bg-[#EFEAE0] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-5">
          {/* Main Visual Banner */}
          <div className="h-56 rounded-[6px] bg-[#EFEAE0] border border-[#E4DED2] relative overflow-hidden flex items-center justify-center font-serif text-3xl text-[#6B645A]">
            {(isEditing ? editImageUrl : item.imageUrl) ? (
              <img
                src={isEditing ? editImageUrl : item.imageUrl}
                alt={item.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span>{initialChar}</span>
            )}

            {isEditing && (
              <label className="absolute bottom-3 right-3 bg-[#FBF9F4] text-[#1F1B16] border border-[#E4DED2] hover:bg-[#F6F2EA] px-3 py-1 rounded-[4px] text-xs font-medium cursor-pointer transition-colors">
                <span>{isUploadingPhoto ? 'Processing...' : 'Upload Photo'}</span>
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
                  <label className="block text-[11px] font-medium uppercase tracking-wider text-[#6B645A] mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="ship-input w-full text-[14px]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium uppercase tracking-wider text-[#6B645A] mb-1">
                      Category
                    </label>
                    <CustomSelect
                      value={editCategory}
                      options={CATEGORY_OPTIONS}
                      onChange={(val) => setEditCategory(val as ItemCategory)}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium uppercase tracking-wider text-[#6B645A] mb-1">
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
                    <label className="block text-[11px] font-medium uppercase tracking-wider text-[#6B645A] mb-1">
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
                    <label className="block text-[11px] font-medium uppercase tracking-wider text-[#6B645A] mb-1">
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
                    <label className="block text-[11px] font-medium uppercase tracking-wider text-[#6B645A] mb-1">
                      Storage Location
                    </label>
                    <input
                      type="text"
                      value={editLocation}
                      onChange={(e) => setEditLocation(e.target.value)}
                      placeholder="e.g. Closet, Desk"
                      className="ship-input w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium uppercase tracking-wider text-[#6B645A] mb-1">
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
                  <label className="block text-[11px] font-medium uppercase tracking-wider text-[#6B645A] mb-1">
                    Notes
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
                    className="editorial-btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveEdits}
                    className="editorial-btn-primary"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Title & Category Bar */}
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h2 className="font-serif text-[24px] font-normal text-[#1F1B16]">
                      {item.name}
                    </h2>
                    <div className="text-[13px] text-[#6B645A] mt-0.5 flex items-center gap-2">
                      <span>{item.subCategory}</span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-[#6B645A]" />
                        <span>{item.location || 'Vault'}</span>
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-serif text-[22px] font-normal tabular-nums text-[#1F1B16] block">
                      {formatCurrency(item.goldValue, currencySymbol, numberGrouping)}
                    </span>
                    {currentStatus === 'wishlist' && item.targetPrice && (
                      <span className="text-[11px] tabular-nums text-[#6B645A]">
                        Target: {formatCurrency(item.targetPrice, currencySymbol, numberGrouping)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Wear Log & Efficiency Box */}
                {currentStatus === 'owned' && (
                  <div className="mb-4 p-3.5 rounded-[6px] bg-[#F6F2EA] border border-[#E4DED2] flex items-center justify-between">
                    <div>
                      <div className="text-xs font-medium text-[#1F1B16] mb-0.5">
                        Wear Log
                      </div>
                      <div className="text-[12px] tabular-nums text-[#6B645A]">
                        {wearCount} {wearCount === 1 ? 'Wear' : 'Wears'} logged
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-[11px] text-[#6B645A]">Cost / Wear</div>
                      <div className="font-serif text-[16px] tabular-nums font-medium text-[#1F1B16]">
                        {costPerWear ? `${formatCurrency(parseFloat(costPerWear), currencySymbol, numberGrouping)}` : 'Unworn'}
                      </div>
                    </div>
                  </div>
                )}

                {/* Notes / Lore */}
                <div className="p-3.5 rounded-[6px] bg-[#F6F2EA] border border-[#E4DED2] mb-4">
                  <p className="text-[13px] text-[#6B645A] leading-relaxed italic">
                    "{item.lore}"
                  </p>
                </div>

                {/* Condition Bar */}
                <div className="mb-4 p-3.5 rounded-[6px] border border-[#E4DED2] bg-[#FBF9F4]">
                  <div className="flex items-center justify-between text-[12px] mb-2">
                    <span className="font-medium text-[#1F1B16]">Physical Condition</span>
                    <span className="text-[#6B645A]">{conditionInfo.label}</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#E4DED2] rounded-full overflow-hidden">
                    <div
                      className={`h-full ${conditionInfo.color} transition-all`}
                      style={{ width: `${conditionInfo.pct}%` }}
                    />
                  </div>
                </div>

                {/* Past Relic Notice if Parted */}
                {currentStatus === 'past' && (
                  <div className="mb-4 p-3 rounded-[6px] bg-[#F6F2EA] border border-[#E4DED2] text-[13px]">
                    <div className="font-medium text-[#1F1B16] mb-1">
                      Possession Archive
                    </div>
                    <p className="text-[#6B645A]">
                      Parted with via <strong className="capitalize text-[#1F1B16]">{item.pastReason || 'retiring'}</strong>
                      {item.pastDate ? ` on ${item.pastDate}` : ''}.
                    </p>
                  </div>
                )}

                {/* Ownership Lifecycle Transition Control */}
                <div className="p-3.5 rounded-[6px] bg-[#F6F2EA] border border-[#E4DED2]">
                  <span className="text-[12px] font-medium text-[#1F1B16] block mb-2">
                    Status:
                  </span>

                  <div className="flex flex-wrap items-center gap-2">
                    {currentStatus !== 'owned' && (
                      <button
                        type="button"
                        onClick={() => {
                          sfx.playClick();
                          onChangeStatus(item, 'owned');
                        }}
                        className="editorial-btn-secondary py-1 px-3 text-xs"
                      >
                        Mark as Owned
                      </button>
                    )}

                    {currentStatus !== 'wishlist' && (
                      <button
                        type="button"
                        onClick={() => {
                          sfx.playClick();
                          onChangeStatus(item, 'wishlist');
                        }}
                        className="editorial-btn-secondary py-1 px-3 text-xs"
                      >
                        Move to Wishlist
                      </button>
                    )}

                    {currentStatus !== 'past' && !isChoosingPastReason && (
                      <button
                        type="button"
                        onClick={() => setIsChoosingPastReason(true)}
                        className="editorial-btn-secondary py-1 px-3 text-xs"
                      >
                        Parted With
                      </button>
                    )}
                  </div>

                  {isChoosingPastReason && (
                    <div className="mt-3 pt-3 border-t border-[#E4DED2] flex items-center gap-2">
                      <span className="text-xs text-[#6B645A] shrink-0">Reason:</span>
                      <div className="w-44">
                        <CustomSelect
                          value={selectedPastReason}
                          options={PAST_REASON_OPTIONS}
                          onChange={(val) => setSelectedPastReason(val as PastReason)}
                          buttonClassName="py-1 px-2.5 text-xs"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSetPast(selectedPastReason)}
                        className="editorial-btn-primary py-1 px-3 text-xs shrink-0"
                      >
                        Confirm
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsChoosingPastReason(false)}
                        className="editorial-btn-secondary py-1 px-2.5 text-xs"
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
        <div className="px-6 py-3.5 bg-[#FBF9F4] border-t border-[#E4DED2] flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-[13px] text-[#6B645A]">
            <span>Value:</span>
            <span className="text-[#1F1B16] font-medium tabular-nums">
              {formatCurrency(item.goldValue, currencySymbol, numberGrouping)}
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              sfx.playClick();
              if (confirm(`Completely delete "${item.name}" from your vault?`)) {
                onDeleteItem(item.id);
                onClose();
              }
            }}
            title="Delete item permanently"
            className="p-1.5 rounded-[4px] border border-[#E4DED2] text-[#9C3D2A] hover:bg-[#F6F2EA] transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
