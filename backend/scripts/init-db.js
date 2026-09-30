
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const db = require('../src/config/db');
const schema = require('../src/config/schema');

(async () => {
  try {
    await db.exec(schema);
    const t = await db.prepare(
      "SELECT COUNT(*) AS c FROM information_schema.tables WHERE table_schema = 'public'"
    ).get();
    console.log(`Done. The database now has ${t.c} tables.`);
  } catch (e) {
    console.error('db:init failed:', e.message);
    process.exitCode = 1;
  } finally {
    await db.close();
  }
})();
