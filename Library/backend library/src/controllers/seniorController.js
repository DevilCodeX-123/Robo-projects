import bcrypt from 'bcryptjs';
import { dataService } from '../services/dataService.js';

export const syncSeniorUserAccount = async ({ seniorName, email, phoneNumber, department, position, password, existingLinkedUserId }) => {
  const cleanEmail = email ? String(email).trim().toLowerCase() : '';
  const allUsers = await dataService.getUsers();

  let matchedUser = null;
  if (existingLinkedUserId) {
    matchedUser = await dataService.findUserById(existingLinkedUserId);
  }
  if (!matchedUser && cleanEmail) {
    matchedUser = await dataService.findUserByEmail(cleanEmail);
  }
  if (!matchedUser) {
    matchedUser = allUsers.find(u =>
      String(u.fullName || '').trim().toLowerCase() === String(seniorName || '').trim().toLowerCase() &&
      ['SENIOR', 'ADMIN', 'INVENTORY_MANAGER'].includes(String(u.role || '').toUpperCase())
    ) || null;
  }

  if (matchedUser) {
    const userId = matchedUser._id || matchedUser.id;
    const currentRole = String(matchedUser.role || '').toUpperCase();
    const nextRole = ['ADMIN', 'INVENTORY_MANAGER'].includes(currentRole) ? currentRole : 'SENIOR';
    const updates = {
      fullName: seniorName.trim(),
      role: nextRole,
      department: department.trim(),
      teamName: position.trim(),
      contactNumber: phoneNumber
    };
    if (password && String(password).length >= 6) {
      updates.passwordHash = await bcrypt.hash(String(password), 10);
    }
    const updatedUser = await dataService.updateUser(userId, updates);
    return {
      linkedUserId: String((updatedUser && (updatedUser._id || updatedUser.id)) || userId),
      userRole: nextRole,
      loginEmail: matchedUser.email
    };
  }

  // Create a dedicated SENIOR login account when an email is provided (or generate a club senior login if password was explicitly set)
  if (cleanEmail || (password && String(password).length >= 6)) {
    const slug = seniorName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '.').replace(/^\.+|\.+$/g, '') || 'senior';
    const loginEmail = cleanEmail || `${slug}.${Math.floor(100 + Math.random() * 900)}@robotics.club`;
    const rawPassword = password && String(password).length >= 6 ? String(password) : 'senior123';
    const passwordHash = await bcrypt.hash(rawPassword, 10);
    const createdUser = await dataService.createUser({
      fullName: seniorName.trim(),
      email: loginEmail,
      passwordHash,
      membershipId: `ROBO-SNR-${Math.floor(1000 + Math.random() * 9000)}`,
      department: department.trim(),
      academicYear: 'Senior Coordinator',
      teamName: position.trim(),
      role: 'SENIOR',
      contactNumber: phoneNumber,
      status: 'ACTIVE'
    });
    return {
      linkedUserId: String(createdUser._id || createdUser.id),
      userRole: 'SENIOR',
      loginEmail
    };
  }

  return { linkedUserId: existingLinkedUserId || '', userRole: null, loginEmail: null };
};

const validateAndNormalizePhone = (raw = '') => {
  const trimmed = String(raw).trim();
  if (!/^\+?[\d\s\-()]{10,20}$/.test(trimmed)) {
    return { valid: false, message: 'Phone number must contain 10 to 15 digits (e.g. +91 98765 43210 or 9876543210).' };
  }
  const digits = trimmed.replace(/\D/g, '');
  if (digits.length < 10 || digits.length > 15) {
    return { valid: false, message: 'Phone number must have between 10 and 15 digits.' };
  }
  const normalizedPhone = digits.length > 10 ? digits.slice(-10) : digits;
  return { valid: true, phoneNumber: trimmed, normalizedPhone };
};

const isValidOptionalEmail = (email = '') => {
  const trimmed = String(email).trim();
  if (!trimmed) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
};

