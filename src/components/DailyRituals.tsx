import React from 'react';
import type { DailyLog, SalahStatus } from '../types';
import { Sun, Moon, Check, Dumbbell, Clock, BookOpen, Users, Award, CalendarCheck2 } from 'lucide-react';
import { sfx } from '../utils/audio';

interface DailyRitualsProps {
  dailyLog: DailyLog;
  onUpdateDailyLog: (updated: DailyLog, xpGained?: { attr: 'STR' | 'INT' | 'WIS' | 'CHA'; xp: number }) => void;
}

const SALAH_CONFIG: { key: keyof SalahStatus; name: string; period: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'fajr', name: 'Fajr', period: 'Dawn', icon: Moon },
  { key: 'dhuhr', name: 'Dhuhr', period: 'Midday', icon: Sun },
  { key: 'asr', name: 'Asr', period: 'Afternoon', icon: Sun },
  { key: 'maghrib', name: 'Maghrib', period: 'Sunset', icon: Moon },
  { key: 'isha', name: 'Isha', period: 'Night', icon: Moon },
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
      
      {/* 1. Daily Salah Timeline (Clean & Modern) */}
      <div className="ui-card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#23262f] gap-2 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[#1c1f26] border border-[#2b2e38] text-[#e5b869]">
              <CalendarCheck2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                Daily Prayers (Salah Consistency)
              </h3>
              <p className="text-xs text-neutral-400">
                Anchoring daily circadian discipline (+50 WIS XP each, +150 bonus on perfect day)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#181a20] border border-[#262933] text-neutral-300">
              {completedSalahCount} / 5 completed
            </span>
            {isAllSalahCompleted && (
              <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-950/40 text-emerald-300 border border-emerald-800/40">
                <Award className="w-3.5 h-3.5" /> Perfect Day
              </span>
            )}
          </div>
        </div>

        {/* 5 Clean Prayer Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {SALAH_CONFIG.map(({ key, name, period, icon: IconComponent }) => {
            const isDone = dailyLog.salah[key];

            return (
              <button
                key={key}
                onClick={() => handleToggleSalah(key)}
                className={`p-3.5 rounded-xl border flex flex-col items-center justify-center text-center transition-all ${
                  isDone
                    ? 'bg-[#181d26] border-[#e5b869]/50 shadow-sm'
                    : 'bg-[#111317] border-[#20232b] hover:border-[#2f333f]'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs text-neutral-400 mb-2">
                  <IconComponent className="w-3.5 h-3.5 text-neutral-500" />
                  <span className="font-semibold text-white">{name}</span>
                </div>

                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center border transition-all mb-2 ${
                    isDone
                      ? 'bg-[#e5b869] border-[#e5b869] text-[#0f1115]'
                      : 'bg-[#181a20] border-[#2b2e38] text-transparent'
                  }`}
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                </div>

                <span className="text-[11px] text-neutral-500 font-medium">
                  {period}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Physical & Craft Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Physical Movement & Bodyweight Volume (STR) */}
        <div className="ui-card p-6">
          <div className="flex items-center justify-between pb-3 border-b border-[#23262f] mb-4">
            <div className="flex items-center gap-2">
              <Dumbbell className="w-4 h-4 text-rose-400" />
              <h3 className="text-sm font-bold text-white tracking-tight">
                Bodyweight Volume & Movement (STR)
              </h3>
            </div>
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-neutral-300">
              <input
                type="checkbox"
                checked={dailyLog.workoutCompleted}
                onChange={handleToggleWorkout}
                className="rounded border-[#2b2e38] bg-[#14161a] text-rose-500 focus:ring-0"
              />
              <span>Full Workout (+120 XP)</span>
            </label>
          </div>

          <div className="space-y-3">
            {/* Pushups */}
            <div className="p-3.5 rounded-lg bg-[#101216] border border-[#20232b] flex items-center justify-between">
              <div>
                <span className="text-xs text-neutral-400 font-medium">Pushups Logged</span>
                <div className="text-xl font-bold font-mono text-white mt-0.5">{dailyLog.pushups} reps</div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleAddPushups(5)}
                  className="px-2.5 py-1.5 rounded-md bg-[#181a20] hover:bg-[#22252e] text-xs font-semibold text-neutral-300 border border-[#272a34] transition-colors"
                >
                  +5
                </button>
                <button
                  onClick={() => handleAddPushups(10)}
                  className="px-2.5 py-1.5 rounded-md bg-[#181a20] hover:bg-[#22252e] text-xs font-semibold text-neutral-300 border border-[#272a34] transition-colors"
                >
                  +10
                </button>
                <button
                  onClick={() => handleAddPushups(25)}
                  className="px-2.5 py-1.5 rounded-md bg-[#181a20] hover:bg-[#22252e] text-xs font-semibold text-neutral-300 border border-[#272a34] transition-colors"
                >
                  +25
                </button>
              </div>
            </div>

            {/* Squats */}
            <div className="p-3.5 rounded-lg bg-[#101216] border border-[#20232b] flex items-center justify-between">
              <div>
                <span className="text-xs text-neutral-400 font-medium">Bodyweight Squats</span>
                <div className="text-xl font-bold font-mono text-white mt-0.5">{dailyLog.squats} reps</div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleAddSquats(10)}
                  className="px-2.5 py-1.5 rounded-md bg-[#181a20] hover:bg-[#22252e] text-xs font-semibold text-neutral-300 border border-[#272a34] transition-colors"
                >
                  +10
                </button>
                <button
                  onClick={() => handleAddSquats(20)}
                  className="px-2.5 py-1.5 rounded-md bg-[#181a20] hover:bg-[#22252e] text-xs font-semibold text-neutral-300 border border-[#272a34] transition-colors"
                >
                  +20
                </button>
                <button
                  onClick={() => handleAddSquats(50)}
                  className="px-2.5 py-1.5 rounded-md bg-[#181a20] hover:bg-[#22252e] text-xs font-semibold text-neutral-300 border border-[#272a34] transition-colors"
                >
                  +50
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Deep Work Focus & Shipped Milestones (INT) */}
        <div className="ui-card p-6">
          <div className="flex items-center justify-between pb-3 border-b border-[#23262f] mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-sky-400" />
              <h3 className="text-sm font-bold text-white tracking-tight">
                Deep Work Focus (INT)
              </h3>
            </div>
            <span className="text-xs font-mono font-medium text-sky-400">
              +{Math.round(dailyLog.deepWorkMinutes * 1.5)} INT XP
            </span>
          </div>

          {/* Deep Work Timer block */}
          <div className="p-3.5 rounded-lg bg-[#101216] border border-[#20232b] flex items-center justify-between mb-4">
            <div>
              <span className="text-xs text-neutral-400 font-medium">Unbroken Focus Time</span>
              <div className="text-xl font-bold font-mono text-white mt-0.5">
                {Math.floor(dailyLog.deepWorkMinutes / 60)}h {dailyLog.deepWorkMinutes % 60}m
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleAddDeepWork(30)}
                className="px-3 py-1.5 rounded-md bg-[#181a20] hover:bg-[#22252e] text-xs font-semibold text-sky-300 border border-[#272a34] transition-colors"
              >
                +30m
              </button>
              <button
                onClick={() => handleAddDeepWork(60)}
                className="px-3 py-1.5 rounded-md bg-[#181a20] hover:bg-[#22252e] text-xs font-semibold text-sky-300 border border-[#272a34] transition-colors"
              >
                +60m
              </button>
            </div>
          </div>

          {/* Shipped notes */}
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1">
              Projects / Milestones Shipped Today
            </label>
            <input
              type="text"
              value={dailyLog.projectShippedNotes || ''}
              onChange={(e) => onUpdateDailyLog({ ...dailyLog, projectShippedNotes: e.target.value })}
              placeholder="e.g. Shipped Vessel UI redesign, client approval on schema..."
              className="w-full px-3 py-2 bg-[#101216] border border-[#20232b] rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-sky-500"
            />
          </div>
        </div>

      </div>

      {/* 3. Spiritual & Community Journal (WIS & CHA) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* WIS: Surah Study */}
        <div className="ui-card p-5">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-4 h-4 text-amber-400" />
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Surah Revision & Study (WIS)
            </h4>
          </div>
          <textarea
            rows={2}
            value={dailyLog.surahStudyNotes || ''}
            onChange={(e) => onUpdateDailyLog({ ...dailyLog, surahStudyNotes: e.target.value })}
            placeholder="Record verses reviewed, memorization progress, or notes..."
            className="w-full px-3 py-2 bg-[#101216] border border-[#20232b] rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400"
          />
        </div>

        {/* CHA: Mentorship */}
        <div className="ui-card p-5">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-emerald-400" />
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Mentorship & Community (CHA)
            </h4>
          </div>
          <textarea
            rows={2}
            value={dailyLog.mentorshipNotes || ''}
            onChange={(e) => onUpdateDailyLog({ ...dailyLog, mentorshipNotes: e.target.value })}
            placeholder="Record 1-on-1s, peers helped, team enablement notes..."
            className="w-full px-3 py-2 bg-[#101216] border border-[#20232b] rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-400"
          />
        </div>
      </div>

    </div>
  );
};
