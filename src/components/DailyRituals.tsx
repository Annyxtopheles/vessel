import React, { useState } from 'react';
import type { DayRecord, SalahStatus, CustomHabit, AttributeType, XpEvent } from '../types';
import { Check, Plus, Dumbbell, Clock, Trash2, RotateCcw } from 'lucide-react';
import { sfx } from '../utils/audio';
import { getTodayLocalDateStr, getRelativeDayStrip } from '../utils/date';
import { XP_DISCIPLINE_REWARDS } from '../data/xpConfig';

interface DailyRitualsProps {
  dayRecords: Record<string, DayRecord>;
  habits: CustomHabit[];
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  onUpdateDayRecord: (record: DayRecord, xpGained?: { attr: 'STR' | 'INT' | 'WIS' | 'CHA'; xp: number }) => void;
  onAddHabit: (habit: CustomHabit) => void;
  onDeleteHabit: (habitId: string) => void;
  onRecordXpEvent?: (event: Omit<XpEvent, 'id'>) => void;
}

const SALAH_LIST: { key: keyof SalahStatus; name: string; timeOfDay: string }[] = [
  { key: 'fajr', name: 'Fajr', timeOfDay: 'Dawn' },
  { key: 'dhuhr', name: 'Dhuhr', timeOfDay: 'Noon' },
  { key: 'asr', name: 'Asr', timeOfDay: 'Afternoon' },
  { key: 'maghrib', name: 'Maghrib', timeOfDay: 'Sunset' },
  { key: 'isha', name: 'Isha', timeOfDay: 'Night' },
];

const HABIT_ATTR_BADGES: Record<AttributeType, string> = {
  STR: 'text-[#DC2626] bg-[#FDECEC] border-[#FDECEC]',
  INT: 'text-[#2563EB] bg-[#EBF2FE] border-[#EBF2FE]',
  WIS: 'text-[#0891B2] bg-[#E6F7F9] border-[#BCE7EB]',
  CHA: 'text-[#16A34A] bg-[#E6F6EC] border-[#E6F6EC]',
};

