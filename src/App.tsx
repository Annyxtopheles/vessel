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
import type { NavTab, InventoryTreeNode } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { OverviewView } from './components/OverviewView';
import { InventoryStats } from './components/InventoryStats';
import { InventoryGrid } from './components/InventoryGrid';
import { EmptyPageView } from './components/EmptyPageView';
import { ItemInspectModal } from './components/ItemInspectModal';
import { AddItemModal } from './components/AddItemModal';
import { CharacterCodex } from './components/CharacterCodex';
import { DailyRituals } from './components/DailyRituals';
import { QuestsView } from './components/QuestsView';
import { sfx } from './utils/audio';
import { Sparkles, Check } from 'lucide-react';

const getInitialUrlState = (): { tab: NavTab; filter: InventoryTreeNode } => {
  try {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab') as NavTab | null;
    const tab: NavTab = (tabParam && ['overview', 'inventory', 'routine', 'tasks', 'bucket-list', 'money', 'character'].includes(tabParam))
      ? tabParam
      : 'overview';

    const status = params.get('status');
    const category = params.get('category');
    const location = params.get('location');

    let filter: InventoryTreeNode = { type: 'all' };
    if (status && ['owned', 'wishlist', 'past'].includes(status)) {
      filter = { type: 'status', status: status as 'owned' | 'wishlist' | 'past' };
    } else if (category) {
      filter = { type: 'category', category };
    } else if (location) {
      filter = { type: 'location', location };
    }

    return { tab, filter };
  } catch {
    return { tab: 'overview', filter: { type: 'all' } };
  }
};

