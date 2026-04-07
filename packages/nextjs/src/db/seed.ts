import { loadEnvConfig } from '@next/env'
loadEnvConfig(process.cwd())

import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema'
import { locations, categories } from './schema'

const sql = neon(process.env.DATABASE_URL!)
const db = drizzle(sql, { schema })

async function seed() {
  console.log('Seeding locations...')

  await db.insert(locations).values([
    { city: 'Sofia', neighborhood: 'Lozenets',       lat: '42.676900', lng: '23.331500', type: 'neighborhood' },
    { city: 'Sofia', neighborhood: 'Studentski Grad', lat: '42.656800', lng: '23.353600', type: 'neighborhood' },
    { city: 'Sofia', neighborhood: 'Mladost 1',       lat: '42.651200', lng: '23.379900', type: 'neighborhood' },
    { city: 'Sofia', neighborhood: 'Mladost 2',       lat: '42.644200', lng: '23.386100', type: 'neighborhood' },
    { city: 'Sofia', neighborhood: 'Mladost 3',       lat: '42.636100', lng: '23.388400', type: 'neighborhood' },
    { city: 'Sofia', neighborhood: 'Mladost 4',       lat: '42.629800', lng: '23.394600', type: 'neighborhood' },
    { city: 'Sofia', neighborhood: 'Lyulin',          lat: '42.720300', lng: '23.258600', type: 'neighborhood' },
    { city: 'Sofia', neighborhood: 'Nadezhda',        lat: '42.736700', lng: '23.311400', type: 'neighborhood' },
    { city: 'Sofia', neighborhood: 'Serdika',         lat: '42.720500', lng: '23.317200', type: 'neighborhood' },
    { city: 'Sofia', neighborhood: 'Vazrazhdane',     lat: '42.695800', lng: '23.319100', type: 'neighborhood' },
    { city: 'Sofia', neighborhood: 'Oborishte',       lat: '42.693900', lng: '23.337700', type: 'neighborhood' },
    { city: 'Sofia', neighborhood: 'Sredets',         lat: '42.693100', lng: '23.325800', type: 'neighborhood' },
    { city: 'Sofia', neighborhood: 'Triaditza',       lat: '42.682700', lng: '23.315500', type: 'neighborhood' },
    { city: 'Sofia', neighborhood: 'Ilinden',         lat: '42.703900', lng: '23.295100', type: 'neighborhood' },
    { city: 'Sofia', neighborhood: 'Krasno Selo',     lat: '42.681100', lng: '23.298700', type: 'neighborhood' },
    { city: 'Sofia', neighborhood: 'Vitosha',         lat: '42.656700', lng: '23.316200', type: 'neighborhood' },
    { city: 'Sofia', neighborhood: 'Boyana',          lat: '42.630200', lng: '23.271400', type: 'neighborhood' },
    { city: 'Sofia', neighborhood: 'Pancharevo',      lat: '42.601900', lng: '23.433100', type: 'neighborhood' },
  ]).onConflictDoNothing()

  console.log('Seeding categories...')

  await db.insert(categories).values([
    { slug: 'it-tech',        label: 'IT & Technology',       icon: 'laptop' },
    { slug: 'languages',      label: 'Languages & Tutoring',  icon: 'book' },
    { slug: 'home-repair',    label: 'Home Repair & DIY',     icon: 'hammer' },
    { slug: 'design',         label: 'Design & Creative',     icon: 'palette' },
    { slug: 'cooking',        label: 'Cooking & Baking',      icon: 'chef-hat' },
    { slug: 'fitness',        label: 'Fitness & Sports',      icon: 'dumbbell' },
    { slug: 'music',          label: 'Music & Instruments',   icon: 'music' },
    { slug: 'childcare',      label: 'Childcare & Education', icon: 'baby' },
    { slug: 'gardening',      label: 'Gardening & Plants',    icon: 'leaf' },
    { slug: 'transport',      label: 'Transport & Moving',    icon: 'car' },
    { slug: 'legal-finance',  label: 'Legal & Finance',       icon: 'scale' },
    { slug: 'health-medical', label: 'Health & Medical',      icon: 'heart' },
    { slug: 'pets',           label: 'Pets & Animal Care',    icon: 'paw' },
    { slug: 'other',          label: 'Other',                 icon: 'star' },
  ]).onConflictDoNothing()

  console.log('Done.')
  process.exit(0)
}

seed().catch((err) => {
  console.error(err)
  process.exit(1)
})
