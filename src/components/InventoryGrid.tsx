import React, { useState } from 'react';
import type { InventoryItem, ItemRarity, OwnershipStatus } from '../types';
import { Search, Lock, Check, Package, History } from 'lucide-react';
import { sfx } from '../utils/audio';

interface InventoryGridProps {
  items: InventoryItem[];
  onInspectItem: (item: InventoryItem) => void;
  onToggleEquip: (item: InventoryItem) => void;
  onOpenAddItem: () => void;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
}

const RARITY_DOT_COLORS: Record<ItemRarity, string> = {
  common: '#9A9AA5',
  rare: '#3B82F6',
  epic: '#7C6CF0',
  masterwork: '#0EA5E9',
  legendary: '#F59E0B',
};

const RARITY_LABELS: Record<ItemRarity, string> = {
  common: 'Common',
  rare: 'Rare',
  epic: 'Epic',
  masterwork: 'Masterwork',
  legendary: 'Legendary',
};

export const InventoryGrid: React.FC<InventoryGridProps> = ({
  items,
  onInspectItem,
  onToggleEquip,
  searchQuery: externalSearchQuery,
  onSearchChange: externalOnSearchChange,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<OwnershipStatus | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSeason, setSelectedSeason] = useState<string>('all');
  const [selectedCondition, setSelectedCondition] = useState<string>('all');
  const [internalSearchQuery, setInternalSearchQuery] = useState<string>('');

  const activeSearch = externalSearchQuery !== undefined ? externalSearchQuery : internalSearchQuery;
  const handleSearchChange = (val: string) => {
    if (externalOnSearchChange) {
      externalOnSearchChange(val);
    } else {
      setInternalSearchQuery(val);
    }
  };

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
    if (activeSearch.trim()) {
      const q = activeSearch.toLowerCase();
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
    <div className="space-y-6">
      {/* 1. Filter & Search Controls Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Segmented Control for Lifecycle Status */}
        <div className="inline-flex p-1 bg-[#ECECF0] rounded-xl self-start">
          <button
            onClick={() => {
              sfx.playClick();
              setSelectedStatus('all');
            }}
            className={`px-4 py-1.5 rounded-lg text-[13px] transition-all flex items-center gap-1.5 ${
              selectedStatus === 'all'
                ? 'bg-white text-[#111113] shadow-xs font-semibold'
                : 'text-[#6B6B76] hover:text-[#111113] font-medium'
            }`}
          >
            <span>All</span>
            <span className="text-[12px] text-[#9A9AA5]">{items.length}</span>
          </button>

          <button
            onClick={() => {
              sfx.playClick();
              setSelectedStatus('owned');
            }}
            className={`px-4 py-1.5 rounded-lg text-[13px] transition-all flex items-center gap-1.5 ${
              selectedStatus === 'owned'
                ? 'bg-white text-[#111113] shadow-xs font-semibold'
                : 'text-[#6B6B76] hover:text-[#111113] font-medium'
            }`}
          >
            <span>Currently Owned</span>
            <span className="text-[12px] text-[#9A9AA5]">{ownedCount}</span>
          </button>

          <button
            onClick={() => {
              sfx.playClick();
              setSelectedStatus('wishlist');
            }}
            className={`px-4 py-1.5 rounded-lg text-[13px] transition-all flex items-center gap-1.5 ${
              selectedStatus === 'wishlist'
                ? 'bg-white text-[#111113] shadow-xs font-semibold'
                : 'text-[#6B6B76] hover:text-[#111113] font-medium'
            }`}
          >
            <span>Wish to Own</span>
            <span className="text-[12px] text-[#9A9AA5]">{wishCount}</span>
          </button>

          <button
            onClick={() => {
              sfx.playClick();
              setSelectedStatus('past');
            }}
            className={`px-4 py-1.5 rounded-lg text-[13px] transition-all flex items-center gap-1.5 ${
              selectedStatus === 'past'
                ? 'bg-white text-[#111113] shadow-xs font-semibold'
                : 'text-[#6B6B76] hover:text-[#111113] font-medium'
            }`}
          >
            <span>Parted With</span>
            <span className="text-[12px] text-[#9A9AA5]">{pastCount}</span>
          </button>
        </div>

        {/* Search & Secondary Filter Dropdowns in one clean row */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[220px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9A9AA5] pointer-events-none" />
            <input
              type="text"
              value={activeSearch}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search possessions..."
              className="ship-input pl-9 pr-3 py-1.5 text-[13px] w-full"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => {
              sfx.playClick();
              setSelectedCategory(e.target.value);
            }}
            className="ship-input py-1.5 px-3 text-[13px] cursor-pointer"
          >
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>

          <select
            value={selectedSeason}
            onChange={(e) => {
              sfx.playClick();
              setSelectedSeason(e.target.value);
            }}
            className="ship-input py-1.5 px-3 text-[13px] cursor-pointer"
          >
            <option value="all">Season: All</option>
            <option value="summer">Summer</option>
            <option value="winter">Winter</option>
            <option value="transitional">Transitional</option>
          </select>

          <select
            value={selectedCondition}
            onChange={(e) => {
              sfx.playClick();
              setSelectedCondition(e.target.value);
            }}
            className="ship-input py-1.5 px-3 text-[13px] cursor-pointer"
          >
            <option value="all">Condition: All</option>
            <option value="pristine">Pristine</option>
            <option value="seasoned">Seasoned</option>
            <option value="worn">Worn</option>
            <option value="needs_repair">Needs Repair</option>
          </select>
        </div>
      </div>

      {/* 2. Items Catalog Grid */}
      {filteredItems.length === 0 ? (
        <div className="ship-card p-12 text-center">
          <p className="text-[15px] font-semibold text-[#111113]">No possessions found</p>
          <p className="text-[13px] text-[#6B6B76] mt-1">Try switching tabs or clearing search filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
          {filteredItems.map(item => {
            const status = item.ownershipStatus || (item.isLocked ? 'wishlist' : 'owned');
            const dotColor = RARITY_DOT_COLORS[item.rarity] || '#9A9AA5';
            const rarityLabel = RARITY_LABELS[item.rarity] || 'Common';

            return (
              <div
                key={item.id}
                onClick={() => {
                  sfx.playClick();
                  onInspectItem(item);
                }}
                className="ship-card overflow-hidden group hover:border-[#0891B2]/50 transition-all flex flex-col justify-between cursor-pointer"
              >
                <div>
                  {/* Consistent Image Area (aspect 4/3, #F4F4F6 background, object-cover) */}
                  <div className="w-full aspect-[4/3] bg-[#F4F4F6] relative overflow-hidden flex items-center justify-center">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-102"
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <Package className="w-8 h-8 text-[#9A9AA5]" />
                    )}
                  </div>

                  {/* Card Body */}
                  <div className="p-5">
                    {/* Item Name + Subtle Rarity Dot */}
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: dotColor }}
                        title={`Rarity: ${rarityLabel}`}
                      />
                      <h3 className="text-[15px] font-semibold text-[#111113] group-hover:text-[#0891B2] transition-colors truncate">
                        {item.name}
                      </h3>
                    </div>

                    {/* Category + Price in Secondary Text */}
                    <p className="text-[13px] text-[#6B6B76] mt-1 truncate">
                      {item.subCategory || item.category} • ${item.goldValue.toLocaleString()} • {item.weightKg} kg
                    </p>

                    {/* ONE Status Pill */}
                    <div className="mt-3">
                      {status === 'wishlist' ? (
                        <span className="ship-pill bg-[#E6F7F9] text-[#0891B2] inline-flex items-center gap-1.5 text-[12px] font-medium">
                          <Lock className="w-3 h-3" /> Wish to Own
                        </span>
                      ) : status === 'past' ? (
                        <span className="ship-pill bg-[#ECECF0] text-[#6B6B76] inline-flex items-center gap-1.5 text-[12px] font-medium capitalize">
                          <History className="w-3 h-3" /> {item.pastReason || 'Parted With'}
                        </span>
                      ) : item.isEquipped ? (
                        <span className="ship-pill-success inline-flex items-center gap-1.5 text-[12px]">
                          <Check className="w-3 h-3" /> Equipped
                        </span>
                      ) : (
                        <span className="ship-pill bg-[#F4F4F6] text-[#6B6B76] inline-flex items-center gap-1.5 text-[12px] font-medium">
                          Owned
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bottom Card Footer: Color info + Hover reveal for Buff chips and Equip button */}
                <div className="px-5 pb-4 pt-3 border-t border-[#ECECF0] flex items-center justify-between min-h-[44px]">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full border border-black/10 flex-shrink-0"
                      style={{ backgroundColor: item.colorHex || '#9A9AA5' }}
                    />
                    <span className="text-[12px] text-[#6B6B76] truncate max-w-[90px]">
                      {item.colorName || 'Default'}
                    </span>
                  </div>

                  {/* Hover reveal actions & attribute chips */}
                  <div className="flex items-center gap-2">
                    {item.buffs.length > 0 && (
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity hidden sm:flex items-center gap-1">
                        {item.buffs.slice(0, 2).map((b, i) => (
                          <span
                            key={i}
                            className="bg-[#F4F4F6] px-1.5 py-0.5 rounded text-[11px] text-[#111113] font-medium"
                          >
                            +{b.value} {b.stat}
                          </span>
                        ))}
                      </div>
                    )}

                    {status === 'owned' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          sfx.playEquip();
                          onToggleEquip(item);
                        }}
                        className={`opacity-0 group-hover:opacity-100 transition-all text-[12px] px-2.5 py-1 rounded-lg font-medium ${
                          item.isEquipped
                            ? 'bg-[#FDECEC] text-[#DC2626] hover:bg-[#FCD8D8]'
                            : 'bg-[#E6F7F9] text-[#0891B2] hover:bg-[#D4F1F5]'
                        }`}
                      >
                        {item.isEquipped ? 'Unequip' : 'Equip'}
                      </button>
                    )}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
