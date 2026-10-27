import React, { useState } from 'react';
import type { InventoryItem, ItemRarity } from '../types';
import { Search, Plus, Lock, Check, Scale, Package } from 'lucide-react';
import { sfx } from '../utils/audio';

interface InventoryGridProps {
  items: InventoryItem[];
  onInspectItem: (item: InventoryItem) => void;
  onToggleEquip: (item: InventoryItem) => void;
  onOpenAddItem: () => void;
}

const RARITY_BADGES: Record<ItemRarity, { label: string; badge: string }> = {
  common: { label: 'Common', badge: 'bg-neutral-800 text-neutral-300 border-neutral-700' },
  rare: { label: 'Rare', badge: 'bg-sky-950/80 text-sky-300 border-sky-800/40' },
  epic: { label: 'Epic', badge: 'bg-purple-950/80 text-purple-300 border-purple-800/40' },
  masterwork: { label: 'Masterwork', badge: 'bg-amber-950/80 text-amber-300 border-amber-800/40' },
  legendary: { label: 'Legendary', badge: 'bg-orange-950/80 text-orange-300 border-orange-800/40' },
};

function formatBuffName(stat: string, value: number): string {
  const map: Record<string, string> = {
    STR: 'Strength',
    INT: 'Intellect',
    WIS: 'Wisdom',
    CHA: 'Charisma',
    FOCUS: 'Focus',
    STYLE: 'Style',
    COMFORT: 'Comfort',
    WARMTH: 'Warmth',
  };
  return `+${value} ${map[stat] || stat}`;
}

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
    if (selectedCategory === 'locked') {
      if (!item.isLocked) return false;
    } else if (selectedCategory !== 'all') {
      if (item.category !== selectedCategory || item.isLocked) return false;
    }

    if (selectedSeason !== 'all' && item.season !== 'all' && item.season !== selectedSeason) {
      return false;
    }

    if (selectedCondition !== 'all' && item.condition !== selectedCondition) {
      return false;
    }

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
    { id: 'all', label: 'All Items' },
    { id: 'apparel', label: 'Clothing & Wardrobe' },
    { id: 'tech', label: 'Tech & Hardware' },
    { id: 'tomes', label: 'Books & Tomes' },
    { id: 'edc', label: 'Everyday Carry' },
    { id: 'locked', label: 'Wishlist (Locked Loot)' },
  ];

  return (
    <div className="space-y-4">
      
      {/* Search & Actions Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search items by name, color, notes, or modifier..."
            className="w-full pl-9 pr-4 py-2 bg-[#14161a] border border-[#23262e] rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#e5b869] transition-colors"
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
            className="px-3 py-2 bg-[#14161a] border border-[#23262e] rounded-lg text-xs text-neutral-300 focus:outline-none focus:border-[#e5b869]"
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
            className="px-3 py-2 bg-[#14161a] border border-[#23262e] rounded-lg text-xs text-neutral-300 focus:outline-none focus:border-[#e5b869]"
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
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#e5b869] hover:bg-[#d8a857] text-[#0f1115] font-semibold text-xs rounded-lg transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> Add Item
          </button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-[#1f2229] pt-1">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => {
              sfx.playClick();
              setSelectedCategory(cat.id);
            }}
            className={`px-3 py-1.5 rounded-t-md text-xs font-medium whitespace-nowrap transition-colors border-b-2 -mb-[1px] ${
              selectedCategory === cat.id
                ? 'border-[#e5b869] text-white font-semibold'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Item Cards Grid with Visual Image Thumbnails */}
      {filteredItems.length === 0 ? (
        <div className="ui-card p-12 text-center border-dashed">
          <p className="text-sm font-medium text-neutral-400">No items match your active filters.</p>
          <p className="text-xs text-neutral-500 mt-1">Try resetting search or adding a new possession.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
          {filteredItems.map(item => {
            const rarityInfo = RARITY_BADGES[item.rarity] || RARITY_BADGES.common;

            return (
              <div
                key={item.id}
                onClick={() => {
                  sfx.playClick();
                  onInspectItem(item);
                }}
                className={`ui-card ui-card-hover overflow-hidden flex flex-col justify-between cursor-pointer relative group ${
                  item.isEquipped ? 'ring-1 ring-[#e5b869]/50 bg-[#161920]' : ''
                }`}
              >
                <div>
                  {/* Visual Item Image Preview */}
                  <div className="w-full h-36 bg-[#0f1115] relative overflow-hidden border-b border-[#23262e] flex items-center justify-center">
                    {/* Fallback placeholder */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-neutral-600 bg-[#121418] p-2 text-center">
                      <Package className="w-7 h-7 text-neutral-600 mb-1" />
                      <span className="text-[10px] text-neutral-500 uppercase tracking-wider truncate max-w-[80%]">{item.subCategory}</span>
                    </div>

                    {item.imageUrl && (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 relative z-10"
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    )}

                    {/* Floating Badges over image */}
                    <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none z-20">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border shadow-sm ${rarityInfo.badge}`}>
                        {rarityInfo.label}
                      </span>

                      {item.isLocked ? (
                        <span className="flex items-center gap-1 text-[10px] font-medium text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded-full border border-amber-800/40 backdrop-blur-sm">
                          <Lock className="w-2.5 h-2.5" /> Wishlist
                        </span>
                      ) : item.isEquipped ? (
                        <span className="flex items-center gap-1 text-[10px] font-medium text-[#e5b869] bg-[#0f1115]/80 px-2 py-0.5 rounded-full border border-[#e5b869]/40 backdrop-blur-sm">
                          <Check className="w-2.5 h-2.5" /> Equipped
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-3.5">
                    {/* Title & Category Info */}
                    <h3 className="font-semibold text-sm text-white group-hover:text-[#e5b869] transition-colors line-clamp-1 mb-1">
                      {item.name}
                    </h3>

                    <div className="flex items-center gap-2 text-xs text-neutral-400 mb-2">
                      <span>{item.subCategory}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <span
                          className="w-2 h-2 rounded-full border border-black/50"
                          style={{ backgroundColor: item.colorHex }}
                        />
                        {item.colorName}
                      </span>
                    </div>

                    {/* Lore / Description */}
                    <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed mb-3">
                      {item.lore}
                    </p>

                    {/* Wishlist Goal if locked */}
                    {item.isLocked && item.lockRequirement && (
                      <div className="mb-3 p-2 rounded-md bg-amber-950/20 border border-amber-800/30 text-[11px] text-amber-200">
                        <span className="font-semibold block text-[10px] text-amber-400">Unlock Goal:</span>
                        {item.lockRequirement}
                      </div>
                    )}

                    {/* Buffs with full readable names */}
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {item.buffs.slice(0, 2).map((b, i) => (
                        <span
                          key={i}
                          className="text-[10px] font-medium px-2 py-0.5 rounded bg-[#1c1f26] text-neutral-300 border border-[#2b2e38]"
                        >
                          {formatBuffName(b.stat, b.value)}
                        </span>
                      ))}
                      {item.buffs.length > 2 && (
                        <span className="text-[10px] text-neutral-500 self-center">
                          +{item.buffs.length - 2} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer Metrics & Actions */}
                <div className="p-3.5 pt-2.5 border-t border-[#23262f] flex items-center justify-between text-xs text-neutral-400">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Scale className="w-3.5 h-3.5 text-neutral-500" />
                      {item.weightKg} kg
                    </span>
                    <span className="font-medium text-neutral-300">
                      ${item.goldValue.toLocaleString()}
                    </span>
                  </div>

                  {!item.isLocked && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        sfx.playEquip();
                        onToggleEquip(item);
                      }}
                      className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                        item.isEquipped
                          ? 'bg-[#1e222a] hover:bg-rose-950/40 text-neutral-300 hover:text-rose-300 border border-[#2b2e38]'
                          : 'bg-[#22252e] hover:bg-[#2b2e38] text-white border border-[#343844]'
                      }`}
                    >
                      {item.isEquipped ? 'Unequip' : 'Equip'}
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
