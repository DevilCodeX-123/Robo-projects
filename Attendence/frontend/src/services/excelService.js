// RC-TEAMS Excel Service
// Parses .xlsx / .xls / .csv files and provides upsert logic

import * as XLSX from 'xlsx';

/** Read a file (File object) and return array of row objects */
export function parseExcelFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const wb = XLSX.read(data, { type: 'array', cellDates: true });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
        resolve(rows);
      } catch (err) {
        reject(new Error('Failed to parse file: ' + err.message));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file.'));
    reader.readAsArrayBuffer(file);
  });
}

/** Normalize a column header: lowercase, strip spaces/special chars */
export function normalizeHeader(h) {
  return String(h).toLowerCase().trim().replace(/[\s_\-/]+/g, '');
}

/** Find a value in a row by trying multiple possible header names */
export function findField(row, candidates) {
  const normRow = {};
  Object.keys(row).forEach(k => { normRow[normalizeHeader(k)] = row[k]; });
  for (const c of candidates) {
    const norm = normalizeHeader(c);
    if (normRow[norm] !== undefined && normRow[norm] !== '') {
      return String(normRow[norm]).trim();
    }
  }
  return '';
}

// ── Member Import ──────────────────────────────────────────────────────────

const MEMBER_FIELD_MAP = {
  rollNumber: ['rollnumber', 'roll', 'rollno', 'roll no', 'roll number', 'studentid', 'id'],
  name: ['name', 'fullname', 'full name', 'studentname', 'student name'],
  email: ['email', 'emailaddress', 'email address', 'mail'],
  clubTag: ['clubtag', 'club tag', 'role', 'clubrole', 'club role', 'tag', 'position'],
  academicYear: ['year', 'academicyear', 'academic year', 'studyyear', 'yr'],
  branch: ['branch', 'dept', 'department', 'stream', 'programme'],
};

/** Map a raw Excel row to a member object */
export function mapMemberRow(row) {
  const mapped = {};
  for (const [field, candidates] of Object.entries(MEMBER_FIELD_MAP)) {
    mapped[field] = findField(row, candidates);
  }
  return mapped;
}

/** Validate a mapped member row; returns array of error strings */
export function validateMemberRow(row) {
  const errors = [];
  if (!row.name) errors.push('Name is required');
  if (!row.rollNumber) errors.push('Roll Number is required');
  if (!row.email) errors.push('Email is required');
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) errors.push('Invalid email format');
  return errors;
}

/**
 * Compute import diff for members.
 * Matches by rollNumber (primary), email (fallback).
 * Returns { toAdd, toUpdate, skipped, invalid }
 */
export function computeMemberImportDiff(rawRows, existingMembers, existingPending) {
  const toAdd = [];
  const toUpdate = [];
  const skipped = [];
  const invalid = [];

  rawRows.forEach((row, i) => {
    const mapped = mapMemberRow(row);
    const errors = validateMemberRow(mapped);

    if (errors.length) {
      invalid.push({ row: i + 2, data: mapped, errors });
      return;
    }

    const rn = mapped.rollNumber.toUpperCase();
    const el = mapped.email.toLowerCase();

    // Find existing by roll number first, then email
    let existing = existingMembers.find(m => m.rollNumber?.toUpperCase() === rn);
    if (!existing) existing = existingMembers.find(m => m.email?.toLowerCase() === el);

    if (existing) {
      toUpdate.push({ existing, updates: mapped });
    } else {
      // Check pending
      const inPending = existingPending.find(
        p => p.rollNumber?.toUpperCase() === rn || p.email?.toLowerCase() === el
      );
      if (inPending) {
        skipped.push({ data: mapped, reason: 'Already in pending approvals' });
      } else {
        toAdd.push(mapped);
      }
    }
  });

  return { toAdd, toUpdate, skipped, invalid };
}

// ── Attendance Import ──────────────────────────────────────────────────────

const ATT_TEAM_FIELD_MAP = {
  rollNumber: ['rollnumber', 'roll', 'rollno', 'roll no', 'roll number', 'id'],
  name: ['name', 'fullname', 'full name', 'studentname'],
  branch: ['branch', 'dept', 'department'],
  academicYear: ['year', 'academicyear', 'academic year', 'yr'],
};

