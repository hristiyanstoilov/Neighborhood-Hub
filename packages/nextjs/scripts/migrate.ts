import { loadEnvConfig } from '@next/env'
loadEnvConfig(process.cwd())

import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { migrate } from 'drizzle-orm/neon-http/migrator'

const sql = neon(process.env.DATABASE_URL!)
const db = drizzle(sql)

migrate(db, { migrationsFolder: './src/db/migrations' })
  .then(() => { console.log('All migrations applied.'); process.exit(0) })
  .catch((err) => { console.error(err); process.exit(1) })
