import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  userRole: { type: String }, // Can target specific role or specific user
  title: { type: String, required: true },
  message: { type: String, required: true },
  link: { type: String, default: '' },
  type: { 
    type: String, 
    enum: ['INFO', 'SUCCESS', 'WARNING', 'DANGER'], 
    default: 'INFO' 
  },
  isRead: { type: Boolean, default: false }
}, { timestamps: true });

export const NotificationModel = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);
export default NotificationModel;
