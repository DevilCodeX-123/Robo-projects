import React, { useState } from 'react';
import { storage } from '../../services/storage';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import EmptyState from '../../components/EmptyState';
import {
  CalendarDays, Plus, Search, ChevronLeft, ChevronRight,
  Clock, MapPin, Trophy, FileText, Camera,
  Pencil, Trash2, ExternalLink
} from 'lucide-react';

const CATEGORIES = ['All', 'Workshop', 'Competition', 'Seminar', 'Meeting', 'Club Activity', 'Other'];
const STATUSES = ['All', 'Upcoming', 'Ongoing', 'Completed', 'Cancelled'];

const CATEGORY_COLORS = {
  Workshop: 'var(--color-teal)',
  Competition: 'var(--color-peach)',
  Seminar: 'var(--color-blue)',
  Meeting: 'var(--color-yellow)',
  'Club Activity': 'var(--color-purple)',
  Other: 'var(--bg-sidebar)'
};

function EventModal({ event, onSave, onClose, showAlert }) {
  const [form, setForm] = useState({
    title: event?.title || '',
    category: event?.category || 'Workshop',
    status: event?.status || 'Upcoming',
    startDate: event?.startDate || new Date().toISOString().split('T')[0],
    endDate: event?.endDate || event?.startDate || new Date().toISOString().split('T')[0],
    startTime: event?.startTime || '10:00',
    endTime: event?.endTime || '13:00',
    venue: event?.venue || '',
    description: event?.description || '',
    outcome: event?.outcome || '',
    achievements: event?.achievements || '',
    documentation: event?.documentation || '',
    poster: event?.poster || '',
    photos: event?.photos || []
  });

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handlePosterUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showAlert('Please upload a valid image file (PNG, JPG, WebP).', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setF('poster', ev.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          setForm(prev => ({ ...prev, photos: [...prev.photos, ev.target.result] }));
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const removePhoto = (idx) => {
    setForm(prev => ({ ...prev, photos: prev.photos.filter((_, i) => i !== idx) }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.startDate || !form.venue.trim()) {
      showAlert('Please fill in title, start date, and venue.', 'error');
      return;
    }
    onSave(form);
  };

  return (
    <Modal title={event ? 'Edit Club Event' : 'Create New Club Event'} onClose={onClose} maxWidth="680px">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div className="form-group">
          <label>Event Title *</label>
          <input
            type="text"
            className="form-control"
            placeholder="e.g. Autonomous Maze Solving Workshop"
            value={form.title}
            onChange={e => setF('title', e.target.value)}
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Category *</label>
            <select
              className="form-control"
              value={form.category}
              onChange={e => setF('category', e.target.value)}
            >
              {CATEGORIES.filter(c => c !== 'All').map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Status *</label>
            <select
              className="form-control"
              value={form.status}
              onChange={e => setF('status', e.target.value)}
            >
              {STATUSES.filter(s => s !== 'All').map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Start Date *</label>
            <input
              type="date"
              className="form-control"
              value={form.startDate}
              onChange={e => setF('startDate', e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>End Date</label>
            <input
              type="date"
              className="form-control"
              value={form.endDate}
              onChange={e => setF('endDate', e.target.value)}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Start Time</label>
            <input
              type="time"
              className="form-control"
              value={form.startTime}
              onChange={e => setF('startTime', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>End Time</label>
            <input
              type="time"
              className="form-control"
              value={form.endTime}
              onChange={e => setF('endTime', e.target.value)}
            />
          </div>
        </div>

        <div className="form-group">
          <label>Venue / Location *</label>
          <input
            type="text"
            className="form-control"
            placeholder="e.g. Central Robotics Lab / Auditorium B"
            value={form.venue}
            onChange={e => setF('venue', e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>Description & Purpose</label>
          <textarea
            className="form-control"
            rows={3}
            placeholder="Agenda, prerequisites, equipment provided, and topics covered..."
            value={form.description}
            onChange={e => setF('description', e.target.value)}
          />
        </div>

        {/* Poster Upload */}
        <div className="form-group">
          <label>Event Poster / Featured Banner</label>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <label className="btn-secondary" style={{ cursor: 'pointer', padding: '6px 14px', fontSize: '13px' }}>
              <Camera size={14} style={{ marginRight: '6px' }} />
              {form.poster ? 'Change Poster' : 'Upload Poster Image'}
              <input type="file" accept="image/*" onChange={handlePosterUpload} style={{ display: 'none' }} />
            </label>
            {form.poster && (
              <button
                type="button"
                className="btn-secondary"
                style={{ padding: '6px 10px', fontSize: '12px', color: 'var(--status-overdue-text)' }}
                onClick={() => setF('poster', '')}
              >
                Remove
              </button>
            )}
          </div>
          {form.poster && (
            <div style={{ marginTop: '8px', maxHeight: '140px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-light)' }}>
              <img src={form.poster} alt="Event Poster" style={{ width: '100%', height: '140px', objectFit: 'cover' }} />
            </div>
          )}
        </div>

        {/* Completed Event Section: Outcomes, Achievements, Photos */}
        {(form.status === 'Completed' || event?.outcome || event?.achievements) && (
          <div style={{
            padding: '16px',
            backgroundColor: 'var(--bg-sidebar)',
            borderRadius: '12px',
            border: '1px solid var(--border-light)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <strong style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)' }}>
              🏆 Post-Event Archive & Outcomes
            </strong>
            <div className="form-group">
              <label>Event Outcomes & Key Summary</label>
              <textarea
                className="form-control"
                rows={2}
                placeholder="Key takeaways, participant attendance count, project demos..."
                value={form.outcome}
                onChange={e => setF('outcome', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Awards & Achievements</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. 1st Place Trophy, Best Autonomous Drivetrain Award..."
                value={form.achievements}
                onChange={e => setF('achievements', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Documentation Link / Drive Folder</label>
              <input
                type="text"
                className="form-control"
                placeholder="https://drive.google.com/... or club wiki link"
                value={form.documentation}
                onChange={e => setF('documentation', e.target.value)}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Event Photo Gallery</label>
              <label className="btn-secondary" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', fontSize: '13px' }}>
                <Camera size={14} /> Add Event Photos
                <input type="file" accept="image/*" multiple onChange={handlePhotoUpload} style={{ display: 'none' }} />
              </label>
              {form.photos.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))', gap: '8px', marginTop: '10px' }}>
                  {form.photos.map((p, i) => (
                    <div key={i} style={{ position: 'relative', height: '70px', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--border-light)' }}>
                      <img src={p} alt={`Upload ${i}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button
                        type="button"
                        onClick={() => removePhoto(i)}
                        style={{
                          position: 'absolute', top: 2, right: 2, background: 'rgba(0,0,0,0.6)',
                          color: '#fff', border: 'none', borderRadius: '50%', width: '18px', height: '18px',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                        }}
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary">
            {event ? 'Save Changes' : 'Publish Event'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function EventDetailsModal({ event, onClose, onEdit, onDelete, currentUser }) {
  return (
    <Modal title={event.title} onClose={onClose} maxWidth="640px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {event.poster && (
          <div style={{ width: '100%', height: '220px', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-light)' }}>
            <img src={event.poster} alt={event.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{
            fontSize: '12px',
            fontWeight: '700',
            backgroundColor: CATEGORY_COLORS[event.category] || 'var(--bg-sidebar)',
            color: 'var(--text-primary)',
            padding: '3px 12px',
            borderRadius: '50px'
          }}>
            {event.category}
          </span>
          <span className={`status-pill ${event.status.toLowerCase().replace(' ', '')}`}>
            {event.status}
          </span>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)', marginLeft: 'auto' }}>
            Posted by {event.createdBy || 'Admin'}
          </span>
        </div>

        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px',
          padding: '14px', backgroundColor: 'var(--bg-sidebar)', borderRadius: '12px', border: '1px solid var(--border-light)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CalendarDays size={16} color="var(--text-secondary)" />
            <div>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block' }}>Date</span>
              <strong style={{ fontSize: '13px' }}>
                {event.startDate === event.endDate || !event.endDate
                  ? event.startDate
                  : `${event.startDate} to ${event.endDate}`}
              </strong>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={16} color="var(--text-secondary)" />
            <div>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block' }}>Time</span>
              <strong style={{ fontSize: '13px' }}>{event.startTime || '10:00'} - {event.endTime || '13:00'}</strong>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MapPin size={16} color="var(--text-secondary)" />
            <div>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block' }}>Venue</span>
              <strong style={{ fontSize: '13px' }}>{event.venue}</strong>
            </div>
          </div>
        </div>

        <div>
          <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '6px' }}>Event Description</h4>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
            {event.description || 'No detailed description provided.'}
          </p>
        </div>

        {event.outcome && (
          <div style={{ padding: '12px 14px', backgroundColor: 'var(--status-active-bg)', borderRadius: '10px', border: '1px solid var(--status-active-border)' }}>
            <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--status-active-text)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Event Outcomes
            </span>
            <p style={{ fontSize: '13px', color: 'var(--status-active-text)', marginTop: '4px' }}>
              {event.outcome}
            </p>
          </div>
        )}

        {event.achievements && (
          <div style={{ padding: '12px 14px', backgroundColor: 'var(--color-yellow)', borderRadius: '10px' }}>
            <span style={{ fontSize: '11px', fontWeight: '700', color: '#684d00', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Trophy size={14} /> Club Achievements
            </span>
            <p style={{ fontSize: '13px', color: 'var(--text-primary)', marginTop: '4px' }}>
              {event.achievements}
            </p>
          </div>
        )}

        {event.documentation && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
            <FileText size={16} color="var(--text-secondary)" />
            <span style={{ color: 'var(--text-secondary)' }}>Documentation:</span>
            <a
              href={event.documentation.startsWith('http') ? event.documentation : `https://${event.documentation}`}
              target="_blank"
              rel="noreferrer"
              style={{ color: 'var(--color-blue)', textDecoration: 'underline', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              Open Resources <ExternalLink size={12} />
            </a>
          </div>
        )}

        {event.photos?.length > 0 && (
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '8px' }}>Event Photographs</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '8px' }}>
              {event.photos.map((p, i) => (
                <div key={i} style={{ height: '90px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-light)' }}>
                  <img src={p} alt={`Photo ${i}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-light)', paddingTop: '16px' }}>
          <button className="btn-secondary" onClick={onClose}>Close</button>
          {currentUser.isAdmin && (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className="btn-secondary"
                style={{ padding: '6px 12px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
                onClick={() => { onClose(); onEdit(event); }}
              >
                <Pencil size={13} /> Edit
              </button>
              <button
                className="btn-secondary"
                style={{ padding: '6px 12px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--status-overdue-text)' }}
                onClick={() => { onClose(); onDelete(event); }}
              >
                <Trash2 size={13} /> Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

// ── Interactive Monthly Calendar ────────────────────────────────
function MonthlyCalendarView({ events, selectedDate, onSelectDate, onSelectEvent }) {
  const [currentDate, setCurrentDate] = useState(() => new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 is Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToToday = () => {
    const now = new Date();
    setCurrentDate(now);
    onSelectDate(now.toISOString().split('T')[0]);
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Calendar cells
  const cells = [];
  // Empty slots before 1st of month
  for (let i = 0; i < firstDayOfMonth; i++) {
    cells.push({ empty: true, key: `empty-${i}` });
  }
  // Days of month
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dayEvents = events.filter(e => {
      if (!e.startDate) return false;
      const start = e.startDate;
      const end = e.endDate || e.startDate;
      return dateStr >= start && dateStr <= end;
    });
    cells.push({
      day: d,
      dateStr,
      events: dayEvents,
      key: `day-${d}`
    });
  }

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="content-box" style={{ padding: '20px' }}>
      {/* Calendar Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', fontWeight: '700' }}>
            {monthNames[month]} {year}
          </h2>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Club Activity & Event Calendar
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button className="btn-secondary" onClick={goToToday} style={{ fontSize: '12px', padding: '6px 12px' }}>
            Today
          </button>
          <button className="btn-secondary" onClick={prevMonth} style={{ padding: '6px 10px' }} title="Previous month">
            <ChevronLeft size={16} />
          </button>
          <button className="btn-secondary" onClick={nextMonth} style={{ padding: '6px 10px' }} title="Next month">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Weekday headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center', marginBottom: '8px' }}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(w => (
          <div key={w} style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', padding: '6px 0' }}>
            {w}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
        {cells.map(c => {
          if (c.empty) {
            return (
              <div
                key={c.key}
                style={{
                  minHeight: '85px',
                  backgroundColor: 'transparent',
                  borderRadius: '10px',
                  opacity: 0.3
                }}
              />
            );
          }

          const isSelected = selectedDate === c.dateStr;
          const isToday = c.dateStr === todayStr;

          return (
            <div
              key={c.key}
              onClick={() => onSelectDate(c.dateStr)}
              style={{
                minHeight: '85px',
                padding: '8px',
                borderRadius: '12px',
                backgroundColor: isSelected ? 'var(--bg-sidebar)' : 'var(--bg-card)',
                border: isSelected
                  ? '2px solid var(--text-primary)'
                  : isToday
                    ? '1.5px solid var(--color-peach)'
                    : '1px solid var(--border-light)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{
                  fontSize: '13px',
                  fontWeight: isToday ? '800' : '600',
                  color: isToday ? 'var(--color-peach-hover)' : 'var(--text-primary)',
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: isToday ? 'var(--bg-app)' : 'transparent'
                }}>
                  {c.day}
                </span>
                {c.events.length > 0 && (
                  <span style={{
                    fontSize: '10px',
                    fontWeight: '700',
                    backgroundColor: 'var(--text-primary)',
                    color: 'var(--bg-app)',
                    borderRadius: '50px',
                    padding: '0 6px',
                    lineHeight: '16px'
                  }}>
                    {c.events.length}
                  </span>
                )}
              </div>

              {/* Event indicators */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '2px', overflow: 'hidden' }}>
                {c.events.slice(0, 2).map(e => (
                  <div
                    key={e.id}
                    onClick={(ev) => { ev.stopPropagation(); onSelectEvent(e); }}
                    style={{
                      fontSize: '10px',
                      fontWeight: '600',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      backgroundColor: CATEGORY_COLORS[e.category] || 'var(--color-teal)',
                      color: 'var(--text-primary)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      border: '1px solid rgba(0,0,0,0.06)'
                    }}
                    title={`${e.title} (${e.category})`}
                  >
                    {e.title}
                  </div>
                ))}
                {c.events.length > 2 && (
                  <span style={{ fontSize: '9px', color: 'var(--text-secondary)', paddingLeft: '2px' }}>
                    +{c.events.length - 2} more
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function EventsPage({ currentUser, showAlert }) {
  const [events, setEvents] = useState(storage.getEvents());
  const [activeTab, setActiveTab] = useState('calendar'); // 'calendar' | 'all' | 'archive'
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [viewing, setViewing] = useState(null);

  const refresh = () => setEvents(storage.getEvents());

  const handleSave = (form) => {
    if (editing) {
      const res = storage.updateEvent(editing.id, form, currentUser);
      if (res.success) {
        showAlert('Event updated successfully.');
        setEditing(null);
        refresh();
      } else {
        showAlert(res.message, 'error');
      }
    } else {
      const res = storage.addEvent(form, currentUser);
      if (res.success) {
        showAlert('Event created and published.');
        setCreating(false);
        refresh();
      } else {
        showAlert(res.message, 'error');
      }
    }
  };

  const handleDelete = () => {
    const res = storage.deleteEvent(deleting.id, currentUser);
    if (res.success) {
      showAlert('Event removed from calendar.');
      setDeleting(null);
      refresh();
    } else {
      showAlert(res.message, 'error');
    }
  };

  // Filtered lists
  const filteredEvents = events.filter(e => {
    const q = search.toLowerCase();
    const matchSearch = !q || e.title.toLowerCase().includes(q) || e.venue.toLowerCase().includes(q) || e.description?.toLowerCase().includes(q);
    const matchCat = catFilter === 'All' || e.category === catFilter;
    const matchStatus = statusFilter === 'All' || e.status === statusFilter;
    return matchSearch && matchCat && matchStatus;
  });

  const selectedDayEvents = events.filter(e => {
    const start = e.startDate;
    const end = e.endDate || e.startDate;
    return selectedDate >= start && selectedDate <= end;
  });

  const upcomingEvents = filteredEvents.filter(e => e.status === 'Upcoming' || e.status === 'Ongoing');
  const pastArchive = filteredEvents.filter(e => e.status === 'Completed' || e.status === 'Cancelled');

  return (
    <>
      <div className="page-header">
        <div className="header-left">
          <h1 className="page-title">Events & Calendar</h1>
          <p className="page-subtitle">Schedule club workshops, competitions, guest lectures, and preserve activity history.</p>
        </div>
        {currentUser.isAdmin && (
          <button className="btn-primary" onClick={() => setCreating(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={16} /> Create Event
          </button>
        )}
      </div>

      {/* Navigation Pills */}
      <div className="category-pills" style={{ marginTop: '-16px' }}>
        <button
          className={`category-pill ${activeTab === 'calendar' ? 'active' : ''}`}
          onClick={() => setActiveTab('calendar')}
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <CalendarDays size={14} /> Monthly Calendar
        </button>
        <button
          className={`category-pill ${activeTab === 'upcoming' ? 'active' : ''}`}
          onClick={() => setActiveTab('upcoming')}
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <span>Upcoming Events ({upcomingEvents.length})</span>
        </button>
        <button
          className={`category-pill ${activeTab === 'archive' ? 'active' : ''}`}
          onClick={() => setActiveTab('archive')}
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Trophy size={14} /> Event Archive ({pastArchive.length})
        </button>
        <button
          className={`category-pill ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <span>All ({events.length})</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="filters-bar" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
        <div className="search-input-wrapper" style={{ flex: '1 1 240px' }}>
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search events by title, venue, or topic…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className="form-control"
          style={{ width: 'auto' }}
          value={catFilter}
          onChange={e => setCatFilter(e.target.value)}
        >
          {CATEGORIES.map(c => <option key={c} value={c}>{c === 'All' ? 'All Categories' : c}</option>)}
        </select>
        <select
          className="form-control"
          style={{ width: 'auto' }}
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          {STATUSES.map(s => <option key={s} value={s}>{s === 'All' ? 'All Statuses' : s}</option>)}
        </select>
      </div>

      {/* ── CALENDAR VIEW ────────────────────────────────────── */}
      {activeTab === 'calendar' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <MonthlyCalendarView
            events={filteredEvents}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            onSelectEvent={setViewing}
          />

          {/* Selected Date Events Strip */}
          <div className="content-box">
            <div className="content-box-header">
              <div>
                <h3 className="content-box-title">
                  Events on {new Date(selectedDate).toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' })}
                </h3>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  {selectedDayEvents.length} event{selectedDayEvents.length !== 1 ? 's' : ''} scheduled
                </span>
              </div>
              {currentUser.isAdmin && (
                <button
                  className="btn-secondary"
                  onClick={() => setCreating(true)}
                  style={{ fontSize: '13px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Plus size={14} /> Add Event for this Date
                </button>
              )}
            </div>

            {selectedDayEvents.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', padding: '16px 0', fontSize: '14px', textAlign: 'center' }}>
                No events scheduled on this date. Click another date or create a new event.
              </p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '14px' }}>
                {selectedDayEvents.map(e => (
                  <div
                    key={e.id}
                    onClick={() => setViewing(e)}
                    className="content-box"
                    style={{
                      padding: '16px',
                      gap: '10px',
                      cursor: 'pointer',
                      border: '1px solid var(--border-light)',
                      transition: 'transform 0.15s, box-shadow 0.15s'
                    }}
                    onMouseEnter={ev => ev.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseLeave={ev => ev.currentTarget.style.transform = ''}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                      <span style={{
                        fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '50px',
                        backgroundColor: CATEGORY_COLORS[e.category] || 'var(--bg-sidebar)', color: 'var(--text-primary)'
                      }}>
                        {e.category}
                      </span>
                      <span className={`status-pill ${e.status.toLowerCase().replace(' ', '')}`} style={{ fontSize: '11px' }}>
                        {e.status}
                      </span>
                    </div>
                    <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', fontWeight: '600' }}>{e.title}</h4>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Clock size={13} /> {e.startTime} - {e.endTime}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <MapPin size={13} /> {e.venue}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── ALL EVENTS / UPCOMING / ARCHIVE VIEW ───────────────────────── */}
      {(activeTab === 'all' || activeTab === 'upcoming' || activeTab === 'archive') && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {(activeTab === 'upcoming' ? upcomingEvents : activeTab === 'archive' ? pastArchive : filteredEvents).length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title={activeTab === 'upcoming' ? 'No upcoming events' : activeTab === 'archive' ? 'Archive is empty' : 'No events found'}
              description={activeTab === 'upcoming' ? 'Upcoming club workshops and competitions will be listed here.' : activeTab === 'archive' ? 'Completed and past events will be permanently preserved here.' : 'Create workshops, competitions, or seminars to schedule club events.'}
              action={currentUser.isAdmin ? () => setCreating(true) : undefined}
              actionLabel="Create Event"
            />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
              {(activeTab === 'upcoming' ? upcomingEvents : activeTab === 'archive' ? pastArchive : filteredEvents).map(e => (
                <div
                  key={e.id}
                  onClick={() => setViewing(e)}
                  className="content-box"
                  style={{
                    padding: '18px',
                    gap: '12px',
                    cursor: 'pointer',
                    transition: 'transform 0.2s, box-shadow 0.2s'
                  }}
                  onMouseEnter={ev => { ev.currentTarget.style.transform = 'translateY(-2px)'; ev.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
                  onMouseLeave={ev => { ev.currentTarget.style.transform = ''; ev.currentTarget.style.boxShadow = ''; }}
                >
                  {e.poster && (
                    <div style={{ width: '100%', height: '140px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-light)', marginBottom: '4px' }}>
                      <img src={e.poster} alt={e.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{
                      fontSize: '11px', fontWeight: '700', padding: '2px 10px', borderRadius: '50px',
                      backgroundColor: CATEGORY_COLORS[e.category] || 'var(--bg-sidebar)', color: 'var(--text-primary)'
                    }}>
                      {e.category}
                    </span>
                    <span className={`status-pill ${e.status.toLowerCase().replace(' ', '')}`}>
                      {e.status}
                    </span>
                  </div>

                  <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', fontWeight: '600' }}>
                    {e.title}
                  </h3>

                  {e.description && (
                    <p style={{
                      fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5',
                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
                    }}>
                      {e.description}
                    </p>
                  )}

                  <div style={{
                    display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px',
                    color: 'var(--text-secondary)', borderTop: '1px solid var(--border-light)', paddingTop: '10px'
                  }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CalendarDays size={14} /> {e.startDate} {e.endDate && e.endDate !== e.startDate ? `to ${e.endDate}` : ''}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Clock size={14} /> {e.startTime} - {e.endTime}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <MapPin size={14} /> {e.venue}
                    </span>
                  </div>

                  {e.achievements && (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px',
                      padding: '4px 8px', borderRadius: '6px', backgroundColor: 'var(--color-yellow)', color: '#684d00'
                    }}>
                      <Trophy size={13} /> {e.achievements}
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '4px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>View Details →</span>
                    {currentUser.isAdmin && (
                      <div style={{ display: 'flex', gap: '6px' }} onClick={ev => ev.stopPropagation()}>
                        <button
                          className="btn-secondary"
                          style={{ padding: '4px 8px', fontSize: '12px' }}
                          onClick={() => setEditing(e)}
                          title="Edit"
                        >
                          <Pencil size={12} />
                        </button>
                        <button
                          className="btn-secondary"
                          style={{ padding: '4px 8px', fontSize: '12px', color: 'var(--status-overdue-text)' }}
                          onClick={() => setDeleting(e)}
                          title="Delete"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {creating && (
        <EventModal
          onSave={handleSave}
          onClose={() => setCreating(false)}
          showAlert={showAlert}
        />
      )}
      {editing && (
        <EventModal
          event={editing}
          onSave={handleSave}
          onClose={() => setEditing(null)}
          showAlert={showAlert}
        />
      )}
      {viewing && (
        <EventDetailsModal
          event={viewing}
          onClose={() => setViewing(null)}
          onEdit={setEditing}
          onDelete={setDeleting}
          currentUser={currentUser}
        />
      )}
      {deleting && (
        <ConfirmDialog
          title="Delete Event"
          message={`Are you sure you want to permanently delete "${deleting.title}"? This action cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
          confirmLabel="Delete Event"
          danger
        />
      )}
    </>
  );
}
