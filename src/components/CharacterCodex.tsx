import React, { useState } from 'react';
import type { CharacterProfile, SkillNode, AttributeType } from '../types';
import { Cpu, Users, Flame, CheckCircle, Lock, Trophy, Sun } from 'lucide-react';
import { sfx } from '../utils/audio';

interface CharacterCodexProps {
  profile: CharacterProfile;
  skills: SkillNode[];
  onUnlockSkill: (skillId: string) => void;
}

const ATTRIBUTE_ICONS: Record<AttributeType, React.ComponentType<{ className?: string }>> = {
  STR: Flame,
  INT: Cpu,
  WIS: Sun,
  CHA: Users,
};

const ATTRIBUTE_THEMES: Record<AttributeType, { border: string; bg: string; text: string; glow: string }> = {
  STR: { border: 'border-rose-600/40', bg: 'bg-rose-950/20', text: 'text-rose-400', glow: 'shadow-rose-950/50' },
  INT: { border: 'border-sky-600/40', bg: 'bg-sky-950/20', text: 'text-sky-400', glow: 'shadow-sky-950/50' },
  WIS: { border: 'border-amber-500/40', bg: 'bg-amber-950/20', text: 'text-amber-400', glow: 'shadow-amber-950/50' },
  CHA: { border: 'border-emerald-600/40', bg: 'bg-emerald-950/20', text: 'text-emerald-400', glow: 'shadow-emerald-950/50' },
};

