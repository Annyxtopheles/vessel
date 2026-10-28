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
  STR: 'text-[#e08279] bg-[#271a1c] border-[#44282c]',
  INT: 'text-[#85a6cf] bg-[#15202c] border-[#253549]',
  WIS: 'text-[#a5b4fc] bg-[#1e1b4b]/60 border-[#312e81]',
  CHA: 'text-[#8ebd9b] bg-[#1a251e] border-[#2a3e30]',
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
      <div className="bg-[#12141a] border border-[#20232c] rounded-xl p-5 space-y-5">
        
        {/* 7-Day Navigation Strip */}
        <div className="flex items-center justify-between pb-3.5 border-b border-[#1c1e26]">
          <div className="flex items-center gap-1.5 overflow-x-auto w-full">
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
                  className={`flex flex-col items-center px-3.5 py-1.5 rounded-lg border text-xs transition-all min-w-[56px] ${
                    isSelected
                      ? 'bg-[#181a26] border-[#383d57] text-white shadow-xs font-semibold'
                      : 'bg-[#0d0e12] border-[#1c1f28] text-[#8a8f98] hover:text-white hover:border-[#2b2f3d]'
                  }`}
                >
                  <span className="text-[10px] font-mono uppercase text-[#8a8f98]">{day.dayName}</span>
                  <span className="font-bold text-sm my-0.5 text-white">{day.dayNum}</span>

                  <div className="flex items-center gap-1 mt-0.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      prayerCount === 5 ? 'bg-[#5e6ad2]' : prayerCount > 0 ? 'bg-[#5e6ad2]/50' : 'bg-[#2b2e3a]'
                    }`} />
                    {habitCount > 0 && <span className="w-1.5 h-1.5 rounded-full bg-[#85a6cf]" />}
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
                <span className="linear-tag text-[#a5b4fc]">
                  {completedSalahCount} of 5 completed
                </span>
              </div>
              <p className="text-xs text-[#8a8f98] mt-0.5">
                Anchors circadian rhythm (+50 Wisdom XP per prayer)
              </p>
            </div>

            {isAllSalahCompleted && (
              <span className="linear-tag text-[#8ebd9b] border-[#27382c] bg-[#16221a] flex items-center gap-1">
                <Check className="w-3 h-3 text-[#8ebd9b]" /> Perfect 5/5 Day (+150 XP bonus)
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
                      ? 'bg-[#141624] border-[#2e3352] text-white shadow-xs'
                      : 'bg-[#0d0e12] border-[#1f222b] hover:bg-[#14161f] hover:border-[#2b2f3c]'
                  }`}
                >
                  <div className="text-[10px] uppercase font-mono tracking-wider text-[#8a8f98] mb-1">
                    {timeOfDay}
                  </div>
                  <div className="text-sm font-semibold text-white mb-3">{name}</div>

                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all ${
                      isDone
                        ? 'bg-[#5e6ad2] border-[#5e6ad2] text-white'
                        : 'bg-[#161820] border-[#2c303d] text-transparent hover:border-[#404558]'
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
      <div className="bg-[#12141a] border border-[#20232c] rounded-xl p-5">
        <div className="flex items-center justify-between pb-3.5 border-b border-[#1c1e26] mb-4">
          <div>
            <h3 className="text-sm font-semibold text-white tracking-tight">
              Daily Disciplines & Habits
            </h3>
            <p className="text-xs text-[#8a8f98]">
              Consistency rituals across physical, professional, and spiritual disciplines
            </p>
          </div>

          <button
            onClick={() => setIsAddingHabit(!isAddingHabit)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#161822] hover:bg-[#202330] text-[#f3f4f6] border border-[#262936] rounded-md text-xs font-medium transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-[#818cf8]" /> New Discipline
          </button>
        </div>

        {/* Add Habit Form */}
        {isAddingHabit && (
          <form onSubmit={handleCreateHabit} className="p-3.5 rounded-lg bg-[#0d0e12] border border-[#222530] mb-4 flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
            <input
              type="text"
              required
              value={newHabitName}
              onChange={(e) => setNewHabitName(e.target.value)}
              placeholder="e.g. Read 20 pages, Cold shower, Zero sugar, 10k steps..."
              className="flex-1 px-3 py-1.5 bg-[#12141a] border border-[#20232c] rounded-md text-xs text-white placeholder-[#525666] focus:outline-none focus:border-[#5e6ad2]"
            />

            <select
              value={newHabitAttr}
              onChange={(e) => setNewHabitAttr(e.target.value as AttributeType)}
              className="px-3 py-1.5 bg-[#12141a] border border-[#20232c] rounded-md text-xs text-neutral-300 focus:outline-none focus:border-[#5e6ad2]"
            >
              <option value="STR">Strength (Body)</option>
              <option value="INT">Intellect (Craft)</option>
              <option value="WIS">Wisdom (Soul)</option>
              <option value="CHA">Charisma (Community)</option>
            </select>

            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="px-3 py-1.5 bg-[#5e6ad2] text-white font-semibold text-xs rounded-md hover:bg-[#4f56e9] transition-colors"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => setIsAddingHabit(false)}
                className="px-2.5 py-1.5 bg-[#161822] text-[#8a8f98] text-xs rounded-md hover:text-white"
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
                    ? 'bg-[#151722] border-[#25293d]'
                    : 'bg-[#0d0e12] border-[#1d2028] hover:bg-[#14161f] hover:border-[#272b38]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                      isCompleted
                        ? 'bg-[#5e6ad2] border-[#5e6ad2] text-white'
                        : 'bg-[#161820] border-[#2a2e3a] text-transparent'
                    }`}
                  >
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>

                  <div>
                    <span className={`text-xs font-medium block transition-colors ${
                      isCompleted ? 'line-through text-[#8a8f98]' : 'text-[#ededed]'
                    }`}>
                      {habit.name}
                    </span>
                    {habit.description && (
                      <span className="text-[11px] text-[#6b7280] line-clamp-1">
                        {habit.description}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase tracking-wider ${HABIT_ATTR_BADGES[habit.attribute]}`}>
                    [{habit.attribute}]
                  </span>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      sfx.playClick();
                      onDeleteHabit(habit.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-[#8a8f98] hover:text-rose-400 transition-opacity"
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
        <div className="bg-[#12141a] border border-[#20232c] rounded-xl p-5">
          <div className="flex items-center justify-between pb-3.5 border-b border-[#1c1e26] mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-[#271a1c] border border-[#44282c] text-[#df8276]">
                <Dumbbell className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-white tracking-tight">
                Bodyweight Movement (Strength)
              </h3>
            </div>

            {currentRecord.workoutCompleted && (
              <span className="linear-tag text-[#8ebd9b] border-[#27382c] bg-[#16221a] flex items-center gap-1">
                <Check className="w-3 h-3 text-[#8ebd9b]" /> Full Workout (+120 XP)
              </span>
            )}
          </div>

          <div className="space-y-4">
            {/* Pushups Stepper */}
            <div className="p-3 rounded-lg bg-[#0d0e12] border border-[#1d2028]">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-semibold text-[#ededed]">Pushups Completed</span>
                <span className="text-xs font-mono text-[#e08279]">
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
                    className="w-16 px-2 py-1 bg-[#12141a] border border-[#20232c] rounded-md text-base font-bold font-mono text-white text-center focus:outline-none focus:border-[#5e6ad2]"
                  />
                  <span className="text-xs text-[#8a8f98] font-mono">reps</span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleAdjustPushups(-10)}
                    className="linear-tag hover:bg-[#1f222d] hover:text-white transition-colors cursor-pointer"
                  >
                    -10
                  </button>
                  <button
                    onClick={() => handleAdjustPushups(-5)}
                    className="linear-tag hover:bg-[#1f222d] hover:text-white transition-colors cursor-pointer"
                  >
                    -5
                  </button>
                  <button
                    onClick={() => handleAdjustPushups(5)}
                    className="linear-tag hover:bg-[#1f222d] hover:text-white transition-colors cursor-pointer text-[#ededed]"
                  >
                    +5
                  </button>
                  <button
                    onClick={() => handleAdjustPushups(10)}
                    className="linear-tag hover:bg-[#1f222d] hover:text-white transition-colors cursor-pointer text-[#ededed]"
                  >
                    +10
                  </button>
                  <button
                    onClick={() => handleAdjustPushups(25)}
                    className="linear-tag hover:bg-[#1f222d] hover:text-white transition-colors cursor-pointer text-[#ededed]"
                  >
                    +25
                  </button>
                </div>
              </div>
            </div>

            {/* Squats Stepper */}
            <div className="p-3 rounded-lg bg-[#0d0e12] border border-[#1d2028]">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-semibold text-[#ededed]">Bodyweight Squats</span>
                <span className="text-xs font-mono text-[#e08279]">
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
                    className="w-16 px-2 py-1 bg-[#12141a] border border-[#20232c] rounded-md text-base font-bold font-mono text-white text-center focus:outline-none focus:border-[#5e6ad2]"
                  />
                  <span className="text-xs text-[#8a8f98] font-mono">reps</span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleAdjustSquats(-10)}
                    className="linear-tag hover:bg-[#1f222d] hover:text-white transition-colors cursor-pointer"
                  >
                    -10
                  </button>
                  <button
                    onClick={() => handleAdjustSquats(-5)}
                    className="linear-tag hover:bg-[#1f222d] hover:text-white transition-colors cursor-pointer"
                  >
                    -5
                  </button>
                  <button
                    onClick={() => handleAdjustSquats(5)}
                    className="linear-tag hover:bg-[#1f222d] hover:text-white transition-colors cursor-pointer text-[#ededed]"
                  >
                    +5
                  </button>
                  <button
                    onClick={() => handleAdjustSquats(10)}
                    className="linear-tag hover:bg-[#1f222d] hover:text-white transition-colors cursor-pointer text-[#ededed]"
                  >
                    +10
                  </button>
                  <button
                    onClick={() => handleAdjustSquats(25)}
                    className="linear-tag hover:bg-[#1f222d] hover:text-white transition-colors cursor-pointer text-[#ededed]"
                  >
                    +25
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Deep Work Focus Card */}
        <div className="bg-[#12141a] border border-[#20232c] rounded-xl p-5">
          <div className="flex items-center justify-between pb-3.5 border-b border-[#1c1e26] mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-[#15202c] border border-[#253549] text-[#86a6cf]">
                <Clock className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-white tracking-tight">
                Deep Work Focus (Intellect)
              </h3>
            </div>

            <span className="linear-tag text-[#85a6cf]">
              +{Math.round((currentRecord.deepWorkMinutes / 60) * 60)} XP
            </span>
          </div>

          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-[#0d0e12] border border-[#1d2028]">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-[#8a8f98]">Logged Focus Duration</span>
                <span className="text-lg font-bold font-mono text-white">
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
                className="w-full accent-[#5e6ad2] cursor-pointer"
              />

              <div className="flex justify-between text-[10px] font-mono text-[#8a8f98] mt-1">
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
                  className="flex-1 py-1.5 rounded-lg text-xs font-mono bg-[#141620] hover:bg-[#1d2030] text-[#c7d2fe] border border-[#262a40] transition-colors"
                >
                  {preset.label}
                </button>
              ))}
              <button
                onClick={() => {
                  sfx.playClick();
                  handleDeepWorkChange(0);
                }}
                className="p-1.5 rounded-lg text-[#8a8f98] hover:text-white bg-[#141620] border border-[#262a40]"
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
