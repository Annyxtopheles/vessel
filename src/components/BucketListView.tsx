import React, { useState } from 'react';
import type { BucketListEntry, BucketListStatus, AttributeType, XpEvent } from '../types';
import { ATTRIBUTE_NAMES } from '../types';
import { Check, Trash2, ArrowUpRight, X } from 'lucide-react';
import { sfx } from '../utils/audio';
import { getTodayLocalDateStr } from '../utils/date';
import { CustomSelect } from './CustomSelect';

interface BucketListViewProps {
  entries: BucketListEntry[];
  onAddEntry: (entry: Omit<BucketListEntry, 'id' | 'created_at'>) => void;
  onUpdateEntry: (entry: BucketListEntry) => void;
  onDeleteEntry: (id: string) => void;
  onPromoteToTask: (entry: BucketListEntry) => void;
  onRecordXpEvent?: (event: Omit<XpEvent, 'id'>) => void;
  onNavigateToTasks?: () => void;
}

const DEFAULT_CATEGORIES = ['Spiritual', 'Travel', 'Mastery', 'Craft', 'Health', 'Life'];

const PILLAR_OPTIONS: { id: string; label: string }[] = [
  { id: 'NONE', label: 'None (No XP)' },
  { id: 'STR', label: 'Strength (STR)' },
  { id: 'INT', label: 'Intellect (INT)' },
  { id: 'WIS', label: 'Wisdom (WIS)' },
  { id: 'CHA', label: 'Charisma (CHA)' },
];

const STATUS_OPTIONS: { id: BucketListStatus | 'ALL'; label: string }[] = [
  { id: 'ALL', label: 'All Entries' },
  { id: 'planned', label: 'Planned' },
  { id: 'someday', label: 'Someday' },
  { id: 'done', label: 'Done' },
];

const PILLAR_BADGES: Record<AttributeType, string> = {
  STR: 'text-[#9C3D2A] bg-[#F6F2EA] border-[#9C3D2A]/30',
  INT: 'text-[#2D4A6B] bg-[#F6F2EA] border-[#2D4A6B]/30',
  WIS: 'text-[#7A5C1E] bg-[#F6F2EA] border-[#7A5C1E]/30',
  CHA: 'text-[#3F6B4F] bg-[#F6F2EA] border-[#3F6B4F]/30',
};

