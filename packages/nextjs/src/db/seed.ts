import { loadEnvConfig } from '@next/env'
loadEnvConfig(process.cwd())

import bcrypt from 'bcryptjs'
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { eq } from 'drizzle-orm'
import * as schema from './schema'
import { locations, categories, users, profiles, skills, skillRequests } from './schema'

const sql = neon(process.env.DATABASE_URL!)
const db = drizzle(sql, { schema })

// ─── Demo credentials (all users share this password) ───────────────────────
const DEMO_PASSWORD = 'Demo1234!'

async function seed() {
  // ─── 1. Locations ────────────────────────────────────────────────────────
  console.log('Seeding locations...')

  await db.insert(locations).values([
    { city: 'Sofia', neighborhood: 'Lozenets',        lat: '42.676900', lng: '23.331500', type: 'neighborhood' },
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

  // ─── 2. Categories ───────────────────────────────────────────────────────
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

  // ─── 3. Guard: skip demo data if it already exists ───────────────────────
  const existing = await db.select({ id: users.id })
    .from(users)
    .where(eq(users.email, 'ivan@demo.bg'))
    .limit(1)

  if (existing.length > 0) {
    console.log('Demo users already exist — skipping demo data.')
    console.log('Done.')
    process.exit(0)
  }

  // ─── 4. Resolve location and category IDs ────────────────────────────────
  const allLocations = await db.select({ id: locations.id, neighborhood: locations.neighborhood })
    .from(locations)

  const allCategories = await db.select({ id: categories.id, slug: categories.slug })
    .from(categories)

  const loc = (name: string) => {
    const found = allLocations.find((l) => l.neighborhood === name)
    if (!found) throw new Error(`Location not found: ${name}`)
    return found.id
  }

  const cat = (slug: string) => {
    const found = allCategories.find((c) => c.slug === slug)
    if (!found) throw new Error(`Category not found: ${slug}`)
    return found.id
  }

  // ─── 5. Users ────────────────────────────────────────────────────────────
  console.log('Seeding demo users...')

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12)
  const now = new Date()

  const [ivan, maria, georgi, elena, nikola] = await db.insert(users).values([
    {
      email: 'ivan@demo.bg',
      passwordHash,
      role: 'user',
      emailVerifiedAt: now,
    },
    {
      email: 'maria@demo.bg',
      passwordHash,
      role: 'user',
      emailVerifiedAt: now,
    },
    {
      email: 'georgi@demo.bg',
      passwordHash,
      role: 'user',
      emailVerifiedAt: now,
    },
    {
      email: 'elena@demo.bg',
      passwordHash,
      role: 'user',
      emailVerifiedAt: now,
    },
    {
      email: 'nikola@demo.bg',
      passwordHash,
      role: 'user',
      emailVerifiedAt: now,
    },
  ]).returning()

  // ─── 6. Profiles ─────────────────────────────────────────────────────────
  console.log('Seeding demo profiles...')

  await db.insert(profiles).values([
    {
      userId: ivan.id,
      name: 'Ivan Petrov',
      bio: 'Full-stack developer with 6 years of experience. I love teaching Python and React to neighbors who want to get into tech. Happy to help with small freelance projects too.',
      locationId: loc('Lozenets'),
      isPublic: true,
    },
    {
      userId: maria.id,
      name: 'Maria Georgieva',
      bio: 'English and German teacher. I offer conversational practice for all levels — from absolute beginners to people preparing for job interviews abroad.',
      locationId: loc('Mladost 1'),
      isPublic: true,
    },
    {
      userId: georgi.id,
      name: 'Georgi Dimitrov',
      bio: 'Professional plumber and renovator. 15 years of hands-on experience. I can handle anything from a dripping tap to full bathroom renovation.',
      locationId: loc('Sredets'),
      isPublic: true,
    },
    {
      userId: elena.id,
      name: 'Elena Stoyanova',
      bio: 'Home cook passionate about Bulgarian cuisine. I teach traditional recipes passed down from my grandmother — banitsa, tarator, moussaka, and more.',
      locationId: loc('Oborishte'),
      isPublic: true,
    },
    {
      userId: nikola.id,
      name: 'Nikola Hristov',
      bio: 'Certified personal trainer and yoga instructor. I work with beginners and intermediate athletes. Sessions can be in-person at my home gym or in a nearby park.',
      locationId: loc('Studentski Grad'),
      isPublic: true,
    },
  ])

  // ─── 7. Skills ───────────────────────────────────────────────────────────
  console.log('Seeding demo skills...')

  const [
    pythonSkill,
    reactSkill,
    englishSkill,
    _germanSkill,
    plumbingSkill,
    _paintingSkill,
    cookingSkill,
    _bakingSkill,
    _fitnessSkill,
    yogaSkill,
  ] = await db.insert(skills).values([
    {
      ownerId: ivan.id,
      title: 'Python & Django tutoring',
      description: 'Learn Python from scratch or deepen your Django skills. I cover fundamentals, OOP, REST APIs, and database integration. Sessions tailored to your level and goals.',
      categoryId: cat('it-tech'),
      availableHours: 5,
      status: 'available',
      locationId: loc('Lozenets'),
    },
    {
      ownerId: ivan.id,
      title: 'React & Next.js consulting',
      description: 'Get unstuck on React or Next.js projects. I help with architecture decisions, performance issues, TypeScript typing, and best practices for production apps.',
      categoryId: cat('it-tech'),
      availableHours: 3,
      status: 'available',
      locationId: loc('Lozenets'),
    },
    {
      ownerId: maria.id,
      title: 'English conversation practice',
      description: 'Relaxed conversational English sessions for all levels. Great for people preparing for work interviews, travel, or who just want to improve their fluency. Online or in-person.',
      categoryId: cat('languages'),
      availableHours: 8,
      status: 'available',
      locationId: loc('Mladost 1'),
    },
    {
      ownerId: maria.id,
      title: 'German for beginners',
      description: 'Structured German lessons starting from A1. Learn greetings, everyday phrases, grammar basics, and pronunciation. I use communicative methods — no rote memorization.',
      categoryId: cat('languages'),
      availableHours: 4,
      status: 'available',
      locationId: loc('Mladost 1'),
    },
    {
      ownerId: georgi.id,
      title: 'Plumbing & pipe repairs',
      description: 'Leaky taps, blocked drains, new fixtures, or full bathroom replumbing. I bring my own tools and work cleanly. Available on weekdays and Saturday mornings.',
      categoryId: cat('home-repair'),
      availableHours: 10,
      status: 'available',
      locationId: loc('Sredets'),
    },
    {
      ownerId: georgi.id,
      title: 'Interior painting & wall preparation',
      description: 'Professional painting, spackle, priming, and finishing. I can match colors, repair cracks, and leave rooms spotless. Both small rooms and whole apartments.',
      categoryId: cat('home-repair'),
      availableHours: 6,
      status: 'busy',
      locationId: loc('Sredets'),
    },
    {
      ownerId: elena.id,
      title: 'Traditional Bulgarian cooking lessons',
      description: 'Hands-on cooking classes in my kitchen. We make classic dishes: shopska salad, stuffed peppers, gyuvech, kavarma. Max 2 people per session — very personal.',
      categoryId: cat('cooking'),
      availableHours: 5,
      status: 'available',
      locationId: loc('Oborishte'),
    },
    {
      ownerId: elena.id,
      title: 'Homemade bread & pastry baking',
      description: 'Learn to make banitsa, kozunak, pitka, and sourdough bread from scratch. I\'ll share family recipes and teach technique. Great for stress relief and delicious results.',
      categoryId: cat('cooking'),
      availableHours: 4,
      status: 'available',
      locationId: loc('Oborishte'),
    },
    {
      ownerId: nikola.id,
      title: 'Personal fitness training',
      description: 'One-on-one fitness sessions for all levels. I design programs for weight loss, muscle building, or general fitness. Can train at my home gym or in Borisova Garden.',
      categoryId: cat('fitness'),
      availableHours: 8,
      status: 'available',
      locationId: loc('Studentski Grad'),
    },
    {
      ownerId: nikola.id,
      title: 'Yoga & mobility sessions',
      description: 'Beginner-friendly yoga focused on flexibility, breathing, and stress reduction. Morning sessions preferred. Bring your own mat or borrow one of mine.',
      categoryId: cat('fitness'),
      availableHours: 6,
      status: 'available',
      locationId: loc('Studentski Grad'),
    },
  ]).returning()

  // ─── 8. Skill Requests ───────────────────────────────────────────────────
  console.log('Seeding demo skill requests...')

  const nextMonday = new Date()
  nextMonday.setDate(nextMonday.getDate() + ((1 + 7 - nextMonday.getDay()) % 7 || 7))
  nextMonday.setHours(10, 0, 0, 0)

  const d = (offsetDays: number, hour: number) => {
    const dt = new Date(nextMonday)
    dt.setDate(dt.getDate() + offsetDays)
    dt.setHours(hour, 0, 0, 0)
    return dt
  }

  await db.insert(skillRequests).values([
    // Maria requests Python tutoring from Ivan (pending)
    {
      userFromId: maria.id,
      userToId: ivan.id,
      skillId: pythonSkill.id,
      scheduledStart: d(0, 10),
      scheduledEnd: d(0, 12),
      meetingType: 'online',
      meetingUrl: 'https://meet.google.com/demo-python-session',
      status: 'pending',
      notes: 'I have basic programming knowledge but want to learn Python for data analysis.',
    },
    // Georgi requests English lessons from Maria (accepted)
    {
      userFromId: georgi.id,
      userToId: maria.id,
      skillId: englishSkill.id,
      scheduledStart: d(1, 18),
      scheduledEnd: d(1, 19),
      meetingType: 'in_person',
      status: 'accepted',
      notes: 'I need English for a job interview next month. Conversational practice please.',
    },
    // Nikola requests cooking lessons from Elena (pending)
    {
      userFromId: nikola.id,
      userToId: elena.id,
      skillId: cookingSkill.id,
      scheduledStart: d(3, 11),
      scheduledEnd: d(3, 13),
      meetingType: 'in_person',
      status: 'pending',
      notes: 'I\'m a complete beginner in the kitchen. Looking forward to learning some classics!',
    },
    // Ivan requests plumbing from Georgi (completed — past date)
    {
      userFromId: ivan.id,
      userToId: georgi.id,
      skillId: plumbingSkill.id,
      scheduledStart: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      scheduledEnd: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
      meetingType: 'in_person',
      status: 'completed',
      completedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
      notes: 'Kitchen tap dripping badly, need a replacement washer or new tap.',
    },
    // Elena requests React consulting from Ivan (rejected)
    {
      userFromId: elena.id,
      userToId: ivan.id,
      skillId: reactSkill.id,
      scheduledStart: d(5, 14),
      scheduledEnd: d(5, 16),
      meetingType: 'online',
      meetingUrl: 'https://meet.google.com/demo-react-session',
      status: 'rejected',
      notes: 'I want to build a simple website to promote my cooking classes.',
    },
    // Maria requests yoga from Nikola (pending)
    {
      userFromId: maria.id,
      userToId: nikola.id,
      skillId: yogaSkill.id,
      scheduledStart: d(2, 8),
      scheduledEnd: d(2, 9),
      meetingType: 'in_person',
      status: 'pending',
      notes: 'Complete beginner. Morning sessions work best for me.',
    },
  ])

  console.log('\nDone! Demo accounts created:')
  console.log('  ivan@demo.bg    — Ivan Petrov    (IT & Technology)')
  console.log('  maria@demo.bg   — Maria Georgieva (Languages)')
  console.log('  georgi@demo.bg  — Georgi Dimitrov (Home Repair)')
  console.log('  elena@demo.bg   — Elena Stoyanova (Cooking)')
  console.log('  nikola@demo.bg  — Nikola Hristov  (Fitness)')
  console.log(`  Password for all: ${DEMO_PASSWORD}`)
  process.exit(0)
}

seed().catch((err) => {
  console.error(err)
  process.exit(1)
})
