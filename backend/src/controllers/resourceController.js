const db = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');


const adminListSubjects = asyncHandler(async (req, res) => {
  const subjects = await db.prepare('SELECT * FROM subjects ORDER BY semester, name').all();
  const withCounts = await Promise.all(subjects.map(async (s) => {
    const unitCount = (await db.prepare('SELECT COUNT(*) AS c FROM units WHERE subject_id = ?').get(s.id)).c;
    const resourceCount = (await db
      .prepare(`SELECT COUNT(*) AS c FROM resources r JOIN units u ON u.id = r.unit_id WHERE u.subject_id = ?`)
      .get(s.id)).c;
    return { ...s, unit_count: unitCount, resource_count: resourceCount };
  }));
  res.json({ subjects: withCounts });
});

const deleteSubject = asyncHandler(async (req, res) => {
  const subjectId = Number(req.params.subjectId);
  const info = await db.prepare('DELETE FROM subjects WHERE id = ?').run(subjectId);
  if (info.changes === 0) return res.status(404).json({ error: 'Subject not found.' });
  res.json({ ok: true });
});

const deleteUnit = asyncHandler(async (req, res) => {
  const unitId = Number(req.params.unitId);
  const info = await db.prepare('DELETE FROM units WHERE id = ?').run(unitId);
  if (info.changes === 0) return res.status(404).json({ error: 'Unit not found.' });
  res.json({ ok: true });
});
const renameSubject = asyncHandler(async (req, res) => {
  const subjectId = Number(req.params.subjectId);
  const { name, icon } = req.body;
  const subject = await db.prepare('SELECT id, semester FROM subjects WHERE id = ?').get(subjectId);
  if (!subject) return res.status(404).json({ error: 'Subject not found.' });

  const trimmedName = (name || '').trim();
  if (!trimmedName) return res.status(400).json({ error: 'Subject name cannot be empty.' });

  const existing = await db
    .prepare('SELECT id FROM subjects WHERE semester = ? AND lower(name) = lower(?) AND id != ?')
    .get(subject.semester, trimmedName, subjectId);
  if (existing) {
    return res.status(409).json({ error: `"${trimmedName}" already exists for this semester (id ${existing.id}).` });
  }

  await db.prepare('UPDATE subjects SET name = ?, icon = ? WHERE id = ?').run(trimmedName, icon || '📘', subjectId);
  res.json({ ok: true });
});
const renameUnit = asyncHandler(async (req, res) => {
  const unitId = Number(req.params.unitId);
  const { title } = req.body;
  const unit = await db.prepare('SELECT id, subject_id FROM units WHERE id = ?').get(unitId);
  if (!unit) return res.status(404).json({ error: 'Unit not found.' });

  const existing = await db
    .prepare('SELECT id FROM units WHERE subject_id = ? AND lower(title) = lower(?) AND id != ?')
    .get(unit.subject_id, title.trim(), unitId);
  if (existing) {
    return res.status(409).json({ error: `A unit called "${title}" already exists in this subject (id ${existing.id}).` });
  }

  await db.prepare('UPDATE units SET title = ? WHERE id = ?').run(title.trim(), unitId);
  res.json({ ok: true });
});

const renameResource = asyncHandler(async (req, res) => {
  const resourceId = Number(req.params.resourceId);
  const { title } = req.body;
  const resource = await db.prepare('SELECT id FROM resources WHERE id = ?').get(resourceId);
  if (!resource) return res.status(404).json({ error: 'Resource not found.' });
  if (!title || !title.trim()) return res.status(400).json({ error: 'Title cannot be empty.' });

  await db.prepare('UPDATE resources SET title = ? WHERE id = ?').run(title.trim(), resourceId);
  res.json({ ok: true });
});

