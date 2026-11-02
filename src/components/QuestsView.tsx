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
  CheckCircle2,
  Trash2,
  ExternalLink,
  X,
  ShieldAlert,
} from 'lucide-react';
import { sfx } from '../utils/audio';
import { getQuestXp } from '../data/xpConfig';
import { CustomSelect } from './CustomSelect';
import { getTodayLocalDateStr } from '../utils/date';

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
  { id: 'STR', label: 'STR (Strength)' },
  { id: 'INT', label: 'INT (Intellect)' },
  { id: 'WIS', label: 'WIS (Wisdom)' },
  { id: 'CHA', label: 'CHA (Charisma)' },
];

const QUEST_DIFFICULTY_OPTIONS = [
  { id: 'Easy', label: 'Easy (+50 XP)' },
  { id: 'Medium', label: 'Medium (+100 XP)' },
  { id: 'Hard', label: 'Hard (+200 XP)' },
];

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
  onReopenQuest: (quest: Quest, targetStatus?: QuestStatus) => void;
  isAddModalOpen?: boolean;
  onCloseAddModal?: () => void;
}

const PILLAR_THEMES: Record<AttributeType, { text: string; bg: string; border: string }> = {
  STR: { text: 'text-[#E11D48]', bg: 'bg-[#F8FAFC]', border: 'border-[#E11D48]/30' },
  INT: { text: 'text-[#2563EB]', bg: 'bg-[#F8FAFC]', border: 'border-[#2563EB]/30' },
  WIS: { text: 'text-[#D97706]', bg: 'bg-[#F8FAFC]', border: 'border-[#D97706]/30' },
  CHA: { text: 'text-[#059669]', bg: 'bg-[#F8FAFC]', border: 'border-[#059669]/30' },
};

