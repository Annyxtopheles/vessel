import React, { useState } from 'react';
import type { CharacterProfile, SkillNode, AttributeType } from '../types';
import { ATTRIBUTE_NAMES } from '../types';
import { Cpu, Users, Flame, Check, Lock, Sun, Target } from 'lucide-react';
import { sfx } from '../utils/audio';

interface CharacterCodexProps {
  profile: CharacterProfile;
  skills: SkillNode[];
  onUnlockSkill: (skillId: string) => void;
  onUpdateProfile?: (updated: Partial<CharacterProfile>) => void;
}

const ATTRIBUTE_ICONS: Record<AttributeType, React.ComponentType<{ className?: string }>> = {
  STR: Flame,
  INT: Cpu,
  WIS: Sun,
  CHA: Users,
};

const ATTRIBUTE_ACCENTS: Record<AttributeType, { text: string; bar: string; iconColor: string }> = {
  STR: {
    text: 'text-[#f87171]',
    bar: 'bg-[#f87171]',
    iconColor: 'text-[#f87171]',
  },
  INT: {
    text: 'text-[#60a5fa]',
    bar: 'bg-[#60a5fa]',
    iconColor: 'text-[#60a5fa]',
  },
  WIS: {
    text: 'text-[#38bdf8]',
    bar: 'bg-[#0ea5e9]',
    iconColor: 'text-[#38bdf8]',
  },
  CHA: {
    text: 'text-[#34d399]',
    bar: 'bg-[#34d399]',
    iconColor: 'text-[#34d399]',
  },
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

  const attributesList: { key: AttributeType; name: string; subtitle: string; desc: string }[] = [
    { key: 'STR', name: 'Physical (Body)', subtitle: 'Movement & Posture', desc: 'Bodyweight volume, pushup & squat streaks, spinal endurance.' },
    { key: 'INT', name: 'Professional (Craft)', subtitle: 'Velocity & Focus', desc: 'Deep work focus hours, architecture, shipped production systems.' },
    { key: 'WIS', name: 'Spiritual (Soul)', subtitle: 'Salah & Stillness', desc: '5 daily prayers consistency, sacred study, inner calm (Sakinah).' },
    { key: 'CHA', name: 'Community (Social)', subtitle: 'Mentorship & Support', desc: '1-on-1 enablement sessions, team morale, clear communication.' },
  ];

  return (
    <div className="space-y-6">
      
      {/* Overview Card: Four Life Pillars */}
      <div className="bg-[#101217] border border-[#1a1d26] rounded-xl p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#181b24]">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-sm font-semibold text-white tracking-tight">
                Four Life Pillars & Progression
              </h2>
              <span className="linear-tag text-[#38bdf8] bg-[#0c1f2e] border-[#075985]/40 font-semibold">
                Level {profile.level} Master
              </span>
            </div>
            <p className="text-xs text-[#94a3b8] mt-0.5">
              Cumulative character progression calculated across physical, craft, spiritual, and social disciplines.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="linear-tag text-[#94a3b8]">
              {skills.filter(s => s.unlocked).length} of {skills.length} Perks Attuned
            </span>
          </div>
        </div>

        {/* 4 Pillars Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
          {attributesList.map(({ key, name, subtitle, desc }) => {
            const attr = profile.attributes[key];
            const accent = ATTRIBUTE_ACCENTS[key];
            const Icon = ATTRIBUTE_ICONS[key];
            const isSelected = selectedAttr === key;

            return (
              <div
                key={key}
                onClick={() => {
                  sfx.playClick();
                  setSelectedAttr(selectedAttr === key ? 'ALL' : key);
                }}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-[#0c1f2e] border-[#0ea5e9] shadow-xs'
                    : 'bg-[#0b0d12] border-[#181c24] hover:border-[#232938]'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-[#10141d] border border-[#1d222e] flex items-center justify-center">
                      <Icon className={`w-3.5 h-3.5 ${accent.iconColor}`} />
                    </div>
                    <span className={`text-[11px] uppercase tracking-wider font-semibold ${accent.text}`}>
                      {ATTRIBUTE_NAMES[key]}
                    </span>
                  </div>
                  <span className="linear-tag">
                    Lvl {attr.level}
                  </span>
                </div>

                <h4 className="text-xs font-semibold text-white mb-0.5">{name}</h4>
                <div className="text-[11px] text-[#94a3b8] mb-2">{subtitle}</div>
                <p className="text-[11px] text-[#64748b] leading-relaxed line-clamp-2 mb-3">
                  {desc}
                </p>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-[#94a3b8] font-medium">
                    <span>EXP</span>
                    <span>{attr.xp % 1000} / 1000</span>
                  </div>
                  <div className="h-1.5 w-full bg-[#121620] rounded-full overflow-hidden">
                    <div
                      className={`h-full ${accent.bar} rounded-full transition-all`}
                      style={{ width: `${(attr.xp % 1000) / 10}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Skills & Habit Milestones */}
      <div className="bg-[#101217] border border-[#1a1d26] rounded-xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#181b24] gap-3 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#0c1f2e] border border-[#075985]/50 flex items-center justify-center text-[#38bdf8]">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white tracking-tight">
                Skill Milestones & Progression Trees
              </h3>
              <p className="text-xs text-[#94a3b8]">
                Unlock specific real-life traits as you pass consistency benchmarks
              </p>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {[
              { id: 'ALL', label: 'All Attributes' },
              { id: 'STR', label: 'Strength' },
              { id: 'INT', label: 'Intellect' },
              { id: 'WIS', label: 'Wisdom' },
              { id: 'CHA', label: 'Charisma' },
            ].map(({ id, label }) => (
              <button
                key={id}
                onClick={() => {
                  sfx.playClick();
                  setSelectedAttr(id as AttributeType | 'ALL');
                }}
                className={`px-3 py-1 rounded text-xs transition-colors border font-medium ${
                  selectedAttr === id
                    ? 'bg-[#0c1f2e] border-[#075985] text-[#38bdf8] font-semibold'
                    : 'bg-[#0b0d12] border-[#181c24] text-[#94a3b8] hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Milestone Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredSkills.map((skill) => {
            const accent = ATTRIBUTE_ACCENTS[skill.attribute];
            const Icon = ATTRIBUTE_ICONS[skill.attribute];

            return (
              <div
                key={skill.id}
                className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                  skill.unlocked
                    ? 'bg-[#0e1219] border-[#1a1f2b] shadow-xs'
                    : 'bg-[#0b0d12] border-[#181c24] opacity-80'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="linear-tag flex items-center gap-1">
                      <Icon className="w-3 h-3 text-[#94a3b8]" />
                      <span className={accent.text}>{ATTRIBUTE_NAMES[skill.attribute]}</span>
                      <span className="text-[#94a3b8]">• Tier {skill.tier}</span>
                    </span>

                    {skill.unlocked ? (
                      <span className="linear-tag flex items-center gap-1 text-[#34d399] border-[#065f46]/50 bg-[#064e3b]/30 font-medium">
                        <Check className="w-3 h-3 text-[#34d399]" /> Attuned
                      </span>
                    ) : (
                      <span className="linear-tag flex items-center gap-1 text-[#64748b]">
                        <Lock className="w-3 h-3" /> Locked
                      </span>
                    )}
                  </div>

                  <h4 className="font-semibold text-xs text-white mb-1">
                    {skill.title}
                  </h4>
                  <p className="text-xs text-[#94a3b8] leading-relaxed mb-3">
                    {skill.description}
                  </p>

                  <div className="p-2.5 rounded-lg bg-[#0b0d12] border border-[#1a1d26] mb-3 text-xs">
                    <span className="text-[#64748b] text-[10px] uppercase font-semibold block mb-0.5">Bonus Modifier:</span>
                    <span className="font-semibold text-[#38bdf8]">{skill.bonus}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#181b24]">
                  <div className="flex justify-between items-center text-xs text-[#94a3b8] mb-1.5 font-medium">
                    <span className="truncate mr-2">Goal: {skill.requirement}</span>
                    <span className="text-white">{skill.progressPercent}%</span>
                  </div>

                  <div className="h-1.5 w-full bg-[#121620] rounded-full overflow-hidden mb-3">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        skill.unlocked ? accent.bar : 'bg-[#334155]'
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
                      className="w-full py-1.5 rounded-lg text-xs font-semibold transition-colors bg-[#0284c7] hover:bg-[#0369a1] text-white shadow-xs"
                    >
                      {skill.progressPercent >= 100 ? 'Claim Perk' : 'Mark Requirement Complete'}
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
