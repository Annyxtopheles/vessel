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

const ATTRIBUTE_ACCENTS: Record<AttributeType, { text: string; bg: string; bar: string; iconColor: string }> = {
  STR: {
    text: 'text-[#DC2626]',
    bg: 'bg-[#FDECEC]',
    bar: 'bg-[#DC2626]',
    iconColor: 'text-[#DC2626]',
  },
  INT: {
    text: 'text-[#2563EB]',
    bg: 'bg-[#EBF2FE]',
    bar: 'bg-[#2563EB]',
    iconColor: 'text-[#2563EB]',
  },
  WIS: {
    text: 'text-[#0891B2]',
    bg: 'bg-[#E6F7F9]',
    bar: 'bg-[#0891B2]',
    iconColor: 'text-[#0891B2]',
  },
  CHA: {
    text: 'text-[#16A34A]',
    bg: 'bg-[#E6F6EC]',
    bar: 'bg-[#16A34A]',
    iconColor: 'text-[#16A34A]',
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
      <div className="ship-card p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#ECECF0]">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-[15px] font-semibold text-[#111113] tracking-tight">
                Four Life Pillars & Progression
              </h2>
              <span className="ship-pill bg-[#E6F7F9] text-[#0891B2] font-semibold text-[12px]">
                Level {profile.level} Master
              </span>
            </div>
            <p className="text-[13px] text-[#6B6B76] mt-0.5">
              Cumulative character progression calculated across physical, craft, spiritual, and social disciplines
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="ship-pill bg-[#F4F4F6] text-[#6B6B76] text-[12px] font-medium">
              {skills.filter(s => s.unlocked).length} of {skills.length} Perks Attuned
            </span>
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
                className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-[#E6F7F9]/30 border-[#0891B2] shadow-xs ring-2 ring-[#0891B2]/20'
                    : 'bg-white border-[#ECECF0] hover:border-[#BCE7EB]'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-xl ${accent.bg} flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`w-4 h-4 ${accent.iconColor}`} />
                    </div>
                    <span className={`text-[12px] font-bold uppercase tracking-wider ${accent.text}`}>
                      {ATTRIBUTE_NAMES[key]}
                    </span>
                  </div>
                  <span className="ship-pill bg-[#F4F4F6] text-[#111113] font-semibold text-[11px]">
                    Lvl {attr.level}
                  </span>
                </div>

                <h4 className="text-[14px] font-semibold text-[#111113] mb-0.5">{name}</h4>
                <div className="text-[12px] text-[#6B6B76] mb-2">{subtitle}</div>
                <p className="text-[12px] text-[#6B6B76] leading-relaxed line-clamp-2 mb-4">
                  {desc}
                </p>

                {/* Progress bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] text-[#9A9AA5] font-medium">
                    <span>EXP</span>
                    <span>{attr.xp % 1000} / 1000</span>
                  </div>
                  <div className="h-1.5 w-full bg-[#ECECF0] rounded-full overflow-hidden">
                    <div
                      className={`h-full ${accent.bar} rounded-full transition-all duration-300`}
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
      <div className="ship-card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#ECECF0] gap-3 mb-5">
          <div className="flex items-center gap-3">
            <div className="ship-icon-tile">
              <Target className="w-5 h-5 text-[#0891B2]" />
            </div>
            <div>
              <h3 className="text-[15px] font-semibold text-[#111113] tracking-tight">
                Skill Milestones & Progression Trees
              </h3>
              <p className="text-[13px] text-[#6B6B76]">
                Unlock specific real-life traits as you pass consistency benchmarks
              </p>
            </div>
          </div>

          {/* Filter Pills Segmented Control */}
          <div className="inline-flex p-1 bg-[#ECECF0] rounded-xl self-start overflow-x-auto">
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
                className={`px-3.5 py-1.5 rounded-lg text-[13px] transition-all whitespace-nowrap ${
                  selectedAttr === id
                    ? 'bg-white text-[#111113] shadow-xs font-semibold'
                    : 'text-[#6B6B76] hover:text-[#111113] font-medium'
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
                className={`p-5 rounded-2xl border flex flex-col justify-between transition-all ${
                  skill.unlocked
                    ? 'bg-white border-[#ECECF0] shadow-xs'
                    : 'bg-white border-[#ECECF0] opacity-90'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold">
                      <Icon className={`w-3.5 h-3.5 ${accent.iconColor}`} />
                      <span className={accent.text}>{ATTRIBUTE_NAMES[skill.attribute]}</span>
                      <span className="text-[#9A9AA5] font-normal">• Tier {skill.tier}</span>
                    </span>

                    {skill.unlocked ? (
                      <span className="ship-pill-success text-[12px]">
                        <Check className="w-3.5 h-3.5" /> Attuned
                      </span>
                    ) : (
                      <span className="ship-pill-neutral text-[12px]">
                        <Lock className="w-3 h-3" /> Locked
                      </span>
                    )}
                  </div>

                  <h4 className="font-semibold text-[14px] text-[#111113] mb-1">
                    {skill.title}
                  </h4>
                  <p className="text-[13px] text-[#6B6B76] leading-relaxed mb-4">
                    {skill.description}
                  </p>

                  <div className="p-3 rounded-xl bg-[#F4F4F6] border border-[#ECECF0] mb-4 text-[12px]">
                    <span className="text-[#9A9AA5] font-medium block mb-0.5">Bonus Modifier:</span>
                    <span className="font-semibold text-[#0891B2]">{skill.bonus}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#ECECF0]">
                  <div className="flex justify-between items-center text-[12px] text-[#6B6B76] mb-1.5 font-medium">
                    <span className="truncate mr-2">Goal: {skill.requirement}</span>
                    <span className="text-[#111113] font-semibold">{skill.progressPercent}%</span>
                  </div>

                  <div className="h-1.5 w-full bg-[#ECECF0] rounded-full overflow-hidden mb-3">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        skill.unlocked ? accent.bar : 'bg-[#0891B2]'
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
                      className="w-full py-2 rounded-xl text-[13px] font-semibold transition-colors bg-[#0891B2] hover:bg-[#0E7490] text-white shadow-xs"
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
