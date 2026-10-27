import React, { useState, useEffect, useRef } from 'react';
import type { InventoryItem, CharacterProfile, SkillNode, DailyLog } from './types';
import { loadItems, saveItems, loadProfile, saveProfile, loadSkills, saveSkills, loadDailyLog, saveDailyLog, exportSaveFile, importSaveFile } from './utils/storage';
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
  const [dailyLog, setDailyLog] = useState<DailyLog>(() => loadDailyLog());

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
    saveDailyLog(dailyLog);
  }, [dailyLog]);

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
      // If equipping, unequip any existing item in that same slot
      if (nextEquipped && item.equipSlot && it.equipSlot === item.equipSlot && it.id !== item.id) {
        return { ...it, isEquipped: false };
      }
      if (it.id === item.id) {
        return { ...it, isEquipped: nextEquipped };
      }
      return it;
    });

    setItems(updatedItems);

    // Update inspected item if open
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

  // Lock / Unlock Toggle (Wishlist <-> Possession)
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

  const handleUpdateDailyLog = (
    updated: DailyLog,
    xpGained?: { attr: 'STR' | 'INT' | 'WIS' | 'CHA'; xp: number }
  ) => {
    setDailyLog(updated);
    if (xpGained) {
      grantExperience(xpGained.attr, xpGained.xp);
    }
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

  // Export / Import JSON save file
  const handleExport = () => {
    const dataStr = exportSaveFile();
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `vessel-character-save-${new Date().toISOString().split('T')[0]}.json`;
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
          setDailyLog(loadDailyLog());
          sfx.playRunicHarmonic();
          alert('Vessel state successfully restored from backup.');
        } else {
          alert('Failed to parse Vessel backup file. Check JSON structure.');
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#08090B] text-[#D6CFBE]">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".json"
        className="hidden"
      />

      {/* Main RPG Header */}
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

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {activeTab === 'inventory' && (
          <>
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
          </>
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
            dailyLog={dailyLog}
            onUpdateDailyLog={handleUpdateDailyLog}
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
      <footer className="border-t border-[#1C1F28] py-4 text-center text-xs font-mono text-[#635D52]">
        <p>VESSEL // REALITY STATUS & INVENTORY PROTOCOL // OFFLINE LOCAL-FIRST LEDGER</p>
      </footer>
    </div>
  );
};

export default App;
