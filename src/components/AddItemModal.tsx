import React, { useState } from 'react';
import type { InventoryItem, ItemCategory, EquipSlot, ItemRarity, ItemCondition, ItemSeason, ItemBuff } from '../types';
import { X, Trash2, Lock, Sparkles } from 'lucide-react';
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
  const [isLocked, setIsLocked] = useState(false);
  const [lockRequirement, setLockRequirement] = useState('');
  const [lore, setLore] = useState('');
  const [buffs, setBuffs] = useState<ItemBuff[]>([
    { stat: 'FOCUS', value: 2, label: 'Mindful Utility' },
  ]);

  if (!isOpen) return null;

  const handleAddBuff = () => {
    setBuffs([...buffs, { stat: 'STYLE', value: 2, label: 'Elegance' }]);
  };

  const handleRemoveBuff = (index: number) => {
    setBuffs(buffs.filter((_, i) => i !== index));
  };

  const handleUpdateBuff = (index: number, field: keyof ItemBuff, value: any) => {
    const updated = [...buffs];
    updated[index] = { ...updated[index], [field]: value };
    setBuffs(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newItem: InventoryItem = {
      id: `item-${Date.now()}`,
      name: name.trim(),
      category,
      subCategory: subCategory.trim() || 'General',
      equipSlot: equipSlot ? (equipSlot as EquipSlot) : undefined,
      rarity,
      colorName,
      colorHex,
      condition,
      season,
      weightKg: Math.max(0.01, parseFloat(weightKg) || 0.1),
      goldValue: Math.max(0, parseInt(goldValue, 10) || 0),
      isLocked,
      lockRequirement: isLocked ? lockRequirement.trim() || 'Milestone goal' : undefined,
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
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div 
        className="ui-card w-full max-w-xl max-h-[90vh] overflow-y-auto bg-[#14161a] border border-[#2b2e38] p-6 shadow-2xl relative animate-in fade-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#23262f] mb-4">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              Add Item to Inventory
            </h2>
            <p className="text-xs text-neutral-400">Register a real piece of clothing, hardware, book, or wishlist goal</p>
          </div>
          <button
            onClick={() => {
              sfx.playClick();
              onClose();
            }}
            className="text-neutral-400 hover:text-white p-1 rounded-md hover:bg-[#1f2229] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Item Name */}
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">Item Title</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Linen Overshirt, Sony XM5, Leather Notebook..."
              className="w-full px-3 py-2 bg-[#101216] border border-[#23262f] rounded-lg text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-[#e5b869]"
            />
          </div>

          {/* Category & Equip Slot */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ItemCategory)}
                className="w-full px-3 py-2 bg-[#101216] border border-[#23262f] rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-[#e5b869]"
              >
                <option value="apparel">Clothing & Wardrobe</option>
                <option value="tech">Tech & Hardware</option>
                <option value="tomes">Book / Tome</option>
                <option value="edc">Everyday Carry (EDC)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">Loadout Slot</label>
              <select
                value={equipSlot}
                onChange={(e) => setEquipSlot(e.target.value as EquipSlot | '')}
                className="w-full px-3 py-2 bg-[#101216] border border-[#23262f] rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-[#e5b869]"
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
              <label className="block text-xs font-medium text-neutral-300 mb-1">Subcategory Tag</label>
              <input
                type="text"
                value={subCategory}
                onChange={(e) => setSubCategory(e.target.value)}
                placeholder="e.g. Overshirt, Audio, Timepiece"
                className="w-full px-3 py-2 bg-[#101216] border border-[#23262f] rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-[#e5b869]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">Tier / Grade</label>
              <select
                value={rarity}
                onChange={(e) => setRarity(e.target.value as ItemRarity)}
                className="w-full px-3 py-2 bg-[#101216] border border-[#23262f] rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-[#e5b869]"
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
              <label className="block text-xs font-medium text-neutral-300 mb-1">Condition</label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value as ItemCondition)}
                className="w-full px-2.5 py-2 bg-[#101216] border border-[#23262f] rounded-lg text-xs text-neutral-200"
              >
                <option value="pristine">Pristine</option>
                <option value="seasoned">Seasoned</option>
                <option value="worn">Worn</option>
                <option value="needs_repair">Needs Repair</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">Season</label>
              <select
                value={season}
                onChange={(e) => setSeason(e.target.value as ItemSeason)}
                className="w-full px-2.5 py-2 bg-[#101216] border border-[#23262f] rounded-lg text-xs text-neutral-200"
              >
                <option value="all">All Year</option>
                <option value="summer">Summer</option>
                <option value="winter">Winter</option>
                <option value="transitional">Transitional</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">Weight (kg)</label>
              <input
                type="number"
                step="0.05"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                className="w-full px-2.5 py-2 bg-[#101216] border border-[#23262f] rounded-lg text-xs text-neutral-200"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">Price ($)</label>
              <input
                type="number"
                value={goldValue}
                onChange={(e) => setGoldValue(e.target.value)}
                className="w-full px-2.5 py-2 bg-[#101216] border border-[#23262f] rounded-lg text-xs text-neutral-200"
              />
            </div>
          </div>

          {/* Color Presets */}
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">Color</label>
            <div className="flex flex-wrap items-center gap-2">
              {COLOR_PRESETS.map((p) => (
                <button
                  type="button"
                  key={p.name}
                  onClick={() => {
                    setColorName(p.name);
                    setColorHex(p.hex);
                  }}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs transition-colors ${
                    colorName === p.name ? 'border-[#e5b869] bg-[#e5b869]/10 text-white' : 'border-[#272a34] text-neutral-400'
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.hex }} />
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          {/* Lore / Description */}
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">Description / Notes</label>
            <textarea
              rows={2}
              value={lore}
              onChange={(e) => setLore(e.target.value)}
              placeholder="Notes on fit, material, acquisition, or usage..."
              className="w-full px-3 py-2 bg-[#101216] border border-[#23262f] rounded-lg text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-[#e5b869]"
            />
          </div>

          {/* Real-Life Attribute Buffs */}
          <div className="p-3.5 rounded-lg bg-[#101216] border border-[#20232b]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-neutral-300 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-[#e5b869]" /> Conferred Life Modifiers
              </span>
              <button
                type="button"
                onClick={handleAddBuff}
                className="text-xs text-[#e5b869] hover:underline"
              >
                + Add Modifier
              </button>
            </div>

            <div className="space-y-2">
              {buffs.map((buff, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <select
                    value={buff.stat}
                    onChange={(e) => handleUpdateBuff(idx, 'stat', e.target.value)}
                    className="px-2.5 py-1 bg-[#181a20] border border-[#272a34] rounded text-xs text-neutral-200"
                  >
                    <option value="STR">STR (Physical)</option>
                    <option value="INT">INT (Intellect/Craft)</option>
                    <option value="WIS">WIS (Spiritual/Soul)</option>
                    <option value="CHA">CHA (Social)</option>
                    <option value="FOCUS">FOCUS</option>
                    <option value="STYLE">STYLE</option>
                    <option value="COMFORT">COMFORT</option>
                    <option value="WARMTH">WARMTH</option>
                  </select>

                  <input
                    type="number"
                    value={buff.value}
                    onChange={(e) => handleUpdateBuff(idx, 'value', parseInt(e.target.value) || 1)}
                    className="w-16 px-2 py-1 bg-[#181a20] border border-[#272a34] rounded text-xs text-neutral-200 text-center"
                  />

                  <input
                    type="text"
                    value={buff.label}
                    onChange={(e) => handleUpdateBuff(idx, 'label', e.target.value)}
                    placeholder="Modifier label"
                    className="flex-1 px-2.5 py-1 bg-[#181a20] border border-[#272a34] rounded text-xs text-neutral-200"
                  />

                  {buffs.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveBuff(idx)}
                      className="text-neutral-500 hover:text-rose-400 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Locked Loot / Wishlist Checkbox */}
          <div className="p-3.5 rounded-lg bg-[#101216] border border-[#20232b]">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-neutral-200">
              <input
                type="checkbox"
                checked={isLocked}
                onChange={(e) => setIsLocked(e.target.checked)}
                className="rounded border-[#272a34] bg-[#181a20] text-[#e5b869] focus:ring-0"
              />
              <Lock className="w-3.5 h-3.5 text-amber-400" /> Save as Wishlist Item (Locked Loot)
            </label>

            {isLocked && (
              <div className="mt-3">
                <label className="block text-xs font-medium text-neutral-400 mb-1">
                  Goal Required to Unlock
                </label>
                <input
                  type="text"
                  value={lockRequirement}
                  onChange={(e) => setLockRequirement(e.target.value)}
                  placeholder="e.g. 30-day Salah streak, Ship client MVP, Hit Level 10..."
                  className="w-full px-3 py-2 bg-[#181a20] border border-amber-800/40 rounded-lg text-xs text-amber-200 placeholder-neutral-500"
                />
              </div>
            )}
          </div>

          {/* Submit buttons */}
          <div className="pt-3 border-t border-[#23262f] flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                sfx.playClick();
                onClose();
              }}
              className="px-4 py-2 rounded-lg bg-[#181a20] hover:bg-[#20232b] text-xs font-medium text-neutral-300 border border-[#272a34] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#e5b869] hover:bg-[#d8a857] text-[#0f1115] font-semibold text-xs rounded-lg transition-colors shadow-sm"
            >
              {isLocked ? 'Add to Wishlist' : 'Add to Inventory'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
