import React, { useState, useMemo } from 'react';
import type { InventoryItem, ItemRarity, PaletteColor, NumberGroupingOption } from '../types';
import type { InventoryTreeNode } from './Sidebar';
import { matchColorPalette } from '../utils/color';
import { formatCurrency } from '../utils/numberFormat';
import { CustomSelect } from './CustomSelect';
import {
  Search,
  LayoutGrid,
  List,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { sfx } from '../utils/audio';

interface InventoryGridProps {
  items: InventoryItem[];
  onInspectItem: (item: InventoryItem) => void;
  onOpenAddItem: () => void;
  onOpenImport?: () => void;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  currencySymbol?: string;
  numberGrouping?: NumberGroupingOption;
  wearCounts?: Record<string, number>;
  palette?: PaletteColor[];
  filterNode?: InventoryTreeNode;
}

const RARITY_DOT_COLORS: Record<ItemRarity, string> = {
  common: '#6B645A',
  rare: '#2D4A6B',
  epic: '#7A5C1E',
  masterwork: '#3F6B4F',
  legendary: '#9C3D2A',
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
  onOpenImport,
  searchQuery: externalSearchQuery,
  onSearchChange: externalOnSearchChange,
  currencySymbol = '৳',
  numberGrouping = 'bangladeshi',
  wearCounts = {},
  palette = [],
  filterNode = { type: 'all' },
}) => {
  const [selectedSeason, setSelectedSeason] = useState<string>('all');
  const [selectedCondition, setSelectedCondition] = useState<string>('all');
  const [paletteFilter, setPaletteFilter] = useState<'all' | 'suits' | 'avoid'>('all');
  const [internalSearchQuery, setInternalSearchQuery] = useState<string>('');

  // Default to Dense Table view if over 30 items
  const [viewMode, setViewMode] = useState<'grid' | 'table'>(() => (items.length > 30 ? 'table' : 'grid'));
  const [groupBy, setGroupBy] = useState<'none' | 'category' | 'location' | 'color' | 'status'>('none');
  const [sortCol, setSortCol] = useState<'name' | 'category' | 'value' | 'wears' | 'costPerWear'>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const activeSearch = externalSearchQuery !== undefined ? externalSearchQuery : internalSearchQuery;
  const handleSearchChange = (val: string) => {
    if (externalOnSearchChange) {
      externalOnSearchChange(val);
    } else {
      setInternalSearchQuery(val);
    }
  };

  // Filter pipeline driven by Sidebar tree filterNode
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const itemStatus = item.ownershipStatus || (item.isLocked ? 'wishlist' : 'owned');

      // Tree node filtering
      if (filterNode.type === 'status') {
        if (itemStatus !== filterNode.status) return false;
      } else if (filterNode.type === 'category') {
        if (item.category !== filterNode.category) return false;
      } else if (filterNode.type === 'location') {
        if ((item.location || '').trim() !== filterNode.location.trim()) return false;
      }

      // Toolbar filters
      if (selectedSeason !== 'all' && item.season !== 'all' && item.season !== selectedSeason) return false;
      if (selectedCondition !== 'all' && item.condition !== selectedCondition) return false;

      // Palette match filter
      if (paletteFilter !== 'all') {
        const match = matchColorPalette(item.colorHex, palette);
        if (paletteFilter === 'suits' && match?.verdict !== 'suits') return false;
        if (paletteFilter === 'avoid' && match?.verdict !== 'avoid') return false;
      }

      // Search query
      if (activeSearch.trim()) {
        const q = activeSearch.toLowerCase();
        const matchName = item.name.toLowerCase().includes(q);
        const matchLore = item.lore.toLowerCase().includes(q);
        const matchColor = item.colorName.toLowerCase().includes(q);
        const matchSub = item.subCategory.toLowerCase().includes(q);
        const matchLoc = (item.location || '').toLowerCase().includes(q);
        if (!matchName && !matchLore && !matchColor && !matchSub && !matchLoc) {
          return false;
        }
      }

      return true;
    });
  }, [items, filterNode, selectedSeason, selectedCondition, paletteFilter, palette, activeSearch]);

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
      else if (groupBy === 'location') gKey = it.location || 'Vault';
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
    { id: 'suits', label: 'Suits you' },
    { id: 'avoid', label: 'Avoid' },
  ];

  // Active filter label badge
  const filterLabel = useMemo(() => {
    if (filterNode.type === 'status') {
      if (filterNode.status === 'owned') return 'Owned';
      if (filterNode.status === 'wishlist') return 'Wishlist';
      if (filterNode.status === 'past') return 'Parted With';
    } else if (filterNode.type === 'category') {
      return `Category: ${filterNode.category}`;
    } else if (filterNode.type === 'location') {
      return `Location: ${filterNode.location}`;
    }
    return 'All items';
  }, [filterNode]);

  return (
    <div className="space-y-4">
      {/* 1. Primary Controls & Filters Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left: Active Tree Filter Label + Secondary Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-[6px] bg-[#FBF9F4] border border-[#E4DED2] text-[13px] font-medium text-[#1F1B16]">
            <span>{filterLabel}</span>
            <span className="text-[11px] font-medium tabular-nums text-[#6B645A] px-1.5 py-0.5 rounded-[4px] bg-[#EFEAE0] border border-[#E4DED2] ml-1">
              {filteredItems.length}
            </span>
          </div>

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

          <CustomSelect
            value={paletteFilter}
            options={paletteOptions}
            onChange={(val) => setPaletteFilter(val as 'all' | 'suits' | 'avoid')}
            buttonClassName="py-1 px-3 text-xs"
          />

          <CustomSelect
            value={groupBy}
            options={groupByOptions}
            onChange={(val) => setGroupBy(val as 'none' | 'category' | 'location' | 'color' | 'status')}
            buttonClassName="py-1 px-3 text-xs"
          />
        </div>

        {/* Right: Search & View Mode Switcher */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="relative w-44 sm:w-56">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#6B645A] pointer-events-none" />
            <input
              type="text"
              value={activeSearch}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search possessions..."
              className="ship-input ship-input-search py-1.5 pl-8 text-[13px] w-full"
            />
          </div>

          {/* Grid / Table View Mode Switcher (Icon-only buttons allowed) */}
          <div className="inline-flex p-0.5 bg-[#EFEAE0] rounded-[6px] border border-[#E4DED2] shrink-0">
            <button
              type="button"
              onClick={() => {
                sfx.playClick();
                setViewMode('grid');
              }}
              className={`p-1.5 rounded-[4px] transition-colors cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-[#FBF9F4] text-[#1F1B16] border border-[#E4DED2]'
                  : 'text-[#6B645A] hover:text-[#1F1B16]'
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
              className={`p-1.5 rounded-[4px] transition-colors cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-[#FBF9F4] text-[#1F1B16] border border-[#E4DED2]'
                  : 'text-[#6B645A] hover:text-[#1F1B16]'
              }`}
              title="Dense Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Items Catalog Display (Grid or Table) */}
      {filteredItems.length === 0 ? (
        <div className="bg-[#FBF9F4] border border-[#E4DED2] rounded-[6px] p-12 text-center">
          <p className="font-serif text-[18px] text-[#1F1B16]">No possessions found</p>
          <p className="text-[13px] text-[#6B645A] mt-1">Try selecting another sidebar node or clearing search filters.</p>
          {onOpenImport && (
            <button
              type="button"
              onClick={onOpenImport}
              className="editorial-btn-secondary mt-3"
            >
              Import from JSON or CSV
            </button>
          )}
        </div>
      ) : viewMode === 'table' ? (
        /* DENSE TABLE VIEW WITH SORTABLE COLUMNS */
        <div className="bg-[#FBF9F4] border border-[#E4DED2] rounded-[6px] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[13px]">
              <thead>
                <tr className="border-b border-[#E4DED2] bg-[#F6F2EA] text-[12px] font-medium text-[#6B645A]">
                  <th
                    onClick={() => handleHeaderSort('name')}
                    className="py-2.5 px-4 cursor-pointer hover:text-[#1F1B16] select-none"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Possession</span>
                      {sortCol === 'name' ? (
                        sortDir === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-[#1F1B16]" /> : <ArrowDown className="w-3.5 h-3.5 text-[#1F1B16]" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-[#6B645A]/60" />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleHeaderSort('category')}
                    className="py-2.5 px-3 cursor-pointer hover:text-[#1F1B16] select-none"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Category</span>
                      {sortCol === 'category' ? (
                        sortDir === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-[#1F1B16]" /> : <ArrowDown className="w-3.5 h-3.5 text-[#1F1B16]" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-[#6B645A]/60" />
                      )}
                    </div>
                  </th>
                  <th className="py-2.5 px-3">Location</th>
                  <th
                    onClick={() => handleHeaderSort('value')}
                    className="py-2.5 px-3 text-right cursor-pointer hover:text-[#1F1B16] select-none"
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span>Value</span>
                      {sortCol === 'value' ? (
                        sortDir === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-[#1F1B16]" /> : <ArrowDown className="w-3.5 h-3.5 text-[#1F1B16]" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-[#6B645A]/60" />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleHeaderSort('wears')}
                    className="py-2.5 px-3 text-right cursor-pointer hover:text-[#1F1B16] select-none"
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span>Wears</span>
                      {sortCol === 'wears' ? (
                        sortDir === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-[#1F1B16]" /> : <ArrowDown className="w-3.5 h-3.5 text-[#1F1B16]" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-[#6B645A]/60" />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleHeaderSort('costPerWear')}
                    className="py-2.5 px-3 text-right cursor-pointer hover:text-[#1F1B16] select-none"
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span>Cost / Wear</span>
                      {sortCol === 'costPerWear' ? (
                        sortDir === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-[#1F1B16]" /> : <ArrowDown className="w-3.5 h-3.5 text-[#1F1B16]" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-[#6B645A]/60" />
                      )}
                    </div>
                  </th>
                  <th className="py-2.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4DED2]">
                {sortedItems.map((item) => {
                  const status = item.ownershipStatus || (item.isLocked ? 'wishlist' : 'owned');
                  const wears = wearCounts[item.id] || 0;
                  const costPerWear = wears > 0 ? (item.goldValue / wears).toFixed(2) : '—';
                  const dotColor = RARITY_DOT_COLORS[item.rarity] || '#6B645A';
                  const paletteMatch = matchColorPalette(item.colorHex, palette);
                  const initialChar = (item.name[0] || 'V').toUpperCase();

                  return (
                    <tr
                      key={item.id}
                      onClick={() => onInspectItem(item)}
                      className="hover:bg-[#F6F2EA]/60 transition-colors cursor-pointer group"
                    >
                      <td className="py-2.5 px-4">
                        <div className="flex items-center gap-3 min-w-[200px]">
                          <div className="w-8 h-8 rounded-[4px] bg-[#EFEAE0] border border-[#E4DED2] overflow-hidden flex-shrink-0 flex items-center justify-center font-serif text-[13px] text-[#6B645A]">
                            {item.imageUrl ? (
                              <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                            ) : (
                              <span>{initialChar}</span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span
                                className="w-2 h-2 rounded-full flex-shrink-0"
                                style={{ backgroundColor: dotColor }}
                              />
                              <span className="font-medium text-[#1F1B16] group-hover:text-black transition-colors truncate">
                                {item.name}
                              </span>
                            </div>
                            <span className="text-[11px] text-[#6B645A] truncate block">
                              {item.colorName}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-2.5 px-3 text-[#6B645A] whitespace-nowrap">
                        {item.subCategory || item.category}
                      </td>

                      <td className="py-2.5 px-3 text-[#6B645A] whitespace-nowrap text-[12px]">
                        {item.location || 'Vault'}
                      </td>

                      <td className="py-2.5 px-3 text-right font-medium tabular-nums text-[#1F1B16] whitespace-nowrap">
                        {formatCurrency(item.goldValue, currencySymbol, numberGrouping)}
                      </td>

                      <td className="py-2.5 px-3 text-right tabular-nums text-[#6B645A] whitespace-nowrap">
                        {wears}
                      </td>

                      <td className="py-2.5 px-3 text-right tabular-nums text-[#6B645A] whitespace-nowrap">
                        {wears > 0 && costPerWear ? (
                          `${formatCurrency(parseFloat(costPerWear), currencySymbol, numberGrouping)}`
                        ) : (
                          <span className="text-[#6B645A]/60">Unworn</span>
                        )}
                      </td>

                      <td className="py-2.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {status === 'wishlist' ? (
                            <span className="ship-pill-neutral text-[11px]">Wishlist</span>
                          ) : status === 'past' ? (
                            <span className="ship-pill-neutral text-[11px] capitalize">{item.pastReason || 'Parted'}</span>
                          ) : (
                            <span className="ship-pill-neutral text-[11px]">Owned</span>
                          )}

                          {paletteMatch?.verdict === 'suits' && (
                            <span className="px-1.5 py-0.5 rounded-[4px] text-[10px] font-medium bg-[#F6F2EA] text-[#3F6B4F] border border-[#3F6B4F]/30">
                              Suits you
                            </span>
                          )}
                          {paletteMatch?.verdict === 'avoid' && (
                            <span className="px-1.5 py-0.5 rounded-[4px] text-[10px] font-medium bg-[#F6F2EA] text-[#9C3D2A] border border-[#9C3D2A]/30">
                              Avoid
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* GRID VIEW */
        <div className="space-y-6">
          {groupedBuckets.map((bucket) => (
            <div key={bucket.key} className="space-y-3">
              {bucket.title && (
                <div className="flex items-center gap-2 pt-2">
                  <h4 className="font-serif text-[15px] font-medium text-[#1F1B16] tracking-tight">
                    {bucket.title}
                  </h4>
                  <span className="text-[12px] tabular-nums text-[#6B645A]">({bucket.items.length})</span>
                  <div className="h-px bg-[#E4DED2] flex-1 ml-2" />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {bucket.items.map((item) => {
                  const status = item.ownershipStatus || (item.isLocked ? 'wishlist' : 'owned');
                  const wears = wearCounts[item.id] || 0;
                  const costPerWear = wears > 0 ? (item.goldValue / wears).toFixed(2) : null;
                  const dotColor = RARITY_DOT_COLORS[item.rarity] || '#6B645A';
                  const rarityLabel = RARITY_LABELS[item.rarity] || 'Common';
                  const initialChar = (item.name[0] || 'V').toUpperCase();
                  const match = matchColorPalette(item.colorHex, palette);

                  return (
                    <div
                      key={item.id}
                      onClick={() => onInspectItem(item)}
                      className="bg-[#FBF9F4] border border-[#E4DED2] rounded-[6px] flex flex-col justify-between overflow-hidden cursor-pointer group hover:border-[#1F1B16] transition-colors"
                    >
                      {/* Top Part: Image & Content */}
                      <div>
                        {/* Image Container: Consistent 4:5 Crop */}
                        <div className="aspect-[4/5] w-full bg-[#EFEAE0] relative overflow-hidden flex items-center justify-center border-b border-[#E4DED2]">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full bg-[#EFEAE0] text-[#6B645A] font-serif flex items-center justify-center text-3xl font-normal select-none">
                              {initialChar}
                            </div>
                          )}

                          {/* Quick Condition Pill in top left */}
                          {item.condition && (
                            <div className="absolute top-2.5 left-2.5 bg-[#FBF9F4]/95 text-[#6B645A] rounded-[4px] border border-[#E4DED2] flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 capitalize">
                              <span>{item.condition.replace('_', ' ')}</span>
                            </div>
                          )}
                        </div>

                        {/* Card Body */}
                        <div className="p-4">
                          {/* Item Name + Subtle Rarity Dot */}
                          <div className="flex items-center gap-2">
                            <span
                              className="w-2 h-2 rounded-full flex-shrink-0"
                              style={{ backgroundColor: dotColor }}
                              title={`Rarity: ${rarityLabel}`}
                            />
                            <h3 className="font-serif text-[16px] font-normal text-[#1F1B16] group-hover:text-black transition-colors truncate">
                              {item.name}
                            </h3>
                          </div>

                          {/* Category + Price in Secondary Text */}
                          <p className="text-[13px] text-[#6B645A] mt-1 truncate">
                            {item.subCategory || item.category} · <span className="tabular-nums">{formatCurrency(item.goldValue, currencySymbol, numberGrouping)}</span>
                          </p>

                          {/* Wear Count & Cost Per Wear Metric Line */}
                          {status === 'owned' && (
                            <div className="text-[12px] text-[#6B645A] mt-1.5 flex items-center gap-2 tabular-nums">
                              <span>{wears} wears</span>
                              <span>·</span>
                              <span>
                                {costPerWear ? `${formatCurrency(parseFloat(costPerWear), currencySymbol, numberGrouping)}/wear` : 'Unworn'}
                              </span>
                            </div>
                          )}

                          {/* Status Pill + Palette Match Badge */}
                          <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
                            {status === 'wishlist' ? (
                              <span className="ship-pill-neutral">Wishlist</span>
                            ) : status === 'past' ? (
                              <span className="ship-pill-neutral capitalize">{item.pastReason || 'Parted With'}</span>
                            ) : (
                              <span className="ship-pill-neutral">Owned</span>
                            )}

                            {match?.verdict === 'suits' && (
                              <span className="px-2 py-0.5 rounded-[4px] text-[11px] font-medium bg-[#F6F2EA] text-[#3F6B4F] border border-[#3F6B4F]/30">
                                Suits you
                              </span>
                            )}
                            {match?.verdict === 'avoid' && (
                              <span className="px-2 py-0.5 rounded-[4px] text-[11px] font-medium bg-[#F6F2EA] text-[#9C3D2A] border border-[#9C3D2A]/30">
                                Avoid
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Bottom Card Footer: Color dot + name on left, Location on right */}
                      <div className="px-4 pb-3 pt-2 border-t border-[#E4DED2] flex items-center justify-between text-[12px] text-[#6B645A]">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span
                            className="w-2.5 h-2.5 rounded-[2px] border border-black/10 flex-shrink-0"
                            style={{ backgroundColor: item.colorHex || '#6B645A' }}
                          />
                          <span className="truncate">
                            {item.colorName || 'Default'}
                          </span>
                        </div>

                        <div className="truncate text-[#6B645A]">
                          <span className="truncate">{item.location || 'Vault'}</span>
                        </div>
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
