import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  initDatabase,
  itemRepo,
  questRepo,
  questEvidenceRepo,
  habitRepo,
  dayRecordRepo,
  wearEventRepo,
  xpEventRepo,
  skillRepo,
  measurementRepo,
  appearanceRepo,
  paletteRepo,
  personalityRepo,
  traitRepo,
  settingsRepo,
  profileRepo,
} from './repositories';
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
import { ImportItemsModal } from './components/ImportItemsModal';
import { BackupModal } from './components/BackupModal';
import { CharacterCodex } from './components/CharacterCodex';
import { DailyRituals } from './components/DailyRituals';
import { QuestsView } from './components/QuestsView';
import { sfx } from './utils/audio';
import { formatCurrency } from './utils/numberFormat';

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

const DEFAULT_SETTINGS_FALLBACK: AppSettings = {
  id: 'default_settings',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  deleted_at: null,
  revision: 1,
  currencySymbol: '৳',
  numberGrouping: 'bangladeshi',
  unitSystem: 'metric',
  targetWeightKg: 73.0,
  privacyMode: false,
};

export const App: React.FC = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [profile, setProfile] = useState<CharacterProfile>({
    id: 'default_profile',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null,
    revision: 1,
    name: 'Artificer Wanderer',
    title: 'Architect of Systems',
    level: 1,
    currentXp: 0,
    xpToNextLevel: 500,
    attributes: {
      STR: { level: 1, xp: 0, title: 'Iron Discipline' },
      INT: { level: 1, xp: 0, title: 'Deep Logic' },
      WIS: { level: 1, xp: 0, title: 'Quiet Clarity' },
      CHA: { level: 1, xp: 0, title: 'Resonant Presence' },
    },
    streaks: { salahStreak: 0, workoutStreak: 0, craftStreak: 0 },
  });
  const [skills, setSkills] = useState<SkillNode[]>([]);
  const [habits, setHabits] = useState<CustomHabit[]>([]);
  const [dayRecords, setDayRecords] = useState<Record<string, DayRecord>>({});
  const [wearEvents, setWearEvents] = useState<WearEvent[]>([]);
  const [xpEvents, setXpEvents] = useState<XpEvent[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS_FALLBACK);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [questEvidence, setQuestEvidence] = useState<QuestEvidence[]>([]);

  // Stat Sheet states
  const [measurements, setMeasurements] = useState<BodyMeasurement[]>([]);
  const [appearance, setAppearance] = useState<CharacterAppearance>({
    id: 'default_appearance',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null,
    revision: 1,
    skinToneHex: '#D4AA78',
    skinToneNote: 'Neutral olive',
    hair: 'Dark Charcoal (#2C2C2E)',
    eyeColor: 'Deep Umber Brown',
  });
  const [palette, setPalette] = useState<PaletteColor[]>([]);
  const [personality, setPersonality] = useState<PersonalityEntry[]>([]);
  const [traits, setTraits] = useState<CharacterTrait[]>([]);

  // App-wide Privacy Mode
  const [privacyMode, setPrivacyMode] = useState<boolean>(false);

  const [selectedDate, setSelectedDate] = useState<string>(() => getTodayLocalDateStr());

  // Navigation & Tree Filter State
  const initialNav = useRef(getInitialUrlState()).current;
  const [activeTab, setActiveTab] = useState<NavTab>(initialNav.tab);
  const [inventoryFilter, setInventoryFilter] = useState<InventoryTreeNode>(initialNav.filter);

  const [inspectedItem, setInspectedItem] = useState<InventoryItem | null>(null);
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isImportItemsOpen, setIsImportItemsOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [wishlistPromptItem, setWishlistPromptItem] = useState<InventoryItem | null>(null);

  // Reload all state from repositories
  const reloadFromRepositories = useCallback(async () => {
    try {
      const [
        loadedItems,
        loadedProfile,
        loadedSkills,
        loadedHabits,
        loadedDayRecordsMap,
        loadedWearEvents,
        loadedXpEvents,
        loadedSettings,
        loadedQuests,
        loadedEvidence,
        loadedMeasurements,
        loadedAppearance,
        loadedPalette,
        loadedPersonality,
        loadedTraits,
      ] = await Promise.all([
        itemRepo.list(),
        profileRepo.getProfile(),
        skillRepo.list(),
        habitRepo.list(),
        dayRecordRepo.getAllAsMap(),
        wearEventRepo.list(),
        xpEventRepo.list(),
        settingsRepo.getSettings(),
        questRepo.list(),
        questEvidenceRepo.list(),
        measurementRepo.list(),
        appearanceRepo.getAppearance(),
        paletteRepo.list(),
        personalityRepo.list(),
        traitRepo.list(),
      ]);

      setItems(loadedItems);
      setProfile(loadedProfile);
      setSkills(loadedSkills);
      setHabits(loadedHabits);
      setDayRecords(loadedDayRecordsMap);
      setWearEvents(loadedWearEvents);
      setXpEvents(loadedXpEvents);
      setSettings(loadedSettings);
      setQuests(loadedQuests);
      setQuestEvidence(loadedEvidence);
      setMeasurements(loadedMeasurements);
      setAppearance(loadedAppearance);
      setPalette(loadedPalette);
      setPersonality(loadedPersonality);
      setTraits(loadedTraits);
      if (loadedSettings.privacyMode !== undefined) {
        setPrivacyMode(loadedSettings.privacyMode);
      }
    } catch (err) {
      console.error('[Vessel App] Error loading from repositories:', err);
    }
  }, []);

  // Initialize Dexie and bootstrap data
  useEffect(() => {
    initDatabase().then(() => {
      reloadFromRepositories();
    });
  }, [reloadFromRepositories]);

  const handleTogglePrivacyMode = async () => {
    const next = !privacyMode;
    setPrivacyMode(next);
    try {
      localStorage.setItem('vessel_privacy_mode', String(next));
    } catch {}
    await settingsRepo.saveSettings({ privacyMode: next });
  };

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
        setIsBackupModalOpen(false);
        setIsImportItemsOpen(false);
        setWishlistPromptItem(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Audio mute state
  useEffect(() => {
    sfx.setMuted(isMuted);
  }, [isMuted]);

  // Synchronize overall level with append-only XP events
  useEffect(() => {
    const totalXp = deriveTotalXp(xpEvents);
    const overall = getOverallLevelProgress(totalXp);
    if (profile.level !== overall.level || profile.currentXp !== overall.currentXp) {
      setProfile((prev) => ({
        ...prev,
        level: overall.level,
        currentXp: overall.currentXp,
        xpToNextLevel: overall.xpNeededForNext,
      }));
      profileRepo.saveProfile({
        level: overall.level,
        currentXp: overall.currentXp,
        xpToNextLevel: overall.xpNeededForNext,
      });
    }
  }, [xpEvents, profile.level, profile.currentXp]);

  // Derived state: possessions and valuations
  const ownedItems = items.filter(
    (it) => (it.ownershipStatus || (it.isLocked ? 'wishlist' : 'owned')) === 'owned'
  );
  const wishlistItems = items.filter(
    (it) => (it.ownershipStatus || (it.isLocked ? 'wishlist' : 'owned')) === 'wishlist'
  );
  const pastItems = items.filter(
    (it) => (it.ownershipStatus || (it.isLocked ? 'wishlist' : 'owned')) === 'past'
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
  const openTasksCount = quests.filter((q) => !q.deletedAt && !q.deleted_at && q.status !== 'done').length;

  // Wear counts index
  const wearCounts: Record<string, number> = {};
  wearEvents.forEach((ev) => {
    wearCounts[ev.itemId] = (wearCounts[ev.itemId] || 0) + 1;
  });

  // Record an append-only XP event via Repository
  const handleRecordXpEvent = async (event: Omit<XpEvent, 'id' | 'created_at' | 'updated_at' | 'revision'>) => {
    const saved = await xpEventRepo.create(event);
    setXpEvents((prev) => [...prev, saved]);
  };

  // Possession Lifecycle: Change Ownership Status (owned <-> wishlist <-> past)
  const handleChangeStatus = async (
    item: InventoryItem,
    newStatus: OwnershipStatus,
    pastReason?: PastReason,
    pastDate?: string
  ) => {
    const isNowLocked = newStatus === 'wishlist';
    const patch: Partial<InventoryItem> = {
      ownershipStatus: newStatus,
      isLocked: isNowLocked,
      pastReason: newStatus === 'past' ? pastReason : undefined,
      pastDate: newStatus === 'past' ? pastDate : undefined,
    };

    const updated = await itemRepo.update(item.id, patch);
    setItems((prev) => prev.map((it) => (it.id === item.id ? updated : it)));

    if (inspectedItem && inspectedItem.id === item.id) {
      setInspectedItem(updated);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    await itemRepo.softDelete(itemId);
    setItems((prev) => prev.filter((it) => it.id !== itemId));
    if (inspectedItem && inspectedItem.id === itemId) {
      setInspectedItem(null);
    }
  };

  const handleAddItem = async (newItem: InventoryItem) => {
    const created = await itemRepo.create(newItem);
    setItems((prev) => [created, ...prev]);
  };

  const handleUpdateItem = async (updated: InventoryItem) => {
    const res = await itemRepo.update(updated.id, updated);
    setItems((prev) => prev.map((it) => (it.id === updated.id ? res : it)));
    setInspectedItem(res);
  };

  // Tasks (Quests) Management
  const handleAddTask = async (newTaskData: Omit<Quest, 'id' | 'created_at' | 'updated_at' | 'revision'>) => {
    const created = await questRepo.create({
      ...newTaskData,
      createdAt: getTodayLocalDateStr(),
    });
    setQuests((prev) => [created, ...prev]);
  };

  const handleUpdateTask = async (updated: Quest) => {
    const res = await questRepo.update(updated.id, updated);
    setQuests((prev) => prev.map((q) => (q.id === updated.id ? res : q)));
  };

  const handleDeleteTask = async (taskId: string) => {
    await questRepo.softDelete(taskId);
    setQuests((prev) => prev.filter((q) => q.id !== taskId));
  };

  const handleAddEvidence = async (questId: string, type: EvidenceType, content: string) => {
    const created = await questEvidenceRepo.create({
      questId,
      type,
      content,
      addedAt: getTodayLocalDateStr(),
    });
    setQuestEvidence((prev) => [created, ...prev]);
  };

  const handleDeleteEvidence = async (evidenceId: string) => {
    await questEvidenceRepo.softDelete(evidenceId);
    setQuestEvidence((prev) => prev.filter((e) => e.id !== evidenceId));
    sfx.playClick();
  };

  // Task Completion with XP Logging and Wishlist Milestone Prompt
  const handleCompleteTask = async (task: Quest) => {
    const completedDate = getTodayLocalDateStr();
    const updated: Quest = {
      ...task,
      status: 'done',
      completedAt: completedDate,
    };
    await handleUpdateTask(updated);

    // Write append-only XP event
    const points = getQuestXp(task.difficulty);
    await handleRecordXpEvent({
      action: `Task Complete: ${task.title}`,
      pillar: task.pillar,
      points,
      date: selectedDate,
      refId: `task-${task.id}`,
    });

    sfx.playRunicHarmonic();

    // Check if linked to a wishlist item
    if (task.linkedItemId) {
      const linkedItem = items.find((i) => i.id === task.linkedItemId);
      if (linkedItem && linkedItem.ownershipStatus === 'wishlist') {
        setWishlistPromptItem(linkedItem);
      }
    }
  };

  // Task Reopen from Done with Negative Append-Only XP Event
  const handleReopenTask = async (task: Quest) => {
    const updated: Quest = {
      ...task,
      status: 'todo',
      completedAt: undefined,
    };
    await handleUpdateTask(updated);

    // Reopening reverses XP by writing a negative event, so log stays append-only
    const points = getQuestXp(task.difficulty);
    await handleRecordXpEvent({
      action: `Task Reopened: ${task.title}`,
      pillar: task.pillar,
      points: -points,
      date: selectedDate,
      refId: `task-${task.id}-reopened`,
    });

    sfx.playClick();
  };

  // Stat Sheet Handlers
  const handleAddMeasurement = async (m: Omit<BodyMeasurement, 'id' | 'created_at' | 'updated_at' | 'revision'>) => {
    const created = await measurementRepo.create(m);
    setMeasurements((prev) => [...prev, created]);
  };

  const handleDeleteMeasurement = async (id: string) => {
    await measurementRepo.softDelete(id);
    setMeasurements((prev) => prev.filter((m) => m.id !== id));
  };

  const handleUpdateAppearance = async (app: CharacterAppearance) => {
    const updated = await appearanceRepo.saveAppearance(app);
    setAppearance(updated);
  };

  const handleAddPaletteColor = async (p: Omit<PaletteColor, 'id' | 'created_at' | 'updated_at' | 'revision'>) => {
    const created = await paletteRepo.create(p);
    setPalette((prev) => [...prev, created]);
  };

  const handleUpdatePaletteColor = async (p: PaletteColor) => {
    const updated = await paletteRepo.update(p.id, p);
    setPalette((prev) => prev.map((c) => (c.id === p.id ? updated : c)));
  };

  const handleDeletePaletteColor = async (id: string) => {
    await paletteRepo.softDelete(id);
    setPalette((prev) => prev.filter((c) => c.id !== id));
  };

  const handleAddPersonality = async (p: Omit<PersonalityEntry, 'id' | 'created_at' | 'updated_at' | 'revision'>) => {
    const created = await personalityRepo.create(p);
    setPersonality((prev) => [created, ...prev]);
  };

  const handleDeletePersonality = async (id: string) => {
    await personalityRepo.softDelete(id);
    setPersonality((prev) => prev.filter((p) => p.id !== id));
  };

  const handleAddTrait = async (t: Omit<CharacterTrait, 'id' | 'created_at' | 'updated_at' | 'revision'>) => {
    const created = await traitRepo.create(t);
    setTraits((prev) => [...prev, created]);
  };

  const handleDeleteTrait = async (id: string) => {
    await traitRepo.softDelete(id);
    setTraits((prev) => prev.filter((t) => t.id !== id));
  };

  // Update specific day's records
  const handleUpdateDayRecord = async (
    updated: DayRecord,
    _xpGained?: { attr: 'STR' | 'INT' | 'WIS' | 'CHA'; xp: number }
  ) => {
    const existing = await dayRecordRepo.getByDate(updated.date);
    if (existing && existing.id) {
      await dayRecordRepo.update(existing.id, updated);
    } else {
      await dayRecordRepo.create({ ...updated, id: updated.id || updated.date });
    }
    setDayRecords((prev) => ({
      ...prev,
      [updated.date]: updated,
    }));
  };

  const handleAddHabit = async (newHabit: CustomHabit) => {
    const created = await habitRepo.create(newHabit);
    setHabits((prev) => [...prev, created]);
  };

  const handleArchiveHabit = async (habitId: string) => {
    await habitRepo.softDelete(habitId);
    setHabits((prev) =>
      prev.map((h) => (h.id === habitId ? { ...h, isArchived: true, archivedAt: new Date().toISOString() } : h))
    );
  };

  const handleRestoreHabit = async (habitId: string) => {
    const updated = await habitRepo.update(habitId, {
      isArchived: false,
      archivedAt: undefined,
      deleted_at: null,
      deletedAt: undefined,
    } as any);
    setHabits((prev) => prev.map((h) => (h.id === habitId ? updated : h)));
  };

  const handlePermanentDeleteHabit = async (habitId: string) => {
    await habitRepo.hardDelete(habitId);
    setHabits((prev) => prev.filter((h) => h.id !== habitId));
  };

  // Unlock Milestone
  const handleUnlockSkill = async (skillId: string, evidence?: { note: string; url?: string }) => {
    let skillTitle = 'Milestone';
    let skillAttr: AttributeType = 'INT';

    const existing = skills.find((s) => s.id === skillId);
    if (existing) {
      skillTitle = existing.title;
      skillAttr = existing.attribute;
      const updated = await skillRepo.update(skillId, {
        unlocked: true,
        progressPercent: 100,
        evidenceNote: evidence?.note || existing.evidenceNote,
        evidenceUrl: evidence?.url || existing.evidenceUrl,
      });
      setSkills((prev) => prev.map((s) => (s.id === skillId ? updated : s)));
    }

    await handleRecordXpEvent({
      action: `Milestone Achieved: ${skillTitle}`,
      pillar: skillAttr,
      points: 150,
      date: selectedDate,
      refId: `skill-${skillId}`,
    });
  };

  const handleShiftDate = (delta: number) => {
    setSelectedDate((prev) => shiftDate(prev, delta));
  };

  const handleResetToday = () => {
    setSelectedDate(getTodayLocalDateStr());
  };

  const handleUpdateSettings = async (updated: Partial<AppSettings>) => {
    const saved = await settingsRepo.saveSettings(updated);
    setSettings((prev) => ({ ...prev, ...saved }));
  };

  return (
    <div className="flex h-screen w-full bg-[#F4F4F6] text-[#111113] overflow-hidden">
      {/* Sidebar Navigation */}
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
        onExport={() => setIsBackupModalOpen(true)}
        onImport={() => setIsImportItemsOpen(true)}
        lastBackupAt={settings.lastBackupAt}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header Bar */}
        <TopBar
          activeTab={activeTab}
          selectedDate={selectedDate}
          onShiftDate={handleShiftDate}
          onResetToday={handleResetToday}
          onOpenAddItem={() => setIsAddItemOpen(true)}
          onOpenAddTask={() => setIsAddTaskOpen(true)}
          onOpenImportItems={() => setIsImportItemsOpen(true)}
          onOpenBackup={() => setIsBackupModalOpen(true)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          items={items}
          habits={habits}
          skills={skills}
          quests={quests}
          onSelectTab={setActiveTab}
          onInspectItem={setInspectedItem}
          onSelectTask={() => {
            setActiveTab('tasks');
          }}
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
          privacyMode={privacyMode}
          onTogglePrivacyMode={handleTogglePrivacyMode}
        />

        {/* Scrollable View Container */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Overview View */}
            {activeTab === 'overview' && (
              <OverviewView
                items={items}
                habits={habits}
                dayRecords={dayRecords}
                quests={quests}
                xpEvents={xpEvents}
                currencySymbol={settings.currencySymbol || '৳'}
                numberGrouping={settings.numberGrouping || 'bangladeshi'}
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
                  currencySymbol={settings.currencySymbol || '৳'}
                  numberGrouping={settings.numberGrouping || 'bangladeshi'}
                  items={items}
                />

                <InventoryGrid
                  items={items}
                  onInspectItem={setInspectedItem}
                  onOpenAddItem={() => setIsAddItemOpen(true)}
                  onOpenImport={() => setIsImportItemsOpen(true)}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  currencySymbol={settings.currencySymbol || '৳'}
                  numberGrouping={settings.numberGrouping || 'bangladeshi'}
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

            {/* Bucket List */}
            {activeTab === 'bucket-list' && (
              <EmptyPageView title="Bucket List" type="bucket-list" />
            )}

            {/* Money */}
            {activeTab === 'money' && (
              <EmptyPageView title="Money" type="money" />
            )}

            {/* Character */}
            {activeTab === 'character' && (
              <CharacterCodex
                profile={profile}
                skills={skills}
                dayRecords={dayRecords}
                xpEvents={xpEvents}
                onUnlockSkill={handleUnlockSkill}
                onUpdateProfile={(updated) => setProfile((prev) => ({ ...prev, ...updated }))}
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

      {/* Item Inspect Modal */}
      <ItemInspectModal
        item={inspectedItem}
        onClose={() => setInspectedItem(null)}
        onChangeStatus={handleChangeStatus}
        onDeleteItem={handleDeleteItem}
        onUpdateItem={handleUpdateItem}
        onDuplicateItem={handleAddItem}
        wearCount={inspectedItem ? wearCounts[inspectedItem.id] || 0 : 0}
        currencySymbol={settings.currencySymbol || '৳'}
        numberGrouping={settings.numberGrouping || 'bangladeshi'}
      />

      {/* Add Item Modal */}
      <AddItemModal
        isOpen={isAddItemOpen}
        onClose={() => setIsAddItemOpen(false)}
        onAddItem={handleAddItem}
        currencySymbol={settings.currencySymbol || '৳'}
      />

      {/* Item Import Modal (JSON / CSV Schema Validation & Dry-Run) */}
      <ImportItemsModal
        isOpen={isImportItemsOpen}
        onClose={() => setIsImportItemsOpen(false)}
        onSuccess={() => {
          reloadFromRepositories();
        }}
        settings={settings}
      />

      {/* Backup Modal (ZIP Export, Dry-Run Restore, File System Access) */}
      <BackupModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        settings={settings}
        onSettingsChange={(newSettings) => {
          setSettings(newSettings);
        }}
        onDataRestored={() => {
          reloadFromRepositories();
        }}
      />

      {/* Wishlist Claim Confirmation Modal */}
      {wishlistPromptItem && (
        <div
          onClick={() => setWishlistPromptItem(null)}
          className="fixed inset-0 z-50 bg-[#1F1B16]/40 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-[#FBF9F4] border border-[#E4DED2] rounded-[6px] p-6 cursor-default animate-in fade-in zoom-in-95"
          >
            <div className="pb-3 border-b border-[#E4DED2]">
              <h3 className="font-serif text-[20px] font-semibold text-[#1F1B16] leading-snug">Milestone Completed</h3>
              <p className="text-[13px] text-[#6B645A] mt-0.5">Linked item unlocked</p>
            </div>

            <div className="py-4 space-y-3">
              <p className="text-[14px] text-[#6B645A] leading-relaxed">
                You successfully achieved the objective linked to your wishlist item{' '}
                <strong className="text-[#1F1B16] font-medium">{wishlistPromptItem.name}</strong>.
              </p>
              <div className="p-3 rounded-[6px] bg-[#F6F2EA] border border-[#E4DED2] flex items-center justify-between">
                <div>
                  <span className="text-[14px] font-medium text-[#1F1B16] block">
                    {wishlistPromptItem.name}
                  </span>
                  <span className="text-[12px] text-[#6B645A]">
                    {wishlistPromptItem.subCategory}
                  </span>
                </div>
                <span className="font-serif text-[16px] font-medium text-[#1F1B16] tabular-nums">
                  {formatCurrency(
                    wishlistPromptItem.targetPrice || wishlistPromptItem.goldValue,
                    settings.currencySymbol || '৳',
                    settings.numberGrouping || 'bangladeshi'
                  )}
                </span>
              </div>
              <p className="text-[13px] text-[#1F1B16]">
                Would you like to mark this item as currently owned?
              </p>
            </div>

            <div className="pt-3 border-t border-[#E4DED2] flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setWishlistPromptItem(null)}
                className="editorial-btn-secondary"
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
                className="editorial-btn-primary"
              >
                Mark Item as Owned
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
