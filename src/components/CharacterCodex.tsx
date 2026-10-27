import React, { useState } from 'react';
import type { CharacterProfile, SkillNode, AttributeType } from '../types';
import { ATTRIBUTE_NAMES } from '../types';
import { Cpu, Users, Flame, Check, Lock, Sun, Target } from 'lucide-react';
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

const ATTRIBUTE_ACCENTS: Record<AttributeType, { badge: string; text: string; bar: string; iconColor: string }> = {
  STR: {
    badge: 'bg-[#271a1c] text-[#df8276] border-[#44282c]',
    text: 'text-[#df8276]',
    bar: 'bg-[#b85d52]',
    iconColor: 'text-[#df8276]',
  },
  INT: {
    badge: 'bg-[#15202c] text-[#86a6cf] border-[#253549]',
    text: 'text-[#86a6cf]',
    bar: 'bg-[#5b7fa8]',
    iconColor: 'text-[#86a6cf]',
  },
  WIS: {
    badge: 'bg-[#272115] text-[#d8b46b] border-[#463821]',
    text: 'text-[#d8b46b]',
    bar: 'bg-[#b8944d]',
    iconColor: 'text-[#d8b46b]',
  },
  CHA: {
    badge: 'bg-[#1a251e] text-[#93bfa0] border-[#2a3e30]',
    text: 'text-[#93bfa0]',
    bar: 'bg-[#679976]',
    iconColor: 'text-[#93bfa0]',
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
      
      {/* Overview Card: Character Status & Streaks */}
      <div className="ui-card p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-[#23262f]">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-bold text-white tracking-tight">
                {profile.name} — {profile.title}
              </h2>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#e5b869]/10 text-[#e5b869] border border-[#e5b869]/20">
                Level {profile.level}
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              Overall character progression calculated across physical, professional, spiritual, and social habits.
            </p>
          </div>

          {/* Streaks Banner */}
          <div className="flex items-center gap-2.5">
            <div className="px-3.5 py-1.5 rounded-lg bg-[#14161c] border border-[#232733] text-center">
              <span className="block text-[10px] uppercase font-medium text-neutral-400">Salah Streak</span>
              <span className="text-sm font-semibold text-[#d8b46b] font-mono">{profile.streaks.salahStreak} Days</span>
            </div>

            <div className="px-3.5 py-1.5 rounded-lg bg-[#14161c] border border-[#232733] text-center">
              <span className="block text-[10px] uppercase font-medium text-neutral-400">Workout Streak</span>
              <span className="text-sm font-semibold text-[#df8276] font-mono">{profile.streaks.workoutStreak} Days</span>
            </div>

            <div className="px-3.5 py-1.5 rounded-lg bg-[#14161c] border border-[#232733] text-center">
              <span className="block text-[10px] uppercase font-medium text-neutral-400">Craft Streak</span>
              <span className="text-sm font-semibold text-[#86a6cf] font-mono">{profile.streaks.craftStreak} Days</span>
            </div>
          </div>
        </div>

        {/* 4 Pillars Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
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
                    ? 'bg-[#181b22] border-[#c5a059]/60 shadow-md ring-1 ring-[#c5a059]/30'
                    : 'bg-[#111317] border-[#20232b] hover:border-[#2f333f]'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-md ${accent.badge}`}>
                      <Icon className={`w-4 h-4 ${accent.iconColor}`} />
                    </div>
                    <span className={`text-xs font-semibold uppercase tracking-wider ${accent.text}`}>
                      {ATTRIBUTE_NAMES[key]}
                    </span>
                  </div>
                  <span className="text-xs font-medium px-2 py-0.5 rounded bg-[#181a20] text-neutral-400 border border-[#262933]">
                    Lvl {attr.level}
                  </span>
                </div>

                <h4 className="text-sm font-semibold text-white mb-0.5">{name}</h4>
                <div className="text-xs text-neutral-400 mb-2">{subtitle}</div>
                <p className="text-xs text-neutral-400 leading-relaxed line-clamp-2 mb-3">
                  {desc}
                </p>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-mono text-neutral-500">
                    <span>XP</span>
                    <span>{attr.xp % 1000} / 1000</span>
                  </div>
                  <div className="h-1.5 w-full bg-[#181a20] rounded-full overflow-hidden">
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
      <div className="ui-card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#23262f] gap-3 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[#1c1f26] border border-[#2b2e38] text-[#e5b869]">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                Skill Milestones & Progression Trees
              </h3>
              <p className="text-xs text-neutral-400">
                Unlock specific real-life traits as you pass consistency benchmarks
              </p>
            </div>
          </div>

          {/* Filter Pills with Full Clear Names */}
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
                className={`px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors border ${
                  selectedAttr === id
                    ? 'bg-[#22252e] border-[#343844] text-white font-semibold'
                    : 'bg-[#101216] border-[#20232b] text-neutral-400 hover:text-neutral-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Milestone Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSkills.map((skill) => {
            const accent = ATTRIBUTE_ACCENTS[skill.attribute];
            const Icon = ATTRIBUTE_ICONS[skill.attribute];

            return (
              <div
                key={skill.id}
                className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                  skill.unlocked
                    ? 'bg-[#15171d] border-[#2d313d]'
                    : 'bg-[#101216] border-[#1f2229] opacity-85'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border flex items-center gap-1 ${accent.badge}`}>
                      <Icon className="w-3 h-3" />
                      {ATTRIBUTE_NAMES[skill.attribute]} • Tier {skill.tier}
                    </span>

                    {skill.unlocked ? (
                      <span className="flex items-center gap-1.5 text-[11px] font-medium text-[#93bfa0] bg-[#1a251e] px-2.5 py-0.5 rounded-full border border-[#2a3e30]">
                        <Check className="w-3 h-3 text-[#93bfa0]" /> Attuned
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[11px] font-medium text-neutral-400 bg-[#16181f] px-2.5 py-0.5 rounded-full border border-[#262933]">
                        <Lock className="w-3 h-3" /> Locked
                      </span>
                    )}
                  </div>

                  <h4 className="font-semibold text-sm text-white mb-1">
                    {skill.title}
                  </h4>
                  <p className="text-xs text-neutral-400 leading-relaxed mb-3">
                    {skill.description}
                  </p>

                  <div className="p-2.5 rounded-lg bg-[#0e1014] border border-[#1d2027] mb-3 text-xs">
                    <span className="text-neutral-500 font-semibold block text-[10px] uppercase mb-0.5">Bonus Modifier:</span>
                    <span className="font-medium text-[#d8b46b]">{skill.bonus}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#1f2229]">
                  <div className="flex justify-between items-center text-xs text-neutral-400 mb-1.5">
                    <span className="truncate mr-2 font-medium">Goal: {skill.requirement}</span>
                    <span className="font-mono text-neutral-300">{skill.progressPercent}%</span>
                  </div>

                  <div className="h-1.5 w-full bg-[#181a20] rounded-full overflow-hidden mb-3">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        skill.unlocked ? accent.bar : 'bg-neutral-600'
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
                      className="w-full py-1.5 rounded-lg text-xs font-semibold transition-colors bg-[#1c1f26] hover:bg-[#252832] text-neutral-200 border border-[#2b2e38]"
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