const reorderUnit = asyncHandler(async (req, res) => {
  const unitId = Number(req.params.unitId);
  const direction = req.body.direction === 'up' ? 'up' : 'down';
  const unit = await db.prepare('SELECT id, subject_id, order_index FROM units WHERE id = ?').get(unitId);
  if (!unit) return res.status(404).json({ error: 'Unit not found.' });

  const neighbor = direction === 'up'
    ? await db.prepare('SELECT id, order_index FROM units WHERE subject_id = ? AND order_index < ? ORDER BY order_index DESC LIMIT 1').get(unit.subject_id, unit.order_index)
    : await db.prepare('SELECT id, order_index FROM units WHERE subject_id = ? AND order_index > ? ORDER BY order_index ASC LIMIT 1').get(unit.subject_id, unit.order_index);

  if (!neighbor) return res.json({ ok: true }); // already at the top/bottom, nothing to swap

  await db.prepare('UPDATE units SET order_index = ? WHERE id = ?').run(neighbor.order_index, unitId);
  await db.prepare('UPDATE units SET order_index = ? WHERE id = ?').run(unit.order_index, neighbor.id);
  res.json({ ok: true });
});

const reorderResource = asyncHandler(async (req, res) => {
  const resourceId = Number(req.params.resourceId);
  const direction = req.body.direction === 'up' ? 'up' : 'down';
  const resource = await db.prepare('SELECT id, unit_id, order_index FROM resources WHERE id = ?').get(resourceId);
  if (!resource) return res.status(404).json({ error: 'Resource not found.' });

  const neighbor = direction === 'up'
    ? await db.prepare('SELECT id, order_index FROM resources WHERE unit_id = ? AND order_index < ? ORDER BY order_index DESC LIMIT 1').get(resource.unit_id, resource.order_index)
    : await db.prepare('SELECT id, order_index FROM resources WHERE unit_id = ? AND order_index > ? ORDER BY order_index ASC LIMIT 1').get(resource.unit_id, resource.order_index);

  if (!neighbor) return res.json({ ok: true });

  await db.prepare('UPDATE resources SET order_index = ? WHERE id = ?').run(neighbor.order_index, resourceId);
  await db.prepare('UPDATE resources SET order_index = ? WHERE id = ?').run(resource.order_index, neighbor.id);
  res.json({ ok: true });
});

const deleteResource = asyncHandler(async (req, res) => {
  const resourceId = Number(req.params.resourceId);
  const resource = await db.prepare('SELECT url FROM resources WHERE id = ?').get(resourceId);
  if (!resource) return res.status(404).json({ error: 'Resource not found.' });

  await db.prepare('DELETE FROM resources WHERE id = ?').run(resourceId);
  res.json({ ok: true });
});

// ---- Read endpoints (any logged-in student) ---------------------------

const listSubjects = asyncHandler(async (req, res) => {
  const semester = Number(req.query.semester) || req.user.semester || 1;
  const subjects = await db.prepare('SELECT * FROM subjects WHERE semester = ? ORDER BY name').all(semester);

  const withProgress = await Promise.all(subjects.map(async (s) => {
    const total = (await db
      .prepare(`SELECT COUNT(*) AS c FROM resources r JOIN units u ON u.id = r.unit_id WHERE u.subject_id = ?`)
      .get(s.id)).c;
    const done = (await db
      .prepare(
        `SELECT COUNT(*) AS c FROM resource_progress rp
         JOIN resources r ON r.id = rp.resource_id
         JOIN units u ON u.id = r.unit_id
         WHERE u.subject_id = ? AND rp.user_id = ? AND rp.completed = 1`
      )
      .get(s.id, req.user.id)).c;
    return { ...s, progress_percent: total ? Math.round((done / total) * 100) : 0 };
  }));

  res.json({ subjects: withProgress });
});

// Counts of each resource type (notes/videos/PYQs/etc) across every subject
// in a semester, for the small stats strip on the Resource Hub page.
const typeCounts = asyncHandler(async (req, res) => {
  const semester = Number(req.query.semester) || req.user.semester || 1;
  const rows = await db
    .prepare(
      `SELECT r.type, COUNT(*) AS count
       FROM resources r
       JOIN units u ON u.id = r.unit_id
       JOIN subjects s ON s.id = u.subject_id
       WHERE s.semester = ?
       GROUP BY r.type`
    )
    .all(semester);
  const counts = {};
  rows.forEach((row) => { counts[row.type] = row.count; });
  res.json({ counts });
});

