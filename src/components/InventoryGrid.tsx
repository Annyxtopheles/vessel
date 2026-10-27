import React, { useState } from 'react';
import type { InventoryItem, ItemRarity } from '../types';
import { Search, Plus, Lock, CheckCircle, Feather, Scale } from 'lucide-react';
import { sfx } from '../utils/audio';

interface InventoryGridProps {
  items: InventoryItem[];
  onInspectItem: (item: InventoryItem) => void;
  onToggleEquip: (item: InventoryItem) => void;
  onOpenAddItem: () => void;
}

const RARITY_COLORS: Record<ItemRarity, { border: string; badge: string; text: string }> = {
  common: { border: 'border-[#333846]', badge: 'bg-[#1E222D] text-[#9EA4B5]', text: 'text-[#9EA4B5]' },
  rare: { border: 'border-sky-700/50', badge: 'bg-sky-950/60 text-sky-300 border border-sky-600/40', text: 'text-sky-300' },
  epic: { border: 'border-purple-600/50', badge: 'bg-purple-950/60 text-purple-300 border border-purple-600/40', text: 'text-purple-300' },
  masterwork: { border: 'border-[#C5A059]/50', badge: 'bg-[#C5A059]/15 text-[#E5C378] border border-[#C5A059]/40', text: 'text-[#E5C378]' },
  legendary: { border: 'border-amber-500/60', badge: 'bg-amber-950/60 text-amber-300 border border-amber-500/50 shadow-sm shadow-amber-950', text: 'text-amber-300' },
};

