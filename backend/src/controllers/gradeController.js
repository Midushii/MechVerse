const db = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');

const listCourses = asyncHandler(async (req, res) => {
  const semester = Number(req.query.semester) || req.user.semester || 1;
  const courses = await db.prepare('SELECT * FROM courses WHERE semester = ?').all(semester);
  const withDetail = await Promise.all(courses.map((c) => buildCourseSummary(c, req.user.id)));
  res.json({ courses: withDetail });
});

async function buildCourseSummary(course, userId) {
  const components = await db.prepare('SELECT * FROM assessment_components WHERE course_id = ?').all(course.id);
  const marksRows = await db
    .prepare(
      `SELECT component_id, marks FROM student_marks
       WHERE user_id = ? AND component_id IN (SELECT id FROM assessment_components WHERE course_id = ?)`
    )
    .all(userId, course.id);
  const marksMap = Object.fromEntries(marksRows.map((r) => [r.component_id, r.marks]));

  const totalMax = components.reduce((s, c) => s + c.max_marks, 0);
  const scoredMax = components.reduce((s, c) => (marksMap[c.id] != null ? s + c.max_marks : s), 0);
  const scored = components.reduce((s, c) => s + (marksMap[c.id] || 0), 0);
  const currentPercent = scoredMax ? Math.round((scored / scoredMax) * 1000) / 10 : null;

  const target = await db.prepare('SELECT target_percent FROM grade_targets WHERE user_id = ? AND course_id = ?').get(userId, course.id);

  return {
    ...course,
    components: components.map((c) => ({ ...c, marks: marksMap[c.id] ?? null })),
    current_percent: currentPercent,
    target_percent: target ? target.target_percent : null,
    status: statusLabel(currentPercent, target ? target.target_percent : null),
  };
}

function statusLabel(currentPercent, targetPercent) {
  if (currentPercent == null) return 'not_started';
  if (targetPercent == null) return 'on_track';
  if (currentPercent >= targetPercent) return 'on_track';
  if (currentPercent >= targetPercent - 10) return 'needs_attention';
  return 'at_risk';
}

const saveMarks = asyncHandler(async (req, res) => {
  const { componentId, marks } = req.body;
  const component = await db.prepare('SELECT * FROM assessment_components WHERE id = ?').get(componentId);
  if (!component) return res.status(404).json({ error: 'Assessment component not found.' });
  if (marks != null && (marks < 0 || marks > component.max_marks)) {
    return res.status(400).json({ error: `Marks must be between 0 and ${component.max_marks}.` });
  }

  await db.prepare(
    `INSERT INTO student_marks (user_id, component_id, marks, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)
     ON CONFLICT(user_id, component_id) DO UPDATE SET marks = excluded.marks, updated_at = CURRENT_TIMESTAMP`
  ).run(req.user.id, componentId, marks);

  res.json({ ok: true });
});

const setTarget = asyncHandler(async (req, res) => {
  const { courseId, targetPercent } = req.body;
  if (targetPercent < 0 || targetPercent > 100) return res.status(400).json({ error: 'Target must be 0-100.' });

  await db.prepare(
    `INSERT INTO grade_targets (user_id, course_id, target_percent) VALUES (?, ?, ?)
     ON CONFLICT(user_id, course_id) DO UPDATE SET target_percent = excluded.target_percent`
  ).run(req.user.id, courseId, targetPercent);

  // Work out what's needed in remaining components to hit the target.
  const course = await db.prepare('SELECT * FROM courses WHERE id = ?').get(courseId);
  const summary = await buildCourseSummary(course, req.user.id);
  const totalMax = summary.components.reduce((s, c) => s + c.max_marks, 0);
  const neededTotal = (targetPercent / 100) * totalMax;
  const haveNow = summary.components.reduce((s, c) => s + (c.marks || 0), 0);
  const remainingComponents = summary.components.filter((c) => c.marks == null);
  const remainingMax = remainingComponents.reduce((s, c) => s + c.max_marks, 0);
  const stillNeeded = neededTotal - haveNow;

  let message;
  if (remainingComponents.length === 0) {
    message = summary.current_percent >= targetPercent ? 'Target already achieved.' : 'All components are graded, so this target is no longer reachable.';
  } else if (stillNeeded > remainingMax) {
    message = 'This target is not mathematically possible with the remaining assessments.';
  } else if (stillNeeded <= 0) {
    message = 'You have already secured this target regardless of remaining marks.';
  } else {
    message = `You need about ${Math.ceil(stillNeeded)} more marks out of ${remainingMax} remaining to hit ${targetPercent}%.`;
  }

  res.json({ ok: true, message, summary });
});

const historicalComparison = asyncHandler(async (req, res) => {
  const courseId = Number(req.params.courseId);
  const rows = await db.prepare('SELECT marks FROM historical_records WHERE course_id = ?').all(courseId);
  if (!rows.length) return res.json({ available: false });

  const marksArr = rows.map((r) => r.marks).sort((a, b) => a - b);
  const avg = marksArr.reduce((s, m) => s + m, 0) / marksArr.length;
  const highest = marksArr[marksArr.length - 1];
  const top10Index = Math.max(0, Math.floor(marksArr.length * 0.9));
  const top10 = marksArr[top10Index];

  const yourMarksRow = await db
    .prepare(
      `SELECT SUM(marks) as total FROM student_marks
       WHERE user_id = ? AND component_id IN (SELECT id FROM assessment_components WHERE course_id = ?)`
    )
    .get(req.user.id, courseId);
  const yourMarks = yourMarksRow.total || 0;
  const percentile = Math.round((marksArr.filter((m) => m <= yourMarks).length / marksArr.length) * 100);

  res.json({ available: true, average: Math.round(avg * 10) / 10, top10, highest, yourMarks, percentile });
});

module.exports = { listCourses, saveMarks, setTarget, historicalComparison };
