import React, { useState } from 'react';
import type { CharacterProfile } from '../types';
import { 
  CalendarCheck2, 
  Package, 
  Target, 
  Volume2, 
  VolumeX, 
  Download, 
  Upload, 
  Flame, 
  Sun, 
  Cpu, 
  Scale, 
  Edit3, 
  Check, 
  Shirt
} from 'lucide-react';
import { sfx } from '../utils/audio';

interface SidebarProps {
  profile: CharacterProfile;
  activeTab: 'rituals' | 'inventory' | 'codex';
  setActiveTab: (tab: 'rituals' | 'inventory' | 'codex') => void;
  totalItemsCount: number;
  equippedCount: number;
  currentEncumbrance: number;
  totalGoldValue: number;
  isMuted: boolean;
  setIsMuted: (muted: boolean) => void;
  onExport: () => void;
  onImport: () => void;
  onUpdateProfile: (updated: Partial<CharacterProfile>) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  profile,
  activeTab,
  setActiveTab,
  totalItemsCount,
  equippedCount,
  currentEncumbrance,
  totalGoldValue,
  isMuted,
  setIsMuted,
  onExport,
  onImport,
  onUpdateProfile,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [nameVal, setNameVal] = useState(profile.name);
  const [titleVal, setTitleVal] = useState(profile.title);

  const encumbrancePercent = Math.min(100, Math.round((currentEncumbrance / profile.maxEncumbranceKg) * 100));
  const isOverburdened = currentEncumbrance > profile.maxEncumbranceKg;

  const handleSaveProfile = () => {
    sfx.playClick();
    if (nameVal.trim()) {
      onUpdateProfile({ name: nameVal.trim(), title: titleVal.trim() || 'Wanderer' });
    }
    setIsEditing(false);
  };

  const navItems = [
    {
      id: 'rituals' as const,
      label: 'Daily Cadence',
      description: 'Salah, habits & volume',
      icon: CalendarCheck2,
      badge: 'Active',
    },
    {
      id: 'inventory' as const,
      label: 'Life Inventory',
      description: 'Wardrobe & EDC items',
      icon: Package,
      badge: `${totalItemsCount}`,
    },
    {
      id: 'codex' as const,
      label: 'Character Codex',
      description: '4 Pillars & skill trees',
      icon: Target,
      badge: `Lvl ${profile.level}`,
    },
  ];

