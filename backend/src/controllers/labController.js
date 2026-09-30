const db = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');


// ---- Student-facing ----

const listLabs = asyncHandler(async (req, res) => {
  const semester = Number(req.query.semester) || req.user.semester || 1;
  const labs = await db.prepare('SELECT * FROM labs WHERE semester = ? ORDER BY name').all(semester);
  res.json({ labs });
});

// A lab is flat: just its own row plus the files added under it. No
// experiments, objectives, viva questions, or any other sub-structure.
const getLab = asyncHandler(async (req, res) => {
  const lab = await db.prepare('SELECT * FROM labs WHERE id = ?').get(req.params.labId);
  if (!lab) return res.status(404).json({ error: 'Lab not found.' });
  const files = await db.prepare('SELECT * FROM lab_files WHERE lab_id = ? ORDER BY created_at').all(lab.id);
  res.json({ lab, files });
});

// ---- Admin ----

const adminListLabs = asyncHandler(async (req, res) => {
  const labs = await db.prepare('SELECT * FROM labs ORDER BY semester, name').all();
  const withCounts = await Promise.all(labs.map(async (l) => {
    const fileCount = (await db.prepare('SELECT COUNT(*) AS c FROM lab_files WHERE lab_id = ?').get(l.id)).c;
    return { ...l, file_count: fileCount };
  }));
  res.json({ labs: withCounts });
});

const createLab = asyncHandler(async (req, res) => {
  const { name, semester, icon } = req.body;
  const existing = await db
    .prepare('SELECT id FROM labs WHERE semester = ? AND lower(name) = lower(?)')
    .get(semester, name.trim());
  if (existing) {
    return res.status(409).json({ error: `A lab called "${name}" already exists for semester ${semester} (id ${existing.id}). Use that one instead of creating a duplicate.` });
  }
  const info = await db.prepare('INSERT INTO labs (name, semester, icon) VALUES (?, ?, ?)').run(name.trim(), semester, icon || '🧪');
  res.status(201).json({ id: info.lastInsertRowid });
});

// Rename a lab and/or change its icon. Both fields are optional so the
// admin UI can send just the one thing that changed.
const renameLab = asyncHandler(async (req, res) => {
  const labId = Number(req.params.labId);
  const lab = await db.prepare('SELECT * FROM labs WHERE id = ?').get(labId);
  if (!lab) return res.status(404).json({ error: 'Lab not found.' });

  const { name, icon } = req.body;
  const newName = name != null && name.trim() ? name.trim() : lab.name;
  const newIcon = icon != null && icon.trim() ? icon.trim() : lab.icon;

  await db.prepare('UPDATE labs SET name = ?, icon = ? WHERE id = ?').run(newName, newIcon, labId);
  res.json({ ok: true });
});

const deleteLab = asyncHandler(async (req, res) => {
  const labId = Number(req.params.labId);

  const info = await db.prepare('DELETE FROM labs WHERE id = ?').run(labId);
  if (info.changes === 0) return res.status(404).json({ error: 'Lab not found.' });
  res.json({ ok: true });
});

const createLabFile = asyncHandler(async (req, res) => {
  const { labId, title } = req.body;
  // Files are hosted on Google Drive now: the admin pastes the share link.
  const url = req.body.url;
  const info = await db
    .prepare('INSERT INTO lab_files (lab_id, title, url, created_by) VALUES (?, ?, ?, ?)')
    .run(labId, title, url || null, req.user.id);
  res.status(201).json({ id: info.lastInsertRowid, url });
});

// Edit a file's title and/or link after the fact. Re-uploading a new
// binary here isn't supported -- delete and re-add for that -- but the
// title and any URL/link can be corrected without losing the entry.
const updateLabFile = asyncHandler(async (req, res) => {
  const fileId = Number(req.params.fileId);
  const existing = await db.prepare('SELECT * FROM lab_files WHERE id = ?').get(fileId);
  if (!existing) return res.status(404).json({ error: 'File not found.' });

  const { title, url } = req.body;
  const newTitle = title != null && title.trim() ? title.trim() : existing.title;
  const newUrl = url !== undefined ? (url || null) : existing.url;

  await db.prepare('UPDATE lab_files SET title = ?, url = ? WHERE id = ?').run(newTitle, newUrl, fileId);
  res.json({ ok: true });
});

const deleteLabFile = asyncHandler(async (req, res) => {
  const fileId = Number(req.params.fileId);
  const file = await db.prepare('SELECT url FROM lab_files WHERE id = ?').get(fileId);
  if (!file) return res.status(404).json({ error: 'File not found.' });
  await db.prepare('DELETE FROM lab_files WHERE id = ?').run(fileId);
  res.json({ ok: true });
});

module.exports = {
  listLabs,
  getLab,
  adminListLabs,
  createLab,
  renameLab,
  deleteLab,
  createLabFile,
  updateLabFile,
  deleteLabFile,
};