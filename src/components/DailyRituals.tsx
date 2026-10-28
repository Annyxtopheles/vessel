import React, { useState } from 'react';
import type { DayRecord, SalahStatus, CustomHabit, AttributeType } from '../types';
import { Check, Plus, Dumbbell, Clock, Trash2, RotateCcw } from 'lucide-react';
import { sfx } from '../utils/audio';
import { getTodayLocalDateStr, getRelativeDayStrip } from '../utils/date';

interface DailyRitualsProps {
  dayRecords: Record<string, DayRecord>;
  habits: CustomHabit[];
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  onUpdateDayRecord: (record: DayRecord, xpGained?: { attr: 'STR' | 'INT' | 'WIS' | 'CHA'; xp: number }) => void;
  onAddHabit: (habit: CustomHabit) => void;
  onDeleteHabit: (habitId: string) => void;
}

const SALAH_LIST: { key: keyof SalahStatus; name: string; timeOfDay: string }[] = [
  { key: 'fajr', name: 'Fajr', timeOfDay: 'Dawn' },
  { key: 'dhuhr', name: 'Dhuhr', timeOfDay: 'Noon' },
  { key: 'asr', name: 'Asr', timeOfDay: 'Afternoon' },
  { key: 'maghrib', name: 'Maghrib', timeOfDay: 'Sunset' },
  { key: 'isha', name: 'Isha', timeOfDay: 'Night' },
];

const HABIT_ATTR_BADGES: Record<AttributeType, string> = {
  STR: 'text-[#f87171] bg-[#271a1c] border-[#44282c]',
  INT: 'text-[#60a5fa] bg-[#15202c] border-[#253549]',
  WIS: 'text-[#38bdf8] bg-[#0c1f2e] border-[#075985]/50',
  CHA: 'text-[#34d399] bg-[#1a251e] border-[#2a3e30]',
};

