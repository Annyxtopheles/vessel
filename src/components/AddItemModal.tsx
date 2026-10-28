import React, { useState } from 'react';
import type { InventoryItem, ItemCategory, EquipSlot, ItemRarity, ItemCondition, ItemSeason, ItemBuff, OwnershipStatus, PastReason } from '../types';
import { X, Trash2, Lock, CheckCircle2, Archive, Upload } from 'lucide-react';
import { sfx } from '../utils/audio';

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddItem: (item: InventoryItem) => void;
  currencySymbol?: string;
}

const COLOR_PRESETS = [
  { name: 'Black', hex: '#18181B' },
  { name: 'Charcoal', hex: '#27272A' },
  { name: 'Off-White', hex: '#F4EFE6' },
  { name: 'Navy', hex: '#0F172A' },
  { name: 'Dark Brown', hex: '#451A03' },
  { name: 'Olive Green', hex: '#3F4E28' },
  { name: 'Violet', hex: '#7C6CF0' },
  { name: 'Forest', hex: '#064E3B' },
];

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
  const [equipSlot, setEquipSlot] = useState<EquipSlot | ''>('outerwear');
  const [rarity, setRarity] = useState<ItemRarity>('rare');
  const [colorName, setColorName] = useState('Black');
  const [colorHex, setColorHex] = useState('#18181B');
  const [condition, setCondition] = useState<ItemCondition>('pristine');
  const [season, setSeason] = useState<ItemSeason>('all');
  const [weightKg, setWeightKg] = useState('0.5');
  const [goldValue, setGoldValue] = useState('100');
  const [targetPrice, setTargetPrice] = useState('');
  const [carried, setCarried] = useState(true);
  const [location, setLocation] = useState('Vault Wardrobe');
  const [imageUrl, setImageUrl] = useState('');
  const [lockRequirement, setLockRequirement] = useState('');
  const [lore, setLore] = useState('');
  const [buffs, setBuffs] = useState<ItemBuff[]>([
    { stat: 'FOCUS', value: 2, label: 'Mindful Utility' },
  ]);

  if (!isOpen) return null;

  const handleAddBuff = () => {
    setBuffs([...buffs, { stat: 'STYLE', value: 2, label: 'Structured Fit' }]);
  };

  const handleRemoveBuff = (index: number) => {
    setBuffs(buffs.filter((_, i) => i !== index));
  };

  const handleUpdateBuff = (index: number, field: keyof ItemBuff, value: any) => {
    const updated = [...buffs];
    updated[index] = { ...updated[index], [field]: value };
    setBuffs(updated);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setImageUrl(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newItem: InventoryItem = {
      id: `item-${Date.now()}`,
      name: name.trim(),
      category,
      subCategory: subCategory.trim() || 'General',
      equipSlot: equipSlot || undefined,
      rarity,
      colorName,
      colorHex,
      condition,
      season,
      weightKg: Math.max(0.01, parseFloat(weightKg) || 0.1),
      goldValue: Math.max(0, parseInt(goldValue, 10) || 0),
      targetPrice: targetPrice ? Math.max(0, parseFloat(targetPrice)) : undefined,
      carried: ownershipStatus === 'owned' ? carried : false,
      location: location.trim() || 'Vault Wardrobe',
      imageUrl: imageUrl.trim() || undefined,
      lore: lore.trim() || 'Personal item in inventory.',
      buffs,
      isEquipped: false,
      ownershipStatus,
      isLocked: ownershipStatus === 'wishlist',
      lockRequirement: ownershipStatus === 'wishlist' ? lockRequirement.trim() || 'Personal goal' : undefined,
      pastReason: ownershipStatus === 'past' ? pastReason : undefined,
      pastDate: ownershipStatus === 'past' ? pastDate : undefined,
    };

    sfx.playEquip();
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
              Add Possession to Vault
            </h2>
            <p className="text-[13px] text-[#6B6B76] mt-0.5">
              Register an item you own, wish to acquire, or previously parted with
            </p>
          </div>
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

        {/* Scrollable Form Body */}
        <div className="overflow-y-auto flex-1 p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Ownership Status Selector */}
            <div>
              <label className="block text-[13px] font-medium text-[#6B6B76] mb-2">
                Possession Status
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    sfx.playClick();
                    setOwnershipStatus('owned');
                  }}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-[13px] transition-all ${
                    ownershipStatus === 'owned'
                      ? 'bg-[#E6F7F9] border-[#0891B2] text-[#0891B2] font-semibold'
                      : 'bg-white border-[#ECECF0] text-[#6B6B76] hover:border-[#BEBEC6]'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 mb-1 text-[#0891B2]" />
                  <span>Currently Own</span>
                  <span className="text-[11px] text-[#9A9AA5]">Active item</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    sfx.playClick();
                    setOwnershipStatus('wishlist');
                  }}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-[13px] transition-all ${
                    ownershipStatus === 'wishlist'
                      ? 'bg-[#E6F7F9] border-[#0891B2] text-[#0891B2] font-semibold'
                      : 'bg-white border-[#ECECF0] text-[#6B6B76] hover:border-[#BEBEC6]'
                  }`}
                >
                  <Lock className="w-4 h-4 mb-1 text-[#0891B2]" />
                  <span>Wish to Own</span>
                  <span className="text-[11px] text-[#9A9AA5]">Milestone goal</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    sfx.playClick();
                    setOwnershipStatus('past');
                  }}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-[13px] transition-all ${
                    ownershipStatus === 'past'
                      ? 'bg-[#E6F7F9] border-[#0891B2] text-[#0891B2] font-semibold'
                      : 'bg-white border-[#ECECF0] text-[#6B6B76] hover:border-[#BEBEC6]'
                  }`}
                >
                  <Archive className="w-4 h-4 mb-1 text-[#0891B2]" />
                  <span>Used to Own</span>
                  <span className="text-[11px] text-[#9A9AA5]">Parted with</span>
                </button>
              </div>
            </div>

            {/* Conditional: Wishlist Goal */}
            {ownershipStatus === 'wishlist' && (
              <div className="p-3.5 bg-[#F4F4F6] border border-[#ECECF0] rounded-xl space-y-1.5">
                <label className="block text-[13px] text-[#6B6B76] font-medium">
                  Milestone / Habit Required to Unlock
                </label>
                <input
                  type="text"
                  value={lockRequirement}
                  onChange={(e) => setLockRequirement(e.target.value)}
                  placeholder="e.g. 30-day streak, Ship client MVP, Complete project..."
                  className="ship-input w-full px-3 py-1.5 text-[13px]"
                />
              </div>
            )}

            {/* Conditional: Used to Own (Past Reason) */}
            {ownershipStatus === 'past' && (
              <div className="p-3.5 bg-[#F4F4F6] border border-[#ECECF0] rounded-xl space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[13px] text-[#6B6B76] mb-1 font-medium">
                      How did you part with it?
                    </label>
                    <select
                      value={pastReason}
                      onChange={(e) => setPastReason(e.target.value as PastReason)}
                      className="ship-input w-full px-3 py-1.5 text-[13px]"
                    >
                      <option value="sold">Sold</option>
                      <option value="gifted">Gifted away</option>
                      <option value="donated">Donated</option>
                      <option value="retired">Retired / Recycled</option>
                      <option value="lost">Lost / Replaced</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[13px] text-[#6B6B76] mb-1 font-medium">
                      Date Parted With
                    </label>
                    <input
                      type="date"
                      value={pastDate}
                      onChange={(e) => setPastDate(e.target.value)}
                      className="ship-input w-full px-3 py-1.5 text-[13px]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Item Name */}
            <div>
              <label className="block text-[13px] font-medium text-[#6B6B76] mb-1">Item Title</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Linen Overshirt, Sony XM5, Leather Notebook..."
                className="ship-input w-full px-3 py-2 text-[14px]"
              />
            </div>

            {/* Image URL + File Upload */}
            <div>
              <label className="block text-[13px] font-medium text-[#6B6B76] mb-1">Image (URL or Local File)</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/... or upload"
                  className="ship-input flex-1 px-3 py-1.5 text-[13px]"
                />
                <label className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F4F4F6] border border-[#ECECF0] text-[13px] font-medium text-[#111113] hover:bg-[#EAEAEF] transition-colors">
                  <Upload className="w-3.5 h-3.5 text-[#7C6CF0]" />
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

            {/* Category & Equip Slot */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[13px] font-medium text-[#6B6B76] mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ItemCategory)}
                  className="ship-input w-full px-3 py-2 text-[13px]"
                >
                  <option value="apparel">Clothing & Wardrobe</option>
                  <option value="tech">Tech & Hardware</option>
                  <option value="tomes">Book / Tome</option>
                  <option value="edc">Everyday Carry (EDC)</option>
                </select>
              </div>

              <div>
                <label className="block text-[13px] font-medium text-[#6B6B76] mb-1">Loadout Slot</label>
                <select
                  value={equipSlot}
                  onChange={(e) => setEquipSlot(e.target.value as EquipSlot | '')}
                  className="ship-input w-full px-3 py-2 text-[13px]"
                >
                  <option value="">None (Storage Only)</option>
                  <option value="head">Headwear</option>
                  <option value="outerwear">Outerwear</option>
                  <option value="innerwear">Base Layer / Tops</option>
                  <option value="legs">Pants / Bottoms</option>
                  <option value="footwear">Footwear</option>
                  <option value="tech_relic">Tech Gear</option>
                  <option value="tome">Book / Tome</option>
                  <option value="wrist_edc">Wrist / EDC</option>
                </select>
              </div>
            </div>

            {/* Subcategory & Rarity */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[13px] font-medium text-[#6B6B76] mb-1">Subcategory Tag</label>
                <input
                  type="text"
                  value={subCategory}
                  onChange={(e) => setSubCategory(e.target.value)}
                  placeholder="e.g. Overshirt, Audio, Timepiece"
                  className="ship-input w-full px-3 py-2 text-[13px]"
                />
              </div>

              <div>
                <label className="block text-[13px] font-medium text-[#6B6B76] mb-1">Tier / Grade</label>
                <select
                  value={rarity}
                  onChange={(e) => setRarity(e.target.value as ItemRarity)}
                  className="ship-input w-full px-3 py-2 text-[13px]"
                >
                  <option value="common">Common</option>
                  <option value="rare">Rare (Premium)</option>
                  <option value="epic">Epic (Heritage)</option>
                  <option value="masterwork">Masterwork (Artisanal)</option>
                  <option value="legendary">Legendary (Benchmark)</option>
                </select>
              </div>
            </div>

            {/* Condition, Season, Weight & Gold Value */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[13px] font-medium text-[#6B6B76] mb-1">Condition</label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value as ItemCondition)}
                  className="ship-input w-full px-2.5 py-2 text-[13px]"
                >
                  <option value="pristine">Pristine</option>
                  <option value="seasoned">Seasoned</option>
                  <option value="worn">Worn</option>
                  <option value="needs_repair">Needs Repair</option>
                </select>
              </div>

              <div>
                <label className="block text-[13px] font-medium text-[#6B6B76] mb-1">Season</label>
                <select
                  value={season}
                  onChange={(e) => setSeason(e.target.value as ItemSeason)}
                  className="ship-input w-full px-2.5 py-2 text-[13px]"
                >
                  <option value="all">All Year</option>
                  <option value="summer">Summer</option>
                  <option value="winter">Winter</option>
                  <option value="transitional">Transitional</option>
                </select>
              </div>

              <div>
                <label className="block text-[13px] font-medium text-[#6B6B76] mb-1">Weight (kg)</label>
                <input
                  type="number"
                  step="0.05"
                  min="0.01"
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                  className="ship-input w-full px-2.5 py-2 text-[13px]"
                />
              </div>

              <div>
                <label className="block text-[13px] font-medium text-[#6B6B76] mb-1">
                  {ownershipStatus === 'wishlist' ? `Target Price (${currencySymbol})` : `Value (${currencySymbol})`}
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
            </div>

            {/* Location & Carried Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-[#F4F4F6] border border-[#ECECF0] rounded-xl">
              <div>
                <label className="block text-[13px] font-medium text-[#6B6B76] mb-1">Storage Location</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Vault Wardrobe, Desk, Everyday Bag"
                  className="ship-input w-full px-3 py-1.5 text-[13px]"
                />
              </div>

              <div className="flex flex-col justify-center">
                <label className="block text-[13px] font-medium text-[#6B6B76] mb-1">Carry Load Inclusion</label>
                <label className="flex items-center gap-2 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={carried}
                    disabled={ownershipStatus !== 'owned'}
                    onChange={(e) => setCarried(e.target.checked)}
                    className="w-4 h-4 rounded text-[#0891B2] accent-[#0891B2] focus:ring-0 cursor-pointer"
                  />
                  <span className={`text-[13px] ${ownershipStatus !== 'owned' ? 'text-[#9A9AA5]' : 'text-[#111113] font-medium'}`}>
                    Carried today (counts towards Carry Load)
                  </span>
                </label>
              </div>
            </div>

            {/* Color Presets */}
            <div>
              <label className="block text-[13px] font-medium text-[#6B6B76] mb-1.5">
                Color Signature: <span className="text-[#111113] font-semibold">{colorName}</span>
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
                    className={`w-7 h-7 rounded-full border transition-all ${
                      colorHex === col.hex ? 'ring-2 ring-[#0891B2] ring-offset-2 scale-110' : 'border-black/10'
                    }`}
                    style={{ backgroundColor: col.hex }}
                    title={col.name}
                  />
                ))}
              </div>
            </div>

            {/* Purpose & Notes */}
            <div>
              <label className="block text-[13px] font-medium text-[#6B6B76] mb-1">
                Purpose & Significance
              </label>
              <textarea
                rows={2}
                value={lore}
                onChange={(e) => setLore(e.target.value)}
                placeholder="Why this item exists in your life and what function it fulfills..."
                className="ship-input w-full px-3 py-2 text-[13px]"
              />
            </div>

            {/* Life Attribute Modifiers */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-[13px] font-medium text-[#6B6B76]">
                  Attribute Modifiers
                </label>
                <button
                  type="button"
                  onClick={handleAddBuff}
                  className="text-[13px] font-medium text-[#0891B2] hover:underline"
                >
                  + Add Modifier
                </button>
              </div>

              <div className="space-y-2">
                {buffs.map((buff, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <select
                      value={buff.stat}
                      onChange={(e) => handleUpdateBuff(i, 'stat', e.target.value)}
                      className="ship-input px-2.5 py-1.5 text-[13px]"
                    >
                      <option value="STR">STR (Physical)</option>
                      <option value="INT">INT (Professional)</option>
                      <option value="WIS">WIS (Spiritual)</option>
                      <option value="CHA">CHA (Social)</option>
                      <option value="FOCUS">Focus</option>
                      <option value="STYLE">Style</option>
                      <option value="COMFORT">Comfort</option>
                      <option value="WARMTH">Warmth</option>
                    </select>

                    <input
                      type="number"
                      value={buff.value}
                      onChange={(e) => handleUpdateBuff(i, 'value', parseInt(e.target.value, 10) || 1)}
                      className="ship-input w-16 px-2 py-1.5 text-[13px]"
                    />

                    <input
                      type="text"
                      value={buff.label}
                      onChange={(e) => handleUpdateBuff(i, 'label', e.target.value)}
                      placeholder="e.g. Ergonomic Clarity"
                      className="ship-input flex-1 px-3 py-1.5 text-[13px]"
                    />

                    {buffs.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveBuff(i)}
                        className="p-1.5 text-[#9A9AA5] hover:text-[#DC2626] transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Form Actions */}
            <div className="pt-4 border-t border-[#ECECF0] flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-[13px] font-medium text-[#6B6B76] hover:text-[#111113] hover:bg-[#F4F4F6] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[#0891B2] hover:bg-[#0E7490] text-white text-[13px] font-semibold transition-all shadow-xs"
              >
                Register Possession
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
