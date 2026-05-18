require('dotenv').config({path: __dirname + '/../.env.local'});
const { Client } = require('pg');
(async () => {
  const pg = new Client({ connectionString: process.env.DATABASE_URL });
  await pg.connect();
  const res = await pg.query("SELECT column_name FROM information_schema.columns WHERE table_name='profiles' AND column_name='default_location_id'");
  console.log(res.rows);
  await pg.end();
})().catch(e => { console.error(e); process.exit(1); });
