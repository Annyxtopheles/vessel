import React, { useState } from 'react';
import type { InventoryItem, ItemCategory, ItemRarity, ItemCondition, ItemSeason, OwnershipStatus, PastReason } from '../types';
import { X } from 'lucide-react';
import { sfx } from '../utils/audio';
import { CustomSelect } from './CustomSelect';
import { processAndStorePhoto, getPhotoBlobUrl } from '../services/photoService';

const CATEGORY_OPTIONS = [
  { id: 'apparel', label: 'Clothing & Wardrobe' },
  { id: 'tech', label: 'Tech & Hardware' },
  { id: 'tomes', label: 'Books & Tomes' },
  { id: 'edc', label: 'Everyday Carry' },
];

const RARITY_OPTIONS = [
  { id: 'common', label: 'Common' },
  { id: 'rare', label: 'Rare' },
  { id: 'epic', label: 'Epic' },
  { id: 'masterwork', label: 'Masterwork' },
  { id: 'legendary', label: 'Legendary' },
];

const CONDITION_OPTIONS = [
  { id: 'pristine', label: 'Pristine (Like New)' },
  { id: 'seasoned', label: 'Seasoned (Well-Kept)' },
  { id: 'worn', label: 'Worn (Heavy Use)' },
  { id: 'needs_repair', label: 'Needs Repair' },
];

const SEASON_OPTIONS = [
  { id: 'all', label: 'All Season' },
  { id: 'summer', label: 'Summer' },
  { id: 'winter', label: 'Winter' },
  { id: 'transitional', label: 'Transitional' },
];

const PAST_REASON_OPTIONS = [
  { id: 'sold', label: 'Sold' },
  { id: 'gifted', label: 'Gifted' },
  { id: 'donated', label: 'Donated' },
  { id: 'retired', label: 'Retired' },
  { id: 'lost', label: 'Lost' },
];

const COLOR_PRESETS = [
  { name: 'Obsidian Black', hex: '#1F1B16' },
  { name: 'Charcoal Slate', hex: '#2D3139' },
  { name: 'Deep Navy', hex: '#2D4A6B' },
  { name: 'Terracotta', hex: '#9C3D2A' },
  { name: 'Antique Bronze', hex: '#7A5C1E' },
  { name: 'Forest Moss', hex: '#3F6B4F' },
  { name: 'Warm Cream', hex: '#F6F2EA' },
  { name: 'Bone Taupe', hex: '#E4DED2' },
];

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddItem: (item: InventoryItem) => void;
  currencySymbol?: string;
}