const STATUS_COLUMNS: { id: QuestStatus; title: string; desc: string }[] = [
  { id: 'todo', title: 'To Do', desc: 'Objectives waiting to be tackled' },
  { id: 'doing', title: 'In Progress', desc: 'Active tasks in motion' },
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
      onReopenQuest(quest, targetStatus);
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
      onReopenQuest(quest, 'todo');
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
      <div className="pb-4 border-b border-[#E2E8F0] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <h2 className="font-serif text-[20px] font-normal text-[#0F172A]">
              Tasks
            </h2>
            <span className="text-[12px] tabular-nums text-[#64748B] px-2 py-0.5 rounded-[4px] bg-[#F1F5F9] border border-[#E2E8F0]">
              {activeQuests.filter((q) => q.status !== 'done').length} open
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* View Toggle */}
            <div className="inline-flex p-0.5 bg-[#F1F5F9] rounded-[6px] border border-[#E2E8F0]">
              <button
                type="button"
                onClick={() => {
                  sfx.playClick();
                  setViewMode('board');
                }}
                className={`px-3 py-1 rounded-[4px] text-[13px] font-medium transition-colors cursor-pointer ${
                  viewMode === 'board'
                    ? 'bg-[#FFFFFF] text-[#0F172A] border border-[#E2E8F0]'
                    : 'text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                Board
              </button>
              <button
                type="button"
                onClick={() => {
                  sfx.playClick();
                  setViewMode('list');
                }}
                className={`px-3 py-1 rounded-[4px] text-[13px] font-medium transition-colors cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-[#FFFFFF] text-[#0F172A] border border-[#E2E8F0]'
                    : 'text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                List
              </button>
            </div>
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-[13px]">
          {/* Pillar Filters */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[#64748B] text-xs font-medium mr-1">Pillar:</span>
            {[
              { id: 'ALL', label: 'All' },
              { id: 'STR', label: 'Strength' },
              { id: 'INT', label: 'Intellect' },
              { id: 'WIS', label: 'Wisdom' },
              { id: 'CHA', label: 'Charisma' },
            ].map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  sfx.playClick();
                  setPillarFilter(id as AttributeType | 'ALL');
                }}
                className={`px-2.5 py-1 rounded-[6px] border text-xs transition-colors cursor-pointer ${
                  pillarFilter === id
                    ? 'bg-[#FFFFFF] border-[#0F172A] text-[#0F172A] font-medium'
                    : 'bg-[#FFFFFF] border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A]'
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
              onChange={(val) => setDueFilter(val as 'ALL' | 'OVERDUE' | 'THIS_WEEK' | 'NO_DATE')}
              buttonClassName="py-1 px-3 text-xs"
            />
          </div>
        </div>
      </div>

      {/* Inline Evidence Required Warning Banner */}
      {evidenceWarningId && (
        <div className="p-3.5 rounded-[6px] bg-[#F8FAFC] border border-[#E11D48]/30 flex items-center justify-between text-[#E11D48]">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-5 h-5 flex-shrink-0" />
            <div className="text-xs">
              <strong className="font-medium block">Evidence Required Before Completion</strong>
              This task mandates verified proof. Please attach a note, link, or photo before moving it to Done.
            </div>
          </div>
          <button
            onClick={() => setEvidenceWarningId(null)}
            className="p-1 rounded-[4px] hover:bg-black/5"
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
                className="flex flex-col bg-[#F8FAFC] rounded-[6px] border border-[#E2E8F0] p-4 min-h-[460px] transition-colors"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#E2E8F0]">
                  <div>
                    <h3 className="font-serif text-[16px] font-normal text-[#0F172A]">{col.title}</h3>
                    <span className="text-[11px] text-[#64748B]">{col.desc}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-[4px] text-[11px] tabular-nums font-medium bg-[#FFFFFF] border border-[#E2E8F0] text-[#64748B]">
                    {columnQuests.length}
                  </span>
                </div>

                {/* Quests Container */}
                <div className="flex-1 space-y-3">
                  {columnQuests.length === 0 ? (
                    <div className="h-40 flex flex-col items-center justify-center text-center p-4 border border-dashed border-[#E2E8F0] rounded-[6px] text-[#64748B]">
                      <span className="text-xs">No tasks in {col.title}</span>
                    </div>
                  ) : (
                    columnQuests.map((quest) => {
                      const theme = PILLAR_THEMES[quest.pillar];
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
                          className={`bg-[#FFFFFF] border border-[#E2E8F0] rounded-[6px] p-3.5 hover:border-[#0F172A] cursor-grab active:cursor-grabbing transition-colors ${
                            quest.status === 'done' ? 'opacity-85' : ''
                          }`}
                        >
                          {/* Tags row */}
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {/* Pillar Pill */}
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-[4px] text-[11px] font-medium border ${theme.bg} ${theme.border} ${theme.text}`}
                              >
                                {ATTRIBUTE_NAMES[quest.pillar]}
                              </span>

                              {/* Difficulty Pill */}
                              <span className="px-2 py-0.5 rounded-[4px] text-[11px] tabular-nums font-medium bg-[#F1F5F9] text-[#64748B] border border-[#E2E8F0]">
                                {quest.difficulty} (+{xpValue} XP)
                              </span>
                            </div>

                            {/* Completed Status Checkmark */}
                            {quest.status === 'done' && (
                              <CheckCircle2 className="w-4 h-4 text-[#059669] flex-shrink-0" />
                            )}
                          </div>

                          {/* Title & Description */}
                          <h4 className="text-[14px] font-medium text-[#0F172A] leading-snug mb-1">
                            {quest.title}
                          </h4>
                          {quest.description && (
                            <p className="text-[12px] text-[#64748B] line-clamp-2 leading-relaxed mb-3">
                              {quest.description}
                            </p>
                          )}

                          {/* Footer Meta Row: Due date, Evidence, Linked Item */}
                          <div className="pt-2 border-t border-[#E2E8F0] flex items-center justify-between gap-2 text-[11px] tabular-nums">
                            {/* Due Date */}
                            <div className="flex items-center gap-1">
                              {quest.dueDate ? (
                                <span
                                  className={`font-medium ${
                                    isOverdue ? 'text-[#E11D48]' : 'text-[#64748B]'
                                  }`}
                                >
                                  {isOverdue ? `Overdue: ${quest.dueDate}` : `Due: ${quest.dueDate}`}
                                </span>
                              ) : (
                                <span className="text-[#64748B]/60">No date</span>
                              )}
                            </div>

                            {/* Evidence / Linked item indicators */}
                            <div className="flex items-center gap-2">
                              {quest.evidenceRequired && (
                                <span
                                  className={`px-1.5 py-0.5 rounded-[4px] text-[10px] font-medium border ${
                                    questEvidenceCount > 0
                                      ? 'bg-[#F8FAFC] text-[#059669] border-[#059669]/30'
                                      : 'bg-[#F8FAFC] text-[#E11D48] border-[#E11D48]/30'
                                  }`}
                                >
                                  Evidence: {questEvidenceCount}
                                </span>
                              )}

                              {linkedItem && (
                                <div
                                  className="w-5 h-5 rounded-[4px] border border-[#E2E8F0] bg-[#F1F5F9] flex items-center justify-center overflow-hidden shrink-0"
                                  title={`Linked to: ${linkedItem.name}`}
                                >
                                  {linkedItem.imageUrl ? (
                                    <img
                                      src={linkedItem.imageUrl}
                                      alt={linkedItem.name}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <span className="font-serif text-[10px] font-medium text-[#0F172A]">
                                      {(linkedItem.name || '?')[0].toUpperCase()}
                                    </span>
                                  )}
                                </div>
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
        <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-[6px] overflow-hidden">
          {filteredQuests.length === 0 ? (
            <div className="p-12 text-center text-[#64748B] space-y-1">
              <div className="font-serif text-[18px] text-[#0F172A]">No matching tasks found</div>
              <p className="text-[13px] text-[#64748B]">Try adjusting your search or active filters.</p>
            </div>
          ) : (
            <div className="divide-y divide-[#E2E8F0]">
              {filteredQuests.map((quest) => {
                const theme = PILLAR_THEMES[quest.pillar];
                const isOverdue = isQuestOverdue(quest);
                const questEvidenceCount = evidence.filter((e) => e.questId === quest.id).length;
                const linkedItem = items.find((i) => i.id === quest.linkedItemId);

                return (
                  <div
                    key={quest.id}
                    className={`p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#F8FAFC]/60 transition-colors ${
                      quest.status === 'done' ? 'bg-[#F8FAFC]/30' : ''
                    }`}
                  >
                    {/* Left: Checkbox + Title + Description */}
                    <div className="flex items-start gap-3 min-w-0">
                      <button
                        type="button"
                        onClick={() => handleToggleDone(quest)}
                        className={`mt-0.5 w-5 h-5 rounded-[4px] border flex items-center justify-center transition-colors flex-shrink-0 cursor-pointer ${
                          quest.status === 'done'
                            ? 'bg-[#0F172A] border-[#0F172A] text-[#FFFFFF]'
                            : 'bg-[#FFFFFF] border-[#E2E8F0] text-transparent hover:border-[#0F172A]'
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
                        <h4
                          className={`text-[14px] font-medium truncate ${
                            quest.status === 'done'
                              ? 'line-through text-[#64748B]'
                              : 'text-[#0F172A]'
                          }`}
                        >
                          {quest.title}
                        </h4>
                        {quest.description && (
                          <p className="text-[12px] text-[#64748B] truncate max-w-xl mt-0.5">
                            {quest.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Right: Badges + Due Date + Detail Button */}
                    <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-center">
                      {/* Pillar */}
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-[4px] text-[11px] font-medium border ${theme.bg} ${theme.border} ${theme.text}`}
                      >
                        {quest.pillar}
                      </span>

                      {/* Difficulty */}
                      <span className="px-2 py-0.5 rounded-[4px] text-[11px] font-medium bg-[#F1F5F9] text-[#64748B] border border-[#E2E8F0]">
                        {quest.difficulty}
                      </span>

                      {/* Due Date */}
                      <span
                        className={`text-[12px] tabular-nums font-medium px-2 py-0.5 rounded-[4px] ${
                          isOverdue
                            ? 'bg-[#F8FAFC] text-[#E11D48] border border-[#E11D48]/30'
                            : 'text-[#64748B]'
                        }`}
                      >
                        {quest.dueDate || 'No date'}
                      </span>

                      {/* Evidence Pill */}
                      {quest.evidenceRequired && (
                        <span
                          className={`text-[11px] font-medium px-2 py-0.5 rounded-[4px] border ${
                            questEvidenceCount > 0
                              ? 'bg-[#F8FAFC] text-[#059669] border-[#059669]/30'
                              : 'bg-[#F8FAFC] text-[#E11D48] border-[#E11D48]/30'
                          }`}
                        >
                          Evidence: {questEvidenceCount}
                        </span>
                      )}

                      {/* Linked Item Thumbnail */}
                      {linkedItem && (
                        <div
                          className="w-5 h-5 rounded-[4px] border border-[#E2E8F0] bg-[#F1F5F9] flex items-center justify-center overflow-hidden shrink-0"
                          title={`Linked to: ${linkedItem.name}`}
                        >
                          {linkedItem.imageUrl ? (
                            <img
                              src={linkedItem.imageUrl}
                              alt={linkedItem.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="font-serif text-[10px] font-medium text-[#0F172A]">
                              {(linkedItem.name || '?')[0].toUpperCase()}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Inspect / Edit */}
                      <button
                        type="button"
                        onClick={() => {
                          sfx.playClick();
                          setSelectedQuest(quest);
                        }}
                        className="editorial-btn-secondary py-1 px-2.5 text-[12px]"
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
            className="w-full max-w-2xl bg-[#FFFFFF] border border-[#E2E8F0] rounded-[6px] overflow-hidden max-h-[90vh] flex flex-col cursor-default"
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0]">
              <div>
                <h3 className="font-serif text-[20px] font-normal text-[#0F172A]">Task Details</h3>
                <p className="text-[12px] text-[#64748B] tabular-nums mt-0.5">
                  Created {selectedQuest.createdAt} · Worth +{getQuestXp(selectedQuest.difficulty)} {ATTRIBUTE_NAMES[selectedQuest.pillar]} XP
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedQuest(null)}
                className="p-1 rounded-[4px] text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer Scrollable Content */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              {/* Title & Description */}
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-medium uppercase tracking-wider text-[#64748B] mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={selectedQuest.title}
                    onChange={(e) => {
                      const updated = { ...selectedQuest, title: e.target.value };
                      setSelectedQuest(updated);
                      onUpdateQuest(updated);
                    }}
                    className="ship-input w-full px-3 py-2 text-[14px] font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium uppercase tracking-wider text-[#64748B] mb-1">
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
                    className="ship-input w-full px-3 py-2 text-[13px]"
                    placeholder="Context or instructions for this mission..."
                  />
                </div>
              </div>

              {/* Status, Pillar, Difficulty & Due Date Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-[#F8FAFC] rounded-[6px] border border-[#E2E8F0]">
                {/* Status */}
                <div>
                  <label className="block text-[11px] font-medium uppercase tracking-wider text-[#64748B] mb-1">
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
                        onReopenQuest(selectedQuest, nextStatus);
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
                  <label className="block text-[11px] font-medium uppercase tracking-wider text-[#64748B] mb-1">
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
                  <label className="block text-[11px] font-medium uppercase tracking-wider text-[#64748B] mb-1">
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
                  <label className="block text-[11px] font-medium uppercase tracking-wider text-[#64748B] mb-1">
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
                    className="ship-input w-full px-2.5 py-1 text-xs font-medium"
                  />
                </div>
              </div>

              {/* Evidence Required Toggle & Linked Item Picker */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Evidence Required */}
                <div className="p-3.5 rounded-[6px] border border-[#E2E8F0] bg-[#FFFFFF] flex items-center justify-between">
                  <div>
                    <span className="text-[13px] font-medium text-[#0F172A] block">
                      Require Evidence
                    </span>
                    <span className="text-[11px] text-[#64748B]">
                      Blocks completion until proof is attached
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={selectedQuest.evidenceRequired}
                    onChange={(e) => {
                      const updated = { ...selectedQuest, evidenceRequired: e.target.checked };
                      setSelectedQuest(updated);
                      onUpdateQuest(updated);
                    }}
                    className="w-4 h-4 rounded-[3px] accent-[#0F172A] cursor-pointer"
                  />
                </div>

                {/* Linked Item Picker */}
                <div className="p-3.5 rounded-[6px] border border-[#E2E8F0] bg-[#FFFFFF]">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[13px] font-medium text-[#0F172A]">
                      Linked Possession (Optional)
                    </label>
                    {selectedQuest.linkedItemId && (() => {
                      const linked = items.find((i) => i.id === selectedQuest.linkedItemId);
                      if (!linked) return null;
                      return (
                        <div
                          className="w-5 h-5 rounded-[4px] border border-[#E2E8F0] bg-[#F1F5F9] flex items-center justify-center overflow-hidden shrink-0"
                          title={`Linked to: ${linked.name}`}
                        >
                          {linked.imageUrl ? (
                            <img src={linked.imageUrl} alt={linked.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="font-serif text-[10px] font-medium text-[#0F172A]">
                              {(linked.name || '?')[0].toUpperCase()}
                            </span>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                  <CustomSelect
                    value={selectedQuest.linkedItemId || ''}
                    options={[
                      { id: '', label: 'None' },
                      ...items.map((i) => ({
                        id: i.id,
                        label: `${i.ownershipStatus === 'wishlist' ? '[Wishlist] ' : ''}${i.name}`,
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
                  <h4 className="font-serif text-[16px] font-normal text-[#0F172A]">
                    Evidence & Verification Proofs ({selectedEvidence.length})
                  </h4>
                </div>

                {/* Existing Evidence List */}
                {selectedEvidence.length === 0 ? (
                  <div className="p-4 rounded-[6px] bg-[#F8FAFC] border border-dashed border-[#E2E8F0] text-center text-xs text-[#64748B] mb-4">
                    No evidence attached yet. Add a note, URL, or upload photo proof below.
                  </div>
                ) : (
                  <div className="space-y-2 mb-4">
                    {selectedEvidence.map((ev) => (
                      <div
                        key={ev.id}
                        className="p-3 rounded-[6px] border border-[#E2E8F0] bg-[#F8FAFC] flex items-start justify-between gap-3 text-xs"
                      >
                        <div className="min-w-0">
                          {ev.type === 'photo' ? (
                            <img
                              src={ev.content}
                              alt="Proof"
                              className="w-32 h-20 object-cover rounded-[4px] border border-[#E2E8F0] mt-1"
                            />
                          ) : ev.type === 'link' ? (
                            <a
                              href={ev.content}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[#0F172A] underline font-medium break-all flex items-center gap-1"
                            >
                              {ev.content} <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <p className="text-[#0F172A] whitespace-pre-wrap">{ev.content}</p>
                          )}
                          <span className="text-[10px] text-[#64748B] mt-1 block">
                            Attached on {ev.addedAt}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => onDeleteEvidence(ev.id)}
                          className="p-1 rounded-[4px] text-[#64748B] hover:text-[#E11D48] transition-colors"
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
                  className="p-4 rounded-[6px] border border-[#E2E8F0] bg-[#FFFFFF] space-y-3"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-[#0F172A]">Add Verification Proof</span>
                    <div className="flex items-center gap-1 bg-[#F1F5F9] p-0.5 rounded-[4px]">
                      <button
                        type="button"
                        onClick={() => setEvidenceType('note')}
                        className={`px-2 py-0.5 rounded-[3px] text-[11px] font-medium transition-colors ${
                          evidenceType === 'note' ? 'bg-[#FFFFFF] text-[#0F172A] border border-[#E2E8F0]' : 'text-[#64748B]'
                        }`}
                      >
                        Note
                      </button>
                      <button
                        type="button"
                        onClick={() => setEvidenceType('link')}
                        className={`px-2 py-0.5 rounded-[3px] text-[11px] font-medium transition-colors ${
                          evidenceType === 'link' ? 'bg-[#FFFFFF] text-[#0F172A] border border-[#E2E8F0]' : 'text-[#64748B]'
                        }`}
                      >
                        URL
                      </button>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-2 py-0.5 rounded-[3px] text-[11px] font-medium text-[#0F172A] hover:bg-[#FFFFFF] transition-colors"
                      >
                        Upload Photo
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
                      placeholder="Write evidence note, workout stats, or reflection..."
                      className="ship-input w-full px-3 py-1.5 text-xs"
                    />
                  ) : (
                    <input
                      type="url"
                      value={evidenceContent}
                      onChange={(e) => setEvidenceContent(e.target.value)}
                      placeholder="https://... URL proof"
                      className="ship-input w-full px-3 py-1.5 text-xs"
                    />
                  )}

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={!evidenceContent.trim()}
                      className="editorial-btn-primary py-1 px-3 text-xs"
                    >
                      Attach Proof
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-4 border-t border-[#E2E8F0] bg-[#FFFFFF] flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Archive quest "${selectedQuest.title}"?`)) {
                    onDeleteQuest(selectedQuest.id);
                    setSelectedQuest(null);
                    sfx.playClick();
                  }
                }}
                className="editorial-btn-secondary text-[#E11D48] hover:bg-[#F8FAFC]"
              >
                Archive Task
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedQuest(null)}
                  className="editorial-btn-secondary"
                >
                  Close
                </button>
                {selectedQuest.status !== 'done' ? (
                  <button
                    type="button"
                    onClick={() => {
                      handleToggleDone(selectedQuest);
                      setSelectedQuest(null);
                    }}
                    className="editorial-btn-primary"
                  >
                    Complete Task (+{getQuestXp(selectedQuest.difficulty)} XP)
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      handleToggleDone(selectedQuest);
                      setSelectedQuest(null);
                    }}
                    className="editorial-btn-secondary"
                  >
                    Reopen Task
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
            className="w-full max-w-lg bg-[#FFFFFF] border border-[#E2E8F0] rounded-[6px] p-6 cursor-default"
          >
            <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0] mb-4">
              <div>
                <h3 className="font-serif text-[20px] font-normal text-[#0F172A]">Create Task</h3>
                <p className="text-[12px] text-[#64748B] mt-0.5">
                  Define an objective, set difficulty tier, and earn pillar XP
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseAdd}
                className="p-1 rounded-[4px] text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateQuest} className="space-y-4">
              <div>
                <label className="block text-[11px] font-medium uppercase tracking-wider text-[#64748B] mb-1">
                  Task Title
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Clean 75kg Benchpress, Refactor Storage Schema..."
                  className="ship-input w-full px-3 py-2 text-[14px]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium uppercase tracking-wider text-[#64748B] mb-1">
                  Description
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
                  <label className="block text-[11px] font-medium uppercase tracking-wider text-[#64748B] mb-1">
                    Target Pillar
                  </label>
                  <CustomSelect
                    value={newPillar}
                    options={QUEST_PILLAR_OPTIONS}
                    onChange={(val) => setNewPillar(val as AttributeType)}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium uppercase tracking-wider text-[#64748B] mb-1">
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
                  <label className="block text-[11px] font-medium uppercase tracking-wider text-[#64748B] mb-1">
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
                  <label className="block text-[11px] font-medium uppercase tracking-wider text-[#64748B] mb-1">
                    Linked Possession (Optional)
                  </label>
                  <CustomSelect
                    value={newLinkedItemId}
                    options={[
                      { id: '', label: 'None' },
                      ...items.map((i) => ({
                        id: i.id,
                        label: `${i.ownershipStatus === 'wishlist' ? '[Wishlist] ' : ''}${i.name}`,
                        sublabel: i.ownershipStatus === 'wishlist' ? 'Wishlist Milestone' : 'Owned Item',
                      })),
                    ]}
                    onChange={(val) => setNewLinkedItemId(val)}
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-[6px] border border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between">
                <div>
                  <span className="text-[13px] font-medium text-[#0F172A] block">
                    Require Evidence Proof
                  </span>
                  <span className="text-[11px] text-[#64748B]">
                    Must attach note, link, or photo before completion
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={newEvidenceReq}
                  onChange={(e) => setNewEvidenceReq(e.target.checked)}
                  className="w-4 h-4 rounded-[3px] accent-[#0F172A] cursor-pointer"
                />
              </div>

              <div className="pt-4 border-t border-[#E2E8F0] flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={handleCloseAdd}
                  className="editorial-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="editorial-btn-primary"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