const getSubject = asyncHandler(async (req, res) => {
  const subject = await db.prepare('SELECT * FROM subjects WHERE id = ?').get(req.params.subjectId);
  if (!subject) return res.status(404).json({ error: 'Subject not found.' });

  // Record this as a "recently viewed" subject immediately -- don't wait
  // until the student opens a specific unit inside it. If a unit-level
  // view for this same subject is more recent, recentlyViewed() below
  // prefers that one instead of this subject-only entry.
  await db.prepare(
    `INSERT INTO recently_viewed_subjects (user_id, subject_id, viewed_at) VALUES (?, ?, CURRENT_TIMESTAMP)
     ON CONFLICT(user_id, subject_id) DO UPDATE SET viewed_at = CURRENT_TIMESTAMP`
  ).run(req.user.id, subject.id);

  const units = await db.prepare('SELECT * FROM units WHERE subject_id = ? ORDER BY order_index').all(subject.id);
  const unitsWithProgress = await Promise.all(units.map(async (u) => {
    const total = (await db.prepare('SELECT COUNT(*) AS c FROM resources WHERE unit_id = ?').get(u.id)).c;
    const done = (await db
      .prepare(
        `SELECT COUNT(*) AS c FROM resource_progress rp
         JOIN resources r ON r.id = rp.resource_id
         WHERE r.unit_id = ? AND rp.user_id = ? AND rp.completed = 1`
      )
      .get(u.id, req.user.id)).c;
    return { ...u, progress_percent: total ? Math.round((done / total) * 100) : 0 };
  }));

  res.json({ subject, units: unitsWithProgress });
});

const getUnit = asyncHandler(async (req, res) => {
  const unit = await db.prepare(
    `SELECT u.*, s.name AS subject_name FROM units u JOIN subjects s ON s.id = u.subject_id WHERE u.id = ?`
  ).get(req.params.unitId);
  if (!unit) return res.status(404).json({ error: 'Unit not found.' });

  await db.prepare(
    `INSERT INTO recently_viewed (user_id, unit_id, viewed_at) VALUES (?, ?, CURRENT_TIMESTAMP)
     ON CONFLICT(user_id, unit_id) DO UPDATE SET viewed_at = CURRENT_TIMESTAMP`
  ).run(req.user.id, unit.id);

  const resources = await db.prepare('SELECT * FROM resources WHERE unit_id = ? ORDER BY order_index, created_at').all(unit.id);
  const progressRows = await db
    .prepare(
      `SELECT resource_id, completed FROM resource_progress
       WHERE user_id = ? AND resource_id IN (SELECT id FROM resources WHERE unit_id = ?)`
    )
    .all(req.user.id, unit.id);
  const bookmarkRows = await db
    .prepare(
      `SELECT resource_id FROM bookmarks
       WHERE user_id = ? AND resource_id IN (SELECT id FROM resources WHERE unit_id = ?)`
    )
    .all(req.user.id, unit.id);

  const progressMap = Object.fromEntries(progressRows.map((r) => [r.resource_id, !!r.completed]));
  const bookmarkSet = new Set(bookmarkRows.map((r) => r.resource_id));

  const grouped = {};
  for (const r of resources) {
    grouped[r.type] = grouped[r.type] || [];
    grouped[r.type].push({ ...r, completed: !!progressMap[r.id], bookmarked: bookmarkSet.has(r.id) });
  }

  res.json({ unit, resources: grouped });
});

// All resources of one type (notes/videos/etc) within a semester, for
// clicking a type-count pill on the Resource Hub to filter down to it.
const byType = asyncHandler(async (req, res) => {
  const semester = Number(req.query.semester) || req.user.semester || 1;
  const type = String(req.query.type || '');
  const allowed = ['note', 'video', 'pyq', 'practice', 'book', 'important_topic'];
  if (!allowed.includes(type)) return res.status(400).json({ error: 'Invalid type.' });
  const results = await db
    .prepare(
      `SELECT r.id, r.type, r.title, r.url, u.id AS unit_id, u.title AS unit_title, s.name AS subject_name
       FROM resources r
       JOIN units u ON u.id = r.unit_id
       JOIN subjects s ON s.id = u.subject_id
       WHERE s.semester = ? AND r.type = ?
       ORDER BY s.name, u.order_index`
    )
    .all(semester, type);
  res.json({ results });
});

