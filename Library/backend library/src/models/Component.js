import mongoose from 'mongoose';

const componentSchema = new mongoose.Schema({
  componentCode: { type: String, required: true, unique: true },
  name: { type: String, required: true, trim: true },
  category: { 
    type: String, 
    required: true, 
    trim: true,
    default: 'Basic Electronics'
  },
  label: { type: String, default: '' },
  whatItDoes: { type: String, default: '' },
  shelfIndex: { type: Number, default: 1 },
  description: { type: String, default: '' },
  imageUrl: { type: String, default: '' },
  datasheetUrl: { type: String, default: '' },
  location: {
    rack: { type: String, default: 'A' },
    shelf: { type: Number, default: 1 },
    box: { type: String, default: '01' },
    coordinates: { type: String, default: '(A,1,01)' },
    room: { type: String, default: 'Robotics Lab 304' }
  },
  totalStock: { type: Number, required: true, min: 0, default: 0 },
  availableStock: { type: Number, required: true, min: 0, default: 0 },
  reservedStock: { type: Number, default: 0, min: 0 },
  issuedStock: { type: Number, default: 0, min: 0 },
  damagedStock: { type: Number, default: 0, min: 0 },
  minThreshold: { type: Number, default: 5 },
  unit: { type: String, default: 'pcs' },
  purchasePrice: { type: Number, default: 0 },
  supplier: { type: String, default: 'RoboElements Co.' },
  isConsumable: { type: Boolean, default: false },
  technicalSpecs: { type: Object, default: {} },
  status: { type: String, enum: ['ACTIVE', 'ARCHIVED'], default: 'ACTIVE' }
}, { timestamps: true });

export const ComponentModel = mongoose.models.Component || mongoose.model('Component', componentSchema);
export default ComponentModel;
