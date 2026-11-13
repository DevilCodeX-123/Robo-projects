import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  lead: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  leadName: { type: String, default: '' },
  teamMembers: [{ type: String }],
  category: { type: String, default: 'Combat Robotics' },
  status: { 
    type: String, 
    enum: ['PLANNING', 'IN_PROGRESS', 'TESTING', 'COMPLETED', 'ARCHIVED'], 
    default: 'IN_PROGRESS' 
  },
  allocatedComponents: [{
    component: { type: mongoose.Schema.Types.ObjectId, ref: 'Component' },
    componentName: { type: String },
    quantity: { type: Number, default: 1 }
  }],
  startDate: { type: Date, default: Date.now },
  targetCompletionDate: { type: Date },
  completionChecklist: [{
    task: { type: String },
    completed: { type: Boolean, default: false }
  }]
}, { timestamps: true });

export const ProjectModel = mongoose.models.Project || mongoose.model('Project', projectSchema);
export default ProjectModel;