export const AddItemModal: React.FC<AddItemModalProps> = ({
  isOpen,
  onClose,
  onAddItem,
  currencySymbol = '৳',
}) => {
  const [name, setName] = useState('');
  const [ownershipStatus, setOwnershipStatus] = useState<OwnershipStatus>('owned');
  const [pastReason, setPastReason] = useState<PastReason>('sold');
  const [pastDate, setPastDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState<ItemCategory>('apparel');
  const [subCategory, setSubCategory] = useState('Outerwear');
  const [rarity, setRarity] = useState<ItemRarity>('rare');
  const [colorName, setColorName] = useState('Obsidian Black');
  const [colorHex, setColorHex] = useState('#1F1B16');
  const [condition, setCondition] = useState<ItemCondition>('pristine');
  const [season, setSeason] = useState<ItemSeason>('all');
  const [goldValue, setGoldValue] = useState('100');
  const [targetPrice, setTargetPrice] = useState('');
  const [location, setLocation] = useState('Closet');
  const [imageUrl, setImageUrl] = useState('');
  const [photoId, setPhotoId] = useState<string | undefined>(undefined);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [lockRequirement, setLockRequirement] = useState('');
  const [lore, setLore] = useState('');

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPhoto(true);
    try {
      const record = await processAndStorePhoto(file);
      setPhotoId(record.id);
      const thumbUrl = await getPhotoBlobUrl(record.id, 'thumb');
      if (thumbUrl) {
        setImageUrl(thumbUrl);
      }
    } catch (err: any) {
      alert(`Photo upload failed: ${err.message}`);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const now = new Date().toISOString();
    const newItem: InventoryItem = {
      id: `item-${Date.now()}`,
      created_at: now,
      updated_at: now,
      deleted_at: null,
      revision: 1,
      name: name.trim(),
      category,
      subCategory: subCategory.trim() || 'General',
      rarity,
      colorName,
      colorHex,
      condition,
      season,
      goldValue: Math.max(0, parseInt(goldValue, 10) || 0),
      targetPrice: targetPrice ? Math.max(0, parseFloat(targetPrice)) : undefined,
      location: location.trim() || 'Closet',
      photoId,
      imageUrl: imageUrl.trim() || undefined,
      lore: lore.trim() || 'Personal item in inventory.',
      ownershipStatus,
      isLocked: ownershipStatus === 'wishlist',
      lockRequirement: ownershipStatus === 'wishlist' ? lockRequirement.trim() || 'Personal goal' : undefined,
      pastReason: ownershipStatus === 'past' ? pastReason : undefined,
      pastDate: ownershipStatus === 'past' ? pastDate : undefined,
    };

    sfx.playClick();
    onAddItem(newItem);
    onClose();
  };

  const initialChar = (name[0] || 'V').toUpperCase();

  return (
    <div
      onClick={() => {
        sfx.playClick();
        onClose();
      }}
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
    >
      <div
        className="w-full max-w-lg bg-[#FBF9F4] border border-[#E4DED2] rounded-[6px] overflow-hidden cursor-default max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E4DED2]">
          <div>
            <h2 className="font-serif text-[20px] font-normal text-[#1F1B16]">
              Add Possession
            </h2>
            <p className="text-[12px] text-[#6B645A] mt-0.5">
              Register an item into your inventory
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              sfx.playClick();
              onClose();
            }}
            className="p-1 rounded-[4px] text-[#6B645A] hover:text-[#1F1B16] hover:bg-[#EFEAE0] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Status Selector */}
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wider text-[#6B645A] mb-1">
                Status
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['owned', 'wishlist', 'past'] as OwnershipStatus[]).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setOwnershipStatus(st)}
                    className={`py-1.5 px-3 rounded-[6px] border text-[13px] font-medium transition-colors cursor-pointer ${
                      ownershipStatus === st
                        ? 'bg-[#F6F2EA] border-[#1F1B16] text-[#1F1B16]'
                        : 'border-[#E4DED2] bg-[#FBF9F4] text-[#6B645A] hover:text-[#1F1B16]'
                    }`}
                  >
                    {st === 'owned' ? 'Owned' : st === 'wishlist' ? 'Wishlist' : 'Parted With'}
                  </button>
                ))}
              </div>
            </div>

            {/* Past Reason if past */}
            {ownershipStatus === 'past' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-[#F6F2EA] border border-[#E4DED2] rounded-[6px]">
                <div>
                  <label className="block text-[11px] font-medium uppercase tracking-wider text-[#6B645A] mb-1">Reason</label>
                  <CustomSelect
                    value={pastReason}
                    options={PAST_REASON_OPTIONS}
                    onChange={(val) => setPastReason(val as PastReason)}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium uppercase tracking-wider text-[#6B645A] mb-1">Date Parted</label>
                  <input
                    type="date"
                    value={pastDate}
                    onChange={(e) => setPastDate(e.target.value)}
                    className="ship-input w-full px-2.5 py-1.5 text-xs"
                  />
                </div>
              </div>
            )}

            {/* Wishlist Goal if wishlist */}
            {ownershipStatus === 'wishlist' && (
              <div className="p-3 bg-[#F6F2EA] border border-[#E4DED2] rounded-[6px] space-y-1.5">
                <label className="block text-[11px] font-medium uppercase tracking-wider text-[#6B645A]">
                  Milestone to Unlock
                </label>
                <input
                  type="text"
                  value={lockRequirement}
                  onChange={(e) => setLockRequirement(e.target.value)}
                  placeholder="e.g. 30-day consistency, project completion"
                  className="ship-input w-full px-2.5 py-1 text-xs"
                />
              </div>
            )}

            {/* Item Name */}
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wider text-[#6B645A] mb-1">
                Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Selvedge Heavy Denim, Mechanical Keyboard"
                className="ship-input w-full px-3 py-1.5 text-[14px]"
              />
            </div>

            {/* Photo Upload Area */}
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wider text-[#6B645A] mb-1">
                Photo (Optional)
              </label>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-[4px] bg-[#EFEAE0] border border-[#E4DED2] flex items-center justify-center font-serif text-lg text-[#6B645A] overflow-hidden flex-shrink-0">
                  {imageUrl ? (
                    <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <span>{initialChar}</span>
                  )}
                </div>

                <label className="editorial-btn-secondary text-xs cursor-pointer">
                  <span>{isUploadingPhoto ? 'Processing...' : 'Choose Photo'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    disabled={isUploadingPhoto}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Category & Subcategory */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium uppercase tracking-wider text-[#6B645A] mb-1">Category</label>
                <CustomSelect
                  value={category}
                  options={CATEGORY_OPTIONS}
                  onChange={(val) => setCategory(val as ItemCategory)}
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium uppercase tracking-wider text-[#6B645A] mb-1">Subcategory</label>
                <input
                  type="text"
                  value={subCategory}
                  onChange={(e) => setSubCategory(e.target.value)}
                  placeholder="e.g. Outerwear, Audio, Tome"
                  className="ship-input w-full px-3 py-1.5 text-xs"
                />
              </div>
            </div>

            {/* Rarity & Condition */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium uppercase tracking-wider text-[#6B645A] mb-1">Tier / Grade</label>
                <CustomSelect
                  value={rarity}
                  options={RARITY_OPTIONS}
                  onChange={(val) => setRarity(val as ItemRarity)}
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium uppercase tracking-wider text-[#6B645A] mb-1">Condition</label>
                <CustomSelect
                  value={condition}
                  options={CONDITION_OPTIONS}
                  onChange={(val) => setCondition(val as ItemCondition)}
                />
              </div>
            </div>

            {/* Season, Value & Location */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-medium uppercase tracking-wider text-[#6B645A] mb-1">Season</label>
                <CustomSelect
                  value={season}
                  options={SEASON_OPTIONS}
                  onChange={(val) => setSeason(val as ItemSeason)}
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium uppercase tracking-wider text-[#6B645A] mb-1">
                  {ownershipStatus === 'wishlist' ? `Target (${currencySymbol})` : `Value (${currencySymbol})`}
                </label>
                <input
                  type="number"
                  min="0"
                  value={ownershipStatus === 'wishlist' ? (targetPrice || goldValue) : goldValue}
                  onChange={(e) => {
                    setGoldValue(e.target.value);
                    if (ownershipStatus === 'wishlist') setTargetPrice(e.target.value);
                  }}
                  className="ship-input w-full px-2.5 py-1.5 text-xs tabular-nums"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium uppercase tracking-wider text-[#6B645A] mb-1">Storage Location</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Closet, Desk"
                  className="ship-input w-full px-2.5 py-1.5 text-xs"
                />
              </div>
            </div>

            {/* Color Presets */}
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wider text-[#6B645A] mb-1.5">
                Color: <span className="text-[#1F1B16] font-normal">{colorName}</span>
              </label>
              <div className="flex flex-wrap items-center gap-2">
                {COLOR_PRESETS.map((col) => (
                  <button
                    key={col.hex}
                    type="button"
                    onClick={() => {
                      setColorName(col.name);
                      setColorHex(col.hex);
                    }}
                    className={`w-6 h-6 rounded-[3px] border transition-all cursor-pointer ${
                      colorHex === col.hex ? 'ring-2 ring-[#1F1B16] ring-offset-1 scale-105' : 'border-black/10'
                    }`}
                    style={{ backgroundColor: col.hex }}
                    title={col.name}
                  />
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wider text-[#6B645A] mb-1">
                Notes
              </label>
              <textarea
                rows={2}
                value={lore}
                onChange={(e) => setLore(e.target.value)}
                placeholder="Personal notes on fit, provenance, or function..."
                className="ship-input w-full px-3 py-1.5 text-xs"
              />
            </div>

            {/* Form Actions */}
            <div className="pt-4 border-t border-[#E4DED2] flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="editorial-btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="editorial-btn-primary"
              >
                Add Item
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
