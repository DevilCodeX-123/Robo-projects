import mongoose from 'mongoose';

const seniorSchema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true },
  phoneNumber: { type: String, required: true, trim: true },
  normalizedPhone: { type: String, required: true, trim: true },
  email: { type: String, default: '', lowercase: true, trim: true },
  department: { type: String, required: true, trim: true },
  position: { type: String, required: true, trim: true },
  responsibilities: { type: String, default: '' },
  linkedUserId: { type: String, default: '' },
  status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' }
}, { timestamps: true });

export const SeniorModel = mongoose.models.Senior || mongoose.model('Senior', seniorSchema);
export default SeniorModel;