export const BucketListView: React.FC<BucketListViewProps> = ({
  entries,
  onAddEntry,
  onUpdateEntry,
  onDeleteEntry,
  onPromoteToTask,
  onRecordXpEvent,
  onNavigateToTasks,
}) => {
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<BucketListStatus | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Quick Add Form States
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Travel');
  const [customCategory, setCustomCategory] = useState('');
  const [pillar, setPillar] = useState<AttributeType | 'NONE'>('NONE');
  const [status, setStatus] = useState<BucketListStatus>('someday');
  const [notes, setNotes] = useState('');
  const [isExpandedAdd, setIsExpandedAdd] = useState(false);

  // Edit / Evidence modal states
  const [editingEntry, setEditingEntry] = useState<BucketListEntry | null>(null);
  const [editNotes, setEditNotes] = useState('');
  const [editEvidence, setEditEvidence] = useState('');

  const todayStr = getTodayLocalDateStr();

  // Dynamic Categories from entries + defaults
  const allCategories = Array.from(
    new Set([...DEFAULT_CATEGORIES, ...entries.map((e) => e.category).filter(Boolean)])
  );

  // Filtered entries
  const activeEntries = entries.filter((e) => !e.deleted_at && !(e as any).deletedAt);

  const filteredEntries = activeEntries.filter((item) => {
    if (categoryFilter !== 'ALL' && item.category !== categoryFilter) return false;
    if (statusFilter !== 'ALL' && item.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchNotes = (item.notes || '').toLowerCase().includes(q);
      const matchCat = item.category.toLowerCase().includes(q);
      if (!matchTitle && !matchNotes && !matchCat) return false;
    }
    return true;
  });

  const doneCount = activeEntries.filter((e) => e.status === 'done').length;
  const plannedCount = activeEntries.filter((e) => e.status === 'planned').length;
  const somedayCount = activeEntries.filter((e) => e.status === 'someday').length;

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const finalCategory = customCategory.trim() || category;

    onAddEntry({
      title: title.trim(),
      category: finalCategory,
      notes: notes.trim() || undefined,
      status,
      pillar: pillar === 'NONE' ? undefined : pillar,
    });

    setTitle('');
    setCustomCategory('');
    setNotes('');
    setIsExpandedAdd(false);
    sfx.playClick();
  };

  const handleToggleDone = (entry: BucketListEntry) => {
    sfx.playClick();
    const isDone = entry.status === 'done';

    if (isDone) {
      // Revert to planned
      onUpdateEntry({
        ...entry,
        status: 'planned',
        done_at: undefined,
      });
    } else {
      // Complete
      const doneAt = new Date().toISOString();
      onUpdateEntry({
        ...entry,
        status: 'done',
        done_at: doneAt,
      });

      // Write XP event ONLY if pillar is set
      if (entry.pillar && onRecordXpEvent) {
        onRecordXpEvent({
          action: `Bucket List: ${entry.title}`,
          pillar: entry.pillar,
          points: 150,
          date: todayStr,
          refId: entry.id,
        });
        sfx.playRunicHarmonic();
      } else {
        sfx.playEquip();
      }
    }
  };

  const handleOpenEdit = (entry: BucketListEntry) => {
    setEditingEntry(entry);
    setEditNotes(entry.notes || '');
    setEditEvidence(entry.evidence || '');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEntry) return;

    onUpdateEntry({
      ...editingEntry,
      notes: editNotes.trim() || undefined,
      evidence: editEvidence.trim() || undefined,
    });

    setEditingEntry(null);
    sfx.playClick();
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Toolbar & Counts */}
      <div className="pb-4 border-b border-[#E4DED2] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-serif text-[24px] font-normal text-[#1F1B16]">
            Bucket List
          </h2>
          <p className="text-[13px] text-[#6B645A] mt-0.5">
            Aspirational milestones, lifelong explorations, and deep pursuits without artificial due dates.
          </p>
        </div>

        <div className="flex items-center gap-2 text-[12px] tabular-nums">
          <span className="px-2 py-0.5 rounded-[4px] bg-[#EFEAE0] text-[#6B645A] border border-[#E4DED2]">
            {doneCount} completed
          </span>
          <span className="px-2 py-0.5 rounded-[4px] bg-[#EFEAE0] text-[#6B645A] border border-[#E4DED2]">
            {plannedCount} planned
          </span>
          <span className="px-2 py-0.5 rounded-[4px] bg-[#EFEAE0] text-[#6B645A] border border-[#E4DED2]">
            {somedayCount} someday
          </span>
        </div>
      </div>

      {/* 2. Quick Add Bar */}
      <form onSubmit={handleQuickAdd} className="bg-[#FBF9F4] border border-[#E4DED2] rounded-[6px] p-4 space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Add a life pursuit... (e.g. Hike Annapurna, Publish book, Learn Japanese)"
            className="ship-input flex-1 text-[14px] font-serif"
          />

          <div className="w-full sm:w-36">
            <CustomSelect
              value={category}
              options={allCategories.map((c) => ({ id: c, label: c }))}
              onChange={(val) => setCategory(val)}
              buttonClassName="py-1.5 text-[13px]"
            />
          </div>

          <div className="w-full sm:w-40">
            <CustomSelect
              value={pillar}
              options={PILLAR_OPTIONS}
              onChange={(val) => setPillar(val as AttributeType | 'NONE')}
              buttonClassName="py-1.5 text-[13px]"
            />
          </div>

          <button
            type="submit"
            className="editorial-btn-primary self-stretch sm:self-auto"
          >
            Add Entry
          </button>
        </div>

        {/* Expand for Notes & Category Customization */}
        <div className="flex items-center justify-between text-[12px]">
          <button
            type="button"
            onClick={() => setIsExpandedAdd(!isExpandedAdd)}
            className="text-[#6B645A] hover:text-[#1F1B16] underline cursor-pointer transition-colors"
          >
            {isExpandedAdd ? 'Fewer details' : '+ Add notes, custom category, or initial status'}
          </button>

          <span className="text-[11px] text-[#6B645A]">
            Completing an entry earns +150 XP if an attribute pillar is assigned.
          </span>
        </div>

        {isExpandedAdd && (
          <div className="pt-2 border-t border-[#E4DED2] grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1">
              <label className="text-[12px] font-medium text-[#6B645A]">Notes or Vision</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Key details, equipment needed, prerequisites, or why this matters..."
                className="w-full p-2 bg-[#F6F2EA] border border-[#E4DED2] rounded-[4px] text-[13px] text-[#1F1B16] focus:outline-none focus:border-[#1F1B16] resize-none"
              />
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[12px] font-medium text-[#6B645A] block mb-1">Status</label>
                <div className="flex items-center gap-2">
                  {(['someday', 'planned'] as BucketListStatus[]).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setStatus(st)}
                      className={`px-3 py-1 rounded-[4px] border text-[12px] capitalize transition-colors cursor-pointer ${
                        status === st
                          ? 'bg-[#1F1B16] text-[#FBF9F4] border-[#1F1B16]'
                          : 'bg-[#F6F2EA] text-[#6B645A] border-[#E4DED2] hover:text-[#1F1B16]'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[12px] font-medium text-[#6B645A] block mb-1">Or Custom Category</label>
                <input
                  type="text"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="e.g. Architecture, Culinary..."
                  className="w-full px-2 py-1 bg-[#F6F2EA] border border-[#E4DED2] rounded-[4px] text-[12px] text-[#1F1B16] focus:outline-none focus:border-[#1F1B16]"
                />
              </div>
            </div>
          </div>
        )}
      </form>

      {/* 3. Category & Status Filter Tabs */}
      <div className="space-y-3">
        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[13px]">
          <span className="text-[#6B645A] text-xs font-medium mr-1 shrink-0">Category:</span>
          <button
            type="button"
            onClick={() => setCategoryFilter('ALL')}
            className={`px-3 py-1 rounded-[4px] text-xs transition-colors shrink-0 cursor-pointer ${
              categoryFilter === 'ALL'
                ? 'bg-[#1F1B16] text-[#FBF9F4]'
                : 'bg-[#FBF9F4] text-[#6B645A] border border-[#E4DED2] hover:text-[#1F1B16]'
            }`}
          >
            All
          </button>
          {allCategories.map((cat) => {
            const count = activeEntries.filter((e) => e.category === cat).length;
            if (count === 0 && cat !== 'Travel') return null;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1 rounded-[4px] text-xs transition-colors shrink-0 cursor-pointer flex items-center gap-1.5 ${
                  categoryFilter === cat
                    ? 'bg-[#1F1B16] text-[#FBF9F4]'
                    : 'bg-[#FBF9F4] text-[#6B645A] border border-[#E4DED2] hover:text-[#1F1B16]'
                }`}
              >
                <span>{cat}</span>
                <span className="text-[10px] opacity-75 tabular-nums">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Status Filters & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-[13px]">
          <div className="inline-flex p-0.5 bg-[#EFEAE0] rounded-[6px] border border-[#E4DED2]">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  sfx.playClick();
                  setStatusFilter(opt.id);
                }}
                className={`px-3 py-1 rounded-[4px] text-[12px] font-medium transition-colors cursor-pointer ${
                  statusFilter === opt.id
                    ? 'bg-[#FBF9F4] text-[#1F1B16] border border-[#E4DED2]'
                    : 'text-[#6B645A] hover:text-[#1F1B16]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="w-full sm:w-64">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter bucket list entries..."
              className="w-full px-3 py-1.5 bg-[#FBF9F4] border border-[#E4DED2] rounded-[6px] text-[13px] text-[#1F1B16] placeholder:text-[#6B645A]/60 focus:outline-none focus:border-[#1F1B16]"
            />
          </div>
        </div>
      </div>

      {/* 4. List View */}
      <div className="space-y-2">
        {filteredEntries.length === 0 ? (
          <div className="py-12 text-center text-[#6B645A] bg-[#FBF9F4] border border-[#E4DED2] rounded-[6px]">
            <p className="font-serif text-[17px] text-[#1F1B16]">No entries match your filter</p>
            <p className="text-[13px] mt-1">Add a new pursuit or switch the category/status filter above.</p>
          </div>
        ) : (
          filteredEntries.map((entry) => {
            const isDone = entry.status === 'done';

            return (
              <div
                key={entry.id}
                className={`group p-4 rounded-[6px] border transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isDone
                    ? 'bg-[#FBF9F4] border-[#E4DED2] opacity-75'
                    : 'bg-[#FBF9F4] border-[#E4DED2] hover:border-[#1F1B16]'
                }`}
              >
                {/* Left: Checkbox + Content */}
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  {/* Checkbox */}
                  <button
                    type="button"
                    onClick={() => handleToggleDone(entry)}
                    className={`mt-0.5 w-5 h-5 rounded-[4px] border flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                      isDone
                        ? 'bg-[#1F1B16] border-[#1F1B16] text-[#FBF9F4]'
                        : 'bg-[#FBF9F4] border-[#E4DED2] text-transparent hover:border-[#1F1B16]'
                    }`}
                    title={isDone ? 'Mark as incomplete' : 'Mark as done'}
                  >
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  </button>

                  <div className="min-w-0 space-y-1 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`font-serif text-[16px] leading-snug transition-colors ${
                          isDone
                            ? 'line-through text-[#6B645A]'
                            : 'text-[#1F1B16] font-medium'
                        }`}
                      >
                        {entry.title}
                      </span>

                      {/* Category Badge */}
                      <span className="px-1.5 py-0.5 rounded-[4px] text-[10px] font-medium bg-[#EFEAE0] text-[#6B645A] border border-[#E4DED2]">
                        {entry.category}
                      </span>

                      {/* Pillar Badge if set */}
                      {entry.pillar && (
                        <span
                          className={`px-1.5 py-0.5 rounded-[4px] text-[10px] font-medium border ${PILLAR_BADGES[entry.pillar]}`}
                          title={`Assigned to ${ATTRIBUTE_NAMES[entry.pillar]} (+150 XP on completion)`}
                        >
                          {entry.pillar} • +150 XP
                        </span>
                      )}

                      {/* Status Badge */}
                      <span
                        className={`px-1.5 py-0.5 rounded-[4px] text-[10px] uppercase tracking-wider font-medium border ${
                          entry.status === 'done'
                            ? 'bg-[#3F6B4F]/10 text-[#3F6B4F] border-[#3F6B4F]/30'
                            : entry.status === 'planned'
                            ? 'bg-[#2D4A6B]/10 text-[#2D4A6B] border-[#2D4A6B]/30'
                            : 'bg-[#EFEAE0] text-[#6B645A] border-[#E4DED2]'
                        }`}
                      >
                        {entry.status}
                      </span>

                      {/* Promoted to Task Indicator */}
                      {entry.promotedTaskId && (
                        <button
                          type="button"
                          onClick={() => {
                            if (onNavigateToTasks) onNavigateToTasks();
                          }}
                          className="px-1.5 py-0.5 rounded-[4px] text-[10px] font-medium bg-[#EFEAE0] hover:bg-[#E4DED2] text-[#1F1B16] border border-[#E4DED2] inline-flex items-center gap-1 transition-colors cursor-pointer"
                          title="View linked task"
                        >
                          <span>Linked Task</span>
                          <ArrowUpRight className="w-2.5 h-2.5" />
                        </button>
                      )}
                    </div>

                    {/* Notes */}
                    {entry.notes && (
                      <p className="text-[13px] text-[#6B645A] leading-relaxed line-clamp-2">
                        {entry.notes}
                      </p>
                    )}

                    {/* Evidence if logged */}
                    {entry.evidence && (
                      <div className="text-[12px] text-[#1F1B16] bg-[#F6F2EA] px-2 py-1 rounded-[4px] border border-[#E4DED2] inline-block mt-1">
                        <span className="text-[#6B645A] mr-1.5 font-medium">Proof:</span>
                        <span>{entry.evidence}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  {/* Promote to Task Action */}
                  {!isDone && (
                    <button
                      type="button"
                      onClick={() => {
                        sfx.playClick();
                        onPromoteToTask(entry);
                      }}
                      className="editorial-btn-secondary py-1 px-2.5 text-[12px]"
                      title="Create an active Task linked to this pursuit"
                    >
                      Promote to task
                    </button>
                  )}

                  {/* Edit / Evidence */}
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(entry)}
                    className="editorial-btn-secondary py-1 px-2 text-[12px]"
                  >
                    Edit
                  </button>

                  {/* Delete */}
                  <button
                    type="button"
                    onClick={() => {
                      sfx.playClick();
                      onDeleteEntry(entry.id);
                    }}
                    className="p-1.5 text-[#6B645A]/40 group-hover:text-[#6B645A] hover:text-[#9C3D2A] transition-colors cursor-pointer"
                    title="Delete pursuit"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 5. Edit Modal */}
      {editingEntry && (
        <div
          onClick={() => setEditingEntry(null)}
          className="fixed inset-0 z-50 bg-[#1F1B16]/30 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-[#FBF9F4] border border-[#E4DED2] rounded-[6px] p-6 cursor-default animate-in fade-in zoom-in-95 space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#E4DED2]">
              <div>
                <h3 className="font-serif text-[18px] font-normal text-[#1F1B16]">
                  Edit Pursuit: {editingEntry.title}
                </h3>
                <span className="text-[12px] text-[#6B645A]">
                  Category: {editingEntry.category} • Status: {editingEntry.status}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setEditingEntry(null)}
                className="p-1 text-[#6B645A] hover:text-[#1F1B16] rounded-[4px]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-[13px] font-medium text-[#1F1B16] mb-1">
                  Notes & Details
                </label>
                <textarea
                  rows={3}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Notes, reflections, or preparation steps..."
                  className="w-full p-2.5 bg-[#F6F2EA] border border-[#E4DED2] rounded-[4px] text-[13px] text-[#1F1B16] focus:outline-none focus:border-[#1F1B16] resize-none"
                />
              </div>

              <div>
                <label className="block text-[13px] font-medium text-[#1F1B16] mb-1">
                  Evidence / Verification Proof (URL or note)
                </label>
                <input
                  type="text"
                  value={editEvidence}
                  onChange={(e) => setEditEvidence(e.target.value)}
                  placeholder="Link to photos, certification, flight ticket, or personal journal entry"
                  className="w-full p-2 bg-[#F6F2EA] border border-[#E4DED2] rounded-[4px] text-[13px] text-[#1F1B16] focus:outline-none focus:border-[#1F1B16]"
                />
              </div>

              <div className="pt-3 border-t border-[#E4DED2] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingEntry(null)}
                  className="editorial-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="editorial-btn-primary"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
