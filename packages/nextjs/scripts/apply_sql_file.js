require('dotenv').config({ path: __dirname + '/../.env.local' })
const fs = require('fs')
const path = require('path')
const { Client } = require('pg')

async function main() {
  const inputPath = process.argv[2]
  if (!inputPath) {
    console.error('Usage: node apply_sql_file.js <sql-file-path>')
    process.exit(1)
  }

  const sqlFile = path.isAbsolute(inputPath) ? inputPath : path.join(__dirname, inputPath)
  if (!fs.existsSync(sqlFile)) {
    console.error('SQL file not found:', sqlFile)
    process.exit(1)
  }

  const sqlText = fs.readFileSync(sqlFile, 'utf8')
  const statements = sqlText
    .split('--> statement-breakpoint')
    .map((chunk) => chunk.trim())
    .filter(Boolean)

  const client = new Client({ connectionString: process.env.DATABASE_URL })
  await client.connect()

  try {
    console.log('Applying', sqlFile)
    for (const statement of statements) {
      console.log('Executing:', statement.slice(0, 120))
      await client.query(statement)
    }
    console.log('Applied successfully')
  } catch (error) {
    console.error('SQL application failed:', error)
    process.exitCode = 2
  } finally {
    await client.end()
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
