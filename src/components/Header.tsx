import React from 'react';
import type { CharacterProfile } from '../types';
import { Sparkles, Volume2, VolumeX, Download, Upload, Backpack, UserCheck, Flame } from 'lucide-react';
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
  const xpPercent = Math.min(100, Math.round((profile.currentXp / profile.xpToNextLevel) * 100));

  return (
    <header className="border-b border-[#C5A059]/20 bg-[#0B0C0F]/90 backdrop-blur-md sticky top-0 z-40 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        {/* Top Bar: Title & Status */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Logo & Identity */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#1C1F26] to-[#0D0E12] border border-[#C5A059]/40 flex items-center justify-center shadow-lg shadow-black/60 relative overflow-hidden group">
              <span className="font-cinzel text-xl font-bold text-[#E5C378] tracking-widest group-hover:scale-110 transition-transform">V</span>
              <div className="absolute inset-0 bg-[#C5A059]/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-cinzel text-lg sm:text-xl font-bold tracking-wider text-[#F1E8D9]">VESSEL</h1>
                <span className="text-xs px-2 py-0.5 rounded border border-[#C5A059]/30 bg-[#C5A059]/10 text-[#E5C378] font-mono tracking-wide">
                  LVL {profile.level}
                </span>
                <span className="text-xs text-[#8E887B] font-serif hidden sm:inline italic">
                  — {profile.title}
                </span>
              </div>
              <p className="text-[11px] font-mono text-[#7D776C] tracking-tight">
                REALITY-ENGINE & INVENTORY MATRIX
              </p>
            </div>
          </div>

          {/* Core RPG Status Gauges */}
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs font-mono">
            
            {/* XP Gauge */}
            <div className="flex flex-col gap-1 min-w-[130px]">
              <div className="flex justify-between items-center text-[#9A9486]">
                <span className="flex items-center gap-1 text-[#C5A059]">
                  <Sparkles className="w-3 h-3" /> XP
                </span>
                <span>{profile.currentXp} / {profile.xpToNextLevel}</span>
              </div>
              <div className="h-1.5 w-full bg-[#181A20] rounded-full overflow-hidden border border-[#2B2E38]">
                <div 
                  className="h-full bg-gradient-to-r from-[#A17C38] via-[#E5C378] to-[#F3DE9C] transition-all duration-500 rounded-full"
                  style={{ width: `${xpPercent}%` }}
                />
              </div>
            </div>

            {/* Encumbrance Gauge */}
            <div className="flex flex-col gap-1 min-w-[130px]">
              <div className="flex justify-between items-center text-[#9A9486]">
                <span className={`flex items-center gap-1 ${isOverburdened ? 'text-rose-400' : 'text-[#82B29A]'}`}>
                  <Backpack className="w-3 h-3" /> WEIGHT
                </span>
                <span className={isOverburdened ? 'text-rose-400 font-bold' : ''}>
                  {currentEncumbrance.toFixed(1)} / {profile.maxEncumbranceKg.toFixed(1)} kg
                </span>
              </div>
              <div className="h-1.5 w-full bg-[#181A20] rounded-full overflow-hidden border border-[#2B2E38]">
                <div 
                  className={`h-full transition-all duration-500 rounded-full ${
                    isOverburdened ? 'bg-rose-500' : encumbrancePercent > 75 ? 'bg-amber-500' : 'bg-[#52796F]'
                  }`}
                  style={{ width: `${Math.min(100, encumbrancePercent)}%` }}
                />
              </div>
            </div>

            {/* Gold Vault */}
            <div className="px-3 py-1.5 rounded bg-[#13151A] border border-[#C5A059]/25 flex items-center gap-1.5 text-[#E5C378]">
              <span className="text-[#C5A059] font-bold">⚜</span>
              <span className="font-mono font-medium">${totalGoldValue.toLocaleString()}</span>
              <span className="text-[10px] text-[#7A7468]">VAL</span>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-1 border-l border-[#2B2E38] pl-3">
              <button
                onClick={() => {
                  sfx.playClick();
                  setIsMuted(!isMuted);
                }}
                title={isMuted ? "Unmute arcane audio" : "Mute audio"}
                className={`p-1.5 rounded hover:bg-[#1E212A] text-[#9A9486] hover:text-[#E5C378] transition-colors ${
                  isMuted ? 'text-[#5A564C]' : 'text-[#C5A059]'
                }`}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              
              <button
                onClick={() => {
                  sfx.playClick();
                  onExport();
                }}
                title="Backup vessel state (JSON)"
                className="p-1.5 rounded hover:bg-[#1E212A] text-[#9A9486] hover:text-[#E5C378] transition-colors"
              >
                <Download className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  sfx.playClick();
                  onImport();
                }}
                title="Restore vessel backup"
                className="p-1.5 rounded hover:bg-[#1E212A] text-[#9A9486] hover:text-[#E5C378] transition-colors"
              >
                <Upload className="w-4 h-4" />
              </button>
            </div>

          </div>

        </div>

        {/* Tab Navigation Navigation (Dishonored / Skyrim Style Tabstrip) */}
        <nav className="flex items-center gap-2 sm:gap-4 mt-3 pt-2 border-t border-[#1C1F28]">
          <button
            onClick={() => {
              sfx.playClick();
              setActiveTab('inventory');
            }}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-cinzel tracking-wider rounded transition-all ${
              activeTab === 'inventory'
                ? 'bg-[#C5A059]/15 text-[#F3ECE0] border border-[#C5A059]/40 shadow-sm'
                : 'text-[#8E887B] hover:text-[#D6CFBE] hover:bg-[#14161C]'
            }`}
          >
            <Backpack className="w-3.5 h-3.5 text-[#C5A059]" />
            <span>ARMORY & POSSESSIONS</span>
          </button>

          <button
            onClick={() => {
              sfx.playClick();
              setActiveTab('codex');
            }}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-cinzel tracking-wider rounded transition-all ${
              activeTab === 'codex'
                ? 'bg-[#C5A059]/15 text-[#F3ECE0] border border-[#C5A059]/40 shadow-sm'
                : 'text-[#8E887B] hover:text-[#D6CFBE] hover:bg-[#14161C]'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5 text-[#C5A059]" />
            <span>CHARACTER CODEX & SKILLS</span>
          </button>

          <button
            onClick={() => {
              sfx.playClick();
              setActiveTab('rituals');
            }}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-cinzel tracking-wider rounded transition-all ${
              activeTab === 'rituals'
                ? 'bg-[#C5A059]/15 text-[#F3ECE0] border border-[#C5A059]/40 shadow-sm'
                : 'text-[#8E887B] hover:text-[#D6CFBE] hover:bg-[#14161C]'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-[#E5C378]" />
            <span>DAILY RITUALS & SALAH</span>
          </button>
        </nav>

      </div>
    </header>
  );
};
