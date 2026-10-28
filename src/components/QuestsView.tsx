import React, { useState, useRef } from 'react';
import type {
  Quest,
  QuestEvidence,
  QuestStatus,
  QuestDifficulty,
  AttributeType,
  InventoryItem,
  EvidenceType,
} from '../types';
import { ATTRIBUTE_NAMES } from '../types';
import {
  Plus,
  LayoutGrid,
  List as ListIcon,
  AlertCircle,
  CheckCircle2,
  Clock,
  Upload,
  Link as LinkIcon,
  FileText,
  Trash2,
  ExternalLink,
  Package,
  X,
  ShieldAlert,
  Flame,
  Cpu,
  Sun,
  Users,
  Camera,
  Compass,
} from 'lucide-react';
import { sfx } from '../utils/audio';
import { getQuestXp } from '../data/xpConfig';
import { CustomSelect } from './CustomSelect';

const QUEST_STATUS_FILTER_OPTIONS = [
  { id: 'ALL', label: 'All Statuses' },
  { id: 'todo', label: 'To Do' },
  { id: 'doing', label: 'In Progress' },
  { id: 'done', label: 'Completed' },
];

const QUEST_DUE_FILTER_OPTIONS = [
  { id: 'ALL', label: 'All Deadlines' },
  { id: 'OVERDUE', label: 'Overdue Only' },
  { id: 'THIS_WEEK', label: 'Due This Week' },
  { id: 'NO_DATE', label: 'No Deadline' },
];

const QUEST_STATUS_OPTIONS = [
  { id: 'todo', label: 'To Do' },
  { id: 'doing', label: 'In Progress' },
  { id: 'done', label: 'Completed' },
];

const QUEST_PILLAR_OPTIONS = [
  { id: 'STR', label: 'STR (Physical Body)' },
  { id: 'INT', label: 'INT (Professional Craft)' },
  { id: 'WIS', label: 'WIS (Spiritual Soul)' },
  { id: 'CHA', label: 'CHA (Community Social)' },
];

const QUEST_DIFFICULTY_OPTIONS = [
  { id: 'Easy', label: 'Easy (+50 XP)' },
  { id: 'Medium', label: 'Medium (+100 XP)' },
  { id: 'Hard', label: 'Hard (+200 XP)' },
];
import { getTodayLocalDateStr } from '../utils/date';

interface QuestsViewProps {
  quests: Quest[];
  evidence: QuestEvidence[];
  items: InventoryItem[];
  onAddQuest: (quest: Omit<Quest, 'id' | 'createdAt'>) => void;
  onUpdateQuest: (quest: Quest) => void;
  onDeleteQuest: (questId: string) => void;
  onAddEvidence: (questId: string, type: EvidenceType, content: string) => void;
  onDeleteEvidence: (evidenceId: string) => void;
  onCompleteQuest: (quest: Quest) => void;
  onReopenQuest: (quest: Quest) => void;
  isAddModalOpen?: boolean;
  onCloseAddModal?: () => void;
}

const PILLAR_ICONS: Record<AttributeType, React.ComponentType<{ className?: string }>> = {
  STR: Flame,
  INT: Cpu,
  WIS: Sun,
  CHA: Users,
};

const PILLAR_THEMES: Record<AttributeType, { text: string; bg: string; border: string }> = {
  STR: { text: 'text-[#DC2626]', bg: 'bg-[#FDECEC]', border: 'border-[#FDECEC]' },
  INT: { text: 'text-[#2563EB]', bg: 'bg-[#EBF2FE]', border: 'border-[#EBF2FE]' },
  WIS: { text: 'text-[#0891B2]', bg: 'bg-[#E6F7F9]', border: 'border-[#BCE7EB]' },
  CHA: { text: 'text-[#16A34A]', bg: 'bg-[#E6F6EC]', border: 'border-[#E6F6EC]' },
};

const STATUS_COLUMNS: { id: QuestStatus; title: string; desc: string }[] = [
  { id: 'todo', title: 'To Do', desc: 'Tactical objectives waiting to be tackled' },
  { id: 'doing', title: 'In Progress', desc: 'Active quests currently in motion' },
  { id: 'done', title: 'Completed', desc: 'Finished objectives with earned XP' },
];

