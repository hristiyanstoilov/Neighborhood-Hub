require('dotenv').config({ path: __dirname + '/../.env.local' })
const fs = require('fs')
const path = require('path')
const { Client } = require('pg')

async function main() {
  const migrationPath = path.join(__dirname, '../src/db/migrations/0026_dry_inertia.sql')
  if (!fs.existsSync(migrationPath)) {
    console.error('Migration file not found:', migrationPath)
    process.exit(1)
  }

  const sqlText = fs.readFileSync(migrationPath, 'utf8')
  const client = new Client({ connectionString: process.env.DATABASE_URL })
  await client.connect()
  try {
    console.log('Applying migration 0026...')
    // Split on semicolon and execute statements individually
    const stmts = sqlText
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0)

    for (const stmt of stmts) {
      console.log('Executing:', stmt.substring(0, 120))
      await client.query(stmt)
    }
    console.log('Migration 0026 applied successfully')
  } catch (err) {
    console.error('Migration failed:', err)
    process.exitCode = 2
  } finally {
    await client.end()
  }
}

main().catch(err => { console.error(err); process.exit(1) })
