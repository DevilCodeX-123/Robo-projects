import React, { useState } from 'react';
import { storage } from '../../services/storage';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';
import {
  Package, Users, CalendarCheck, FolderKanban, CalendarDays,
  Pencil, Check, RotateCcw, ArrowRight, Megaphone,
  Bell, CheckSquare
} from 'lucide-react';

function AnnouncementModal({ onSave, onClose }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState('normal');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    onSave({ title, content, priority });
  };

  return (
    <Modal title="Post Club Announcement" onClose={onClose} maxWidth="500px">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div className="form-group">
          <label>Announcement Title *</label>
          <input
            type="text"
            className="form-control"
            placeholder="e.g. Lab Access Hours Update / Workshop Registrations"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Priority</label>
          <select className="form-control" value={priority} onChange={e => setPriority(e.target.value)}>
            <option value="normal">Normal Announcement</option>
            <option value="urgent">Urgent / Action Required</option>
          </select>
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>Announcement Details *</label>
          <textarea
            className="form-control"
            rows={3}
            placeholder="Write clear instructions or information for all club members..."
            value={content}
            onChange={e => setContent(e.target.value)}
            required
          />
        </div>
        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary">Broadcast to Club</button>
        </div>
      </form>
    </Modal>
  );
}

export default function OverviewPage({ currentUser, setActiveTab, showAlert }) {
  const members = storage.getMembers();
  const inventory = storage.getInventory();
  const issuedItems = storage.getIssuedItems();
  const treasury = storage.getTreasury();
  const projects = storage.getProjects();
  const tasks = storage.getTasks();
  const events = storage.getEvents();
  const announcements = storage.getAnnouncements();
  const pendingRequests = storage.getInventoryRequests().filter(r => r.status === 'Pending');
  const pendingMembers = storage.getPending();

  // Active / Approved Members
  const approvedMembers = members.filter(m => m.status === 'Active');
  const approvedCount = approvedMembers.length;

  // Real issued items connected to inventory
  const activeIssued = issuedItems.filter(r => r.status === 'Active');
  const totalIssuedQty = activeIssued.reduce((sum, r) => sum + (parseInt(r.qty) || 0), 0);

  // Today's attendance stats
  const todayStr = new Date().toISOString().split('T')[0];
  const todayAttendance = storage.getDailyAttendanceByDate(todayStr);
  const todayPresent = todayAttendance.filter(r => r.status === 'Present').length;
  const todayAbsent = todayAttendance.filter(r => r.status === 'Absent').length;
  const todayLeave = todayAttendance.filter(r => r.status === 'Leave').length;

  // Active projects count
  const activeProjectsCount = projects.filter(p => p.status === 'Active').length;

  // Upcoming events
  const upcomingEvents = events.filter(e => e.status === 'Upcoming' || e.status === 'Ongoing');

  // Treasury editing state (Admin only)
  const [editTreasury, setEditTreasury] = useState(false);
  const [showAddAnnouncement, setShowAddAnnouncement] = useState(false);
  const [tForm, setTForm] = useState({
    balance: treasury.balance || '',
    label: treasury.label || 'Treasury Balance',
    notes: treasury.notes || ''
  });

  const saveTreasury = () => {
    storage.setTreasury({
      ...tForm,
      lastEditedBy: currentUser.name,
      lastEditedAt: new Date().toISOString()
    });
    setEditTreasury(false);
    showAlert('Treasury updated successfully.');
  };

  const handleQuickReturn = (issueId, itemName) => {
    const res = storage.returnItem(issueId);
    if (res.success) {
      showAlert(`Marked "${itemName}" as returned.`);
    } else {
      showAlert(res.message, 'error');
    }
  };

  const handlePostAnnouncement = (data) => {
    storage.addAnnouncement({ ...data, author: currentUser.name });
    showAlert('Announcement published to all members.');
    setShowAddAnnouncement(false);
  };

  const displayName = currentUser?.name ? currentUser.name.split(' ')[0] : 'Club Member';

  // ─────────────────────────────────────────────────────────────
  // 1. TEAM MEMBER DASHBOARD VIEW
  // ─────────────────────────────────────────────────────────────
  if (!currentUser?.isAdmin) {
    const memberStats = storage.computeMemberAttendanceStats(currentUser.id);
    const myProjects = projects.filter(p => (p.memberIds || []).includes(currentUser.id));
    const myTasks = tasks.filter(t => t.assignedTo === currentUser.id);
    const myCompletedTasks = myTasks.filter(t => t.status === 'Completed').length;
    const myIssuedItems = activeIssued.filter(r => r.issuedToId === currentUser.id);
    const myNotifs = storage.getUserNotifications(currentUser).slice(0, 5);

    const memberPct = memberStats.percentage === 'N/A' ? 'N/A' : `${memberStats.percentage}%`;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
        <div className="page-header">
          <div className="header-left">
            <h1 className="page-title">Welcome back, {displayName}</h1>
            <p className="page-subtitle">
              Personal club overview, assigned project tasks, and club schedule.
            </p>
          </div>
        </div>

        {/* Member Metrics Grid */}
        <div className="metrics-grid">
          {/* Attendance % */}
          <div
            className="metric-card teal"
            style={{ cursor: 'pointer' }}
            onClick={() => setActiveTab('attendance')}
            title="Click to view Attendance"
          >
            <span className="metric-label">Personal Attendance</span>
            <span className="metric-value">{memberPct}</span>
            <span className="metric-trend">
              {memberStats.eligibleDays > 0
                ? `${memberStats.presentDays} Present · ${memberStats.absentDays} Absent · ${memberStats.leaveDays} Leave`
                : 'No attendance records yet'}
            </span>
          </div>

          {/* Assigned Projects */}
          <div
            className="metric-card yellow"
            style={{ cursor: 'pointer' }}
            onClick={() => setActiveTab('projects')}
            title="Click to view Projects"
          >
            <span className="metric-label">Assigned Projects</span>
            <span className="metric-value">{myProjects.length}</span>
            <span className="metric-trend">
              {myProjects.length > 0 ? myProjects.map(p => p.name).slice(0, 2).join(', ') : 'No active projects'}
            </span>
          </div>

          {/* Assigned Tasks */}
          <div
            className="metric-card blue"
            style={{ cursor: 'pointer' }}
            onClick={() => setActiveTab('projects')}
            title="Click to view Tasks"
          >
            <span className="metric-label">My Assigned Tasks</span>
            <span className="metric-value">{myTasks.length}</span>
            <span className="metric-trend">
              {myCompletedTasks} completed · {myTasks.length - myCompletedTasks} in progress
            </span>
          </div>

          {/* Issued Hardware */}
          <div
            className="metric-card peach"
            style={{ cursor: 'pointer' }}
            onClick={() => setActiveTab('inventory')}
            title="Click to view Inventory"
          >
            <span className="metric-label">Hardware Issued to Me</span>
            <span className="metric-value">{myIssuedItems.length}</span>
            <span className="metric-trend">
              {myIssuedItems.length > 0
                ? `${myIssuedItems.reduce((acc, i) => acc + (parseInt(i.qty) || 0), 0)} unit(s) checked out`
                : 'No hardware checked out'}
            </span>
          </div>
        </div>

        {/* Club Announcements Banner */}
        {announcements.length > 0 && (
          <div className="content-box" style={{ borderLeft: '4px solid var(--color-peach)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Megaphone size={16} color="var(--color-peach-hover)" />
              <strong style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)' }}>
                Club Announcement
              </strong>
              {announcements[0].priority === 'urgent' && (
                <span style={{ fontSize: '10px', backgroundColor: 'var(--status-overdue-bg)', color: 'var(--status-overdue-text)', padding: '1px 6px', borderRadius: '50px', fontWeight: '700' }}>
                  Urgent
                </span>
              )}
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '4px' }}>
              {announcements[0].title}
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
              {announcements[0].content}
            </p>
          </div>
        )}

        {/* My Assigned Tasks Section */}
        <div className="content-box">
          <div className="content-box-header">
            <div>
              <h2 className="content-box-title">My Assigned Tasks ({myTasks.length})</h2>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Tasks assigned to you across robotics projects.
              </p>
            </div>
            <button
              className="btn-secondary"
              onClick={() => setActiveTab('projects')}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              Open Project Board <ArrowRight size={14} />
            </button>
          </div>

          {myTasks.length === 0 ? (
            <EmptyState
              icon={CheckSquare}
              title="No tasks currently assigned"
              description="Project tasks assigned to you by administrators will appear here for progress tracking."
              action={() => setActiveTab('projects')}
              actionLabel="View Club Projects"
            />
          ) : (
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Task Title</th>
                    <th>Status</th>
                    <th>Progress</th>
                    <th>Deadline</th>
                    <th>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {myTasks.map(t => (
                    <tr key={t.taskId}>
                      <td style={{ fontWeight: '600' }}>{t.title}</td>
                      <td>
                        <span className="status-pill active" style={{ fontSize: '11px' }}>{t.status}</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '80px', height: '6px', borderRadius: '3px', backgroundColor: 'var(--bg-sidebar)', overflow: 'hidden' }}>
                            <div style={{ width: `${t.progress}%`, height: '100%', backgroundColor: 'var(--text-primary)' }} />
                          </div>
                          <span style={{ fontSize: '11px', fontWeight: '700' }}>{t.progress}%</span>
                        </div>
                      </td>
                      <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{t.deadline || '—'}</td>
                      <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{t.remarks || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Two-Column: Upcoming Events & Hardware Checked Out */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          {/* Upcoming Events */}
          <div className="content-box">
            <div className="content-box-header">
              <h2 className="content-box-title">Upcoming Club Events</h2>
              <button className="btn-secondary" onClick={() => setActiveTab('events')} style={{ fontSize: '12px', padding: '4px 10px' }}>
                All Events →
              </button>
            </div>
            {upcomingEvents.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px', padding: '16px 0' }}>No upcoming events scheduled.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {upcomingEvents.slice(0, 3).map(e => (
                  <div key={e.id} style={{ padding: '10px 12px', borderRadius: '10px', backgroundColor: 'var(--bg-sidebar)', border: '1px solid var(--border-light)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: '13px' }}>{e.title}</strong>
                      <span className="status-pill active" style={{ fontSize: '10px' }}>{e.category}</span>
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px', display: 'block' }}>
                      {e.startDate} · {e.startTime} at {e.venue}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* My Issued Hardware */}
          <div className="content-box">
            <div className="content-box-header">
              <h2 className="content-box-title">My Checked-Out Hardware</h2>
              <button className="btn-secondary" onClick={() => setActiveTab('inventory')} style={{ fontSize: '12px', padding: '4px 10px' }}>
                Inventory →
              </button>
            </div>
            {myIssuedItems.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px', padding: '16px 0' }}>No hardware currently checked out.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {myIssuedItems.map(item => (
                  <div key={item.id} style={{ padding: '10px 12px', borderRadius: '10px', backgroundColor: 'var(--bg-sidebar)', border: '1px solid var(--border-light)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: '13px' }}>{item.itemName}</strong>
                      <span className="status-pill longterm" style={{ fontSize: '11px', fontWeight: '700' }}>{item.qty} unit(s)</span>
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px', display: 'block' }}>
                      Issued: {item.issuedDate} {item.returnDate ? `· Due: ${item.returnDate}` : ''}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Personal Notifications */}
        {myNotifs.length > 0 && (
          <div className="content-box">
            <div className="content-box-header">
              <h2 className="content-box-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Bell size={18} /> Recent Personal Notifications
              </h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {myNotifs.map(n => (
                <div
                  key={n.id}
                  onClick={() => { if (n.link) setActiveTab(n.link); }}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 14px', borderRadius: '8px',
                    backgroundColor: n.isRead ? 'var(--bg-card)' : 'var(--bg-sidebar)',
                    border: '1px solid var(--border-light)', cursor: 'pointer'
                  }}
                >
                  <div>
                    <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{n.title}</strong>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '2px 0 0' }}>{n.message}</p>
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                    {new Date(n.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 2. ADMIN DASHBOARD VIEW
  // ─────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      <div className="page-header">
        <div className="header-left">
          <h1 className="page-title">Admin Command Center</h1>
          <p className="page-subtitle">
            {approvedCount} active member{approvedCount !== 1 ? 's' : ''} · {activeProjectsCount} active project{activeProjectsCount !== 1 ? 's' : ''} · {inventory.length} inventory items
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className="btn-secondary"
            onClick={() => setShowAddAnnouncement(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Megaphone size={14} /> Post Announcement
          </button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="metrics-grid">
        {/* Total Active Members */}
        <div
          className="metric-card teal"
          style={{ cursor: 'pointer' }}
          onClick={() => setActiveTab('members')}
          title="Click to view Members Management"
        >
          <span className="metric-label">Active Members</span>
          <span className="metric-value">{approvedCount}</span>
          <span className="metric-trend">
            {pendingMembers.length > 0
              ? `${pendingMembers.length} awaiting approval`
              : 'All members approved'}
          </span>
        </div>

        {/* Today's Attendance Summary */}
        <div
          className="metric-card yellow"
          style={{ cursor: 'pointer' }}
          onClick={() => setActiveTab('attendance')}
          title="Click to view Attendance"
        >
          <span className="metric-label">Today's Attendance</span>
          <span className="metric-value">
            {todayAttendance.length > 0 ? `${todayPresent}/${approvedCount}` : '0 Marked'}
          </span>
          <span className="metric-trend">
            {todayAttendance.length > 0
              ? `${todayPresent} Present · ${todayAbsent} Absent · ${todayLeave} Leave`
              : 'Attendance not yet marked today'}
          </span>
        </div>

        {/* Active Projects */}
        <div
          className="metric-card blue"
          style={{ cursor: 'pointer' }}
          onClick={() => setActiveTab('projects')}
          title="Click to view Projects"
        >
          <span className="metric-label">Active Projects</span>
          <span className="metric-value">{activeProjectsCount}</span>
          <span className="metric-trend">
            {projects.length} total projects documented
          </span>
        </div>

        {/* Pending Inventory Requests */}
        <div
          className="metric-card peach"
          style={{ cursor: 'pointer' }}
          onClick={() => setActiveTab('inventory')}
          title="Click to view Inventory"
        >
          <span className="metric-label">Hardware Requests</span>
          <span className="metric-value">{pendingRequests.length}</span>
          <span className="metric-trend">
            {pendingRequests.length > 0
              ? `${pendingRequests.length} pending approval`
              : `${totalIssuedQty} items currently checked out`}
          </span>
        </div>

        {/* Total Inventory Items */}
        <div
          className="metric-card"
          style={{ backgroundColor: 'var(--bg-sidebar)', cursor: 'pointer' }}
          onClick={() => setActiveTab('inventory')}
          title="Click to view Inventory"
        >
          <span className="metric-label">Total Inventory Items</span>
          <span className="metric-value">{inventory.length}</span>
          <span className="metric-trend">
            {totalIssuedQty} units currently deployed
          </span>
        </div>

        {/* Upcoming Events */}
        <div
          className="metric-card purple"
          style={{ cursor: 'pointer' }}
          onClick={() => setActiveTab('events')}
          title="Click to view Events"
        >
          <span className="metric-label">Upcoming Events</span>
          <span className="metric-value">{upcomingEvents.length}</span>
          <span className="metric-trend">
            {upcomingEvents.length > 0 ? upcomingEvents[0].title.slice(0, 24) + '…' : 'None scheduled'}
          </span>
        </div>

        {/* Pending Approvals */}
        <div
          className="metric-card"
          style={{ backgroundColor: pendingMembers.length > 0 ? 'var(--status-overdue-bg)' : 'var(--bg-sidebar)', cursor: 'pointer' }}
          onClick={() => setActiveTab('members')}
          title="Click to view Pending Approvals"
        >
          <span className="metric-label" style={pendingMembers.length > 0 ? { color: 'var(--status-overdue-text)' } : {}}>
            Pending Approvals
          </span>
          <span className="metric-value" style={pendingMembers.length > 0 ? { color: 'var(--status-overdue-text)' } : {}}>
            {pendingMembers.length}
          </span>
          <span className="metric-trend" style={pendingMembers.length > 0 ? { color: 'var(--status-overdue-text)' } : {}}>
            {pendingMembers.length > 0 ? 'Action required in Members' : 'Zero pending applicants'}
          </span>
        </div>

        {/* Treasury (Admin Editable) */}
        <div className="metric-card peach" style={{ position: 'relative' }}>
          <span className="metric-label">Club Treasury</span>
          <span className="metric-value" style={{ fontSize: treasury.balance === '' ? '24px' : undefined }}>
            {treasury.balance !== '' && treasury.balance !== null && treasury.balance !== undefined
              ? (isNaN(Number(treasury.balance.replace(/,/g, '')))
                  ? treasury.balance
                  : `₹${Number(treasury.balance.replace(/,/g, '')).toLocaleString('en-IN')}`)
              : '—'}
          </span>
          <span className="metric-trend">
            {treasury.label || 'Treasury Balance'}
            {treasury.notes && ` · ${treasury.notes}`}
          </span>
          <button
            onClick={() => {
              setTForm({
                balance: treasury.balance || '',
                label: treasury.label || 'Treasury Balance',
                notes: treasury.notes || ''
              });
              setEditTreasury(true);
            }}
            style={{
              position: 'absolute', top: '16px', right: '16px',
              background: 'rgba(255,255,255,0.4)', border: 'none',
              borderRadius: '50%', width: '32px', height: '32px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'background 0.2s'
            }}
            title="Edit treasury information"
          >
            <Pencil size={14} color="var(--text-primary)" />
          </button>
        </div>
      </div>

      {/* Frequently Used Quick Actions */}
      <div className="content-box">
        <div className="content-box-header">
          <h2 className="content-box-title">Admin Quick Operations</h2>
        </div>
        <div className="quick-actions-grid">
          <button
            className="quick-action-btn teal"
            onClick={() => setActiveTab('attendance')}
          >
            <CalendarCheck className="action-icon" />
            <span>Mark Daily Attendance</span>
          </button>
          <button
            className="quick-action-btn blue"
            onClick={() => setActiveTab('projects')}
          >
            <FolderKanban className="action-icon" />
            <span>New Club Project</span>
          </button>
          <button
            className="quick-action-btn yellow"
            onClick={() => setActiveTab('inventory')}
          >
            <Package className="action-icon" />
            <span>Hardware Requests ({pendingRequests.length})</span>
          </button>
          <button
            className="quick-action-btn pink"
            onClick={() => setActiveTab('events')}
          >
            <CalendarDays className="action-icon" />
            <span>Schedule Event</span>
          </button>
          <button
            className="quick-action-btn purple"
            onClick={() => setActiveTab('members')}
          >
            <Users className="action-icon" />
            <span>Member Approvals ({pendingMembers.length})</span>
          </button>
        </div>
      </div>

      {/* Item Issue Management Table */}
      <div className="content-box">
        <div className="content-box-header">
          <div>
            <h2 className="content-box-title">Active Hardware Checkouts</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Real-time hardware checked out from the club inventory.
            </p>
          </div>
          <button
            className="btn-secondary"
            onClick={() => setActiveTab('inventory')}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            Manage Inventory <ArrowRight size={14} />
          </button>
        </div>

        {activeIssued.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No items currently checked out"
            description="When hardware or tools are issued to members or projects in the Inventory module, they will appear here."
            action={() => setActiveTab('inventory')}
            actionLabel="Open Inventory"
          />
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Item Name</th>
                  <th>Issued To</th>
                  <th>Project</th>
                  <th>Qty</th>
                  <th>Issue Date</th>
                  <th>Return Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {activeIssued.map(rec => (
                  <tr key={rec.id}>
                    <td style={{ fontWeight: '600' }}>{rec.itemName}</td>
                    <td>{rec.issuedTo}</td>
                    <td>{rec.project || '—'}</td>
                    <td>
                      <span className="status-pill longterm" style={{ fontWeight: '700' }}>
                        {rec.qty}
                      </span>
                    </td>
                    <td>{rec.issuedDate || '—'}</td>
                    <td>{rec.returnDate || 'Open-ended'}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn-secondary"
                        style={{ padding: '5px 12px', fontSize: '12px' }}
                        onClick={() => handleQuickReturn(rec.id, rec.itemName)}
                        title="Mark item as returned to inventory"
                      >
                        <RotateCcw size={12} style={{ marginRight: '4px' }} /> Return
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Announcements & Recent Activities */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {/* Active Announcements */}
        <div className="content-box">
          <div className="content-box-header">
            <h2 className="content-box-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Megaphone size={18} /> Club Announcements
            </h2>
            <button
              className="btn-secondary"
              onClick={() => setShowAddAnnouncement(true)}
              style={{ fontSize: '12px', padding: '4px 10px' }}
            >
              + Post
            </button>
          </div>
          {announcements.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', padding: '12px 0' }}>No announcements published.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {announcements.slice(0, 3).map(a => (
                <div key={a.id} style={{ padding: '12px 14px', borderRadius: '10px', backgroundColor: 'var(--bg-sidebar)', border: '1px solid var(--border-light)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: '13px' }}>{a.title}</strong>
                    {a.priority === 'urgent' && (
                      <span style={{ fontSize: '10px', backgroundColor: 'var(--status-overdue-bg)', color: 'var(--status-overdue-text)', padding: '1px 6px', borderRadius: '50px', fontWeight: '700' }}>
                        Urgent
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: '1.4' }}>
                    {a.content}
                  </p>
                  <span style={{ fontSize: '10px', color: 'var(--text-secondary)', display: 'block', marginTop: '6px' }}>
                    Posted by {a.author} · {new Date(a.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Admin Notifications */}
        <div className="content-box">
          <div className="content-box-header">
            <h2 className="content-box-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Bell size={18} /> Recent Club Activities
            </h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {storage.getUserNotifications(currentUser).slice(0, 4).map(n => (
              <div
                key={n.id}
                onClick={() => { if (n.link) setActiveTab(n.link); }}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 14px', borderRadius: '8px',
                  backgroundColor: 'var(--bg-sidebar)', border: '1px solid var(--border-light)',
                  cursor: 'pointer'
                }}
              >
                <div>
                  <strong style={{ fontSize: '13px' }}>{n.title}</strong>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '2px 0 0' }}>{n.message}</p>
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                  {new Date(n.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Treasury Edit Modal (Admin Only) */}
      {editTreasury && (
        <Modal title="Edit Treasury Information" onClose={() => setEditTreasury(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label>Current Value / Balance</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. 54,200 or 54200"
                value={tForm.balance}
                onChange={e => setTForm(f => ({ ...f, balance: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label>Label</label>
              <input
                type="text"
                className="form-control"
                placeholder="Treasury Balance"
                value={tForm.label}
                onChange={e => setTForm(f => ({ ...f, label: e.target.value }))}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Notes / Context (optional)</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Q2 club funds & sponsorships"
                value={tForm.notes}
                onChange={e => setTForm(f => ({ ...f, notes: e.target.value }))}
              />
            </div>
            <div className="form-actions">
              <button className="btn-secondary" onClick={() => setEditTreasury(false)}>
                Cancel
              </button>
              <button className="btn-primary" onClick={saveTreasury}>
                <Check size={16} /> Save Changes
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Announcement Modal */}
      {showAddAnnouncement && (
        <AnnouncementModal
          onSave={handlePostAnnouncement}
          onClose={() => setShowAddAnnouncement(false)}
        />
      )}
    </div>
  );
}