export const InventoryGrid: React.FC<InventoryGridProps> = ({
  items,
  onInspectItem,
  onToggleEquip,
  onOpenAddItem,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSeason, setSelectedSeason] = useState<string>('all');
  const [selectedCondition, setSelectedCondition] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Filter pipeline
  const filteredItems = items.filter(item => {
    // Category or Locked filter
    if (selectedCategory === 'locked') {
      if (!item.isLocked) return false;
    } else if (selectedCategory !== 'all') {
      if (item.category !== selectedCategory || item.isLocked) return false;
    }

    // Season filter
    if (selectedSeason !== 'all' && item.season !== 'all' && item.season !== selectedSeason) {
      return false;
    }

    // Condition filter
    if (selectedCondition !== 'all' && item.condition !== selectedCondition) {
      return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = item.name.toLowerCase().includes(q);
      const matchLore = item.lore.toLowerCase().includes(q);
      const matchColor = item.colorName.toLowerCase().includes(q);
      const matchSub = item.subCategory.toLowerCase().includes(q);
      const matchBuffs = item.buffs.some(b => b.stat.toLowerCase().includes(q) || b.label.toLowerCase().includes(q));
      if (!matchName && !matchLore && !matchColor && !matchSub && !matchBuffs) {
        return false;
      }
    }

    return true;
  });

  const categories = [
    { id: 'all', label: 'All Artifacts' },
    { id: 'apparel', label: 'Wardrobe & Apparel' },
    { id: 'tech', label: 'Tech & Relics' },
    { id: 'tomes', label: 'Tomes & Grimoires' },
    { id: 'edc', label: 'Everyday Carry' },
    { id: 'locked', label: 'Locked Loot (Wishlist)' },
  ];

  return (
    <div className="space-y-4">
      {/* Search & Actions Toolbar */}
      <div className="arcane-card rounded-xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#7F796E]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search relics by title, color, lore, or attribute buff..."
            className="w-full pl-9 pr-4 py-2 bg-[#0E1015] border border-[#2B2F3D] rounded-lg text-xs font-mono text-[#EBE4D5] placeholder-[#666258] focus:outline-none focus:border-[#C5A059]/60 transition-colors"
          />
        </div>

        {/* Filters and Add Item Button */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Season Filter */}
          <select
            value={selectedSeason}
            onChange={(e) => {
              sfx.playClick();
              setSelectedSeason(e.target.value);
            }}
            className="px-2.5 py-2 bg-[#0E1015] border border-[#2B2F3D] rounded-lg text-xs font-mono text-[#A89F91] focus:outline-none focus:border-[#C5A059]/60"
          >
            <option value="all">Season: All</option>
            <option value="summer">Summer</option>
            <option value="winter">Winter</option>
            <option value="transitional">Transitional</option>
          </select>

          {/* Condition Filter */}
          <select
            value={selectedCondition}
            onChange={(e) => {
              sfx.playClick();
              setSelectedCondition(e.target.value);
            }}
            className="px-2.5 py-2 bg-[#0E1015] border border-[#2B2F3D] rounded-lg text-xs font-mono text-[#A89F91] focus:outline-none focus:border-[#C5A059]/60"
          >
            <option value="all">Condition: All</option>
            <option value="pristine">Pristine</option>
            <option value="seasoned">Seasoned</option>
            <option value="worn">Worn</option>
            <option value="needs_repair">Needs Repair</option>
          </select>

          {/* Add Item Button */}
          <button
            onClick={() => {
              sfx.playClick();
              onOpenAddItem();
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-[#C5A059] to-[#DFBC78] hover:from-[#B89248] hover:to-[#CEAA64] text-[#121318] font-cinzel font-bold text-xs tracking-wider rounded-lg shadow-md transition-all active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" /> INSCRIBE NEW ITEM
          </button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => {
              sfx.playClick();
              setSelectedCategory(cat.id);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-cinzel whitespace-nowrap transition-all border ${
              selectedCategory === cat.id
                ? 'bg-[#181B24] border-[#C5A059]/50 text-[#F1E9DB] shadow-sm'
                : 'bg-[#0E1015]/60 border-transparent text-[#7F796F] hover:text-[#B5AC9E] hover:bg-[#13151D]'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Grid of Inventory Items */}
      {filteredItems.length === 0 ? (
        <div className="arcane-card rounded-xl p-12 text-center border-dashed border-[#2B2F3D]">
          <Feather className="w-10 h-10 mx-auto text-[#635D52] mb-3 stroke-[1.2]" />
          <h3 className="font-cinzel text-sm font-bold text-[#A69E90]">No Relics Discovered in Vault</h3>
          <p className="text-xs text-[#736C61] mt-1 font-serif">Adjust filters or inscribe a new possession to populate your inventory.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredItems.map(item => {
            const rarityStyle = RARITY_COLORS[item.rarity] || RARITY_COLORS.common;

            return (
              <div
                key={item.id}
                className={`arcane-card arcane-card-hover rounded-xl p-4 flex flex-col justify-between relative group cursor-pointer transition-all border ${
                  item.isEquipped ? 'border-[#C5A059]/60 ring-1 ring-[#C5A059]/20' : rarityStyle.border
                }`}
                onClick={() => {
                  sfx.playClick();
                  onInspectItem(item);
                }}
              >
                {/* Top Badges */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded uppercase tracking-wider ${rarityStyle.badge}`}>
                    {item.rarity}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {item.isLocked ? (
                      <span className="flex items-center gap-1 text-[10px] font-mono text-amber-400 bg-amber-950/50 px-1.5 py-0.5 rounded border border-amber-500/30">
                        <Lock className="w-3 h-3" /> LOCKED
                      </span>
                    ) : item.isEquipped ? (
                      <span className="flex items-center gap-1 text-[10px] font-mono text-[#E5C378] bg-[#C5A059]/15 px-1.5 py-0.5 rounded border border-[#C5A059]/30">
                        <CheckCircle className="w-3 h-3" /> EQUIPPED
                      </span>
                    ) : null}
                  </div>
                </div>

                {/* Title & Subcategory */}
                <div className="mb-3">
                  <h3 className="font-serif font-bold text-sm text-[#F4EDE2] group-hover:text-[#E5C378] transition-colors line-clamp-1">
                    {item.name}
                  </h3>
                  <div className="flex items-center gap-2 text-[11px] text-[#867F73] mt-0.5">
                    <span>{item.subCategory}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <span
                        className="w-2 h-2 rounded-full inline-block border border-black/40"
                        style={{ backgroundColor: item.colorHex }}
                      />
                      {item.colorName}
                    </span>
                  </div>
                </div>

                {/* Lore Excerpt */}
                <p className="text-[11px] font-serif italic text-[#80796E] line-clamp-2 mb-3 leading-relaxed">
                  "{item.lore}"
                </p>

                {/* Locked Objective Preview if locked */}
                {item.isLocked && item.lockRequirement && (
                  <div className="mb-3 p-2 rounded bg-amber-950/20 border border-amber-600/20 text-[10px] font-mono text-amber-300">
                    <span className="text-[#C5A059] font-bold block mb-0.5">UNLOCK CRITERIA:</span>
                    {item.lockRequirement}
                  </div>
                )}

                {/* Buffs preview */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {item.buffs.slice(0, 2).map((b, i) => (
                    <span
                      key={i}
                      className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#171A22] text-[#C5A059] border border-[#C5A059]/20"
                    >
                      +{b.value} {b.stat}
                    </span>
                  ))}
                  {item.buffs.length > 2 && (
                    <span className="text-[10px] font-mono text-[#6A6458] self-center">
                      +{item.buffs.length - 2} more
                    </span>
                  )}
                </div>

                {/* Footer Metrics & Actions */}
                <div className="pt-2.5 border-t border-[#1F222C] flex items-center justify-between text-[11px] font-mono text-[#918A7D]">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Scale className="w-3 h-3 text-[#6B655A]" />
                      {item.weightKg}kg
                    </span>
                    <span className="flex items-center gap-1 text-[#C5A059]">
                      ⚜ ${item.goldValue}
                    </span>
                  </div>

                  {!item.isLocked && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        sfx.playEquip();
                        onToggleEquip(item);
                      }}
                      className={`px-2 py-0.5 rounded text-[10px] font-cinzel transition-all ${
                        item.isEquipped
                          ? 'bg-[#1C1F28] hover:bg-rose-950/60 text-[#A69E90] hover:text-rose-300 border border-[#2E3240]'
                          : 'bg-[#C5A059]/15 hover:bg-[#C5A059]/30 text-[#E5C378] border border-[#C5A059]/40'
                      }`}
                    >
                      {item.isEquipped ? 'UNEQUIP' : 'EQUIP'}
                    </button>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
