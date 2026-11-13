import mongoose from 'mongoose';

const inventoryTransactionSchema = new mongoose.Schema({
  component: { type: mongoose.Schema.Types.ObjectId, ref: 'Component', required: true },
  componentName: { type: String, required: true },
  componentCode: { type: String },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  userName: { type: String, default: 'System' },
  type: { 
    type: String, 
    required: true,
    enum: ['RECEIPT', 'RESERVATION', 'RESERVATION_CANCEL', 'ISSUANCE', 'RETURN', 'ADJUSTMENT', 'DAMAGE', 'LOSS'] 
  },
  quantityChange: { type: Number, required: true },
  resultingStock: {
    available: { type: Number, required: true },
    reserved: { type: Number, default: 0 },
    issued: { type: Number, default: 0 },
    damaged: { type: Number, default: 0 }
  },
  requestId: { type: mongoose.Schema.Types.ObjectId, ref: 'Request' },
  requestCode: { type: String },
  reason: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

export const InventoryTransactionModel = mongoose.models.InventoryTransaction || mongoose.model('InventoryTransaction', inventoryTransactionSchema);
export default InventoryTransactionModel;
