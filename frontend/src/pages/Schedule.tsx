import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Plus,
  Clock,
  MapPin,
  Trash2,
  Edit2,
  Search,
  Sparkles,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { api } from '../services/api';
import { CalendarEvent, TimeSlot } from '../types';

export const Schedule: React.FC = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // Free-time finder states
  const [calcDate, setCalcDate] = useState(() => {
    const tmrw = new Date();
    tmrw.setDate(tmrw.getDate() + 1);
    return tmrw.toISOString().slice(0, 10);
  });
  const [calcDuration, setCalcDuration] = useState(120);
  const [foundSlots, setFoundSlots] = useState<TimeSlot[]>([]);
  const [calculating, setCalculating] = useState(false);

  // Modal states
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [deletingEventId, setDeletingEventId] = useState<number | null>(null);

  // Form states
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formStart, setFormStart] = useState('');
  const [formEnd, setFormEnd] = useState('');
  const [formLoc, setFormLoc] = useState('Workspace');
  const [formType, setFormType] = useState('study');

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const data = await api.getEvents();
      setEvents(data);
    } catch (err: any) {
      console.error('Failed to load events:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFindFreeTime = async () => {
    setCalculating(true);
    try {
      const res = await api.findFreeTime(calcDate, calcDuration);
      setFoundSlots(res.available_slots || []);
    } catch (err: any) {
      alert('Error finding free slots: ' + err.message);
    } finally {
      setCalculating(false);
    }
  };

  const openCreateModal = (prefillStart?: string, prefillEnd?: string) => {
    setEditingEvent(null);
    setFormTitle('');
    setFormDesc('');
    setFormLoc('Workspace');
    setFormType('study');

    if (prefillStart && prefillEnd) {
      setFormStart(prefillStart.slice(0, 16));
      setFormEnd(prefillEnd.slice(0, 16));
    } else {
      const now = new Date();
      now.setHours(now.getHours() + 1, 0, 0, 0);
      const end = new Date(now);
      end.setHours(end.getHours() + 1);
      setFormStart(now.toISOString().slice(0, 16));
      setFormEnd(end.toISOString().slice(0, 16));
    }

    setIsEventModalOpen(true);
  };

  const openEditModal = (event: CalendarEvent) => {
    setEditingEvent(event);
    setFormTitle(event.title);
    setFormDesc(event.description || '');
    setFormStart(event.start_time.slice(0, 16));
    setFormEnd(event.end_time.slice(0, 16));
    setFormLoc(event.location || '');
    setFormType(event.event_type);
    setIsEventModalOpen(true);
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formStart || !formEnd) return;

    try {
      const payload: Partial<CalendarEvent> = {
        title: formTitle,
        description: formDesc,
        start_time: new Date(formStart).toISOString(),
        end_time: new Date(formEnd).toISOString(),
        location: formLoc,
        event_type: formType as any,
        is_confirmed: true,
      };

      if (editingEvent) {
        await api.updateEvent(editingEvent.id, payload);
      } else {
        await api.createEvent(payload);
      }

      setIsEventModalOpen(false);
      loadEvents();
    } catch (err: any) {
      alert('Error saving event: ' + err.message);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingEventId) return;
    try {
      await api.deleteEvent(deletingEventId);
      setDeletingEventId(null);
      loadEvents();
    } catch (err: any) {
      alert('Error deleting event: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Calendar & Schedule</h2>
          <p className="text-xs text-slate-500">
            Internal database calendar with conflict detection and automated free-time discovery.
          </p>
        </div>

        <button
          type="button"
          onClick={() => openCreateModal()}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Event</span>
        </button>
      </div>

      {/* Internal Calendar Transparency Alert */}
      <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-center gap-2">
        <Info className="w-4 h-4 text-blue-600 shrink-0" />
        <span>
          <strong>Internal Calendar Mode:</strong> All events are stored securely in your local SQLite/PostgreSQL database. Events are not synchronized with third-party external providers unless explicitly configured.
        </span>
      </div>

      {/* Free Time Slot Finder Tool */}
      <Card className="bg-gradient-to-br from-purple-50/50 to-indigo-50/30 border-purple-200/80">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-purple-600" />
          <h3 className="font-bold text-sm text-slate-800">
            Automated Free-Time Slot Calculator
          </h3>
        </div>

        <p className="text-xs text-slate-600 mb-4 leading-relaxed">
          Inspects internal events on any target day, excludes busy intervals, and calculates continuous open windows for deep work or study.
        </p>

        <div className="flex flex-col sm:flex-row items-end gap-3">
          <div className="flex-1 w-full sm:w-auto">
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">Target Date</label>
            <input
              type="date"
              value={calcDate}
              onChange={(e) => setCalcDate(e.target.value)}
              className="w-full px-3 py-2 bg-white rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
          </div>

          <div className="w-full sm:w-44">
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">Required Duration</label>
            <select
              value={calcDuration}
              onChange={(e) => setCalcDuration(Number(e.target.value))}
              className="w-full px-3 py-2 bg-white rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-400"
            >
              <option value={30}>30 mins (Quick)</option>
              <option value={60}>60 mins (1 hour)</option>
              <option value={90}>90 mins (1.5 hours)</option>
              <option value={120}>120 mins (2 hours)</option>
              <option value={180}>180 mins (3 hours)</option>
            </select>
          </div>

          <button
            type="button"
            disabled={calculating}
            onClick={handleFindFreeTime}
            className="w-full sm:w-auto px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
          >
            {calculating ? 'Analyzing...' : 'Find Free Slots'}
          </button>
        </div>

        {/* Found Slots Display */}
        {foundSlots.length > 0 && (
          <div className="mt-4 pt-4 border-t border-purple-200/60">
            <h4 className="text-xs font-bold text-purple-950 mb-2">
              Available Open Intervals ({foundSlots.length} found):
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {foundSlots.map((slot, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-white rounded-lg border border-purple-200/80 shadow-xs flex items-center justify-between"
                >
                  <div>
                    <p className="text-xs font-bold text-slate-800">
                      {slot.formatted_start} – {slot.formatted_end}
                    </p>
                    <p className="text-[11px] text-purple-700 mt-0.5">
                      {slot.recommendation_note}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => openCreateModal(slot.start_time, slot.end_time)}
                    className="text-[11px] font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 px-2.5 py-1 rounded-md transition-colors"
                  >
                    Schedule
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Events List */}
      <div className="space-y-3">
        <h3 className="font-bold text-sm text-slate-800">Scheduled Events ({events.length})</h3>

        {events.map((event) => {
          const sDate = new Date(event.start_time);
          const eDate = new Date(event.end_time);

          return (
            <Card key={event.id} className="hover:border-slate-300 transition-all">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-700 flex flex-col items-center justify-center shrink-0 border border-purple-100">
                    <span className="text-[10px] uppercase font-bold">
                      {sDate.toLocaleDateString(undefined, { month: 'short' })}
                    </span>
                    <span className="text-base font-extrabold leading-none">
                      {sDate.getDate()}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-semibold text-slate-900 truncate">
                        {event.title}
                      </h4>
                      <Badge
                        variant={
                          event.event_type === 'lecture'
                            ? 'navy'
                            : event.event_type === 'project'
                            ? 'purple'
                            : 'default'
                        }
                        size="sm"
                      >
                        {event.event_type.toUpperCase()}
                      </Badge>
                      {event.is_seed && (
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                          seed
                        </span>
                      )}
                    </div>

                    {event.description && (
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                        {event.description}
                      </p>
                    )}

                    <div className="flex items-center gap-4 mt-2.5 text-[11px] text-slate-500 flex-wrap">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          {sDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} –{' '}
                          {eDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      {event.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>{event.location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => openEditModal(event)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeletingEventId(event.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </Card>
          );
        })}

        {events.length === 0 && !loading && (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
            <CalendarIcon className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h4 className="font-semibold text-slate-700 text-sm">No events scheduled yet</h4>
            <p className="text-xs text-slate-400 mt-1">Click 'New Event' or use AI Assistant to schedule blocks.</p>
          </div>
        )}
      </div>

      {/* Create / Edit Event Modal */}
      <Modal
        isOpen={isEventModalOpen}
        onClose={() => setIsEventModalOpen(false)}
        title={editingEvent ? 'Edit Calendar Event' : 'Create Calendar Event'}
      >
        <form onSubmit={handleSaveEvent} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Title *</label>
            <input
              type="text"
              required
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder="e.g., Project Work Block"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Description</label>
            <textarea
              rows={2}
              value={formDesc}
              onChange={(e) => setFormDesc(e.target.value)}
              placeholder="Session agenda or meeting link..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Start Time *</label>
              <input
                type="datetime-local"
                required
                value={formStart}
                onChange={(e) => setFormStart(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">End Time *</label>
              <input
                type="datetime-local"
                required
                value={formEnd}
                onChange={(e) => setFormEnd(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Type</label>
              <select
                value={formType}
                onChange={(e) => setFormType(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white"
              >
                <option value="study">Study</option>
                <option value="project">Project Work</option>
                <option value="lecture">Lecture</option>
                <option value="meeting">Meeting</option>
                <option value="personal">Personal</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Location</label>
              <input
                type="text"
                value={formLoc}
                onChange={(e) => setFormLoc(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsEventModalOpen(false)}
              className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-sm"
            >
              {editingEvent ? 'Save Event' : 'Create Event'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deletingEventId !== null}
        onClose={() => setDeletingEventId(null)}
        title="Confirm Event Deletion"
        maxWidth="sm"
      >
        <div className="space-y-4 text-xs text-slate-600">
          <p>Are you sure you want to delete this calendar event?</p>
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setDeletingEventId(null)}
              className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-medium"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDeleteConfirm}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold shadow-sm"
            >
              Delete Event
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
