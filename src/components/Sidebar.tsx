import React from 'react';
import type { CharacterProfile } from '../types';
import { 
  CalendarCheck2, 
  Package, 
  Target, 
  Compass,
  Volume2, 
  VolumeX, 
  Download, 
  Upload
} from 'lucide-react';
import { sfx } from '../utils/audio';

interface SidebarProps {
  profile: CharacterProfile;
  activeTab: 'rituals' | 'inventory' | 'quests' | 'codex';
  setActiveTab: (tab: 'rituals' | 'inventory' | 'quests' | 'codex') => void;
  totalItemsCount: number;
  ownedCount?: number;
  openQuestsCount?: number;
  equippedCount: number;
  currentEncumbrance: number;
  totalGoldValue: number;
  isMuted: boolean;
  setIsMuted: (muted: boolean) => void;
  onExport: () => void;
  onImport: () => void;
  onUpdateProfile?: (updated: Partial<CharacterProfile>) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  profile,
  activeTab,
  setActiveTab,
  totalItemsCount,
  ownedCount,
  openQuestsCount = 0,
  isMuted,
  setIsMuted,
  onExport,
  onImport,
}) => {
  const navItems = [
    {
      id: 'inventory' as const,
      label: 'Life Inventory',
      icon: Package,
      badge: `${ownedCount ?? totalItemsCount}`,
    },
    {
      id: 'rituals' as const,
      label: 'Daily Cadence',
      icon: CalendarCheck2,
      badge: `${profile.streaks.salahStreak}d`,
    },
    {
      id: 'quests' as const,
      label: 'Quests',
      icon: Compass,
      badge: `${openQuestsCount}`,
    },
    {
      id: 'codex' as const,
      label: 'Character Codex',
      icon: Target,
      badge: `Lvl ${profile.level}`,
    },
  ];

  return (
    <aside className="w-64 flex-shrink-0 bg-white border-r border-[#ECECF0] flex flex-col justify-between h-screen select-none z-30">
      {/* Top Section */}
      <div className="flex flex-col">
        
        {/* User Workspace Profile Header */}
        <div className="p-5 border-b border-[#ECECF0]">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src="/avatar.jpg"
              alt={profile.name}
              className="w-10 h-10 rounded-xl object-cover border border-[#ECECF0] flex-shrink-0 shadow-xs"
            />
            <div className="min-w-0">
              <div className="font-semibold text-sm text-[#111113] truncate tracking-tight">
                {profile.name}
              </div>
              <div className="text-xs text-[#6B6B76] truncate">
                {profile.title}
              </div>
            </div>
          </div>
        </div>

        {/* Primary Navigation List */}
        <nav className="p-3 space-y-1">
          <div className="px-3 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-[#9A9AA5]">
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
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-[#E6F7F9] text-[#0891B2] font-semibold'
                    : 'text-[#6B6B76] hover:bg-[#F4F4F6] hover:text-[#111113]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-[18px] h-[18px] ${isActive ? 'text-[#0891B2]' : 'text-[#6B6B76]'}`} />
                  <span>{item.label}</span>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  isActive 
                    ? 'bg-white text-[#0891B2] shadow-xs' 
                    : 'bg-[#F4F4F6] text-[#9A9AA5]'
                }`}>
                  {item.badge}
                </span>
              </button>
            );
          })}
        </nav>

      </div>

      {/* Bottom Footer Section */}
      <div className="p-4 border-t border-[#ECECF0] flex items-center justify-between bg-white">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              sfx.playClick();
              setIsMuted(!isMuted);
            }}
            className={`p-2 rounded-xl border text-xs transition-colors ${
              isMuted
                ? 'bg-[#FDECEC] text-[#DC2626] border-[#FDECEC]'
                : 'bg-white text-[#6B6B76] hover:text-[#111113] border-[#ECECF0] hover:bg-[#F4F4F6]'
            }`}
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <button
            onClick={() => {
              sfx.playClick();
              onExport();
            }}
            className="p-2 rounded-xl bg-white text-[#6B6B76] hover:text-[#111113] border border-[#ECECF0] hover:bg-[#F4F4F6] transition-colors"
            title="Export Vault JSON"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              sfx.playClick();
              onImport();
            }}
            className="p-2 rounded-xl bg-white text-[#6B6B76] hover:text-[#111113] border border-[#ECECF0] hover:bg-[#F4F4F6] transition-colors"
            title="Import Backup JSON"
          >
            <Upload className="w-4 h-4" />
          </button>
        </div>

        <span className="text-xs text-[#9A9AA5] font-medium">
          Vessel
        </span>
      </div>
    </aside>
  );
};