export const CharacterCodex: React.FC<CharacterCodexProps> = ({
  profile,
  skills,
  onUnlockSkill,
}) => {
  const [selectedAttr, setSelectedAttr] = useState<AttributeType | 'ALL'>('ALL');

  const filteredSkills = skills.filter(
    (skill) => selectedAttr === 'ALL' || skill.attribute === selectedAttr
  );

  const attributesList: { key: AttributeType; label: string; desc: string }[] = [
    { key: 'STR', label: 'STR — THE BODY', desc: 'Kinetic power, volume, spinal endurance, and stamina.' },
    { key: 'INT', label: 'INT — THE ARTIFICER', desc: 'Engineering velocity, deep work focus, and system architecture.' },
    { key: 'WIS', label: 'WIS — THE SOUL', desc: 'Circadian Salah discipline, divine study, and inner serenity.' },
    { key: 'CHA', label: 'CHA — THE CIRCLE', desc: 'Mentorship, clear dialectic, and community enablement.' },
  ];

  return (
    <div className="space-y-6">
      {/* Overview Banner: Character Identity & The Four Pillars */}
      <div className="arcane-card rounded-xl p-5 border border-[#C5A059]/30 bg-gradient-to-r from-[#14161F] via-[#0E1016] to-[#0A0B0E]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#232733]">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-cinzel text-xl sm:text-2xl font-bold text-[#F4EDE2] tracking-wider">
                THE CHARACTER CODEX
              </h2>
              <span className="px-2.5 py-0.5 rounded bg-[#C5A059]/15 border border-[#C5A059]/30 text-xs font-mono text-[#E5C378]">
                TIER {profile.level} WANDERER
              </span>
            </div>
            <p className="text-xs font-serif italic text-[#8F887C] mt-0.5">
              "The flesh is shaped by habit; the intellect by craft; the soul by devotion; the spirit by kindred."
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="p-2 rounded bg-[#0D0E14] border border-[#232733] flex items-center gap-2">
              <Sun className="w-4 h-4 text-amber-400" />
              <div>
                <span className="text-[#6D675B] block text-[10px]">SALAH STREAK</span>
                <span className="text-[#F1E8D9] font-bold">{profile.streaks.salahStreak} Days</span>
              </div>
            </div>

            <div className="p-2 rounded bg-[#0D0E14] border border-[#232733] flex items-center gap-2">
              <Flame className="w-4 h-4 text-rose-400" />
              <div>
                <span className="text-[#6D675B] block text-[10px]">WORKOUT STREAK</span>
                <span className="text-[#F1E8D9] font-bold">{profile.streaks.workoutStreak} Days</span>
              </div>
            </div>

            <div className="p-2 rounded bg-[#0D0E14] border border-[#232733] flex items-center gap-2">
              <Cpu className="w-4 h-4 text-sky-400" />
              <div>
                <span className="text-[#6D675B] block text-[10px]">CRAFT STREAK</span>
                <span className="text-[#F1E8D9] font-bold">{profile.streaks.craftStreak} Days</span>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Pillars Hexagonal Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
          {attributesList.map(({ key, desc }) => {
            const attr = profile.attributes[key];
            const theme = ATTRIBUTE_THEMES[key];
            const Icon = ATTRIBUTE_ICONS[key];

            return (
              <div
                key={key}
                onClick={() => {
                  sfx.playClick();
                  setSelectedAttr(selectedAttr === key ? 'ALL' : key);
                }}
                className={`p-3.5 rounded-lg border transition-all cursor-pointer ${
                  selectedAttr === key
                    ? `${theme.border} bg-[#181B26] ring-1 ring-[#C5A059]/30 shadow-lg`
                    : 'border-[#232734] bg-[#0E1015]/80 hover:border-[#343A4C]'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded ${theme.bg} ${theme.text}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="font-cinzel text-xs font-bold text-[#E5C378] tracking-wider">
                      {key}
                    </span>
                  </div>
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-[#161822] text-[#F3EDE2] border border-[#262A37]">
                    LVL {attr.level}
                  </span>
                </div>

                <div className="text-xs font-serif font-medium text-[#D1C9BA] mb-1">
                  {attr.title}
                </div>

                <p className="text-[11px] text-[#736D61] leading-tight mb-2.5 line-clamp-2">
                  {desc}
                </p>

                {/* Micro XP bar */}
                <div className="h-1 w-full bg-[#181A22] rounded-full overflow-hidden">
                  <div
                    className={`h-full ${theme.bg.replace('/20', '')} bg-opacity-70 transition-all`}
                    style={{ width: `${(attr.xp % 1000) / 10}%` }}
                  />
                </div>
                <div className="flex justify-between items-center text-[10px] font-mono text-[#635D52] mt-1">
                  <span>PROGRESS</span>
                  <span>{attr.xp % 1000} / 1000 XP</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Skill Constellations Tree */}
      <div className="arcane-card rounded-xl p-5 border border-[#C5A059]/25">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#232733] gap-3 mb-5">
          <div>
            <h3 className="font-cinzel text-base font-bold text-[#E5C378] tracking-wider flex items-center gap-2">
              <Trophy className="w-4 h-4 text-[#C5A059]" /> SKILL CONSTELLATIONS & ASCENSION NODES
            </h3>
            <p className="text-xs text-[#8C8578]">
              Skyrim-inspired life perk constellations. Unlock tiers through real habit milestones.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1">
            {(['ALL', 'STR', 'INT', 'WIS', 'CHA'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => {
                  sfx.playClick();
                  setSelectedAttr(filter);
                }}
                className={`px-3 py-1 rounded text-xs font-mono transition-all border ${
                  selectedAttr === filter
                    ? 'bg-[#C5A059]/20 border-[#C5A059]/50 text-[#F1E8D9]'
                    : 'bg-[#0E1015] border-[#232733] text-[#7D766A] hover:text-[#B3AA9D]'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* Constellation Nodes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSkills.map((skill) => {
            const theme = ATTRIBUTE_THEMES[skill.attribute];
            const Icon = ATTRIBUTE_ICONS[skill.attribute];

            return (
              <div
                key={skill.id}
                className={`p-4 rounded-xl border relative transition-all ${
                  skill.unlocked
                    ? 'bg-gradient-to-b from-[#181B26] to-[#0F1118] border-[#C5A059]/40 shadow-md shadow-black/50'
                    : 'bg-[#0C0E13]/80 border-[#232733] opacity-80 hover:opacity-100'
                }`}
              >
                {/* Top Badge: Tier & Attribute */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-xs font-mono">
                    <span className={`px-2 py-0.5 rounded ${theme.bg} ${theme.text} border ${theme.border} flex items-center gap-1`}>
                      <Icon className="w-3 h-3" />
                      {skill.attribute}
                    </span>
                    <span className="text-[10px] text-[#787266] uppercase">TIER {skill.tier}</span>
                  </div>

                  {skill.unlocked ? (
                    <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30">
                      <CheckCircle className="w-3 h-3" /> ATTUNED
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] font-mono text-[#8C8578] bg-[#161822] px-2 py-0.5 rounded border border-[#2B2E3C]">
                      <Lock className="w-3 h-3" /> DORMANT
                    </span>
                  )}
                </div>

                {/* Title */}
                <h4 className="font-cinzel text-sm font-bold text-[#F3EDE2] mb-1">
                  {skill.title}
                </h4>

                {/* Description */}
                <p className="text-xs font-serif text-[#999285] leading-relaxed mb-3">
                  {skill.description}
                </p>

                {/* Bonus Perk Granted */}
                <div className="p-2 rounded bg-[#0E1015] border border-[#232733] mb-3 text-xs font-mono">
                  <span className="text-[#C5A059] block text-[10px] font-bold">CONFERRED PERK:</span>
                  <span className="text-[#D6CFBE]">{skill.bonus}</span>
                </div>

                {/* Requisite & Progress */}
                <div className="pt-2 border-t border-[#1F2330] text-xs font-mono">
                  <div className="flex justify-between items-center text-[#7F796E] mb-1">
                    <span className="text-[10px]">REQUISITE:</span>
                    <span className="text-[10px] text-[#A69F91]">{skill.progressPercent}%</span>
                  </div>
                  <p className="text-[11px] text-[#A8A193] mb-2 font-serif italic">
                    "{skill.requirement}"
                  </p>

                  <div className="h-1.5 w-full bg-[#181B24] rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        skill.unlocked
                          ? 'bg-emerald-500'
                          : skill.progressPercent >= 100
                          ? 'bg-[#C5A059]'
                          : 'bg-[#404658]'
                      }`}
                      style={{ width: `${skill.progressPercent}%` }}
                    />
                  </div>

                  {!skill.unlocked && (
                    <button
                      onClick={() => {
                        sfx.playRunicHarmonic();
                        onUnlockSkill(skill.id);
                      }}
                      className="mt-3 w-full py-1.5 rounded text-xs font-cinzel font-bold tracking-wider transition-all bg-[#171A24] hover:bg-[#C5A059]/20 text-[#A69E90] hover:text-[#E5C378] border border-[#292D3D] hover:border-[#C5A059]/40 active:scale-98"
                    >
                      {skill.progressPercent >= 100 ? 'ATTUNE PERK NOW' : 'MARK REQUISITE COMPLETED'}
                    </button>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
