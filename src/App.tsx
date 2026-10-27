import React, { useState, useEffect, useRef } from 'react';
import type { InventoryItem, CharacterProfile, SkillNode, DayRecord, CustomHabit } from './types';
import { loadItems, saveItems, loadProfile, saveProfile, loadSkills, saveSkills, loadDayRecords, saveDayRecords, loadHabits, saveHabits, exportSaveFile, importSaveFile } from './utils/storage';
import { Header } from './components/Header';
import { PaperdollView } from './components/PaperdollView';
import { InventoryGrid } from './components/InventoryGrid';
import { ItemInspectModal } from './components/ItemInspectModal';
import { AddItemModal } from './components/AddItemModal';
import { CharacterCodex } from './components/CharacterCodex';
import { DailyRituals } from './components/DailyRituals';
import { sfx } from './utils/audio';

export const App: React.FC = () => {
  const [items, setItems] = useState<InventoryItem[]>(() => loadItems());
  const [profile, setProfile] = useState<CharacterProfile>(() => loadProfile());
  const [skills, setSkills] = useState<SkillNode[]>(() => loadSkills());
  const [habits, setHabits] = useState<CustomHabit[]>(() => loadHabits());
  const [dayRecords, setDayRecords] = useState<Record<string, DayRecord>>(() => loadDayRecords());
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().split('T')[0]);

  const [activeTab, setActiveTab] = useState<'inventory' | 'codex' | 'rituals'>('inventory');
  const [inspectedItem, setInspectedItem] = useState<InventoryItem | null>(null);
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Sync state to local storage
  useEffect(() => {
    saveItems(items);
  }, [items]);

  useEffect(() => {
    saveProfile(profile);
  }, [profile]);

  useEffect(() => {
    saveSkills(skills);
  }, [skills]);

  useEffect(() => {
    saveHabits(habits);
  }, [habits]);

  useEffect(() => {
    saveDayRecords(dayRecords);
  }, [dayRecords]);

  // Audio mute state
  useEffect(() => {
    sfx.setMuted(isMuted);
  }, [isMuted]);

  // Derived state: equipped items
  const equippedItems = items.filter(it => it.isEquipped && !it.isLocked);
  const currentEncumbrance = items
    .filter(it => !it.isLocked)
    .reduce((acc, it) => acc + it.weightKg, 0);
  const totalGoldValue = items
    .filter(it => !it.isLocked)
    .reduce((acc, it) => acc + it.goldValue, 0);

  // Equip / Unequip Toggle
  const handleToggleEquip = (item: InventoryItem) => {
    if (item.isLocked) return;

    const nextEquipped = !item.isEquipped;

    const updatedItems = items.map(it => {
      if (nextEquipped && item.equipSlot && it.equipSlot === item.equipSlot && it.id !== item.id) {
        return { ...it, isEquipped: false };
      }
      if (it.id === item.id) {
        return { ...it, isEquipped: nextEquipped };
      }
      return it;
    });

    setItems(updatedItems);

    if (inspectedItem && inspectedItem.id === item.id) {
      setInspectedItem({ ...inspectedItem, isEquipped: nextEquipped });
    }
  };

  const handleUnequipItem = (item: InventoryItem) => {
    const updatedItems = items.map(it => {
      if (it.id === item.id) {
        return { ...it, isEquipped: false };
      }
      return it;
    });
    setItems(updatedItems);

    if (inspectedItem && inspectedItem.id === item.id) {
      setInspectedItem({ ...inspectedItem, isEquipped: false });
    }
  };

  // Lock / Unlock Toggle
  const handleToggleLock = (item: InventoryItem) => {
    const nextLocked = !item.isLocked;
    const updatedItems = items.map(it => {
      if (it.id === item.id) {
        return {
          ...it,
          isLocked: nextLocked,
          isEquipped: nextLocked ? false : it.isEquipped,
        };
      }
      return it;
    });
    setItems(updatedItems);

    if (inspectedItem && inspectedItem.id === item.id) {
      setInspectedItem({
        ...inspectedItem,
        isLocked: nextLocked,
        isEquipped: nextLocked ? false : inspectedItem.isEquipped,
      });
    }
  };

  const handleDeleteItem = (itemId: string) => {
    setItems(items.filter(it => it.id !== itemId));
    if (inspectedItem && inspectedItem.id === itemId) {
      setInspectedItem(null);
    }
  };

  const handleAddItem = (newItem: InventoryItem) => {
    setItems([newItem, ...items]);
  };

  // XP & Level Progression System
  const grantExperience = (attr: 'STR' | 'INT' | 'WIS' | 'CHA', xpGain: number) => {
    setProfile(prev => {
      const currentAttr = prev.attributes[attr];
      const newAttrXp = currentAttr.xp + xpGain;
      const newAttrLevel = Math.floor(newAttrXp / 1000) + 1;

      const newCurrentXp = prev.currentXp + xpGain;
      let newLevel = prev.level;
      let newXpToNext = prev.xpToNextLevel;

      if (newCurrentXp >= prev.xpToNextLevel) {
        newLevel += 1;
        newXpToNext = Math.round(newXpToNext * 1.35);
        sfx.playRunicHarmonic();
      }

      return {
        ...prev,
        level: newLevel,
        currentXp: newCurrentXp,
        xpToNextLevel: newXpToNext,
        attributes: {
          ...prev.attributes,
          [attr]: {
            ...currentAttr,
            xp: newAttrXp,
            level: newAttrLevel,
          },
        },
      };
    });
  };

  // Update specific day's records
  const handleUpdateDayRecord = (
    updated: DayRecord,
    xpGained?: { attr: 'STR' | 'INT' | 'WIS' | 'CHA'; xp: number }
  ) => {
    setDayRecords(prev => ({
      ...prev,
      [updated.date]: updated,
    }));

    if (xpGained) {
      grantExperience(xpGained.attr, xpGained.xp);
    }
  };

  const handleAddHabit = (newHabit: CustomHabit) => {
    setHabits([...habits, newHabit]);
  };

  const handleDeleteHabit = (habitId: string) => {
    setHabits(habits.filter(h => h.id !== habitId));
  };

  const handleUnlockSkill = (skillId: string) => {
    setSkills(prev =>
      prev.map(skill => {
        if (skill.id === skillId) {
          return { ...skill, unlocked: true, progressPercent: 100 };
        }
        return skill;
      })
    );
    grantExperience('INT', 150);
  };

  // Export / Import
  const handleExport = () => {
    const dataStr = exportSaveFile();
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `vessel-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const success = importSaveFile(content);
        if (success) {
          setItems(loadItems());
          setProfile(loadProfile());
          setSkills(loadSkills());
          setHabits(loadHabits());
          setDayRecords(loadDayRecords());
          sfx.playRunicHarmonic();
          alert('Vessel state successfully restored.');
        } else {
          alert('Failed to parse Vessel backup file.');
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0c0d10] text-[#e5e7eb]">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".json"
        className="hidden"
      />

      {/* Main Header */}
      <Header
        profile={profile}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentEncumbrance={currentEncumbrance}
        totalGoldValue={totalGoldValue}
        isMuted={isMuted}
        setIsMuted={setIsMuted}
        onExport={handleExport}
        onImport={handleImportClick}
      />

      {/* Main View Area (Fluid Full Width) */}
      <main className="flex-1 w-full max-w-[1720px] mx-auto px-6 lg:px-8 py-8">
        {activeTab === 'inventory' && (
          <div>
            <PaperdollView
              equippedItems={equippedItems}
              onInspectItem={setInspectedItem}
              onUnequipItem={handleUnequipItem}
            />

            <InventoryGrid
              items={items}
              onInspectItem={setInspectedItem}
              onToggleEquip={handleToggleEquip}
              onOpenAddItem={() => setIsAddItemOpen(true)}
            />
          </div>
        )}

        {activeTab === 'codex' && (
          <CharacterCodex
            profile={profile}
            skills={skills}
            onUnlockSkill={handleUnlockSkill}
          />
        )}

        {activeTab === 'rituals' && (
          <DailyRituals
            dayRecords={dayRecords}
            habits={habits}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            onUpdateDayRecord={handleUpdateDayRecord}
            onAddHabit={handleAddHabit}
            onDeleteHabit={handleDeleteHabit}
          />
        )}
      </main>

      {/* Modals */}
      <ItemInspectModal
        item={inspectedItem}
        onClose={() => setInspectedItem(null)}
        onToggleEquip={handleToggleEquip}
        onToggleLock={handleToggleLock}
        onDeleteItem={handleDeleteItem}
      />

      <AddItemModal
        isOpen={isAddItemOpen}
        onClose={() => setIsAddItemOpen(false)}
        onAddItem={handleAddItem}
      />

      {/* Footer */}
      <footer className="border-t border-[#1f2229] py-6 text-center text-xs text-neutral-500">
        <p>Vessel — Sovereign Life Inventory & Habit Ledger</p>
      </footer>
    </div>
  );
};

export default App;
