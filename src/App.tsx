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
  Quest,
  QuestEvidence,
  EvidenceType,
  BodyMeasurement,
  CharacterAppearance,
  PaletteColor,
  PersonalityEntry,
  CharacterTrait,
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
  loadQuests, saveQuests,
  loadQuestEvidence, saveQuestEvidence,
  loadBodyMeasurements, saveBodyMeasurements,
  loadAppearance, saveAppearance,
  loadColorPalette, saveColorPalette,
  loadPersonality, savePersonality,
  loadTraits, saveTraits,
  exportSaveFile, importSaveFile
} from './utils/storage';
import { deriveTotalXp, getOverallLevelProgress, getQuestXp } from './data/xpConfig';
import { getTodayLocalDateStr, shiftDate } from './utils/date';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { PaperdollView } from './components/PaperdollView';
import { InventoryGrid } from './components/InventoryGrid';
import { ItemInspectModal } from './components/ItemInspectModal';
import { AddItemModal } from './components/AddItemModal';
import { CharacterCodex } from './components/CharacterCodex';
import { DailyRituals } from './components/DailyRituals';
import { QuestsView } from './components/QuestsView';
import { sfx } from './utils/audio';
import { Sparkles, Check } from 'lucide-react';

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
  const [quests, setQuests] = useState<Quest[]>(() => loadQuests());
  const [questEvidence, setQuestEvidence] = useState<QuestEvidence[]>(() => loadQuestEvidence());

  // Stat Sheet states
  const [measurements, setMeasurements] = useState<BodyMeasurement[]>(() => loadBodyMeasurements());
  const [appearance, setAppearance] = useState<CharacterAppearance>(() => loadAppearance());
  const [palette, setPalette] = useState<PaletteColor[]>(() => loadColorPalette());
  const [personality, setPersonality] = useState<PersonalityEntry[]>(() => loadPersonality());
  const [traits, setTraits] = useState<CharacterTrait[]>(() => loadTraits());

  // App-wide Privacy Mode
  const [privacyMode, setPrivacyMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('vessel_privacy_mode') === 'true';
    } catch {
      return false;
    }
  });

  const handleTogglePrivacyMode = () => {
    setPrivacyMode((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('vessel_privacy_mode', String(next));
      } catch {}
      return next;
    });
  };

  const [selectedDate, setSelectedDate] = useState<string>(() => getTodayLocalDateStr());

  const [activeTab, setActiveTab] = useState<'inventory' | 'rituals' | 'quests' | 'codex'>('inventory');
  const [inspectedItem, setInspectedItem] = useState<InventoryItem | null>(null);
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [isAddQuestOpen, setIsAddQuestOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [wishlistPromptItem, setWishlistPromptItem] = useState<InventoryItem | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Close modals on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setInspectedItem(null);
        setIsAddItemOpen(false);
        setIsAddQuestOpen(false);
        setWishlistPromptItem(null);
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
    saveQuests(quests);
    saveQuestEvidence(questEvidence);
    saveBodyMeasurements(measurements);
    saveAppearance(appearance);
    saveColorPalette(palette);
    savePersonality(personality);
    saveTraits(traits);
  }, [items, profile, skills, habits, dayRecords, wearEvents, savedLoadouts, xpEvents, settings, quests, questEvidence, measurements, appearance, palette, personality, traits]);

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

  // Open Quests Count for badge
  const openQuestsCount = quests.filter(q => !q.deletedAt && q.status !== 'done').length;

  // Wear counts index
  const wearCounts: Record<string, number> = {};
  wearEvents.forEach(ev => {
    wearCounts[ev.itemId] = (wearCounts[ev.itemId] || 0) + 1;
  });

  // Record an append-only XP event
  const handleRecordXpEvent = (event: Omit<XpEvent, 'id'>) => {
    const newEvent: XpEvent = {
      id: `xp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      ...event,
    };
    setXpEvents(prev => [...prev, newEvent]);
  };

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

  // Quest Management
  const handleAddQuest = (newQuestData: Omit<Quest, 'id' | 'createdAt'>) => {
    const newQuest: Quest = {
      ...newQuestData,
      id: `quest-${Date.now()}`,
      createdAt: getTodayLocalDateStr(),
    };
    setQuests(prev => [newQuest, ...prev]);
  };

  const handleUpdateQuest = (updated: Quest) => {
    setQuests(prev => prev.map(q => (q.id === updated.id ? updated : q)));
  };

  const handleDeleteQuest = (questId: string) => {
    setQuests(prev =>
      prev.map(q => (q.id === questId ? { ...q, deletedAt: new Date().toISOString() } : q))
    );
  };

  const handleAddEvidence = (questId: string, type: EvidenceType, content: string) => {
    const newEv: QuestEvidence = {
      id: `ev-${Date.now()}`,
      questId,
      type,
      content,
      addedAt: getTodayLocalDateStr(),
    };
    setQuestEvidence(prev => [newEv, ...prev]);
  };

  const handleDeleteEvidence = (evidenceId: string) => {
    setQuestEvidence(prev => prev.filter(e => e.id !== evidenceId));
    sfx.playClick();
  };

  // Quest Completion with XP Logging and Wishlist Milestone Prompt
  const handleCompleteQuest = (quest: Quest) => {
    const completedDate = getTodayLocalDateStr();
    const updated: Quest = {
      ...quest,
      status: 'done',
      completedAt: completedDate,
    };
    handleUpdateQuest(updated);

    // Write append-only XP event
    const points = getQuestXp(quest.difficulty);
    handleRecordXpEvent({
      action: `Quest Complete: ${quest.title}`,
      pillar: quest.pillar,
      points,
      date: selectedDate,
      refId: `quest-${quest.id}`,
    });

    sfx.playRunicHarmonic();

    // Check if linked to a wishlist item
    if (quest.linkedItemId) {
      const linkedItem = items.find(i => i.id === quest.linkedItemId);
      if (linkedItem && linkedItem.ownershipStatus === 'wishlist') {
        setWishlistPromptItem(linkedItem);
      }
    }
  };

  // Quest Reopen from Done with Negative Append-Only XP Event
  const handleReopenQuest = (quest: Quest) => {
    const updated: Quest = {
      ...quest,
      status: 'todo',
      completedAt: undefined,
    };
    handleUpdateQuest(updated);

    // Reopening reverses XP by writing a negative event, so log stays append-only
    const points = getQuestXp(quest.difficulty);
    handleRecordXpEvent({
      action: `Quest Reopened: ${quest.title}`,
      pillar: quest.pillar,
      points: -points,
      date: selectedDate,
      refId: `quest-${quest.id}-reopened`,
    });

    sfx.playClick();
  };

  // Stat Sheet Handlers
  const handleAddMeasurement = (m: Omit<BodyMeasurement, 'id'>) => {
    const newM: BodyMeasurement = {
      ...m,
      id: `bm-${Date.now()}`,
    };
    setMeasurements(prev => [...prev, newM]);
  };

  const handleDeleteMeasurement = (id: string) => {
    setMeasurements(prev =>
      prev.map(m => (m.id === id ? { ...m, deletedAt: new Date().toISOString() } : m))
    );
  };

  const handleUpdateAppearance = (app: CharacterAppearance) => {
    setAppearance(app);
  };

  const handleAddPaletteColor = (p: Omit<PaletteColor, 'id'>) => {
    const newColor: PaletteColor = {
      ...p,
      id: `pal-${Date.now()}`,
    };
    setPalette(prev => [...prev, newColor]);
  };

  const handleUpdatePaletteColor = (p: PaletteColor) => {
    setPalette(prev => prev.map(c => (c.id === p.id ? p : c)));
  };

  const handleDeletePaletteColor = (id: string) => {
    setPalette(prev =>
      prev.map(c => (c.id === id ? { ...c, deletedAt: new Date().toISOString() } : c))
    );
  };

  const handleAddPersonality = (p: Omit<PersonalityEntry, 'id'>) => {
    const newEntry: PersonalityEntry = {
      ...p,
      id: `pers-${Date.now()}`,
    };
    setPersonality(prev => [newEntry, ...prev]);
  };

  const handleDeletePersonality = (id: string) => {
    setPersonality(prev =>
      prev.map(p => (p.id === id ? { ...p, deletedAt: new Date().toISOString() } : p))
    );
  };

  const handleAddTrait = (t: Omit<CharacterTrait, 'id'>) => {
    const newTrait: CharacterTrait = {
      ...t,
      id: `trait-${Date.now()}`,
    };
    setTraits(prev => [...prev, newTrait]);
  };

  const handleDeleteTrait = (id: string) => {
    setTraits(prev =>
      prev.map(t => (t.id === id ? { ...t, deletedAt: new Date().toISOString() } : t))
    );
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

  const handleArchiveHabit = (habitId: string) => {
    setHabits(habits.map(h => h.id === habitId ? { ...h, isArchived: true, archivedAt: new Date().toISOString() } : h));
  };

  const handleRestoreHabit = (habitId: string) => {
    setHabits(habits.map(h => h.id === habitId ? { ...h, isArchived: false, archivedAt: undefined } : h));
  };

  const handlePermanentDeleteHabit = (habitId: string) => {
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
          setQuests(loadQuests());
          setQuestEvidence(loadQuestEvidence());
          setMeasurements(loadBodyMeasurements());
          setAppearance(loadAppearance());
          setPalette(loadColorPalette());
          setPersonality(loadPersonality());
          setTraits(loadTraits());
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
        openQuestsCount={openQuestsCount}
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
          onOpenAddQuest={() => setIsAddQuestOpen(true)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          items={items}
          habits={habits}
          skills={skills}
          quests={quests}
          onSelectTab={setActiveTab}
          onInspectItem={setInspectedItem}
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
          privacyMode={privacyMode}
          onTogglePrivacyMode={handleTogglePrivacyMode}
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
                  allItems={items}
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
                  palette={palette}
                />
              </div>
            )}

            {activeTab === 'rituals' && (
              <DailyRituals
                dayRecords={dayRecords}
                habits={habits}
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
                onUpdateDayRecord={handleUpdateDayRecord}
                onAddHabit={handleAddHabit}
                onDeleteHabit={handleArchiveHabit}
                onRestoreHabit={handleRestoreHabit}
                onPermanentDeleteHabit={handlePermanentDeleteHabit}
                onRecordXpEvent={handleRecordXpEvent}
                quests={quests}
                onNavigateToQuests={() => setActiveTab('quests')}
                onCompleteQuest={handleCompleteQuest}
              />
            )}

            {activeTab === 'quests' && (
              <QuestsView
                quests={quests}
                evidence={questEvidence}
                items={items}
                onAddQuest={handleAddQuest}
                onUpdateQuest={handleUpdateQuest}
                onDeleteQuest={handleDeleteQuest}
                onAddEvidence={handleAddEvidence}
                onDeleteEvidence={handleDeleteEvidence}
                onCompleteQuest={handleCompleteQuest}
                onReopenQuest={handleReopenQuest}
                isAddModalOpen={isAddQuestOpen}
                onCloseAddModal={() => setIsAddQuestOpen(false)}
              />
            )}

            {activeTab === 'codex' && (
              <CharacterCodex
                profile={profile}
                skills={skills}
                dayRecords={dayRecords}
                xpEvents={xpEvents}
                onUnlockSkill={handleUnlockSkill}
                onUpdateProfile={(updated) => setProfile(prev => ({ ...prev, ...updated }))}
                measurements={measurements}
                appearance={appearance}
                palette={palette}
                personality={personality}
                traits={traits}
                settings={settings}
                privacyMode={privacyMode}
                onAddMeasurement={handleAddMeasurement}
                onDeleteMeasurement={handleDeleteMeasurement}
                onUpdateAppearance={handleUpdateAppearance}
                onAddPaletteColor={handleAddPaletteColor}
                onUpdatePaletteColor={handleUpdatePaletteColor}
                onDeletePaletteColor={handleDeletePaletteColor}
                onAddPersonality={handleAddPersonality}
                onDeletePersonality={handleDeletePersonality}
                onAddTrait={handleAddTrait}
                onDeleteTrait={handleDeleteTrait}
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

      {/* Wishlist Claim Confirmation Modal */}
      {wishlistPromptItem && (
        <div
          onClick={() => setWishlistPromptItem(null)}
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white border border-[#ECECF0] rounded-2xl shadow-xl p-6 cursor-default animate-in fade-in zoom-in-95"
          >
            <div className="flex items-center gap-3 pb-3 border-b border-[#ECECF0]">
              <div className="w-10 h-10 rounded-xl bg-[#E6F7F9] border border-[#BCE7EB] flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 text-[#0891B2]" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-[#111113]">Milestone Quest Completed!</h3>
                <span className="text-xs text-[#0891B2] font-medium">Linked Possession Unlocked</span>
              </div>
            </div>

            <div className="py-4 space-y-2">
              <p className="text-xs text-[#6B6B76] leading-relaxed">
                You successfully achieved the objective linked to your wishlist item <strong className="text-[#111113]">{wishlistPromptItem.name}</strong>.
              </p>
              <div className="p-3 rounded-xl bg-[#F4F4F6] border border-[#ECECF0] flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-[#111113] block">{wishlistPromptItem.name}</span>
                  <span className="text-[11px] text-[#9A9AA5]">{wishlistPromptItem.subCategory}</span>
                </div>
                <span className="text-xs font-semibold text-[#0891B2]">
                  {settings.currencySymbol}{wishlistPromptItem.targetPrice || wishlistPromptItem.goldValue}
                </span>
              </div>
              <p className="text-xs font-medium text-[#111113]">
                Would you like to mark this item as currently owned in your Vault?
              </p>
            </div>

            <div className="pt-3 border-t border-[#ECECF0] flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setWishlistPromptItem(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#6B6B76] hover:bg-[#F4F4F6] transition-colors cursor-pointer"
              >
                Keep on Wishlist
              </button>
              <button
                type="button"
                onClick={() => {
                  handleChangeStatus(wishlistPromptItem, 'owned');
                  setWishlistPromptItem(null);
                  sfx.playRunicHarmonic();
                }}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-[#0891B2] hover:bg-[#0E7490] text-white shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Mark Item as Owned</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
