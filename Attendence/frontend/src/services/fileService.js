// RC-TEAMS File Service — IndexedDB storage for uploaded PDFs
// Keeps files separate from LocalStorage (5 MB limit)

const DB_NAME = 'rcteams_files';
const DB_VERSION = 1;
const STORE = 'files';

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      e.target.result.createObjectStore(STORE, { keyPath: 'id' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/** Save a File object under the given id */
export async function saveFile(id, file) {
  if (!file || !(file instanceof Blob)) throw new Error('Invalid file');
  const arrayBuffer = await file.arrayBuffer();
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put({
      id,
      name: file.name,
      type: file.type,
      size: file.size,
      data: arrayBuffer,
      savedAt: new Date().toISOString()
    });
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

/** Retrieve a stored file record by id */
export async function getFile(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).get(id);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

/** Delete a stored file by id */
export async function deleteFile(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

/** Create an object URL for previewing a stored file */
export async function getFileURL(id) {
  const record = await getFile(id);
  if (!record) return null;
  const blob = new Blob([record.data], { type: record.type });
  return URL.createObjectURL(blob);
}

/** Validate a PDF file before saving */
export function validatePDF(file) {
  if (!file) return { valid: false, error: 'No file selected.' };
  if (file.type !== 'application/pdf') return { valid: false, error: 'Only PDF files are allowed.' };
  const maxMB = 20;
  if (file.size > maxMB * 1024 * 1024) return { valid: false, error: `File size exceeds ${maxMB} MB limit.` };
  return { valid: true };
}

