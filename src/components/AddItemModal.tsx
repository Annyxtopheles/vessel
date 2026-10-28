import React, { useState } from 'react';
import type { InventoryItem, ItemCategory, EquipSlot, ItemRarity, ItemCondition, ItemSeason, ItemBuff, OwnershipStatus, PastReason } from '../types';
import { X, Trash2, Lock, CheckCircle2, Archive, Upload } from 'lucide-react';
import { sfx } from '../utils/audio';

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddItem: (item: InventoryItem) => void;
}

const COLOR_PRESETS = [
  { name: 'Black', hex: '#18181B' },
  { name: 'Charcoal', hex: '#27272A' },
  { name: 'Off-White', hex: '#F4EFE6' },
  { name: 'Navy', hex: '#0F172A' },
  { name: 'Dark Brown', hex: '#451A03' },
  { name: 'Olive Green', hex: '#3F4E28' },
  { name: 'Bronze', hex: '#854D0E' },
  { name: 'Forest', hex: '#064E3B' },
];

export const AddItemModal: React.FC<AddItemModalProps> = ({ isOpen, onClose, onAddItem }) => {
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
      ownershipStatus,
      pastReason: ownershipStatus === 'past' ? pastReason : undefined,
      pastDate: ownershipStatus === 'past' ? pastDate : undefined,
      equipSlot: equipSlot ? (equipSlot as EquipSlot) : undefined,
      rarity,
      colorName,
      colorHex,
      condition,
      season,
      weightKg: Math.max(0.01, parseFloat(weightKg) || 0.1),
      goldValue: Math.max(0, parseInt(goldValue, 10) || 0),
      imageUrl: imageUrl.trim() || undefined,
      isLocked: ownershipStatus === 'wishlist',
      lockRequirement: ownershipStatus === 'wishlist' ? lockRequirement.trim() || 'Milestone goal' : undefined,
      lore: lore.trim() || 'Personal item in inventory.',
      buffs,
      isEquipped: false,
      dateAcquired: new Date().toISOString().split('T')[0],
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
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
    >
      <div 
        className="w-full max-w-xl max-h-[90vh] overflow-y-auto bg-[#12141a] border border-[#20232c] rounded-xl p-6 shadow-2xl relative animate-in fade-in zoom-in-95 cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#20232c] mb-4">
          <div>
            <h2 className="text-sm font-semibold text-[#f3f4f6] tracking-tight">
              Add Item to Life Inventory
            </h2>
            <p className="text-xs text-[#8a8f98]">Register possessions you own, wish to acquire, or previously owned</p>
          </div>
          <button
            onClick={() => {
              sfx.playClick();
              onClose();
            }}
            className="text-[#8a8f98] hover:text-[#f3f4f6] p-1 rounded-md hover:bg-[#161822] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Ownership Status Selector */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-[#8a8f98] mb-1.5">
              Possession Status
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  sfx.playClick();
                  setOwnershipStatus('owned');
                }}
                className={`flex flex-col items-center justify-center p-2.5 rounded-lg border text-xs font-mono transition-all ${
                  ownershipStatus === 'owned'
                    ? 'bg-[#161822] border-[#8ebd9b] text-[#8ebd9b]'
                    : 'bg-[#0d0e12] border-[#20232c] text-[#8a8f98] hover:text-[#f3f4f6]'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 mb-1 text-[#8ebd9b]" />
                <span className="font-semibold">Currently Own</span>
                <span className="text-[10px] text-[#8a8f98]">Active item</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  sfx.playClick();
                  setOwnershipStatus('wishlist');
                }}
                className={`flex flex-col items-center justify-center p-2.5 rounded-lg border text-xs font-mono transition-all ${
                  ownershipStatus === 'wishlist'
                    ? 'bg-[#161824] border-[#383d57] text-[#818cf8]'
                    : 'bg-[#0d0e12] border-[#20232c] text-[#8a8f98] hover:text-[#f3f4f6]'
                }`}
              >
                <Lock className="w-4 h-4 mb-1 text-[#818cf8]" />
                <span className="font-semibold">Wish to Own</span>
                <span className="text-[10px] text-[#8a8f98]">Milestone goal</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  sfx.playClick();
                  setOwnershipStatus('past');
                }}
                className={`flex flex-col items-center justify-center p-2.5 rounded-lg border text-xs font-mono transition-all ${
                  ownershipStatus === 'past'
                    ? 'bg-[#161822] border-[#85a6cf] text-[#85a6cf]'
                    : 'bg-[#0d0e12] border-[#20232c] text-[#8a8f98] hover:text-[#f3f4f6]'
                }`}
              >
                <Archive className="w-4 h-4 mb-1 text-[#85a6cf]" />
                <span className="font-semibold">Used to Own</span>
                <span className="text-[10px] text-[#8a8f98]">Parted with</span>
              </button>
            </div>
          </div>

          {/* Conditional: Wishlist Goal */}
          {ownershipStatus === 'wishlist' && (
            <div className="p-3 bg-[#0d0e12] border border-[#20232c] rounded-lg space-y-1.5">
              <label className="block text-xs font-mono text-[#8a8f98]">
                Discipline / Habit Required to Unlock
              </label>
              <input
                type="text"
                value={lockRequirement}
                onChange={(e) => setLockRequirement(e.target.value)}
                placeholder="e.g. 30-day Salah streak, Ship client MVP, Reach Level 10..."
                className="w-full px-3 py-1.5 bg-[#12141a] border border-[#20232c] rounded text-xs text-[#f3f4f6] placeholder-[#555a66] focus:outline-none focus:border-[#5e6ad2]"
              />
            </div>
          )}

          {/* Conditional: Used to Own (Past Reason) */}
          {ownershipStatus === 'past' && (
            <div className="p-3 bg-[#0d0e12] border border-[#20232c] rounded-lg space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-mono text-[#8a8f98] mb-1">
                    How did you part with it?
                  </label>
                  <select
                    value={pastReason}
                    onChange={(e) => setPastReason(e.target.value as PastReason)}
                    className="w-full px-2.5 py-1.5 bg-[#12141a] border border-[#20232c] rounded text-xs text-[#f3f4f6]"
                  >
                    <option value="sold">Sold</option>
                    <option value="gifted">Gifted away</option>
                    <option value="donated">Donated</option>
                    <option value="retired">Retired / Recycled</option>
                    <option value="lost">Lost / Replaced</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-mono text-[#8a8f98] mb-1">
                    Date Parted With
                  </label>
                  <input
                    type="date"
                    value={pastDate}
                    onChange={(e) => setPastDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-[#12141a] border border-[#20232c] rounded text-xs text-[#f3f4f6]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Item Name */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-[#8a8f98] mb-1">Item Title</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Linen Overshirt, Sony XM5, Leather Notebook..."
              className="w-full px-3 py-2 bg-[#0d0e12] border border-[#20232c] rounded-lg text-sm text-[#f3f4f6] placeholder-[#555a66] focus:outline-none focus:border-[#5e6ad2]"
            />
          </div>

          {/* Image URL + File Upload */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-[#8a8f98] mb-1">Image (URL or Local File)</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://images.unsplash.com/... or upload"
                className="flex-1 px-3 py-1.5 bg-[#0d0e12] border border-[#20232c] rounded-lg text-xs text-[#f3f4f6] placeholder-[#555a66] focus:outline-none focus:border-[#5e6ad2]"
              />
              <label className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#161822] border border-[#20232c] text-xs font-mono text-[#8a8f98] hover:text-[#f3f4f6] hover:bg-[#202330] transition-colors">
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

          {/* Category & Equip Slot */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[#8a8f98] mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ItemCategory)}
                className="w-full px-3 py-1.5 bg-[#0d0e12] border border-[#20232c] rounded-lg text-xs text-[#f3f4f6]"
              >
                <option value="apparel">Clothing & Wardrobe</option>
                <option value="tech">Tech & Hardware</option>
                <option value="tomes">Book / Tome</option>
                <option value="edc">Everyday Carry (EDC)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[#8a8f98] mb-1">Loadout Slot</label>
              <select
                value={equipSlot}
                onChange={(e) => setEquipSlot(e.target.value as EquipSlot | '')}
                className="w-full px-3 py-1.5 bg-[#0d0e12] border border-[#20232c] rounded-lg text-xs text-[#f3f4f6]"
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
              <label className="block text-xs font-mono uppercase tracking-wider text-[#8a8f98] mb-1">Subcategory Tag</label>
              <input
                type="text"
                value={subCategory}
                onChange={(e) => setSubCategory(e.target.value)}
                placeholder="e.g. Overshirt, Audio, Timepiece"
                className="w-full px-3 py-1.5 bg-[#0d0e12] border border-[#20232c] rounded-lg text-xs text-[#f3f4f6]"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[#8a8f98] mb-1">Tier / Grade</label>
              <select
                value={rarity}
                onChange={(e) => setRarity(e.target.value as ItemRarity)}
                className="w-full px-3 py-1.5 bg-[#0d0e12] border border-[#20232c] rounded-lg text-xs text-[#f3f4f6]"
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
              <label className="block text-xs font-mono uppercase tracking-wider text-[#8a8f98] mb-1">Condition</label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value as ItemCondition)}
                className="w-full px-2.5 py-1.5 bg-[#0d0e12] border border-[#20232c] rounded-lg text-xs text-[#f3f4f6]"
              >
                <option value="pristine">Pristine</option>
                <option value="seasoned">Seasoned</option>
                <option value="worn">Worn</option>
                <option value="needs_repair">Needs Repair</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[#8a8f98] mb-1">Season</label>
              <select
                value={season}
                onChange={(e) => setSeason(e.target.value as ItemSeason)}
                className="w-full px-2.5 py-1.5 bg-[#0d0e12] border border-[#20232c] rounded-lg text-xs text-[#f3f4f6]"
              >
                <option value="all">All Year</option>
                <option value="summer">Summer</option>
                <option value="winter">Winter</option>
                <option value="transitional">Transitional</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[#8a8f98] mb-1">Weight (kg)</label>
              <input
                type="number"
                step="0.05"
                min="0.01"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-[#0d0e12] border border-[#20232c] rounded-lg text-xs text-[#f3f4f6]"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[#8a8f98] mb-1">Value ($)</label>
              <input
                type="number"
                min="0"
                value={goldValue}
                onChange={(e) => setGoldValue(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-[#0d0e12] border border-[#20232c] rounded-lg text-xs text-[#f3f4f6]"
              />
            </div>
          </div>

          {/* Color Presets */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-[#8a8f98] mb-1.5">
              Color Signature: <span className="text-[#f3f4f6]">{colorName}</span>
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
                    colorHex === col.hex ? 'ring-2 ring-[#d8b46b] scale-110' : 'border-[#20232c]'
                  }`}
                  style={{ backgroundColor: col.hex }}
                  title={col.name}
                />
              ))}
            </div>
          </div>

          {/* Lore / Notes */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-[#8a8f98] mb-1">
              Purpose & Significance
            </label>
            <textarea
              rows={2}
              value={lore}
              onChange={(e) => setLore(e.target.value)}
              placeholder="Why this item exists in your life and what function it fulfills..."
              className="w-full px-3 py-2 bg-[#0d0e12] border border-[#20232c] rounded-lg text-xs text-[#f3f4f6] placeholder-[#555a66] focus:outline-none focus:border-[#d8b46b]"
            />
          </div>

          {/* Life Attribute Modifiers */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-mono uppercase tracking-wider text-[#8a8f98]">
                Attribute Modifiers
              </label>
              <button
                type="button"
                onClick={handleAddBuff}
                className="text-xs font-mono text-[#818cf8] hover:text-[#a5b4fc]"
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
                    className="px-2 py-1.5 bg-[#0d0e12] border border-[#20232c] rounded text-xs text-[#f3f4f6]"
                  >
                    <option value="STR">STR (Physical)</option>
                    <option value="INT">INT (Professional)</option>
                    <option value="WIS">WIS (Spiritual)</option>
                    <option value="CHA">CHA (Social)</option>
                    <option value="FOCUS">Focus</option>
                    <option value="STYLE">Style</option>
                    <option value="COMFORT">Comfort</option>
                  </select>

                  <input
                    type="number"
                    value={buff.value}
                    onChange={(e) => handleUpdateBuff(i, 'value', parseInt(e.target.value, 10) || 1)}
                    className="w-16 px-2 py-1.5 bg-[#0d0e12] border border-[#20232c] rounded text-xs text-[#f3f4f6]"
                  />

                  <input
                    type="text"
                    value={buff.label}
                    onChange={(e) => handleUpdateBuff(i, 'label', e.target.value)}
                    placeholder="e.g. Ergonomic Clarity"
                    className="flex-1 px-2.5 py-1.5 bg-[#0d0e12] border border-[#20232c] rounded text-xs text-[#f3f4f6]"
                  />

                  {buffs.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveBuff(i)}
                      className="p-1.5 text-[#8a8f98] hover:text-rose-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-3 border-t border-[#20232c] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-mono text-[#8a8f98] hover:text-[#f3f4f6] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-[#5e6ad2] hover:bg-[#4f56e9] text-white text-xs font-semibold shadow-sm transition-all"
            >
              Register Item to Vault
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
