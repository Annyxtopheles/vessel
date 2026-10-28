import React, { useState, useEffect, useRef } from 'react';
import type { InventoryItem, CharacterProfile, SkillNode, DayRecord, CustomHabit, OwnershipStatus, PastReason } from './types';
import { 
  loadItems, saveItems, 
  loadProfile, saveProfile, 
  loadSkills, saveSkills, 
  loadDayRecords, saveDayRecords, 
  loadHabits, saveHabits, 
  exportSaveFile, importSaveFile
} from './utils/storage';
import { getTodayLocalDateStr, shiftDate } from './utils/date';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
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
  const [selectedDate, setSelectedDate] = useState<string>(() => getTodayLocalDateStr());

  const [activeTab, setActiveTab] = useState<'inventory' | 'codex' | 'rituals'>('inventory');
  const [inspectedItem, setInspectedItem] = useState<InventoryItem | null>(null);
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Close modals on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setInspectedItem(null);
        setIsAddItemOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Save state to localStorage instantly (zero latency, zero reload)
  useEffect(() => {
    saveItems(items);
    saveProfile(profile);
    saveSkills(skills);
    saveHabits(habits);
    saveDayRecords(dayRecords);
  }, [items, profile, skills, habits, dayRecords]);

  // Audio mute state
  useEffect(() => {
    sfx.setMuted(isMuted);
  }, [isMuted]);

  // Derived state: equipped items (only currently owned possessions)
  const equippedItems = items.filter(
    it => it.isEquipped && (it.ownershipStatus || (it.isLocked ? 'wishlist' : 'owned')) === 'owned'
  );
  const currentEncumbrance = items
    .filter(it => (it.ownershipStatus || (it.isLocked ? 'wishlist' : 'owned')) === 'owned')
    .reduce((acc, it) => acc + it.weightKg, 0);
  const totalGoldValue = items
    .filter(it => (it.ownershipStatus || (it.isLocked ? 'wishlist' : 'owned')) === 'owned')
    .reduce((acc, it) => acc + it.goldValue, 0);

  // Equip / Unequip Toggle
  const handleToggleEquip = (item: InventoryItem) => {
    const status = item.ownershipStatus || (item.isLocked ? 'wishlist' : 'owned');
    if (status !== 'owned') return;

    const nextEquipped = !item.isEquipped;
    const updatedItems = items.map(it => {
      if (it.id === item.id) {
        return { ...it, isEquipped: nextEquipped };
      }
      if (nextEquipped && it.equipSlot && it.equipSlot === item.equipSlot && it.id !== item.id) {
        return { ...it, isEquipped: false };
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

  // Possession Lifecycle: Change Ownership Status (owned <-> wishlist <-> past)
  const handleChangeStatus = (
    item: InventoryItem,
    newStatus: OwnershipStatus,
    pastReason?: PastReason,
    pastDate?: string
  ) => {
    const isNowLocked = newStatus === 'wishlist';
    const updatedItems = items.map(it => {
      if (it.id === item.id) {
        return {
          ...it,
          ownershipStatus: newStatus,
          isLocked: isNowLocked,
          isEquipped: newStatus === 'owned' ? it.isEquipped : false,
          pastReason: newStatus === 'past' ? pastReason : undefined,
          pastDate: newStatus === 'past' ? pastDate : undefined,
        };
      }
      return it;
    });
    setItems(updatedItems);

    if (inspectedItem && inspectedItem.id === item.id) {
      setInspectedItem({
        ...inspectedItem,
        ownershipStatus: newStatus,
        isLocked: isNowLocked,
        isEquipped: newStatus === 'owned' ? inspectedItem.isEquipped : false,
        pastReason: newStatus === 'past' ? pastReason : undefined,
        pastDate: newStatus === 'past' ? pastDate : undefined,
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

  const handleUpdateItem = (updated: InventoryItem) => {
    setItems(prev => prev.map(it => it.id === updated.id ? updated : it));
    setInspectedItem(updated);
  };

  // Grant EXP and handle leveling
  const grantExperience = (attr: 'STR' | 'INT' | 'WIS' | 'CHA', amount: number) => {
    setProfile(prev => {
      const currentAttr = prev.attributes[attr];
      const newAttrXp = currentAttr.xp + amount;
      const newAttrLevel = Math.floor(newAttrXp / 1000) + 1;

      const newCurrentXp = prev.currentXp + amount;
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

  const handleShiftDate = (delta: number) => {
    setSelectedDate(prev => shiftDate(prev, delta));
  };

  const handleResetToday = () => {
    setSelectedDate(getTodayLocalDateStr());
  };

  // Export / Import
  const handleExport = () => {
    const dataStr = exportSaveFile();
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `vessel-data-${getTodayLocalDateStr()}.json`;
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
    <div className="flex h-screen w-full bg-[#F4F4F6] text-[#111113] overflow-hidden">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".json"
        className="hidden"
      />

      {/* Left Sidebar Dashboard Navigation */}
      <Sidebar
        profile={profile}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        totalItemsCount={items.length}
        equippedCount={equippedItems.length}
        currentEncumbrance={currentEncumbrance}
        totalGoldValue={totalGoldValue}
        isMuted={isMuted}
        setIsMuted={setIsMuted}
        onExport={handleExport}
        onImport={handleImportClick}
        onUpdateProfile={(updated) => setProfile(prev => ({ ...prev, ...updated }))}
      />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden bg-[#F4F4F6]">
        
        {/* Consistent Unified TopBar */}
        <TopBar
          activeTab={activeTab}
          selectedDate={selectedDate}
          onShiftDate={handleShiftDate}
          onResetToday={handleResetToday}
          onOpenAddItem={() => setIsAddItemOpen(true)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        {/* Scrollable View Content */}
        <div className="flex-1 overflow-y-auto px-8 py-8">
          <div className="max-w-[1520px] mx-auto space-y-6">
            {activeTab === 'inventory' && (
              <div className="space-y-6">
                <PaperdollView
                  equippedItems={equippedItems}
                  onInspectItem={setInspectedItem}
                  onUnequipItem={handleUnequipItem}
                  currentEncumbrance={currentEncumbrance}
                  maxEncumbranceKg={profile.maxEncumbranceKg}
                  totalGoldValue={totalGoldValue}
                  totalItemsCount={items.length}
                  ownedCount={items.filter(i => (i.ownershipStatus || (i.isLocked ? 'wishlist' : 'owned')) === 'owned').length}
                  wishlistCount={items.filter(i => (i.ownershipStatus || (i.isLocked ? 'wishlist' : 'owned')) === 'wishlist').length}
                  pastCount={items.filter(i => (i.ownershipStatus || (i.isLocked ? 'wishlist' : 'owned')) === 'past').length}
                />

                <InventoryGrid
                  items={items}
                  onInspectItem={setInspectedItem}
                  onToggleEquip={handleToggleEquip}
                  onOpenAddItem={() => setIsAddItemOpen(true)}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                />
              </div>
            )}

            {activeTab === 'codex' && (
              <CharacterCodex
                profile={profile}
                skills={skills}
                onUnlockSkill={handleUnlockSkill}
                onUpdateProfile={(updated) => setProfile(prev => ({ ...prev, ...updated }))}
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
          </div>
        </div>
      </div>

      {/* Modals */}
      <ItemInspectModal
        item={inspectedItem}
        onClose={() => setInspectedItem(null)}
        onToggleEquip={handleToggleEquip}
        onChangeStatus={handleChangeStatus}
        onDeleteItem={handleDeleteItem}
        onUpdateItem={handleUpdateItem}
        onDuplicateItem={handleAddItem}
      />

      <AddItemModal
        isOpen={isAddItemOpen}
        onClose={() => setIsAddItemOpen(false)}
        onAddItem={handleAddItem}
      />
    </div>
  );
};

export default App;
