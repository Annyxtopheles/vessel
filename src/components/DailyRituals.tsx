import React from 'react';
import type { DailyLog, SalahStatus } from '../types';
import { Sun, Moon, CheckCircle2, Circle, Dumbbell, Clock, BookOpen, Users, Award } from 'lucide-react';
import { sfx } from '../utils/audio';

interface DailyRitualsProps {
  dailyLog: DailyLog;
  onUpdateDailyLog: (updated: DailyLog, xpGained?: { attr: 'STR' | 'INT' | 'WIS' | 'CHA'; xp: number }) => void;
}

const SALAH_CONFIG: { key: keyof SalahStatus; name: string; period: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'fajr', name: 'Al-Fajr', period: 'Dawn / Pre-Sunrise', icon: Moon },
  { key: 'dhuhr', name: 'Al-Dhuhr', period: 'Midday Zenith', icon: Sun },
  { key: 'asr', name: 'Al-Asr', period: 'Late Afternoon', icon: Sun },
  { key: 'maghrib', name: 'Al-Maghrib', period: 'Sunset Twilight', icon: Moon },
  { key: 'isha', name: 'Al-Isha', period: 'Night Vigil', icon: Moon },
];

export const DailyRituals: React.FC<DailyRitualsProps> = ({
  dailyLog,
  onUpdateDailyLog,
}) => {
  const completedSalahCount = Object.values(dailyLog.salah).filter(Boolean).length;
  const isAllSalahCompleted = completedSalahCount === 5;

  const handleToggleSalah = (key: keyof SalahStatus) => {
    const nextVal = !dailyLog.salah[key];
    const newSalah = { ...dailyLog.salah, [key]: nextVal };
    
    if (nextVal) {
      sfx.playRunicHarmonic();
    } else {
      sfx.playClick();
    }

    onUpdateDailyLog(
      { ...dailyLog, salah: newSalah },
      nextVal ? { attr: 'WIS', xp: 50 } : undefined
    );
  };

  const handleAddPushups = (amount: number) => {
    sfx.playClick();
    const newCount = Math.max(0, dailyLog.pushups + amount);
    onUpdateDailyLog(
      { ...dailyLog, pushups: newCount },
      amount > 0 ? { attr: 'STR', xp: amount * 2 } : undefined
    );
  };

  const handleAddSquats = (amount: number) => {
    sfx.playClick();
    const newCount = Math.max(0, dailyLog.squats + amount);
    onUpdateDailyLog(
      { ...dailyLog, squats: newCount },
      amount > 0 ? { attr: 'STR', xp: amount * 2 } : undefined
    );
  };

  const handleToggleWorkout = () => {
    const nextVal = !dailyLog.workoutCompleted;
    if (nextVal) sfx.playRunicHarmonic();
    else sfx.playClick();

    onUpdateDailyLog(
      { ...dailyLog, workoutCompleted: nextVal },
      nextVal ? { attr: 'STR', xp: 120 } : undefined
    );
  };

  const handleAddDeepWork = (mins: number) => {
    sfx.playClick();
    const newMins = Math.max(0, dailyLog.deepWorkMinutes + mins);
    onUpdateDailyLog(
      { ...dailyLog, deepWorkMinutes: newMins },
      mins > 0 ? { attr: 'INT', xp: Math.round(mins * 1.5) } : undefined
    );
  };

  return (
    <div className="space-y-6">
      
      {/* 1. The Five Daily Prayers (Salah Runic Altar) */}
      <div className="arcane-card rounded-xl p-5 border border-[#C5A059]/35 bg-gradient-to-b from-[#141620] via-[#0D0F15] to-[#08090D] relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#232734] gap-2 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-cinzel text-base sm:text-lg font-bold text-[#E5C378] tracking-wider flex items-center gap-2">
                <Sun className="w-4 h-4 text-[#C5A059]" /> FIVE PILLARS CIRCADIAN CADENCE (SALAH)
              </h3>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#C5A059]/10 text-[#E5C378] border border-[#C5A059]/20">
                {completedSalahCount} / 5 COMPLETED
              </span>
            </div>
            <p className="text-xs font-serif italic text-[#8A8477]">
              The anchor of spiritual discipline (+50 WIS XP each, +150 bonus on perfect day).
            </p>
          </div>

          {isAllSalahCompleted && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded bg-[#C5A059]/20 border border-[#C5A059]/50 text-xs font-mono text-[#F1E8D9] animate-pulse">
              <Award className="w-4 h-4 text-[#E5C378]" />
              <span>PERFECT SPIRITUAL COVENANT ACHIEVED</span>
            </div>
          )}
        </div>

        {/* 5 Runic Stones */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          {SALAH_CONFIG.map(({ key, name, period, icon: IconComponent }) => {
            const isDone = dailyLog.salah[key];

            return (
              <button
                key={key}
                onClick={() => handleToggleSalah(key)}
                className={`p-4 rounded-xl border flex flex-col items-center justify-center text-center transition-all group relative overflow-hidden ${
                  isDone
                    ? 'bg-gradient-to-b from-[#1F2433] to-[#121520] border-[#C5A059]/60 shadow-lg shadow-[#C5A059]/10 ring-1 ring-[#C5A059]/30'
                    : 'bg-[#0E1015] border-[#252834] hover:border-[#383E4E] opacity-75 hover:opacity-100'
                }`}
              >
                {/* Status Indicator */}
                <div className="mb-2 flex items-center justify-center gap-1.5">
                  <IconComponent className="w-3.5 h-3.5 text-[#C5A059]/70" />
                  {isDone ? (
                    <CheckCircle2 className="w-5 h-5 text-[#E5C378] filter drop-shadow-[0_0_8px_rgba(197,160,89,0.8)]" />
                  ) : (
                    <Circle className="w-5 h-5 text-[#454A59] group-hover:text-[#787E92]" />
                  )}
                </div>

                <span className="font-cinzel text-sm font-bold text-[#F3ECE0] group-hover:text-[#E5C378] transition-colors">
                  {name}
                </span>

                <span className="text-[10px] font-mono text-[#7D776B] mt-0.5">
                  {period}
                </span>

                <span className={`text-[10px] font-mono mt-2 px-1.5 py-0.5 rounded ${
                  isDone ? 'bg-[#C5A059]/20 text-[#E5C378]' : 'bg-[#181B24] text-[#615C53]'
                }`}>
                  {isDone ? '+50 WIS' : 'DORMANT'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Physical & Intellect Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* STR: Kinetic Movement & Bodyweight Volume */}
        <div className="arcane-card rounded-xl p-5 border border-rose-900/30 bg-[#0E1016]">
          <div className="flex items-center justify-between pb-3 border-b border-[#232733] mb-4">
            <div className="flex items-center gap-2">
              <Dumbbell className="w-4 h-4 text-rose-400" />
              <h3 className="font-cinzel text-sm font-bold text-rose-200 tracking-wider">
                STR — KINETIC BODYWEIGHT VOLUME
              </h3>
            </div>
            <label className="flex items-center gap-1.5 cursor-pointer text-xs font-mono text-[#D6CFBE]">
              <input
                type="checkbox"
                checked={dailyLog.workoutCompleted}
                onChange={handleToggleWorkout}
                className="rounded border-[#C5A059] bg-[#181A22] text-rose-500 focus:ring-0"
              />
              <span>Full Session Done (+120 XP)</span>
            </label>
          </div>

          <div className="space-y-4">
            {/* Pushups */}
            <div className="p-3 rounded-lg bg-[#13151D] border border-[#232734] flex items-center justify-between">
              <div>
                <span className="font-cinzel text-xs font-bold text-[#E5C378]">PUSHUPS COMPLETED</span>
                <div className="text-xl font-mono font-bold text-[#F1E8D9] mt-0.5">{dailyLog.pushups} reps</div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleAddPushups(5)}
                  className="px-2.5 py-1 rounded bg-[#1C1F2B] hover:bg-[#252A3B] text-xs font-mono text-[#C5A059] border border-[#33384B]"
                >
                  +5
                </button>
                <button
                  onClick={() => handleAddPushups(10)}
                  className="px-2.5 py-1 rounded bg-[#1C1F2B] hover:bg-[#252A3B] text-xs font-mono text-[#C5A059] border border-[#33384B]"
                >
                  +10
                </button>
                <button
                  onClick={() => handleAddPushups(25)}
                  className="px-2.5 py-1 rounded bg-[#1C1F2B] hover:bg-[#252A3B] text-xs font-mono text-[#C5A059] border border-[#33384B]"
                >
                  +25
                </button>
              </div>
            </div>

            {/* Squats */}
            <div className="p-3 rounded-lg bg-[#13151D] border border-[#232734] flex items-center justify-between">
              <div>
                <span className="font-cinzel text-xs font-bold text-[#E5C378]">BODYWEIGHT SQUATS</span>
                <div className="text-xl font-mono font-bold text-[#F1E8D9] mt-0.5">{dailyLog.squats} reps</div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleAddSquats(10)}
                  className="px-2.5 py-1 rounded bg-[#1C1F2B] hover:bg-[#252A3B] text-xs font-mono text-[#C5A059] border border-[#33384B]"
                >
                  +10
                </button>
                <button
                  onClick={() => handleAddSquats(20)}
                  className="px-2.5 py-1 rounded bg-[#1C1F2B] hover:bg-[#252A3B] text-xs font-mono text-[#C5A059] border border-[#33384B]"
                >
                  +20
                </button>
                <button
                  onClick={() => handleAddSquats(50)}
                  className="px-2.5 py-1 rounded bg-[#1C1F2B] hover:bg-[#252A3B] text-xs font-mono text-[#C5A059] border border-[#33384B]"
                >
                  +50
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* INT: Deep Work & Artificer Velocity */}
        <div className="arcane-card rounded-xl p-5 border border-sky-900/30 bg-[#0E1016]">
          <div className="flex items-center justify-between pb-3 border-b border-[#232733] mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-sky-400" />
              <h3 className="font-cinzel text-sm font-bold text-sky-200 tracking-wider">
                INT — DEEP WORK CONCENTRATION
              </h3>
            </div>
            <span className="text-xs font-mono text-sky-300">
              +{Math.round(dailyLog.deepWorkMinutes * 1.5)} INT XP
            </span>
          </div>

          {/* Deep Work Timer block */}
          <div className="p-3 rounded-lg bg-[#13151D] border border-[#232734] flex items-center justify-between mb-4">
            <div>
              <span className="font-cinzel text-xs font-bold text-[#E5C378]">UNBROKEN COGNITIVE FOCUS</span>
              <div className="text-xl font-mono font-bold text-[#F1E8D9] mt-0.5">
                {Math.floor(dailyLog.deepWorkMinutes / 60)}h {dailyLog.deepWorkMinutes % 60}m
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleAddDeepWork(30)}
                className="px-2.5 py-1 rounded bg-[#1C1F2B] hover:bg-[#252A3B] text-xs font-mono text-sky-300 border border-[#33384B]"
              >
                +30m
              </button>
              <button
                onClick={() => handleAddDeepWork(60)}
                className="px-2.5 py-1 rounded bg-[#1C1F2B] hover:bg-[#252A3B] text-xs font-mono text-sky-300 border border-[#33384B]"
              >
                +60m
              </button>
            </div>
          </div>

          {/* Shipped notes */}
          <div>
            <label className="block text-xs font-mono text-[#8F897C] mb-1">
              PROJECTS & FEATURES SHIPPED TODAY
            </label>
            <input
              type="text"
              value={dailyLog.projectShippedNotes || ''}
              onChange={(e) => onUpdateDailyLog({ ...dailyLog, projectShippedNotes: e.target.value })}
              placeholder="e.g. Completed Vessel Paperdoll view, refactored API..."
              className="w-full px-3 py-2 bg-[#13151D] border border-[#232734] rounded-lg text-xs font-mono text-[#D6CFBE] placeholder-[#555047] focus:outline-none focus:border-sky-500/60"
            />
          </div>
        </div>

      </div>

      {/* 3. Soul & Community Logs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* WIS: Surah Study & Soul Journal */}
        <div className="arcane-card rounded-xl p-4 border border-[#C5A059]/25 bg-[#0E1016]">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-4 h-4 text-[#C5A059]" />
            <h4 className="font-cinzel text-xs font-bold text-[#E5C378]">WIS — SURAH REVISION & SACRED KNOWLEDGE</h4>
          </div>
          <textarea
            rows={2}
            value={dailyLog.surahStudyNotes || ''}
            onChange={(e) => onUpdateDailyLog({ ...dailyLog, surahStudyNotes: e.target.value })}
            placeholder="Record verses memorized, tajweed practiced, or spiritual study reflections..."
            className="w-full px-3 py-2 bg-[#13151D] border border-[#232734] rounded-lg text-xs font-serif italic text-[#D6CFBE] placeholder-[#555047] focus:outline-none focus:border-[#C5A059]/60"
          />
        </div>

        {/* CHA: Mentorship & Enablement */}
        <div className="arcane-card rounded-xl p-4 border border-emerald-900/30 bg-[#0E1016]">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-emerald-400" />
            <h4 className="font-cinzel text-xs font-bold text-emerald-300">CHA — MENTORSHIP & KINDRED REPUTATION</h4>
          </div>
          <textarea
            rows={2}
            value={dailyLog.mentorshipNotes || ''}
            onChange={(e) => onUpdateDailyLog({ ...dailyLog, mentorshipNotes: e.target.value })}
            placeholder="Record 1-on-1s conducted, peers helped, team enablement milestones..."
            className="w-full px-3 py-2 bg-[#13151D] border border-[#232734] rounded-lg text-xs font-serif italic text-[#D6CFBE] placeholder-[#555047] focus:outline-none focus:border-emerald-500/60"
          />
        </div>
      </div>

    </div>
  );
};
