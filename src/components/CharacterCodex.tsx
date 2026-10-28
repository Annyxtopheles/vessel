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
    text: 'text-[#e08279]',
    bar: 'bg-[#e08279]',
    iconColor: 'text-[#e08279]',
  },
  INT: {
    text: 'text-[#85a6cf]',
    bar: 'bg-[#85a6cf]',
    iconColor: 'text-[#85a6cf]',
  },
  WIS: {
    text: 'text-[#a5b4fc]',
    bar: 'bg-[#6366f1]',
    iconColor: 'text-[#a5b4fc]',
  },
  CHA: {
    text: 'text-[#8ebd9b]',
    bar: 'bg-[#8ebd9b]',
    iconColor: 'text-[#8ebd9b]',
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
      <div className="bg-[#12141a] border border-[#20232c] rounded-xl p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#20232c]">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-sm font-semibold text-[#f3f4f6] tracking-tight">
                Four Life Pillars & Progression
              </h2>
              <span className="linear-tag text-[#818cf8]">
                Level {profile.level} Master
              </span>
            </div>
            <p className="text-xs text-[#8a8f98] mt-0.5">
              Cumulative character progression calculated across physical, craft, spiritual, and social disciplines.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="linear-tag font-mono text-[#8a8f98]">
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
                    ? 'bg-[#181a26] border-[#444a73]'
                    : 'bg-[#0d0e12] border-[#20232c] hover:border-[#2e323e]'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-[#161822] border border-[#20232c] flex items-center justify-center">
                      <Icon className={`w-3.5 h-3.5 ${accent.iconColor}`} />
                    </div>
                    <span className={`text-[11px] font-mono uppercase tracking-wider ${accent.text}`}>
                      {ATTRIBUTE_NAMES[key]}
                    </span>
                  </div>
                  <span className="linear-tag">
                    Lvl {attr.level}
                  </span>
                </div>

                <h4 className="text-xs font-semibold text-[#f3f4f6] mb-0.5">{name}</h4>
                <div className="text-[11px] text-[#8a8f98] mb-2">{subtitle}</div>
                <p className="text-[11px] text-[#8a8f98] leading-relaxed line-clamp-2 mb-3">
                  {desc}
                </p>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-mono text-[#8a8f98]">
                    <span>EXP</span>
                    <span>{attr.xp % 1000} / 1000</span>
                  </div>
                  <div className="h-1 w-full bg-[#161822] rounded-full overflow-hidden">
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
      <div className="bg-[#12141a] border border-[#20232c] rounded-xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#20232c] gap-3 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#161824] border border-[#262a38] flex items-center justify-center text-[#818cf8]">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#f3f4f6] tracking-tight">
                Skill Milestones & Progression Trees
              </h3>
              <p className="text-xs text-[#8a8f98]">
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
                className={`px-2.5 py-1 rounded text-xs font-mono transition-colors border ${
                  selectedAttr === id
                    ? 'bg-[#1e2233] border-[#373d57] text-[#c7d2fe] font-semibold'
                    : 'bg-[#0d0e12] border-[#20232c] text-[#8a8f98] hover:text-[#f3f4f6]'
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
                    ? 'bg-[#151722] border-[#25293d]'
                    : 'bg-[#0d0e12]/60 border-[#1c1e27] opacity-80'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="linear-tag flex items-center gap-1">
                      <Icon className="w-3 h-3 text-[#8a8f98]" />
                      <span className={accent.text}>{ATTRIBUTE_NAMES[skill.attribute]}</span>
                      <span className="text-[#8a8f98]">• Tier {skill.tier}</span>
                    </span>

                    {skill.unlocked ? (
                      <span className="linear-tag flex items-center gap-1 text-[#8ebd9b] border-[#8ebd9b]/30">
                        <Check className="w-3 h-3 text-[#8ebd9b]" /> Attuned
                      </span>
                    ) : (
                      <span className="linear-tag flex items-center gap-1 text-[#8a8f98]">
                        <Lock className="w-3 h-3" /> Locked
                      </span>
                    )}
                  </div>

                  <h4 className="font-medium text-xs text-[#f3f4f6] mb-1">
                    {skill.title}
                  </h4>
                  <p className="text-xs text-[#8a8f98] leading-relaxed mb-3">
                    {skill.description}
                  </p>

                  <div className="p-2.5 rounded-lg bg-[#0d0e12] border border-[#20232c] mb-3 text-xs">
                    <span className="text-[#8a8f98] font-mono text-[10px] uppercase block mb-0.5">Bonus Modifier:</span>
                    <span className="font-mono text-[#818cf8]">{skill.bonus}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#20232c]">
                  <div className="flex justify-between items-center text-xs text-[#8a8f98] mb-1.5">
                    <span className="truncate mr-2">Goal: {skill.requirement}</span>
                    <span className="font-mono text-[#f3f4f6]">{skill.progressPercent}%</span>
                  </div>

                  <div className="h-1 w-full bg-[#0d0e12] rounded-full overflow-hidden mb-3">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        skill.unlocked ? accent.bar : 'bg-[#3b3f4d]'
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
                      className="w-full py-1.5 rounded-lg text-xs font-medium transition-colors bg-[#181a26] hover:bg-[#222738] text-[#c7d2fe] border border-[#2e334a]"
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
