import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  membershipId: { type: String, unique: true, required: true },
  department: { type: String, default: 'Robotics & Automation' },
  academicYear: { type: String, default: '3rd Year' },
  teamName: { type: String, default: 'RoboWars' },
  role: { 
    type: String, 
    enum: ['MEMBER', 'SENIOR', 'INVENTORY_MANAGER', 'ADMIN'], 
    default: 'MEMBER' 
  },
  status: { 
    type: String, 
    enum: ['ACTIVE', 'SUSPENDED'], 
    default: 'ACTIVE' 
  },
  contactNumber: { type: String, default: '' },
  preferences: {
    newRequestNotif: { type: Boolean, default: true },
    approvalNotif: { type: Boolean, default: true },
    rejectionNotif: { type: Boolean, default: true },
    pendingReminder: { type: Boolean, default: true },
    returnReminderDays: { type: Number, default: 2 },
    smsAlerts: { type: Boolean, default: true }
  }
}, { timestamps: true });

export const UserModel = mongoose.models.User || mongoose.model('User', userSchema);
export default UserModel;