export const getSeniors = async (req, res) => {
  try {
    const { search } = req.query;
    const seniors = await dataService.getSeniors({ search });
    res.json({ success: true, count: seniors.length, seniors });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getSeniorById = async (req, res) => {
  try {
    const senior = await dataService.getSeniorById(req.params.id);
    if (!senior) {
      return res.status(404).json({ success: false, message: 'Senior record not found' });
    }
    res.json({ success: true, senior });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createSenior = async (req, res) => {
  try {
    const { fullName, phoneNumber, email, department, position, responsibilities, password } = req.body;

    if (!fullName || !fullName.trim()) {
      return res.status(400).json({ success: false, message: 'Senior full name is required.' });
    }
    if (!phoneNumber || !phoneNumber.trim()) {
      return res.status(400).json({ success: false, message: 'Phone number is required.' });
    }
    if (!department || !department.trim()) {
      return res.status(400).json({ success: false, message: 'Department / Branch is required.' });
    }
    if (!position || !position.trim()) {
      return res.status(400).json({ success: false, message: 'Position / Role is required.' });
    }

    const phoneCheck = validateAndNormalizePhone(phoneNumber);
    if (!phoneCheck.valid) {
      return res.status(400).json({ success: false, message: phoneCheck.message });
    }

    const cleanEmail = email ? String(email).trim().toLowerCase() : '';
    if (!isValidOptionalEmail(cleanEmail)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
    }

    if (password && String(password).length > 0 && String(password).length < 6) {
      return res.status(400).json({ success: false, message: 'Login password must be at least 6 characters.' });
    }

    const duplicate = await dataService.findDuplicateSenior({
      normalizedPhone: phoneCheck.normalizedPhone,
      email: cleanEmail
    });
    if (duplicate) {
      return res.status(409).json({
        success: false,
        message: `Duplicate senior record: "${duplicate.fullName}" is already registered with this phone number or email.`
      });
    }

    const accountSync = await syncSeniorUserAccount({
      seniorName: fullName,
      email: cleanEmail,
      phoneNumber: phoneCheck.phoneNumber,
      department,
      position,
      password
    });

    const newSenior = await dataService.createSenior({
      fullName: fullName.trim(),
      phoneNumber: phoneCheck.phoneNumber,
      normalizedPhone: phoneCheck.normalizedPhone,
      email: cleanEmail || accountSync.loginEmail || '',
      department: department.trim(),
      position: position.trim(),
      responsibilities: responsibilities ? String(responsibilities).trim() : '',
      linkedUserId: accountSync.linkedUserId || '',
      status: 'ACTIVE'
    });

    await dataService.recordAuditLog({
      user: req.user?._id || req.user?.id,
      userName: req.user?.fullName || 'System User',
      userRole: req.user?.role || 'ADMIN',
      action: 'SENIOR_CREATED',
      entityType: 'SENIOR',
      entityId: String(newSenior._id || newSenior.id),
      details: {
        fullName: newSenior.fullName,
        department: newSenior.department,
        position: newSenior.position,
        linkedUserId: accountSync.linkedUserId || null
      }
    });

    res.status(201).json({
      success: true,
      senior: newSenior,
      linkedAccount: accountSync.linkedUserId
        ? { userId: accountSync.linkedUserId, role: accountSync.userRole, email: accountSync.loginEmail }
        : null
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateSenior = async (req, res) => {
  try {
    const { id } = req.params;
    const current = await dataService.getSeniorById(id);
    if (!current) {
      return res.status(404).json({ success: false, message: 'Senior record not found.' });
    }

    const { fullName, phoneNumber, email, department, position, responsibilities, password } = req.body;

    if (!fullName || !fullName.trim()) {
      return res.status(400).json({ success: false, message: 'Senior full name is required.' });
    }
    if (!phoneNumber || !phoneNumber.trim()) {
      return res.status(400).json({ success: false, message: 'Phone number is required.' });
    }
    if (!department || !department.trim()) {
      return res.status(400).json({ success: false, message: 'Department / Branch is required.' });
    }
    if (!position || !position.trim()) {
      return res.status(400).json({ success: false, message: 'Position / Role is required.' });
    }

    const phoneCheck = validateAndNormalizePhone(phoneNumber);
    if (!phoneCheck.valid) {
      return res.status(400).json({ success: false, message: phoneCheck.message });
    }

    const cleanEmail = email ? String(email).trim().toLowerCase() : '';
    if (!isValidOptionalEmail(cleanEmail)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
    }

    if (password && String(password).length > 0 && String(password).length < 6) {
      return res.status(400).json({ success: false, message: 'Login password must be at least 6 characters.' });
    }

    const duplicate = await dataService.findDuplicateSenior(
      { normalizedPhone: phoneCheck.normalizedPhone, email: cleanEmail },
      id
    );
    if (duplicate) {
      return res.status(409).json({
        success: false,
        message: `Duplicate senior record: "${duplicate.fullName}" already uses this phone number or email.`
      });
    }

    const accountSync = await syncSeniorUserAccount({
      seniorName: fullName,
      email: cleanEmail,
      phoneNumber: phoneCheck.phoneNumber,
      department,
      position,
      password,
      existingLinkedUserId: current.linkedUserId
    });

    const updated = await dataService.updateSenior(id, {
      fullName: fullName.trim(),
      phoneNumber: phoneCheck.phoneNumber,
      normalizedPhone: phoneCheck.normalizedPhone,
      email: cleanEmail || accountSync.loginEmail || '',
      department: department.trim(),
      position: position.trim(),
      responsibilities: responsibilities !== undefined ? String(responsibilities).trim() : current.responsibilities,
      linkedUserId: accountSync.linkedUserId || current.linkedUserId || ''
    });

    await dataService.recordAuditLog({
      user: req.user?._id || req.user?.id,
      userName: req.user?.fullName || 'System User',
      userRole: req.user?.role || 'ADMIN',
      action: 'SENIOR_UPDATED',
      entityType: 'SENIOR',
      entityId: String(id),
      details: { fullName: updated.fullName, department: updated.department, linkedUserId: updated.linkedUserId || null }
    });

    res.json({ success: true, senior: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteSenior = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await dataService.deleteSenior(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Senior record not found.' });
    }

    await dataService.recordAuditLog({
      user: req.user?._id || req.user?.id,
      userName: req.user?.fullName || 'System User',
      userRole: req.user?.role || 'ADMIN',
      action: 'SENIOR_DELETED',
      entityType: 'SENIOR',
      entityId: String(id),
      details: { fullName: deleted.fullName }
    });

    res.json({ success: true, message: 'Senior deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

