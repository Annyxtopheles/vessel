import React from 'react';
import type { InventoryItem, NumberGroupingOption } from '../types';
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
  privacyMode?: boolean;
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
  privacyMode = false,
}) => {
  const blurClass = privacyMode ? 'filter blur-[6px] hover:filter-none transition-all select-none' : '';
  // Wardrobe by color (owned clothing only)
  const ownedClothing = items.filter(
    (i) => (i.ownershipStatus || 'owned') === 'owned' && i.category === 'apparel'
  );

  const colorCounts: Record<string, { count: number; hex: string }> = {};
  ownedClothing.forEach((item) => {
    const colName = item.colorName || 'Other';
    if (!colorCounts[colName]) {
      colorCounts[colName] = { count: 0, hex: item.colorHex || '#0F172A' };
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
        <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-[6px] p-4 flex flex-col justify-between">
          <span className="text-[13px] font-medium text-[#64748B]">Items owned</span>
          <div className="mt-2">
            <div className="editorial-stat-num">
              {ownedCount}
            </div>
            <div className="text-[12px] text-[#64748B] mt-1 tabular-nums truncate">
              {ownedCount} owned · {wishlistCount} wishlist · {pastCount} parted
            </div>
          </div>
        </div>

        {/* Stat 2: Total value */}
        <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-[6px] p-4 flex flex-col justify-between">
          <span className="text-[13px] font-medium text-[#64748B]">Total value</span>
          <div className="mt-2">
            <div className={`editorial-stat-num ${blurClass}`}>
              {formatCurrency(vaultValuation, currencySymbol, numberGrouping)}
            </div>
            <div className="text-[12px] text-[#64748B] mt-1 truncate">
              Owned items
            </div>
          </div>
        </div>

        {/* Stat 3: Wishlist cost */}
        <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-[6px] p-4 flex flex-col justify-between">
          <span className="text-[13px] font-medium text-[#64748B]">Wishlist cost</span>
          <div className="mt-2">
            <div className={`editorial-stat-num ${blurClass}`}>
              {formatCurrency(wishlistCost, currencySymbol, numberGrouping)}
            </div>
            <div className="text-[12px] text-[#64748B] mt-1 truncate tabular-nums">
              {wishlistCount} wanted items
            </div>
          </div>
        </div>

      </div>

      {/* Wardrobe Spectrum (small chart under the stats) */}
      <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-[6px] p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="font-serif text-[16px] font-normal text-[#0F172A]">Wardrobe Spectrum</span>
          <span className="text-[12px] text-[#64748B] tabular-nums">{totalGarments} garments</span>
        </div>

        {totalGarments === 0 ? (
          <p className="text-[13px] text-[#64748B] italic py-1">No owned clothing recorded.</p>
        ) : (
          <div className="space-y-2.5">
            {/* Multi-segment bar */}
            <div className="h-2.5 w-full rounded-[4px] overflow-hidden flex bg-[#E2E8F0]">
              {colorDistribution.map((c) => (
                <div
                  key={c.name}
                  style={{ width: `${c.pct}%`, backgroundColor: c.hex }}
                  title={`${c.name}: ${c.count} (${c.pct}%)`}
                  className="h-full transition-all duration-200"
                />
              ))}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-3.5 overflow-x-auto py-0.5">
              {colorDistribution.slice(0, 8).map((c) => (
                <div key={c.name} className="flex items-center gap-1.5 shrink-0 text-[12px]">
                  <span
                    className="w-2.5 h-2.5 rounded-[2px] border border-black/10 shrink-0"
                    style={{ backgroundColor: c.hex }}
                  />
                  <span className="text-[#0F172A] font-medium">{c.name}</span>
                  <span className="text-[#64748B] tabular-nums">({c.count})</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