export const QuestsView: React.FC<QuestsViewProps> = ({
  quests,
  evidence,
  items,
  onAddQuest,
  onUpdateQuest,
  onDeleteQuest,
  onAddEvidence,
  onDeleteEvidence,
  onCompleteQuest,
  onReopenQuest,
  isAddModalOpen = false,
  onCloseAddModal,
}) => {
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
  const [pillarFilter, setPillarFilter] = useState<AttributeType | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<QuestStatus | 'ALL'>('ALL');
  const [dueFilter, setDueFilter] = useState<'ALL' | 'OVERDUE' | 'THIS_WEEK' | 'NO_DATE'>('ALL');

  // Selected quest for Drawer
  const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null);

  // New Quest local modal state (if opened internally)
  const [internalAddOpen, setInternalAddOpen] = useState(false);
  const showAddModal = isAddModalOpen || internalAddOpen;
  const handleCloseAdd = () => {
    setInternalAddOpen(false);
    if (onCloseAddModal) onCloseAddModal();
  };

  // Form states for New Quest
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPillar, setNewPillar] = useState<AttributeType>('INT');
  const [newDifficulty, setNewDifficulty] = useState<QuestDifficulty>('Medium');
  const [newDueDate, setNewDueDate] = useState('');
  const [newEvidenceReq, setNewEvidenceReq] = useState(false);
  const [newLinkedItemId, setNewLinkedItemId] = useState('');

  // Form states for Adding Evidence
  const [evidenceType, setEvidenceType] = useState<EvidenceType>('note');
  const [evidenceContent, setEvidenceContent] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Inline error warning when trying to move to Done without evidence
  const [evidenceWarningId, setEvidenceWarningId] = useState<string | null>(null);

  const todayStr = getTodayLocalDateStr();

  // Active (non-deleted) quests
  const activeQuests = quests.filter((q) => !q.deletedAt);

  // Check overdue helper
  const isQuestOverdue = (quest: Quest) => {
    if (!quest.dueDate || quest.status === 'done') return false;
    return quest.dueDate < todayStr;
  };

  // Check this week helper
  const isDueThisWeek = (quest: Quest) => {
    if (!quest.dueDate) return false;
    const diff =
      (new Date(quest.dueDate).getTime() - new Date(todayStr).getTime()) /
      (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 7;
  };

  // Filtered Quests
  const filteredQuests = activeQuests.filter((quest) => {
    if (pillarFilter !== 'ALL' && quest.pillar !== pillarFilter) return false;
    if (statusFilter !== 'ALL' && quest.status !== statusFilter) return false;
    if (dueFilter === 'OVERDUE' && !isQuestOverdue(quest)) return false;
    if (dueFilter === 'THIS_WEEK' && !isDueThisWeek(quest)) return false;
    if (dueFilter === 'NO_DATE' && quest.dueDate) return false;
    return true;
  });

  // Evidence list for selected quest
  const selectedEvidence = selectedQuest
    ? evidence.filter((e) => e.questId === selectedQuest.id)
    : [];

  // Drag and drop handler
  const handleDragStart = (e: React.DragEvent, questId: string) => {
    e.dataTransfer.setData('text/plain', questId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDropOnColumn = (e: React.DragEvent, targetStatus: QuestStatus) => {
    e.preventDefault();
    const questId = e.dataTransfer.getData('text/plain');
    if (!questId) return;

    const quest = activeQuests.find((q) => q.id === questId);
    if (!quest || quest.status === targetStatus) return;

    // Check evidence gating rule
    if (targetStatus === 'done' && quest.evidenceRequired) {
      const qEvidence = evidence.filter((ev) => ev.questId === quest.id);
      if (qEvidence.length === 0) {
        setEvidenceWarningId(quest.id);
        sfx.playClick();
        setSelectedQuest(quest);
        setTimeout(() => setEvidenceWarningId(null), 5000);
        return;
      }
    }

    if (targetStatus === 'done') {
      onCompleteQuest(quest);
    } else if (quest.status === 'done') {
      onReopenQuest(quest);
    } else {
      onUpdateQuest({
        ...quest,
        status: targetStatus,
      });
    }
    sfx.playClick();
  };

  const handleToggleDone = (quest: Quest) => {
    if (quest.status === 'done') {
      onReopenQuest(quest);
    } else {
      // Evidence check
      if (quest.evidenceRequired) {
        const qEvidence = evidence.filter((ev) => ev.questId === quest.id);
        if (qEvidence.length === 0) {
          setEvidenceWarningId(quest.id);
          setSelectedQuest(quest);
          sfx.playClick();
          setTimeout(() => setEvidenceWarningId(null), 5000);
          return;
        }
      }
      onCompleteQuest(quest);
    }
  };

  // Submit New Quest
  const handleCreateQuest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    onAddQuest({
      title: newTitle.trim(),
      description: newDesc.trim(),
      pillar: newPillar,
      difficulty: newDifficulty,
      status: 'todo',
      dueDate: newDueDate || undefined,
      evidenceRequired: newEvidenceReq,
      linkedItemId: newLinkedItemId || undefined,
    });

    setNewTitle('');
    setNewDesc('');
    setNewDueDate('');
    setNewEvidenceReq(false);
    setNewLinkedItemId('');
    handleCloseAdd();
    sfx.playClick();
  };

  // Submit Evidence
  const handleAddEvidenceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuest || !evidenceContent.trim()) return;

    onAddEvidence(selectedQuest.id, evidenceType, evidenceContent.trim());
    setEvidenceContent('');
    sfx.playEquip();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedQuest) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      onAddEvidence(selectedQuest.id, 'photo', result);
      sfx.playEquip();
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Toolbar with Filters & Board/List View Toggle */}
      <div className="ship-card p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#ECECF0]">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-[15px] font-semibold text-[#111113] tracking-tight">
                Quest Log & Actionable Milestones
              </h2>
              <span className="ship-pill-accent font-semibold">
                {activeQuests.filter((q) => q.status !== 'done').length} open quests
              </span>
            </div>
            <p className="text-[13px] text-[#6B6B76] mt-0.5">
              One-off tactical missions granting calibrated character XP upon completion
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* View Toggle */}
            <div className="inline-flex p-1 bg-[#ECECF0] rounded-xl self-start">
              <button
                onClick={() => {
                  sfx.playClick();
                  setViewMode('board');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'board'
                    ? 'bg-white text-[#111113] shadow-xs'
                    : 'text-[#6B6B76] hover:text-[#111113]'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5 text-[#0891B2]" />
                <span>Board</span>
              </button>
              <button
                onClick={() => {
                  sfx.playClick();
                  setViewMode('list');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-white text-[#111113] shadow-xs'
                    : 'text-[#6B6B76] hover:text-[#111113]'
                }`}
              >
                <ListIcon className="w-3.5 h-3.5 text-[#0891B2]" />
                <span>List</span>
              </button>
            </div>

            {/* New Quest Button */}
            <button
              onClick={() => {
                sfx.playClick();
                setInternalAddOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-[#0891B2] hover:bg-[#0E7490] text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Quest</span>
            </button>
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 text-xs">
          {/* Pillar Filters */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[#9A9AA5] font-medium mr-1">Pillar:</span>
            {[
              { id: 'ALL', label: 'All' },
              { id: 'STR', label: 'Strength' },
              { id: 'INT', label: 'Intellect' },
              { id: 'WIS', label: 'Wisdom' },
              { id: 'CHA', label: 'Charisma' },
            ].map(({ id, label }) => (
              <button
                key={id}
                onClick={() => {
                  sfx.playClick();
                  setPillarFilter(id as AttributeType | 'ALL');
                }}
                className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                  pillarFilter === id
                    ? 'bg-[#E6F7F9] border-[#0891B2] text-[#0891B2] font-semibold'
                    : 'bg-white border-[#ECECF0] text-[#6B6B76] hover:text-[#111113]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Status & Due Date Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <CustomSelect
              value={statusFilter}
              options={QUEST_STATUS_FILTER_OPTIONS}
              onChange={(val) => setStatusFilter(val as QuestStatus | 'ALL')}
              buttonClassName="py-1 px-3 text-xs"
            />

            <CustomSelect
              value={dueFilter}
              options={QUEST_DUE_FILTER_OPTIONS}
              onChange={(val) => setDueFilter(val as any)}
              buttonClassName="py-1 px-3 text-xs"
            />
          </div>
        </div>
      </div>

      {/* Inline Evidence Required Warning Banner */}
      {evidenceWarningId && (
        <div className="p-4 rounded-2xl bg-[#FDECEC] border border-[#DC2626]/20 flex items-center justify-between text-[#DC2626] animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-5 h-5 flex-shrink-0" />
            <div className="text-xs font-medium">
              <strong className="font-semibold block">Evidence Required Before Completion</strong>
              This quest mandates verified evidence. Please attach a photo, link, or note proof before moving it to Done.
            </div>
          </div>
          <button
            onClick={() => setEvidenceWarningId(null)}
            className="p-1 rounded-lg hover:bg-black/5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. BOARD VIEW */}
      {viewMode === 'board' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {STATUS_COLUMNS.map((col) => {
            const columnQuests = filteredQuests.filter((q) => q.status === col.id);

            return (
              <div
                key={col.id}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDropOnColumn(e, col.id)}
                className="flex flex-col bg-[#F4F4F6] rounded-2xl border border-[#ECECF0] p-4 min-h-[460px] transition-colors"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#ECECF0]">
                  <div>
                    <h3 className="text-sm font-semibold text-[#111113]">{col.title}</h3>
                    <span className="text-[11px] text-[#9A9AA5]">{col.desc}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-white border border-[#ECECF0] text-[#6B6B76]">
                    {columnQuests.length}
                  </span>
                </div>

                {/* Quests Container */}
                <div className="flex-1 space-y-3">
                  {columnQuests.length === 0 ? (
                    <div className="h-40 flex flex-col items-center justify-center text-center p-4 border border-dashed border-[#BEBEC6] rounded-xl text-[#9A9AA5]">
                      <span className="text-xs font-medium">No quests in {col.title}</span>
                      <span className="text-[11px] mt-0.5">Drag tasks here or click "New Quest"</span>
                    </div>
                  ) : (
                    columnQuests.map((quest) => {
                      const theme = PILLAR_THEMES[quest.pillar];
                      const PillarIcon = PILLAR_ICONS[quest.pillar];
                      const xpValue = getQuestXp(quest.difficulty);
                      const isOverdue = isQuestOverdue(quest);
                      const questEvidenceCount = evidence.filter((e) => e.questId === quest.id).length;
                      const linkedItem = items.find((i) => i.id === quest.linkedItemId);

                      return (
                        <div
                          key={quest.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, quest.id)}
                          onClick={() => {
                            sfx.playClick();
                            setSelectedQuest(quest);
                          }}
                          className={`ship-card p-4 hover:border-[#0891B2]/50 hover:shadow-sm cursor-grab active:cursor-grabbing transition-all ${
                            quest.status === 'done' ? 'opacity-85' : ''
                          }`}
                        >
                          {/* Tags row */}
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {/* Pillar Pill */}
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold ${theme.bg} ${theme.text}`}
                              >
                                <PillarIcon className="w-3 h-3" />
                                <span>{ATTRIBUTE_NAMES[quest.pillar]}</span>
                              </span>

                              {/* Difficulty Pill */}
                              <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#F4F4F6] text-[#6B6B76]">
                                {quest.difficulty} (+{xpValue} XP)
                              </span>
                            </div>

                            {/* Completed Status Checkmark */}
                            {quest.status === 'done' && (
                              <CheckCircle2 className="w-4 h-4 text-[#16A34A] flex-shrink-0" />
                            )}
                          </div>

                          {/* Title & Description */}
                          <h4 className="text-sm font-semibold text-[#111113] leading-snug mb-1">
                            {quest.title}
                          </h4>
                          {quest.description && (
                            <p className="text-xs text-[#6B6B76] line-clamp-2 leading-relaxed mb-3">
                              {quest.description}
                            </p>
                          )}

                          {/* Footer Meta Row: Due date, Evidence, Linked Item */}
                          <div className="pt-2 border-t border-[#ECECF0] flex items-center justify-between gap-2 text-[11px]">
                            {/* Due Date */}
                            <div className="flex items-center gap-1">
                              {quest.dueDate ? (
                                <span
                                  className={`flex items-center gap-1 font-medium ${
                                    isOverdue ? 'text-[#DC2626] font-semibold' : 'text-[#6B6B76]'
                                  }`}
                                >
                                  {isOverdue ? (
                                    <AlertCircle className="w-3.5 h-3.5 text-[#DC2626]" />
                                  ) : (
                                    <Clock className="w-3.5 h-3.5 text-[#9A9AA5]" />
                                  )}
                                  <span>{quest.dueDate}</span>
                                </span>
                              ) : (
                                <span className="text-[#9A9AA5]">No date</span>
                              )}
                            </div>

                            {/* Evidence / Linked item indicators */}
                            <div className="flex items-center gap-2">
                              {quest.evidenceRequired && (
                                <span
                                  className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold ${
                                    questEvidenceCount > 0
                                      ? 'bg-[#E6F7F9] text-[#0891B2]'
                                      : 'bg-[#FDECEC] text-[#DC2626]'
                                  }`}
                                  title={`${questEvidenceCount} evidence proofs attached`}
                                >
                                  <Camera className="w-3 h-3" />
                                  <span>{questEvidenceCount}</span>
                                </span>
                              )}

                              {linkedItem && (
                                <span
                                  className="flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-[#F4F4F6] text-[#6B6B76]"
                                  title={`Linked to: ${linkedItem.name}`}
                                >
                                  <Package className="w-3 h-3 text-[#0891B2]" />
                                  <span className="truncate max-w-[80px]">{linkedItem.name}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 3. LIST VIEW */}
      {viewMode === 'list' && (
        <div className="ship-card overflow-hidden">
          {filteredQuests.length === 0 ? (
            <div className="p-12 text-center text-[#9A9AA5] space-y-2">
              <AlertCircle className="w-8 h-8 mx-auto text-[#BEBEC6]" />
              <div className="text-sm font-semibold text-[#111113]">No matching quests found</div>
              <p className="text-xs text-[#6B6B76]">Try adjusting your search or active filters.</p>
            </div>
          ) : (
            <div className="divide-y divide-[#ECECF0]">
              {filteredQuests.map((quest) => {
                const theme = PILLAR_THEMES[quest.pillar];
                const PillarIcon = PILLAR_ICONS[quest.pillar];
                const isOverdue = isQuestOverdue(quest);
                const questEvidenceCount = evidence.filter((e) => e.questId === quest.id).length;
                const linkedItem = items.find((i) => i.id === quest.linkedItemId);

                return (
                  <div
                    key={quest.id}
                    className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#F4F4F6]/50 transition-colors ${
                      quest.status === 'done' ? 'bg-[#F4F4F6]/20' : ''
                    }`}
                  >
                    {/* Left: Checkbox + Title + Description */}
                    <div className="flex items-start gap-3 min-w-0">
                      <button
                        type="button"
                        onClick={() => handleToggleDone(quest)}
                        className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition-colors flex-shrink-0 cursor-pointer ${
                          quest.status === 'done'
                            ? 'bg-[#16A34A] border-[#16A34A] text-white'
                            : 'bg-white border-[#BEBEC6] hover:border-[#0891B2]'
                        }`}
                      >
                        {quest.status === 'done' && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </button>

                      <div
                        onClick={() => {
                          sfx.playClick();
                          setSelectedQuest(quest);
                        }}
                        className="cursor-pointer min-w-0"
                      >
                        <div className="flex items-center gap-2">
                          <h4
                            className={`text-sm font-semibold truncate ${
                              quest.status === 'done'
                                ? 'line-through text-[#6B6B76]'
                                : 'text-[#111113]'
                            }`}
                          >
                            {quest.title}
                          </h4>
                        </div>
                        {quest.description && (
                          <p className="text-xs text-[#6B6B76] truncate max-w-xl mt-0.5">
                            {quest.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Right: Badges + Due Date + Detail Button */}
                    <div className="flex items-center gap-2.5 flex-shrink-0 self-end sm:self-center">
                      {/* Pillar */}
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold ${theme.bg} ${theme.text}`}
                      >
                        <PillarIcon className="w-3.5 h-3.5" />
                        <span>{quest.pillar}</span>
                      </span>

                      {/* Difficulty */}
                      <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-[#F4F4F6] text-[#6B6B76]">
                        {quest.difficulty}
                      </span>

                      {/* Due Date */}
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-md ${
                          isOverdue
                            ? 'bg-[#FDECEC] text-[#DC2626] font-semibold'
                            : 'text-[#6B6B76]'
                        }`}
                      >
                        {quest.dueDate || 'No date'}
                      </span>

                      {/* Evidence Pill */}
                      {quest.evidenceRequired && (
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                            questEvidenceCount > 0
                              ? 'bg-[#E6F7F9] text-[#0891B2]'
                              : 'bg-[#FDECEC] text-[#DC2626]'
                          }`}
                        >
                          <Camera className="w-3 h-3" />
                          <span>{questEvidenceCount}</span>
                        </span>
                      )}

                      {/* Linked Item Pill */}
                      {linkedItem && (
                        <span
                          className="px-2 py-0.5 rounded-md text-xs font-semibold bg-[#F4F4F6] text-[#0891B2] flex items-center gap-1"
                          title={`Linked to: ${linkedItem.name}`}
                        >
                          <Package className="w-3 h-3" />
                          <span className="truncate max-w-[90px]">{linkedItem.name}</span>
                        </span>
                      )}

                      {/* Inspect / Edit */}
                      <button
                        onClick={() => {
                          sfx.playClick();
                          setSelectedQuest(quest);
                        }}
                        className="px-3 py-1 rounded-lg text-xs font-semibold bg-white border border-[#ECECF0] hover:bg-[#F4F4F6] text-[#111113] cursor-pointer"
                      >
                        Details
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 4. QUEST DETAIL DRAWER / MODAL */}
      {selectedQuest && (
        <div
          onClick={() => setSelectedQuest(null)}
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl bg-white border border-[#ECECF0] rounded-2xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col cursor-default animate-in fade-in zoom-in-95"
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#ECECF0] bg-white">
              <div className="flex items-center gap-2.5">
                <div className="ship-icon-tile">
                  <Compass className="w-5 h-5 text-[#0891B2]" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-[#111113]">Quest Details</h3>
                  <p className="text-xs text-[#6B6B76]">
                    Created on {selectedQuest.createdAt} • Worth +{getQuestXp(selectedQuest.difficulty)} {ATTRIBUTE_NAMES[selectedQuest.pillar]} XP
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedQuest(null)}
                className="p-1.5 rounded-lg text-[#6B6B76] hover:text-[#111113] hover:bg-[#F4F4F6]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer Scrollable Content */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              {/* Title & Status */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-[#6B6B76] uppercase tracking-wider mb-1">
                    Quest Title
                  </label>
                  <input
                    type="text"
                    value={selectedQuest.title}
                    onChange={(e) => {
                      const updated = { ...selectedQuest, title: e.target.value };
                      setSelectedQuest(updated);
                      onUpdateQuest(updated);
                    }}
                    className="ship-input w-full px-3 py-2 text-sm font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#6B6B76] uppercase tracking-wider mb-1">
                    Description & Objectives
                  </label>
                  <textarea
                    rows={2}
                    value={selectedQuest.description}
                    onChange={(e) => {
                      const updated = { ...selectedQuest, description: e.target.value };
                      setSelectedQuest(updated);
                      onUpdateQuest(updated);
                    }}
                    className="ship-input w-full px-3 py-2 text-xs"
                    placeholder="Provide context or instructions for this mission..."
                  />
                </div>
              </div>

              {/* Status, Pillar, Difficulty & Due Date Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-[#F4F4F6] rounded-xl border border-[#ECECF0]">
                {/* Status */}
                <div>
                  <label className="block text-[11px] font-semibold text-[#6B6B76] uppercase tracking-wider mb-1">
                    Status
                  </label>
                  <CustomSelect
                    value={selectedQuest.status}
                    options={QUEST_STATUS_OPTIONS}
                    onChange={(val) => {
                      const nextStatus = val as QuestStatus;
                      if (nextStatus === 'done') {
                        if (selectedQuest.evidenceRequired && selectedEvidence.length === 0) {
                          setEvidenceWarningId(selectedQuest.id);
                          return;
                        }
                        onCompleteQuest(selectedQuest);
                        setSelectedQuest({ ...selectedQuest, status: 'done', completedAt: todayStr });
                      } else if (selectedQuest.status === 'done') {
                        onReopenQuest(selectedQuest);
                        setSelectedQuest({ ...selectedQuest, status: nextStatus, completedAt: undefined });
                      } else {
                        const updated = { ...selectedQuest, status: nextStatus };
                        setSelectedQuest(updated);
                        onUpdateQuest(updated);
                      }
                    }}
                    buttonClassName="py-1 px-2.5 text-xs font-medium"
                  />
                </div>

                {/* Pillar */}
                <div>
                  <label className="block text-[11px] font-semibold text-[#6B6B76] uppercase tracking-wider mb-1">
                    Pillar
                  </label>
                  <CustomSelect
                    value={selectedQuest.pillar}
                    options={QUEST_PILLAR_OPTIONS}
                    onChange={(val) => {
                      const updated = { ...selectedQuest, pillar: val as AttributeType };
                      setSelectedQuest(updated);
                      onUpdateQuest(updated);
                    }}
                    buttonClassName="py-1 px-2.5 text-xs font-medium"
                  />
                </div>

                {/* Difficulty */}
                <div>
                  <label className="block text-[11px] font-semibold text-[#6B6B76] uppercase tracking-wider mb-1">
                    Difficulty
                  </label>
                  <CustomSelect
                    value={selectedQuest.difficulty}
                    options={QUEST_DIFFICULTY_OPTIONS}
                    onChange={(val) => {
                      const updated = { ...selectedQuest, difficulty: val as QuestDifficulty };
                      setSelectedQuest(updated);
                      onUpdateQuest(updated);
                    }}
                    buttonClassName="py-1 px-2.5 text-xs font-medium"
                  />
                </div>

                {/* Due Date */}
                <div>
                  <label className="block text-[11px] font-semibold text-[#6B6B76] uppercase tracking-wider mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={selectedQuest.dueDate || ''}
                    onChange={(e) => {
                      const updated = { ...selectedQuest, dueDate: e.target.value || undefined };
                      setSelectedQuest(updated);
                      onUpdateQuest(updated);
                    }}
                    className="ship-input w-full px-2.5 py-1.5 text-xs font-medium"
                  />
                </div>
              </div>

              {/* Evidence Required Toggle & Linked Item Picker */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Evidence Required */}
                <div className="p-3.5 rounded-xl border border-[#ECECF0] bg-white flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-[#111113] block">
                      Evidence Required to Complete
                    </span>
                    <span className="text-[11px] text-[#6B6B76]">
                      Blocks moving to Done until proof is attached
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedQuest.evidenceRequired}
                      onChange={(e) => {
                        const updated = { ...selectedQuest, evidenceRequired: e.target.checked };
                        setSelectedQuest(updated);
                        onUpdateQuest(updated);
                      }}
                      className="w-4 h-4 rounded text-[#0891B2] accent-[#0891B2] focus:ring-0 cursor-pointer"
                    />
                  </label>
                </div>

                {/* Linked Item Picker */}
                <div className="p-3.5 rounded-xl border border-[#ECECF0] bg-white">
                  <label className="block text-xs font-semibold text-[#111113] mb-1">
                    Linked Possession (Optional)
                  </label>
                  <CustomSelect
                    value={selectedQuest.linkedItemId || ''}
                    options={[
                      { id: '', label: 'None (Standalone Quest)' },
                      ...items.map((i) => ({
                        id: i.id,
                        label: `${i.ownershipStatus === 'wishlist' ? '★ [Wishlist] ' : ''}${i.name}`,
                        sublabel: i.ownershipStatus === 'wishlist' ? 'Wishlist Milestone' : 'Owned Item',
                      })),
                    ]}
                    onChange={(val) => {
                      const updated = { ...selectedQuest, linkedItemId: val || undefined };
                      setSelectedQuest(updated);
                      onUpdateQuest(updated);
                    }}
                    buttonClassName="py-1 px-2.5 text-xs font-medium"
                  />
                </div>
              </div>

              {/* Evidence Log & Attach Evidence Control */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-semibold text-[#111113] uppercase tracking-wider flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-[#0891B2]" />
                    <span>Evidence & Verification Proofs ({selectedEvidence.length})</span>
                  </h4>
                </div>

                {/* Existing Evidence List */}
                {selectedEvidence.length === 0 ? (
                  <div className="p-4 rounded-xl bg-[#F4F4F6] border border-dashed border-[#BEBEC6] text-center text-xs text-[#9A9AA5] mb-4">
                    No evidence attached yet. Add a note, reference URL, or upload a photo proof below.
                  </div>
                ) : (
                  <div className="space-y-2 mb-4">
                    {selectedEvidence.map((ev) => (
                      <div
                        key={ev.id}
                        className="p-3 rounded-xl border border-[#ECECF0] bg-[#F4F4F6] flex items-start justify-between gap-3 text-xs"
                      >
                        <div className="flex items-start gap-2.5 min-w-0">
                          {ev.type === 'photo' && <Camera className="w-4 h-4 text-[#0891B2] mt-0.5 flex-shrink-0" />}
                          {ev.type === 'link' && <LinkIcon className="w-4 h-4 text-[#2563EB] mt-0.5 flex-shrink-0" />}
                          {ev.type === 'note' && <FileText className="w-4 h-4 text-[#16A34A] mt-0.5 flex-shrink-0" />}

                          <div className="min-w-0">
                            {ev.type === 'photo' ? (
                              <img
                                src={ev.content}
                                alt="Proof"
                                className="w-32 h-20 object-cover rounded-lg border border-[#ECECF0] shadow-2xs mt-1"
                              />
                            ) : ev.type === 'link' ? (
                              <a
                                href={ev.content}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[#0891B2] underline font-medium break-all flex items-center gap-1"
                              >
                                {ev.content} <ExternalLink className="w-3 h-3" />
                              </a>
                            ) : (
                              <p className="text-[#111113] whitespace-pre-wrap">{ev.content}</p>
                            )}
                            <span className="text-[10px] text-[#9A9AA5] mt-1 block">
                              Attached on {ev.addedAt}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => onDeleteEvidence(ev.id)}
                          className="p-1 rounded-lg text-[#9A9AA5] hover:text-[#DC2626] transition-colors"
                          title="Delete evidence"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Evidence Control */}
                <form
                  onSubmit={handleAddEvidenceSubmit}
                  className="p-4 rounded-xl border border-[#ECECF0] bg-white space-y-3"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#111113]">Add Verification Proof</span>
                    <div className="flex items-center gap-1 bg-[#ECECF0] p-0.5 rounded-lg">
                      <button
                        type="button"
                        onClick={() => setEvidenceType('note')}
                        className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-all ${
                          evidenceType === 'note' ? 'bg-white text-[#111113] font-semibold shadow-xs' : 'text-[#6B6B76]'
                        }`}
                      >
                        Note
                      </button>
                      <button
                        type="button"
                        onClick={() => setEvidenceType('link')}
                        className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-all ${
                          evidenceType === 'link' ? 'bg-white text-[#111113] font-semibold shadow-xs' : 'text-[#6B6B76]'
                        }`}
                      >
                        Link URL
                      </button>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-2 py-0.5 rounded-md text-[11px] font-medium text-[#0891B2] hover:bg-white transition-all flex items-center gap-1"
                      >
                        <Upload className="w-3 h-3" />
                        <span>Upload Photo</span>
                      </button>
                    </div>
                  </div>

                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />

                  {evidenceType === 'note' ? (
                    <textarea
                      rows={2}
                      value={evidenceContent}
                      onChange={(e) => setEvidenceContent(e.target.value)}
                      placeholder="Write evidence note, workout stats, or verification reflection..."
                      className="ship-input w-full px-3 py-1.5 text-xs"
                    />
                  ) : (
                    <input
                      type="url"
                      value={evidenceContent}
                      onChange={(e) => setEvidenceContent(e.target.value)}
                      placeholder="https://github.com/... or live proof URL"
                      className="ship-input w-full px-3 py-1.5 text-xs"
                    />
                  )}

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={!evidenceContent.trim()}
                      className="px-3.5 py-1.5 rounded-xl bg-[#0891B2] hover:bg-[#0E7490] disabled:opacity-50 text-white text-xs font-semibold transition-all cursor-pointer shadow-xs"
                    >
                      Attach Proof
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-4 border-t border-[#ECECF0] bg-white flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Archive quest "${selectedQuest.title}"?`)) {
                    onDeleteQuest(selectedQuest.id);
                    setSelectedQuest(null);
                    sfx.playClick();
                  }
                }}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-[#DC2626] hover:bg-[#FDECEC] transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Archive Quest</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedQuest(null)}
                  className="px-4 py-1.5 rounded-xl text-xs font-semibold text-[#6B6B76] hover:bg-[#F4F4F6] transition-colors cursor-pointer"
                >
                  Done
                </button>
                {selectedQuest.status !== 'done' ? (
                  <button
                    type="button"
                    onClick={() => {
                      handleToggleDone(selectedQuest);
                      setSelectedQuest(null);
                    }}
                    className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-[#16A34A] hover:bg-[#15803D] text-white shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Complete Quest (+{getQuestXp(selectedQuest.difficulty)} XP)</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      handleToggleDone(selectedQuest);
                      setSelectedQuest(null);
                    }}
                    className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-white border border-[#ECECF0] hover:bg-[#F4F4F6] text-[#111113] shadow-xs transition-colors cursor-pointer"
                  >
                    Reopen Quest
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. CREATE NEW QUEST MODAL */}
      {showAddModal && (
        <div
          onClick={handleCloseAdd}
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-white border border-[#ECECF0] rounded-2xl shadow-xl p-6 cursor-default animate-in fade-in zoom-in-95"
          >
            <div className="flex items-center justify-between pb-4 border-b border-[#ECECF0] mb-4">
              <div>
                <h3 className="text-base font-semibold text-[#111113]">Create Tactical Quest</h3>
                <p className="text-xs text-[#6B6B76] mt-0.5">
                  Define an objective, set its difficulty, and earn calibrated pillar XP
                </p>
              </div>
              <button
                onClick={handleCloseAdd}
                className="p-1.5 rounded-lg text-[#6B6B76] hover:text-[#111113] hover:bg-[#F4F4F6]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateQuest} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#6B6B76] uppercase tracking-wider mb-1.5">
                  Quest Title
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Clean 75kg Benchpress, Refactor Storage Schema..."
                  className="ship-input w-full px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6B6B76] uppercase tracking-wider mb-1.5">
                  Description & Context
                </label>
                <textarea
                  rows={2}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Specific requirements or outcome definition..."
                  className="ship-input w-full px-3 py-2 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#6B6B76] uppercase tracking-wider mb-1.5">
                    Target Pillar
                  </label>
                  <CustomSelect
                    value={newPillar}
                    options={QUEST_PILLAR_OPTIONS}
                    onChange={(val) => setNewPillar(val as AttributeType)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#6B6B76] uppercase tracking-wider mb-1.5">
                    Difficulty Tier
                  </label>
                  <CustomSelect
                    value={newDifficulty}
                    options={QUEST_DIFFICULTY_OPTIONS}
                    onChange={(val) => setNewDifficulty(val as QuestDifficulty)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#6B6B76] uppercase tracking-wider mb-1.5">
                    Deadline (Optional)
                  </label>
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="ship-input w-full px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#6B6B76] uppercase tracking-wider mb-1.5">
                    Linked Possession (Optional)
                  </label>
                  <CustomSelect
                    value={newLinkedItemId}
                    options={[
                      { id: '', label: 'None' },
                      ...items.map((i) => ({
                        id: i.id,
                        label: `${i.ownershipStatus === 'wishlist' ? '★ [Wishlist] ' : ''}${i.name}`,
                        sublabel: i.ownershipStatus === 'wishlist' ? 'Wishlist Milestone' : 'Owned Item',
                      })),
                    ]}
                    onChange={(val) => setNewLinkedItemId(val)}
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-[#ECECF0] bg-[#F4F4F6] flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-[#111113] block">
                    Require Evidence Proof
                  </span>
                  <span className="text-[11px] text-[#6B6B76]">
                    Must attach note, link, or photo before completion
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={newEvidenceReq}
                  onChange={(e) => setNewEvidenceReq(e.target.checked)}
                  className="w-4 h-4 rounded text-[#0891B2] accent-[#0891B2] focus:ring-0 cursor-pointer"
                />
              </div>

              <div className="pt-4 border-t border-[#ECECF0] flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={handleCloseAdd}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#6B6B76] hover:bg-[#F4F4F6]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-[#0891B2] hover:bg-[#0E7490] text-white shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Quest</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