export function mapTeamAttRow(row) {
  const mapped = {
    rollNumber: findField(row, ATT_TEAM_FIELD_MAP.rollNumber),
    name: findField(row, ATT_TEAM_FIELD_MAP.name),
    branch: findField(row, ATT_TEAM_FIELD_MAP.branch),
    academicYear: findField(row, ATT_TEAM_FIELD_MAP.academicYear),
    sessions: {}
  };

  // All remaining columns that look like dates become session columns
  const knownFields = new Set([
    ...ATT_TEAM_FIELD_MAP.rollNumber,
    ...ATT_TEAM_FIELD_MAP.name,
    ...ATT_TEAM_FIELD_MAP.branch,
    ...ATT_TEAM_FIELD_MAP.academicYear
  ].map(f => normalizeHeader(f)));

  Object.entries(row).forEach(([k, v]) => {
    if (!knownFields.has(normalizeHeader(k))) {
      const val = String(v).trim().toUpperCase();
      if (val === 'P' || val === 'A' || val === 'L' || val === '1' || val === '0') {
        const normalizedVal = val === '1' ? 'P' : val === '0' ? 'A' : val;
        mapped.sessions[k] = normalizedVal;
      }
    }
  });

  return mapped;
}

export function validateTeamAttRow(row) {
  const errors = [];
  if (!row.rollNumber) errors.push('Roll Number required');
  if (!row.name) errors.push('Name required');
  return errors;
}

export function computeTeamAttImportDiff(rawRows, existing) {
  const toAdd = [], toUpdate = [], invalid = [];

  rawRows.forEach((row, i) => {
    const mapped = mapTeamAttRow(row);
    const errors = validateTeamAttRow(mapped);
    if (errors.length) { invalid.push({ row: i + 2, errors }); return; }

    const rn = mapped.rollNumber.toUpperCase();
    const ex = existing.find(r => r.rollNumber?.toUpperCase() === rn);
    if (ex) {
      toUpdate.push({ existing: ex, updates: mapped });
    } else {
      toAdd.push(mapped);
    }
  });

  return { toAdd, toUpdate, invalid, skipped: [] };
}

// Visitor attendance
const ATT_VISITOR_FIELD_MAP = {
  name: ['name', 'fullname', 'full name', 'visitor', 'visitorname', 'visitor name', 'person'],
  email: ['email', 'emailaddress', 'email address', 'mail'],
  phone: ['phone', 'phonenumber', 'phone number', 'mobile', 'contact'],
  purpose: ['purpose', 'reason', 'visiting', 'purpose of visit'],
  date: ['date', 'visitdate', 'visit date', 'entry date'],
};

export function mapVisitorAttRow(row) {
  return {
    name: findField(row, ATT_VISITOR_FIELD_MAP.name),
    email: findField(row, ATT_VISITOR_FIELD_MAP.email),
    phone: findField(row, ATT_VISITOR_FIELD_MAP.phone),
    purpose: findField(row, ATT_VISITOR_FIELD_MAP.purpose),
    date: findField(row, ATT_VISITOR_FIELD_MAP.date),
  };
}

export function validateVisitorRow(row) {
  const errors = [];
  if (!row.name) errors.push('Name required');
  if (!row.date) errors.push('Date required');
  return errors;
}

export function computeVisitorImportDiff(rawRows, existing) {
  const toAdd = [], toUpdate = [], invalid = [];

  rawRows.forEach((row, i) => {
    const mapped = mapVisitorAttRow(row);
    const errors = validateVisitorRow(mapped);
    if (errors.length) { invalid.push({ row: i + 2, errors }); return; }

    // Match by name + date combination
    const ex = existing.find(
      r => r.name?.toLowerCase() === mapped.name.toLowerCase() &&
           r.date === mapped.date
    );
    if (ex) {
      toUpdate.push({ existing: ex, updates: mapped });
    } else {
      toAdd.push(mapped);
    }
  });

  return { toAdd, toUpdate, invalid, skipped: [] };
}

/** Export array of objects to xlsx and trigger download */
export function exportToExcel(data, filename) {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Data');
  XLSX.writeFile(wb, filename + '.xlsx');
}