// Matches a resource's own title, its unit's title, or its subject's name --
// so searching a subject name (e.g. "Communication Skills") surfaces every
// resource filed under it, not just resources whose own title happens to
// contain the query. Both sides are lower()-ed, so the
// match is case-insensitive.
const search = asyncHandler(async (req, res) => {
  const q = String(req.query.q || '').trim();
  if (!q) return res.json({ results: [] });
  const like = `%${q}%`;
  const results = await db
    .prepare(
      `SELECT r.id, r.type, r.title, r.url, u.id AS unit_id, u.title AS unit_title, s.name AS subject_name
       FROM resources r
       JOIN units u ON u.id = r.unit_id
       JOIN subjects s ON s.id = u.subject_id
       WHERE lower(r.title) LIKE lower(?)
          OR lower(u.title) LIKE lower(?)
          OR lower(s.name) LIKE lower(?)
       ORDER BY s.name, u.order_index
       LIMIT 50`
    )
    .all(like, like, like);
  res.json({ results });
});

// ---- Write endpoints (student's own progress/bookmarks) --------------

const toggleProgress = asyncHandler(async (req, res) => {
  const resourceId = Number(req.params.resourceId);
  const resource = await db.prepare('SELECT id FROM resources WHERE id = ?').get(resourceId);
  if (!resource) return res.status(404).json({ error: 'Resource not found.' });

  const existing = await db
    .prepare('SELECT completed FROM resource_progress WHERE user_id = ? AND resource_id = ?')
    .get(req.user.id, resourceId);
  const nextValue = existing ? (existing.completed ? 0 : 1) : 1;

  await db.prepare(
    `INSERT INTO resource_progress (user_id, resource_id, completed, updated_at)
     VALUES (?, ?, ?, CURRENT_TIMESTAMP)
     ON CONFLICT(user_id, resource_id) DO UPDATE SET completed = excluded.completed, updated_at = CURRENT_TIMESTAMP`
  ).run(req.user.id, resourceId, nextValue);

  res.json({ completed: !!nextValue });
});

const toggleBookmark = asyncHandler(async (req, res) => {
  const resourceId = Number(req.params.resourceId);
  const existing = await db.prepare('SELECT 1 FROM bookmarks WHERE user_id = ? AND resource_id = ?').get(req.user.id, resourceId);
  if (existing) {
    await db.prepare('DELETE FROM bookmarks WHERE user_id = ? AND resource_id = ?').run(req.user.id, resourceId);
    return res.json({ bookmarked: false });
  }
  await db.prepare('INSERT INTO bookmarks (user_id, resource_id) VALUES (?, ?)').run(req.user.id, resourceId);
  res.json({ bookmarked: true });
});

const listBookmarks = asyncHandler(async (req, res) => {
  const rows = await db
    .prepare(
      `SELECT r.id, r.type, r.title, r.url, u.id AS unit_id, u.title AS unit_title, s.name AS subject_name
       FROM bookmarks b
       JOIN resources r ON r.id = b.resource_id
       JOIN units u ON u.id = r.unit_id
       JOIN subjects s ON s.id = u.subject_id
       WHERE b.user_id = ? ORDER BY b.created_at DESC`
    )
    .all(req.user.id);
  res.json({ bookmarks: rows });
});

