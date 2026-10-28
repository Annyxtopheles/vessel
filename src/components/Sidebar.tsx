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
  Shirt,
  Sparkles
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
      icon: CalendarCheck2,
      badge: 'Active',
    },
    {
      id: 'inventory' as const,
      label: 'Life Inventory',
      icon: Package,
      badge: `${totalItemsCount}`,
    },
    {
      id: 'codex' as const,
      label: 'Character Codex',
      icon: Target,
      badge: `Lvl ${profile.level}`,
    },
  ];

  return (
    <aside className="w-64 flex-shrink-0 bg-[#090b0e] border-r border-[#1a1d26] flex flex-col justify-between h-screen select-none z-30">
      {/* Top Section */}
      <div className="flex flex-col overflow-y-auto">
        
        {/* User Identity Card */}
        <div className="p-4 border-b border-[#1a1d26]">
          {isEditing ? (
            <div className="space-y-2">
              <input
                type="text"
                value={nameVal}
                onChange={(e) => setNameVal(e.target.value)}
                placeholder="Name"
                className="w-full px-2.5 py-1.5 bg-[#12151c] border border-[#232938] rounded-md text-xs font-medium text-white focus:outline-none focus:border-[#0ea5e9]"
              />
              <input
                type="text"
                value={titleVal}
                onChange={(e) => setTitleVal(e.target.value)}
                placeholder="Title"
                className="w-full px-2.5 py-1.5 bg-[#12151c] border border-[#232938] rounded-md text-xs text-[#94a3b8] focus:outline-none focus:border-[#0ea5e9]"
              />
              <div className="flex items-center gap-1.5 pt-1">
                <button
                  onClick={handleSaveProfile}
                  className="flex items-center gap-1 px-3 py-1 rounded bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-semibold shadow-xs"
                >
                  <Check className="w-3.5 h-3.5" /> Save
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-2.5 py-1 rounded bg-[#151922] text-[#94a3b8] text-xs hover:text-white"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-9 h-9 rounded-lg bg-[#0e1622] border border-[#164e63]/50 flex items-center justify-center font-bold text-xs text-[#38bdf8] tracking-wider shadow-inner">
                    SZ
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#0ea5e9] border-2 border-[#090b0e]" />
                </div>
                <div>
                  <div className="font-semibold text-xs text-white tracking-tight leading-tight">
                    {profile.name}
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-[#94a3b8] mt-0.5">
                    <span>{profile.title}</span>
                    <span>•</span>
                    <span className="text-[#38bdf8] font-medium">Lvl {profile.level}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  setNameVal(profile.name);
                  setTitleVal(profile.title);
                  setIsEditing(true);
                }}
                className="p-1 rounded text-[#64748b] hover:text-[#e2e8f0] hover:bg-[#141822] transition-colors"
                title="Edit character profile"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Primary Navigation */}
        <div className="p-3 space-y-1">
          <div className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#475569]">
            Workspace
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
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-[#0c1a26] text-[#38bdf8] border-l-2 border-l-[#0ea5e9] border-y border-r border-[#164e63]/40 shadow-xs'
                    : 'text-[#94a3b8] hover:text-white hover:bg-[#12151d] border-l-2 border-l-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#38bdf8]' : 'text-[#64748b]'}`} />
                  <span className="tracking-tight">{item.label}</span>
                </div>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                  isActive 
                    ? 'bg-[#0369a1]/30 text-[#7dd3fc] border border-[#0284c7]/40' 
                    : 'bg-[#12151c] text-[#64748b] border border-[#1a1f2b]'
                }`}>
                  {item.badge}
                </span>
              </button>
            );
          })}
        </div>

        {/* Vitals & Streaks Section */}
        <div className="p-3 border-t border-[#1a1d26] space-y-2">
          <div className="px-2 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-[#475569]">
            <span>Consistency Cadence</span>
            <Sparkles className="w-3 h-3 text-[#38bdf8]" />
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            <div className="p-2 rounded-lg bg-[#0e1219] border border-[#1a1f2b] text-center hover:border-[#164e63]/50 transition-colors">
              <Sun className="w-3.5 h-3.5 mx-auto mb-1 text-[#38bdf8]" />
              <span className="block text-[10px] text-[#94a3b8]">Salah</span>
              <span className="text-xs font-semibold text-white">{profile.streaks.salahStreak}d</span>
            </div>
            <div className="p-2 rounded-lg bg-[#0e1219] border border-[#1a1f2b] text-center hover:border-[#44282c] transition-colors">
              <Flame className="w-3.5 h-3.5 mx-auto mb-1 text-[#f87171]" />
              <span className="block text-[10px] text-[#94a3b8]">Workout</span>
              <span className="text-xs font-semibold text-white">{profile.streaks.workoutStreak}d</span>
            </div>
            <div className="p-2 rounded-lg bg-[#0e1219] border border-[#1a1f2b] text-center hover:border-[#1e3a5f] transition-colors">
              <Cpu className="w-3.5 h-3.5 mx-auto mb-1 text-[#60a5fa]" />
              <span className="block text-[10px] text-[#94a3b8]">Craft</span>
              <span className="text-xs font-semibold text-white">{profile.streaks.craftStreak}d</span>
            </div>
          </div>
        </div>

        {/* Load & Vault Metrics */}
        <div className="p-3 border-t border-[#1a1d26] space-y-2">
          <div className="px-2 text-[10px] font-semibold uppercase tracking-wider text-[#475569]">
            Wardrobe & Carry
          </div>
          
          <div className="p-3 rounded-lg bg-[#0e1219] border border-[#1a1f2b] space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#94a3b8] flex items-center gap-1.5 text-[11px]">
                <Scale className="w-3.5 h-3.5 text-[#64748b]" /> Carry Load
              </span>
              <span className={`font-semibold ${isOverburdened ? 'text-rose-400' : 'text-[#f1f5f9]'}`}>
                {currentEncumbrance.toFixed(1)} / {profile.maxEncumbranceKg.toFixed(1)} kg
              </span>
            </div>
            <div className="h-1.5 w-full bg-[#161a24] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  isOverburdened ? 'bg-[#f87171]' : 'bg-[#0ea5e9]'
                }`}
                style={{ width: `${Math.min(100, encumbrancePercent)}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs pt-1.5 border-t border-[#161b26]">
              <span className="text-[#94a3b8] flex items-center gap-1.5 text-[11px]">
                <Shirt className="w-3.5 h-3.5 text-[#64748b]" /> Equipped
              </span>
              <span className="text-[#f1f5f9] font-medium">{equippedCount} / 8 slots</span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-[#94a3b8] text-[11px]">Vault Valuation</span>
              <span className="text-[#38bdf8] font-semibold">${totalGoldValue.toLocaleString()}</span>
            </div>
          </div>
        </div>

      </div>

      {/* Bottom Footer Section */}
      <div className="p-3 border-t border-[#1a1d26] flex items-center justify-between bg-[#08090d]">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              sfx.playClick();
              setIsMuted(!isMuted);
            }}
            className={`p-1.5 rounded-md border text-xs transition-colors ${
              isMuted
                ? 'bg-[#181a24] text-rose-400 border-[#2d3142]'
                : 'bg-[#10131a] text-[#94a3b8] hover:text-white border-[#1c2230]'
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
            className="p-1.5 rounded-md bg-[#10131a] text-[#94a3b8] hover:text-white border border-[#1c2230] transition-colors"
            title="Export Vault JSON"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => {
              sfx.playClick();
              onImport();
            }}
            className="p-1.5 rounded-md bg-[#10131a] text-[#94a3b8] hover:text-white border border-[#1c2230] transition-colors"
            title="Import Backup JSON"
          >
            <Upload className="w-3.5 h-3.5" />
          </button>
        </div>

        <span className="text-[10px] text-[#475569] font-medium">
          Vessel v1.0
        </span>
      </div>
    </aside>
  );
};
