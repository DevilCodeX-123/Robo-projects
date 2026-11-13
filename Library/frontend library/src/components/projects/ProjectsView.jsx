import React, { useState, useEffect } from 'react';
import { Sparkles, Users, CheckCircle2, Circle, Calendar, Plus, Layers } from 'lucide-react';
import { api } from '../../services/api';

export const ProjectsView = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProject, setNewProject] = useState({
    title: '',
    description: '',
    category: 'Combat Robotics',
    teamMembers: ''
  });

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await api.getProjects();
      if (res.success) {
        setProjects(res.projects);
      }
    } catch (err) {
      console.error('Error fetching projects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await api.createProject({
        title: newProject.title,
        description: newProject.description,
        category: newProject.category,
        teamMembers: newProject.teamMembers.split(',').map(m => m.trim())
      });
      if (res.success) {
        setShowCreateModal(false);
        setNewProject({ title: '', description: '', category: 'Combat Robotics', teamMembers: '' });
        fetchProjects();
      }
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in">
      
      {/* Header Banner */}
      <div className="bg-[#0B132B] p-6 sm:p-8 rounded-3xl text-white shadow-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">
            <Sparkles className="w-4 h-4" />
            <span>Robotics Club Initiatives & Competitions</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Club Projects & Component Allocations
          </h1>
          <p className="mt-1 text-xs text-slate-300 max-w-xl">
            Track official robotics competitions, robot builds, team rosters, and component reservations.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Club Project</span>
        </button>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="py-12 text-center text-sm text-slate-500">Loading projects...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {projects.map(proj => (
            <div key={proj._id || proj.id} className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs">
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
                    {proj.category}
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 mt-1">{proj.title}</h3>
                  <p className="text-xs text-slate-500">Lead: <strong className="text-slate-700">{proj.leadName}</strong></p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                  proj.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                }`}>
                  {proj.status}
                </span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl">
                {proj.description}
              </p>

              {/* Team Members */}
              <div className="flex items-center space-x-2 text-xs text-slate-600">
                <Users className="w-4 h-4 text-slate-400" />
                <span className="font-semibold">Team:</span>
                <span className="truncate">{proj.teamMembers?.join(', ')}</span>
              </div>

              {/* Allocated Components */}
              {proj.allocatedComponents && proj.allocatedComponents.length > 0 && (
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Allocated Components:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {proj.allocatedComponents.map((ac, idx) => (
                      <span key={idx} className="px-2.5 py-1 bg-slate-100 text-slate-800 rounded-lg text-xs font-medium">
                        {ac.componentName} &times; {ac.quantity}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Milestones Checklist */}
              {proj.completionChecklist && proj.completionChecklist.length > 0 && (
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                    Milestones Progress:
                  </span>
                  <div className="space-y-1.5 text-xs">
                    {proj.completionChecklist.map((task, idx) => (
                      <div key={idx} className="flex items-center space-x-2">
                        {task.completed ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                          <Circle className="w-4 h-4 text-slate-300 shrink-0" />
                        )}
                        <span className={task.completed ? 'line-through text-slate-400' : 'text-slate-700 font-medium'}>
                          {task.task}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          ))}
        </div>
      )}

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-xs">
            <h3 className="text-base font-bold text-slate-900">Create New Club Project</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Project Title *</label>
                <input
                  type="text"
                  value={newProject.title}
                  onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                  placeholder="e.g. Quadcopter Swarm Autonomous Navigation"
                  required
                  className="w-full p-2.5 border rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Category</label>
                <select
                  value={newProject.category}
                  onChange={(e) => setNewProject({ ...newProject, category: e.target.value })}
                  className="w-full p-2.5 border rounded-xl"
                >
                  <option value="Combat Robotics">Combat Robotics</option>
                  <option value="Autonomous Mobile Robotics">Autonomous Mobile Robotics</option>
                  <option value="Aerial Robotics & Drones">Aerial Robotics & Drones</option>
                  <option value="IoT & Automation">IoT & Automation</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  rows={2}
                  placeholder="Brief description of the robot build..."
                  className="w-full p-2.5 border rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Team Members (comma separated)</label>
                <input
                  type="text"
                  value={newProject.teamMembers}
                  onChange={(e) => setNewProject({ ...newProject, teamMembers: e.target.value })}
                  placeholder="Mittal, Aryan Sharma, Dr. Verma"
                  className="w-full p-2.5 border rounded-xl"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
export default ProjectsView;
