
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const fs = require('fs');
const path = require('path');
const db = require('../src/config/db');

// Minimal CSV parser (handles quoted fields with commas).
function parseCsv(text) {
  const rows = [];
  let row = [], field = '', inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (ch === '"') inQuotes = false;
      else field += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ',') { row.push(field); field = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.some((c) => c !== '')) rows.push(row);
      row = [];
    } else field += ch;
  }
  row.push(field);
  if (row.some((c) => c !== '')) rows.push(row);
  return rows;
}

const stem = (name) => path.parse(String(name).trim()).name.toLowerCase();

async function main() {
  const apply = process.argv.includes('--apply');
  const csvPath = process.argv.find((a) => a.endsWith('.csv')) || path.join(__dirname, '..', '..', 'drive-files.csv');
  if (!fs.existsSync(csvPath)) throw new Error(`CSV not found: ${csvPath}`);

  const rows = parseCsv(fs.readFileSync(csvPath, 'utf8'));
  const header = rows[0].map((h) => h.trim().toLowerCase());
  const nameIdx = header.indexOf('name');
  const urlIdx = header.indexOf('url');
  if (nameIdx < 0 || urlIdx < 0) throw new Error('The CSV must have a header row with columns: name,url');

  const byStem = new Map();
  const dupes = [];
  for (const r of rows.slice(1)) {
    const key = stem(r[nameIdx]);
    if (!key || !r[urlIdx]) continue;
    if (byStem.has(key)) dupes.push(r[nameIdx]);
    byStem.set(key, r[urlIdx].trim());
  }
  console.log(`Drive list: ${byStem.size} files${dupes.length ? ` (${dupes.length} duplicate names -- last one wins)` : ''}`);

  let matched = 0, missing = [];
  for (const table of ['resources', 'lab_files']) {
    const items = await db.prepare(`SELECT id, url FROM ${table} WHERE url LIKE '/uploads/%'`).all();
    for (const it of items) {
      const link = byStem.get(stem(path.basename(it.url)));
      if (!link) { missing.push(`${table} #${it.id}: ${it.url}`); continue; }
      matched++;
      if (apply) await db.prepare(`UPDATE ${table} SET url = ? WHERE id = ?`).run(link, it.id);
    }
  }
  console.log(`${apply ? 'Updated' : 'Would update'} ${matched} links.`);
  if (missing.length) {
    console.log(`\n${missing.length} entries had NO matching Drive file (they keep the old /uploads path):`);
    missing.forEach((m) => console.log('  ' + m));
  }
  if (!apply) console.log('\nThis was a preview. Run again with --apply to save the changes.');
}

main()
  .catch((e) => { console.error('\nFailed:', e.message); process.exitCode = 1; })
  .finally(() => db.close());
