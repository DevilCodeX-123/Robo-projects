import bcrypt from 'bcryptjs';
import { dataService } from '../services/dataService.js';
import { generateToken } from '../middleware/authMiddleware.js';

const DEFAULT_PREFERENCES = {
  newRequestNotif: true,
  approvalNotif: true,
  rejectionNotif: true,
  pendingReminder: true,
  returnReminderDays: 2,
  smsAlerts: true
};

const formatUserResponse = (user) => ({
  id: user._id || user.id,
  fullName: user.fullName,
  email: user.email,
  membershipId: user.membershipId,
  department: user.department,
  academicYear: user.academicYear,
  teamName: user.teamName,
  contactNumber: user.contactNumber || '',
  role: String(user.role || 'MEMBER').toUpperCase(),
  status: user.status,
  preferences: { ...DEFAULT_PREFERENCES, ...(user.preferences || {}) }
});

export const register = async (req, res) => {
  try {
    const { fullName, email, password, membershipId, department, academicYear, teamName, contactNumber } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide full name, email and password' });
    }

    const existingUser = await dataService.findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const generatedMemberId = membershipId || `ROBO-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

    // Public self-registration always assigns student MEMBER role (never ADMIN/SENIOR directly)
    const user = await dataService.createUser({
      fullName,
      email,
      passwordHash,
      membershipId: generatedMemberId,
      department: department || 'Robotics & Automation',
      academicYear: academicYear || '2nd Year',
      teamName: teamName || 'Robotics Core',
      contactNumber: contactNumber || '',
      role: 'MEMBER',
      status: 'ACTIVE'
    });

    const token = generateToken(user._id || user.id, user.role);

    await dataService.recordAuditLog({
      user: user._id || user.id,
      userName: user.fullName,
      userRole: user.role,
      action: 'USER_REGISTERED',
      entityType: 'USER',
      entityId: String(user._id || user.id),
      details: { email: user.email, membershipId: user.membershipId }
    });

    res.status(201).json({
      success: true,
      token,
      user: formatUserResponse(user)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please enter email and password' });
    }

    const user = await dataService.findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (user.status === 'SUSPENDED') {
      return res.status(403).json({ success: false, message: 'Your account is suspended. Please contact lab admin.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const token = generateToken(user._id || user.id, user.role);

    await dataService.recordAuditLog({
      user: user._id || user.id,
      userName: user.fullName,
      userRole: user.role,
      action: 'USER_LOGIN',
      entityType: 'USER',
      entityId: String(user._id || user.id)
    });

    res.json({
      success: true,
      token,
      user: formatUserResponse(user)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getProfile = async (req, res) => {
  try {
    res.json({
      success: true,
      user: formatUserResponse(req.user)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { fullName, email, membershipId, department, academicYear, teamName, contactNumber } = req.body;

    if (!fullName || !fullName.trim()) {
      return res.status(400).json({ success: false, message: 'Full name is required.' });
    }

    const updateFields = {
      fullName: fullName.trim(),
      department: department !== undefined ? String(department).trim() : req.user.department,
      academicYear: academicYear !== undefined ? String(academicYear).trim() : req.user.academicYear,
      teamName: teamName !== undefined ? String(teamName).trim() : req.user.teamName,
      contactNumber: contactNumber !== undefined ? String(contactNumber).trim() : req.user.contactNumber
    };

    if (email && email.trim()) {
      updateFields.email = email.trim().toLowerCase();
    }
    if (membershipId && membershipId.trim()) {
      updateFields.membershipId = membershipId.trim();
    }

    const updated = await dataService.updateUser(userId, updateFields);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      user: formatUserResponse(updated)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updatePreferences = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const currentPrefs = req.user.preferences || {};
    const {
      newRequestNotif,
      approvalNotif,
      rejectionNotif,
      pendingReminder,
      returnReminderDays,
      smsAlerts
    } = req.body;

    const nextPrefs = {
      ...DEFAULT_PREFERENCES,
      ...currentPrefs,
      ...(typeof newRequestNotif === 'boolean' ? { newRequestNotif } : {}),
      ...(typeof approvalNotif === 'boolean' ? { approvalNotif } : {}),
      ...(typeof rejectionNotif === 'boolean' ? { rejectionNotif } : {}),
      ...(typeof pendingReminder === 'boolean' ? { pendingReminder } : {}),
      ...(typeof smsAlerts === 'boolean' ? { smsAlerts } : {}),
      ...(returnReminderDays !== undefined
        ? { returnReminderDays: Math.min(7, Math.max(1, Number(returnReminderDays) || 2)) }
        : {})
    };

    const updated = await dataService.updateUser(userId, { preferences: nextPrefs });
    if (!updated) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      preferences: nextPrefs,
      user: formatUserResponse(updated)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const changePassword = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current password and new password are required.' });
    }
    if (String(newPassword).length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });
    }

    const user = await dataService.findUserById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const matches = await bcrypt.compare(String(currentPassword), user.passwordHash);
    if (!matches) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
    }

    const passwordHash = await bcrypt.hash(String(newPassword), 10);
    await dataService.updateUser(userId, { passwordHash });

    await dataService.recordAuditLog({
      user: userId,
      userName: user.fullName,
      userRole: user.role,
      action: 'PASSWORD_CHANGED',
      entityType: 'USER',
      entityId: String(userId)
    });

    res.json({ success: true, message: 'Password updated successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getDemoAccounts = async (req, res) => {
  try {
    if (process.env.ENABLE_DEMO_AUTH === 'false') {
      return res.json({ success: true, demoEnabled: false, demoAccounts: [] });
    }

    const users = await dataService.getUsers();
    const mapAccount = (u) => ({
      ...formatUserResponse(u),
      token: generateToken(u._id || u.id, String(u.role || 'MEMBER').toUpperCase())
    });

    const seen = new Set();
    const demoAccounts = [];

    // Two primary roles: Student (MEMBER) and Admin (ADMIN)
    for (const targetRole of ['MEMBER', 'ADMIN']) {
      const matches = users.filter(u => u.role === targetRole && u.status !== 'SUSPENDED').slice(0, 1);

      for (const u of matches) {
        const uid = String(u._id || u.id);
        if (!seen.has(uid)) {
          seen.add(uid);
          demoAccounts.push(mapAccount(u));
        }
      }
    }

    res.json({ success: true, demoEnabled: true, demoAccounts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
