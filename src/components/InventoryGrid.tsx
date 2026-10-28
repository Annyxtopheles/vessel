import React, { useState } from 'react';
import type { InventoryItem, ItemRarity, OwnershipStatus } from '../types';
import { Search, Plus, Lock, Check, Package, History } from 'lucide-react';
import { sfx } from '../utils/audio';

interface InventoryGridProps {
  items: InventoryItem[];
  onInspectItem: (item: InventoryItem) => void;
  onToggleEquip: (item: InventoryItem) => void;
  onOpenAddItem: () => void;
}

const RARITY_BADGES: Record<ItemRarity, { label: string; badge: string }> = {
  common: { label: 'Common', badge: 'bg-[#141720] text-slate-400 border-[#202636]' },
  rare: { label: 'Rare', badge: 'bg-[#0f1d2d] text-[#60a5fa] border-[#1e3a5f]' },
  epic: { label: 'Epic', badge: 'bg-[#1e1329] text-[#c084fc] border-[#3b1d54]' },
  masterwork: { label: 'Masterwork', badge: 'bg-[#0c1f2e] text-[#38bdf8] border-[#075985]/50' },
  legendary: { label: 'Legendary', badge: 'bg-[#271318] text-[#fb7185] border-[#4c1d28]' },
};

export const InventoryGrid: React.FC<InventoryGridProps> = ({
  items,
  onInspectItem,
  onToggleEquip,
  onOpenAddItem,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<OwnershipStatus | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSeason, setSelectedSeason] = useState<string>('all');
  const [selectedCondition, setSelectedCondition] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Counts by ownership status
  const ownedCount = items.filter(i => (i.ownershipStatus || 'owned') === 'owned').length;
  const wishCount = items.filter(i => i.ownershipStatus === 'wishlist' || i.isLocked).length;
  const pastCount = items.filter(i => i.ownershipStatus === 'past').length;

  // Filter pipeline
  const filteredItems = items.filter(item => {
    const itemStatus = item.ownershipStatus || (item.isLocked ? 'wishlist' : 'owned');

    // Status filter
    if (selectedStatus !== 'all' && itemStatus !== selectedStatus) {
      return false;
    }

    // Category filter
    if (selectedCategory !== 'all' && item.category !== selectedCategory) {
      return false;
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
    { id: 'all', label: 'All Categories' },
    { id: 'apparel', label: 'Clothing & Wardrobe' },
    { id: 'tech', label: 'Tech & Hardware' },
    { id: 'tomes', label: 'Books & Tomes' },
    { id: 'edc', label: 'Everyday Carry' },
  ];

  return (
    <div className="space-y-4">
      
      {/* 1. Primary Ownership Lifecycle Tabs (Linear Style) */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-1.5 bg-[#12141a] border border-[#20232c] rounded-lg">
        <div className="flex flex-wrap items-center gap-1">
          <button
            onClick={() => {
              sfx.playClick();
              setSelectedStatus('all');
            }}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              selectedStatus === 'all'
                ? 'bg-[#1c1e27] text-white shadow-xs font-semibold'
                : 'text-[#8a8f98] hover:text-white'
            }`}
          >
            All Possessions <span className="text-[10px] ml-1 text-[#64748b]">({items.length})</span>
          </button>

          <button
            onClick={() => {
              sfx.playClick();
              setSelectedStatus('owned');
            }}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
              selectedStatus === 'owned'
                ? 'bg-[#181d29] text-white shadow-xs font-semibold'
                : 'text-[#94a3b8] hover:text-white'
            }`}
          >
            <span>Currently Owned</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#16221a] text-[#34d399] border border-[#27382c]">
              {ownedCount}
            </span>
          </button>

          <button
            onClick={() => {
              sfx.playClick();
              setSelectedStatus('wishlist');
            }}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
              selectedStatus === 'wishlist'
                ? 'bg-[#181d29] text-white shadow-xs font-semibold'
                : 'text-[#94a3b8] hover:text-white'
            }`}
          >
            <Lock className="w-3 h-3 text-[#38bdf8]" />
            <span>Wish to Own</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#0c1f2e] text-[#38bdf8] border border-[#075985]/40">
              {wishCount}
            </span>
          </button>

          <button
            onClick={() => {
              sfx.playClick();
              setSelectedStatus('past');
            }}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
              selectedStatus === 'past'
                ? 'bg-[#181d29] text-white shadow-xs font-semibold'
                : 'text-[#94a3b8] hover:text-white'
            }`}
          >
            <History className="w-3 h-3 text-[#60a5fa]" />
            <span>Parted With</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#151e29] text-[#60a5fa] border border-[#243345]">
              {pastCount}
            </span>
          </button>
        </div>

        <button
          onClick={() => {
            sfx.playClick();
            onOpenAddItem();
          }}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0284c7] hover:bg-[#0369a1] text-white font-semibold text-xs rounded-md transition-colors shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" /> Add Possession
        </button>
      </div>

      {/* 2. Search & Secondary Filters Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#6b7280]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search items by name, color, notes..."
            className="w-full pl-8 pr-4 py-1.5 bg-[#0e1014] border border-[#20232c] rounded-md text-xs text-white placeholder-[#525866] focus:outline-none focus:border-[#0ea5e9] transition-colors"
          />
        </div>

        {/* Category & Tag Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => {
              sfx.playClick();
              setSelectedCategory(e.target.value);
            }}
            className="px-2.5 py-1.5 bg-[#12141a] border border-[#20232c] rounded-md text-xs text-[#8a8f98] focus:outline-none focus:border-[#0ea5e9]"
          >
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>

          {/* Season Filter */}
          <select
            value={selectedSeason}
            onChange={(e) => {
              sfx.playClick();
              setSelectedSeason(e.target.value);
            }}
            className="px-2.5 py-1.5 bg-[#12141a] border border-[#20232c] rounded-md text-xs text-[#8a8f98] focus:outline-none focus:border-[#0ea5e9]"
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
            className="px-2.5 py-1.5 bg-[#12141a] border border-[#20232c] rounded-md text-xs text-[#8a8f98] focus:outline-none focus:border-[#0ea5e9]"
          >
            <option value="all">Condition: All</option>
            <option value="pristine">Pristine</option>
            <option value="seasoned">Seasoned</option>
            <option value="worn">Worn</option>
            <option value="needs_repair">Needs Repair</option>
          </select>
        </div>
      </div>

      {/* 3. Items Grid (Linear Editorial Catalog) */}
      {filteredItems.length === 0 ? (
        <div className="ui-card p-12 text-center border-dashed">
          <p className="text-sm font-medium text-neutral-400">No possessions found in this view.</p>
          <p className="text-xs text-neutral-500 mt-1">Try switching lifecycle tabs or clearing search filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3.5">
          {filteredItems.map(item => {
            const rarityInfo = RARITY_BADGES[item.rarity] || RARITY_BADGES.common;
            const status = item.ownershipStatus || (item.isLocked ? 'wishlist' : 'owned');

            return (
              <div
                key={item.id}
                onClick={() => {
                  sfx.playClick();
                  onInspectItem(item);
                }}
                className={`ui-card ui-card-hover overflow-hidden flex flex-col justify-between cursor-pointer group rounded-lg ${
                  item.isEquipped && status === 'owned' ? 'border-[#443722] bg-[#15171e]' : ''
                } ${status === 'past' ? 'opacity-80' : ''}`}
              >
                <div>
                  {/* Clean Visual Image Frame */}
                  <div className="w-full h-40 bg-[#0e1014] relative overflow-hidden border-b border-[#1c1e26] flex items-center justify-center">
                    {/* Fallback placeholder */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-neutral-600 bg-[#101217] p-2 text-center">
                      <Package className="w-6 h-6 text-neutral-600 mb-1" />
                      <span className="text-[10px] text-neutral-500 uppercase tracking-wider truncate max-w-[80%] font-medium">
                        {item.subCategory}
                      </span>
                    </div>

                    {item.imageUrl && (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-200 relative z-10"
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    )}

                    {/* Floating Badges over image */}
                    <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none z-20">
                      <span className={`text-[10px] px-2 py-0.5 rounded border shadow-xs font-medium ${rarityInfo.badge}`}>
                        {rarityInfo.label}
                      </span>

                      {status === 'wishlist' ? (
                        <span className="linear-tag text-[#38bdf8] border-[#075985]/60 bg-[#0c1f2e]/95 backdrop-blur-xs flex items-center gap-1 font-medium">
                          <Lock className="w-2.5 h-2.5" /> Wishlist
                        </span>
                      ) : status === 'past' ? (
                        <span className="linear-tag text-[#60a5fa] border-[#1e3a5f] bg-[#0f1d2d]/95 backdrop-blur-xs capitalize flex items-center gap-1 font-medium">
                          <History className="w-2.5 h-2.5" /> {item.pastReason || 'Past'}
                        </span>
                      ) : item.isEquipped ? (
                        <span className="linear-tag text-[#34d399] border-[#065f46]/60 bg-[#064e3b]/95 backdrop-blur-xs flex items-center gap-1 font-medium">
                          <Check className="w-2.5 h-2.5" /> Equipped
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {/* Card Content (Clean & Editorial) */}
                  <div className="p-3">
                    {/* Title */}
                    <h3 className="font-semibold text-sm text-white group-hover:text-[#38bdf8] transition-colors truncate mb-1">
                      {item.name}
                    </h3>

                    {/* Clean Meta Line */}
                    <div className="flex items-center gap-1.5 text-xs text-[#94a3b8] mb-2.5">
                      <span>{item.subCategory}</span>
                      <span>•</span>
                      <span>{item.weightKg} kg</span>
                      <span>•</span>
                      <span className="text-[#f1f5f9] font-medium">${item.goldValue}</span>
                    </div>

                    {/* Compact Stat Buff Chips */}
                    {item.buffs.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {item.buffs.slice(0, 2).map((b, i) => (
                          <span
                            key={i}
                            className="linear-tag text-[10px] text-[#94a3b8]"
                          >
                            +{b.value} {b.stat}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Card Actions */}
                <div className="px-3 pb-3 pt-1 border-t border-[#1a1f2b] flex items-center justify-between text-xs text-[#94a3b8]">
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <span
                      className="w-2 h-2 rounded-full border border-black/50"
                      style={{ backgroundColor: item.colorHex }}
                    />
                    <span className="truncate max-w-[80px]">{item.colorName}</span>
                  </div>

                  {status === 'owned' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        sfx.playEquip();
                        onToggleEquip(item);
                      }}
                      className={`text-[11px] px-2.5 py-0.5 rounded transition-colors font-medium ${
                        item.isEquipped
                          ? 'text-[#38bdf8] hover:text-white bg-[#0c1f2e] border border-[#075985]/60'
                          : 'text-[#94a3b8] hover:text-white hover:bg-[#151922]'
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
