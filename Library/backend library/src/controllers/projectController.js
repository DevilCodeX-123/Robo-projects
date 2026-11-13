import { dataService } from '../services/dataService.js';

export const getProjects = async (req, res) => {
  try {
    const projects = await dataService.getProjects();
    res.json({ success: true, count: projects.length, projects });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createProject = async (req, res) => {
  try {
    const { title, description, teamMembers, category, targetCompletionDate, completionChecklist } = req.body;
    if (!title) {
      return res.status(400).json({ success: false, message: 'Project title is required' });
    }

    const newProject = await dataService.createProject({
      title,
      description: description || '',
      lead: req.user._id || req.user.id,
      leadName: req.user.fullName,
      teamMembers: teamMembers || [req.user.fullName],
      category: category || 'Robo War',
      status: 'IN_PROGRESS',
      allocatedComponents: [],
      startDate: new Date().toISOString(),
      targetCompletionDate: targetCompletionDate || new Date(Date.now() + 30 * 86400000).toISOString(),
      completionChecklist: completionChecklist || [
        { task: 'Chassis design & fabrication', completed: true },
        { task: 'Motor driver integration', completed: false },
        { task: 'Sensor testing & calibration', completed: false },
        { task: 'Autonomous navigation code', completed: false }
      ]
    });

    res.status(201).json({ success: true, project: newProject });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await dataService.updateProject(id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    res.json({ success: true, project: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
