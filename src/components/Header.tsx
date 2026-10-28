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

  const tabLabels: Record<'inventory' | 'codex' | 'rituals', string> = {
    rituals: 'Daily Cadence & Rituals',
    inventory: 'Life Inventory & Wardrobe',
    codex: 'Attributes & Skill Codex',
  };

  return (
    <header className="border-b border-[#1c1e26] bg-[#0d0e12]/95 backdrop-blur-md sticky top-0 z-30">
      <div className="w-full max-w-[1720px] mx-auto px-5 lg:px-8 h-14 flex items-center justify-between gap-4">
        
        {/* Left: Linear-style Breadcrumb Brand */}
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded bg-[#181a22] border border-[#262936] flex items-center justify-center font-bold font-mono text-xs text-[#ededed]">
            V
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-white tracking-tight">Vessel</span>
            <span className="text-neutral-600 font-mono">/</span>
            <span className="text-[#8a8f98] font-medium hidden sm:inline">{tabLabels[activeTab]}</span>
          </div>
        </div>

        {/* Center: Linear Tab Bar */}
        <nav className="flex items-center p-0.5 bg-[#12141a] border border-[#20232c] rounded-lg">
          <button
            onClick={() => {
              sfx.playClick();
              setActiveTab('rituals');
            }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
              activeTab === 'rituals'
                ? 'bg-[#1c1e27] text-white shadow-xs font-semibold'
                : 'text-[#8a8f98] hover:text-white'
            }`}
          >
            <CalendarCheck2 className="w-3.5 h-3.5 text-[#d8b46b]" />
            <span>Daily Cadence</span>
          </button>

          <button
            onClick={() => {
              sfx.playClick();
              setActiveTab('inventory');
            }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
              activeTab === 'inventory'
                ? 'bg-[#1c1e27] text-white shadow-xs font-semibold'
                : 'text-[#8a8f98] hover:text-white'
            }`}
          >
            <Package className="w-3.5 h-3.5 text-[#86a6cf]" />
            <span>Inventory</span>
          </button>

          <button
            onClick={() => {
              sfx.playClick();
              setActiveTab('codex');
            }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
              activeTab === 'codex'
                ? 'bg-[#1c1e27] text-white shadow-xs font-semibold'
                : 'text-[#8a8f98] hover:text-white'
            }`}
          >
            <Target className="w-3.5 h-3.5 text-[#df8276]" />
            <span>Codex</span>
          </button>
        </nav>

        {/* Right: Metrics & User Identity */}
        <div className="flex items-center gap-3">
          
          {/* Linear Metrics */}
          <div className="hidden md:flex items-center gap-2">
            {/* Encumbrance */}
            <div className="linear-tag flex items-center gap-1.5">
              <span className="text-[#8a8f98]">Load:</span>
              <span className={`font-mono ${isOverburdened ? 'text-rose-400' : 'text-[#ededed]'}`}>
                {currentEncumbrance.toFixed(1)}/{profile.maxEncumbranceKg.toFixed(1)}kg
              </span>
              <div className="w-8 h-1 bg-[#262933] rounded-full overflow-hidden ml-0.5">
                <div
                  className={`h-full rounded-full ${
                    isOverburdened ? 'bg-[#df8276]' : 'bg-[#b8944d]'
                  }`}
                  style={{ width: `${Math.min(100, encumbrancePercent)}%` }}
                />
              </div>
            </div>

            {/* Total Gold Value */}
            <div className="linear-tag flex items-center gap-1">
              <span className="text-[#8a8f98]">Val:</span>
              <span className="font-mono text-[#d8b46b]">${totalGoldValue.toLocaleString()}</span>
            </div>

            {/* User Level */}
            <div className="linear-tag flex items-center gap-1 text-[#8a8f98]">
              <span>Lvl {profile.level}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-0.5 border-l border-[#1f222b] pl-2">
            <button
              onClick={() => {
                sfx.playClick();
                setIsMuted(!isMuted);
              }}
              title={isMuted ? 'Unmute' : 'Mute'}
              className="p-1.5 rounded-md hover:bg-[#181a22] text-[#8a8f98] hover:text-white transition-colors"
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={() => {
                sfx.playClick();
                onExport();
              }}
              title="Export Vault JSON"
              className="p-1.5 rounded-md hover:bg-[#181a22] text-[#8a8f98] hover:text-white transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => {
                sfx.playClick();
                onImport();
              }}
              title="Import Vault JSON"
              className="p-1.5 rounded-md hover:bg-[#181a22] text-[#8a8f98] hover:text-white transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>

      </div>
    </header>
  );
};
