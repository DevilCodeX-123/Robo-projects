import mongoose from 'mongoose';

const maintenanceTicketSchema = new mongoose.Schema({
  ticketCode: { type: String, required: true, unique: true },
  component: { type: mongoose.Schema.Types.ObjectId, ref: 'Component', required: true },
  componentName: { type: String, required: true },
  componentCode: { type: String },
  reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reportedByName: { type: String, default: 'Member' },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assignedToName: { type: String, default: 'Unassigned' },
  severity: { 
    type: String, 
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], 
    default: 'MEDIUM' 
  },
  status: { 
    type: String, 
    enum: ['OPEN', 'IN_PROGRESS', 'AWAITING_PARTS', 'RESOLVED', 'UNREPAIRABLE'], 
    default: 'OPEN' 
  },
  faultDescription: { type: String, required: true },
  repairNotes: { type: String, default: '' },
  repairCost: { type: Number, default: 0 },
  reportedAt: { type: Date, default: Date.now },
  resolvedAt: { type: Date }
}, { timestamps: true });

export const MaintenanceTicketModel = mongoose.models.MaintenanceTicket || mongoose.model('MaintenanceTicket', maintenanceTicketSchema);
export default MaintenanceTicketModel;
