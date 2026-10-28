import React, { useState } from 'react';
import type { DayRecord, SalahStatus, CustomHabit, AttributeType } from '../types';
import { ChevronLeft, ChevronRight, Check, Plus, Dumbbell, Clock, Trash2, RotateCcw } from 'lucide-react';
import { sfx } from '../utils/audio';
import { getTodayLocalDateStr, shiftDate, formatHumanDate, getRelativeDayStrip } from '../utils/date';

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
  STR: 'text-[#df8276] bg-[#271a1c] border-[#44282c]',
  INT: 'text-[#86a6cf] bg-[#15202c] border-[#253549]',
  WIS: 'text-[#d8b46b] bg-[#272115] border-[#463821]',
  CHA: 'text-[#93bfa0] bg-[#1a251e] border-[#2a3e30]',
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

  const completedSalahCount = Object.values(currentRecord.salah).filter(Boolean).length;
  const isAllSalahCompleted = completedSalahCount === 5;

  // Dynamic 7-day strip centered on selected date
  const dayStrip = getRelativeDayStrip(selectedDate, todayStr);

  const handleShiftDay = (offsetDays: number) => {
    sfx.playClick();
    const nextDate = shiftDate(selectedDate, offsetDays);
    setSelectedDate(nextDate);
  };

  const handleToggleSalah = (key: keyof SalahStatus) => {
    const nextVal = !currentRecord.salah[key];
    const newSalah = { ...currentRecord.salah, [key]: nextVal };

    if (nextVal) sfx.playRunicHarmonic();
    else sfx.playClick();

    onUpdateDayRecord(
      { ...currentRecord, salah: newSalah },
      nextVal ? { attr: 'WIS', xp: 50 } : undefined
    );
  };

  const handleToggleHabit = (habitId: string) => {
    sfx.playClick();
    const isCompleted = currentRecord.completedHabitIds.includes(habitId);
    const updatedIds = isCompleted
      ? currentRecord.completedHabitIds.filter(id => id !== habitId)
      : [...currentRecord.completedHabitIds, habitId];

    const habit = habits.find(h => h.id === habitId);

    onUpdateDayRecord(
      { ...currentRecord, completedHabitIds: updatedIds },
      !isCompleted && habit ? { attr: habit.attribute, xp: 40 } : undefined
    );
  };

  // Adjust pushups with both addition and reduction
  const handleAdjustPushups = (amount: number) => {
    sfx.playClick();
    const newCount = Math.max(0, currentRecord.pushups + amount);
    onUpdateDayRecord(
      { ...currentRecord, pushups: newCount },
      amount > 0 ? { attr: 'STR', xp: amount * 2 } : undefined
    );
  };

  const handleSetPushupsDirect = (val: number) => {
    const newCount = Math.max(0, isNaN(val) ? 0 : val);
    onUpdateDayRecord({ ...currentRecord, pushups: newCount });
  };

  // Adjust squats with both addition and reduction
  const handleAdjustSquats = (amount: number) => {
    sfx.playClick();
    const newCount = Math.max(0, currentRecord.squats + amount);
    onUpdateDayRecord(
      { ...currentRecord, squats: newCount },
      amount > 0 ? { attr: 'STR', xp: amount * 2 } : undefined
    );
  };

  const handleSetSquatsDirect = (val: number) => {
    const newCount = Math.max(0, isNaN(val) ? 0 : val);
    onUpdateDayRecord({ ...currentRecord, squats: newCount });
  };

  const handleToggleWorkout = () => {
    const nextVal = !currentRecord.workoutCompleted;
    if (nextVal) sfx.playRunicHarmonic();
    else sfx.playClick();

    onUpdateDayRecord(
      { ...currentRecord, workoutCompleted: nextVal },
      nextVal ? { attr: 'STR', xp: 120 } : undefined
    );
  };

  // Adjust deep work with both addition and reduction
  const handleAdjustDeepWork = (mins: number) => {
    sfx.playClick();
    const newMins = Math.max(0, currentRecord.deepWorkMinutes + mins);
    onUpdateDayRecord(
      { ...currentRecord, deepWorkMinutes: newMins },
      mins > 0 ? { attr: 'INT', xp: Math.round(mins * 1.5) } : undefined
    );
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

  const dateFormatted = formatHumanDate(selectedDate);

  return (
    <div className="space-y-6">

      {/* 1. Linear-style Date Navigator Bar */}
      <div className="bg-[#12141a] border border-[#20232c] rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Date Selector */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleShiftDay(-1)}
            className="p-1.5 rounded-md bg-[#161820] hover:bg-[#1e202a] text-[#8a8f98] hover:text-white border border-[#222530] transition-colors"
            title="Previous Day"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-white tracking-tight">
                {dateFormatted}
              </h2>
              {selectedDate === todayStr && (
                <span className="linear-tag text-[#d8b46b] border-[#443823] bg-[#221c13]">
                  Today
                </span>
              )}
            </div>
            <p className="text-xs text-[#8a8f98]">
              Daily ritual cadence and logged volume
            </p>
          </div>

          <button
            onClick={() => handleShiftDay(1)}
            className="p-1.5 rounded-md bg-[#161820] hover:bg-[#1e202a] text-[#8a8f98] hover:text-white border border-[#222530] transition-colors"
            title="Next Day"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* 7-Day Quick Strip */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
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
                className={`flex flex-col items-center px-3 py-1.5 rounded-lg border text-xs transition-all min-w-[54px] ${
                  isSelected
                    ? 'bg-[#1e202a] border-[#383d4c] text-white shadow-xs'
                    : 'bg-[#12141a] border-[#1d2028] text-[#8a8f98] hover:text-white hover:border-[#2b2e3a]'
                }`}
              >
                <span className="text-[10px] font-mono uppercase text-[#8a8f98]">{day.dayName}</span>
                <span className="font-bold text-sm my-0.5 text-white">{day.dayNum}</span>

                <div className="flex items-center gap-1 mt-0.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${prayerCount === 5 ? 'bg-[#d8b46b]' : prayerCount > 0 ? 'bg-[#b8944d]/70' : 'bg-[#2b2e3a]'}`} />
                  {habitCount > 0 && <span className="w-1.5 h-1.5 rounded-full bg-[#86a6cf]" />}
                </div>
              </button>
            );
          })}

          {selectedDate !== todayStr && (
            <button
              onClick={() => {
                sfx.playClick();
                setSelectedDate(todayStr);
              }}
              className="text-xs px-2.5 py-2 rounded-md bg-[#161820] hover:bg-[#1e202a] text-[#8a8f98] hover:text-white border border-[#222530] font-medium whitespace-nowrap ml-1"
            >
              Today
            </button>
          )}
        </div>
      </div>

      {/* 2. Serene Salah Cadence Strip (Recommendation 3) */}
      <div className="ui-card p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 border-b border-[#1c1e26] gap-2 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-white tracking-tight">
                Five Daily Prayers (Salah Cadence)
              </h3>
              <span className="linear-tag text-[#d8b46b]">
                {completedSalahCount} of 5 completed
              </span>
            </div>
            <p className="text-xs text-[#8a8f98] mt-0.5">
              Anchors circadian rhythm (+50 Wisdom XP per prayer)
            </p>
          </div>

          {isAllSalahCompleted && (
            <span className="linear-tag text-[#93bfa0] border-[#27382c] bg-[#16221a] flex items-center gap-1">
              <Check className="w-3 h-3 text-[#93bfa0]" /> Perfect 5/5 Day (+150 XP bonus)
            </span>
          )}
        </div>

        {/* 5 Sleek Linear Prayer Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {SALAH_LIST.map(({ key, name, timeOfDay }) => {
            const isDone = currentRecord.salah[key];

            return (
              <button
                key={key}
                onClick={() => handleToggleSalah(key)}
                className={`p-3.5 rounded-lg border flex flex-col items-center justify-between text-center transition-all cursor-pointer ${
                  isDone
                    ? 'bg-[#181611] border-[#3f3420] text-white shadow-xs'
                    : 'bg-[#12141a] border-[#1f222b] hover:bg-[#161820] hover:border-[#2b2f3c]'
                }`}
              >
                <div className="text-[10px] uppercase font-mono tracking-wider text-[#8a8f98] mb-1">
                  {timeOfDay}
                </div>
                <div className="text-sm font-semibold text-white mb-3">{name}</div>

                {/* Linear Status Circle Toggle */}
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all ${
                    isDone
                      ? 'bg-[#d8b46b] border-[#d8b46b] text-[#0d0e12]'
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

      {/* 3. Daily Habits Checklist (Linear Task Style) */}
      <div className="ui-card p-5">
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
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#161820] hover:bg-[#1e202a] text-[#ededed] border border-[#222530] rounded-md text-xs font-medium transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> New Discipline
          </button>
        </div>

        {/* Add Habit Form */}
        {isAddingHabit && (
          <form onSubmit={handleCreateHabit} className="p-3.5 rounded-lg bg-[#0e1014] border border-[#222530] mb-4 flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
            <input
              type="text"
              required
              value={newHabitName}
              onChange={(e) => setNewHabitName(e.target.value)}
              placeholder="e.g. Read 20 pages, Cold shower, Zero sugar, 10k steps..."
              className="flex-1 px-3 py-1.5 bg-[#14161d] border border-[#222530] rounded-md text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#d8b46b]"
            />

            <select
              value={newHabitAttr}
              onChange={(e) => setNewHabitAttr(e.target.value as AttributeType)}
              className="px-3 py-1.5 bg-[#14161d] border border-[#222530] rounded-md text-xs text-neutral-300 focus:outline-none focus:border-[#d8b46b]"
            >
              <option value="STR">Strength (Body)</option>
              <option value="INT">Intellect (Craft)</option>
              <option value="WIS">Wisdom (Soul)</option>
              <option value="CHA">Charisma (Community)</option>
            </select>

            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="px-3 py-1.5 bg-[#d8b46b] text-[#0d0e12] font-semibold text-xs rounded-md hover:bg-[#c5a059] transition-colors"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => setIsAddingHabit(false)}
                className="px-2.5 py-1.5 bg-[#161820] text-[#8a8f98] text-xs rounded-md hover:text-white"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Habits List (Linear Row Style) */}
        <div className="space-y-1.5">
          {habits.map((habit) => {
            const isCompleted = currentRecord.completedHabitIds.includes(habit.id);

            return (
              <div
                key={habit.id}
                onClick={() => handleToggleHabit(habit.id)}
                className={`group px-3 py-2.5 rounded-lg border flex items-center justify-between cursor-pointer transition-all ${
                  isCompleted
                    ? 'bg-[#15171f] border-[#222632]'
                    : 'bg-[#12141a] border-[#1d2028] hover:bg-[#161820] hover:border-[#272b38]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                      isCompleted
                        ? 'bg-[#d8b46b] border-[#d8b46b] text-[#0d0e12]'
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
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${HABIT_ATTR_BADGES[habit.attribute]}`}>
                    [{habit.attribute}]
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Delete discipline "${habit.name}"?`)) {
                        onDeleteHabit(habit.id);
                      }
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-[#6b7280] hover:text-rose-400 transition-opacity"
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

      {/* 4. Physical Volume & Focus Grid (Linear Metric Cards) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Physical Movement (Strength) */}
        <div className="ui-card p-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#1c1e26] mb-4">
            <div className="flex items-center gap-2">
              <Dumbbell className="w-4 h-4 text-[#df8276]" />
              <h3 className="text-sm font-semibold text-white tracking-tight">
                Bodyweight Movement (Strength)
              </h3>
            </div>
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-[#8a8f98]">
              <input
                type="checkbox"
                checked={currentRecord.workoutCompleted}
                onChange={handleToggleWorkout}
                className="rounded border-[#2b2e38] bg-[#14161a] text-[#df8276] focus:ring-0"
              />
              <span>Full Workout (<span className="text-[#df8276] font-mono">+120 XP</span>)</span>
            </label>
          </div>

          <div className="space-y-3">
            {/* Pushups Stepper */}
            <div className="p-3 rounded-lg bg-[#0e1014] border border-[#1d2028]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-[#8a8f98] font-medium">Pushups Completed</span>
                <span className="text-[11px] text-[#df8276] font-mono">+{currentRecord.pushups * 2} XP</span>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
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
                    className="w-16 px-2 py-1 bg-[#14161d] border border-[#222530] rounded-md text-base font-bold font-mono text-white text-center focus:outline-none focus:border-[#d8b46b]"
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
            <div className="p-3 rounded-lg bg-[#0e1014] border border-[#1d2028]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-[#8a8f98] font-medium">Bodyweight Squats</span>
                <span className="text-[11px] text-[#df8276] font-mono">+{currentRecord.squats * 2} XP</span>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
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
                    className="w-16 px-2 py-1 bg-[#14161d] border border-[#222530] rounded-md text-base font-bold font-mono text-white text-center focus:outline-none focus:border-[#d8b46b]"
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
                    onClick={() => handleAdjustSquats(10)}
                    className="linear-tag hover:bg-[#1f222d] hover:text-white transition-colors cursor-pointer text-[#ededed]"
                  >
                    +10
                  </button>
                  <button
                    onClick={() => handleAdjustSquats(20)}
                    className="linear-tag hover:bg-[#1f222d] hover:text-white transition-colors cursor-pointer text-[#ededed]"
                  >
                    +20
                  </button>
                  <button
                    onClick={() => handleAdjustSquats(50)}
                    className="linear-tag hover:bg-[#1f222d] hover:text-white transition-colors cursor-pointer text-[#ededed]"
                  >
                    +50
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Deep Work Focus (Intellect) */}
        <div className="ui-card p-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#1c1e26] mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#86a6cf]" />
              <h3 className="text-sm font-semibold text-white tracking-tight">
                Deep Work Focus (Intellect)
              </h3>
            </div>
            <span className="linear-tag text-[#86a6cf]">
              +{Math.round(currentRecord.deepWorkMinutes * 1.5)} XP
            </span>
          </div>

          <div className="p-3 rounded-lg bg-[#0e1014] border border-[#1d2028] mb-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-[#8a8f98] font-medium">Logged Focus Duration</span>
              <span className="text-lg font-bold font-mono text-[#86a6cf]">
                {Math.floor(currentRecord.deepWorkMinutes / 60)}h {currentRecord.deepWorkMinutes % 60}m
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-1 pt-2 border-t border-[#181a22]">
              <button
                onClick={() => handleAdjustDeepWork(-30)}
                className="linear-tag hover:bg-[#1f222d] hover:text-white transition-colors cursor-pointer"
              >
                -30m
              </button>
              <button
                onClick={() => handleAdjustDeepWork(-15)}
                className="linear-tag hover:bg-[#1f222d] hover:text-white transition-colors cursor-pointer"
              >
                -15m
              </button>
              <button
                onClick={() => handleAdjustDeepWork(30)}
                className="linear-tag hover:bg-[#1f222d] hover:text-white transition-colors cursor-pointer text-[#ededed]"
              >
                +30m
              </button>
              <button
                onClick={() => handleAdjustDeepWork(60)}
                className="linear-tag hover:bg-[#1f222d] hover:text-white transition-colors cursor-pointer text-[#ededed]"
              >
                +60m
              </button>
              {currentRecord.deepWorkMinutes > 0 && (
                <button
                  onClick={() => onUpdateDayRecord({ ...currentRecord, deepWorkMinutes: 0 })}
                  className="p-1 rounded bg-[#161820] text-[#8a8f98] hover:text-rose-400 border border-[#222530]"
                  title="Reset to 0"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Day Notes */}
          <div>
            <label className="block text-xs font-medium text-[#8a8f98] mb-1">
              Day Reflection & Shipped Commits
            </label>
            <input
              type="text"
              value={currentRecord.notes || ''}
              onChange={(e) => onUpdateDayRecord({ ...currentRecord, notes: e.target.value })}
              placeholder="What did you build or reflect upon today?"
              className="w-full px-3 py-1.5 bg-[#0e1014] border border-[#20232c] rounded-md text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-[#86a6cf]"
            />
          </div>
        </div>

      </div>

    </div>
  );
};