export const DailyRituals: React.FC<DailyRitualsProps> = ({
  dayRecords,
  habits,
  selectedDate,
  setSelectedDate,
  onUpdateDayRecord,
  onAddHabit,
  onDeleteHabit,
}) => {
  const [isAddingHabit, setIsAddingHabit] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitAttr, setNewHabitAttr] = useState<AttributeType>('WIS');

  const todayStr = getTodayLocalDateStr();

  const currentRecord: DayRecord = dayRecords[selectedDate] || {
    date: selectedDate,
    salah: { fajr: false, dhuhr: false, asr: false, maghrib: false, isha: false },
    pushups: 0,
    squats: 0,
    workoutCompleted: false,
    deepWorkMinutes: 0,
    completedHabitIds: [],
    notes: '',
  };

  const dayStrip = getRelativeDayStrip(selectedDate, todayStr);

  const completedSalahCount = Object.values(currentRecord.salah).filter(Boolean).length;
  const isAllSalahCompleted = completedSalahCount === 5;

  const handleToggleSalah = (key: keyof SalahStatus) => {
    sfx.playClick();
    const nextVal = !currentRecord.salah[key];
    const updatedRecord: DayRecord = {
      ...currentRecord,
      salah: {
        ...currentRecord.salah,
        [key]: nextVal,
      },
    };

    onUpdateDayRecord(
      updatedRecord,
      nextVal ? { attr: 'WIS', xp: 50 } : undefined
    );
  };

  const handleToggleHabit = (habitId: string) => {
    sfx.playClick();
    const isCompleted = currentRecord.completedHabitIds.includes(habitId);
    let nextIds: string[];
    let habitAttr: AttributeType = 'WIS';

    const habitObj = habits.find(h => h.id === habitId);
    if (habitObj) {
      habitAttr = habitObj.attribute;
    }

    if (isCompleted) {
      nextIds = currentRecord.completedHabitIds.filter(id => id !== habitId);
    } else {
      nextIds = [...currentRecord.completedHabitIds, habitId];
    }

    const updatedRecord: DayRecord = {
      ...currentRecord,
      completedHabitIds: nextIds,
    };

    onUpdateDayRecord(
      updatedRecord,
      !isCompleted ? { attr: habitAttr, xp: 35 } : undefined
    );
  };

  const handleAdjustPushups = (delta: number) => {
    sfx.playClick();
    const nextVal = Math.max(0, currentRecord.pushups + delta);
    const updatedRecord: DayRecord = {
      ...currentRecord,
      pushups: nextVal,
      workoutCompleted: nextVal >= 50 || currentRecord.squats >= 50,
    };
    onUpdateDayRecord(
      updatedRecord,
      delta > 0 ? { attr: 'STR', xp: delta * 2 } : undefined
    );
  };

  const handleSetPushupsDirect = (val: number) => {
    const nextVal = Math.max(0, val);
    const updatedRecord: DayRecord = {
      ...currentRecord,
      pushups: nextVal,
      workoutCompleted: nextVal >= 50 || currentRecord.squats >= 50,
    };
    onUpdateDayRecord(updatedRecord);
  };

  const handleAdjustSquats = (delta: number) => {
    sfx.playClick();
    const nextVal = Math.max(0, currentRecord.squats + delta);
    const updatedRecord: DayRecord = {
      ...currentRecord,
      squats: nextVal,
      workoutCompleted: currentRecord.pushups >= 50 || nextVal >= 50,
    };
    onUpdateDayRecord(
      updatedRecord,
      delta > 0 ? { attr: 'STR', xp: delta * 2 } : undefined
    );
  };

  const handleSetSquatsDirect = (val: number) => {
    const nextVal = Math.max(0, val);
    const updatedRecord: DayRecord = {
      ...currentRecord,
      squats: nextVal,
      workoutCompleted: currentRecord.pushups >= 50 || nextVal >= 50,
    };
    onUpdateDayRecord(updatedRecord);
  };

  const handleDeepWorkChange = (minutes: number) => {
    const updatedRecord: DayRecord = {
      ...currentRecord,
      deepWorkMinutes: minutes,
    };
    onUpdateDayRecord(updatedRecord);
  };

  const handleCreateHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitName.trim()) return;

    const newHabit: CustomHabit = {
      id: `habit-${Date.now()}`,
      name: newHabitName.trim(),
      attribute: newHabitAttr,
    };

    onAddHabit(newHabit);
    setNewHabitName('');
    setIsAddingHabit(false);
    sfx.playClick();
  };

  return (
    <div className="space-y-6">

      {/* 1. 7-Day Quick Strip & Prayer Cadence */}
      <div className="bg-[#101217] border border-[#1a1d26] rounded-xl p-5 space-y-5">
        
        {/* 7-Day Navigation Strip */}
        <div className="flex items-center justify-between pb-3.5 border-b border-[#181b24]">
          <div className="flex items-center gap-2 overflow-x-auto w-full">
            {dayStrip.map((day) => {
              const isSelected = day.dateStr === selectedDate;
              const record = dayRecords[day.dateStr];
              const prayerCount = record ? Object.values(record.salah).filter(Boolean).length : 0;
              const habitCount = record ? record.completedHabitIds.length : 0;

              return (
                <button
                  key={day.dateStr}
                  onClick={() => {
                    sfx.playClick();
                    setSelectedDate(day.dateStr);
                  }}
                  className={`flex flex-col items-center px-4 py-2 rounded-lg border text-xs transition-all min-w-[58px] ${
                    isSelected
                      ? 'bg-[#0c1f2e] border-[#0ea5e9] text-white shadow-xs font-semibold'
                      : 'bg-[#0b0d12] border-[#181c24] text-[#94a3b8] hover:text-white hover:border-[#232938]'
                  }`}
                >
                  <span className="text-[10px] uppercase text-[#94a3b8] tracking-wider">{day.dayName}</span>
                  <span className="font-bold text-sm my-0.5 text-white">{day.dayNum}</span>

                  <div className="flex items-center gap-1 mt-0.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      prayerCount === 5 ? 'bg-[#0ea5e9]' : prayerCount > 0 ? 'bg-[#0ea5e9]/50' : 'bg-[#232836]'
                    }`} />
                    {habitCount > 0 && <span className="w-1.5 h-1.5 rounded-full bg-[#60a5fa]" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 5 Daily Prayers (Salah Cadence) */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3.5">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-white tracking-tight">
                  Five Daily Prayers (Salah Cadence)
                </h3>
                <span className="linear-tag text-[#38bdf8] border-[#075985]/40 bg-[#0c1f2e]">
                  {completedSalahCount} of 5 completed
                </span>
              </div>
              <p className="text-xs text-[#94a3b8] mt-0.5">
                Anchors circadian rhythm (+50 Wisdom XP per prayer)
              </p>
            </div>

            {isAllSalahCompleted && (
              <span className="linear-tag text-[#34d399] border-[#065f46]/50 bg-[#064e3b]/30 flex items-center gap-1 font-medium">
                <Check className="w-3.5 h-3.5 text-[#34d399]" /> Perfect 5/5 Day (+150 XP bonus)
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            {SALAH_LIST.map(({ key, name, timeOfDay }) => {
              const isDone = currentRecord.salah[key];

              return (
                <button
                  key={key}
                  onClick={() => handleToggleSalah(key)}
                  className={`p-3.5 rounded-lg border flex flex-col items-center justify-between text-center transition-all cursor-pointer ${
                    isDone
                      ? 'bg-[#0c1a26] border-[#075985] text-white shadow-xs'
                      : 'bg-[#0b0d12] border-[#181c24] hover:bg-[#10141d] hover:border-[#232938]'
                  }`}
                >
                  <div className="text-[10px] uppercase tracking-wider text-[#94a3b8] mb-1">
                    {timeOfDay}
                  </div>
                  <div className="text-sm font-semibold text-white mb-3">{name}</div>

                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all ${
                      isDone
                        ? 'bg-[#0ea5e9] border-[#0ea5e9] text-white shadow-xs'
                        : 'bg-[#121620] border-[#232938] text-transparent hover:border-[#384156]'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

      </div>

      {/* 2. Daily Habits Checklist */}
      <div className="bg-[#101217] border border-[#1a1d26] rounded-xl p-5">
        <div className="flex items-center justify-between pb-3.5 border-b border-[#181b24] mb-4">
          <div>
            <h3 className="text-sm font-semibold text-white tracking-tight">
              Daily Disciplines & Habits
            </h3>
            <p className="text-xs text-[#94a3b8]">
              Consistency rituals across physical, professional, and spiritual disciplines
            </p>
          </div>

          <button
            onClick={() => setIsAddingHabit(!isAddingHabit)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#121620] hover:bg-[#1a202e] text-[#f1f5f9] border border-[#232938] rounded-md text-xs font-semibold transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-[#38bdf8]" /> New Discipline
          </button>
        </div>

        {/* Add Habit Form */}
        {isAddingHabit && (
          <form onSubmit={handleCreateHabit} className="p-3.5 rounded-lg bg-[#0b0d12] border border-[#1a1d26] mb-4 flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
            <input
              type="text"
              required
              value={newHabitName}
              onChange={(e) => setNewHabitName(e.target.value)}
              placeholder="e.g. Read 20 pages, Cold shower, Zero sugar, 10k steps..."
              className="flex-1 px-3 py-1.5 bg-[#10131a] border border-[#1d222e] rounded-md text-xs text-white placeholder-[#525a6e] focus:outline-none focus:border-[#0ea5e9]"
            />

            <select
              value={newHabitAttr}
              onChange={(e) => setNewHabitAttr(e.target.value as AttributeType)}
              className="px-3 py-1.5 bg-[#10131a] border border-[#1d222e] rounded-md text-xs text-[#cbd5e1] focus:outline-none focus:border-[#0ea5e9]"
            >
              <option value="STR">Strength (Body)</option>
              <option value="INT">Intellect (Craft)</option>
              <option value="WIS">Wisdom (Soul)</option>
              <option value="CHA">Charisma (Community)</option>
            </select>

            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="px-3 py-1.5 bg-[#0284c7] hover:bg-[#0369a1] text-white font-semibold text-xs rounded-md shadow-xs transition-colors"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => setIsAddingHabit(false)}
                className="px-2.5 py-1.5 bg-[#121620] text-[#94a3b8] text-xs rounded-md hover:text-white"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Habits List */}
        <div className="space-y-1.5">
          {habits.map((habit) => {
            const isCompleted = currentRecord.completedHabitIds.includes(habit.id);

            return (
              <div
                key={habit.id}
                onClick={() => handleToggleHabit(habit.id)}
                className={`group px-3 py-2.5 rounded-lg border flex items-center justify-between cursor-pointer transition-all ${
                  isCompleted
                    ? 'bg-[#0c1622] border-[#163a56]'
                    : 'bg-[#0b0d12] border-[#181c24] hover:bg-[#10141d] hover:border-[#232938]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                      isCompleted
                        ? 'bg-[#0ea5e9] border-[#0ea5e9] text-white'
                        : 'bg-[#121620] border-[#232938] text-transparent'
                    }`}
                  >
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>

                  <div>
                    <span className={`text-xs font-medium block transition-colors ${
                      isCompleted ? 'line-through text-[#64748b]' : 'text-[#f1f5f9]'
                    }`}>
                      {habit.name}
                    </span>
                    {habit.description && (
                      <span className="text-[11px] text-[#64748b] line-clamp-1">
                        {habit.description}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded border uppercase tracking-wider font-semibold ${HABIT_ATTR_BADGES[habit.attribute]}`}>
                    [{habit.attribute}]
                  </span>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      sfx.playClick();
                      onDeleteHabit(habit.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-[#64748b] hover:text-rose-400 transition-opacity"
                    title="Delete discipline"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Physical Training Volume & Deep Work */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Pushups & Squats Card */}
        <div className="bg-[#101217] border border-[#1a1d26] rounded-xl p-5">
          <div className="flex items-center justify-between pb-3.5 border-b border-[#181b24] mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-[#271a1c] border border-[#44282c] text-[#f87171]">
                <Dumbbell className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-white tracking-tight">
                Bodyweight Movement (Strength)
              </h3>
            </div>

            {currentRecord.workoutCompleted && (
              <span className="linear-tag text-[#34d399] border-[#065f46]/50 bg-[#064e3b]/30 flex items-center gap-1 font-medium">
                <Check className="w-3.5 h-3.5 text-[#34d399]" /> Full Workout (+120 XP)
              </span>
            )}
          </div>

          <div className="space-y-4">
            {/* Pushups Stepper */}
            <div className="p-3 rounded-lg bg-[#0b0d12] border border-[#181c24]">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-semibold text-[#f1f5f9]">Pushups Completed</span>
                <span className="text-xs font-semibold text-[#f87171]">
                  +{currentRecord.pushups * 2} XP
                </span>
              </div>

              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={currentRecord.pushups === 0 ? '' : currentRecord.pushups}
                    onChange={(e) => {
                      const val = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
                      handleSetPushupsDirect(isNaN(val) ? 0 : val);
                    }}
                    className="w-16 px-2 py-1 bg-[#10131a] border border-[#1d222e] rounded-md text-base font-bold text-white text-center focus:outline-none focus:border-[#0ea5e9]"
                  />
                  <span className="text-xs text-[#94a3b8]">reps</span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleAdjustPushups(-10)}
                    className="linear-tag hover:bg-[#181d29] hover:text-white transition-colors cursor-pointer"
                  >
                    -10
                  </button>
                  <button
                    onClick={() => handleAdjustPushups(-5)}
                    className="linear-tag hover:bg-[#181d29] hover:text-white transition-colors cursor-pointer"
                  >
                    -5
                  </button>
                  <button
                    onClick={() => handleAdjustPushups(5)}
                    className="linear-tag hover:bg-[#181d29] hover:text-white transition-colors cursor-pointer text-[#f1f5f9]"
                  >
                    +5
                  </button>
                  <button
                    onClick={() => handleAdjustPushups(10)}
                    className="linear-tag hover:bg-[#181d29] hover:text-white transition-colors cursor-pointer text-[#f1f5f9]"
                  >
                    +10
                  </button>
                  <button
                    onClick={() => handleAdjustPushups(25)}
                    className="linear-tag hover:bg-[#181d29] hover:text-white transition-colors cursor-pointer text-[#f1f5f9]"
                  >
                    +25
                  </button>
                </div>
              </div>
            </div>

            {/* Squats Stepper */}
            <div className="p-3 rounded-lg bg-[#0b0d12] border border-[#181c24]">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-semibold text-[#f1f5f9]">Bodyweight Squats</span>
                <span className="text-xs font-semibold text-[#f87171]">
                  +{currentRecord.squats * 2} XP
                </span>
              </div>

              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={currentRecord.squats === 0 ? '' : currentRecord.squats}
                    onChange={(e) => {
                      const val = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
                      handleSetSquatsDirect(isNaN(val) ? 0 : val);
                    }}
                    className="w-16 px-2 py-1 bg-[#10131a] border border-[#1d222e] rounded-md text-base font-bold text-white text-center focus:outline-none focus:border-[#0ea5e9]"
                  />
                  <span className="text-xs text-[#94a3b8]">reps</span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleAdjustSquats(-10)}
                    className="linear-tag hover:bg-[#181d29] hover:text-white transition-colors cursor-pointer"
                  >
                    -10
                  </button>
                  <button
                    onClick={() => handleAdjustSquats(-5)}
                    className="linear-tag hover:bg-[#181d29] hover:text-white transition-colors cursor-pointer"
                  >
                    -5
                  </button>
                  <button
                    onClick={() => handleAdjustSquats(5)}
                    className="linear-tag hover:bg-[#181d29] hover:text-white transition-colors cursor-pointer text-[#f1f5f9]"
                  >
                    +5
                  </button>
                  <button
                    onClick={() => handleAdjustSquats(10)}
                    className="linear-tag hover:bg-[#181d29] hover:text-white transition-colors cursor-pointer text-[#f1f5f9]"
                  >
                    +10
                  </button>
                  <button
                    onClick={() => handleAdjustSquats(25)}
                    className="linear-tag hover:bg-[#181d29] hover:text-white transition-colors cursor-pointer text-[#f1f5f9]"
                  >
                    +25
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Deep Work Focus Card */}
        <div className="bg-[#101217] border border-[#1a1d26] rounded-xl p-5">
          <div className="flex items-center justify-between pb-3.5 border-b border-[#181b24] mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-[#15202c] border border-[#253549] text-[#60a5fa]">
                <Clock className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-white tracking-tight">
                Deep Work Focus (Intellect)
              </h3>
            </div>

            <span className="linear-tag text-[#38bdf8] border-[#075985]/40 bg-[#0c1f2e]">
              +{Math.round((currentRecord.deepWorkMinutes / 60) * 60)} XP
            </span>
          </div>

          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-[#0b0d12] border border-[#181c24]">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-[#94a3b8]">Logged Focus Duration</span>
                <span className="text-lg font-bold text-white">
                  {Math.floor(currentRecord.deepWorkMinutes / 60)}h {currentRecord.deepWorkMinutes % 60}m
                </span>
              </div>

              <input
                type="range"
                min="0"
                max="600"
                step="15"
                value={currentRecord.deepWorkMinutes}
                onChange={(e) => handleDeepWorkChange(parseInt(e.target.value, 10))}
                className="w-full accent-[#0ea5e9] cursor-pointer"
              />

              <div className="flex justify-between text-[10px] text-[#94a3b8] mt-1 font-medium">
                <span>0h</span>
                <span>2.5h</span>
                <span>5h</span>
                <span>7.5h</span>
                <span>10h</span>
              </div>
            </div>

            {/* Quick Presets */}
            <div className="flex items-center gap-2">
              {[
                { label: '+30m Sprint', mins: 30 },
                { label: '+60m Block', mins: 60 },
                { label: '+90m Deep Cycle', mins: 90 },
              ].map((preset) => (
                <button
                  key={preset.mins}
                  onClick={() => {
                    sfx.playClick();
                    handleDeepWorkChange(currentRecord.deepWorkMinutes + preset.mins);
                  }}
                  className="flex-1 py-1.5 rounded-lg text-xs font-semibold bg-[#0c1f2e] hover:bg-[#0e2a3f] text-[#38bdf8] border border-[#075985]/40 transition-colors shadow-xs"
                >
                  {preset.label}
                </button>
              ))}
              <button
                onClick={() => {
                  sfx.playClick();
                  handleDeepWorkChange(0);
                }}
                className="p-1.5 rounded-lg text-[#94a3b8] hover:text-white bg-[#0e1219] border border-[#181c24]"
                title="Reset duration"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
