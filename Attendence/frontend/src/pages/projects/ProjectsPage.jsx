import React, { useState } from 'react';
import { storage } from '../../services/storage';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import { saveFile, getFileURL, deleteFile, validatePDF } from '../../services/fileService';
import {
  FolderKanban, Plus, Search, Pencil, Trash2,
  FileText, Eye, X, Upload, ExternalLink, Download,
  CheckSquare
} from 'lucide-react';

const PROJECT_STATUSES = ['Active', 'Completed', 'On Hold', 'Archived'];
const TASK_STATUSES = ['Not Started', 'In Progress', 'Under Review', 'Completed'];

const TASK_STATUS_COLORS = {
  'Not Started': 'var(--bg-sidebar)',
  'In Progress': 'var(--color-yellow)',
  'Under Review': 'var(--color-purple)',
  'Completed': 'var(--status-active-bg)'
};

const TASK_STATUS_TEXT_COLORS = {
  'Not Started': 'var(--text-secondary)',
  'In Progress': '#7a5a00',
  'Under Review': '#492a82',
  'Completed': 'var(--status-active-text)'
};

function PDFPreviewModal({ title, pdfRef, fileName, onClose }) {
  const [url, setUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  React.useEffect(() => {
    let activeUrl = null;
    getFileURL(pdfRef)
      .then(u => {
        if (u) {
          activeUrl = u;
          setUrl(u);
        } else {
          setError('Could not locate stored PDF file.');
        }
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));

    return () => {
      if (activeUrl) URL.revokeObjectURL(activeUrl);
    };
  }, [pdfRef]);

  return (
    <Modal title={title || 'PDF Preview'} onClose={onClose} maxWidth="800px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{fileName}</span>
          {url && (
            <div style={{ display: 'flex', gap: '8px' }}>
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className="btn-secondary"
                style={{ textDecoration: 'none', padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <ExternalLink size={13} /> Open in New Tab
              </a>
              <a
                href={url}
                download={fileName || 'document.pdf'}
                className="btn-secondary"
                style={{ textDecoration: 'none', padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Download size={13} /> Download
              </a>
            </div>
          )}
        </div>

        {loading && <p style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading preview…</p>}
        {error && <p style={{ padding: '32px', textAlign: 'center', color: 'var(--status-overdue-text)' }}>{error}</p>}
        {url && (
          <div style={{ width: '100%', height: '520px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-light)' }}>
            <iframe
              src={url}
              title="PDF Document Preview"
              width="100%"
              height="100%"
              style={{ border: 'none' }}
            />
          </div>
        )}
      </div>
    </Modal>
  );
}

// Task Create / Edit Modal (Admin has full edit; Member updates their own task)
function TaskModal({ task, members, currentUser, onSave, onClose }) {
  const isAdmin = currentUser.isAdmin;

  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    assignedTo: task?.assignedTo || '',
    deadline: task?.deadline || '',
    status: task?.status || 'Not Started',
    progress: task?.progress ?? 0,
    remarks: task?.remarks || ''
  });

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isAdmin && !form.title.trim()) return;

    if (isAdmin) {
      const assignedMember = members.find(m => m.id === form.assignedTo);
      onSave({
        ...form,
        assignedToName: assignedMember ? assignedMember.name : ''
      });
    } else {
      // Team Member can only submit status, progress, remarks
      onSave({
        status: form.status,
        progress: form.progress,
        remarks: form.remarks
      });
    }
  };

  return (
    <Modal title={task ? (isAdmin ? 'Edit Task' : 'Update My Assigned Task') : 'Add Project Task'} onClose={onClose} maxWidth="540px">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {isAdmin ? (
          <>
            <div className="form-group">
              <label>Task Title *</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Assemble 4-wheel drive chassis"
                value={form.title}
                onChange={e => setF('title', e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Task Description</label>
              <textarea
                className="form-control"
                rows={2}
                placeholder="Requirements, pinouts or CAD files needed..."
                value={form.description}
                onChange={e => setF('description', e.target.value)}
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Assign To Member *</label>
                <select
                  className="form-control"
                  value={form.assignedTo}
                  onChange={e => setF('assignedTo', e.target.value)}
                  required
                >
                  <option value="">— Select Club Member —</option>
                  {members.map(m => (
                    <option key={m.id} value={m.id}>{m.name} ({m.rollNumber || m.email})</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Task Deadline</label>
                <input
                  type="date"
                  className="form-control"
                  value={form.deadline}
                  onChange={e => setF('deadline', e.target.value)}
                />
              </div>
            </div>
          </>
        ) : (
          <div style={{ padding: '12px', backgroundColor: 'var(--bg-sidebar)', borderRadius: '10px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700' }}>{task.title}</h3>
            {task.description && <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>{task.description}</p>}
            {task.deadline && <span style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px', display: 'block' }}>Deadline: {task.deadline}</span>}
          </div>
        )}

        <div className="form-row">
          <div className="form-group">
            <label>Task Status</label>
            <select
              className="form-control"
              value={form.status}
              onChange={e => setF('status', e.target.value)}
            >
              {TASK_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Progress ({form.progress}%)</label>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={form.progress}
              onChange={e => setF('progress', parseInt(e.target.value))}
              style={{ width: '100%', marginTop: '8px' }}
            />
          </div>
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>Member Progress Remarks / Notes</label>
          <textarea
            className="form-control"
            rows={2}
            placeholder="Add update on blockers, completed sub-steps, or test results..."
            value={form.remarks}
            onChange={e => setF('remarks', e.target.value)}
          />
        </div>

        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary">
            {task ? 'Update Task' : 'Create Task'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function ProjectDetailsModal({ project, members, onClose, onEdit, currentUser, showAlert }) {
  const projectMembers = (project.memberIds || []).map(id => members.find(m => m.id === id)).filter(Boolean);
  const [showPdf, setShowPdf] = useState(false);
  const [tasks, setTasks] = useState(() => storage.getTasks(project.id));
  const [activeTaskModal, setActiveTaskModal] = useState(null); // 'new' or task object
  const [deletingTask, setDeletingTask] = useState(null);

  const refreshTasks = () => setTasks(storage.getTasks(project.id));

  const handleSaveTask = (taskData) => {
    if (activeTaskModal === 'new') {
      const res = storage.addTask({ ...taskData, projectId: project.id, createdBy: currentUser.name });
      if (res.success) {
        showAlert('Task added to project.');
        setActiveTaskModal(null);
        refreshTasks();
      } else {
        showAlert(res.message, 'error');
      }
    } else {
      const res = storage.updateTask(activeTaskModal.taskId, taskData, currentUser);
      if (res.success) {
        showAlert('Task updated.');
        setActiveTaskModal(null);
        refreshTasks();
      } else {
        showAlert(res.message, 'error');
      }
    }
  };

  const handleDeleteTask = () => {
    if (!deletingTask) return;
    const res = storage.deleteTask(deletingTask.taskId, currentUser);
    if (res.success) {
      showAlert('Task removed.');
      setDeletingTask(null);
      refreshTasks();
    } else {
      showAlert(res.message, 'error');
    }
  };

  return (
    <>
      <Modal title="Project Documentation & Tasks" onClose={onClose} maxWidth="740px">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <span className={`status-pill ${project.status.toLowerCase().replace(' ', '')}`}>
                {project.status}
              </span>
              {project.createdAt && (
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Created {new Date(project.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
              )}
            </div>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', fontWeight: '700' }}>
              {project.name}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6', marginTop: '8px' }}>
              {project.description || 'No description provided for this project.'}
            </p>
          </div>

          {project.tags?.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {project.tags.map(t => (
                <span key={t} style={{
                  fontSize: '11px', padding: '2px 10px', backgroundColor: 'var(--bg-sidebar)',
                  border: '1px solid var(--border-light)', borderRadius: '50px'
                }}>
                  #{t}
                </span>
              ))}
            </div>
          )}

          {/* Team Members */}
          <div>
            <p style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
              Project Team ({projectMembers.length})
            </p>
            {projectMembers.length === 0 ? (
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>No members currently assigned.</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '8px' }}>
                {projectMembers.map(m => (
                  <div key={m.id} style={{
                    display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px',
                    borderRadius: '8px', backgroundColor: 'var(--bg-sidebar)', border: '1px solid var(--border-light)'
                  }}>
                    <div style={{
                      width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'var(--color-teal)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700'
                    }}>
                      {m.name.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '600' }}>{m.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{m.clubTag || m.rollNumber}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* PDF Documentation Attachment */}
          {project.pdfFileName && (
            <div style={{
              padding: '14px 18px', borderRadius: '12px', backgroundColor: 'var(--bg-sidebar)',
              border: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FileText size={22} color="var(--text-primary)" />
                <div>
                  <p style={{ fontSize: '14px', fontWeight: '600' }}>{project.pdfFileName}</p>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Project Document (PDF)</p>
                </div>
              </div>
              <button
                className="btn-primary"
                style={{ padding: '6px 14px', fontSize: '12px' }}
                onClick={() => setShowPdf(true)}
              >
                <Eye size={13} style={{ marginRight: '6px' }} /> Preview PDF
              </button>
            </div>
          )}

          {/* ── PROJECT TASKS SECTION ──────────────────────── */}
          <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '700' }}>Project Tasks ({tasks.length})</h3>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Team members can update their assigned tasks
                </span>
              </div>
              {currentUser.isAdmin && (
                <button
                  className="btn-secondary"
                  onClick={() => setActiveTaskModal('new')}
                  style={{ fontSize: '12px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Plus size={14} /> Add Task
                </button>
              )}
            </div>

            {tasks.length === 0 ? (
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', textAlign: 'center', padding: '16px', backgroundColor: 'var(--bg-sidebar)', borderRadius: '8px' }}>
                No tasks created for this project yet. {currentUser.isAdmin ? 'Click "Add Task" to assign work.' : ''}
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {tasks.map(t => {
                  const isAssignedToMe = t.assignedTo === currentUser.id;
                  const canEdit = currentUser.isAdmin || isAssignedToMe;

                  return (
                    <div
                      key={t.taskId}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '10px',
                        backgroundColor: 'var(--bg-card)',
                        border: isAssignedToMe ? '2px solid var(--text-primary)' : '1px solid var(--border-light)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{
                              fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '50px',
                              backgroundColor: TASK_STATUS_COLORS[t.status] || 'var(--bg-sidebar)',
                              color: TASK_STATUS_TEXT_COLORS[t.status] || 'var(--text-primary)'
                            }}>
                              {t.status}
                            </span>
                            <strong style={{ fontSize: '14px' }}>{t.title}</strong>
                            {isAssignedToMe && (
                              <span style={{ fontSize: '10px', backgroundColor: 'var(--color-peach)', color: 'var(--text-primary)', padding: '1px 6px', borderRadius: '50px', fontWeight: '700' }}>
                                Assigned to You
                              </span>
                            )}
                          </div>
                          {t.description && (
                            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                              {t.description}
                            </p>
                          )}
                        </div>

                        {canEdit && (
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              className="btn-secondary"
                              style={{ padding: '4px 8px', fontSize: '11px' }}
                              onClick={() => setActiveTaskModal(t)}
                              title={isAssignedToMe ? 'Update Progress & Remarks' : 'Edit Task'}
                            >
                              <Pencil size={12} /> {isAssignedToMe ? 'Update' : 'Edit'}
                            </button>
                            {currentUser.isAdmin && (
                              <button
                                className="btn-secondary"
                                style={{ padding: '4px 8px', fontSize: '11px', color: 'var(--status-overdue-text)' }}
                                onClick={() => setDeletingTask(t)}
                                title="Delete Task"
                              >
                                <Trash2 size={12} />
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Progress Bar */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '3px' }}>
                          <span>Progress</span>
                          <strong>{t.progress}%</strong>
                        </div>
                        <div style={{ width: '100%', height: '6px', borderRadius: '3px', backgroundColor: 'var(--bg-sidebar)', overflow: 'hidden' }}>
                          <div style={{ width: `${t.progress}%`, height: '100%', backgroundColor: t.progress === 100 ? 'var(--status-active-text)' : 'var(--text-primary)', transition: 'width 0.3s' }} />
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: 'var(--text-secondary)', borderTop: '1px solid var(--border-light)', paddingTop: '6px' }}>
                        <span>Assigned to: <strong>{t.assignedToName || 'Unassigned'}</strong></span>
                        {t.deadline && <span>Deadline: {t.deadline}</span>}
                      </div>

                      {t.remarks && (
                        <div style={{ fontSize: '11px', padding: '6px 10px', backgroundColor: 'var(--bg-sidebar)', borderRadius: '6px', fontStyle: 'italic' }}>
                          💬 Remarks: {t.remarks}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-light)', paddingTop: '16px' }}>
            <button className="btn-secondary" onClick={onClose}>Close</button>
            {currentUser.isAdmin && (
              <button
                className="btn-primary"
                onClick={() => { onClose(); onEdit(project); }}
              >
                <Pencil size={14} style={{ marginRight: '6px' }} /> Edit Project Settings
              </button>
            )}
          </div>
        </div>
      </Modal>

      {showPdf && project.pdfFileRef && (
        <PDFPreviewModal
          title={project.name}
          pdfRef={project.pdfFileRef}
          fileName={project.pdfFileName}
          onClose={() => setShowPdf(false)}
        />
      )}

      {activeTaskModal && (
        <TaskModal
          task={activeTaskModal === 'new' ? null : activeTaskModal}
          members={members}
          currentUser={currentUser}
          onSave={handleSaveTask}
          onClose={() => setActiveTaskModal(null)}
        />
      )}

      {deletingTask && (
        <ConfirmDialog
          title="Delete Task"
          message={`Are you sure you want to remove "${deletingTask.title}"?`}
          onConfirm={handleDeleteTask}
          onCancel={() => setDeletingTask(null)}
          confirmLabel="Delete Task"
          danger
        />
      )}
    </>
  );
}

function ProjectModal({ project, members, onSave, onClose, showAlert }) {
  const [form, setForm] = useState({
    name: project?.name || '',
    description: project?.description || '',
    status: project?.status || 'Active',
    memberIds: project?.memberIds || [],
    tags: project?.tags?.join(', ') || '',
  });
  const [pdfFile, setPdfFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const toggleMember = (id) => {
    setForm(f => ({
      ...f,
      memberIds: f.memberIds.includes(id)
        ? f.memberIds.filter(x => x !== id)
        : [...f.memberIds, id]
    }));
  };

  const handlePDF = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const v = validatePDF(file);
    if (!v.valid) {
      showAlert(v.error, 'error');
      return;
    }
    setPdfFile(file);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      showAlert('Project name is required.', 'error');
      return;
    }
    setUploading(true);
    try {
      let pdfRef = project?.pdfFileRef || null;
      let pdfFileName = project?.pdfFileName || null;
      if (pdfFile) {
        pdfRef = `pdf_${Date.now()}`;
        pdfFileName = pdfFile.name;
        await saveFile(pdfRef, pdfFile);
        if (project?.pdfFileRef && project.pdfFileRef !== pdfRef) {
          await deleteFile(project.pdfFileRef).catch(() => {});
        }
      }
      onSave({
        ...form,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
        pdfFileRef: pdfRef,
        pdfFileName
      });
    } catch (e) {
      showAlert('Failed to save PDF: ' + e.message, 'error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal title={project ? 'Edit Project' : 'Add Project'} onClose={onClose} maxWidth="600px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div className="form-group">
          <label>Project Name *</label>
          <input
            type="text"
            className="form-control"
            placeholder="e.g. Autonomous Maze Solver"
            value={form.name}
            onChange={e => setF('name', e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Description</label>
          <textarea
            className="form-control"
            rows={3}
            placeholder="Overview, goals, or hardware used in the project…"
            value={form.description}
            onChange={e => setF('description', e.target.value)}
          />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Status</label>
            <select
              className="form-control"
              value={form.status}
              onChange={e => setF('status', e.target.value)}
            >
              {PROJECT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Tags (comma-separated)</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. robotics, computer-vision"
              value={form.tags}
              onChange={e => setF('tags', e.target.value)}
            />
          </div>
        </div>

        {/* PDF Document Upload */}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>Project PDF Documentation</label>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <label style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px',
              border: '1px solid var(--border-light)', borderRadius: '50px', cursor: 'pointer',
              fontSize: '13px', fontWeight: '600', backgroundColor: 'var(--bg-sidebar)',
              transition: 'all 0.2s'
            }}>
              <Upload size={15} />
              {pdfFile ? pdfFile.name : (project?.pdfFileName ? 'Replace PDF' : 'Upload PDF')}
              <input type="file" accept="application/pdf" onChange={handlePDF} style={{ display: 'none' }} />
            </label>
            {(pdfFile || project?.pdfFileName) && (
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                {pdfFile ? `Selected: ${pdfFile.name}` : `Current: ${project.pdfFileName}`}
              </span>
            )}
          </div>
        </div>

        {/* Member Association */}
        <div>
          <p style={{ fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
            Associated Members ({form.memberIds.length} selected)
          </p>
          <div style={{
            maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px',
            border: '1px solid var(--border-light)', borderRadius: '12px', padding: '10px'
          }}>
            {members.length === 0 ? (
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', textAlign: 'center', padding: '12px' }}>
                No active approved members available to assign.
              </p>
            ) : (
              members.map(m => (
                <div
                  key={m.id}
                  onClick={() => toggleMember(m.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '8px 12px', borderRadius: '8px', cursor: 'pointer',
                    backgroundColor: form.memberIds.includes(m.id) ? 'var(--bg-sidebar)' : 'transparent',
                    transition: 'background 0.15s'
                  }}
                >
                  <div style={{
                    width: '18px', height: '18px', borderRadius: '4px', flexShrink: 0,
                    border: `2px solid ${form.memberIds.includes(m.id) ? 'var(--text-primary)' : 'var(--border-light)'}`,
                    backgroundColor: form.memberIds.includes(m.id) ? 'var(--text-primary)' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    {form.memberIds.includes(m.id) && <X size={11} color="#fff" strokeWidth={3} />}
                  </div>
                  <span style={{ fontSize: '14px', fontWeight: '500' }}>{m.name}</span>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{m.clubTag || m.rollNumber}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="form-actions">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSave} disabled={uploading}>
            {uploading ? 'Uploading PDF…' : (project ? 'Save Changes' : 'Create Project')}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function ProjectCard({ project, members, currentUser, onEdit, onDelete, onViewDetails, onPreviewPDF }) {
  const projectMembers = (project.memberIds || []).map(id => members.find(m => m.id === id)).filter(Boolean);
  const tasks = storage.getTasks(project.id);
  const completedTasks = tasks.filter(t => t.status === 'Completed').length;

  const statusColor = {
    Active: 'var(--status-active-bg)',
    Completed: 'var(--color-teal)',
    'On Hold': 'var(--color-yellow)',
    Archived: 'var(--bg-sidebar)'
  };
  const statusText = {
    Active: 'var(--status-active-text)',
    Completed: 'var(--text-primary)',
    'On Hold': 'var(--text-primary)',
    Archived: 'var(--text-secondary)'
  };

  return (
    <div
      className="content-box"
      style={{ gap: '14px', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }}
      onClick={() => onViewDetails(project)}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = '';
        e.currentTarget.style.boxShadow = '';
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{
            fontSize: '11px',
            backgroundColor: statusColor[project.status] || 'var(--bg-sidebar)',
            color: statusText[project.status] || 'var(--text-secondary)',
            padding: '2px 10px',
            borderRadius: '50px',
            fontWeight: '600',
            display: 'inline-block',
            marginBottom: '8px'
          }}>
            {project.status}
          </span>
          <h3 style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '20px',
            fontWeight: '600',
            marginBottom: '6px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {project.name}
          </h3>
          {project.description && (
            <p style={{
              fontSize: '13px',
              color: 'var(--text-secondary)',
              lineHeight: '1.5',
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical'
            }}>
              {project.description}
            </p>
          )}
        </div>
        {currentUser.isAdmin && (
          <div
            style={{ display: 'flex', gap: '6px', flexShrink: 0 }}
            onClick={e => e.stopPropagation()}
          >
            <button
              className="btn-secondary"
              style={{ padding: '5px 10px' }}
              onClick={() => onEdit(project)}
              title="Edit Project"
            >
              <Pencil size={13} />
            </button>
            <button
              className="btn-secondary"
              style={{ padding: '5px 10px' }}
              onClick={() => onDelete(project)}
              title="Delete Project"
            >
              <Trash2 size={13} />
            </button>
          </div>
        )}
      </div>

      {project.tags?.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {project.tags.map(tag => (
            <span key={tag} style={{
              fontSize: '11px', padding: '2px 10px',
              backgroundColor: 'var(--bg-sidebar)', border: '1px solid var(--border-light)',
              borderRadius: '50px', color: 'var(--text-secondary)'
            }}>
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Team & Tasks count */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: 'var(--text-secondary)' }}>
        <span>Team: {projectMembers.length} member{projectMembers.length !== 1 ? 's' : ''}</span>
        <span>Tasks: {completedTasks}/{tasks.length} done</span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid var(--border-light)' }}>
        {project.pdfFileName ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPreviewPDF(project);
            }}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '4px 10px', border: '1px solid var(--border-light)',
              borderRadius: '50px', backgroundColor: 'var(--bg-sidebar)',
              cursor: 'pointer', fontSize: '11px', fontWeight: '600',
              color: 'var(--text-primary)'
            }}
          >
            <FileText size={12} /> {project.pdfFileName}
          </button>
        ) : (
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>No PDF attached</span>
        )}
        <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>
          Details & Tasks →
        </span>
      </div>
    </div>
  );
}

export default function ProjectsPage({ currentUser, showAlert }) {
  const [projects, setProjects] = useState(storage.getProjects());
  const [allTasks, setAllTasks] = useState(storage.getTasks());
  const members = storage.getMembers().filter(m => m.status === 'Active');

  const [activeTab, setActiveTab] = useState('projects'); // 'projects' | 'tasks'
  const [taskFilter, setTaskFilter] = useState('all'); // 'all' | 'mine'
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [viewingDetails, setViewingDetails] = useState(null);
  const [previewingPdf, setPreviewingPdf] = useState(null);
  const [editingTask, setEditingTask] = useState(null);

  const refresh = () => {
    setProjects(storage.getProjects());
    setAllTasks(storage.getTasks());
  };

  const filteredProjects = projects.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = !q || p.name?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'All' || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const filteredTasks = allTasks.filter(t => {
    if (taskFilter === 'mine' && t.assignedTo !== currentUser.id) return false;
    const q = search.toLowerCase();
    return !q || t.title.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q) || t.assignedToName?.toLowerCase().includes(q);
  });

  const handleSaveProject = (data) => {
    const all = storage.getProjects();
    if (editing) {
      const updated = all.map(p => p.id === editing.id ? { ...p, ...data, updatedAt: new Date().toISOString() } : p);
      storage.setProjects(updated);
      showAlert('Project updated successfully.');
      setEditing(null);
    } else {
      const np = { id: `proj_${Date.now()}`, ...data, createdAt: new Date().toISOString() };
      storage.setProjects([...all, np]);
      showAlert('Project added successfully.');
      setAdding(false);
    }
    refresh();
  };

  const handleDeleteProject = async () => {
    if (deleting.pdfFileRef) {
      await deleteFile(deleting.pdfFileRef).catch(() => {});
    }
    storage.setProjects(storage.getProjects().filter(p => p.id !== deleting.id));
    showAlert('Project removed.', 'error');
    setDeleting(null);
    refresh();
  };

  const handleSaveTaskDirect = (taskData) => {
    if (!editingTask) return;
    const res = storage.updateTask(editingTask.taskId, taskData, currentUser);
    if (res.success) {
      showAlert('Task updated successfully.');
      setEditingTask(null);
      refresh();
    } else {
      showAlert(res.message, 'error');
    }
  };

  const myTaskCount = allTasks.filter(t => t.assignedTo === currentUser.id).length;

  return (
    <>
      <div className="page-header">
        <div className="header-left">
          <h1 className="page-title">Project Management</h1>
          <p className="page-subtitle">
            Track club robotics projects, assign team members, manage tasks, and preview PDF documentation.
          </p>
        </div>
        {currentUser.isAdmin && (
          <button className="btn-primary" onClick={() => setAdding(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={16} /> New Project
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="category-pills" style={{ marginTop: '-16px' }}>
        <button
          className={`category-pill ${activeTab === 'projects' ? 'active' : ''}`}
          onClick={() => setActiveTab('projects')}
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <FolderKanban size={14} /> Club Projects ({projects.length})
        </button>
        <button
          className={`category-pill ${activeTab === 'tasks' ? 'active' : ''}`}
          onClick={() => setActiveTab('tasks')}
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <CheckSquare size={14} /> Tasks Board ({allTasks.length})
          {!currentUser.isAdmin && myTaskCount > 0 && (
            <span style={{ backgroundColor: 'var(--color-peach)', color: 'var(--text-primary)', borderRadius: '50px', padding: '1px 6px', fontSize: '11px', fontWeight: '700' }}>
              {myTaskCount} mine
            </span>
          )}
        </button>
      </div>

      {/* Search & Filter bar */}
      <div className="filters-bar" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
        <div className="search-input-wrapper" style={{ flex: '1 1 240px' }}>
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder={activeTab === 'projects' ? 'Search projects by name or topic…' : 'Search tasks by title or assignee…'}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {activeTab === 'projects' && (
          <div className="category-pills">
            {['All', ...PROJECT_STATUSES].map(s => (
              <button
                key={s}
                className={`category-pill ${statusFilter === s ? 'active' : ''}`}
                onClick={() => setStatusFilter(s)}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="category-pills">
            <button
              className={`category-pill ${taskFilter === 'all' ? 'active' : ''}`}
              onClick={() => setTaskFilter('all')}
            >
              All Club Tasks
            </button>
            <button
              className={`category-pill ${taskFilter === 'mine' ? 'active' : ''}`}
              onClick={() => setTaskFilter('mine')}
            >
              My Assigned Tasks ({myTaskCount})
            </button>
          </div>
        )}
      </div>

      {/* ── PROJECTS GRID ───────────────────────────────────── */}
      {activeTab === 'projects' && (
        <>
          {filteredProjects.length === 0 ? (
            <EmptyState
              icon={FolderKanban}
              title="No projects found"
              description="Start documenting your club's robotics hardware and software projects."
              action={currentUser.isAdmin ? () => setAdding(true) : undefined}
              actionLabel="Create Project"
            />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
              {filteredProjects.map(project => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  members={members}
                  currentUser={currentUser}
                  onEdit={setEditing}
                  onDelete={setDeleting}
                  onViewDetails={setViewingDetails}
                  onPreviewPDF={(p) => setPreviewingPdf({ ref: p.pdfFileRef, name: p.pdfFileName, title: p.name })}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* ── TASKS BOARD VIEW ─────────────────────────────────── */}
      {activeTab === 'tasks' && (
        <div className="content-box" style={{ padding: '8px' }}>
          {filteredTasks.length === 0 ? (
            <EmptyState
              icon={CheckSquare}
              title="No tasks match criteria"
              description={taskFilter === 'mine' ? 'You currently have no tasks assigned to you.' : 'Tasks created in projects will appear here.'}
            />
          ) : (
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Task</th>
                    <th>Related Project</th>
                    <th>Assigned To</th>
                    <th>Status</th>
                    <th>Progress</th>
                    <th>Deadline</th>
                    <th>Remarks</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTasks.map(t => {
                    const isAssignedToMe = t.assignedTo === currentUser.id;
                    const canEdit = currentUser.isAdmin || isAssignedToMe;
                    const proj = projects.find(p => p.id === t.projectId);

                    return (
                      <tr key={t.taskId} style={isAssignedToMe ? { backgroundColor: 'rgba(255, 181, 155, 0.08)' } : {}}>
                        <td>
                          <strong style={{ display: 'block' }}>{t.title}</strong>
                          {isAssignedToMe && (
                            <span style={{ fontSize: '10px', backgroundColor: 'var(--color-peach)', color: 'var(--text-primary)', padding: '1px 6px', borderRadius: '50px', fontWeight: '700' }}>
                              Assigned to You
                            </span>
                          )}
                        </td>
                        <td style={{ fontSize: '13px' }}>{proj?.name || '—'}</td>
                        <td>
                          <span style={{ fontWeight: isAssignedToMe ? '700' : '500' }}>
                            {t.assignedToName || 'Unassigned'}
                          </span>
                        </td>
                        <td>
                          <span style={{
                            fontSize: '11px', fontWeight: '700', padding: '3px 10px', borderRadius: '50px',
                            backgroundColor: TASK_STATUS_COLORS[t.status] || 'var(--bg-sidebar)',
                            color: TASK_STATUS_TEXT_COLORS[t.status] || 'var(--text-primary)'
                          }}>
                            {t.status}
                          </span>
                        </td>
                        <td style={{ minWidth: '100px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div style={{ flex: 1, height: '6px', borderRadius: '3px', backgroundColor: 'var(--bg-sidebar)', overflow: 'hidden' }}>
                              <div style={{ width: `${t.progress}%`, height: '100%', backgroundColor: t.progress === 100 ? 'var(--status-active-text)' : 'var(--text-primary)' }} />
                            </div>
                            <span style={{ fontSize: '11px', fontWeight: '700' }}>{t.progress}%</span>
                          </div>
                        </td>
                        <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{t.deadline || '—'}</td>
                        <td style={{ fontSize: '12px', color: 'var(--text-secondary)', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {t.remarks || '—'}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          {canEdit ? (
                            <button
                              className="btn-secondary"
                              style={{ padding: '4px 10px', fontSize: '11px' }}
                              onClick={() => setEditingTask(t)}
                              title={isAssignedToMe ? 'Update Progress & Status' : 'Edit Task'}
                            >
                              <Pencil size={11} style={{ marginRight: '4px' }} /> {isAssignedToMe ? 'Update' : 'Edit'}
                            </button>
                          ) : (
                            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Read-only</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {adding && (
        <ProjectModal
          members={members}
          onSave={handleSaveProject}
          onClose={() => setAdding(false)}
          showAlert={showAlert}
        />
      )}
      {editing && (
        <ProjectModal
          project={editing}
          members={members}
          onSave={handleSaveProject}
          onClose={() => setEditing(null)}
          showAlert={showAlert}
        />
      )}
      {viewingDetails && (
        <ProjectDetailsModal
          project={viewingDetails}
          members={members}
          onClose={() => { setViewingDetails(null); refresh(); }}
          onEdit={(p) => { setViewingDetails(null); setEditing(p); }}
          currentUser={currentUser}
          showAlert={showAlert}
        />
      )}
      {previewingPdf && (
        <PDFPreviewModal
          title={previewingPdf.title}
          pdfRef={previewingPdf.ref}
          fileName={previewingPdf.name}
          onClose={() => setPreviewingPdf(null)}
        />
      )}
      {editingTask && (
        <TaskModal
          task={editingTask}
          members={members}
          currentUser={currentUser}
          onSave={handleSaveTaskDirect}
          onClose={() => setEditingTask(null)}
        />
      )}
      {deleting && (
        <ConfirmDialog
          title="Delete Project"
          message={`Are you sure you want to permanently delete "${deleting.name}" and any associated task logs?`}
          onConfirm={handleDeleteProject}
          onCancel={() => setDeleting(null)}
          confirmLabel="Delete Project"
          danger
        />
      )}
    </>
  );
}
