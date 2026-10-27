import React, { useState } from 'react';
import type { DayRecord, SalahStatus, CustomHabit, AttributeType } from '../types';
import { ChevronLeft, ChevronRight, Check, Plus, Dumbbell, Clock, Trash2 } from 'lucide-react';
import { sfx } from '../utils/audio';

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

  const todayStr = new Date().toISOString().split('T')[0];

  // Retrieve or initialize record for selected date
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

  // Generate 7-day strip ending at today (or around selected date)
  const getRecentDays = () => {
    const days = [];
    const base = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(base);
      d.setDate(d.getDate() - i);
      const str = d.toISOString().split('T')[0];
      days.push({
        dateStr: str,
        dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNum: d.getDate(),
        isToday: str === todayStr,
      });
    }
    return days;
  };

  const recentDays = getRecentDays();

  // Navigation handlers
  const handleShiftDay = (offsetDays: number) => {
    sfx.playClick();
    const parts = selectedDate.split('-');
    const current = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    current.setDate(current.getDate() + offsetDays);
    const newStr = current.toISOString().split('T')[0];
    setSelectedDate(newStr);
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

  const handleAddPushups = (amount: number) => {
    sfx.playClick();
    const newCount = Math.max(0, currentRecord.pushups + amount);
    onUpdateDayRecord(
      { ...currentRecord, pushups: newCount },
      amount > 0 ? { attr: 'STR', xp: amount * 2 } : undefined
    );
  };

  const handleAddSquats = (amount: number) => {
    sfx.playClick();
    const newCount = Math.max(0, currentRecord.squats + amount);
    onUpdateDayRecord(
      { ...currentRecord, squats: newCount },
      amount > 0 ? { attr: 'STR', xp: amount * 2 } : undefined
    );
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

  const handleAddDeepWork = (mins: number) => {
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

  // Format date display (e.g. "Tuesday, October 27, 2026")
  const dateFormatted = new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="space-y-6">

      {/* 1. Date Navigator Bar */}
      <div className="ui-card p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Date Selector */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleShiftDay(-1)}
            className="p-2 rounded-lg bg-[#181a20] hover:bg-[#22252e] text-neutral-300 border border-[#272a34] transition-colors"
            title="Previous Day"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                {dateFormatted}
              </h2>
              {selectedDate === todayStr && (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#e5b869]/10 text-[#e5b869] border border-[#e5b869]/20">
                  Today
                </span>
              )}
            </div>
            <p className="text-xs text-neutral-400">
              Viewing logged habits, prayers, and volume for this day
            </p>
          </div>

          <button
            onClick={() => handleShiftDay(1)}
            className="p-2 rounded-lg bg-[#181a20] hover:bg-[#22252e] text-neutral-300 border border-[#272a34] transition-colors"
            title="Next Day"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* 7-Day Quick Strip */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {recentDays.map((day) => {
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
                className={`flex flex-col items-center px-3 py-1.5 rounded-lg border text-xs transition-all min-w-[56px] ${
                  isSelected
                    ? 'bg-[#22252e] border-[#e5b869] text-white shadow-sm ring-1 ring-[#e5b869]/30'
                    : 'bg-[#111317] border-[#20232b] text-neutral-400 hover:text-neutral-200 hover:border-[#2f333f]'
                }`}
              >
                <span className="text-[10px] font-medium uppercase text-neutral-400">{day.dayName}</span>
                <span className="font-bold text-sm my-0.5 text-white">{day.dayNum}</span>

                {/* Micro indicators: 5 prayer ticks */}
                <div className="flex items-center gap-0.5 mt-0.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${prayerCount === 5 ? 'bg-emerald-400' : prayerCount > 0 ? 'bg-amber-400' : 'bg-neutral-700'}`} />
                  {habitCount > 0 && <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />}
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
              className="text-xs px-2.5 py-2 rounded-lg bg-[#181a20] hover:bg-[#22252e] text-neutral-300 border border-[#272a34] font-medium whitespace-nowrap ml-1"
            >
              Today
            </button>
          )}
        </div>
      </div>

      {/* 2. Salah Consistency & Prayer Cards */}
      <div className="ui-card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#23262f] gap-2 mb-4">
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">
              Five Daily Prayers (Salah)
            </h3>
            <p className="text-xs text-neutral-400">
              Anchors daily circadian cadence (+50 WIS XP per prayer, +150 bonus on perfect day)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#181a20] border border-[#262933] text-neutral-300">
              {completedSalahCount} of 5 completed
            </span>
            {isAllSalahCompleted && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-950/40 text-emerald-300 border border-emerald-800/40">
                All Prayers Completed
              </span>
            )}
          </div>
        </div>

        {/* 5 Clean Prayer Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {SALAH_LIST.map(({ key, name, timeOfDay }) => {
            const isDone = currentRecord.salah[key];

            return (
              <button
                key={key}
                onClick={() => handleToggleSalah(key)}
                className={`p-4 rounded-xl border flex flex-col items-center justify-center text-center transition-all ${
                  isDone
                    ? 'bg-[#181d26] border-[#e5b869]/50 shadow-sm'
                    : 'bg-[#111317] border-[#20232b] hover:border-[#2f333f]'
                }`}
              >
                <div className="text-sm font-bold text-white mb-0.5">{name}</div>
                <div className="text-xs text-neutral-400 mb-3">{timeOfDay}</div>

                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all ${
                    isDone
                      ? 'bg-[#e5b869] border-[#e5b869] text-[#0f1115]'
                      : 'bg-[#181a20] border-[#2b2e38] text-transparent hover:border-neutral-500'
                  }`}
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Daily Habits Checklist */}
      <div className="ui-card p-6">
        <div className="flex items-center justify-between pb-4 border-b border-[#23262f] mb-4">
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">
              Daily Habits & Disciplines
            </h3>
            <p className="text-xs text-neutral-400">
              Track key physical, professional, and spiritual daily routines
            </p>
          </div>

          <button
            onClick={() => setIsAddingHabit(!isAddingHabit)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#181a20] hover:bg-[#22252e] text-neutral-200 border border-[#272a34] rounded-lg text-xs font-semibold transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> New Habit
          </button>
        </div>

        {/* Add Habit Form Modal/Dropdown */}
        {isAddingHabit && (
          <form onSubmit={handleCreateHabit} className="p-4 rounded-xl bg-[#101216] border border-[#23262f] mb-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            <input
              type="text"
              required
              value={newHabitName}
              onChange={(e) => setNewHabitName(e.target.value)}
              placeholder="e.g. Read 20 pages, Cold shower, Zero sugar, 10k steps..."
              className="flex-1 px-3 py-2 bg-[#181a20] border border-[#272a34] rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#e5b869]"
            />

            <select
              value={newHabitAttr}
              onChange={(e) => setNewHabitAttr(e.target.value as AttributeType)}
              className="px-3 py-2 bg-[#181a20] border border-[#272a34] rounded-lg text-xs text-neutral-300 focus:outline-none focus:border-[#e5b869]"
            >
              <option value="STR">STR (Physical)</option>
              <option value="INT">INT (Craft/Intellect)</option>
              <option value="WIS">WIS (Spiritual/Soul)</option>
              <option value="CHA">CHA (Social/Community)</option>
            </select>

            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-[#e5b869] text-[#0f1115] font-semibold text-xs rounded-lg hover:bg-[#d8a857] transition-colors"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => setIsAddingHabit(false)}
                className="px-3 py-2 bg-[#181a20] text-neutral-400 text-xs rounded-lg hover:text-white"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Habits List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {habits.map((habit) => {
            const isCompleted = currentRecord.completedHabitIds.includes(habit.id);

            return (
              <div
                key={habit.id}
                onClick={() => handleToggleHabit(habit.id)}
                className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  isCompleted
                    ? 'bg-[#151921] border-[#2c3444]'
                    : 'bg-[#111317] border-[#20232b] hover:border-[#2f333f]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                      isCompleted
                        ? 'bg-[#e5b869] border-[#e5b869] text-[#0f1115]'
                        : 'bg-[#181a20] border-[#2b2e38] text-transparent'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>

                  <div>
                    <span className={`text-xs font-semibold block transition-colors ${
                      isCompleted ? 'text-white' : 'text-neutral-300'
                    }`}>
                      {habit.name}
                    </span>
                    {habit.description && (
                      <span className="text-[11px] text-neutral-400 line-clamp-1">
                        {habit.description}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#181a20] text-neutral-400 border border-[#272a34]">
                    {habit.attribute}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Delete habit "${habit.name}"?`)) {
                        onDeleteHabit(habit.id);
                      }
                    }}
                    className="p-1 text-neutral-600 hover:text-rose-400 transition-colors"
                    title="Delete habit"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Physical Volume & Focus Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Physical Movement (STR) */}
        <div className="ui-card p-6">
          <div className="flex items-center justify-between pb-3 border-b border-[#23262f] mb-4">
            <div className="flex items-center gap-2">
              <Dumbbell className="w-4 h-4 text-rose-400" />
              <h3 className="text-sm font-bold text-white tracking-tight">
                Bodyweight Movement (STR)
              </h3>
            </div>
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-neutral-300">
              <input
                type="checkbox"
                checked={currentRecord.workoutCompleted}
                onChange={handleToggleWorkout}
                className="rounded border-[#2b2e38] bg-[#14161a] text-rose-500 focus:ring-0"
              />
              <span>Full Workout Session</span>
            </label>
          </div>

          <div className="space-y-3">
            {/* Pushups */}
            <div className="p-3.5 rounded-lg bg-[#101216] border border-[#20232b] flex items-center justify-between">
              <div>
                <span className="text-xs text-neutral-400 font-medium">Pushups</span>
                <div className="text-xl font-bold font-mono text-white mt-0.5">{currentRecord.pushups} reps</div>
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
                <span className="text-xs text-neutral-400 font-medium">Squats</span>
                <div className="text-xl font-bold font-mono text-white mt-0.5">{currentRecord.squats} reps</div>
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

        {/* Deep Work (INT) */}
        <div className="ui-card p-6">
          <div className="flex items-center justify-between pb-3 border-b border-[#23262f] mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-sky-400" />
              <h3 className="text-sm font-bold text-white tracking-tight">
                Deep Work Focus (INT)
              </h3>
            </div>
            <span className="text-xs font-mono font-medium text-sky-400">
              +{Math.round(currentRecord.deepWorkMinutes * 1.5)} INT XP
            </span>
          </div>

          <div className="p-3.5 rounded-lg bg-[#101216] border border-[#20232b] flex items-center justify-between mb-4">
            <div>
              <span className="text-xs text-neutral-400 font-medium">Logged Focus Time</span>
              <div className="text-xl font-bold font-mono text-white mt-0.5">
                {Math.floor(currentRecord.deepWorkMinutes / 60)}h {currentRecord.deepWorkMinutes % 60}m
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

          {/* Day Notes */}
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1">
              Day Reflection & Projects Shipped
            </label>
            <input
              type="text"
              value={currentRecord.notes || ''}
              onChange={(e) => onUpdateDayRecord({ ...currentRecord, notes: e.target.value })}
              placeholder="Key wins, shipped features, or daily reflection..."
              className="w-full px-3 py-2 bg-[#101216] border border-[#20232b] rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-sky-500"
            />
          </div>
        </div>

      </div>

    </div>
  );
};
