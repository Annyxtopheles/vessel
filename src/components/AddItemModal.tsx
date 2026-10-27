import React, { useState } from 'react';
import type { InventoryItem, ItemCategory, EquipSlot, ItemRarity, ItemCondition, ItemSeason, ItemBuff } from '../types';
import { X, Sparkles, Trash2, Lock } from 'lucide-react';
import { sfx } from '../utils/audio';

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddItem: (item: InventoryItem) => void;
}

const COLOR_PRESETS = [
  { name: 'Obsidian Black', hex: '#18181B' },
  { name: 'Charcoal Slate', hex: '#27272A' },
  { name: 'Bone White', hex: '#F4EFE6' },
  { name: 'Deep Indigo', hex: '#0F172A' },
  { name: 'Dark Auburn', hex: '#451A03' },
  { name: 'Olive Drab', hex: '#3F4E28' },
  { name: 'Aged Bronze', hex: '#854D0E' },
  { name: 'Emerald Gilt', hex: '#064E3B' },
];

export const AddItemModal: React.FC<AddItemModalProps> = ({ isOpen, onClose, onAddItem }) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ItemCategory>('apparel');
  const [subCategory, setSubCategory] = useState('Outerwear');
  const [equipSlot, setEquipSlot] = useState<EquipSlot | ''>('outerwear');
  const [rarity, setRarity] = useState<ItemRarity>('rare');
  const [colorName, setColorName] = useState('Obsidian Black');
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
      lockRequirement: isLocked ? lockRequirement.trim() || 'Discipline milestone' : undefined,
      lore: lore.trim() || 'A personal possession registered into the Vessel ledger.',
      buffs,
      isEquipped: false,
      dateAcquired: new Date().toISOString().split('T')[0],
    };

    sfx.playEquip();
    onAddItem(newItem);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div 
        className="arcane-card w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-xl border border-[#C5A059]/40 bg-gradient-to-b from-[#13161F] via-[#0D0E14] to-[#08090C] p-6 shadow-2xl relative animate-in fade-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#232734] mb-4">
          <div>
            <h2 className="font-cinzel text-lg font-bold text-[#E5C378] tracking-wider">
              INSCRIBE POSSESSION INTO VESSEL
            </h2>
            <p className="text-xs text-[#8C8578]">Register a real-life garment, piece of hardware, grimoire, or wishlisted loot</p>
          </div>
          <button
            onClick={() => {
              sfx.playClick();
              onClose();
            }}
            className="text-[#8C8578] hover:text-[#F3ECE0] p-1 rounded hover:bg-[#1A1C24] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Item Name */}
          <div>
            <label className="block text-xs font-cinzel text-[#C5A059] mb-1">ARTIFACT TITLE</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Japanese Indigo Chore Coat, Mechanical HHKB, Surah Memorization Journal..."
              className="w-full px-3 py-2 bg-[#0E1015] border border-[#2B2F3D] rounded-lg text-sm text-[#EBE4D5] placeholder-[#5A564C] focus:outline-none focus:border-[#C5A059]/70"
            />
          </div>

          {/* Category & Equip Slot */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono text-[#A8A194] mb-1">CATEGORY</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ItemCategory)}
                className="w-full px-3 py-2 bg-[#0E1015] border border-[#2B2F3D] rounded-lg text-xs font-mono text-[#D6CFBE] focus:outline-none focus:border-[#C5A059]/70"
              >
                <option value="apparel">Apparel & Wardrobe</option>
                <option value="tech">Tech & Hardware Relic</option>
                <option value="tomes">Tome / Grimoire / Book</option>
                <option value="edc">Everyday Carry (EDC)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono text-[#A8A194] mb-1">PAPERDOLL EQUIP SLOT</label>
              <select
                value={equipSlot}
                onChange={(e) => setEquipSlot(e.target.value as EquipSlot | '')}
                className="w-full px-3 py-2 bg-[#0E1015] border border-[#2B2F3D] rounded-lg text-xs font-mono text-[#D6CFBE] focus:outline-none focus:border-[#C5A059]/70"
              >
                <option value="">None (Bag Inventory Only)</option>
                <option value="head">Headwear</option>
                <option value="outerwear">Outerwear</option>
                <option value="innerwear">Base Layer / Tops</option>
                <option value="legs">Trousers / Bottoms</option>
                <option value="footwear">Footwear</option>
                <option value="tech_relic">Tech Relic</option>
                <option value="tome">Tome / Grimoire</option>
                <option value="wrist_edc">Wrist / EDC</option>
              </select>
            </div>
          </div>

          {/* Subcategory & Rarity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono text-[#A8A194] mb-1">SUBCATEGORY TAG</label>
              <input
                type="text"
                value={subCategory}
                onChange={(e) => setSubCategory(e.target.value)}
                placeholder="e.g. Overshirt, Audio, Timepiece"
                className="w-full px-3 py-2 bg-[#0E1015] border border-[#2B2F3D] rounded-lg text-xs font-mono text-[#D6CFBE] focus:outline-none focus:border-[#C5A059]/70"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-[#A8A194] mb-1">RARITY TIER</label>
              <select
                value={rarity}
                onChange={(e) => setRarity(e.target.value as ItemRarity)}
                className="w-full px-3 py-2 bg-[#0E1015] border border-[#2B2F3D] rounded-lg text-xs font-mono text-[#D6CFBE] focus:outline-none focus:border-[#C5A059]/70"
              >
                <option value="common">Common</option>
                <option value="rare">Rare (High Quality)</option>
                <option value="epic">Epic (Heritage Grade)</option>
                <option value="masterwork">Masterwork (Artisanal)</option>
                <option value="legendary">Legendary (Pinnacle Benchmark)</option>
              </select>
            </div>
          </div>

          {/* Condition, Season, Weight & Gold Value */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-mono text-[#A8A194] mb-1">CONDITION</label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value as ItemCondition)}
                className="w-full px-2.5 py-2 bg-[#0E1015] border border-[#2B2F3D] rounded-lg text-xs font-mono text-[#D6CFBE]"
              >
                <option value="pristine">Pristine</option>
                <option value="seasoned">Seasoned</option>
                <option value="worn">Worn</option>
                <option value="needs_repair">Needs Repair</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono text-[#A8A194] mb-1">SEASON</label>
              <select
                value={season}
                onChange={(e) => setSeason(e.target.value as ItemSeason)}
                className="w-full px-2.5 py-2 bg-[#0E1015] border border-[#2B2F3D] rounded-lg text-xs font-mono text-[#D6CFBE]"
              >
                <option value="all">All Season</option>
                <option value="summer">Summer</option>
                <option value="winter">Winter</option>
                <option value="transitional">Transitional</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono text-[#A8A194] mb-1">WEIGHT (KG)</label>
              <input
                type="number"
                step="0.05"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                className="w-full px-2.5 py-2 bg-[#0E1015] border border-[#2B2F3D] rounded-lg text-xs font-mono text-[#D6CFBE]"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-[#A8A194] mb-1">VAL ($ / GOLD)</label>
              <input
                type="number"
                value={goldValue}
                onChange={(e) => setGoldValue(e.target.value)}
                className="w-full px-2.5 py-2 bg-[#0E1015] border border-[#2B2F3D] rounded-lg text-xs font-mono text-[#D6CFBE]"
              />
            </div>
          </div>

          {/* Color Presets */}
          <div>
            <label className="block text-xs font-mono text-[#A8A194] mb-1.5">COLOR SPACE</label>
            <div className="flex flex-wrap items-center gap-2">
              {COLOR_PRESETS.map((p) => (
                <button
                  type="button"
                  key={p.name}
                  onClick={() => {
                    setColorName(p.name);
                    setColorHex(p.hex);
                  }}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded border text-xs font-mono transition-all ${
                    colorName === p.name ? 'border-[#C5A059] bg-[#C5A059]/15 text-[#F4EDE2]' : 'border-[#262A36] text-[#7E786E]'
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
            <label className="block text-xs font-cinzel text-[#C5A059] mb-1">LORE TEXT & MEMORY</label>
            <textarea
              rows={2}
              value={lore}
              onChange={(e) => setLore(e.target.value)}
              placeholder="Describe its texture, how you acquired it, or what state of mind it induces..."
              className="w-full px-3 py-2 bg-[#0E1015] border border-[#2B2F3D] rounded-lg text-xs font-serif italic text-[#D6CFBE] placeholder-[#5A564C] focus:outline-none focus:border-[#C5A059]/70"
            />
          </div>

          {/* Real-Life Attribute Buffs */}
          <div className="p-3.5 rounded-lg bg-[#0E1015] border border-[#232734]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-cinzel text-[#E5C378] flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> REAL-LIFE BUFFS & EFFECTS
              </span>
              <button
                type="button"
                onClick={handleAddBuff}
                className="text-xs font-mono text-[#C5A059] hover:underline"
              >
                + Add Buff
              </button>
            </div>

            <div className="space-y-2">
              {buffs.map((buff, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <select
                    value={buff.stat}
                    onChange={(e) => handleUpdateBuff(idx, 'stat', e.target.value)}
                    className="px-2 py-1 bg-[#14161F] border border-[#2B2F3D] rounded text-xs font-mono text-[#C5A059]"
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
                    className="w-16 px-2 py-1 bg-[#14161F] border border-[#2B2F3D] rounded text-xs font-mono text-[#E5C378]"
                  />

                  <input
                    type="text"
                    value={buff.label}
                    onChange={(e) => handleUpdateBuff(idx, 'label', e.target.value)}
                    placeholder="Buff label (e.g. Ergonomic Flow)"
                    className="flex-1 px-2 py-1 bg-[#14161F] border border-[#2B2F3D] rounded text-xs font-mono text-[#D6CFBE]"
                  />

                  {buffs.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveBuff(idx)}
                      className="text-rose-400 p-1 hover:bg-rose-950/40 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Locked Loot / Wishlist Checkbox */}
          <div className="p-3.5 rounded-lg bg-[#0E1015] border border-[#232734]">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-cinzel text-[#E5C378]">
              <input
                type="checkbox"
                checked={isLocked}
                onChange={(e) => setIsLocked(e.target.checked)}
                className="rounded border-[#C5A059] bg-[#14161F] text-[#C5A059] focus:ring-0"
              />
              <Lock className="w-3.5 h-3.5" /> MARK AS LOCKED LOOT / WISHLIST
            </label>

            {isLocked && (
              <div className="mt-3">
                <label className="block text-xs font-mono text-[#A8A194] mb-1">
                  UNLOCK CRITERIA (Habit / Project Milestone)
                </label>
                <input
                  type="text"
                  value={lockRequirement}
                  onChange={(e) => setLockRequirement(e.target.value)}
                  placeholder="e.g. Maintain 30-day Salah streak, Ship 3 full-stack clients, Hit Level 12"
                  className="w-full px-3 py-2 bg-[#14161F] border border-amber-600/30 rounded text-xs font-mono text-amber-200 placeholder-[#6D5D48]"
                />
              </div>
            )}
          </div>

          {/* Submit buttons */}
          <div className="pt-3 border-t border-[#232734] flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                sfx.playClick();
                onClose();
              }}
              className="px-4 py-2 rounded bg-[#151720] hover:bg-[#1D212E] text-xs font-cinzel text-[#8C8578] hover:text-[#D6CFBE] border border-[#282C3B] transition-colors"
            >
              CANCEL
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-gradient-to-r from-[#C5A059] to-[#DFBC78] hover:from-[#B89248] hover:to-[#CEAA64] text-[#121318] font-cinzel font-bold text-xs tracking-wider rounded shadow-md transition-all active:scale-95"
            >
              {isLocked ? 'ENSCROLL TO WISHLIST' : 'INSCRIBE TO INVENTORY'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