export const App: React.FC = () => {
  const [items, setItems] = useState<InventoryItem[]>(() => loadItems());
  const [profile, setProfile] = useState<CharacterProfile>(() => loadProfile());
  const [skills, setSkills] = useState<SkillNode[]>(() => loadSkills());
  const [habits, setHabits] = useState<CustomHabit[]>(() => loadHabits());
  const [dayRecords, setDayRecords] = useState<Record<string, DayRecord>>(() => loadDayRecords());
  const [wearEvents, setWearEvents] = useState<WearEvent[]>(() => loadWearEvents());
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

  // Navigation & Tree Filter State
  const initialNav = useRef(getInitialUrlState()).current;
  const [activeTab, setActiveTab] = useState<NavTab>(initialNav.tab);
  const [inventoryFilter, setInventoryFilter] = useState<InventoryTreeNode>(initialNav.filter);

  const [inspectedItem, setInspectedItem] = useState<InventoryItem | null>(null);
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [wishlistPromptItem, setWishlistPromptItem] = useState<InventoryItem | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Sync state changes with URL query string
  useEffect(() => {
    try {
      const params = new URLSearchParams();
      params.set('tab', activeTab);
      if (activeTab === 'inventory') {
        if (inventoryFilter.type === 'status') {
          params.set('status', inventoryFilter.status);
        } else if (inventoryFilter.type === 'category') {
          params.set('category', inventoryFilter.category);
        } else if (inventoryFilter.type === 'location') {
          params.set('location', inventoryFilter.location);
        } else {
          params.set('filter', 'all');
        }
      }
      const newUrl = `${window.location.pathname}?${params.toString()}`;
      window.history.replaceState(null, '', newUrl);
    } catch {}
  }, [activeTab, inventoryFilter]);

  // Support browser back/forward
  useEffect(() => {
    const handlePopState = () => {
      const { tab, filter } = getInitialUrlState();
      setActiveTab(tab);
      setInventoryFilter(filter);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Close modals on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setInspectedItem(null);
        setIsAddItemOpen(false);
        setIsAddTaskOpen(false);
        setWishlistPromptItem(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Save state to localStorage instantly
  useEffect(() => {
    saveItems(items);
    saveProfile(profile);
    saveSkills(skills);
    saveHabits(habits);
    saveDayRecords(dayRecords);
    saveWearEvents(wearEvents);
    saveXpEvents(xpEvents);
    saveSettings(settings);
    saveQuests(quests);
    saveQuestEvidence(questEvidence);
    saveBodyMeasurements(measurements);
    saveAppearance(appearance);
    saveColorPalette(palette);
    savePersonality(personality);
    saveTraits(traits);
  }, [items, profile, skills, habits, dayRecords, wearEvents, xpEvents, settings, quests, questEvidence, measurements, appearance, palette, personality, traits]);

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

  // Derived state: possessions and valuations
  const ownedItems = items.filter(
    it => (it.ownershipStatus || (it.isLocked ? 'wishlist' : 'owned')) === 'owned'
  );
  const wishlistItems = items.filter(
    it => (it.ownershipStatus || (it.isLocked ? 'wishlist' : 'owned')) === 'wishlist'
  );
  const pastItems = items.filter(
    it => (it.ownershipStatus || (it.isLocked ? 'wishlist' : 'owned')) === 'past'
  );

  // Vault Valuation = sum of goldValue of OWNED items only
  const vaultValuation = ownedItems.reduce((acc, it) => acc + (it.goldValue || 0), 0);

  // Wishlist Cost = sum of targetPrice or goldValue of WANTED items
  const wishlistCost = wishlistItems.reduce(
    (acc, it) => acc + (it.targetPrice || it.goldValue || 0),
    0
  );

  const ownedCount = ownedItems.length;
  const wishlistCount = wishlistItems.length;
  const pastCount = pastItems.length;

  // Open Tasks Count for badge
  const openTasksCount = quests.filter(q => !q.deletedAt && q.status !== 'done').length;

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

  // Tasks (Quests) Management
  const handleAddTask = (newTaskData: Omit<Quest, 'id' | 'createdAt'>) => {
    const newTask: Quest = {
      ...newTaskData,
      id: `task-${Date.now()}`,
      createdAt: getTodayLocalDateStr(),
    };
    setQuests(prev => [newTask, ...prev]);
  };

  const handleUpdateTask = (updated: Quest) => {
    setQuests(prev => prev.map(q => (q.id === updated.id ? updated : q)));
  };

  const handleDeleteTask = (taskId: string) => {
    setQuests(prev =>
      prev.map(q => (q.id === taskId ? { ...q, deletedAt: new Date().toISOString() } : q))
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

  // Task Completion with XP Logging and Wishlist Milestone Prompt
  const handleCompleteTask = (task: Quest) => {
    const completedDate = getTodayLocalDateStr();
    const updated: Quest = {
      ...task,
      status: 'done',
      completedAt: completedDate,
    };
    handleUpdateTask(updated);

    // Write append-only XP event
    const points = getQuestXp(task.difficulty);
    handleRecordXpEvent({
      action: `Task Complete: ${task.title}`,
      pillar: task.pillar,
      points,
      date: selectedDate,
      refId: `task-${task.id}`,
    });

    sfx.playRunicHarmonic();

    // Check if linked to a wishlist item
    if (task.linkedItemId) {
      const linkedItem = items.find(i => i.id === task.linkedItemId);
      if (linkedItem && linkedItem.ownershipStatus === 'wishlist') {
        setWishlistPromptItem(linkedItem);
      }
    }
  };

  // Task Reopen from Done with Negative Append-Only XP Event
  const handleReopenTask = (task: Quest) => {
    const updated: Quest = {
      ...task,
      status: 'todo',
      completedAt: undefined,
    };
    handleUpdateTask(updated);

    // Reopening reverses XP by writing a negative event, so log stays append-only
    const points = getQuestXp(task.difficulty);
    handleRecordXpEvent({
      action: `Task Reopened: ${task.title}`,
      pillar: task.pillar,
      points: -points,
      date: selectedDate,
      refId: `task-${task.id}-reopened`,
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

  // Unlock Milestone
  const handleUnlockSkill = (skillId: string, evidence?: { note: string; url?: string }) => {
    let skillTitle = 'Milestone';
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
      action: `Milestone Achieved: ${skillTitle}`,
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
        inventoryFilter={inventoryFilter}
        onSelectInventoryNode={setInventoryFilter}
        items={items}
        habits={habits}
        dayRecords={dayRecords}
        xpEvents={xpEvents}
        openTasksCount={openTasksCount}
        isMuted={isMuted}
        setIsMuted={setIsMuted}
        onExport={handleExport}
        onImport={handleImportClick}
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
          onOpenAddTask={() => setIsAddTaskOpen(true)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          items={items}
          habits={habits}
          skills={skills}
          quests={quests}
          onSelectTab={setActiveTab}
          onInspectItem={setInspectedItem}
          onSelectTask={() => setActiveTab('tasks')}
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
          privacyMode={privacyMode}
          onTogglePrivacyMode={handleTogglePrivacyMode}
        />

        {/* Scrollable View Content */}
        <div className="flex-1 overflow-y-auto px-8 py-8">
          <div className="max-w-[1520px] mx-auto space-y-6">
            
            {/* Overview View */}
            {activeTab === 'overview' && (
              <OverviewView
                items={items}
                habits={habits}
                dayRecords={dayRecords}
                quests={quests}
                xpEvents={xpEvents}
                currencySymbol={settings.currencySymbol || '$'}
                onNavigate={setActiveTab}
              />
            )}

            {/* Inventory View */}
            {activeTab === 'inventory' && (
              <div className="space-y-6">
                <InventoryStats
                  ownedCount={ownedCount}
                  wishlistCount={wishlistCount}
                  pastCount={pastCount}
                  vaultValuation={vaultValuation}
                  wishlistCost={wishlistCost}
                  currencySymbol={settings.currencySymbol || '$'}
                  items={items}
                />

                <InventoryGrid
                  items={items}
                  onInspectItem={setInspectedItem}
                  onOpenAddItem={() => setIsAddItemOpen(true)}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  currencySymbol={settings.currencySymbol || '$'}
                  wearCounts={wearCounts}
                  palette={palette}
                  filterNode={inventoryFilter}
                />
              </div>
            )}

            {/* Routine (formerly Daily Cadence) */}
            {activeTab === 'routine' && (
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
                onNavigateToQuests={() => setActiveTab('tasks')}
                onCompleteQuest={handleCompleteTask}
              />
            )}

            {/* Tasks (formerly Quests) */}
            {activeTab === 'tasks' && (
              <QuestsView
                quests={quests}
                evidence={questEvidence}
                items={items}
                onAddQuest={handleAddTask}
                onUpdateQuest={handleUpdateTask}
                onDeleteQuest={handleDeleteTask}
                onAddEvidence={handleAddEvidence}
                onDeleteEvidence={handleDeleteEvidence}
                onCompleteQuest={handleCompleteTask}
                onReopenQuest={handleReopenTask}
                isAddModalOpen={isAddTaskOpen}
                onCloseAddModal={() => setIsAddTaskOpen(false)}
              />
            )}

            {/* Bucket List (New empty page) */}
            {activeTab === 'bucket-list' && (
              <EmptyPageView title="Bucket List" type="bucket-list" />
            )}

            {/* Money (New empty page) */}
            {activeTab === 'money' && (
              <EmptyPageView title="Money" type="money" />
            )}

            {/* Character (formerly Character Codex) */}
            {activeTab === 'character' && (
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
                <h3 className="text-base font-semibold text-[#111113]">Milestone Completed!</h3>
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