export const DailyRituals: React.FC<DailyRitualsProps> = ({
  dayRecords,
  habits,
  selectedDate,
  setSelectedDate,
  onUpdateDayRecord,
  onAddHabit,
  onDeleteHabit,
  onRecordXpEvent,
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
      nextVal ? { attr: 'WIS', xp: XP_DISCIPLINE_REWARDS.SALAH_PRAYER } : undefined
    );

    if (nextVal && onRecordXpEvent) {
      const prayerName = SALAH_LIST.find(s => s.key === key)?.name || key;
      onRecordXpEvent({
        action: `Salah: ${prayerName}`,
        pillar: 'WIS',
        points: XP_DISCIPLINE_REWARDS.SALAH_PRAYER,
        date: selectedDate,
        refId: `salah-${key}-${selectedDate}`,
      });

      const nextSalahCount = Object.values(updatedRecord.salah).filter(Boolean).length;
      if (nextSalahCount === 5) {
        onRecordXpEvent({
          action: 'Perfect Salah Day (5/5)',
          pillar: 'WIS',
          points: XP_DISCIPLINE_REWARDS.PERFECT_SALAH_DAY_BONUS,
          date: selectedDate,
          refId: `salah-perfect-${selectedDate}`,
        });
      }
    }
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
      !isCompleted ? { attr: habitAttr, xp: XP_DISCIPLINE_REWARDS.HABIT_COMPLETION } : undefined
    );

    if (!isCompleted && onRecordXpEvent) {
      onRecordXpEvent({
        action: `Habit: ${habitObj?.name || 'Daily Anchor'}`,
        pillar: habitAttr,
        points: XP_DISCIPLINE_REWARDS.HABIT_COMPLETION,
        date: selectedDate,
        refId: `habit-${habitId}-${selectedDate}`,
      });
    }
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
      delta > 0 ? { attr: 'STR', xp: delta * XP_DISCIPLINE_REWARDS.PUSHUP_REP } : undefined
    );

    if (delta > 0 && onRecordXpEvent) {
      onRecordXpEvent({
        action: `Pushups (+${delta} reps)`,
        pillar: 'STR',
        points: delta * XP_DISCIPLINE_REWARDS.PUSHUP_REP,
        date: selectedDate,
      });
    }
  };

  const handleSetPushupsDirect = (val: number) => {
    const nextVal = Math.max(0, val);
    const delta = nextVal - currentRecord.pushups;
    const updatedRecord: DayRecord = {
      ...currentRecord,
      pushups: nextVal,
      workoutCompleted: nextVal >= 50 || currentRecord.squats >= 50,
    };
    onUpdateDayRecord(updatedRecord);
    if (delta > 0 && onRecordXpEvent) {
      onRecordXpEvent({
        action: `Pushups (+${delta} reps)`,
        pillar: 'STR',
        points: delta * XP_DISCIPLINE_REWARDS.PUSHUP_REP,
        date: selectedDate,
      });
    }
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
      delta > 0 ? { attr: 'STR', xp: delta * XP_DISCIPLINE_REWARDS.SQUAT_REP } : undefined
    );

    if (delta > 0 && onRecordXpEvent) {
      onRecordXpEvent({
        action: `Squats (+${delta} reps)`,
        pillar: 'STR',
        points: delta * XP_DISCIPLINE_REWARDS.SQUAT_REP,
        date: selectedDate,
      });
    }
  };

  const handleSetSquatsDirect = (val: number) => {
    const nextVal = Math.max(0, val);
    const delta = nextVal - currentRecord.squats;
    const updatedRecord: DayRecord = {
      ...currentRecord,
      squats: nextVal,
      workoutCompleted: currentRecord.pushups >= 50 || nextVal >= 50,
    };
    onUpdateDayRecord(updatedRecord);
    if (delta > 0 && onRecordXpEvent) {
      onRecordXpEvent({
        action: `Squats (+${delta} reps)`,
        pillar: 'STR',
        points: delta * XP_DISCIPLINE_REWARDS.SQUAT_REP,
        date: selectedDate,
      });
    }
  };

  const handleDeepWorkChange = (minutes: number) => {
    const delta = minutes - (currentRecord.deepWorkMinutes || 0);
    const updatedRecord: DayRecord = {
      ...currentRecord,
      deepWorkMinutes: minutes,
    };
    onUpdateDayRecord(updatedRecord);
    if (delta > 0 && onRecordXpEvent) {
      onRecordXpEvent({
        action: `Deep Work Session (+${delta}m)`,
        pillar: 'INT',
        points: delta * XP_DISCIPLINE_REWARDS.DEEP_WORK_PER_MINUTE,
        date: selectedDate,
      });
    }
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

      {/* 1. 7-Day Navigation Strip & Prayer Cadence */}
      <div className="ship-card p-6 space-y-6">
        
        {/* 7-Day Date Navigation Strip */}
        <div className="flex items-center justify-between pb-4 border-b border-[#ECECF0]">
          <div className="flex items-center gap-2 overflow-x-auto w-full pb-1">
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
                  className={`flex flex-col items-center px-4 py-2.5 rounded-xl border text-xs transition-all min-w-[62px] cursor-pointer ${
                    isSelected
                      ? 'bg-[#E6F7F9] border-[#0891B2] text-[#0891B2] shadow-xs font-semibold'
                      : 'bg-white border-[#ECECF0] text-[#6B6B76] hover:text-[#111113] hover:border-[#BCE7EB]'
                  }`}
                >
                  <span className="text-[11px] uppercase tracking-wider text-[#9A9AA5] font-medium">{day.dayName}</span>
                  <span className="font-bold text-[15px] my-0.5 text-[#111113]">{day.dayNum}</span>

                  <div className="flex items-center gap-1 mt-1">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        prayerCount === 5 ? 'bg-[#0891B2]' : prayerCount > 0 ? 'bg-[#0891B2]/40' : 'bg-[#ECECF0]'
                      }`}
                    />
                    {habitCount > 0 && <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 5 Daily Prayers (Salah Cadence) */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-[15px] font-semibold text-[#111113] tracking-tight">
                  Five Daily Prayers (Salah Cadence)
                </h3>
                <span className="ship-pill-accent font-semibold">
                  {completedSalahCount} of 5 completed
                </span>
              </div>
              <p className="text-[13px] text-[#6B6B76] mt-0.5">
                Circadian spiritual anchor imparting +50 Wisdom XP per prayer
              </p>
            </div>

            {isAllSalahCompleted && (
              <span className="ship-pill-success">
                <Check className="w-3.5 h-3.5" /> Perfect 5/5 Day (+150 XP bonus)
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {SALAH_LIST.map(({ key, name, timeOfDay }) => {
              const isDone = currentRecord.salah[key];

              return (
                <button
                  key={key}
                  onClick={() => handleToggleSalah(key)}
                  className={`p-4 rounded-xl border flex flex-col items-center justify-between text-center transition-all cursor-pointer ${
                    isDone
                      ? 'bg-[#E6F7F9] border-[#0891B2]/50 text-[#111113] shadow-xs'
                      : 'bg-white border-[#ECECF0] hover:bg-[#F4F4F6] hover:border-[#BEBEC6]'
                  }`}
                >
                  <div className="text-[11px] font-medium text-[#6B6B76] mb-1">
                    {timeOfDay}
                  </div>
                  <div className="text-[15px] font-semibold text-[#111113] mb-3">{name}</div>

                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center border transition-all ${
                      isDone
                        ? 'bg-[#0891B2] border-[#0891B2] text-white shadow-xs'
                        : 'bg-[#F4F4F6] border-[#ECECF0] text-transparent hover:border-[#BEBEC6]'
                    }`}
                  >
                    <Check className="w-4 h-4 stroke-[2.5]" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

      </div>

      {/* 2. Daily Disciplines Checklist */}
      <div className="ship-card p-6">
        <div className="flex items-center justify-between pb-4 border-b border-[#ECECF0] mb-4">
          <div>
            <h3 className="text-[15px] font-semibold text-[#111113] tracking-tight">
              Daily Disciplines & Habits
            </h3>
            <p className="text-[13px] text-[#6B6B76] mt-0.5">
              Consistency rituals across physical, professional, and spiritual disciplines
            </p>
          </div>

          <button
            onClick={() => setIsAddingHabit(!isAddingHabit)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0891B2] hover:bg-[#0E7490] text-white rounded-xl text-[13px] font-semibold transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" /> New Discipline
          </button>
        </div>

        {/* Add Habit Form */}
        {isAddingHabit && (
          <form onSubmit={handleCreateHabit} className="p-4 rounded-xl bg-[#F4F4F6] border border-[#ECECF0] mb-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            <input
              type="text"
              required
              value={newHabitName}
              onChange={(e) => setNewHabitName(e.target.value)}
              placeholder="e.g. Read 20 pages, Cold shower, Zero sugar, 10k steps..."
              className="ship-input flex-1 text-[13px]"
            />

            <select
              value={newHabitAttr}
              onChange={(e) => setNewHabitAttr(e.target.value as AttributeType)}
              className="ship-input text-[13px] sm:w-48"
            >
              <option value="STR">Strength (Body)</option>
              <option value="INT">Intellect (Craft)</option>
              <option value="WIS">Wisdom (Soul)</option>
              <option value="CHA">Charisma (Community)</option>
            </select>

            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-[#0891B2] hover:bg-[#0E7490] text-white font-semibold text-[13px] rounded-xl shadow-xs transition-colors"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => setIsAddingHabit(false)}
                className="px-3 py-2 bg-white text-[#6B6B76] text-[13px] rounded-xl border border-[#ECECF0] hover:text-[#111113]"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Habits List */}
        <div className="space-y-2">
          {habits.map((habit) => {
            const isCompleted = currentRecord.completedHabitIds.includes(habit.id);

            return (
              <div
                key={habit.id}
                onClick={() => handleToggleHabit(habit.id)}
                className={`group px-4 py-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  isCompleted
                    ? 'bg-[#E6F7F9]/40 border-[#BCE7EB]'
                    : 'bg-white border-[#ECECF0] hover:bg-[#F4F4F6] hover:border-[#BEBEC6]'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                      isCompleted
                        ? 'bg-[#0891B2] border-[#0891B2] text-white shadow-xs'
                        : 'bg-white border-[#ECECF0] text-transparent group-hover:border-[#BEBEC6]'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>

                  <div>
                    <span className={`text-[14px] font-medium block transition-colors ${
                      isCompleted ? 'line-through text-[#9A9AA5]' : 'text-[#111113]'
                    }`}>
                      {habit.name}
                    </span>
                    {habit.description && (
                      <span className="text-[12px] text-[#6B6B76] line-clamp-1">
                        {habit.description}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <span className={`text-[11px] px-2.5 py-0.5 rounded-full border font-semibold ${HABIT_ATTR_BADGES[habit.attribute]}`}>
                    {habit.attribute}
                  </span>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      sfx.playClick();
                      onDeleteHabit(habit.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-[#9A9AA5] hover:text-[#DC2626] transition-opacity"
                    title="Delete discipline"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Physical Training Volume & Deep Work */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* Pushups & Squats Card */}
        <div className="ship-card p-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#ECECF0] mb-4">
            <div className="flex items-center gap-3">
              <div className="ship-icon-tile">
                <Dumbbell className="w-5 h-5 text-[#0891B2]" />
              </div>
              <div>
                <h3 className="text-[15px] font-semibold text-[#111113] tracking-tight">
                  Bodyweight Movement (Strength)
                </h3>
                <p className="text-[12px] text-[#6B6B76]">Daily physical conditioning</p>
              </div>
            </div>

            {currentRecord.workoutCompleted && (
              <span className="ship-pill-success inline-flex items-center gap-1.5 text-[12px]">
                <Check className="w-3.5 h-3.5" /> Full Workout (+120 XP)
              </span>
            )}
          </div>

          <div className="space-y-4">
            {/* Pushups Stepper */}
            <div className="p-4 rounded-xl bg-[#F4F4F6] border border-[#ECECF0]">
              <div className="flex justify-between items-center mb-2.5">
                <span className="text-[13px] font-semibold text-[#111113]">Pushups Completed</span>
                <span className="text-[12px] font-semibold text-[#DC2626]">
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
                    className="w-20 px-2 py-1.5 bg-white border border-[#ECECF0] rounded-xl text-base font-bold text-[#111113] text-center focus:outline-none focus:border-[#0891B2]"
                  />
                  <span className="text-[13px] text-[#6B6B76]">reps</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleAdjustPushups(-10)}
                    className="px-2 py-1 bg-white hover:bg-[#EAEAEF] text-[#6B6B76] border border-[#ECECF0] rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                  >
                    -10
                  </button>
                  <button
                    onClick={() => handleAdjustPushups(-5)}
                    className="px-2 py-1 bg-white hover:bg-[#EAEAEF] text-[#6B6B76] border border-[#ECECF0] rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                  >
                    -5
                  </button>
                  <button
                    onClick={() => handleAdjustPushups(5)}
                    className="px-2 py-1 bg-white hover:bg-[#EAEAEF] text-[#111113] border border-[#ECECF0] rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                  >
                    +5
                  </button>
                  <button
                    onClick={() => handleAdjustPushups(10)}
                    className="px-2 py-1 bg-white hover:bg-[#EAEAEF] text-[#111113] border border-[#ECECF0] rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                  >
                    +10
                  </button>
                  <button
                    onClick={() => handleAdjustPushups(25)}
                    className="px-2.5 py-1 bg-[#E6F7F9] hover:bg-[#D4F1F5] text-[#0891B2] border border-[#BCE7EB] rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                  >
                    +25
                  </button>
                </div>
              </div>
            </div>

            {/* Squats Stepper */}
            <div className="p-4 rounded-xl bg-[#F4F4F6] border border-[#ECECF0]">
              <div className="flex justify-between items-center mb-2.5">
                <span className="text-[13px] font-semibold text-[#111113]">Bodyweight Squats</span>
                <span className="text-[12px] font-semibold text-[#DC2626]">
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
                    className="w-20 px-2 py-1.5 bg-white border border-[#ECECF0] rounded-xl text-base font-bold text-[#111113] text-center focus:outline-none focus:border-[#0891B2]"
                  />
                  <span className="text-[13px] text-[#6B6B76]">reps</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleAdjustSquats(-10)}
                    className="px-2 py-1 bg-white hover:bg-[#EAEAEF] text-[#6B6B76] border border-[#ECECF0] rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                  >
                    -10
                  </button>
                  <button
                    onClick={() => handleAdjustSquats(-5)}
                    className="px-2 py-1 bg-white hover:bg-[#EAEAEF] text-[#6B6B76] border border-[#ECECF0] rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                  >
                    -5
                  </button>
                  <button
                    onClick={() => handleAdjustSquats(5)}
                    className="px-2 py-1 bg-white hover:bg-[#EAEAEF] text-[#111113] border border-[#ECECF0] rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                  >
                    +5
                  </button>
                  <button
                    onClick={() => handleAdjustSquats(10)}
                    className="px-2 py-1 bg-white hover:bg-[#EAEAEF] text-[#111113] border border-[#ECECF0] rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                  >
                    +10
                  </button>
                  <button
                    onClick={() => handleAdjustSquats(25)}
                    className="px-2.5 py-1 bg-[#E6F7F9] hover:bg-[#D4F1F5] text-[#0891B2] border border-[#BCE7EB] rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                  >
                    +25
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Deep Work Focus Card */}
        <div className="ship-card p-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#ECECF0] mb-4">
            <div className="flex items-center gap-3">
              <div className="ship-icon-tile">
                <Clock className="w-5 h-5 text-[#0891B2]" />
              </div>
              <div>
                <h3 className="text-[15px] font-semibold text-[#111113] tracking-tight">
                  Deep Work Focus (Intellect)
                </h3>
                <p className="text-[12px] text-[#6B6B76]">Architecture & uninterrupted build cycles</p>
              </div>
            </div>

            <span className="ship-pill-accent font-semibold">
              +{Math.round((currentRecord.deepWorkMinutes / 60) * 60)} XP
            </span>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-[#F4F4F6] border border-[#ECECF0]">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[13px] text-[#6B6B76]">Logged Focus Duration</span>
                <span className="text-[20px] font-bold text-[#111113]">
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
                className="w-full accent-[#0891B2] cursor-pointer"
              />

              <div className="flex justify-between text-[11px] text-[#9A9AA5] mt-1.5 font-medium">
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
                  className="flex-1 py-2 rounded-xl text-[13px] font-semibold bg-[#E6F7F9] hover:bg-[#D4F1F5] text-[#0891B2] border border-[#BCE7EB] transition-colors shadow-xs"
                >
                  {preset.label}
                </button>
              ))}
              <button
                onClick={() => {
                  sfx.playClick();
                  handleDeepWorkChange(0);
                }}
                className="p-2 rounded-xl text-[#9A9AA5] hover:text-[#111113] bg-white border border-[#ECECF0] hover:bg-[#F4F4F6] transition-colors"
                title="Reset duration"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
