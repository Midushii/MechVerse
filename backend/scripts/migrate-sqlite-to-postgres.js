
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const path = require('path');
const fs = require('fs');
const db = require('../src/config/db');

// Parents before children (foreign keys).
const TABLES = [
  'users', 'subjects', 'units', 'resources',
  'resource_progress', 'bookmarks', 'recently_viewed', 'recently_viewed_subjects',
  'password_reset_tokens',
  'courses', 'assessment_components', 'student_marks', 'grade_targets', 'historical_records',
  'labs', 'lab_files',
];
const TABLES_WITH_ID = new Set([
  'users', 'subjects', 'units', 'resources', 'password_reset_tokens',
  'courses', 'assessment_components', 'historical_records', 'labs', 'lab_files',
]);

async function main() {
  const dbPath = process.argv[2] || path.join(__dirname, '..', 'data', 'mechverse.db');
  if (!fs.existsSync(dbPath)) throw new Error(`SQLite file not found: ${dbPath}`);

  // node:sqlite ships inside Node 22+, so no extra install is needed for this.
  const { DatabaseSync } = require('node:sqlite');
  const lite = new DatabaseSync(dbPath, { readOnly: true });

  const existingTables = new Set(
    lite.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all().map((r) => r.name)
  );

  for (const table of TABLES) {
    if (!existingTables.has(table)) { console.log(`- ${table}: not in SQLite file, skipped`); continue; }

    const liteCols = lite.prepare(`PRAGMA table_info(${table})`).all().map((c) => c.name);
    const pgCols = (await db.prepare(
      "SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = ?"
    ).all(table)).map((r) => r.column_name);
    const cols = liteCols.filter((c) => pgCols.includes(c));
    if (!cols.length) { console.log(`- ${table}: no matching columns, skipped`); continue; }

    const rows = lite.prepare(`SELECT ${cols.join(', ')} FROM ${table}`).all();
    const placeholders = cols.map(() => '?').join(', ');
    // OVERRIDING SYSTEM VALUE lets us keep the original ids, so every
    // foreign key (resource -> unit -> subject, etc.) still lines up.
    const sql = `INSERT INTO ${table} (${cols.join(', ')}) ${TABLES_WITH_ID.has(table) ? 'OVERRIDING SYSTEM VALUE' : ''} VALUES (${placeholders}) ON CONFLICT DO NOTHING`;

    let inserted = 0;
    for (const row of rows) {
      const values = cols.map((c) => (row[c] === undefined ? null : row[c]));
      const r = await db.prepare(sql).run(...values);
      inserted += r.changes;
    }
    console.log(`- ${table}: ${inserted} of ${rows.length} rows copied`);

    if (TABLES_WITH_ID.has(table)) {
      // Make new rows continue after the highest copied id.
      await db.prepare(
        `SELECT setval(pg_get_serial_sequence('${table}', 'id'), COALESCE((SELECT MAX(id) FROM ${table}), 0) + 1, false)`
      ).get();
    }
  }
  console.log('\nData migration finished.');
}

main()
  .catch((e) => { console.error('\nMigration failed:', e.message); process.exitCode = 1; })
  .finally(() => db.close());
