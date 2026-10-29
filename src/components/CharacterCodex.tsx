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
import { ExternalLink, X } from 'lucide-react';
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

const ATTRIBUTE_ACCENTS: Record<AttributeType, { text: string; bg: string; bar: string; border: string }> = {
  STR: {
    text: 'text-[#9C3D2A]',
    bg: 'bg-[#F6F2EA]',
    bar: 'bg-[#9C3D2A]',
    border: 'border-[#9C3D2A]/30',
  },
  INT: {
    text: 'text-[#2D4A6B]',
    bg: 'bg-[#F6F2EA]',
    bar: 'bg-[#2D4A6B]',
    border: 'border-[#2D4A6B]/30',
  },
  WIS: {
    text: 'text-[#7A5C1E]',
    bg: 'bg-[#F6F2EA]',
    bar: 'bg-[#7A5C1E]',
    border: 'border-[#7A5C1E]/30',
  },
  CHA: {
    text: 'text-[#3F6B4F]',
    bg: 'bg-[#F6F2EA]',
    bar: 'bg-[#3F6B4F]',
    border: 'border-[#3F6B4F]/30',
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
    id: 'default_appearance',
    skinToneHex: '#D7A781',
    skinToneNote: 'Warm golden olive undertones',
    hair: 'Dark Espresso Brown, medium textured crop',
    eyeColor: 'Deep Hazel / Amber',
  },
  palette = [],
  personality = [],
  traits = [],
  settings = { id: 'default_settings', currencySymbol: '৳', numberGrouping: 'bangladeshi', unitSystem: 'metric' },
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
      desc: '5 daily prayers consistency, sacred study, inner calm.',
    },
    {
      key: 'CHA',
      name: 'Community (Social)',
      subtitle: 'Mentorship & Support',
      desc: 'Enablement sessions, team alignment, clear communication.',
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
      {/* Unified Header Row: Sub-tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E4DED2]">
        <div className="flex items-center gap-2.5">
          <h2 className="font-serif text-[20px] font-normal text-[#1F1B16]">
            Character
          </h2>
          <span className="text-[12px] tabular-nums text-[#6B645A] px-2 py-0.5 rounded-[4px] bg-[#EFEAE0] border border-[#E4DED2]">
            Level {overallProgress.level} · {totalXp.toLocaleString()} XP
          </span>
        </div>

        <div className="inline-flex p-0.5 bg-[#EFEAE0] rounded-[6px] border border-[#E4DED2] self-start sm:self-auto shrink-0">
          <button
            type="button"
            onClick={() => {
              sfx.playClick();
              setCodexSubTab('pillars');
            }}
            className={`px-3 py-1 rounded-[4px] text-[13px] font-medium transition-colors cursor-pointer ${
              codexSubTab === 'pillars'
                ? 'bg-[#FBF9F4] text-[#1F1B16] border border-[#E4DED2]'
                : 'text-[#6B645A] hover:text-[#1F1B16]'
            }`}
          >
            Pillars
          </button>

          <button
            type="button"
            onClick={() => {
              sfx.playClick();
              setCodexSubTab('stats');
            }}
            className={`px-3 py-1 rounded-[4px] text-[13px] font-medium transition-colors cursor-pointer ${
              codexSubTab === 'stats'
                ? 'bg-[#FBF9F4] text-[#1F1B16] border border-[#E4DED2]'
                : 'text-[#6B645A] hover:text-[#1F1B16]'
            }`}
          >
            Stat Sheet
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
        <div className="space-y-8">
          {/* Section: Four Life Pillars */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-[18px] font-normal text-[#1F1B16]">
                Life Pillars
              </h3>
              <span className="text-[12px] tabular-nums text-[#6B645A]">
                {skills.filter((s) => s.unlocked).length} of {skills.length} Milestones Achieved
              </span>
            </div>

            {/* 4 Pillars Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {attributesList.map(({ key, name, subtitle, desc }) => {
                const data = pillarData[key];
                const accent = ATTRIBUTE_ACCENTS[key];
                const isSelected = selectedAttr === key;

                return (
                  <div
                    key={key}
                    onClick={() => {
                      sfx.playClick();
                      setSelectedAttr(selectedAttr === key ? 'ALL' : key);
                    }}
                    className={`p-4 rounded-[6px] border cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-[#FBF9F4] border-[#1F1B16]'
                        : 'bg-[#FBF9F4] border-[#E4DED2] hover:border-[#1F1B16]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-[11px] font-medium uppercase tracking-wider ${accent.text}`}>
                        {ATTRIBUTE_NAMES[key]}
                      </span>
                      <span className="text-[11px] tabular-nums font-medium text-[#6B645A] px-1.5 py-0.5 rounded-[4px] bg-[#EFEAE0] border border-[#E4DED2]">
                        Lvl {data.progress.level}
                      </span>
                    </div>

                    <h4 className="font-serif text-[16px] font-normal text-[#1F1B16] mb-0.5">{name}</h4>
                    <div className="text-[12px] text-[#6B645A] mb-2">{subtitle}</div>
                    <p className="text-[12px] text-[#6B645A] leading-relaxed line-clamp-2 mb-3">
                      {desc}
                    </p>

                    {/* Progress bar derived from XP events */}
                    <div className="space-y-1 pt-1 border-t border-[#E4DED2]">
                      <div className="flex justify-between text-[11px] tabular-nums text-[#6B645A]">
                        <span>EXP</span>
                        <span>
                          {data.xp.toLocaleString()} / {data.progress.xpNeededForNext.toLocaleString()}
                        </span>
                      </div>
                      <div className="h-1 w-full bg-[#E4DED2] rounded-full overflow-hidden">
                        <div
                          className={`h-full ${accent.bar} transition-all duration-300`}
                          style={{ width: `${data.progress.progressPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Section: Milestones & Progression */}
          <section className="space-y-4 pt-6 border-t border-[#E4DED2]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-serif text-[18px] font-normal text-[#1F1B16]">
                  Milestones
                </h3>
              </div>

              {/* Filter Pills Segmented Control */}
              <div className="flex items-center gap-1.5 overflow-x-auto text-[13px]">
                {[
                  { id: 'ALL', label: 'All' },
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
                    className={`px-2.5 py-1 rounded-[6px] border text-xs transition-colors whitespace-nowrap cursor-pointer ${
                      selectedAttr === id
                        ? 'bg-[#FBF9F4] border-[#1F1B16] text-[#1F1B16] font-medium'
                        : 'bg-[#FBF9F4] border-[#E4DED2] text-[#6B645A] hover:text-[#1F1B16]'
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
                const derived = computeSkillProgress(skill, dayRecords, xpEvents);
                const displayPercent = skill.unlocked ? 100 : derived.progressPercent;

                return (
                  <div
                    key={skill.id}
                    className={`p-4 rounded-[6px] border flex flex-col justify-between transition-colors bg-[#FBF9F4] border-[#E4DED2] hover:border-[#1F1B16] ${
                      skill.unlocked ? '' : 'opacity-90'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-medium">
                          <span className={accent.text}>{ATTRIBUTE_NAMES[skill.attribute]}</span>
                          <span className="text-[#6B645A] font-normal ml-1.5">· Tier {skill.tier}</span>
                        </span>

                        {skill.unlocked ? (
                          <span className="text-[11px] font-medium text-[#3F6B4F]">
                            Achieved
                          </span>
                        ) : (
                          <span className="text-[11px] text-[#6B645A]">
                            Locked
                          </span>
                        )}
                      </div>

                      <h4 className="font-serif text-[16px] font-normal text-[#1F1B16] mb-1">
                        {skill.title}
                      </h4>
                      <p className="text-[12px] text-[#6B645A] leading-relaxed mb-3">
                        {skill.description}
                      </p>

                      <div className="p-2.5 rounded-[4px] bg-[#F6F2EA] border border-[#E4DED2] mb-3 text-[12px]">
                        <span className="text-[#6B645A] block text-[11px] mb-0.5">Bonus</span>
                        <span className="font-medium text-[#1F1B16]">{skill.bonus}</span>
                      </div>

                      {/* Evidence note quote if unlocked with evidence */}
                      {skill.evidenceNote && (
                        <div className="p-2.5 rounded-[4px] bg-[#F6F2EA] border border-[#E4DED2] mb-3 text-[11px] text-[#1F1B16]">
                          <span className="text-[#6B645A] block mb-0.5">Verified Evidence:</span>
                          <span className="italic">{skill.evidenceNote}</span>
                          {skill.evidenceUrl && (
                            <a
                              href={skill.evidenceUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-1 flex items-center gap-1 underline font-medium"
                            >
                              View Link <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-[#E4DED2]">
                      <div className="flex justify-between items-center text-[12px] text-[#6B645A] mb-1.5 tabular-nums">
                        <span className="truncate mr-2">
                          {derived.sourceLabel ? derived.sourceLabel : `Goal: ${skill.requirement}`}
                        </span>
                        <span className="text-[#1F1B16] font-medium">{displayPercent}%</span>
                      </div>

                      <div className="h-1 w-full bg-[#E4DED2] rounded-full overflow-hidden mb-3">
                        <div
                          className={`h-full transition-all duration-300 ${
                            skill.unlocked ? accent.bar : 'bg-[#1F1B16]'
                          }`}
                          style={{ width: `${displayPercent}%` }}
                        />
                      </div>

                      {!skill.unlocked && (
                        <>
                          {derived.hasDataSource ? (
                            derived.isMet ? (
                              <button
                                type="button"
                                onClick={() => {
                                  sfx.playRunicHarmonic();
                                  onUnlockSkill(skill.id);
                                }}
                                className="editorial-btn-primary w-full"
                              >
                                Claim Milestone (+150 XP)
                              </button>
                            ) : (
                              <div className="w-full py-1.5 rounded-[4px] text-[12px] text-center bg-[#EFEAE0] text-[#6B645A] border border-[#E4DED2]">
                                In Progress ({derived.sourceLabel})
                              </div>
                            )
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleOpenEvidenceModal(skill)}
                              className="editorial-btn-secondary w-full"
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
          </section>
        </div>
      )}

      {/* Evidence Submission Modal for Manual Requirements */}
      {evidenceModalSkill && (
        <div
          onClick={() => setEvidenceModalSkill(null)}
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-[#FBF9F4] border border-[#E4DED2] rounded-[6px] p-6 cursor-default"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#E4DED2] mb-4">
              <div>
                <h3 className="font-serif text-[20px] font-normal text-[#1F1B16]">
                  Complete Milestone: {evidenceModalSkill.title}
                </h3>
                <p className="text-[12px] text-[#6B645A] mt-0.5">
                  Requirement: {evidenceModalSkill.requirement}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEvidenceModalSkill(null)}
                className="p-1 rounded-[4px] text-[#6B645A] hover:text-[#1F1B16]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmEvidence} className="space-y-4">
              <div>
                <label className="block text-[11px] font-medium uppercase tracking-wider text-[#6B645A] mb-1.5">
                  Evidence Note (Required)
                </label>
                <textarea
                  rows={3}
                  required
                  value={evidenceNote}
                  onChange={(e) => setEvidenceNote(e.target.value)}
                  placeholder="Describe your achievement, milestone, or reflection..."
                  className="ship-input w-full px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium uppercase tracking-wider text-[#6B645A] mb-1.5">
                  Reference URL (Optional)
                </label>
                <input
                  type="url"
                  value={evidenceUrl}
                  onChange={(e) => setEvidenceUrl(e.target.value)}
                  placeholder="https://... URL"
                  className="ship-input w-full px-3 py-2 text-xs"
                />
              </div>

              <div className="pt-4 border-t border-[#E4DED2] flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEvidenceModalSkill(null)}
                  className="editorial-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="editorial-btn-primary"
                >
                  Complete Milestone (+150 XP)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
