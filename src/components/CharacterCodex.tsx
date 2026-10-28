import React, { useState } from 'react';
import type { CharacterProfile, SkillNode, AttributeType } from '../types';
import { ATTRIBUTE_NAMES } from '../types';
import { Cpu, Users, Flame, Check, Lock, Sun, Target, Edit3 } from 'lucide-react';
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
    text: 'text-[#d8b46b]',
    bar: 'bg-[#d8b46b]',
    iconColor: 'text-[#d8b46b]',
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
  onUpdateProfile,
}) => {
  const [selectedAttr, setSelectedAttr] = useState<AttributeType | 'ALL'>('ALL');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [nameVal, setNameVal] = useState(profile.name);
  const [titleVal, setTitleVal] = useState(profile.title);

  const handleSaveProfile = () => {
    sfx.playClick();
    if (onUpdateProfile && nameVal.trim()) {
      onUpdateProfile({ name: nameVal.trim(), title: titleVal.trim() || 'Wanderer' });
    }
    setIsEditingProfile(false);
  };

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
      <div className="bg-[#12141a] border border-[#20232c] rounded-xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-[#20232c]">
          <div>
            {isEditingProfile ? (
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <input
                  type="text"
                  value={nameVal}
                  onChange={(e) => setNameVal(e.target.value)}
                  placeholder="Your Name"
                  className="px-2.5 py-1 bg-[#0d0e12] border border-[#20232c] rounded-md text-sm font-semibold text-[#f3f4f6] focus:outline-none focus:border-[#d8b46b]"
                />
                <input
                  type="text"
                  value={titleVal}
                  onChange={(e) => setTitleVal(e.target.value)}
                  placeholder="Character Title"
                  className="px-2.5 py-1 bg-[#0d0e12] border border-[#20232c] rounded-md text-xs text-[#8a8f98] focus:outline-none focus:border-[#d8b46b]"
                />
                <button
                  onClick={handleSaveProfile}
                  className="px-3 py-1 bg-[#d8b46b] text-[#0d0e12] text-xs font-semibold rounded-md hover:bg-[#c5a059]"
                >
                  Save
                </button>
                <button
                  onClick={() => setIsEditingProfile(false)}
                  className="px-2.5 py-1 bg-[#161822] text-[#8a8f98] text-xs rounded-md hover:text-[#f3f4f6]"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-semibold text-[#f3f4f6] tracking-tight">
                  {profile.name} — <span className="text-[#8a8f98] font-normal">{profile.title}</span>
                </h2>
                <button
                  onClick={() => {
                    setNameVal(profile.name);
                    setTitleVal(profile.title);
                    setIsEditingProfile(true);
                  }}
                  className="p-1 text-[#8a8f98] hover:text-[#f3f4f6] rounded hover:bg-[#161822] transition-colors"
                  title="Edit character identity"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <span className="linear-tag text-[#d8b46b]">
                  Lvl {profile.level}
                </span>
              </div>
            )}
            <p className="text-xs text-[#8a8f98] mt-1">
              Overall character progression calculated across physical, professional, spiritual, and social disciplines.
            </p>
          </div>

          {/* Streaks Banner */}
          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 rounded-lg bg-[#0d0e12] border border-[#20232c] text-center">
              <span className="block text-[10px] uppercase font-mono text-[#8a8f98]">Salah Streak</span>
              <span className="text-xs font-semibold text-[#d8b46b] font-mono">{profile.streaks.salahStreak} Days</span>
            </div>

            <div className="px-3 py-1.5 rounded-lg bg-[#0d0e12] border border-[#20232c] text-center">
              <span className="block text-[10px] uppercase font-mono text-[#8a8f98]">Workout Streak</span>
              <span className="text-xs font-semibold text-[#e08279] font-mono">{profile.streaks.workoutStreak} Days</span>
            </div>

            <div className="px-3 py-1.5 rounded-lg bg-[#0d0e12] border border-[#20232c] text-center">
              <span className="block text-[10px] uppercase font-mono text-[#8a8f98]">Craft Streak</span>
              <span className="text-xs font-semibold text-[#85a6cf] font-mono">{profile.streaks.craftStreak} Days</span>
            </div>
          </div>
        </div>

        {/* 4 Pillars Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-5">
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
                    ? 'bg-[#161822] border-[#d8b46b]/60'
                    : 'bg-[#0d0e12]/70 border-[#20232c] hover:border-[#2e323e]'
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
      <div className="bg-[#12141a] border border-[#20232c] rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#20232c] gap-3 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#161822] border border-[#20232c] flex items-center justify-center text-[#d8b46b]">
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
                    ? 'bg-[#1c1f29] border-[#363a49] text-[#f3f4f6]'
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
                    ? 'bg-[#15171f] border-[#20232c]'
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
                    <span className="font-mono text-[#d8b46b]">{skill.bonus}</span>
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
                      className="w-full py-1.5 rounded-lg text-xs font-medium transition-colors bg-[#161822] hover:bg-[#202330] text-[#f3f4f6] border border-[#20232c]"
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
