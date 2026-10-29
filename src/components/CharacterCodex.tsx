import React, { useState } from 'react';
import type {
  CharacterProfile,
  SkillNode,
  AttributeType,
  DayRecord,
  XpEvent,
  BodyMeasurement,
  CharacterAppearance,
  PaletteColor,
  PersonalityEntry,
  CharacterTrait,
  AppSettings,
} from '../types';
import { ATTRIBUTE_NAMES } from '../types';
import { Cpu, Users, Flame, Check, Lock, Sun, Target, ExternalLink, FileText, X, Scale } from 'lucide-react';
import { sfx } from '../utils/audio';
import {
  derivePillarXp,
  deriveTotalXp,
  getPillarLevelProgress,
  getOverallLevelProgress,
} from '../data/xpConfig';
import { StatSheetView } from './StatSheetView';

interface CharacterCodexProps {
  profile: CharacterProfile;
  skills: SkillNode[];
  dayRecords: Record<string, DayRecord>;
  xpEvents: XpEvent[];
  onUnlockSkill: (skillId: string, evidence?: { note: string; url?: string }) => void;
  onUpdateProfile?: (updated: Partial<CharacterProfile>) => void;
  measurements?: BodyMeasurement[];
  appearance?: CharacterAppearance;
  palette?: PaletteColor[];
  personality?: PersonalityEntry[];
  traits?: CharacterTrait[];
  settings?: AppSettings;
  privacyMode?: boolean;
  onAddMeasurement?: (m: Omit<BodyMeasurement, 'id'>) => void;
  onDeleteMeasurement?: (id: string) => void;
  onUpdateAppearance?: (app: CharacterAppearance) => void;
  onAddPaletteColor?: (p: Omit<PaletteColor, 'id'>) => void;
  onUpdatePaletteColor?: (p: PaletteColor) => void;
  onDeletePaletteColor?: (id: string) => void;
  onAddPersonality?: (p: Omit<PersonalityEntry, 'id'>) => void;
  onDeletePersonality?: (id: string) => void;
  onAddTrait?: (t: Omit<CharacterTrait, 'id'>) => void;
  onDeleteTrait?: (id: string) => void;
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

function computeSkillProgress(
  skill: SkillNode,
  dayRecords: Record<string, DayRecord>,
  _xpEvents: XpEvent[]
): {
  progressPercent: number;
  hasDataSource: boolean;
  sourceLabel?: string;
  isMet: boolean;
} {
  const records = Object.values(dayRecords);

  if (skill.id === 'skill-str-1') {
    // 100 total pushups logged
    const totalPushups = records.reduce((s, r) => s + (r.pushups || 0), 0);
    const percent = Math.min(100, Math.round((totalPushups / 100) * 100));
    return {
      progressPercent: percent,
      hasDataSource: true,
      sourceLabel: `Logged: ${totalPushups} / 100 pushups`,
      isMet: totalPushups >= 100,
    };
  }

  if (skill.id === 'skill-str-2') {
    // Log 5 workouts in a single week / logged days
    const totalWorkouts = records.filter(
      (r) => r.workoutCompleted || (r.pushups >= 50 || r.squats >= 50)
    ).length;
    const percent = Math.min(100, Math.round((totalWorkouts / 5) * 100));
    return {
      progressPercent: percent,
      hasDataSource: true,
      sourceLabel: `Logged: ${totalWorkouts} / 5 workouts`,
      isMet: totalWorkouts >= 5,
    };
  }

  if (skill.id === 'skill-str-3') {
    // 1,000 pushups
    const totalPushups = records.reduce((s, r) => s + (r.pushups || 0), 0);
    const percent = Math.min(100, Math.round((totalPushups / 1000) * 100));
    return {
      progressPercent: percent,
      hasDataSource: true,
      sourceLabel: `Logged: ${totalPushups} / 1,000 pushups`,
      isMet: totalPushups >= 1000,
    };
  }

  if (skill.id === 'skill-int-2') {
    // 50 hours of deep work (3000 min)
    const totalMins = records.reduce((s, r) => s + (r.deepWorkMinutes || 0), 0);
    const hours = Math.round((totalMins / 60) * 10) / 10;
    const percent = Math.min(100, Math.round((totalMins / 3000) * 100));
    return {
      progressPercent: percent,
      hasDataSource: true,
      sourceLabel: `Logged: ${hours} / 50.0 hrs`,
      isMet: totalMins >= 3000,
    };
  }

  if (skill.id === 'skill-wis-1') {
    // Complete all 5 prayers for 7 logged days
    const perfectSalahDays = records.filter(
      (r) => Object.values(r.salah).filter(Boolean).length === 5
    ).length;
    const percent = Math.min(100, Math.round((perfectSalahDays / 7) * 100));
    return {
      progressPercent: percent,
      hasDataSource: true,
      sourceLabel: `Logged: ${perfectSalahDays} / 7 perfect days`,
      isMet: perfectSalahDays >= 7,
    };
  }

  // Fallback: manual requirement with no automated data source
  return {
    progressPercent: skill.unlocked ? 100 : (skill.progressPercent || 0),
    hasDataSource: false,
    sourceLabel: undefined,
    isMet: skill.unlocked,
  };
}

export const CharacterCodex: React.FC<CharacterCodexProps> = ({
  skills,
  dayRecords,
  xpEvents,
  onUnlockSkill,
  measurements = [],
  appearance = {
    skinToneHex: '#D7A781',
    skinToneNote: 'Warm golden olive undertones',
    hair: 'Dark Espresso Brown, medium textured crop',
    eyeColor: 'Deep Hazel / Amber',
  },
  palette = [],
  personality = [],
  traits = [],
  settings = { currencySymbol: '$', maxEncumbranceKg: 12.0, unitSystem: 'metric' },
  privacyMode = false,
  onAddMeasurement = () => {},
  onDeleteMeasurement = () => {},
  onUpdateAppearance = () => {},
  onAddPaletteColor = () => {},
  onUpdatePaletteColor = () => {},
  onDeletePaletteColor = () => {},
  onAddPersonality = () => {},
  onDeletePersonality = () => {},
  onAddTrait = () => {},
  onDeleteTrait = () => {},
}) => {
  const [codexSubTab, setCodexSubTab] = useState<'pillars' | 'stats'>('pillars');
  const [selectedAttr, setSelectedAttr] = useState<AttributeType | 'ALL'>('ALL');
  const [evidenceModalSkill, setEvidenceModalSkill] = useState<SkillNode | null>(null);
  const [evidenceNote, setEvidenceNote] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');

  // DERIVE ALL LEVELS & XP DIRECTLY FROM APPEND-ONLY EVENT LOG
  const totalXp = deriveTotalXp(xpEvents);
  const overallProgress = getOverallLevelProgress(totalXp);

  const strXp = derivePillarXp(xpEvents, 'STR');
  const intXp = derivePillarXp(xpEvents, 'INT');
  const wisXp = derivePillarXp(xpEvents, 'WIS');
  const chaXp = derivePillarXp(xpEvents, 'CHA');

  const strProgress = getPillarLevelProgress(strXp);
  const intProgress = getPillarLevelProgress(intXp);
  const wisProgress = getPillarLevelProgress(wisXp);
  const chaProgress = getPillarLevelProgress(chaXp);

  const pillarData: Record<AttributeType, { xp: number; progress: typeof strProgress }> = {
    STR: { xp: strXp, progress: strProgress },
    INT: { xp: intXp, progress: intProgress },
    WIS: { xp: wisXp, progress: wisProgress },
    CHA: { xp: chaXp, progress: chaProgress },
  };

  const filteredSkills = skills.filter(
    (skill) => selectedAttr === 'ALL' || skill.attribute === selectedAttr
  );

  const attributesList: { key: AttributeType; name: string; subtitle: string; desc: string }[] = [
    {
      key: 'STR',
      name: 'Physical (Body)',
      subtitle: 'Movement & Posture',
      desc: 'Bodyweight volume, pushup & squat streaks, spinal endurance.',
    },
    {
      key: 'INT',
      name: 'Professional (Craft)',
      subtitle: 'Velocity & Focus',
      desc: 'Deep work focus hours, architecture, shipped production systems.',
    },
    {
      key: 'WIS',
      name: 'Spiritual (Soul)',
      subtitle: 'Salah & Stillness',
      desc: '5 daily prayers consistency, sacred study, inner calm (Sakinah).',
    },
    {
      key: 'CHA',
      name: 'Community (Social)',
      subtitle: 'Mentorship & Support',
      desc: '1-on-1 enablement sessions, team morale, clear communication.',
    },
  ];

  const handleOpenEvidenceModal = (skill: SkillNode) => {
    sfx.playClick();
    setEvidenceModalSkill(skill);
    setEvidenceNote(skill.evidenceNote || '');
    setEvidenceUrl(skill.evidenceUrl || '');
  };

  const handleConfirmEvidence = (e: React.FormEvent) => {
    e.preventDefault();
    if (!evidenceModalSkill || !evidenceNote.trim()) return;

    sfx.playRunicHarmonic();
    onUnlockSkill(evidenceModalSkill.id, {
      note: evidenceNote.trim(),
      url: evidenceUrl.trim() || undefined,
    });
    setEvidenceModalSkill(null);
    setEvidenceNote('');
    setEvidenceUrl('');
  };

  return (
    <div className="space-y-6">
      {/* Unified Header Row: Title & Sub-tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#111113] tracking-tight">
            Character Codex
          </h2>
        </div>

        <div className="inline-flex p-1 bg-[#ECECF0] rounded-xl self-start sm:self-auto shrink-0">
          <button
            type="button"
            onClick={() => {
              sfx.playClick();
              setCodexSubTab('pillars');
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              codexSubTab === 'pillars'
                ? 'bg-white text-[#111113] shadow-xs'
                : 'text-[#6B6B76] hover:text-[#111113]'
            }`}
          >
            <Target className="w-3.5 h-3.5 text-[#0891B2]" />
            <span>Pillars & Perks</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sfx.playClick();
              setCodexSubTab('stats');
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              codexSubTab === 'stats'
                ? 'bg-white text-[#111113] shadow-xs'
                : 'text-[#6B6B76] hover:text-[#111113]'
            }`}
          >
            <Scale className="w-3.5 h-3.5 text-[#0891B2]" />
            <span>Stat Sheet</span>
          </button>
        </div>
      </div>

      {codexSubTab === 'stats' ? (
        <StatSheetView
          measurements={measurements}
          appearance={appearance}
          palette={palette}
          personality={personality}
          traits={traits}
          settings={settings}
          privacyMode={privacyMode}
          onAddMeasurement={onAddMeasurement}
          onDeleteMeasurement={onDeleteMeasurement}
          onUpdateAppearance={onUpdateAppearance}
          onAddPaletteColor={onAddPaletteColor}
          onUpdatePaletteColor={onUpdatePaletteColor}
          onDeletePaletteColor={onDeletePaletteColor}
          onAddPersonality={onAddPersonality}
          onDeletePersonality={onDeletePersonality}
          onAddTrait={onAddTrait}
          onDeleteTrait={onDeleteTrait}
        />
      ) : (
        <>
          {/* Overview Card: Four Life Pillars */}
          <div className="ship-card p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#ECECF0]">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-[15px] font-semibold text-[#111113] tracking-tight">
                Four Life Pillars & Progression
              </h2>
              <span className="ship-pill-accent font-semibold">
                Level {overallProgress.level} Master ({totalXp.toLocaleString()} Total XP)
              </span>
            </div>
            <p className="text-[13px] text-[#6B6B76] mt-0.5">
              Pillar levels are derived purely from append-only verified discipline event logs
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="ship-pill-neutral">
              {skills.filter((s) => s.unlocked).length} of {skills.length} Perks Attuned
            </span>
          </div>
        </div>

        {/* 4 Pillars Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
          {attributesList.map(({ key, name, subtitle, desc }) => {
            const data = pillarData[key];
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
                    Lvl {data.progress.level}
                  </span>
                </div>

                <h4 className="text-[14px] font-semibold text-[#111113] mb-0.5">{name}</h4>
                <div className="text-[12px] text-[#6B6B76] mb-2">{subtitle}</div>
                <p className="text-[12px] text-[#6B6B76] leading-relaxed line-clamp-2 mb-4">
                  {desc}
                </p>

                {/* Progress bar derived from XP events */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] text-[#9A9AA5] font-medium">
                    <span>CUMULATIVE EXP</span>
                    <span>
                      {data.xp.toLocaleString()} / {data.progress.xpNeededForNext.toLocaleString()}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-[#ECECF0] rounded-full overflow-hidden">
                    <div
                      className={`h-full ${accent.bar} rounded-full transition-all duration-300`}
                      style={{ width: `${data.progress.progressPercent}%` }}
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
                Objective traits unlocked automatically through logged data or verified evidence
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
                className={`px-3.5 py-1.5 rounded-lg text-[13px] transition-all whitespace-nowrap cursor-pointer ${
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
            const derived = computeSkillProgress(skill, dayRecords, xpEvents);
            const displayPercent = skill.unlocked ? 100 : derived.progressPercent;

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

                  <div className="p-3 rounded-xl bg-[#F4F4F6] border border-[#ECECF0] mb-3 text-[12px]">
                    <span className="text-[#9A9AA5] font-medium block mb-0.5">Bonus Modifier:</span>
                    <span className="font-semibold text-[#0891B2]">{skill.bonus}</span>
                  </div>

                  {/* Evidence note quote if unlocked with evidence */}
                  {skill.evidenceNote && (
                    <div className="p-2.5 rounded-xl bg-[#E6F7F9]/50 border border-[#BCE7EB] mb-3 text-[11px] text-[#0891B2]">
                      <span className="font-semibold block mb-0.5 flex items-center gap-1">
                        <FileText className="w-3 h-3" /> Verified Evidence:
                      </span>
                      <span className="italic">{skill.evidenceNote}</span>
                      {skill.evidenceUrl && (
                        <a
                          href={skill.evidenceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1 flex items-center gap-1 underline font-semibold"
                        >
                          View Link <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-[#ECECF0]">
                  <div className="flex justify-between items-center text-[12px] text-[#6B6B76] mb-1.5 font-medium">
                    <span className="truncate mr-2">
                      {derived.sourceLabel ? derived.sourceLabel : `Goal: ${skill.requirement}`}
                    </span>
                    <span className="text-[#111113] font-semibold">{displayPercent}%</span>
                  </div>

                  <div className="h-1.5 w-full bg-[#ECECF0] rounded-full overflow-hidden mb-3">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        skill.unlocked ? accent.bar : 'bg-[#0891B2]'
                      }`}
                      style={{ width: `${displayPercent}%` }}
                    />
                  </div>

                  {!skill.unlocked && (
                    <>
                      {derived.hasDataSource ? (
                        derived.isMet ? (
                          <button
                            onClick={() => {
                              sfx.playRunicHarmonic();
                              onUnlockSkill(skill.id);
                            }}
                            className="w-full py-2 rounded-xl text-[13px] font-semibold transition-colors bg-[#0891B2] hover:bg-[#0E7490] text-white shadow-xs cursor-pointer"
                          >
                            Claim Perk (+150 XP)
                          </button>
                        ) : (
                          <div className="w-full py-2 rounded-xl text-[12px] font-semibold text-center bg-[#F4F4F6] text-[#9A9AA5] border border-[#ECECF0]">
                            In Progress ({derived.sourceLabel})
                          </div>
                        )
                      ) : (
                        <button
                          onClick={() => handleOpenEvidenceModal(skill)}
                          className="w-full py-2 rounded-xl text-[13px] font-semibold transition-colors bg-white hover:bg-[#F4F4F6] border border-[#ECECF0] text-[#111113] shadow-xs cursor-pointer"
                        >
                          Mark Requirement Complete
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      </>
      )}

      {/* Evidence Submission Modal for Manual Requirements */}
      {evidenceModalSkill && (
        <div
          onClick={() => setEvidenceModalSkill(null)}
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-white border border-[#ECECF0] rounded-2xl shadow-xl p-6 cursor-default animate-in fade-in zoom-in-95"
          >
            <div className="flex items-center justify-between pb-4 border-b border-[#ECECF0] mb-4">
              <div>
                <h3 className="text-base font-semibold text-[#111113]">
                  Attune Perk: {evidenceModalSkill.title}
                </h3>
                <p className="text-xs text-[#6B6B76] mt-0.5">
                  Requirement: {evidenceModalSkill.requirement}
                </p>
              </div>
              <button
                onClick={() => setEvidenceModalSkill(null)}
                className="p-1.5 rounded-lg text-[#6B6B76] hover:text-[#111113] hover:bg-[#F4F4F6]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmEvidence} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#6B6B76] uppercase tracking-wider mb-1.5">
                  Evidence Note / Verification (Required)
                </label>
                <textarea
                  rows={3}
                  required
                  value={evidenceNote}
                  onChange={(e) => setEvidenceNote(e.target.value)}
                  placeholder="Describe your achievement, shipped milestone, or reflection proof..."
                  className="ship-input w-full px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6B6B76] uppercase tracking-wider mb-1.5">
                  Evidence URL / Reference Link (Optional)
                </label>
                <input
                  type="url"
                  value={evidenceUrl}
                  onChange={(e) => setEvidenceUrl(e.target.value)}
                  placeholder="https://github.com/... or PR link, live URL"
                  className="ship-input w-full px-3 py-2 text-sm"
                />
              </div>

              <div className="pt-4 border-t border-[#ECECF0] flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEvidenceModalSkill(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#6B6B76] hover:bg-[#F4F4F6]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-[#0891B2] hover:bg-[#0E7490] text-white shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Attune Perk & Claim +150 XP</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