  return (
    <aside className="w-64 flex-shrink-0 bg-[#0d0e12] border-r border-[#1f222b] flex flex-col justify-between h-screen select-none z-30">
      {/* Top Section */}
      <div className="flex flex-col overflow-y-auto">
        
        {/* User Identity Card (Always at the exact same location) */}
        <div className="p-4 border-b border-[#1f222b]">
          {isEditing ? (
            <div className="space-y-2">
              <input
                type="text"
                value={nameVal}
                onChange={(e) => setNameVal(e.target.value)}
                placeholder="Name"
                className="w-full px-2.5 py-1 bg-[#14161f] border border-[#2a2e3b] rounded text-xs text-white focus:outline-none focus:border-[#5e6ad2]"
              />
              <input
                type="text"
                value={titleVal}
                onChange={(e) => setTitleVal(e.target.value)}
                placeholder="Title"
                className="w-full px-2.5 py-1 bg-[#14161f] border border-[#2a2e3b] rounded text-xs text-[#8a8f98] focus:outline-none focus:border-[#5e6ad2]"
              />
              <div className="flex items-center gap-1.5 pt-1">
                <button
                  onClick={handleSaveProfile}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#5e6ad2] text-white text-[11px] font-semibold hover:bg-[#4f56e9]"
                >
                  <Check className="w-3 h-3" /> Save
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-2 py-1 rounded bg-[#161822] text-[#8a8f98] text-[11px] hover:text-white"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#161824] border border-[#262a38] flex items-center justify-center font-bold text-xs text-[#f3f4f6] tracking-wide">
                  SZ
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-xs text-white tracking-tight">
                      {profile.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-[#8a8f98] font-mono">
                    <span>{profile.title}</span>
                    <span>•</span>
                    <span className="text-[#a5b4fc]">Lvl {profile.level}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  setNameVal(profile.name);
                  setTitleVal(profile.title);
                  setIsEditing(true);
                }}
                className="p-1 rounded text-[#8a8f98] hover:text-white hover:bg-[#161822] transition-colors"
                title="Edit profile identity"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Primary Navigation */}
        <div className="p-3 space-y-1">
          <div className="px-2 pb-1.5 text-[10px] font-mono uppercase tracking-wider text-[#606470]">
            Navigation
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  sfx.playClick();
                  setActiveTab(item.id);
                }}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-[#181a24] text-white border border-[#2b2f42] shadow-xs'
                    : 'text-[#8a8f98] hover:text-white hover:bg-[#12141a]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#818cf8]' : 'text-[#8a8f98]'}`} />
                  <span className="tracking-tight">{item.label}</span>
                </div>
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                  isActive 
                    ? 'bg-[#1f2233] text-[#c7d2fe] border-[#373d57]' 
                    : 'bg-[#12141a] text-[#8a8f98] border-[#1f222b]'
                }`}>
                  {item.badge}
                </span>
              </button>
            );
          })}
        </div>

        {/* Vitals & Streaks Section */}
        <div className="p-3 border-t border-[#1f222b] space-y-2">
          <div className="px-2 text-[10px] font-mono uppercase tracking-wider text-[#606470]">
            Cadence Streaks
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            <div className="p-2 rounded-lg bg-[#12141a] border border-[#1f222b] text-center">
              <Sun className="w-3.5 h-3.5 mx-auto mb-1 text-[#818cf8]" />
              <span className="block text-[10px] font-mono text-[#8a8f98]">Salah</span>
              <span className="text-xs font-semibold font-mono text-white">{profile.streaks.salahStreak}d</span>
            </div>
            <div className="p-2 rounded-lg bg-[#12141a] border border-[#1f222b] text-center">
              <Flame className="w-3.5 h-3.5 mx-auto mb-1 text-[#e08279]" />
              <span className="block text-[10px] font-mono text-[#8a8f98]">Workout</span>
              <span className="text-xs font-semibold font-mono text-white">{profile.streaks.workoutStreak}d</span>
            </div>
            <div className="p-2 rounded-lg bg-[#12141a] border border-[#1f222b] text-center">
              <Cpu className="w-3.5 h-3.5 mx-auto mb-1 text-[#85a6cf]" />
              <span className="block text-[10px] font-mono text-[#8a8f98]">Craft</span>
              <span className="text-xs font-semibold font-mono text-white">{profile.streaks.craftStreak}d</span>
            </div>
          </div>
        </div>

        {/* Load & Vault Metrics */}
        <div className="p-3 border-t border-[#1f222b] space-y-2">
          <div className="px-2 text-[10px] font-mono uppercase tracking-wider text-[#606470]">
            Wardrobe & Carry
          </div>
          
          <div className="p-2.5 rounded-lg bg-[#12141a] border border-[#1f222b] space-y-2">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-[#8a8f98] flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-[#606470]" /> Carry Load
              </span>
              <span className={`font-semibold ${isOverburdened ? 'text-rose-400' : 'text-[#f3f4f6]'}`}>
                {currentEncumbrance.toFixed(1)} / {profile.maxEncumbranceKg.toFixed(1)}kg
              </span>
            </div>
            <div className="h-1 w-full bg-[#1c1f2b] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  isOverburdened ? 'bg-[#e08279]' : 'bg-[#5e6ad2]'
                }`}
                style={{ width: `${Math.min(100, encumbrancePercent)}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] font-mono pt-1 border-t border-[#1a1d26]">
              <span className="text-[#8a8f98] flex items-center gap-1.5">
                <Shirt className="w-3.5 h-3.5 text-[#606470]" /> Equips
              </span>
              <span className="text-[#f3f4f6]">{equippedCount} / 8 slots</span>
            </div>

            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-[#8a8f98]">Vault Valuation</span>
              <span className="text-[#f3f4f6] font-semibold">${totalGoldValue.toLocaleString()}</span>
            </div>
          </div>
        </div>

      </div>

      {/* Bottom Footer Section */}
      <div className="p-3 border-t border-[#1f222b] flex items-center justify-between bg-[#0a0b0e]">
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              sfx.playClick();
              setIsMuted(!isMuted);
            }}
            className={`p-1.5 rounded-md border text-xs transition-colors ${
              isMuted
                ? 'bg-[#181a24] text-rose-400 border-[#2d3142]'
                : 'bg-[#12141a] text-[#8a8f98] hover:text-white border-[#1f222b]'
            }`}
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={() => {
              sfx.playClick();
              onExport();
            }}
            className="p-1.5 rounded-md bg-[#12141a] text-[#8a8f98] hover:text-white border border-[#1f222b] transition-colors"
            title="Export Vault JSON"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => {
              sfx.playClick();
              onImport();
            }}
            className="p-1.5 rounded-md bg-[#12141a] text-[#8a8f98] hover:text-white border border-[#1f222b] transition-colors"
            title="Import Backup JSON"
          >
            <Upload className="w-3.5 h-3.5" />
          </button>
        </div>

        <span className="text-[10px] font-mono text-[#525666]">
          Vessel v1.0
        </span>
      </div>
    </aside>
  );
};
