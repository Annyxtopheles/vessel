import React, { useState, useMemo } from 'react';
import type { InventoryItem, ItemRarity, OwnershipStatus, PaletteColor } from '../types';
import { matchColorPalette } from '../utils/color';
import { CustomSelect } from './CustomSelect';
import {
  Search,
  Lock,
  Check,
  Package,
  History,
  LayoutGrid,
  List,
  Layers,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Backpack,
  Palette,
} from 'lucide-react';
import { sfx } from '../utils/audio';

interface InventoryGridProps {
  items: InventoryItem[];
  onInspectItem: (item: InventoryItem) => void;
  onToggleEquip: (item: InventoryItem) => void;
  onToggleCarried?: (item: InventoryItem) => void;
  onOpenAddItem: () => void;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  currencySymbol?: string;
  wearCounts?: Record<string, number>;
  palette?: PaletteColor[];
}

const RARITY_DOT_COLORS: Record<ItemRarity, string> = {
  common: '#9A9AA5',
  rare: '#3B82F6',
  epic: '#0891B2',
  masterwork: '#0284C7',
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
  onToggleCarried,
  searchQuery: externalSearchQuery,
  onSearchChange: externalOnSearchChange,
  currencySymbol = '$',
  wearCounts = {},
  palette = [],
}) => {
  const [selectedStatus, setSelectedStatus] = useState<OwnershipStatus | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSeason, setSelectedSeason] = useState<string>('all');
  const [selectedCondition, setSelectedCondition] = useState<string>('all');
  const [paletteFilter, setPaletteFilter] = useState<'all' | 'suits' | 'avoid'>('all');
  const [internalSearchQuery, setInternalSearchQuery] = useState<string>('');
  
  // View & Grouping Settings
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [groupBy, setGroupBy] = useState<'none' | 'category' | 'location' | 'color' | 'status'>('none');
  const [sortCol, setSortCol] = useState<'name' | 'category' | 'weight' | 'value' | 'wears' | 'costPerWear'>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const activeSearch = externalSearchQuery !== undefined ? externalSearchQuery : internalSearchQuery;
  const handleSearchChange = (val: string) => {
    if (externalOnSearchChange) {
      externalOnSearchChange(val);
    } else {
      setInternalSearchQuery(val);
    }
  };

  // Counts by ownership status
  const ownedCount = items.filter((i) => (i.ownershipStatus || 'owned') === 'owned').length;
  const wishCount = items.filter((i) => i.ownershipStatus === 'wishlist' || i.isLocked).length;
  const pastCount = items.filter((i) => i.ownershipStatus === 'past').length;

  // Filter pipeline
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const itemStatus = item.ownershipStatus || (item.isLocked ? 'wishlist' : 'owned');

      if (selectedStatus !== 'all' && itemStatus !== selectedStatus) return false;
      if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
      if (selectedSeason !== 'all' && item.season !== 'all' && item.season !== selectedSeason) return false;
      if (selectedCondition !== 'all' && item.condition !== selectedCondition) return false;

      // Palette match filter
      if (paletteFilter !== 'all') {
        const match = matchColorPalette(item.colorHex, palette);
        if (paletteFilter === 'suits' && match?.verdict !== 'suits') return false;
        if (paletteFilter === 'avoid' && match?.verdict !== 'avoid') return false;
      }

      if (activeSearch.trim()) {
        const q = activeSearch.toLowerCase();
        const matchName = item.name.toLowerCase().includes(q);
        const matchLore = item.lore.toLowerCase().includes(q);
        const matchColor = item.colorName.toLowerCase().includes(q);
        const matchSub = item.subCategory.toLowerCase().includes(q);
        const matchLoc = (item.location || '').toLowerCase().includes(q);
        const matchBuffs = item.buffs.some(
          (b) => b.stat.toLowerCase().includes(q) || b.label.toLowerCase().includes(q)
        );
        if (!matchName && !matchLore && !matchColor && !matchSub && !matchBuffs && !matchLoc) {
          return false;
        }
      }

      return true;
    });
  }, [items, selectedStatus, selectedCategory, selectedSeason, selectedCondition, paletteFilter, palette, activeSearch]);

  // Sort Pipeline for Table View
  const sortedItems = useMemo(() => {
    const list = [...filteredItems];
    list.sort((a, b) => {
      let comp = 0;
      const wearsA = wearCounts[a.id] || 0;
      const wearsB = wearCounts[b.id] || 0;
      const cpwA = wearsA > 0 ? a.goldValue / wearsA : a.goldValue;
      const cpwB = wearsB > 0 ? b.goldValue / wearsB : b.goldValue;

      switch (sortCol) {
        case 'name':
          comp = a.name.localeCompare(b.name);
          break;
        case 'category':
          comp = (a.subCategory || a.category).localeCompare(b.subCategory || b.category);
          break;
        case 'weight':
          comp = a.weightKg - b.weightKg;
          break;
        case 'value':
          comp = a.goldValue - b.goldValue;
          break;
        case 'wears':
          comp = wearsA - wearsB;
          break;
        case 'costPerWear':
          comp = cpwA - cpwB;
          break;
      }
      return sortDir === 'asc' ? comp : -comp;
    });
    return list;
  }, [filteredItems, sortCol, sortDir, wearCounts]);

  const handleHeaderSort = (col: typeof sortCol) => {
    sfx.playClick();
    if (sortCol === col) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortCol(col);
      setSortDir('asc');
    }
  };

  // Grouped Item Buckets
  const groupedBuckets = useMemo(() => {
    if (groupBy === 'none') {
      return [{ key: 'all', title: '', items: sortedItems }];
    }

    const map = new Map<string, InventoryItem[]>();
    sortedItems.forEach((it) => {
      let gKey = 'General';
      if (groupBy === 'category') gKey = it.category.toUpperCase();
      else if (groupBy === 'location') gKey = it.location || 'Vault Wardrobe';
      else if (groupBy === 'color') gKey = it.colorName || 'Default';
      else if (groupBy === 'status') gKey = (it.ownershipStatus || 'owned').toUpperCase();

      if (!map.has(gKey)) map.set(gKey, []);
      map.get(gKey)!.push(it);
    });

    return Array.from(map.entries()).map(([key, groupItems]) => ({
      key,
      title: key,
      items: groupItems,
    }));
  }, [sortedItems, groupBy]);

  const categoryOptions = [
    { id: 'all', label: 'All Categories' },
    { id: 'apparel', label: 'Clothing & Wardrobe' },
    { id: 'tech', label: 'Tech & Hardware' },
    { id: 'tomes', label: 'Books & Tomes' },
    { id: 'edc', label: 'Everyday Carry' },
  ];

  const seasonOptions = [
    { id: 'all', label: 'Season: All' },
    { id: 'summer', label: 'Summer' },
    { id: 'winter', label: 'Winter' },
    { id: 'transitional', label: 'Transitional' },
  ];

  const conditionOptions = [
    { id: 'all', label: 'Condition: All' },
    { id: 'pristine', label: 'Pristine' },
    { id: 'seasoned', label: 'Seasoned' },
    { id: 'worn', label: 'Worn' },
    { id: 'needs_repair', label: 'Needs Repair' },
  ];

  const groupByOptions = [
    { id: 'none', label: 'Group: None' },
    { id: 'category', label: 'Group: Category' },
    { id: 'location', label: 'Group: Location' },
    { id: 'color', label: 'Group: Color' },
    { id: 'status', label: 'Group: Status' },
  ];

  const paletteOptions = [
    { id: 'all', label: 'Palette: All' },
    { id: 'suits', label: '★ Suits You' },
    { id: 'avoid', label: '⚠ Avoid' },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Primary Controls Bar: Segmented Tabs (Left) + Search & View Mode Switcher (Right) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Segmented Control for Lifecycle Status */}
        <div className="inline-flex p-1 bg-[#ECECF0] rounded-xl overflow-x-auto max-w-full shrink-0">
          <button
            type="button"
            onClick={() => {
              sfx.playClick();
              setSelectedStatus('all');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
              selectedStatus === 'all'
                ? 'bg-white text-[#111113] shadow-xs'
                : 'text-[#6B6B76] hover:text-[#111113]'
            }`}
          >
            <span>All</span>
            <span className="text-[11px] font-semibold text-[#6B6B76] px-1.5 py-0.2 rounded-md bg-[#ECECF0]">
              {items.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              sfx.playClick();
              setSelectedStatus('owned');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
              selectedStatus === 'owned'
                ? 'bg-white text-[#111113] shadow-xs'
                : 'text-[#6B6B76] hover:text-[#111113]'
            }`}
          >
            <span>Currently Owned</span>
            <span className="text-[11px] font-semibold text-[#6B6B76] px-1.5 py-0.2 rounded-md bg-[#ECECF0]">
              {ownedCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              sfx.playClick();
              setSelectedStatus('wishlist');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
              selectedStatus === 'wishlist'
                ? 'bg-white text-[#111113] shadow-xs'
                : 'text-[#6B6B76] hover:text-[#111113]'
            }`}
          >
            <span>Wish to Own</span>
            <span className="text-[11px] font-semibold text-[#6B6B76] px-1.5 py-0.2 rounded-md bg-[#ECECF0]">
              {wishCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              sfx.playClick();
              setSelectedStatus('past');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
              selectedStatus === 'past'
                ? 'bg-white text-[#111113] shadow-xs'
                : 'text-[#6B6B76] hover:text-[#111113]'
            }`}
          >
            <span>Parted With</span>
            <span className="text-[11px] font-semibold text-[#6B6B76] px-1.5 py-0.2 rounded-md bg-[#ECECF0]">
              {pastCount}
            </span>
          </button>
        </div>

        {/* Search, View Switcher & Add Item in a locked, aligned cluster */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="relative w-44 sm:w-56">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#9A9AA5] pointer-events-none" />
            <input
              type="text"
              value={activeSearch}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search possessions..."
              className="ship-input ship-input-search py-1.5 pl-8 text-xs w-full"
            />
          </div>

          {/* Grid / Table View Mode Switcher */}
          <div className="inline-flex p-0.5 bg-[#ECECF0] rounded-xl border border-[#ECECF0] shrink-0">
            <button
              type="button"
              onClick={() => {
                sfx.playClick();
                setViewMode('grid');
              }}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white text-[#0891B2] shadow-xs'
                  : 'text-[#6B6B76] hover:text-[#111113]'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                sfx.playClick();
                setViewMode('table');
              }}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white text-[#0891B2] shadow-xs'
                  : 'text-[#6B6B76] hover:text-[#111113]'
              }`}
              title="Dense Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Secondary Filter & Grouping Toolbar Row */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pt-0.5">
        <div className="flex flex-wrap items-center gap-2">
          <CustomSelect
            value={selectedCategory}
            options={categoryOptions}
            onChange={(val) => setSelectedCategory(val)}
            buttonClassName="py-1 px-3 text-xs"
          />

          <CustomSelect
            value={selectedSeason}
            options={seasonOptions}
            onChange={(val) => setSelectedSeason(val)}
            buttonClassName="py-1 px-3 text-xs"
          />

          <CustomSelect
            value={selectedCondition}
            options={conditionOptions}
            onChange={(val) => setSelectedCondition(val)}
            buttonClassName="py-1 px-3 text-xs"
          />

          {/* Palette Match Filter */}
          <CustomSelect
            value={paletteFilter}
            options={paletteOptions}
            onChange={(val) => setPaletteFilter(val as any)}
            icon={Palette}
            buttonClassName="py-1 px-3 text-xs"
          />

          {/* Group By Dropdown */}
          <CustomSelect
            value={groupBy}
            options={groupByOptions}
            onChange={(val) => setGroupBy(val as any)}
            icon={Layers}
            buttonClassName="py-1 px-3 text-xs"
          />
        </div>

        {/* Clear filters shortcut */}
        {(selectedCategory !== 'all' || selectedSeason !== 'all' || selectedCondition !== 'all' || paletteFilter !== 'all' || groupBy !== 'none' || activeSearch.trim() !== '') && (
          <button
            type="button"
            onClick={() => {
              sfx.playClick();
              setSelectedCategory('all');
              setSelectedSeason('all');
              setSelectedCondition('all');
              setPaletteFilter('all');
              setGroupBy('none');
              handleSearchChange('');
            }}
            className="text-xs font-semibold text-[#0891B2] hover:underline cursor-pointer"
          >
            Reset filters
          </button>
        )}
      </div>

      {/* 2. Items Catalog Display (Grid or Table) */}
      {filteredItems.length === 0 ? (
        <div className="ship-card p-12 text-center">
          <p className="text-[15px] font-semibold text-[#111113]">No possessions found</p>
          <p className="text-[13px] text-[#6B6B76] mt-1">Try switching tabs or clearing search filters.</p>
        </div>
      ) : viewMode === 'table' ? (
        /* DENSE TABLE VIEW WITH SORTABLE COLUMNS */
        <div className="ship-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#ECECF0] bg-[#F4F4F6]/60 text-[12px] font-semibold text-[#6B6B76]">
                  <th
                    onClick={() => handleHeaderSort('name')}
                    className="py-3 px-4 cursor-pointer hover:text-[#111113] select-none"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Possession</span>
                      {sortCol === 'name' ? (
                        sortDir === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-[#0891B2]" /> : <ArrowDown className="w-3.5 h-3.5 text-[#0891B2]" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-[#9A9AA5]" />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleHeaderSort('category')}
                    className="py-3 px-3 cursor-pointer hover:text-[#111113] select-none"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Category</span>
                      {sortCol === 'category' ? (
                        sortDir === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-[#0891B2]" /> : <ArrowDown className="w-3.5 h-3.5 text-[#0891B2]" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-[#9A9AA5]" />
                      )}
                    </div>
                  </th>
                  <th className="py-3 px-3">Location</th>
                  <th className="py-3 px-3 text-center">Carried</th>
                  <th
                    onClick={() => handleHeaderSort('weight')}
                    className="py-3 px-3 text-right cursor-pointer hover:text-[#111113] select-none"
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span>Weight</span>
                      {sortCol === 'weight' ? (
                        sortDir === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-[#0891B2]" /> : <ArrowDown className="w-3.5 h-3.5 text-[#0891B2]" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-[#9A9AA5]" />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleHeaderSort('value')}
                    className="py-3 px-3 text-right cursor-pointer hover:text-[#111113] select-none"
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span>Value</span>
                      {sortCol === 'value' ? (
                        sortDir === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-[#0891B2]" /> : <ArrowDown className="w-3.5 h-3.5 text-[#0891B2]" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-[#9A9AA5]" />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleHeaderSort('wears')}
                    className="py-3 px-3 text-right cursor-pointer hover:text-[#111113] select-none"
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span>Wears</span>
                      {sortCol === 'wears' ? (
                        sortDir === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-[#0891B2]" /> : <ArrowDown className="w-3.5 h-3.5 text-[#0891B2]" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-[#9A9AA5]" />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleHeaderSort('costPerWear')}
                    className="py-3 px-3 text-right cursor-pointer hover:text-[#111113] select-none"
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span>Cost / Wear</span>
                      {sortCol === 'costPerWear' ? (
                        sortDir === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-[#0891B2]" /> : <ArrowDown className="w-3.5 h-3.5 text-[#0891B2]" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-[#9A9AA5]" />
                      )}
                    </div>
                  </th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ECECF0] text-[13px]">
                {sortedItems.map((item) => {
                  const status = item.ownershipStatus || (item.isLocked ? 'wishlist' : 'owned');
                  const wears = wearCounts[item.id] || 0;
                  const costPerWear = wears > 0 ? (item.goldValue / wears).toFixed(2) : '—';
                  const dotColor = RARITY_DOT_COLORS[item.rarity] || '#9A9AA5';
                  const paletteMatch = matchColorPalette(item.colorHex, palette);

                  return (
                    <tr
                      key={item.id}
                      onClick={() => onInspectItem(item)}
                      className="hover:bg-[#F4F4F6]/50 transition-colors cursor-pointer group"
                    >
                      <td className="py-2.5 px-4">
                        <div className="flex items-center gap-3 min-w-[200px]">
                          <div className="w-8 h-8 rounded-lg bg-[#F4F4F6] border border-[#ECECF0] overflow-hidden flex-shrink-0 flex items-center justify-center">
                            {item.imageUrl ? (
                              <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                            ) : (
                              <Package className="w-4 h-4 text-[#9A9AA5]" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span
                                className="w-2 h-2 rounded-full flex-shrink-0"
                                style={{ backgroundColor: dotColor }}
                              />
                              <span className="font-semibold text-[#111113] group-hover:text-[#0891B2] transition-colors truncate">
                                {item.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[11px] text-[#6B6B76] truncate">{item.colorName}</span>
                              {paletteMatch?.verdict === 'suits' && (
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-[#E6F6EC] text-[#16A34A] border border-[#16A34A]/20">
                                  Suits you
                                </span>
                              )}
                              {paletteMatch?.verdict === 'avoid' && (
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-[#FDECEC] text-[#DC2626] border border-[#DC2626]/20">
                                  Avoid
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-2.5 px-3 text-[#6B6B76] whitespace-nowrap">
                        {item.subCategory || item.category}
                      </td>

                      <td className="py-2.5 px-3 text-[#6B6B76] whitespace-nowrap">
                        {item.location || 'Vault Wardrobe'}
                      </td>

                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        {status === 'owned' && onToggleCarried ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleCarried(item);
                            }}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              item.carried
                                ? 'bg-[#E6F7F9] text-[#0891B2]'
                                : 'bg-[#F4F4F6] text-[#9A9AA5] hover:text-[#111113]'
                            }`}
                            title={item.carried ? 'Carried on pack / person' : 'Stored in vault'}
                          >
                            <Backpack className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <span className="text-[#9A9AA5]">—</span>
                        )}
                      </td>

                      <td className="py-2.5 px-3 text-right text-[#6B6B76] whitespace-nowrap font-medium">
                        {item.weightKg} kg
                      </td>

                      <td className="py-2.5 px-3 text-right text-[#111113] font-semibold whitespace-nowrap">
                        {currencySymbol}{item.goldValue.toLocaleString()}
                      </td>

                      <td className="py-2.5 px-3 text-right text-[#6B6B76] font-medium whitespace-nowrap">
                        {wears}
                      </td>

                      <td className="py-2.5 px-3 text-right whitespace-nowrap font-medium text-[#0891B2]">
                        {wears > 0 ? `${currencySymbol}${costPerWear}` : <span className="text-[#9A9AA5]">Unworn</span>}
                      </td>

                      <td className="py-2.5 px-3 whitespace-nowrap">
                        {status === 'wishlist' ? (
                          <span className="ship-pill-accent text-[11px]">Wishlist</span>
                        ) : status === 'past' ? (
                          <span className="ship-pill-neutral text-[11px] capitalize">{item.pastReason || 'Past'}</span>
                        ) : item.isEquipped ? (
                          <span className="ship-pill-success text-[11px]">Equipped</span>
                        ) : (
                          <span className="ship-pill-neutral text-[11px]">Owned</span>
                        )}
                      </td>

                      <td className="py-2.5 px-4 text-right whitespace-nowrap">
                        {status === 'owned' && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              sfx.playEquip();
                              onToggleEquip(item);
                            }}
                            className={`px-3 py-1 text-[12px] rounded-lg font-medium transition-colors cursor-pointer ${
                              item.isEquipped
                                ? 'bg-[#FDECEC] text-[#DC2626] hover:bg-[#FCD8D8]'
                                : 'bg-[#E6F7F9] text-[#0891B2] hover:bg-[#D4F1F5]'
                            }`}
                          >
                            {item.isEquipped ? 'Unequip' : 'Equip'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* GRID VIEW (WITH OPTIONAL GROUPING BUCKETS) */
        <div className="space-y-8">
          {groupedBuckets.map((bucket) => (
            <div key={bucket.key} className="space-y-4">
              {bucket.title && (
                <div className="flex items-center gap-2.5 pb-2 border-b border-[#ECECF0]">
                  <span className="text-[13px] font-bold text-[#111113] tracking-tight uppercase">
                    {bucket.title}
                  </span>
                  <span className="text-[12px] text-[#9A9AA5] font-medium">({bucket.items.length})</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
                {bucket.items.map((item) => {
                  const status = item.ownershipStatus || (item.isLocked ? 'wishlist' : 'owned');
                  const dotColor = RARITY_DOT_COLORS[item.rarity] || '#9A9AA5';
                  const rarityLabel = RARITY_LABELS[item.rarity] || 'Common';
                  const wears = wearCounts[item.id] || 0;
                  const costPerWear = wears > 0 ? (item.goldValue / wears).toFixed(2) : null;

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

                          {/* Quick Carried Badge in image top right */}
                          {status === 'owned' && item.carried && (
                            <div className="absolute top-2.5 right-2.5 bg-white/95 backdrop-blur-xs text-[#0891B2] p-1 rounded-lg border border-[#ECECF0] shadow-xs flex items-center gap-1 text-[11px] font-semibold px-2">
                              <Backpack className="w-3 h-3 text-[#0891B2]" />
                              <span>Carried</span>
                            </div>
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
                            {item.subCategory || item.category} • {currencySymbol}{item.goldValue.toLocaleString()} • {item.weightKg} kg
                          </p>

                          {/* Wear Count & Cost Per Wear Metric Line */}
                          {status === 'owned' && (
                            <div className="text-[12px] text-[#6B6B76] mt-1.5 flex items-center gap-2">
                              <span>{wears} wears</span>
                              <span>•</span>
                              <span className="text-[#0891B2] font-semibold">
                                {costPerWear ? `${currencySymbol}${costPerWear}/wear` : 'Unworn'}
                              </span>
                            </div>
                          )}

                          {/* ONE Status Pill + Palette Match Badge */}
                          <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                            {status === 'wishlist' ? (
                              <span className="ship-pill-accent">
                                <Lock className="w-3 h-3" /> Wish to Own
                              </span>
                            ) : status === 'past' ? (
                              <span className="ship-pill-neutral capitalize">
                                <History className="w-3 h-3" /> {item.pastReason || 'Parted With'}
                              </span>
                            ) : item.isEquipped ? (
                              <span className="ship-pill-success">
                                <Check className="w-3 h-3" /> Equipped
                              </span>
                            ) : (
                              <span className="ship-pill-neutral">
                                Owned
                              </span>
                            )}

                            {(() => {
                              const match = matchColorPalette(item.colorHex, palette);
                              if (match?.verdict === 'suits') {
                                return (
                                  <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#E6F6EC] text-[#16A34A] border border-[#16A34A]/20">
                                    Suits you
                                  </span>
                                );
                              }
                              if (match?.verdict === 'avoid') {
                                return (
                                  <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#FDECEC] text-[#DC2626] border border-[#DC2626]/20">
                                    Avoid
                                  </span>
                                );
                              }
                              return null;
                            })()}
                          </div>

                          {/* Attribute Modifier Chips cleanly placed in body with nowrap */}
                          {item.buffs.length > 0 && (
                            <div className="mt-3.5 pt-3 border-t border-[#ECECF0] flex flex-wrap items-center gap-1.5">
                              {item.buffs.slice(0, 2).map((b, i) => (
                                <span
                                  key={i}
                                  className="bg-[#F4F4F6] text-[#111113] px-2 py-0.5 rounded-md text-[11px] font-medium whitespace-nowrap"
                                >
                                  +{b.value} {b.stat}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Bottom Card Footer: Color dot + name on left, Equip/Unequip button on right */}
                      <div className="px-5 pb-4 pt-3 border-t border-[#ECECF0] flex items-center justify-between min-h-[44px] gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="w-2.5 h-2.5 rounded-full border border-black/10 flex-shrink-0"
                            style={{ backgroundColor: item.colorHex || '#9A9AA5' }}
                          />
                          <span className="text-[12px] text-[#6B6B76] truncate">
                            {item.colorName || 'Default'}
                          </span>
                        </div>

                        {status === 'owned' && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              sfx.playEquip();
                              onToggleEquip(item);
                            }}
                            className={`text-[12px] px-3 py-1 rounded-lg font-medium transition-colors flex-shrink-0 cursor-pointer ${
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
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