const recentlyViewed = asyncHandler(async (req, res) => {
  // Combine unit-level views and subject-level views into one feed, so a
  // subject shows up in "Continue learning" the moment it's opened, and
  // then upgrades to "Subject · Unit" once a specific unit is opened.
  const unitRows = await db
    .prepare(
      `SELECT u.id AS unit_id, u.title, u.subject_id, s.name AS subject_name, rv.viewed_at
       FROM recently_viewed rv
       JOIN units u ON u.id = rv.unit_id
       JOIN subjects s ON s.id = u.subject_id
       WHERE rv.user_id = ?`
    )
    .all(req.user.id);

  const subjectRows = await db
    .prepare(
      `SELECT s.id AS subject_id, s.name AS subject_name, rvs.viewed_at
       FROM recently_viewed_subjects rvs
       JOIN subjects s ON s.id = rvs.subject_id
       WHERE rvs.user_id = ?`
    )
    .all(req.user.id);

  const combined = [
    ...unitRows.map((r) => ({
      type: 'unit', id: r.unit_id, subject_id: r.subject_id,
      title: r.title, subject_name: r.subject_name, viewed_at: r.viewed_at,
    })),
    ...subjectRows.map((r) => ({
      type: 'subject', id: r.subject_id, subject_id: r.subject_id,
      title: null, subject_name: r.subject_name, viewed_at: r.viewed_at,
    })),
  ];

  // One row per subject max -- keep whichever of (subject view, unit view)
  // happened most recently, so opening a subject then a unit inside it
  // doesn't show as two separate rows.
  const bySubject = new Map();
  for (const row of combined) {
    const existing = bySubject.get(row.subject_id);
    if (!existing || new Date(row.viewed_at) > new Date(existing.viewed_at)) {
      bySubject.set(row.subject_id, row);
    }
  }

  const recent = [...bySubject.values()]
    .sort((a, b) => new Date(b.viewed_at) - new Date(a.viewed_at))
    .slice(0, 5);

  res.json({ recent });
});

// ---- Admin write endpoints (content upload) ---------------------------

const createSubject = asyncHandler(async (req, res) => {
  const { name, semester, icon } = req.body;
  // A duplicate subject name in the same semester is almost always a
  // mistake (re-clicking "Add subject") and leads to content silently
  // landing under the wrong copy -- so block it outright instead of
  // creating an invisible-looking duplicate.
  const existing = await db
    .prepare('SELECT id FROM subjects WHERE semester = ? AND lower(name) = lower(?)')
    .get(semester, name.trim());
  if (existing) {
    return res.status(409).json({ error: `"${name}" already exists for semester ${semester} (id ${existing.id}). Use that one instead of creating a duplicate.` });
  }
  const info = await db.prepare('INSERT INTO subjects (name, semester, icon) VALUES (?, ?, ?)').run(name.trim(), semester, icon || '📘');
  res.status(201).json({ id: info.lastInsertRowid });
});

const createUnit = asyncHandler(async (req, res) => {
  const { subjectId, title, orderIndex } = req.body;
  const existing = await db
    .prepare('SELECT id FROM units WHERE subject_id = ? AND lower(title) = lower(?)')
    .get(subjectId, title.trim());
  if (existing) {
    return res.status(409).json({ error: `A unit called "${title}" already exists in this subject (id ${existing.id}). Use that one instead of creating a duplicate.` });
  }
  const info = await db
    .prepare('INSERT INTO units (subject_id, title, order_index) VALUES (?, ?, ?)')
    .run(subjectId, title.trim(), orderIndex || 0);
  res.status(201).json({ id: info.lastInsertRowid });
});

const createResource = asyncHandler(async (req, res) => {
  const { unitId, type, title, difficulty, year } = req.body;
  // Files are hosted on Google Drive now: the admin pastes the share link.
  const url = req.body.url;
  const maxOrder = (await db.prepare('SELECT COALESCE(MAX(order_index), -1) AS m FROM resources WHERE unit_id = ?').get(unitId)).m;
  const info = await db
    .prepare(
      `INSERT INTO resources (unit_id, type, title, url, difficulty, year, created_by, order_index)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(unitId, type, title, url || null, difficulty || null, year || null, req.user.id, maxOrder + 1);
  res.status(201).json({ id: info.lastInsertRowid, url });
});

module.exports = {
  listSubjects,
  typeCounts,
  getSubject,
  getUnit,
  search,
  byType,
  toggleProgress,
  toggleBookmark,
  listBookmarks,
  recentlyViewed,
  createSubject,
  createUnit,
  createResource,
  adminListSubjects,
  deleteSubject,
  deleteUnit,
  renameUnit,
  renameSubject,
  deleteResource,
  renameResource,
  reorderUnit,
  reorderResource,
};