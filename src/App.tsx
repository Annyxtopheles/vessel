import React, { useState, useEffect, useRef } from 'react';
import type {
  InventoryItem,
  CharacterProfile,
  SkillNode,
  DayRecord,
  CustomHabit,
  OwnershipStatus,
  PastReason,
  WearEvent,
  SavedLoadout,
  XpEvent,
  AppSettings,
  AttributeType,
} from './types';
import { 
  loadItems, saveItems, 
  loadProfile, saveProfile, 
  loadSkills, saveSkills, 
  loadDayRecords, saveDayRecords, 
  loadHabits, saveHabits,
  loadWearEvents, saveWearEvents,
  loadSavedLoadouts, saveSavedLoadouts,
  loadXpEvents, saveXpEvents,
  loadSettings, saveSettings,
  exportSaveFile, importSaveFile
} from './utils/storage';
import { deriveTotalXp, getOverallLevelProgress } from './data/xpConfig';
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
  const [wearEvents, setWearEvents] = useState<WearEvent[]>(() => loadWearEvents());
  const [savedLoadouts, setSavedLoadouts] = useState<SavedLoadout[]>(() => loadSavedLoadouts());
  const [xpEvents, setXpEvents] = useState<XpEvent[]>(() => loadXpEvents());
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());
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
    saveWearEvents(wearEvents);
    saveSavedLoadouts(savedLoadouts);
    saveXpEvents(xpEvents);
    saveSettings(settings);
  }, [items, profile, skills, habits, dayRecords, wearEvents, savedLoadouts, xpEvents, settings]);

  // Audio mute state
  useEffect(() => {
    sfx.setMuted(isMuted);
  }, [isMuted]);

  // Synchronize overall level with append-only XP events
  useEffect(() => {
    const totalXp = deriveTotalXp(xpEvents);
    const overall = getOverallLevelProgress(totalXp);
    if (profile.level !== overall.level || profile.currentXp !== overall.currentXp) {
      setProfile(prev => ({
        ...prev,
        level: overall.level,
        currentXp: overall.currentXp,
        xpToNextLevel: overall.xpNeededForNext,
      }));
    }
  }, [xpEvents]);

  // Derived state: possessions, carried load, valuations
  const ownedItems = items.filter(
    it => (it.ownershipStatus || (it.isLocked ? 'wishlist' : 'owned')) === 'owned'
  );
  const wishlistItems = items.filter(
    it => (it.ownershipStatus || (it.isLocked ? 'wishlist' : 'owned')) === 'wishlist'
  );
  const pastItems = items.filter(
    it => (it.ownershipStatus || (it.isLocked ? 'wishlist' : 'owned')) === 'past'
  );

  const equippedItems = items.filter(
    it => it.isEquipped && (it.ownershipStatus || (it.isLocked ? 'wishlist' : 'owned')) === 'owned'
  );

  // 1. Vault Valuation = sum of goldValue of OWNED items only
  const vaultValuation = ownedItems.reduce((acc, it) => acc + (it.goldValue || 0), 0);

  // Wishlist Cost = sum of targetPrice or goldValue of WANTED items
  const wishlistCost = wishlistItems.reduce(
    (acc, it) => acc + (it.targetPrice || it.goldValue || 0),
    0
  );

  // 2. Carry Load = sum of weight of items where carried === true against capacity
  const carriedWeight = ownedItems
    .filter(it => it.carried)
    .reduce((acc, it) => acc + (it.weightKg || 0), 0);

  // Total possessions weight = all owned items with no cap
  const totalPossessionsWeight = ownedItems.reduce((acc, it) => acc + (it.weightKg || 0), 0);

  const ownedCount = ownedItems.length;
  const wishlistCount = wishlistItems.length;
  const pastCount = pastItems.length;

  // Wear counts index
  const wearCounts: Record<string, number> = {};
  wearEvents.forEach(ev => {
    wearCounts[ev.itemId] = (wearCounts[ev.itemId] || 0) + 1;
  });

  // Equip / Unequip Toggle with Wear Event Logging
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

    // Write wear event { item_id, type: "worn", date } when equipped
    if (nextEquipped) {
      const wearEv: WearEvent = {
        id: `wear-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        itemId: item.id,
        type: 'worn',
        date: selectedDate,
      };
      setWearEvents(prev => [...prev, wearEv]);
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

  // Saved Loadout Handlers
  const handleSaveLoadout = (name: string) => {
    const newPreset: SavedLoadout = {
      id: `loadout-${Date.now()}`,
      name: name.trim(),
      equippedItemIds: equippedItems.map(i => i.id),
      createdAt: selectedDate,
    };
    setSavedLoadouts(prev => [newPreset, ...prev]);
    sfx.playClick();
  };

  const handleApplyLoadout = (loadoutId: string) => {
    const preset = savedLoadouts.find(l => l.id === loadoutId);
    if (!preset) return;

    const targetIds = new Set(preset.equippedItemIds);
    const newWearEvents: WearEvent[] = [];

    const updatedItems = items.map(it => {
      const isTarget = targetIds.has(it.id) && (it.ownershipStatus || 'owned') === 'owned';
      if (isTarget && !it.isEquipped) {
        newWearEvents.push({
          id: `wear-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          itemId: it.id,
          type: 'worn',
          date: selectedDate,
        });
      }
      return {
        ...it,
        isEquipped: isTarget,
      };
    });

    setItems(updatedItems);
    if (newWearEvents.length > 0) {
      setWearEvents(prev => [...prev, ...newWearEvents]);
    }
    sfx.playEquip();
  };

  const handleDeleteLoadout = (loadoutId: string) => {
    setSavedLoadouts(prev => prev.filter(l => l.id !== loadoutId));
    sfx.playClick();
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
          carried: newStatus === 'owned' ? (it.carried ?? true) : false,
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
        carried: newStatus === 'owned' ? (inspectedItem.carried ?? true) : false,
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
    setItems(prev => prev.map(it => (it.id === updated.id ? updated : it)));
    setInspectedItem(updated);
  };

  // Record an append-only XP event
  const handleRecordXpEvent = (event: Omit<XpEvent, 'id'>) => {
    const newEvent: XpEvent = {
      id: `xp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      ...event,
    };
    setXpEvents(prev => [...prev, newEvent]);
  };

  // Update specific day's records
  const handleUpdateDayRecord = (
    updated: DayRecord,
    _xpGained?: { attr: 'STR' | 'INT' | 'WIS' | 'CHA'; xp: number }
  ) => {
    setDayRecords(prev => ({
      ...prev,
      [updated.date]: updated,
    }));
  };

  const handleAddHabit = (newHabit: CustomHabit) => {
    setHabits([...habits, newHabit]);
  };

  const handleDeleteHabit = (habitId: string) => {
    setHabits(habits.filter(h => h.id !== habitId));
  };

  // Unlock Codex Skill
  const handleUnlockSkill = (skillId: string, evidence?: { note: string; url?: string }) => {
    let skillTitle = 'Perk';
    let skillAttr: AttributeType = 'INT';

    setSkills(prev =>
      prev.map(skill => {
        if (skill.id === skillId) {
          skillTitle = skill.title;
          skillAttr = skill.attribute;
          return {
            ...skill,
            unlocked: true,
            progressPercent: 100,
            evidenceNote: evidence?.note || skill.evidenceNote,
            evidenceUrl: evidence?.url || skill.evidenceUrl,
          };
        }
        return skill;
      })
    );

    handleRecordXpEvent({
      action: `Perk Attuned: ${skillTitle}`,
      pillar: skillAttr,
      points: 150,
      date: selectedDate,
      refId: `skill-${skillId}`,
    });
  };

  const handleShiftDate = (delta: number) => {
    setSelectedDate(prev => shiftDate(prev, delta));
  };

  const handleResetToday = () => {
    setSelectedDate(getTodayLocalDateStr());
  };

  const handleUpdateSettings = (updated: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...updated }));
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
          setWearEvents(loadWearEvents());
          setSavedLoadouts(loadSavedLoadouts());
          setXpEvents(loadXpEvents());
          setSettings(loadSettings());
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
        ownedCount={ownedCount}
        equippedCount={equippedItems.length}
        currentEncumbrance={carriedWeight}
        totalGoldValue={vaultValuation}
        isMuted={isMuted}
        setIsMuted={setIsMuted}
        onExport={handleExport}
        onImport={handleImportClick}
        onUpdateProfile={(updated) => setProfile(prev => ({ ...prev, ...updated }))}
      />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden bg-[#F4F4F6]">
        {/* Consistent Unified TopBar with Global Search and Settings */}
        <TopBar
          activeTab={activeTab}
          selectedDate={selectedDate}
          onShiftDate={handleShiftDate}
          onResetToday={handleResetToday}
          onOpenAddItem={() => setIsAddItemOpen(true)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          items={items}
          habits={habits}
          skills={skills}
          onSelectTab={setActiveTab}
          onInspectItem={setInspectedItem}
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
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
                  carriedWeight={carriedWeight}
                  maxEncumbranceKg={settings.maxEncumbranceKg || 12.0}
                  totalPossessionsWeight={totalPossessionsWeight}
                  vaultValuation={vaultValuation}
                  wishlistCost={wishlistCost}
                  ownedCount={ownedCount}
                  wishlistCount={wishlistCount}
                  pastCount={pastCount}
                  currencySymbol={settings.currencySymbol || '$'}
                  savedLoadouts={savedLoadouts}
                  onSaveCurrentLoadout={handleSaveLoadout}
                  onLoadPreset={(preset) => handleApplyLoadout(preset.id)}
                  onDeletePreset={handleDeleteLoadout}
                />

                <InventoryGrid
                  items={items}
                  onInspectItem={setInspectedItem}
                  onToggleEquip={handleToggleEquip}
                  onOpenAddItem={() => setIsAddItemOpen(true)}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  currencySymbol={settings.currencySymbol || '$'}
                  wearCounts={wearCounts}
                />
              </div>
            )}

            {activeTab === 'codex' && (
              <CharacterCodex
                profile={profile}
                skills={skills}
                dayRecords={dayRecords}
                xpEvents={xpEvents}
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
                onRecordXpEvent={handleRecordXpEvent}
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
        wearCount={inspectedItem ? (wearCounts[inspectedItem.id] || 0) : 0}
        currencySymbol={settings.currencySymbol || '$'}
      />

      <AddItemModal
        isOpen={isAddItemOpen}
        onClose={() => setIsAddItemOpen(false)}
        onAddItem={handleAddItem}
        currencySymbol={settings.currencySymbol || '$'}
      />
    </div>
  );
};

export default App;
