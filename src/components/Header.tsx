import React from 'react';
import type { CharacterProfile } from '../types';
import { Volume2, VolumeX, Download, Upload, Package, Target, CalendarCheck2 } from 'lucide-react';
import { sfx } from '../utils/audio';

interface HeaderProps {
  profile: CharacterProfile;
  activeTab: 'inventory' | 'codex' | 'rituals';
  setActiveTab: (tab: 'inventory' | 'codex' | 'rituals') => void;
  currentEncumbrance: number;
  totalGoldValue: number;
  isMuted: boolean;
  setIsMuted: (muted: boolean) => void;
  onExport: () => void;
  onImport: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  profile,
  activeTab,
  setActiveTab,
  currentEncumbrance,
  totalGoldValue,
  isMuted,
  setIsMuted,
  onExport,
  onImport,
}) => {
  const encumbrancePercent = Math.min(100, Math.round((currentEncumbrance / profile.maxEncumbranceKg) * 100));
  const isOverburdened = currentEncumbrance > profile.maxEncumbranceKg;

  return (
    <header className="border-b border-[#1f2229] bg-[#0f1115]/80 backdrop-blur-md sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        
        {/* Brand & Profile Status */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#2a2d36] to-[#15171c] border border-[#363a45] flex items-center justify-center font-bold text-sm text-[#e5b869]">
            V
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-tight text-white">Vessel</span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#e5b869]/10 text-[#e5b869] border border-[#e5b869]/20">
                Level {profile.level}
              </span>
            </div>
            <p className="text-xs text-neutral-400 hidden sm:block">
              {profile.title}
            </p>
          </div>
        </div>

        {/* Center: Clean Modern Navigation Tabs */}
        <nav className="flex items-center p-1 bg-[#15171d] border border-[#23262f] rounded-lg">
          <button
            onClick={() => {
              sfx.playClick();
              setActiveTab('inventory');
            }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === 'inventory'
                ? 'bg-[#22252e] text-white shadow-sm font-semibold'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Package className="w-3.5 h-3.5 text-[#e5b869]" />
            <span>Inventory & Wardrobe</span>
          </button>

          <button
            onClick={() => {
              sfx.playClick();
              setActiveTab('codex');
            }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === 'codex'
                ? 'bg-[#22252e] text-white shadow-sm font-semibold'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Target className="w-3.5 h-3.5 text-[#e5b869]" />
            <span>Attributes & Skills</span>
          </button>

          <button
            onClick={() => {
              sfx.playClick();
              setActiveTab('rituals');
            }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === 'rituals'
                ? 'bg-[#22252e] text-white shadow-sm font-semibold'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <CalendarCheck2 className="w-3.5 h-3.5 text-[#e5b869]" />
            <span>Daily Habits & Salah</span>
          </button>
        </nav>

        {/* Right Metrics & Quick Actions */}
        <div className="flex items-center gap-3">
          
          {/* Quick Metrics (Clean & Compact) */}
          <div className="hidden md:flex items-center gap-3 text-xs">
            {/* Weight Pill */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#16181e] border border-[#23262f] text-neutral-300">
              <span className="text-neutral-500">Weight:</span>
              <span className={`font-medium ${isOverburdened ? 'text-rose-400' : 'text-neutral-200'}`}>
                {currentEncumbrance.toFixed(1)} / {profile.maxEncumbranceKg.toFixed(1)} kg
              </span>
              <div className="w-10 h-1.5 bg-[#262933] rounded-full overflow-hidden ml-1">
                <div
                  className={`h-full rounded-full ${
                    isOverburdened ? 'bg-rose-500' : encumbrancePercent > 75 ? 'bg-amber-400' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, encumbrancePercent)}%` }}
                />
              </div>
            </div>

            {/* Total Value Pill */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#16181e] border border-[#23262f] text-neutral-300">
              <span className="text-neutral-500">Value:</span>
              <span className="font-medium text-[#e5b869]">${totalGoldValue.toLocaleString()}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1 border-l border-[#23262f] pl-3">
            <button
              onClick={() => {
                sfx.playClick();
                setIsMuted(!isMuted);
              }}
              title={isMuted ? 'Unmute sounds' : 'Mute sounds'}
              className="p-1.5 rounded-md hover:bg-[#1c1f26] text-neutral-400 hover:text-neutral-200 transition-colors"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            <button
              onClick={() => {
                sfx.playClick();
                onExport();
              }}
              title="Export JSON backup"
              className="p-1.5 rounded-md hover:bg-[#1c1f26] text-neutral-400 hover:text-neutral-200 transition-colors"
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                sfx.playClick();
                onImport();
              }}
              title="Restore from JSON"
              className="p-1.5 rounded-md hover:bg-[#1c1f26] text-neutral-400 hover:text-neutral-200 transition-colors"
            >
              <Upload className="w-4 h-4" />
            </button>
          </div>

        </div>

      </div>
    </header>
  );
};
