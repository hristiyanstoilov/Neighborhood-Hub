import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema'

type DB = ReturnType<typeof drizzle<typeof schema>>

let _instance: DB | undefined

// Proxy defers neon() call to first DB access so module load never throws
// during Next.js build when DATABASE_URL may not yet be validated.
export const db: DB = new Proxy({} as DB, {
  get(_: DB, key: string | symbol) {
    if (!_instance) {
      _instance = drizzle(neon(process.env.DATABASE_URL!), { schema })
    }
    const val = Reflect.get(_instance, key, _instance)
    return typeof val === 'function' ? (val as (...a: unknown[]) => unknown).bind(_instance) : val
  },
})
