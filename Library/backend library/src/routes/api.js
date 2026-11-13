import express from 'express';
import { register, login, getProfile, updateProfile, updatePreferences, changePassword, getDemoAccounts } from '../controllers/authController.js';
import { getComponents, getComponentById, createComponent, bulkCreateComponents, updateComponent, restoreComponent, archiveComponent } from '../controllers/componentController.js';
import { createRequest, getRequests, getRequestById, reviewRequest, cancelRequest } from '../controllers/requestController.js';
import { issueRequest, processReturn, adjustStock, getTransactions, exportCSV } from '../controllers/inventoryController.js';
import { getProjects, createProject, updateProject } from '../controllers/projectController.js';
import { getMaintenanceTickets, createMaintenanceTicket, updateMaintenanceTicket } from '../controllers/maintenanceController.js';
import { getAnalytics } from '../controllers/analyticsController.js';
import { getUsers, createStudentUser, updateUserRole, toggleUserStatus, deleteStudentUser } from '../controllers/userController.js';
import { getSeniors, getSeniorById, createSenior, updateSenior, deleteSenior } from '../controllers/seniorController.js';
import { getNotifications, markAsRead, getAuditLogs, runReturnReminders } from '../controllers/notificationController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// ================= AUTH ROUTES =================
router.post('/auth/register', register);
router.post('/auth/login', login);
router.get('/auth/profile', protect, getProfile);
router.put('/auth/profile', protect, updateProfile);
router.put('/auth/preferences', protect, updatePreferences);
router.put('/auth/password', protect, changePassword);
router.get('/auth/demo-accounts', getDemoAccounts);

// ================= COMPONENT ROUTES =================
router.get('/components', getComponents);
router.post('/components/bulk', protect, authorize('INVENTORY_MANAGER', 'ADMIN'), bulkCreateComponents);
router.get('/components/:id', getComponentById);
router.post('/components', protect, authorize('INVENTORY_MANAGER', 'ADMIN'), createComponent);
router.put('/components/:id/restore', protect, authorize('INVENTORY_MANAGER', 'ADMIN'), restoreComponent);
router.put('/components/:id', protect, authorize('INVENTORY_MANAGER', 'ADMIN'), updateComponent);
router.delete('/components/:id', protect, authorize('INVENTORY_MANAGER', 'ADMIN'), archiveComponent);

// ================= REQUEST ROUTES =================
router.get('/requests', protect, getRequests);
router.get('/requests/:id', protect, getRequestById);
router.post('/requests', protect, createRequest);
router.post('/requests/:id/review', protect, authorize('SENIOR', 'ADMIN'), reviewRequest);
router.post('/requests/:id/cancel', protect, cancelRequest);

// ================= INVENTORY & LEDGER ROUTES =================
router.post('/inventory/issue/:id', protect, authorize('SENIOR', 'INVENTORY_MANAGER', 'ADMIN'), issueRequest);
router.post('/inventory/return/:id', protect, processReturn);
router.post('/inventory/adjust', protect, authorize('INVENTORY_MANAGER', 'ADMIN'), adjustStock);
router.get('/inventory/transactions', protect, authorize('INVENTORY_MANAGER', 'ADMIN', 'SENIOR'), getTransactions);
router.get('/inventory/export', protect, authorize('INVENTORY_MANAGER', 'ADMIN'), exportCSV);

// ================= PROJECT ROUTES =================
router.get('/projects', protect, getProjects);
router.post('/projects', protect, createProject);
router.put('/projects/:id', protect, updateProject);

// ================= MAINTENANCE ROUTES =================
router.get('/maintenance', protect, getMaintenanceTickets);
router.post('/maintenance', protect, createMaintenanceTicket);
router.put('/maintenance/:id', protect, authorize('INVENTORY_MANAGER', 'ADMIN'), updateMaintenanceTicket);

// ================= ANALYTICS =================
router.get('/analytics', protect, getAnalytics);

// ================= SENIOR MANAGEMENT =================
router.get('/seniors', protect, getSeniors);
router.get('/seniors/:id', protect, getSeniorById);
router.post('/seniors', protect, authorize('ADMIN'), createSenior);
router.put('/seniors/:id', protect, authorize('ADMIN'), updateSenior);
router.delete('/seniors/:id', protect, authorize('ADMIN'), deleteSenior);

// ================= USER MANAGEMENT =================
router.get('/users', protect, authorize('ADMIN', 'SENIOR'), getUsers);
router.post('/users', protect, authorize('ADMIN'), createStudentUser);
router.put('/users/:id/role', protect, authorize('ADMIN'), updateUserRole);
router.put('/users/:id/status', protect, authorize('ADMIN'), toggleUserStatus);
router.delete('/users/:id', protect, authorize('ADMIN'), deleteStudentUser);

// ================= NOTIFICATIONS & AUDIT =================
router.get('/notifications', protect, getNotifications);
router.put('/notifications/:id/read', protect, markAsRead);
router.post('/notifications/run-reminders', protect, authorize('ADMIN', 'SENIOR', 'INVENTORY_MANAGER'), runReturnReminders);
router.get('/audit-logs', protect, authorize('ADMIN'), getAuditLogs);

export default router;
