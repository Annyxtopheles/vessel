import React from 'react';
import type { InventoryItem, NumberGroupingOption } from '../types';
import { Package, DollarSign, Bookmark, Palette } from 'lucide-react';
import { formatCurrency } from '../utils/numberFormat';

interface InventoryStatsProps {
  ownedCount: number;
  wishlistCount: number;
  pastCount: number;
  vaultValuation: number;
  wishlistCost: number;
  currencySymbol?: string;
  numberGrouping?: NumberGroupingOption;
  items: InventoryItem[];
}

export const InventoryStats: React.FC<InventoryStatsProps> = ({
  ownedCount,
  wishlistCount,
  pastCount,
  vaultValuation,
  wishlistCost,
  currencySymbol = '৳',
  numberGrouping = 'bangladeshi',
  items,
}) => {
  // Wardrobe by color (owned clothing only)
  const ownedClothing = items.filter(
    (i) => (i.ownershipStatus || 'owned') === 'owned' && i.category === 'apparel'
  );

  const colorCounts: Record<string, { count: number; hex: string }> = {};
  ownedClothing.forEach((item) => {
    const colName = item.colorName || 'Other';
    if (!colorCounts[colName]) {
      colorCounts[colName] = { count: 0, hex: item.colorHex || '#18181B' };
    }
    colorCounts[colName].count += 1;
  });

  const totalGarments = ownedClothing.length;
  const colorDistribution = Object.entries(colorCounts)
    .map(([name, data]) => ({
      name,
      hex: data.hex,
      count: data.count,
      pct: totalGarments > 0 ? Math.round((data.count / totalGarments) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);

  return (
    <div className="space-y-4">
      {/* 3 Plain Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Stat 1: Items owned */}
        <div className="ship-card p-4 sm:p-4.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-[#6B6B76]">Items owned</span>
            <div className="ship-icon-tile">
              <Package className="w-4 h-4 text-[#0891B2]" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-[26px] font-bold text-[#111113] leading-none tracking-tight">
              {ownedCount}
            </div>
            <div className="text-[12px] text-[#6B6B76] mt-1.5 truncate">
              {ownedCount} owned • {wishlistCount} wishlist • {pastCount} parted
            </div>
          </div>
        </div>

        {/* Stat 2: Total value */}
        <div className="ship-card p-4 sm:p-4.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-[#6B6B76]">Total value</span>
            <div className="ship-icon-tile">
              <DollarSign className="w-4 h-4 text-[#0891B2]" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-[26px] font-bold text-[#111113] leading-none tracking-tight">
              {formatCurrency(vaultValuation, currencySymbol, numberGrouping)}
            </div>
            <div className="text-[12px] text-[#6B6B76] mt-1.5 truncate">
              Owned items
            </div>
          </div>
        </div>

        {/* Stat 3: Wishlist cost */}
        <div className="ship-card p-4 sm:p-4.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-[#6B6B76]">Wishlist cost</span>
            <div className="ship-icon-tile">
              <Bookmark className="w-4 h-4 text-[#0891B2]" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-[26px] font-bold text-[#111113] leading-none tracking-tight">
              {formatCurrency(wishlistCost, currencySymbol, numberGrouping)}
            </div>
            <div className="text-[12px] text-[#6B6B76] mt-1.5 truncate">
              {wishlistCount} wanted items
            </div>
          </div>
        </div>

      </div>

      {/* Wardrobe Spectrum (small chart under the stats) */}
      <div className="ship-card p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-[#0891B2]" />
            <span className="text-[13px] font-semibold text-[#111113]">Wardrobe Spectrum</span>
          </div>
          <span className="text-[12px] text-[#6B6B76]">{totalGarments} garments</span>
        </div>

        {totalGarments === 0 ? (
          <p className="text-xs text-[#9A9AA5] italic py-2">No owned clothing recorded.</p>
        ) : (
          <div className="space-y-2">
            {/* Multi-segment bar */}
            <div className="h-3 w-full rounded-full overflow-hidden flex bg-[#ECECF0]">
              {colorDistribution.map((c) => (
                <div
                  key={c.name}
                  style={{ width: `${c.pct}%`, backgroundColor: c.hex }}
                  title={`${c.name}: ${c.count} (${c.pct}%)`}
                  className="h-full transition-all duration-300"
                />
              ))}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-3 overflow-x-auto py-1">
              {colorDistribution.slice(0, 6).map((c) => (
                <div key={c.name} className="flex items-center gap-1.5 shrink-0 text-xs">
                  <span
                    className="w-2.5 h-2.5 rounded-full border border-black/10 shrink-0"
                    style={{ backgroundColor: c.hex }}
                  />
                  <span className="text-[#111113] font-medium">{c.name}</span>
                  <span className="text-[#9A9AA5]">({c.count})</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
