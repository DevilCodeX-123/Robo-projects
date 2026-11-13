import bcrypt from 'bcryptjs';
import { dataService } from '../services/dataService.js';

export const getUsers = async (req, res) => {
  try {
    const users = await dataService.getUsers();
    res.json({ success: true, count: users.length, users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['MEMBER', 'SENIOR', 'INVENTORY_MANAGER', 'ADMIN'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role specified' });
    }

    const updated = await dataService.updateUser(id, { role });
    if (!updated) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await dataService.recordAuditLog({
      user: req.user._id || req.user.id,
      userName: req.user.fullName,
      userRole: req.user.role,
      action: 'USER_ROLE_UPDATED',
      entityType: 'USER',
      entityId: String(id),
      details: { newRole: role }
    });

    res.json({ success: true, user: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await dataService.findUserById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const newStatus = user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    const updated = await dataService.updateUser(id, { status: newStatus });

    await dataService.recordAuditLog({
      user: req.user._id || req.user.id,
      userName: req.user.fullName,
      userRole: req.user.role,
      action: 'USER_STATUS_TOGGLED',
      entityType: 'USER',
      entityId: String(id),
      details: { newStatus }
    });

    res.json({ success: true, user: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createStudentUser = async (req, res) => {
  try {
    const { fullName, email, password, department, academicYear, teamName, contactNumber } = req.body;
    if (!fullName || !email) {
      return res.status(400).json({ success: false, message: 'Full name and email are required.' });
    }
    const cleanEmail = email.trim().toLowerCase();
    const existing = await dataService.findUserByEmail(cleanEmail);
    if (existing) {
      return res.status(409).json({ success: false, message: `An account with email "${cleanEmail}" already exists.` });
    }

    const rawPass = password && String(password).length >= 6 ? String(password) : 'password123';
    const passwordHash = await bcrypt.hash(rawPass, 10);
    const membershipId = `ROBO-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

    const created = await dataService.createUser({
      fullName: fullName.trim(),
      email: cleanEmail,
      passwordHash,
      membershipId,
      department: department?.trim() || 'Robotics & Automation',
      academicYear: academicYear?.trim() || '1st Year',
      teamName: teamName?.trim() || 'Student Member',
      contactNumber: contactNumber?.trim() || '',
      role: 'MEMBER',
      status: 'ACTIVE'
    });

    await dataService.recordAuditLog({
      user: req.user._id || req.user.id,
      userName: req.user.fullName,
      userRole: req.user.role,
      action: 'STUDENT_CREATED',
      entityType: 'USER',
      entityId: String(created._id || created.id),
      details: { email: created.email, fullName: created.fullName, membershipId }
    });

    res.status(201).json({ success: true, user: created });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteStudentUser = async (req, res) => {
  try {
    const { id } = req.params;
    const target = await dataService.findUserById(id);
    if (!target) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    if (String(target.role || '').toUpperCase() === 'ADMIN' && String(target._id || target.id) === String(req.user._id || req.user.id)) {
      return res.status(400).json({ success: false, message: 'Cannot delete your own administrator account.' });
    }

    const deleted = await dataService.deleteUser(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Could not delete user record.' });
    }

    await dataService.recordAuditLog({
      user: req.user._id || req.user.id,
      userName: req.user.fullName,
      userRole: req.user.role,
      action: 'USER_DELETED',
      entityType: 'USER',
      entityId: String(id),
      details: { email: target.email, fullName: target.fullName, role: target.role }
    });

    res.json({ success: true, message: `User "${target.fullName}" deleted successfully.` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
