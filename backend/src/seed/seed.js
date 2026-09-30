
require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const db = require('../config/db');

async function subjectId(name, semester, icon) {
  const existing = await db.prepare('SELECT id FROM subjects WHERE name = ? AND semester = ?').get(name, semester);
  if (existing) return existing.id;
  return (await db.prepare('INSERT INTO subjects (name, semester, icon) VALUES (?, ?, ?)').run(name, semester, icon)).lastInsertRowid;
}

async function unitId(subjId, title, order) {
  const existing = await db.prepare('SELECT id FROM units WHERE subject_id = ? AND title = ?').get(subjId, title);
  if (existing) return existing.id;
  return (await db.prepare('INSERT INTO units (subject_id, title, order_index) VALUES (?, ?, ?)').run(subjId, title, order)).lastInsertRowid;
}

async function addResource(uId, type, title, opts = {}) {
  const existing = await db.prepare('SELECT id FROM resources WHERE unit_id = ? AND type = ? AND title = ?').get(uId, type, title);
  if (existing) return;
  await db.prepare('INSERT INTO resources (unit_id, type, title, url, difficulty, year) VALUES (?, ?, ?, ?, ?, ?)').run(
    uId, type, title, opts.url || null, opts.difficulty || null, opts.year || null
  );
}

async function courseId(name, semester, credits) {
  const existing = await db.prepare('SELECT id FROM courses WHERE name = ? AND semester = ?').get(name, semester);
  if (existing) return existing.id;
  return (await db.prepare('INSERT INTO courses (name, semester, credits) VALUES (?, ?, ?)').run(name, semester, credits)).lastInsertRowid;
}

async function componentId(cId, name, maxMarks) {
  const existing = await db.prepare('SELECT id FROM assessment_components WHERE course_id = ? AND name = ?').get(cId, name);
  if (existing) return existing.id;
  return (await db.prepare('INSERT INTO assessment_components (course_id, name, max_marks) VALUES (?, ?, ?)').run(cId, name, maxMarks)).lastInsertRowid;
}

// Every course gets Mid Semester (/30), Internal Marks (/10), End Semester
// (/60) and Lab Practical Marks (/30), except Applied Mathematics, which has
// no lab so its Mid Semester counts in full.
async function seedGradeSubject(name, semester, hasLab) {
  const cId = await courseId(name, semester, 4);
  await componentId(cId, 'Mid Semester', 30);
  await componentId(cId, 'Internal Marks', 10);
  await componentId(cId, 'End Semester', 60);
  if (hasLab) await componentId(cId, 'Lab Practical Marks', 30);
  return cId;
}

async function labId(name, semester) {
  const existing = await db.prepare('SELECT id FROM labs WHERE name = ? AND semester = ?').get(name, semester);
  if (existing) return existing.id;
  return (await db.prepare('INSERT INTO labs (name, semester) VALUES (?, ?)').run(name, semester)).lastInsertRowid;
}

async function main() {
  // ---- Resource Hub sample data ----
  const mechId = await subjectId('Engineering Mechanics', 3, '📘');
  const u1 = await unitId(mechId, 'Unit 1: Force Systems', 1);
  await addResource(u1, 'note', 'Force Systems - Complete Notes');
  await addResource(u1, 'video', 'Free Body Diagrams Explained', { url: 'https://www.youtube.com/results?search_query=free+body+diagram' });
  await addResource(u1, 'pyq', '2025 Midsem Paper', { year: '2025 Midsem' });
  await addResource(u1, 'pyq', '2024 Endsem Paper', { year: '2024 Endsem' });
  await addResource(u1, 'practice', 'Resolve forces on an inclined plane', { difficulty: 'basic' });
  await addResource(u1, 'practice', 'Find resultant of concurrent force system', { difficulty: 'medium' });
  await addResource(u1, 'practice', 'Equilibrium of a truss under mixed loading', { difficulty: 'exam_level' });
  await addResource(u1, 'important_topic', 'Free Body Diagram');
  await addResource(u1, 'important_topic', 'Resultant Forces');
  await addResource(u1, 'important_topic', 'Equilibrium');

  const thermoId = await subjectId('Thermodynamics', 3, '📙');
  const t1 = await unitId(thermoId, 'Unit 1: Laws of Thermodynamics', 1);
  await addResource(t1, 'note', 'First and Second Law - Notes');
  await addResource(t1, 'pyq', '2025 Midsem Paper', { year: '2025 Midsem' });
  await addResource(t1, 'practice', 'Carnot cycle efficiency problem', { difficulty: 'medium' });

  // ---- Grade Planner: Semester 1 & 2 ----
  await seedGradeSubject('Applied Mathematics', 1, false);
  for (const n of ['Applied Physics', 'Elements of Mechanical Engineering', 'Programming Fundamentals', 'Workshop Practice', 'Communication Skills']) {
    await seedGradeSubject(n, 1, true);
  }
  for (const n of [
    'Probability and Statistics', 'Environmental Sciences', 'Engineering Mechanics',
    'Introduction to Data Science', 'Engineering Graphics & CAD Modelling', 'Soft Skills and Personality Development',
  ]) {
    await seedGradeSubject(n, 2, true);
  }

  // A little anonymized historical data for the comparison feature.
  const mechCourse = await courseId('Engineering Mechanics', 2, 4);
  const midComp = (await db.prepare('SELECT id FROM assessment_components WHERE course_id = ? AND name = ?').get(mechCourse, 'Mid Semester')).id;
  const histCount = (await db.prepare('SELECT COUNT(*) AS c FROM historical_records WHERE component_id = ?').get(midComp)).c;
  if (histCount === 0) {
    const sample = [12, 15, 18, 20, 22, 24, 25, 27, 28, 29, 14, 16, 19, 21, 23, 26, 30, 17, 13, 20];
    for (const m of sample) {
      await db.prepare('INSERT INTO historical_records (course_id, component_id, marks, batch_year) VALUES (?, ?, ?, ?)').run(mechCourse, midComp, m, 2025);
    }
  }

  // ---- Lab Companion ----
  await labId('CAD Lab', 3);

  console.log('Seed complete.');
}

main()
  .catch((e) => { console.error('Seed failed:', e.message); process.exitCode = 1; })
  .finally(() => db.close());
