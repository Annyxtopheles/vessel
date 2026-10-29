import React, { useState } from 'react';
import type { InventoryItem, ItemCategory, ItemRarity, ItemCondition, ItemSeason, OwnershipStatus, PastReason } from '../types';
import { X, Upload, Package } from 'lucide-react';
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
  { name: 'Obsidian Black', hex: '#18181B' },
  { name: 'Charcoal Heather', hex: '#27272A' },
  { name: 'Deep Ink', hex: '#0F172A' },
  { name: 'Dark Auburn', hex: '#451A03' },
  { name: 'Slate Bone', hex: '#475569' },
  { name: 'Matte Gray', hex: '#1E293B' },
  { name: 'Emerald Gilt', hex: '#064E3B' },
  { name: 'Aged Bronze', hex: '#854D0E' },
  { name: 'Mineral', hex: '#94A3B8' },
  { name: 'Off-White', hex: '#F8FAFC' },
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
  currencySymbol = '$',
}) => {
  const [name, setName] = useState('');
  const [ownershipStatus, setOwnershipStatus] = useState<OwnershipStatus>('owned');
  const [pastReason, setPastReason] = useState<PastReason>('sold');
  const [pastDate, setPastDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState<ItemCategory>('apparel');
  const [subCategory, setSubCategory] = useState('Outerwear');
  const [rarity, setRarity] = useState<ItemRarity>('rare');
  const [colorName, setColorName] = useState('Obsidian Black');
  const [colorHex, setColorHex] = useState('#18181B');
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
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#ECECF0] bg-white">
          <div>
            <h2 className="text-[15px] font-semibold text-[#111113]">
              Add Possession
            </h2>
            <p className="text-[13px] text-[#6B6B76] mt-0.5">
              Register an item into your inventory
            </p>
          </div>

          <button
            onClick={() => {
              sfx.playClick();
              onClose();
            }}
            className="p-1.5 rounded-lg text-[#6B6B76] hover:text-[#111113] hover:bg-[#F4F4F6] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Status Selector */}
            <div>
              <label className="block text-[13px] font-medium text-[#6B6B76] mb-1.5">
                Status
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setOwnershipStatus('owned')}
                  className={`py-2 px-3 rounded-xl border text-[13px] font-medium transition-all cursor-pointer ${
                    ownershipStatus === 'owned'
                      ? 'bg-[#E6F7F9] border-[#0891B2] text-[#0891B2] font-semibold'
                      : 'border-[#ECECF0] text-[#6B6B76] hover:bg-[#F4F4F6]'
                  }`}
                >
                  Owned
                </button>
                <button
                  type="button"
                  onClick={() => setOwnershipStatus('wishlist')}
                  className={`py-2 px-3 rounded-xl border text-[13px] font-medium transition-all cursor-pointer ${
                    ownershipStatus === 'wishlist'
                      ? 'bg-[#E6F7F9] border-[#0891B2] text-[#0891B2] font-semibold'
                      : 'border-[#ECECF0] text-[#6B6B76] hover:bg-[#F4F4F6]'
                  }`}
                >
                  Wishlist
                </button>
                <button
                  type="button"
                  onClick={() => setOwnershipStatus('past')}
                  className={`py-2 px-3 rounded-xl border text-[13px] font-medium transition-all cursor-pointer ${
                    ownershipStatus === 'past'
                      ? 'bg-[#E6F7F9] border-[#0891B2] text-[#0891B2] font-semibold'
                      : 'border-[#ECECF0] text-[#6B6B76] hover:bg-[#F4F4F6]'
                  }`}
                >
                  Parted With
                </button>
              </div>
            </div>

            {/* Past Reason if past */}
            {ownershipStatus === 'past' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-[#F4F4F6] border border-[#ECECF0] rounded-xl">
                <div>
                  <label className="block text-[13px] font-medium text-[#6B6B76] mb-1">Reason</label>
                  <CustomSelect
                    value={pastReason}
                    options={PAST_REASON_OPTIONS}
                    onChange={(val) => setPastReason(val as PastReason)}
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-[#6B6B76] mb-1">Date Parted</label>
                  <input
                    type="date"
                    value={pastDate}
                    onChange={(e) => setPastDate(e.target.value)}
                    className="ship-input w-full px-3 py-1.5 text-[13px]"
                  />
                </div>
              </div>
            )}

            {/* Wishlist Goal if wishlist */}
            {ownershipStatus === 'wishlist' && (
              <div className="p-3.5 bg-[#F4F4F6] border border-[#ECECF0] rounded-xl space-y-2">
                <label className="block text-[13px] font-medium text-[#6B6B76]">
                  Goal or Milestone to Unlock
                </label>
                <input
                  type="text"
                  value={lockRequirement}
                  onChange={(e) => setLockRequirement(e.target.value)}
                  placeholder="e.g. Maintain 30-day workout streak, Ship client milestone"
                  className="ship-input w-full px-3 py-1.5 text-[13px]"
                />
              </div>
            )}

            {/* Item Name */}
            <div>
              <label className="block text-[13px] font-medium text-[#6B6B76] mb-1">
                Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Selvedge Heavy Denim, Mechanical Keyboard"
                className="ship-input w-full px-3 py-2 text-[13px]"
              />
            </div>

            {/* Photo Upload Area */}
            <div>
              <label className="block text-[13px] font-medium text-[#6B6B76] mb-1">
                Photo (Optional)
              </label>
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl bg-[#F4F4F6] border border-[#ECECF0] flex items-center justify-center overflow-hidden flex-shrink-0">
                  {imageUrl ? (
                    <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <Package className="w-5 h-5 text-[#9A9AA5]" />
                  )}
                </div>

                <label className="px-3.5 py-2 rounded-xl border border-[#ECECF0] text-xs font-medium text-[#111113] hover:bg-[#F4F4F6] transition-colors cursor-pointer flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5 text-[#6B6B76]" />
                  <span>{isUploadingPhoto ? 'Optimizing...' : 'Choose Photo'}</span>
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
                <label className="block text-[13px] font-medium text-[#6B6B76] mb-1">Category</label>
                <CustomSelect
                  value={category}
                  options={CATEGORY_OPTIONS}
                  onChange={(val) => setCategory(val as ItemCategory)}
                />
              </div>

              <div>
                <label className="block text-[13px] font-medium text-[#6B6B76] mb-1">Subcategory</label>
                <input
                  type="text"
                  value={subCategory}
                  onChange={(e) => setSubCategory(e.target.value)}
                  placeholder="e.g. Outerwear, Audio, Timepiece"
                  className="ship-input w-full px-3 py-2 text-[13px]"
                />
              </div>
            </div>

            {/* Rarity & Condition */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[13px] font-medium text-[#6B6B76] mb-1">Tier / Grade</label>
                <CustomSelect
                  value={rarity}
                  options={RARITY_OPTIONS}
                  onChange={(val) => setRarity(val as ItemRarity)}
                />
              </div>

              <div>
                <label className="block text-[13px] font-medium text-[#6B6B76] mb-1">Condition</label>
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
                <label className="block text-[13px] font-medium text-[#6B6B76] mb-1">Season</label>
                <CustomSelect
                  value={season}
                  options={SEASON_OPTIONS}
                  onChange={(val) => setSeason(val as ItemSeason)}
                />
              </div>

              <div>
                <label className="block text-[13px] font-medium text-[#6B6B76] mb-1">
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
                  className="ship-input w-full px-2.5 py-2 text-[13px]"
                />
              </div>

              <div>
                <label className="block text-[13px] font-medium text-[#6B6B76] mb-1">Storage Location</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Closet, Desk"
                  className="ship-input w-full px-3 py-2 text-[13px]"
                />
              </div>
            </div>

            {/* Color Presets */}
            <div>
              <label className="block text-[13px] font-medium text-[#6B6B76] mb-1.5">
                Color: <span className="text-[#111113] font-semibold">{colorName}</span>
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
                    className={`w-7 h-7 rounded-full border transition-all cursor-pointer ${
                      colorHex === col.hex ? 'ring-2 ring-[#0891B2] ring-offset-2 scale-110' : 'border-black/10'
                    }`}
                    style={{ backgroundColor: col.hex }}
                    title={col.name}
                  />
                ))}
              </div>
            </div>

            {/* Notes & Lore */}
            <div>
              <label className="block text-[13px] font-medium text-[#6B6B76] mb-1">
                Notes
              </label>
              <textarea
                rows={2}
                value={lore}
                onChange={(e) => setLore(e.target.value)}
                placeholder="Personal notes on fit, provenance, or function..."
                className="ship-input w-full px-3 py-2 text-[13px]"
              />
            </div>

            {/* Form Actions */}
            <div className="pt-4 border-t border-[#ECECF0] flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-[13px] font-medium text-[#6B6B76] hover:text-[#111113] hover:bg-[#F4F4F6] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[#0891B2] hover:bg-[#0E7490] text-white text-[13px] font-semibold transition-all shadow-xs cursor-pointer"
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
