// RC-TEAMS Storage Service — v3
// All keys under 'rcteams_' prefix. Includes Daily Attendance, Tasks, Inventory Requests, Events, Notifications & Announcements.

const KEY = (k) => `rcteams_${k}`;
const uid = (p) => `${p}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

const get = (key, def = null) => {
  try {
    const v = localStorage.getItem(KEY(key));
    return v === null ? def : JSON.parse(v);
  } catch { return def; }
};

const set = (key, value) => {
  localStorage.setItem(KEY(key), JSON.stringify(value));
};

const remove = (key) => localStorage.removeItem(KEY(key));

export const storage = {
  // ── Theme ──────────────────────────────────────────────
  getTheme: () => get('theme', 'light'),
  setTheme: (t) => set('theme', t),

  // ── Active Session ─────────────────────────────────────
  getActiveUser: () => get('active_user', null),
  setActiveUser: (u) => set('active_user', u),
  clearActiveUser: () => remove('active_user'),

  // ── Credentials ────────────────────────────────────────
  getCredentials: () => get('credentials', {}),
  setCredentials: (c) => set('credentials', c),

  // ── Members ────────────────────────────────────────────
  getMembers: () => get('members', []),
  setMembers: (m) => set('members', m),

  getPending: () => get('pending', []),
  setPending: (p) => set('pending', p),

  // ── Teams ──────────────────────────────────────────────
  getTeams: () => get('teams', []),
  setTeams: (t) => set('teams', t),

  // ── Inventory ──────────────────────────────────────────
  getInventory: () => get('inventory', []),
  setInventory: (i) => set('inventory', i),

  getIssuedItems: () => get('issued_items', []),
  setIssuedItems: (i) => set('issued_items', i),

  // ── Inventory Requests (Workflow: Pending -> Approved/Rejected -> Issued -> Returned) ──
  getInventoryRequests: () => get('inventory_requests', []),
  setInventoryRequests: (r) => set('inventory_requests', r),

  // ── Attendance (Daily-based) ───────────────────────────
  getDailyAttendance: () => get('daily_attendance', []),
  setDailyAttendance: (r) => set('daily_attendance', r),

  getTeamAttendance: () => get('team_attendance', []),
  setTeamAttendance: (r) => set('team_attendance', r),

  getVisitorAttendance: () => get('visitor_attendance', []),
  setVisitorAttendance: (r) => set('visitor_attendance', r),

  // ── Projects & Tasks ───────────────────────────────────
  getProjects: () => get('projects', []),
  setProjects: (p) => set('projects', p),

  getTasks: (projectId = null) => {
    const all = get('project_tasks', []);
    return projectId ? all.filter(t => t.projectId === projectId) : all;
  },
  setTasks: (tasks) => set('project_tasks', tasks),

  // ── Events & Calendar ──────────────────────────────────
  getEvents: () => get('club_events', []),
  setEvents: (e) => set('club_events', e),

  // ── Announcements & Notifications ──────────────────────
  getAnnouncements: () => get('announcements', []),
  setAnnouncements: (a) => set('announcements', a),

  getNotifications: () => get('notifications', []),
  setNotifications: (n) => set('notifications', n),

  // ── Treasury ───────────────────────────────────────────
  getTreasury: () => get('treasury', {
    balance: '45,000', label: 'Treasury Balance', notes: 'Sponsorships & Component Pool',
    lastEditedBy: null, lastEditedAt: null
  }),
  setTreasury: (t) => set('treasury', t),

  // ── Migration flag ─────────────────────────────────────
  getMigrated: () => get('v2_migrated', false),
  setMigrated: () => set('v2_migrated', true),

  // ── Auth & Member Operations ───────────────────────────
  registerUser(userData) {
    const { name, email, clubTag, academicYear, branch, rollNumber, password } = userData;
    const pending = this.getPending();
    const members = this.getMembers();
    const creds = this.getCredentials();
    const el = email.toLowerCase().trim();
    const rn = rollNumber?.trim().toUpperCase() || '';

    if (members.some(m => m.email?.toLowerCase() === el) ||
        pending.some(p => p.email?.toLowerCase() === el) ||
        creds[el]) {
      return { success: false, message: 'Email address is already registered.' };
    }
    if (rn && (members.some(m => m.rollNumber?.toUpperCase() === rn) ||
               pending.some(p => p.rollNumber?.toUpperCase() === rn))) {
      return { success: false, message: 'Roll number is already registered.' };
    }

    const newPending = {
      id: uid('p'),
      name: name.trim(), email: email.trim(),
      clubTag: clubTag?.trim() || 'Team Member',
      academicYear: academicYear || '1st yr',
      branch: branch?.trim() || '', rollNumber: rn,
      status: 'Pending',
      registeredAt: new Date().toISOString()
    };
    pending.push(newPending);
    this.setPending(pending);

    creds[el] = { password, isAdmin: false, temp: true, pendingId: newPending.id };
    this.setCredentials(creds);

    // Notify admins of new registration
    this.addNotification({
      type: 'member',
      title: 'New Member Registration',
      message: `${newPending.name} (${newPending.rollNumber}) requested portal access.`,
      targetRole: 'admin',
      link: 'members'
    });

    return { success: true, message: 'Registration submitted! Awaiting administrator approval.' };
  },

  createAdminAccount(userData) {
    const members = this.getMembers();
    if (members.length > 0) {
      return { success: false, message: 'Admin account already exists.' };
    }
    const { name, email, clubTag, academicYear, branch, rollNumber, password } = userData;
    const el = email.toLowerCase().trim();
    const rn = rollNumber?.trim().toUpperCase() || '';

    const admin = {
      id: uid('m'),
      name: name.trim(), email: email.trim(),
      clubTag: clubTag?.trim() || 'Club Lead',
      academicYear: academicYear || '4th yr',
      branch: branch?.trim() || 'Robotics',
      rollNumber: rn,
      status: 'Active', isAdmin: true, teamId: null,
      approvedAt: new Date().toISOString(),
      registeredAt: new Date().toISOString()
    };
    members.push(admin);
    this.setMembers(members);

    const creds = this.getCredentials();
    creds[el] = { password, isAdmin: true, memberId: admin.id, temp: false };
    this.setCredentials(creds);

    return { success: true, user: admin };
  },

  addMemberByAdmin(memberData) {
    const members = this.getMembers();
    const creds = this.getCredentials();
    const el = memberData.email.toLowerCase().trim();
    const rn = memberData.rollNumber?.trim().toUpperCase() || '';

    if (members.some(m => m.email?.toLowerCase() === el) || creds[el]) {
      return { success: false, message: 'Email address already exists.' };
    }
    if (rn && members.some(m => m.rollNumber?.toUpperCase() === rn)) {
      return { success: false, message: 'Roll number already exists.' };
    }

    const newMember = {
      id: uid('m'),
      name: memberData.name.trim(),
      email: el,
      rollNumber: rn,
      branch: memberData.branch?.trim() || '',
      academicYear: memberData.academicYear || '1st yr',
      clubTag: memberData.clubTag?.trim() || 'Team Member',
      teamId: memberData.teamId || null,
      status: memberData.status || 'Active',
      isAdmin: Boolean(memberData.isAdmin),
      registeredAt: new Date().toISOString(),
      approvedAt: new Date().toISOString()
    };
    members.push(newMember);
    this.setMembers(members);

    const password = memberData.password?.trim() || 'welcome123';
    creds[el] = { password, isAdmin: newMember.isAdmin, memberId: newMember.id, temp: false };
    this.setCredentials(creds);

    return { success: true, member: newMember };
  },

  loginUser(email, password) {
    const el = email.toLowerCase().trim();
    const creds = this.getCredentials();

    if (!creds[el] || creds[el].password !== password) {
      return { success: false, message: 'Invalid email or password.' };
    }
    if (creds[el].temp) {
      return { success: false, message: 'Your account is pending administrator approval.' };
    }

    const member = this.getMembers().find(m => m.id === creds[el].memberId);
    if (!member) return { success: false, message: 'Member profile not found. Contact admin.' };
    if (member.status === 'Inactive') {
      return { success: false, message: 'Your account is inactive. Contact the administrator.' };
    }

    return { success: true, user: { ...member, isAdmin: creds[el].isAdmin } };
  },

  approveMember(pendingId) {
    const pending = this.getPending();
    const members = this.getMembers();
    const creds = this.getCredentials();
    const person = pending.find(p => p.id === pendingId);
    if (!person) return { success: false, message: 'Record not found.' };

    const newMember = {
      id: uid('m'),
      name: person.name, email: person.email,
      clubTag: person.clubTag || 'Team Member', academicYear: person.academicYear || '',
      branch: person.branch || '', rollNumber: person.rollNumber || '',
      status: 'Active', isAdmin: false, teamId: null,
      approvedAt: new Date().toISOString(),
      registeredAt: person.registeredAt
    };
    members.push(newMember);
    this.setMembers(members);
    this.setPending(pending.filter(p => p.id !== pendingId));

    const el = person.email.toLowerCase();
    if (creds[el]) {
      creds[el] = { ...creds[el], memberId: newMember.id, temp: false };
      this.setCredentials(creds);
    }

    this.addNotification({
      userId: newMember.id,
      type: 'system',
      title: 'Membership Approved',
      message: 'Welcome to RC-TEAMS! Your club membership has been approved.',
      link: 'overview'
    });

    return { success: true, member: newMember };
  },

  declineMember(pendingId) {
    const pending = this.getPending();
    const person = pending.find(p => p.id === pendingId);
    if (!person) return { success: false };
    this.setPending(pending.filter(p => p.id !== pendingId));
    const creds = this.getCredentials();
    const el = person.email.toLowerCase();
    if (creds[el]?.temp) { delete creds[el]; this.setCredentials(creds); }
    return { success: true };
  },

  updateMember(memberId, updates) {
    const members = this.getMembers();
    const idx = members.findIndex(m => m.id === memberId);
    if (idx === -1) return { success: false, message: 'Member not found.' };

    const currentMember = members[idx];

    // PROTECTION: Prevent demoting or deactivating the last active Admin
    const isCurrentlyActiveAdmin = currentMember.isAdmin && currentMember.status === 'Active';
    const willBeDemotedOrInactive = updates.isAdmin === false || updates.status === 'Inactive';

    if (isCurrentlyActiveAdmin && willBeDemotedOrInactive) {
      const activeAdmins = members.filter(m => m.isAdmin && m.status === 'Active' && m.id !== memberId);
      if (activeAdmins.length === 0) {
        return {
          success: false,
          message: 'Action blocked: Cannot demote or deactivate the last remaining active Administrator.'
        };
      }
    }

    // If email is changing, update credentials too
    if (updates.email && updates.email !== currentMember.email) {
      const creds = this.getCredentials();
      const oldEl = currentMember.email.toLowerCase();
      const newEl = updates.email.toLowerCase();
      if (creds[oldEl]) {
        creds[newEl] = { ...creds[oldEl] };
        delete creds[oldEl];
        this.setCredentials(creds);
      }
    }

    // Sync admin status to credentials if specified
    if (updates.isAdmin !== undefined) {
      const creds = this.getCredentials();
      const el = (updates.email || currentMember.email).toLowerCase();
      if (creds[el]) {
        creds[el].isAdmin = Boolean(updates.isAdmin);
        this.setCredentials(creds);
      }
    }

    members[idx] = { ...currentMember, ...updates, updatedAt: new Date().toISOString() };
    this.setMembers(members);

    // If updating current active user session
    const activeUser = this.getActiveUser();
    if (activeUser && activeUser.id === memberId) {
      this.setActiveUser({ ...activeUser, ...members[idx] });
    }

    return { success: true, member: members[idx] };
  },

  updateCredentials(oldEmail, newEmail, newPassword) {
    const creds = this.getCredentials();
    const members = this.getMembers();
    const oel = oldEmail.toLowerCase();
    const nel = newEmail.toLowerCase();

    if (nel !== oel && creds[nel]) {
      return { success: false, message: 'New email address is already in use.' };
    }
    const userCred = creds[oel];
    if (!userCred) return { success: false, message: 'Credentials not found.' };

    delete creds[oel];
    creds[nel] = { ...userCred, password: newPassword || userCred.password };
    this.setCredentials(creds);

    const updatedMembers = members.map(m =>
      m.id === userCred.memberId ? { ...m, email: newEmail } : m
    );
    this.setMembers(updatedMembers);
    const updatedUser = updatedMembers.find(m => m.id === userCred.memberId);
    if (updatedUser) this.setActiveUser({ ...updatedUser, isAdmin: userCred.isAdmin });
    return { success: true, user: updatedUser ? { ...updatedUser, isAdmin: userCred.isAdmin } : null };
  },

  // ── DAILY ATTENDANCE (Strictly Daily-Based) ───────────────────
  // Data structure: attendanceId, memberId, date, status (Present / Absent / Leave),
  // markedBy, markedAt, updatedBy, updatedAt, history: [{ status, updatedBy, updatedAt, reason }]
  markDailyAttendance({ memberId, date, status, markedBy, reason = '' }) {
    if (!memberId || !date || !status) {
      return { success: false, message: 'Member ID, date, and status are required.' };
    }
    const all = this.getDailyAttendance();
    const now = new Date().toISOString();
    const cleanDate = date.split('T')[0]; // Ensure YYYY-MM-DD
    const existingIdx = all.findIndex(r => r.memberId === memberId && r.date === cleanDate);

    if (existingIdx !== -1) {
      // Edit / Correct existing record without creating duplicate
      const existing = all[existingIdx];
      const previousStatus = existing.status;

      // Only push to history if status actually changed or reason provided
      const historyEntry = {
        fromStatus: previousStatus,
        toStatus: status,
        updatedBy: markedBy || 'Admin',
        updatedAt: now,
        reason: reason || 'Status updated by Admin'
      };

      all[existingIdx] = {
        ...existing,
        status,
        updatedBy: markedBy || 'Admin',
        updatedAt: now,
        history: [...(existing.history || []), historyEntry]
      };
      this.setDailyAttendance(all);
      return { success: true, record: all[existingIdx], updated: true };
    }

    // New record for this date
    const newRecord = {
      attendanceId: uid('att'),
      memberId,
      date: cleanDate,
      status, // 'Present' | 'Absent' | 'Leave'
      markedBy: markedBy || 'Admin',
      markedAt: now,
      updatedBy: null,
      updatedAt: null,
      history: []
    };
    all.push(newRecord);
    this.setDailyAttendance(all);
    return { success: true, record: newRecord, created: true };
  },

  bulkMarkDailyAttendance(date, status, memberIds, markedBy) {
    const cleanDate = date.split('T')[0];
    memberIds.forEach(id => {
      this.markDailyAttendance({ memberId: id, date: cleanDate, status, markedBy });
    });
    return { success: true };
  },

  getDailyAttendanceByDate(date) {
    const cleanDate = date.split('T')[0];
    const all = this.getDailyAttendance();
    return all.filter(r => r.date === cleanDate);
  },

  getMemberDailyAttendance(memberId) {
    const all = this.getDailyAttendance();
    return all
      .filter(r => r.memberId === memberId)
      .sort((a, b) => b.date.localeCompare(a.date));
  },

  computeMemberAttendanceStats(memberId) {
    const records = this.getMemberDailyAttendance(memberId);
    const present = records.filter(r => r.status === 'Present').length;
    const absent = records.filter(r => r.status === 'Absent').length;
    const leave = records.filter(r => r.status === 'Leave').length;
    const eligibleDays = present + absent; // Leave excluded from denominator per prompt rules

    let percentage = 'N/A';
    if (eligibleDays > 0) {
      percentage = Math.round((present / eligibleDays) * 100);
    }

    return {
      totalRecords: records.length,
      presentDays: present,
      absentDays: absent,
      leaveDays: leave,
      eligibleDays,
      percentage
    };
  },

  // Visitor Attendance
  addVisitorAttendance(data) {
    const records = this.getVisitorAttendance();
    const cleanDate = (data.date || new Date().toISOString()).split('T')[0];
    const rec = {
      id: uid('va'),
      name: data.name.trim(),
      email: data.email?.trim() || '',
      phone: data.phone?.trim() || '',
      purpose: data.purpose?.trim() || 'Club Visit / Inquiry',
      date: cleanDate,
      recordedBy: data.recordedBy || 'Admin',
      recordedAt: new Date().toISOString()
    };
    records.unshift(rec);
    this.setVisitorAttendance(records);
    return { success: true, record: rec };
  },

  // ── INVENTORY & REQUESTS ──────────────────────────────────────
  addInventoryItem(item, allowDuplicate = false) {
    const inv = this.getInventory();
    const cleanName = item.name.trim();
    if (!allowDuplicate) {
      const existing = inv.find(i => i.name.toLowerCase() === cleanName.toLowerCase());
      if (existing) {
        return {
          success: false,
          duplicate: true,
          message: `"${existing.name}" already exists in inventory. Update its stock instead of duplicating.`
        };
      }
    }
    const n = {
      id: uid('inv'),
      name: cleanName,
      category: item.category || 'Other',
      location: item.location || '',
      description: item.description || '',
      totalQty: Math.max(0, parseInt(item.totalQty) || 0),
      issuedQty: 0,
      createdAt: new Date().toISOString()
    };
    inv.push(n);
    this.setInventory(inv);
    return { success: true, item: n };
  },

  updateInventoryItem(itemId, updates) {
    const inv = this.getInventory();
    const idx = inv.findIndex(i => i.id === itemId);
    if (idx === -1) return { success: false, message: 'Item not found.' };
    if (updates.totalQty !== undefined &&
        parseInt(updates.totalQty) < inv[idx].issuedQty) {
      return { success: false, message: `Cannot reduce below current issued quantity (${inv[idx].issuedQty}).` };
    }
    inv[idx] = { ...inv[idx], ...updates };
    this.setInventory(inv);
    return { success: true, item: inv[idx] };
  },

  deleteInventoryItem(itemId) {
    const inv = this.getInventory();
    const item = inv.find(i => i.id === itemId);
    if (!item) return { success: false, message: 'Item not found.' };
    if (item.issuedQty > 0) return { success: false, message: 'Cannot delete item while quantities are issued.' };
    this.setInventory(inv.filter(i => i.id !== itemId));
    return { success: true };
  },

  // Direct issue by admin
  issueItem(issueData) {
    const inv = this.getInventory();
    const item = inv.find(i => i.id === issueData.itemId);
    if (!item) return { success: false, message: 'Item not found.' };
    const qty = parseInt(issueData.qty) || 1;
    const avail = item.totalQty - item.issuedQty;
    if (avail < qty) return { success: false, message: `Only ${avail} units available.` };

    item.issuedQty += qty;
    this.setInventory(inv);

    const issued = this.getIssuedItems();
    const rec = {
      id: uid('iss'),
      itemId: issueData.itemId,
      itemName: item.name,
      issuedTo: issueData.issuedTo,
      issuedToId: issueData.issuedToId || null,
      project: issueData.project || '',
      issuedBy: issueData.issuedBy || 'Admin',
      qty,
      issuedDate: issueData.issuedDate || new Date().toISOString().split('T')[0],
      returnDate: issueData.returnDate || '',
      status: 'Active',
      returnedAt: null
    };
    issued.unshift(rec);
    this.setIssuedItems(issued);

    if (issueData.issuedToId) {
      this.addNotification({
        userId: issueData.issuedToId,
        type: 'inventory',
        title: 'Item Issued to You',
        message: `${qty} unit(s) of "${item.name}" have been issued to you.`,
        link: 'inventory'
      });
    }

    return { success: true, record: rec };
  },

  // Inventory Request Workflow: Pending -> Approved/Rejected -> Issued -> Returned
  createInventoryRequest({ itemId, requestedBy, requestedById, qty, purpose, project, expectedReturnDate }) {
    const inv = this.getInventory();
    const item = inv.find(i => i.id === itemId);
    if (!item) return { success: false, message: 'Item not found in inventory.' };

    const parsedQty = Math.max(1, parseInt(qty) || 1);
    const requests = this.getInventoryRequests();

    const newRequest = {
      id: uid('req'),
      itemId: item.id,
      itemName: item.name,
      requestedBy: requestedBy || 'Team Member',
      requestedById: requestedById || null,
      qty: parsedQty,
      purpose: purpose?.trim() || 'Project development / Prototyping',
      project: project?.trim() || '',
      expectedReturnDate: expectedReturnDate || '',
      status: 'Pending', // 'Pending' | 'Approved' | 'Rejected' | 'Issued' | 'Returned'
      createdAt: new Date().toISOString(),
      approvedBy: null,
      approvedAt: null,
      rejectedBy: null,
      rejectedAt: null,
      rejectionReason: '',
      issuedQuantity: 0,
      issueDate: null,
      issuedBy: null,
      returnDate: null,
      returnedAt: null
    };

    requests.unshift(newRequest);
    this.setInventoryRequests(requests);

    // Notify admins
    this.addNotification({
      type: 'inventory',
      title: 'New Inventory Request',
      message: `${requestedBy} requested ${parsedQty} unit(s) of "${item.name}".`,
      targetRole: 'admin',
      link: 'inventory'
    });

    return { success: true, request: newRequest };
  },

  approveInventoryRequest(requestId, adminName) {
    const requests = this.getInventoryRequests();
    const idx = requests.findIndex(r => r.id === requestId);
    if (idx === -1) return { success: false, message: 'Request not found.' };

    const req = requests[idx];
    if (req.status !== 'Pending') {
      return { success: false, message: `Cannot approve request currently in "${req.status}" state.` };
    }

    // Rule: Approval ALONE does NOT decrease stock
    req.status = 'Approved';
    req.approvedBy = adminName || 'Admin';
    req.approvedAt = new Date().toISOString();
    this.setInventoryRequests(requests);

    if (req.requestedById) {
      this.addNotification({
        userId: req.requestedById,
        type: 'inventory',
        title: 'Inventory Request Approved',
        message: `Your request for ${req.qty} unit(s) of "${req.itemName}" was approved by ${req.approvedBy}. Ready for issuance.`,
        link: 'inventory'
      });
    }

    return { success: true, request: req };
  },

  rejectInventoryRequest(requestId, adminName, reason) {
    const requests = this.getInventoryRequests();
    const idx = requests.findIndex(r => r.id === requestId);
    if (idx === -1) return { success: false, message: 'Request not found.' };

    const req = requests[idx];
    req.status = 'Rejected';
    req.rejectedBy = adminName || 'Admin';
    req.rejectedAt = new Date().toISOString();
    req.rejectionReason = reason || 'Declined by Administrator';
    this.setInventoryRequests(requests);

    if (req.requestedById) {
      this.addNotification({
        userId: req.requestedById,
        type: 'inventory',
        title: 'Inventory Request Rejected',
        message: `Your request for "${req.itemName}" was declined by ${req.rejectedBy}: ${req.rejectionReason}`,
        link: 'inventory'
      });
    }

    return { success: true, request: req };
  },

  issueFromApprovedRequest(requestId, adminName, actualIssuedQty, issueDate) {
    const requests = this.getInventoryRequests();
    const idx = requests.findIndex(r => r.id === requestId);
    if (idx === -1) return { success: false, message: 'Request not found.' };

    const req = requests[idx];
    if (req.status !== 'Approved') {
      return { success: false, message: 'Only approved requests can be issued.' };
    }

    const inv = this.getInventory();
    const item = inv.find(i => i.id === req.itemId);
    if (!item) return { success: false, message: 'Item not found in inventory.' };

    const qtyToIssue = parseInt(actualIssuedQty) || req.qty;
    const avail = item.totalQty - item.issuedQty;
    if (avail < qtyToIssue) {
      return { success: false, message: `Insufficient stock! Only ${avail} unit(s) available.` };
    }

    // Reduce stock ONLY now upon actual issuance
    item.issuedQty += qtyToIssue;
    this.setInventory(inv);

    const actualDate = issueDate || new Date().toISOString().split('T')[0];
    req.status = 'Issued';
    req.issuedQuantity = qtyToIssue;
    req.issueDate = actualDate;
    req.issuedBy = adminName || 'Admin';
    this.setInventoryRequests(requests);

    // Also register in issued_items log
    const issued = this.getIssuedItems();
    const issueLog = {
      id: uid('iss'),
      requestId: req.id,
      itemId: req.itemId,
      itemName: req.itemName,
      issuedTo: req.requestedBy,
      issuedToId: req.requestedById,
      project: req.project,
      issuedBy: req.issuedBy,
      qty: qtyToIssue,
      issuedDate: actualDate,
      returnDate: req.expectedReturnDate || '',
      status: 'Active',
      returnedAt: null
    };
    issued.unshift(issueLog);
    this.setIssuedItems(issued);

    if (req.requestedById) {
      this.addNotification({
        userId: req.requestedById,
        type: 'inventory',
        title: 'Hardware Issued',
        message: `${qtyToIssue} unit(s) of "${req.itemName}" have been issued to you by ${req.issuedBy}.`,
        link: 'inventory'
      });
    }

    return { success: true, request: req, log: issueLog };
  },

  returnItem(issueId) {
    const issued = this.getIssuedItems();
    const rec = issued.find(r => r.id === issueId);
    if (!rec) return { success: false, message: 'Record not found.' };
    if (rec.status === 'Returned') return { success: false, message: 'Already marked as returned.' };

    const inv = this.getInventory();
    const item = inv.find(i => i.id === rec.itemId);
    if (item) {
      item.issuedQty = Math.max(0, item.issuedQty - rec.qty);
      this.setInventory(inv);
    }

    const now = new Date().toISOString();
    rec.status = 'Returned';
    rec.returnedAt = now;
    this.setIssuedItems(issued);

    // If linked to an inventory request, update it as well
    if (rec.requestId) {
      const reqs = this.getInventoryRequests();
      const req = reqs.find(r => r.id === rec.requestId);
      if (req) {
        req.status = 'Returned';
        req.returnDate = now.split('T')[0];
        req.returnedAt = now;
        this.setInventoryRequests(reqs);
      }
    }

    return { success: true };
  },

  // ── TASKS MANAGEMENT ──────────────────────────────────────────
  addTask(taskData) {
    const tasks = this.getTasks();
    const newTask = {
      taskId: uid('tsk'),
      projectId: taskData.projectId,
      title: taskData.title.trim(),
      description: taskData.description?.trim() || '',
      assignedTo: taskData.assignedTo, // memberId
      assignedToName: taskData.assignedToName || '',
      status: taskData.status || 'Not Started', // 'Not Started' | 'In Progress' | 'Under Review' | 'Completed'
      progress: Math.min(100, Math.max(0, parseInt(taskData.progress) || 0)),
      deadline: taskData.deadline || '',
      remarks: taskData.remarks?.trim() || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: taskData.createdBy || 'Admin'
    };
    tasks.unshift(newTask);
    this.setTasks(tasks);

    // Notify assigned member
    if (newTask.assignedTo) {
      this.addNotification({
        userId: newTask.assignedTo,
        type: 'task',
        title: 'New Task Assigned',
        message: `You were assigned: "${newTask.title}" in project.`,
        link: 'projects'
      });
    }

    return { success: true, task: newTask };
  },

  updateTask(taskId, updates, currentUser) {
    const tasks = this.getTasks();
    const idx = tasks.findIndex(t => t.taskId === taskId);
    if (idx === -1) return { success: false, message: 'Task not found.' };

    const task = tasks[idx];

    // ROLE ENFORCEMENT: Team Members can update ONLY their own tasks and ONLY status, progress, remarks
    if (!currentUser?.isAdmin) {
      if (task.assignedTo !== currentUser?.id) {
        return { success: false, message: 'Access denied: You can only update your own assigned tasks.' };
      }
      // Restrict permitted fields for members
      const allowed = {
        status: updates.status || task.status,
        progress: updates.progress !== undefined ? Math.min(100, Math.max(0, parseInt(updates.progress) || 0)) : task.progress,
        remarks: updates.remarks !== undefined ? updates.remarks : task.remarks,
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser.name
      };
      tasks[idx] = { ...task, ...allowed };
    } else {
      // Admin has full control
      tasks[idx] = {
        ...task,
        ...updates,
        progress: updates.progress !== undefined ? Math.min(100, Math.max(0, parseInt(updates.progress) || 0)) : task.progress,
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser?.name || 'Admin'
      };
    }

    this.setTasks(tasks);
    return { success: true, task: tasks[idx] };
  },

  deleteTask(taskId, currentUser) {
    if (!currentUser?.isAdmin) {
      return { success: false, message: 'Only administrators can delete project tasks.' };
    }
    const tasks = this.getTasks();
    this.setTasks(tasks.filter(t => t.taskId !== taskId));
    return { success: true };
  },

  // ── EVENTS & CALENDAR ─────────────────────────────────────────
  addEvent(eventData, currentUser) {
    if (!currentUser?.isAdmin) {
      return { success: false, message: 'Only administrators can create events.' };
    }
    const events = this.getEvents();
    const newEvent = {
      id: uid('evt'),
      title: eventData.title.trim(),
      description: eventData.description?.trim() || '',
      category: eventData.category || 'Workshop',
      startDate: eventData.startDate || new Date().toISOString().split('T')[0],
      endDate: eventData.endDate || eventData.startDate || new Date().toISOString().split('T')[0],
      startTime: eventData.startTime || '10:00',
      endTime: eventData.endTime || '13:00',
      venue: eventData.venue?.trim() || 'Robotics Lab',
      poster: eventData.poster || '',
      status: eventData.status || 'Upcoming', // 'Upcoming' | 'Ongoing' | 'Completed' | 'Cancelled'
      outcome: eventData.outcome?.trim() || '',
      achievements: eventData.achievements?.trim() || '',
      documentation: eventData.documentation?.trim() || '',
      photos: eventData.photos || [],
      createdBy: currentUser.name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    events.unshift(newEvent);
    this.setEvents(events);

    // Notify all members of new event
    this.addNotification({
      type: 'event',
      title: 'New Club Event',
      message: `"${newEvent.title}" (${newEvent.category}) scheduled for ${newEvent.startDate} at ${newEvent.venue}.`,
      link: 'events'
    });

    return { success: true, event: newEvent };
  },

  updateEvent(eventId, updates, currentUser) {
    if (!currentUser?.isAdmin) {
      return { success: false, message: 'Only administrators can modify events.' };
    }
    const events = this.getEvents();
    const idx = events.findIndex(e => e.id === eventId);
    if (idx === -1) return { success: false, message: 'Event not found.' };

    events[idx] = {
      ...events[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
      updatedBy: currentUser.name
    };
    this.setEvents(events);

    // If significant update, notify
    this.addNotification({
      type: 'event',
      title: 'Event Updated',
      message: `Schedule or details updated for "${events[idx].title}".`,
      link: 'events'
    });

    return { success: true, event: events[idx] };
  },

  deleteEvent(eventId, currentUser) {
    if (!currentUser?.isAdmin) {
      return { success: false, message: 'Only administrators can delete events.' };
    }
    const events = this.getEvents();
    this.setEvents(events.filter(e => e.id !== eventId));
    return { success: true };
  },

  // ── ANNOUNCEMENTS & NOTIFICATIONS ──────────────────────────────
  addAnnouncement({ title, content, author, priority = 'normal' }) {
    const list = this.getAnnouncements();
    const newAnn = {
      id: uid('ann'),
      title: title.trim(),
      content: content.trim(),
      author: author || 'Club Administration',
      priority, // 'normal' | 'urgent'
      createdAt: new Date().toISOString()
    };
    list.unshift(newAnn);
    this.setAnnouncements(list);

    // Create notification for everyone
    this.addNotification({
      type: 'announcement',
      title: `Announcement: ${newAnn.title}`,
      message: newAnn.content.slice(0, 100) + (newAnn.content.length > 100 ? '…' : ''),
      link: 'overview'
    });

    return { success: true, announcement: newAnn };
  },

  addNotification({ userId = null, targetRole = null, type, title, message, link = 'overview' }) {
    const list = this.getNotifications();
    const newNotif = {
      id: uid('notif'),
      userId, // Specific memberId or null for all
      targetRole, // 'admin' or null
      type: type || 'system',
      title,
      message,
      link,
      read: false,
      readBy: [], // Array of user IDs who have read this notification
      createdAt: new Date().toISOString()
    };
    list.unshift(newNotif);
    // Keep max 100 notifications
    this.setNotifications(list.slice(0, 100));
    return newNotif;
  },

  getUserNotifications(currentUser) {
    if (!currentUser) return [];
    const all = this.getNotifications();
    return all.filter(n => {
      if (currentUser.isAdmin && n.targetRole === 'admin') return true;
      if (n.userId && n.userId === currentUser.id) return true;
      if (!n.userId && !n.targetRole) return true;
      return false;
    }).map(n => ({
      ...n,
      isRead: n.read || (n.readBy && n.readBy.includes(currentUser.id))
    }));
  },

  markNotificationRead(notificationId, userId) {
    const all = this.getNotifications();
    const notif = all.find(n => n.id === notificationId);
    if (notif) {
      if (notif.userId === userId) {
        notif.read = true;
      }
      if (!notif.readBy) notif.readBy = [];
      if (!notif.readBy.includes(userId)) notif.readBy.push(userId);
      this.setNotifications(all);
    }
  },

  markAllNotificationsRead(currentUser) {
    if (!currentUser) return;
    const all = this.getNotifications();
    all.forEach(n => {
      if (n.userId === currentUser.id) n.read = true;
      if (!n.readBy) n.readBy = [];
      if (!n.readBy.includes(currentUser.id)) n.readBy.push(currentUser.id);
    });
    this.setNotifications(all);
  },

  // ── SEED SAMPLE DATA (Only when store is empty or explicitly seeded) ──
  seedDemoData() {
    // Check if data already exists
    const existingMembers = this.getMembers();
    if (existingMembers.length > 0) return false;

    // 1. Teams
    const teams = [
      { id: 'tm_1', name: 'Embedded & Firmware', description: 'MCU programming, sensor interfacing, and control loops' },
      { id: 'tm_2', name: 'Autonomous & AI', description: 'SLAM, computer vision, path planning, and ROS' },
      { id: 'tm_3', name: 'Mechanical & CAD', description: 'Chassis design, 3D printing, kinematics, and machining' },
      { id: 'tm_4', name: 'Electronics & Power', description: 'Custom PCB design, motor drivers, and battery telemetry' }
    ];
    this.setTeams(teams);

    // 2. Members & Credentials
    const adminUser = {
      id: 'usr_admin',
      name: 'Alex Morgan',
      email: 'admin@rcteams.club',
      rollNumber: 'RC23ADM001',
      branch: 'Robotics & Automation',
      academicYear: '4th yr',
      clubTag: 'President / Lead',
      teamId: 'tm_2',
      status: 'Active',
      isAdmin: true,
      registeredAt: '2026-08-01T09:00:00.000Z',
      approvedAt: '2026-08-01T09:00:00.000Z'
    };

    const teamMember = {
      id: 'usr_member',
      name: 'Rohan Sharma',
      email: 'member@rcteams.club',
      rollNumber: 'RC24ROB108',
      branch: 'Mechanical & Automation',
      academicYear: '2nd yr',
      clubTag: 'Chassis & Hardware',
      teamId: 'tm_3',
      status: 'Active',
      isAdmin: false,
      registeredAt: '2026-08-15T10:30:00.000Z',
      approvedAt: '2026-08-16T11:00:00.000Z'
    };

    const member2 = {
      id: 'usr_priya',
      name: 'Priya Patel',
      email: 'priya@rcteams.club',
      rollNumber: 'RC24ECE045',
      branch: 'Electronics & Comm.',
      academicYear: '3rd yr',
      clubTag: 'Firmware Specialist',
      teamId: 'tm_1',
      status: 'Active',
      isAdmin: false,
      registeredAt: '2026-08-12T14:00:00.000Z',
      approvedAt: '2026-08-13T09:30:00.000Z'
    };

    const member3 = {
      id: 'usr_vikram',
      name: 'Vikram Rao',
      email: 'vikram@rcteams.club',
      rollNumber: 'RC24CSE089',
      branch: 'Computer Science',
      academicYear: '3rd yr',
      clubTag: 'ROS & Perception',
      teamId: 'tm_2',
      status: 'Active',
      isAdmin: false,
      registeredAt: '2026-08-18T16:15:00.000Z',
      approvedAt: '2026-08-19T10:00:00.000Z'
    };

    const member4 = {
      id: 'usr_ananya',
      name: 'Ananya Sen',
      email: 'ananya@rcteams.club',
      rollNumber: 'RC25EEE012',
      branch: 'Electrical Eng.',
      academicYear: '1st yr',
      clubTag: 'Junior Trainee',
      teamId: 'tm_4',
      status: 'Active',
      isAdmin: false,
      registeredAt: '2026-09-01T11:00:00.000Z',
      approvedAt: '2026-09-02T12:00:00.000Z'
    };

    const members = [adminUser, teamMember, member2, member3, member4];
    this.setMembers(members);

    const credentials = {
      'admin@rcteams.club': { password: 'admin123', isAdmin: true, memberId: adminUser.id, temp: false },
      'member@rcteams.club': { password: 'member123', isAdmin: false, memberId: teamMember.id, temp: false },
      'priya@rcteams.club': { password: 'priya123', isAdmin: false, memberId: member2.id, temp: false },
      'vikram@rcteams.club': { password: 'vikram123', isAdmin: false, memberId: member3.id, temp: false },
      'ananya@rcteams.club': { password: 'ananya123', isAdmin: false, memberId: member4.id, temp: false }
    };
    this.setCredentials(credentials);

    // 3. Pending Approvals
    this.setPending([
      {
        id: 'p_demo1',
        name: 'Siddharth Varma',
        email: 'sid.varma@college.edu',
        rollNumber: 'RC25CSE142',
        academicYear: '1st yr',
        branch: 'Computer Science',
        clubTag: 'Autonomous Software',
        status: 'Pending',
        registeredAt: new Date(Date.now() - 3600000 * 18).toISOString()
      }
    ]);

    // 4. Projects
    const projects = [
      {
        id: 'proj_1',
        name: 'Autonomous Maze Navigation Rover',
        description: 'Micro-mouse rover utilizing 2D LiDAR and ultrasonic sensors with modified A* algorithm for real-time maze mapping and rapid traversal.',
        status: 'Active',
        tags: ['autonomous', 'slam', 'stm32', 'lidar'],
        memberIds: [teamMember.id, member2.id, adminUser.id],
        pdfFileName: 'Maze_Rover_System_Architecture_v2.pdf',
        pdfFileRef: null,
        createdAt: '2026-09-10T10:00:00.000Z'
      },
      {
        id: 'proj_2',
        name: 'RoboWars 30kg Drum Spinner (Thunderbolt)',
        description: 'Hardened AR500 steel chassis combat robot with high-torque brushless weapon drive, 4-wheel drive drivetrain and failsafe telemetry.',
        status: 'Active',
        tags: ['combat-bot', 'cad', 'brushless', 'machining'],
        memberIds: [teamMember.id, member4.id],
        pdfFileName: 'Thunderbolt_FEA_Stress_Report.pdf',
        pdfFileRef: null,
        createdAt: '2026-09-20T14:30:00.000Z'
      },
      {
        id: 'proj_3',
        name: 'Quadruped Robot Dog Platform',
        description: '12-DOF biomimetic quadruped with inverse kinematics, custom cycloidal gearboxes, and ESP32 wireless joint controllers.',
        status: 'On Hold',
        tags: ['quadruped', 'kinematics', 'esp32', 'bldc'],
        memberIds: [member3.id, member2.id],
        pdfFileName: null,
        pdfFileRef: null,
        createdAt: '2026-08-25T09:00:00.000Z'
      }
    ];
    this.setProjects(projects);

    // 5. Tasks within Projects
    const tasks = [
      {
        taskId: 'tsk_1',
        projectId: 'proj_1',
        title: 'Calibrate Distance Sensors and ToF Arrays',
        description: 'Tune optical and ultrasonic readings against physical grid markers.',
        assignedTo: teamMember.id,
        assignedToName: teamMember.name,
        status: 'In Progress',
        progress: 65,
        deadline: '2026-11-20',
        remarks: 'Sensor offsets recorded for left and front sensors. Calibrating right side.',
        createdAt: '2026-10-15T11:00:00.000Z',
        updatedAt: '2026-11-05T14:20:00.000Z',
        createdBy: 'Alex Morgan'
      },
      {
        taskId: 'tsk_2',
        projectId: 'proj_1',
        title: 'Implement Flood-Fill Path Optimization',
        description: 'Port C++ flood-fill path generation to FreeRTOS task on STM32.',
        assignedTo: member2.id,
        assignedToName: member2.name,
        status: 'Under Review',
        progress: 90,
        deadline: '2026-11-18',
        remarks: 'Simulation verified. Awaiting hardware testing in mock maze.',
        createdAt: '2026-10-16T12:00:00.000Z',
        updatedAt: '2026-11-08T16:00:00.000Z',
        createdBy: 'Alex Morgan'
      },
      {
        taskId: 'tsk_3',
        projectId: 'proj_2',
        title: 'CNC Mill Drum Spinner Shaft Supports',
        description: 'Machine 7075 aluminum bearing brackets to 0.02mm tolerance.',
        assignedTo: teamMember.id,
        assignedToName: teamMember.name,
        status: 'Completed',
        progress: 100,
        deadline: '2026-11-08',
        remarks: 'Brackets completed and press-fit with 6802 ceramic bearings.',
        createdAt: '2026-10-22T09:30:00.000Z',
        updatedAt: '2026-11-08T18:00:00.000Z',
        createdBy: 'Alex Morgan'
      },
      {
        taskId: 'tsk_4',
        projectId: 'proj_2',
        title: 'Fabricate Battery Armor & Shock Dampening',
        description: 'Construct Kevlar and TPU lined enclosure for 6S LiFePO4 packs.',
        assignedTo: teamMember.id,
        assignedToName: teamMember.name,
        status: 'In Progress',
        progress: 40,
        deadline: '2026-11-25',
        remarks: 'TPU 95A outer buffer 3D printed. Working on internal foam inserts.',
        createdAt: '2026-11-01T10:00:00.000Z',
        updatedAt: '2026-11-09T17:15:00.000Z',
        createdBy: 'Alex Morgan'
      }
    ];
    this.setTasks(tasks);

    // 6. Inventory Items
    const inventory = [
      { id: 'inv_1', name: 'Raspberry Pi 4 Model B (4GB)', category: 'MCU', location: 'Locker A - Shelf 1', description: 'Broadcom BCM2711 quad-core SoC', totalQty: 6, issuedQty: 4, createdAt: '2026-08-10T10:00:00.000Z' },
      { id: 'inv_2', name: 'STM32F401 BlackPill Dev Board', category: 'MCU', location: 'Tray B - Bin 3', description: 'ARM Cortex-M4 84MHz 512KB Flash', totalQty: 15, issuedQty: 8, createdAt: '2026-08-10T10:00:00.000Z' },
      { id: 'inv_3', name: 'RPLiDAR A1 360° Laser Scanner', category: 'Sensor', location: 'Locker C - Padded Box', description: '12-meter radius 5.5Hz 2D scanning', totalQty: 3, issuedQty: 2, createdAt: '2026-08-12T11:00:00.000Z' }, // Low stock: 1 left
      { id: 'inv_4', name: 'MG996R Metal Gear High Torque Servo', category: 'Actuator', location: 'Drawer 4', description: '11kg-cm torque digital servo', totalQty: 24, issuedQty: 12, createdAt: '2026-08-12T11:00:00.000Z' },
      { id: 'inv_5', name: 'Tattu 3S 2200mAh 45C LiPo Battery', category: 'Power', location: 'LiPo Fireproof Vault', description: '11.1V high discharge pack with XT60', totalQty: 8, issuedQty: 4, createdAt: '2026-08-14T15:00:00.000Z' },
      { id: 'inv_6', name: 'NEMA 17 Bipolar Stepper Motor (48mm)', category: 'Actuator', location: 'Drawer 2', description: '1.8 deg step angle 45Ncm holding torque', totalQty: 10, issuedQty: 2, createdAt: '2026-08-15T12:00:00.000Z' },
      { id: 'inv_7', name: 'TS101 Smart Soldering Iron', category: 'Tool', location: 'Workbench 1 Rack', description: 'USB-C PD 65W programmable soldering iron', totalQty: 4, issuedQty: 2, createdAt: '2026-08-15T12:00:00.000Z' } // Low stock: 2 left
    ];
    this.setInventory(inventory);

    // 7. Inventory Requests (demonstrating all workflow states)
    const requests = [
      {
        id: 'req_1',
        itemId: 'inv_3',
        itemName: 'RPLiDAR A1 360° Laser Scanner',
        requestedBy: 'Rohan Sharma',
        requestedById: teamMember.id,
        qty: 1,
        purpose: 'Maze wall distance mapping and obstacle avoidance integration.',
        project: 'Autonomous Maze Navigation Rover',
        expectedReturnDate: '2026-12-05',
        status: 'Approved',
        createdAt: '2026-11-02T10:00:00.000Z',
        approvedBy: 'Alex Morgan',
        approvedAt: '2026-11-03T11:30:00.000Z',
        rejectedBy: null,
        rejectedAt: null,
        rejectionReason: '',
        issuedQuantity: 0,
        issueDate: null,
        issuedBy: null,
        returnDate: null,
        returnedAt: null
      },
      {
        id: 'req_2',
        itemId: 'inv_5',
        itemName: 'Tattu 3S 2200mAh 45C LiPo Battery',
        requestedBy: 'Priya Patel',
        requestedById: member2.id,
        qty: 2,
        purpose: 'Powering motor drive test rig in lab.',
        project: 'Autonomous Maze Navigation Rover',
        expectedReturnDate: '2026-11-20',
        status: 'Issued',
        createdAt: '2026-10-25T14:00:00.000Z',
        approvedBy: 'Alex Morgan',
        approvedAt: '2026-10-26T09:00:00.000Z',
        rejectedBy: null,
        rejectedAt: null,
        rejectionReason: '',
        issuedQuantity: 2,
        issueDate: '2026-10-26',
        issuedBy: 'Alex Morgan',
        returnDate: '2026-11-20',
        returnedAt: null
      },
      {
        id: 'req_3',
        itemId: 'inv_1',
        itemName: 'Raspberry Pi 4 Model B (4GB)',
        requestedBy: 'Rohan Sharma',
        requestedById: teamMember.id,
        qty: 1,
        purpose: 'Computer vision camera processing node.',
        project: 'RoboWars 30kg Drum Spinner (Thunderbolt)',
        expectedReturnDate: '2026-11-30',
        status: 'Pending',
        createdAt: '2026-11-10T16:45:00.000Z',
        approvedBy: null,
        approvedAt: null,
        rejectedBy: null,
        rejectedAt: null,
        rejectionReason: '',
        issuedQuantity: 0,
        issueDate: null,
        issuedBy: null,
        returnDate: null,
        returnedAt: null
      }
    ];
    this.setInventoryRequests(requests);

    // 8. Issued Items History
    const issuedItems = [
      {
        id: 'iss_1',
        requestId: 'req_2',
        itemId: 'inv_5',
        itemName: 'Tattu 3S 2200mAh 45C LiPo Battery',
        issuedTo: 'Priya Patel',
        issuedToId: member2.id,
        project: 'Autonomous Maze Navigation Rover',
        issuedBy: 'Alex Morgan',
        qty: 2,
        issuedDate: '2026-10-26',
        returnDate: '2026-11-20',
        status: 'Active',
        returnedAt: null
      },
      {
        id: 'iss_2',
        requestId: null,
        itemId: 'inv_7',
        itemName: 'TS101 Smart Soldering Iron',
        issuedTo: 'Rohan Sharma',
        issuedToId: teamMember.id,
        project: 'RoboWars 30kg Drum Spinner (Thunderbolt)',
        issuedBy: 'Alex Morgan',
        qty: 1,
        issuedDate: '2026-11-04',
        returnDate: '2026-11-15',
        status: 'Active',
        returnedAt: null
      },
      {
        id: 'iss_3',
        requestId: null,
        itemId: 'inv_4',
        itemName: 'MG996R Metal Gear High Torque Servo',
        issuedTo: 'Rohan Sharma',
        issuedToId: teamMember.id,
        project: 'General Prototyping',
        issuedBy: 'Alex Morgan',
        qty: 4,
        issuedDate: '2026-09-15',
        returnDate: '2026-10-01',
        status: 'Returned',
        returnedAt: '2026-10-01T15:00:00.000Z'
      }
    ];
    this.setIssuedItems(issuedItems);

    // 9. DAILY ATTENDANCE (Strictly one record per member per calendar date)
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const dayBefore = new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0];
    const day3 = new Date(Date.now() - 86400000 * 3).toISOString().split('T')[0];
    const day4 = new Date(Date.now() - 86400000 * 4).toISOString().split('T')[0];

    const dailyAttendance = [
      // Today
      { attendanceId: 'att_101', memberId: adminUser.id, date: today, status: 'Present', markedBy: 'Alex Morgan', markedAt: `${today}T09:30:00.000Z`, updatedBy: null, updatedAt: null, history: [] },
      { attendanceId: 'att_102', memberId: teamMember.id, date: today, status: 'Present', markedBy: 'Alex Morgan', markedAt: `${today}T09:35:00.000Z`, updatedBy: null, updatedAt: null, history: [] },
      { attendanceId: 'att_103', memberId: member2.id, date: today, status: 'Present', markedBy: 'Alex Morgan', markedAt: `${today}T09:40:00.000Z`, updatedBy: null, updatedAt: null, history: [] },
      { attendanceId: 'att_104', memberId: member3.id, date: today, status: 'Leave', markedBy: 'Alex Morgan', markedAt: `${today}T09:42:00.000Z`, updatedBy: null, updatedAt: null, history: [] },
      { attendanceId: 'att_105', memberId: member4.id, date: today, status: 'Absent', markedBy: 'Alex Morgan', markedAt: `${today}T09:45:00.000Z`, updatedBy: null, updatedAt: null, history: [] },

      // Yesterday
      { attendanceId: 'att_201', memberId: adminUser.id, date: yesterday, status: 'Present', markedBy: 'Alex Morgan', markedAt: `${yesterday}T09:30:00.000Z`, updatedBy: null, updatedAt: null, history: [] },
      { attendanceId: 'att_202', memberId: teamMember.id, date: yesterday, status: 'Present', markedBy: 'Alex Morgan', markedAt: `${yesterday}T09:32:00.000Z`, updatedBy: null, updatedAt: null, history: [] },
      { attendanceId: 'att_203', memberId: member2.id, date: yesterday, status: 'Present', markedBy: 'Alex Morgan', markedAt: `${yesterday}T09:35:00.000Z`, updatedBy: null, updatedAt: null, history: [] },
      { attendanceId: 'att_204', memberId: member3.id, date: yesterday, status: 'Present', markedBy: 'Alex Morgan', markedAt: `${yesterday}T09:38:00.000Z`, updatedBy: null, updatedAt: null, history: [] },
      { attendanceId: 'att_205', memberId: member4.id, date: yesterday, status: 'Present', markedBy: 'Alex Morgan', markedAt: `${yesterday}T09:40:00.000Z`, updatedBy: null, updatedAt: null, history: [] },

      // Day before
      { attendanceId: 'att_301', memberId: adminUser.id, date: dayBefore, status: 'Present', markedBy: 'Alex Morgan', markedAt: `${dayBefore}T09:20:00.000Z`, updatedBy: null, updatedAt: null, history: [] },
      { attendanceId: 'att_302', memberId: teamMember.id, date: dayBefore, status: 'Absent', markedBy: 'Alex Morgan', markedAt: `${dayBefore}T09:25:00.000Z`, updatedBy: null, updatedAt: null, history: [] },
      { attendanceId: 'att_303', memberId: member2.id, date: dayBefore, status: 'Present', markedBy: 'Alex Morgan', markedAt: `${dayBefore}T09:28:00.000Z`, updatedBy: null, updatedAt: null, history: [] },
      { attendanceId: 'att_304', memberId: member3.id, date: dayBefore, status: 'Leave', markedBy: 'Alex Morgan', markedAt: `${dayBefore}T09:30:00.000Z`, updatedBy: null, updatedAt: null, history: [] },
      { attendanceId: 'att_305', memberId: member4.id, date: dayBefore, status: 'Present', markedBy: 'Alex Morgan', markedAt: `${dayBefore}T09:35:00.000Z`, updatedBy: null, updatedAt: null, history: [] },

      // Day 3
      { attendanceId: 'att_401', memberId: teamMember.id, date: day3, status: 'Present', markedBy: 'Alex Morgan', markedAt: `${day3}T09:30:00.000Z`, updatedBy: null, updatedAt: null, history: [] },
      { attendanceId: 'att_402', memberId: member2.id, date: day3, status: 'Present', markedBy: 'Alex Morgan', markedAt: `${day3}T09:30:00.000Z`, updatedBy: null, updatedAt: null, history: [] },

      // Day 4
      { attendanceId: 'att_501', memberId: teamMember.id, date: day4, status: 'Present', markedBy: 'Alex Morgan', markedAt: `${day4}T09:30:00.000Z`, updatedBy: null, updatedAt: null, history: [] },
      { attendanceId: 'att_502', memberId: member2.id, date: day4, status: 'Leave', markedBy: 'Alex Morgan', markedAt: `${day4}T09:30:00.000Z`, updatedBy: null, updatedAt: null, history: [] }
    ];
    this.setDailyAttendance(dailyAttendance);

    // 10. Visitor Attendance
    this.setVisitorAttendance([
      {
        id: 'va_1',
        name: 'Prof. Arvind Nambiar',
        email: 'a.nambiar@univ.ac.in',
        phone: '+91 98450 12345',
        purpose: 'Annual Club Faculty Audit & Lab Review',
        date: yesterday,
        recordedBy: 'Alex Morgan',
        recordedAt: `${yesterday}T11:00:00.000Z`
      },
      {
        id: 'va_2',
        name: 'Karan Mehra',
        email: 'karan@alumni.org',
        phone: '+91 99800 67890',
        purpose: 'Alumni Mentorship session on ROS2 Humble',
        date: day3,
        recordedBy: 'Alex Morgan',
        recordedAt: `${day3}T15:30:00.000Z`
      }
    ]);

    // 11. Events & Calendar
    const events = [
      {
        id: 'evt_1',
        title: 'Hands-on Autonomous Robotics & ROS2 BootCamp',
        description: 'Comprehensive 2-day workshop covering ROS2 node creation, Gazebo simulation, URDF modeling, and hardware communication with micro-ROS on ESP32.',
        category: 'Workshop',
        startDate: '2026-11-18',
        endDate: '2026-11-19',
        startTime: '10:00',
        endTime: '17:00',
        venue: 'Robotics Central Lab & Seminar Hall B',
        poster: '',
        status: 'Upcoming',
        outcome: '',
        achievements: '',
        documentation: 'https://docs.rcteams.club/workshops/ros2-2026',
        photos: [],
        createdBy: 'Alex Morgan',
        createdAt: '2026-10-28T10:00:00.000Z',
        updatedAt: '2026-10-28T10:00:00.000Z'
      },
      {
        id: 'evt_2',
        title: 'Club Internal Line Follower & Maze Sprint',
        description: 'Inter-team speed contest testing PID loop tuning, sensor array response, and fast cornering on standard black-on-white line tracks.',
        category: 'Competition',
        startDate: '2026-11-12',
        endDate: '2026-11-12',
        startTime: '14:00',
        endTime: '18:00',
        venue: 'Club Arena 1',
        poster: '',
        status: 'Ongoing',
        outcome: '',
        achievements: '',
        documentation: 'Live score sheet available on notice board.',
        photos: [],
        createdBy: 'Alex Morgan',
        createdAt: '2026-11-01T12:00:00.000Z',
        updatedAt: '2026-11-01T12:00:00.000Z'
      },
      {
        id: 'evt_3',
        title: 'National Robocon 2026 Regional Qualifiers',
        description: 'RC-TEAMS represented our institute at the Regional Robocon competition in Bengaluru, competing in autonomous ball passing and ring sorting.',
        category: 'Competition',
        startDate: '2026-10-10',
        endDate: '2026-10-12',
        startTime: '09:00',
        endTime: '19:00',
        venue: 'Regional Sports Stadium & Indoor Dome',
        poster: '',
        status: 'Completed',
        outcome: 'Qualified for National finals with 3 consecutive wins and zero mechanical failures.',
        achievements: 'Awarded 1st Place in Best Drivetrain Innovation & Fastest Task Completion Award.',
        documentation: 'https://archive.rcteams.club/events/robocon-2026-summary.pdf',
        photos: [],
        createdBy: 'Alex Morgan',
        createdAt: '2026-09-15T09:00:00.000Z',
        updatedAt: '2026-10-13T10:00:00.000Z'
      },
      {
        id: 'evt_4',
        title: 'Industry Talk: Modern Industrial AGVs & Fleet Telemetry',
        description: 'Guest lecture by Senior Robotics Engineer from GreyOrange on warehouse automation and decentralized fleet control.',
        category: 'Seminar',
        startDate: '2026-10-25',
        endDate: '2026-10-25',
        startTime: '15:30',
        endTime: '17:30',
        venue: 'Auditorium 2',
        poster: '',
        status: 'Completed',
        outcome: 'Over 85 members attended; 4 summer internship offers opened for club members.',
        achievements: 'Memorandum of Understanding signed for lab hardware sponsorship.',
        documentation: 'Lecture presentation slides uploaded to club drive.',
        photos: [],
        createdBy: 'Alex Morgan',
        createdAt: '2026-10-05T14:00:00.000Z',
        updatedAt: '2026-10-25T18:00:00.000Z'
      }
    ];
    this.setEvents(events);

    // 12. Announcements
    const announcements = [
      {
        id: 'ann_1',
        title: 'Component Procurement Round 2 Open',
        content: 'Any teams requiring custom motors, sensors or aluminum stock for winter projects must submit requests in the Inventory module before Friday 6:00 PM.',
        author: 'Alex Morgan',
        priority: 'urgent',
        createdAt: '2026-11-09T10:00:00.000Z'
      },
      {
        id: 'ann_2',
        title: 'Lab Cleanup & Tool Inventory Check this Saturday',
        content: 'All members must return outstanding borrowed hand tools and ensure workbenches are wiped down before 1:00 PM Saturday.',
        author: 'Alex Morgan',
        priority: 'normal',
        createdAt: '2026-11-06T15:00:00.000Z'
      }
    ];
    this.setAnnouncements(announcements);

    // 13. Notifications
    const notifications = [
      {
        id: 'notif_1',
        userId: teamMember.id,
        type: 'inventory',
        title: 'Request Approved',
        message: 'Your request for RPLiDAR A1 was approved by Alex Morgan.',
        link: 'inventory',
        read: false,
        readBy: [],
        createdAt: '2026-11-03T11:30:00.000Z'
      },
      {
        id: 'notif_2',
        userId: teamMember.id,
        type: 'task',
        title: 'New Task Assigned',
        message: 'You have been assigned: "Fabricate Battery Armor & Shock Dampening".',
        link: 'projects',
        read: false,
        readBy: [],
        createdAt: '2026-11-01T10:00:00.000Z'
      },
      {
        id: 'notif_3',
        userId: null,
        type: 'event',
        title: 'Upcoming Workshop',
        message: 'ROS2 BootCamp is scheduled for Nov 18-19. Registrations open.',
        link: 'events',
        read: false,
        readBy: [],
        createdAt: '2026-10-28T10:00:00.000Z'
      }
    ];
    this.setNotifications(notifications);

    // 14. Treasury
    this.setTreasury({
      balance: '54,200',
      label: 'Club Treasury Balance',
      notes: 'Robocon prize funds & Institute quarterly allocation',
      lastEditedBy: 'Alex Morgan',
      lastEditedAt: '2026-11-01T12:00:00.000Z'
    });

    return true;
  },

  clearAllData() {
    Object.keys(localStorage)
      .filter(k => k.startsWith('rcteams_'))
      .forEach(k => localStorage.removeItem(k));
  }
};
