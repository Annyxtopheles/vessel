import React, { useState } from 'react';
import type { Reminder } from '../types';
import { Pin, Trash2, GripVertical } from 'lucide-react';
import { sfx } from '../utils/audio';

interface RemindersBlockProps {
  reminders: Reminder[];
  onAddReminder: (text: string) => void;
  onUpdateReminder: (reminder: Reminder) => void;
  onDeleteReminder: (id: string) => void;
  onReorderReminders: (reminders: Reminder[]) => void;
}

export const RemindersBlock: React.FC<RemindersBlockProps> = ({
  reminders,
  onAddReminder,
  onUpdateReminder,
  onDeleteReminder,
  onReorderReminders,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [newText, setNewText] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Sorted: pinned first, then by order
  const sortedReminders = [...reminders].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return a.order - b.order;
  });

  const handleStartEdit = (reminder: Reminder) => {
    setEditingId(reminder.id);
    setEditText(reminder.text);
  };

  const handleSaveEdit = (reminder: Reminder) => {
    if (editingId !== reminder.id) return;
    const trimmed = editText.trim();
    if (trimmed && trimmed !== reminder.text) {
      onUpdateReminder({
        ...reminder,
        text: trimmed,
      });
      sfx.playClick();
    }
    setEditingId(null);
  };

  const handleTogglePin = (reminder: Reminder) => {
    sfx.playClick();
    onUpdateReminder({
      ...reminder,
      pinned: !reminder.pinned,
    });
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) return;

    const updated = [...sortedReminders];
    const [moved] = updated.splice(draggedIndex, 1);
    updated.splice(dropIndex, 0, moved);

    // Re-index order
    const reordered = updated.map((item, idx) => ({
      ...item,
      order: idx,
    }));

    setDraggedIndex(null);
    onReorderReminders(reordered);
    sfx.playClick();
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newText.trim();
    if (!trimmed) return;
    onAddReminder(trimmed);
    setNewText('');
    setIsAdding(false);
    sfx.playClick();
  };

  return (
    <section className="bg-[#FBF9F4] border border-[#E4DED2] rounded-[6px] p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#E4DED2]">
        <div className="flex items-center gap-2.5">
          <h3 className="font-serif text-[18px] font-normal text-[#1F1B16]">
            Reminders & Principles
          </h3>
          <span className="text-[11px] tabular-nums text-[#6B645A] px-1.5 py-0.5 rounded-[4px] bg-[#EFEAE0] border border-[#E4DED2]">
            {sortedReminders.length}
          </span>
        </div>

        <button
          type="button"
          onClick={() => {
            sfx.playClick();
            setIsAdding(!isAdding);
          }}
          className="editorial-btn-secondary py-1 px-2.5 text-[12px]"
        >
          {isAdding ? 'Cancel' : 'Add Statement'}
        </button>
      </div>

      {/* Add New Statement Form */}
      {isAdding && (
        <form onSubmit={handleCreate} className="space-y-2 p-3 bg-[#F6F2EA] rounded-[6px] border border-[#E4DED2]">
          <textarea
            autoFocus
            rows={2}
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            placeholder="Write a core principle, non-negotiable rule, or daily reminder..."
            className="w-full p-2.5 bg-[#FBF9F4] border border-[#E4DED2] rounded-[6px] font-serif text-[15px] leading-relaxed text-[#1F1B16] focus:outline-none focus:border-[#1F1B16] resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleCreate(e);
              }
            }}
          />
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="editorial-btn-secondary py-1 px-3 text-[12px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="editorial-btn-primary py-1 px-3 text-[12px]"
            >
              Save Statement
            </button>
          </div>
        </form>
      )}

      {/* Typographic Block List */}
      <div className="space-y-2.5">
        {sortedReminders.length === 0 ? (
          <div className="py-6 text-center text-[13px] text-[#6B645A] font-serif italic">
            No reminders defined. Add a guiding principle above.
          </div>
        ) : (
          sortedReminders.map((reminder, idx) => {
            const isEditing = editingId === reminder.id;

            return (
              <div
                key={reminder.id}
                draggable={!isEditing}
                onDragStart={(e) => handleDragStart(e, idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDrop={(e) => handleDrop(e, idx)}
                className={`group relative p-3.5 rounded-[6px] border transition-colors flex items-start gap-3 select-none ${
                  reminder.pinned
                    ? 'bg-[#F6F2EA] border-[#E4DED2]'
                    : 'bg-[#FBF9F4] border-[#E4DED2] hover:border-[#1F1B16]'
                } ${draggedIndex === idx ? 'opacity-40' : 'opacity-100'}`}
              >
                {/* Drag Handle */}
                <div
                  className="pt-1 text-[#6B645A]/50 group-hover:text-[#6B645A] cursor-grab active:cursor-grabbing transition-colors"
                  title="Drag to reorder"
                >
                  <GripVertical className="w-3.5 h-3.5" />
                </div>

                {/* Content / Inline Edit */}
                <div className="flex-1 min-w-0">
                  {isEditing ? (
                    <div className="space-y-2">
                      <textarea
                        autoFocus
                        rows={2}
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        onBlur={() => handleSaveEdit(reminder)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSaveEdit(reminder);
                          }
                          if (e.key === 'Escape') {
                            setEditingId(null);
                          }
                        }}
                        className="w-full p-2 bg-[#FBF9F4] border border-[#1F1B16] rounded-[4px] font-serif text-[16px] leading-relaxed text-[#1F1B16] focus:outline-none resize-none"
                      />
                      <div className="flex items-center justify-between text-[11px] text-[#6B645A]">
                        <span>Press Enter to save, Esc to cancel</span>
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(reminder)}
                          className="px-2 py-0.5 rounded-[4px] bg-[#1F1B16] text-[#FBF9F4] text-[11px]"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => handleStartEdit(reminder)}
                      className="cursor-text"
                      title="Click to edit inline"
                    >
                      <blockquote className="font-serif text-[16px] md:text-[17px] leading-relaxed text-[#1F1B16] italic tracking-tight">
                        “{reminder.text}”
                      </blockquote>
                    </div>
                  )}
                </div>

                {/* Pin & Delete Actions */}
                <div className="flex items-center gap-1 shrink-0 pt-0.5">
                  <button
                    type="button"
                    onClick={() => handleTogglePin(reminder)}
                    className={`p-1 rounded-[4px] transition-colors cursor-pointer ${
                      reminder.pinned
                        ? 'text-[#1F1B16] bg-[#EFEAE0]'
                        : 'text-[#6B645A]/40 group-hover:text-[#6B645A] hover:bg-[#EFEAE0]'
                    }`}
                    title={reminder.pinned ? 'Unpin reminder' : 'Pin reminder to top'}
                  >
                    <Pin className={`w-3.5 h-3.5 ${reminder.pinned ? 'fill-[#1F1B16]' : ''}`} />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      sfx.playClick();
                      onDeleteReminder(reminder.id);
                    }}
                    className="p-1 text-[#6B645A]/40 group-hover:text-[#6B645A] hover:text-[#9C3D2A] transition-colors cursor-pointer"
                    title="Delete statement"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
};
