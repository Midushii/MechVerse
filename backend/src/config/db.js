

const { Pool, types } = require('pg');

// Postgres returns COUNT()/bigint and NUMERIC as strings by default. The
// controllers expect real numbers, so parse them.
types.setTypeParser(20, (v) => parseInt(v, 10));   // bigint (COUNT(*), SUM of ints)
types.setTypeParser(1700, (v) => parseFloat(v));   // numeric

// Tables whose primary key is NOT a single "id" column.
const NO_ID_TABLES = new Set([
  'resource_progress',
  'bookmarks',
  'recently_viewed',
  'recently_viewed_subjects',
  'student_marks',
  'grade_targets',
]);

let pool = null;
function getPool() {
  if (pool) return pool;
  const raw = process.env.DATABASE_URL;
  if (!raw) throw new Error('DATABASE_URL is not set. Add it to backend/.env (local) or to your host\'s environment variables.');

  // Neon's string ends in ?sslmode=require&channel_binding=require. We drop
  // those two query params and ask the driver for TLS explicitly instead.
  const url = new URL(raw);
  url.searchParams.delete('sslmode');
  url.searchParams.delete('channel_binding');

  pool = new Pool({
    connectionString: url.toString(),
    ssl: { rejectUnauthorized: true },
    max: 5,                        // small: serverless functions each hold their own pool
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 20000, // a sleeping Neon database needs a moment to wake up
  });
  pool.on('error', (err) => console.error('[db] idle client error:', err.message));
  return pool;
}

function toPg(sql) {
  let i = 0;
  return sql.replace(/\?/g, () => `$${++i}`);
}

const db = {
  prepare(sql) {
    const text = toPg(sql);
    const ins = /^\s*insert\s+into\s+"?(\w+)"?/i.exec(sql);
    const table = ins ? ins[1].toLowerCase() : null;
    const wantsReturning = Boolean(ins) && !NO_ID_TABLES.has(table) && !/\breturning\b/i.test(sql);

    return {
      async get(...params) {
        const r = await getPool().query(text, params);
        return r.rows[0]; // undefined when no row, same as SQLite
      },
      async all(...params) {
        const r = await getPool().query(text, params);
        return r.rows;
      },
      async run(...params) {
        const r = await getPool().query(wantsReturning ? `${text} RETURNING id` : text, params);
        return {
          changes: r.rowCount,
          lastInsertRowid: wantsReturning && r.rows[0] ? r.rows[0].id : undefined,
        };
      },
    };
  },

  // Raw multi-statement SQL (used only by the schema script).
  async exec(sql) {
    return getPool().query(sql);
  },

  async close() {
    if (pool) { await pool.end(); pool = null; }
  },
};

module.exports = db;
