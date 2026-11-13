import mongoose from 'mongoose';

const requestItemSchema = new mongoose.Schema({
  component: { type: mongoose.Schema.Types.ObjectId, ref: 'Component', required: true },
  componentName: { type: String, required: true },
  componentCode: { type: String },
  requestedQuantity: { type: Number, required: true, min: 1 },
  approvedQuantity: { type: Number, default: 0, min: 0 },
  issuedQuantity: { type: Number, default: 0, min: 0 },
  returnedQuantity: { type: Number, default: 0, min: 0 },
  itemStatus: { 
    type: String, 
    enum: ['PENDING', 'APPROVED', 'REJECTED', 'ISSUED', 'RETURNED'], 
    default: 'PENDING' 
  }
}, { _id: true });

const approvalRecordSchema = new mongoose.Schema({
  approver: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approverName: { type: String },
  action: { type: String, enum: ['APPROVED', 'PARTIALLY_APPROVED', 'REJECTED', 'REQUESTED_INFO'] },
  comments: { type: String, default: '' },
  timestamp: { type: Date, default: Date.now }
}, { _id: false });

const requestSchema = new mongoose.Schema({
  requestCode: { type: String, required: true, unique: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userName: { type: String, required: true },
  userEmail: { type: String },
  projectName: { type: String, required: true },
  projectPurpose: { type: String, required: true },
  seniorContact: { type: String, default: '' },
  seniorApprover: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  seniorApproverName: { type: String },
  seniorDepartment: { type: String, default: '' },
  seniorPosition: { type: String, default: '' },
  items: [requestItemSchema],
  status: { 
    type: String, 
    enum: [
      'SUBMITTED', 
      'UNDER_REVIEW', 
      'AWAITING_INFO', 
      'APPROVED', 
      'PARTIALLY_APPROVED', 
      'REJECTED', 
      'READY_FOR_PICKUP', 
      'ISSUED', 
      'PARTIALLY_RETURNED', 
      'RETURNED', 
      'OVERDUE', 
      'CANCELLED'
    ], 
    default: 'SUBMITTED' 
  },
  expectedPickupDate: { type: Date, required: true },
  expectedReturnDate: { type: Date },
  actualPickupDate: { type: Date },
  actualReturnDate: { type: Date },
  approvalHistory: [approvalRecordSchema],
  notes: { type: String, default: '' },
  adminNotes: { type: String, default: '' }
}, { timestamps: true });

export const RequestModel = mongoose.models.Request || mongoose.model('Request', requestSchema);
export default RequestModel;
