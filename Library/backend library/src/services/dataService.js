import { isMongoConnected, localStore, saveLocalStore } from '../config/db.js';
import UserModel from '../models/User.js';
import SeniorModel from '../models/Senior.js';
import ComponentModel from '../models/Component.js';
import RequestModel from '../models/Request.js';
import InventoryTransactionModel from '../models/InventoryTransaction.js';
import ProjectModel from '../models/Project.js';
import MaintenanceTicketModel from '../models/MaintenanceTicket.js';
import NotificationModel from '../models/Notification.js';
import AuditLogModel from '../models/AuditLog.js';

// Helper to generate IDs
const generateId = () => 'id_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);

export const dataService = {
  // ================= USERS =================
  async findUserByEmail(email) {
    if (isMongoConnected) {
      return await UserModel.findOne({ email: email.toLowerCase() });
    }
    return localStore.users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
  },

  async findUserById(id) {
    if (isMongoConnected) {
      return await UserModel.findById(id);
    }
    return localStore.users.find(u => u._id === id || u.id === id) || null;
  },

  async createUser(userData) {
    if (isMongoConnected) {
      const user = new UserModel(userData);
      return await user.save();
    }
    const newUser = {
      _id: generateId(),
      ...userData,
      status: userData.status || 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    localStore.users.push(newUser);
    saveLocalStore();
    return newUser;
  },

  async getUsers() {
    if (isMongoConnected) {
      return await UserModel.find().select('-passwordHash').sort({ createdAt: -1 });
    }
    return localStore.users.map(({ passwordHash, ...rest }) => rest);
  },

  async updateUser(id, updateData) {
    if (isMongoConnected) {
      return await UserModel.findByIdAndUpdate(id, updateData, { new: true });
    }
    const idx = localStore.users.findIndex(u => u._id === id || u.id === id);
    if (idx !== -1) {
      localStore.users[idx] = { ...localStore.users[idx], ...updateData, updatedAt: new Date().toISOString() };
      saveLocalStore();
      return localStore.users[idx];
    }
    return null;
  },

  async deleteUser(id) {
    if (isMongoConnected) {
      return await UserModel.findByIdAndDelete(id);
    }
    const idx = localStore.users.findIndex(u => u._id === id || u.id === id);
    if (idx !== -1) {
      const deleted = localStore.users.splice(idx, 1)[0];
      saveLocalStore();
      return deleted;
    }
    return null;
  },

  // ================= SENIORS =================
  async getSeniors(filter = {}) {
    if (isMongoConnected) {
      const query = {};
      if (filter.search && filter.search.trim()) {
        const regex = new RegExp(filter.search.trim(), 'i');
        query.$or = [
          { fullName: regex },
          { department: regex },
          { position: regex },
          { phoneNumber: regex },
          { responsibilities: regex }
        ];
      }
      return await SeniorModel.find(query).sort({ createdAt: -1 });
    }

    let items = [...(localStore.seniors || [])];
    if (filter.search && filter.search.trim()) {
      const q = filter.search.trim().toLowerCase();
      items = items.filter(s =>
        (s.fullName || '').toLowerCase().includes(q) ||
        (s.department || '').toLowerCase().includes(q) ||
        (s.position || '').toLowerCase().includes(q) ||
        (s.phoneNumber || '').toLowerCase().includes(q) ||
        (s.responsibilities || '').toLowerCase().includes(q)
      );
    }
    return items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  async getSeniorById(id) {
    if (!id) return null;
    if (isMongoConnected) {
      try {
        return await SeniorModel.findById(id);
      } catch {
        return null;
      }
    }
    return (localStore.seniors || []).find(s => s._id === id || s.id === id) || null;
  },

  async findDuplicateSenior({ normalizedPhone, email }, excludeId = null) {
    if (isMongoConnected) {
      const orConds = [{ normalizedPhone }];
      if (email && email.trim()) {
        orConds.push({ email: email.trim().toLowerCase() });
      }
      const query = { $or: orConds };
      if (excludeId) query._id = { $ne: excludeId };
      return await SeniorModel.findOne(query);
    }

    const cleanEmail = email && email.trim() ? email.trim().toLowerCase() : '';
    return (localStore.seniors || []).find(s => {
      const sid = String(s._id || s.id);
      if (excludeId && sid === String(excludeId)) return false;
      const phoneMatch = s.normalizedPhone && s.normalizedPhone === normalizedPhone;
      const emailMatch = cleanEmail && s.email && s.email.toLowerCase() === cleanEmail;
      return phoneMatch || emailMatch;
    }) || null;
  },

  async createSenior(data) {
    if (isMongoConnected) {
      const senior = new SeniorModel(data);
      return await senior.save();
    }
    if (!Array.isArray(localStore.seniors)) localStore.seniors = [];
    const newSenior = {
      _id: 'snr_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
      ...data,
      status: data.status || 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    localStore.seniors.push(newSenior);
    saveLocalStore();
    return newSenior;
  },

  async updateSenior(id, updateData) {
    if (isMongoConnected) {
      return await SeniorModel.findByIdAndUpdate(id, updateData, { new: true });
    }
    const idx = (localStore.seniors || []).findIndex(s => s._id === id || s.id === id);
    if (idx !== -1) {
      localStore.seniors[idx] = { ...localStore.seniors[idx], ...updateData, updatedAt: new Date().toISOString() };
      saveLocalStore();
      return localStore.seniors[idx];
    }
    return null;
  },

  async deleteSenior(id) {
    if (isMongoConnected) {
      return await SeniorModel.findByIdAndDelete(id);
    }
    const idx = (localStore.seniors || []).findIndex(s => s._id === id || s.id === id);
    if (idx !== -1) {
      const [removed] = localStore.seniors.splice(idx, 1);
      saveLocalStore();
      return removed;
    }
    return null;
  },

  // ================= COMPONENTS =================
  async getComponents(filter = {}) {
    if (isMongoConnected) {
      const query = filter.includeArchived ? {} : { status: { $ne: 'ARCHIVED' } };
      if (filter.category && filter.category !== 'All') {
        query.category = filter.category;
      }
      if (filter.search) {
        query.$or = [
          { name: { $regex: filter.search, $options: 'i' } },
          { componentCode: { $regex: filter.search, $options: 'i' } },
          { description: { $regex: filter.search, $options: 'i' } },
          { 'location.coordinates': { $regex: filter.search, $options: 'i' } }
        ];
      }
      return await ComponentModel.find(query).sort({ name: 1 });
    }

    let items = filter.includeArchived
      ? [...localStore.components]
      : localStore.components.filter(c => c.status !== 'ARCHIVED');
    if (filter.category && filter.category !== 'All') {
      items = items.filter(c => c.category === filter.category);
    }
    if (filter.search) {
      const q = filter.search.toLowerCase();
      items = items.filter(c => 
        c.name.toLowerCase().includes(q) || 
        (c.componentCode && c.componentCode.toLowerCase().includes(q)) ||
        (c.location?.coordinates && c.location.coordinates.toLowerCase().includes(q))
      );
    }
    return items;
  },

  async getComponentById(id) {
    if (!id) return null;
    if (isMongoConnected) {
      try {
        return await ComponentModel.findById(id);
      } catch {
        return null;
      }
    }
    return localStore.components.find(c => c._id === id || c.id === id) || null;
  },

  async createComponent(data) {
    if (isMongoConnected) {
      const component = new ComponentModel(data);
      return await component.save();
    }
    const newComponent = {
      _id: generateId(),
      ...data,
      availableStock: data.availableStock ?? data.totalStock ?? 0,
      reservedStock: 0,
      issuedStock: 0,
      damagedStock: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    localStore.components.push(newComponent);
    saveLocalStore();
    return newComponent;
  },

  async updateComponent(id, updateData) {
    if (isMongoConnected) {
      return await ComponentModel.findByIdAndUpdate(id, updateData, { new: true });
    }
    const idx = localStore.components.findIndex(c => c._id === id || c.id === id);
    if (idx !== -1) {
      localStore.components[idx] = { ...localStore.components[idx], ...updateData, updatedAt: new Date().toISOString() };
      saveLocalStore();
      return localStore.components[idx];
    }
    return null;
  },

  async deleteComponentPermanently(id) {
    if (isMongoConnected) {
      return await ComponentModel.findByIdAndDelete(id);
    }
    const idx = localStore.components.findIndex(c => c._id === id || c.id === id);
    if (idx !== -1) {
      const [removed] = localStore.components.splice(idx, 1);
      saveLocalStore();
      return removed;
    }
    return null;
  },

  // Atomic Stock Adjustment
  async adjustComponentStock(componentId, { deltaAvailable = 0, deltaReserved = 0, deltaIssued = 0, deltaDamaged = 0 }) {
    if (isMongoConnected) {
      const update = {
        $inc: {
          availableStock: deltaAvailable,
          reservedStock: deltaReserved,
          issuedStock: deltaIssued,
          damagedStock: deltaDamaged
        }
      };
      return await ComponentModel.findByIdAndUpdate(componentId, update, { new: true });
    }

    const component = await this.getComponentById(componentId);
    if (!component) throw new Error('Component not found');

    component.availableStock = Math.max(0, (component.availableStock || 0) + deltaAvailable);
    component.reservedStock = Math.max(0, (component.reservedStock || 0) + deltaReserved);
    component.issuedStock = Math.max(0, (component.issuedStock || 0) + deltaIssued);
    component.damagedStock = Math.max(0, (component.damagedStock || 0) + deltaDamaged);
    component.updatedAt = new Date().toISOString();

    saveLocalStore();
    return component;
  },

  // ================= REQUESTS =================
  async getRequests(filter = {}) {
    if (isMongoConnected) {
      const query = {};
      if (filter.user) {
        query.$or = [
          { user: filter.user },
          ...(filter.userEmail ? [{ userEmail: filter.userEmail }] : [])
        ];
      }
      if (filter.status) query.status = filter.status;
      return await RequestModel.find(query).sort({ createdAt: -1 });
    }

    let items = [...localStore.requests];
    if (filter.user) {
      const targetUserId = String(filter.user);
      const targetEmail = filter.userEmail ? String(filter.userEmail).toLowerCase() : null;
      items = items.filter(r => {
        const reqUserId = String(r.user?._id || r.user?.id || r.user || '');
        const reqEmail = r.userEmail ? String(r.userEmail).toLowerCase() : null;
        return (targetUserId && reqUserId === targetUserId) || (targetEmail && reqEmail === targetEmail);
      });
    }
    if (filter.status) {
      items = items.filter(r => r.status === filter.status);
    }
    return items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  async getRequestById(id) {
    if (isMongoConnected) {
      return await RequestModel.findById(id);
    }
    return localStore.requests.find(r => r._id === id || r.id === id) || null;
  },

  async createRequest(reqData) {
    if (isMongoConnected) {
      const req = new RequestModel(reqData);
      return await req.save();
    }
    const newRequest = {
      _id: generateId(),
      ...reqData,
      status: reqData.status || 'SUBMITTED',
      approvalHistory: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    localStore.requests.push(newRequest);
    saveLocalStore();
    return newRequest;
  },

  async updateRequest(id, updateData) {
    if (isMongoConnected) {
      return await RequestModel.findByIdAndUpdate(id, updateData, { new: true });
    }
    const idx = localStore.requests.findIndex(r => r._id === id || r.id === id);
    if (idx !== -1) {
      localStore.requests[idx] = { ...localStore.requests[idx], ...updateData, updatedAt: new Date().toISOString() };
      saveLocalStore();
      return localStore.requests[idx];
    }
    return null;
  },

  // ================= INVENTORY TRANSACTIONS =================
  async recordTransaction(txData) {
    if (isMongoConnected) {
      const tx = new InventoryTransactionModel(txData);
      return await tx.save();
    }
    const newTx = {
      _id: generateId(),
      ...txData,
      timestamp: new Date().toISOString()
    };
    localStore.transactions.push(newTx);
    saveLocalStore();
    return newTx;
  },

  async getTransactions(limit = 100) {
    if (isMongoConnected) {
      return await InventoryTransactionModel.find().sort({ timestamp: -1 }).limit(limit);
    }
    return [...localStore.transactions].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, limit);
  },

  // ================= PROJECTS =================
  async getProjects() {
    if (isMongoConnected) {
      return await ProjectModel.find().sort({ createdAt: -1 });
    }
    return [...localStore.projects];
  },

  async createProject(data) {
    if (isMongoConnected) {
      const proj = new ProjectModel(data);
      return await proj.save();
    }
    const newProj = {
      _id: generateId(),
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    localStore.projects.push(newProj);
    saveLocalStore();
    return newProj;
  },

  async updateProject(id, updateData) {
    if (isMongoConnected) {
      return await ProjectModel.findByIdAndUpdate(id, updateData, { new: true });
    }
    const idx = localStore.projects.findIndex(p => p._id === id || p.id === id);
    if (idx !== -1) {
      localStore.projects[idx] = { ...localStore.projects[idx], ...updateData, updatedAt: new Date().toISOString() };
      saveLocalStore();
      return localStore.projects[idx];
    }
    return null;
  },

  // ================= MAINTENANCE =================
  async getMaintenanceTickets() {
    if (isMongoConnected) {
      return await MaintenanceTicketModel.find().sort({ createdAt: -1 });
    }
    return [...localStore.maintenance];
  },

  async createMaintenanceTicket(data) {
    if (isMongoConnected) {
      const ticket = new MaintenanceTicketModel(data);
      return await ticket.save();
    }
    const newTicket = {
      _id: generateId(),
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    localStore.maintenance.push(newTicket);
    saveLocalStore();
    return newTicket;
  },

  async updateMaintenanceTicket(id, updateData) {
    if (isMongoConnected) {
      return await MaintenanceTicketModel.findByIdAndUpdate(id, updateData, { new: true });
    }
    const idx = localStore.maintenance.findIndex(m => m._id === id || m.id === id);
    if (idx !== -1) {
      localStore.maintenance[idx] = { ...localStore.maintenance[idx], ...updateData, updatedAt: new Date().toISOString() };
      saveLocalStore();
      return localStore.maintenance[idx];
    }
    return null;
  },

  // ================= NOTIFICATIONS =================
  async getNotifications(userId, role) {
    if (isMongoConnected) {
      const query = { $or: [{ user: userId }, { userRole: role }, { userRole: 'ALL' }] };
      return await NotificationModel.find(query).sort({ createdAt: -1 }).limit(50);
    }
    return localStore.notifications
      .filter(n => !n.user || String(n.user) === String(userId) || n.userRole === role || n.userRole === 'ALL')
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  async createNotification(data) {
    if (isMongoConnected) {
      const notif = new NotificationModel(data);
      return await notif.save();
    }
    const newNotif = {
      _id: generateId(),
      ...data,
      isRead: false,
      createdAt: new Date().toISOString()
    };
    localStore.notifications.push(newNotif);
    saveLocalStore();
    return newNotif;
  },

  async markNotificationRead(id) {
    if (isMongoConnected) {
      return await NotificationModel.findByIdAndUpdate(id, { isRead: true });
    }
    const notif = localStore.notifications.find(n => n._id === id || n.id === id);
    if (notif) {
      notif.isRead = true;
      saveLocalStore();
    }
    return notif;
  },

  // ================= AUDIT LOGS =================
  async recordAuditLog(data) {
    if (isMongoConnected) {
      const log = new AuditLogModel(data);
      return await log.save();
    }
    const newLog = {
      _id: generateId(),
      ...data,
      timestamp: new Date().toISOString()
    };
    localStore.auditLogs.push(newLog);
    saveLocalStore();
    return newLog;
  },

  async getAuditLogs(limit = 100) {
    if (isMongoConnected) {
      return await AuditLogModel.find().sort({ timestamp: -1 }).limit(limit);
    }
    return [...localStore.auditLogs].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, limit);
  }
};
