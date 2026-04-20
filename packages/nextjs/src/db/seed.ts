import { loadEnvConfig } from '@next/env'
loadEnvConfig(process.cwd())

import bcrypt from 'bcryptjs'
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { eq } from 'drizzle-orm'
import * as schema from './schema'
import { locations, categories, users, profiles, skills, skillRequests, tools, toolReservations, foodShares, foodReservations, events, eventAttendees, communityDrives, drivePledges } from './schema'

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

  if (process.argv.includes('--food')) {
    await seedFood()
    console.log('Done.')
    process.exit(0)
  }

  if (process.argv.includes('--events')) {
    await seedEvents()
    console.log('Done.')
    process.exit(0)
  }

  if (process.argv.includes('--drives')) {
    await seedDrives()
    console.log('Done.')
    process.exit(0)
  }

  // ─── 3. Guard: skip demo data if it already exists ───────────────────────
  const existing = await db.select({ id: users.id })
    .from(users)
    .where(eq(users.email, 'ivan@demo.bg'))
    .limit(1)

  if (existing.length > 0) {
    // Users already seeded — check if tools exist too
    const toolsExist = await db.select({ id: tools.id }).from(tools).limit(1)
    if (toolsExist.length > 0) {
      // Tools exist — still run events/drives/food in case they were added later
      await seedFood()
      await seedEvents()
      await seedDrives()
      console.log('Done.')
      process.exit(0)
    }

    // Users exist but tools don't — seed only tools + reservations
    console.log('Demo users exist. Seeding tools and reservations only...')
    const demoUsers = await db.select({ id: users.id, email: users.email }).from(users)
      .where(eq(users.email, 'ivan@demo.bg'))
      .limit(1)
    // Re-fetch all 5 demo users
    const allDemoUsers = await db.select({ id: users.id, email: users.email }).from(users)
    const byEmail = (e: string) => allDemoUsers.find((u) => u.email === e)!
    const _ivan   = byEmail('ivan@demo.bg')
    const _maria  = byEmail('maria@demo.bg')
    const _georgi = byEmail('georgi@demo.bg')
    const _elena  = byEmail('elena@demo.bg')
    const _nikola = byEmail('nikola@demo.bg')

    const allLocations2 = await db.select({ id: locations.id, neighborhood: locations.neighborhood }).from(locations)
    const allCategories2 = await db.select({ id: categories.id, slug: categories.slug }).from(categories)
    const loc2 = (name: string) => allLocations2.find((l) => l.neighborhood === name)!.id
    const cat2 = (slug: string) => allCategories2.find((c) => c.slug === slug)!.id

    await seedTools(db, { ivan: _ivan, maria: _maria, georgi: _georgi, elena: _elena, nikola: _nikola }, loc2, cat2)
    await seedFood()
    await seedEvents()
    await seedDrives()
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

  // ─── 9 + 10. Tools & Reservations ───────────────────────────────────────
  await seedTools(db, { ivan, maria, georgi, elena, nikola }, loc, cat)
  await seedFood()
  await seedEvents()
  await seedDrives()

  console.log('\nDone! Demo accounts created:')
  console.log('  ivan@demo.bg    — Ivan Petrov    (IT & Technology)')
  console.log('  maria@demo.bg   — Maria Georgieva (Languages)')
  console.log('  georgi@demo.bg  — Georgi Dimitrov (Home Repair)')
  console.log('  elena@demo.bg   — Elena Stoyanova (Cooking)')
  console.log('  nikola@demo.bg  — Nikola Hristov  (Fitness)')
  console.log(`  Password for all: ${DEMO_PASSWORD}`)
  process.exit(0)
}

// ─── Tools + Reservations (extracted so it can run standalone) ──────────────

async function seedTools(
  dbInstance: typeof db,
  userIds: { ivan: { id: string }; maria: { id: string }; georgi: { id: string }; elena: { id: string }; nikola: { id: string } },
  loc: (name: string) => string,
  cat: (slug: string) => string,
) {
  console.log('Seeding demo tools...')

  const { ivan, maria, georgi, elena, nikola } = userIds

  const [boschDrill, delonghiMachine, ladder, _kitchenAid, _yogaMats] = await dbInstance.insert(tools).values([
    {
      ownerId:     ivan.id,
      title:       'Bosch Cordless Drill',
      description: 'Powerful 18V cordless drill with 2 batteries. Comes with a full bit set. Perfect for wall mounting, furniture assembly, or light renovation work.',
      categoryId:  cat('home-repair'),
      locationId:  loc('Lozenets'),
      condition:   'good',
      status:      'available',
    },
    {
      ownerId:     maria.id,
      title:       'DeLonghi Espresso Machine',
      description: 'Semi-automatic espresso machine. Makes excellent espresso and cappuccino. Includes a steam wand for milk frothing. Great for house parties or if your machine is broken.',
      categoryId:  cat('other'),
      locationId:  loc('Mladost 1'),
      condition:   'new',
      status:      'available',
    },
    {
      ownerId:     georgi.id,
      title:       '3m Telescopic Ladder',
      description: 'Aluminium telescopic ladder, extends to 3 metres. Lightweight and easy to carry. Suitable for changing light bulbs, painting ceilings, or gutter cleaning.',
      categoryId:  cat('home-repair'),
      locationId:  loc('Sredets'),
      condition:   'fair',
      status:      'available',
    },
    {
      ownerId:     elena.id,
      title:       'KitchenAid Stand Mixer',
      description: 'Classic 4.8L KitchenAid stand mixer in empire red. Includes flat beater, dough hook, and wire whip. Ideal for bread, cakes, pastry, or pasta dough.',
      categoryId:  cat('cooking'),
      locationId:  loc('Oborishte'),
      condition:   'good',
      status:      'available',
    },
    {
      ownerId:     nikola.id,
      title:       'Yoga Mat Set (5 mats)',
      description: 'Set of 5 quality 6mm yoga mats in different colors. Great for group sessions, workshops, or if you have guests joining your practice. Non-slip and easy to clean.',
      categoryId:  cat('fitness'),
      locationId:  loc('Studentski Grad'),
      condition:   'good',
      status:      'available',
    },
  ]).returning()

  console.log('Seeding demo tool reservations...')

  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(0, 0, 0, 0)

  const dayAfter = (base: Date, days: number) => {
    const d = new Date(base)
    d.setDate(d.getDate() + days)
    return d
  }

  await dbInstance.insert(toolReservations).values([
    // Maria wants to borrow Ivan's drill — pending
    {
      toolId:     boschDrill.id,
      borrowerId: maria.id,
      ownerId:    ivan.id,
      startDate:  dayAfter(tomorrow, 1),
      endDate:    dayAfter(tomorrow, 4),
      status:     'pending',
      notes:      'Need it to hang some shelves in my living room. Will return clean.',
    },
    // Georgi borrowed the espresso machine — approved
    {
      toolId:     delonghiMachine.id,
      borrowerId: georgi.id,
      ownerId:    maria.id,
      startDate:  dayAfter(tomorrow, 3),
      endDate:    dayAfter(tomorrow, 5),
      status:     'approved',
      notes:      'Hosting a small birthday dinner, would love to make proper espressos.',
    },
    // Nikola borrowed the ladder last week — returned (historical)
    {
      toolId:     ladder.id,
      borrowerId: nikola.id,
      ownerId:    georgi.id,
      startDate:  new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      endDate:    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      status:     'returned',
      notes:      'Need to replace a smoke detector on the ceiling.',
    },
  ])
}

async function seedFood() {
  const existing = await db.select({ id: foodShares.id }).from(foodShares).limit(1)
  if (existing.length > 0) {
    console.log('Food already seeded, skipping')
    return
  }

  console.log('Seeding demo food shares...')

  const demoUsers = await db.select({ id: users.id, email: users.email }).from(users)
  const allLocations = await db.select({ id: locations.id, neighborhood: locations.neighborhood }).from(locations)

  const byEmail = (email: string) => {
    const found = demoUsers.find((user) => user.email === email)
    if (!found) throw new Error(`Demo user not found: ${email}`)
    return found
  }

  const locId = (neighborhood: string) => {
    const found = allLocations.find((location) => location.neighborhood === neighborhood)
    if (!found) throw new Error(`Location not found: ${neighborhood}`)
    return found.id
  }

  const elena = byEmail('elena@demo.bg')
  const ivan = byEmail('ivan@demo.bg')
  const maria = byEmail('maria@demo.bg')
  const georgi = byEmail('georgi@demo.bg')
  const nikola = byEmail('nikola@demo.bg')

  const [banitsa, bread, lyutenitsa, cake, soup] = await db.insert(foodShares).values([
    {
      ownerId: elena.id,
      title: 'Домашна баница — 6 порции',
      description: 'Прясно изпечена баница със сирене. Подходяща за семейна закуска.',
      quantity: 6,
      locationId: locId('Oborishte'),
      availableUntil: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      pickupInstructions: 'Вземане след 18:30, звъннете на входа.',
      status: 'available',
    },
    {
      ownerId: ivan.id,
      title: 'Кисело тесто хляб',
      description: 'Домашен квасен хляб, печен тази сутрин.',
      quantity: 2,
      locationId: locId('Lozenets'),
      availableUntil: new Date(Date.now() + 24 * 60 * 60 * 1000),
      pickupInstructions: 'Вземане вечер след 19:00.',
      status: 'available',
    },
    {
      ownerId: maria.id,
      title: 'Домашна лютеница — буркан',
      description: 'Домашна лютеница в буркани по ~500 мл.',
      quantity: 3,
      locationId: locId('Mladost 1'),
      availableUntil: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      pickupInstructions: 'Може и сутрин преди работа.',
      status: 'available',
    },
    {
      ownerId: georgi.id,
      title: 'Овощна торта — 8 парчета',
      description: 'Лека торта с сезонни плодове, подходяща за събиране с приятели.',
      quantity: 8,
      locationId: locId('Sredets'),
      availableUntil: new Date(Date.now() + 36 * 60 * 60 * 1000),
      pickupInstructions: 'Моля носете кутия за пренасяне.',
      status: 'available',
    },
    {
      ownerId: nikola.id,
      title: 'Постна чорба — 4 порции',
      description: 'Зеленчукова постна чорба, готова за сервиране.',
      quantity: 4,
      locationId: locId('Studentski Grad'),
      availableUntil: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      pickupInstructions: 'Вземане между 12:00 и 20:00.',
      status: 'reserved',
    },
  ]).returning({ id: foodShares.id })

  console.log('Seeding demo food reservations...')

  await db.insert(foodReservations).values([
    {
      foodShareId: banitsa.id,
      requesterId: ivan.id,
      ownerId: elena.id,
      pickupAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      status: 'pending',
      notes: 'Ще мина след работа около 19:30.',
    },
    {
      foodShareId: soup.id,
      requesterId: maria.id,
      ownerId: nikola.id,
      pickupAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      status: 'reserved',
      notes: 'Подходящо е след 18:00.',
    },
    {
      foodShareId: bread.id,
      requesterId: georgi.id,
      ownerId: ivan.id,
      pickupAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      status: 'cancelled',
      cancellationReason: 'Cancelled by requester',
      cancelledById: georgi.id,
      notes: 'Отменено поради промяна в графика.',
    },
  ])
}

async function seedEvents() {
  const existing = await db.select({ id: events.id }).from(events).limit(1)
  if (existing.length > 0) {
    console.log('Events already seeded, skipping')
    return
  }

  console.log('Seeding demo events...')

  const demoUsers = await db.select({ id: users.id, email: users.email }).from(users)
  const allLocations = await db.select({ id: locations.id, neighborhood: locations.neighborhood }).from(locations)

  const byEmail = (email: string) => {
    const found = demoUsers.find((u) => u.email === email)
    if (!found) throw new Error(`Demo user not found: ${email}`)
    return found
  }
  const locId = (neighborhood: string) => {
    const found = allLocations.find((l) => l.neighborhood === neighborhood)
    if (!found) throw new Error(`Location not found: ${neighborhood}`)
    return found.id
  }

  const ivan   = byEmail('ivan@demo.bg')
  const maria  = byEmail('maria@demo.bg')
  const georgi = byEmail('georgi@demo.bg')
  const elena  = byEmail('elena@demo.bg')
  const nikola = byEmail('nikola@demo.bg')

  const inDays = (n: number, hour = 10) => {
    const d = new Date()
    d.setDate(d.getDate() + n)
    d.setHours(hour, 0, 0, 0)
    return d
  }

  const [devMeetup, cookingWorkshop, yogaSession, languageExchange] = await db.insert(events).values([
    // Ivan organises a dev meetup next week
    {
      organizerId:  ivan.id,
      title:        'Sofia Dev Meetup — Web Performance',
      description:  'Informal gathering of local developers. Ivan will give a 30-min talk on Core Web Vitals and React Server Components, followed by open discussion. Bring your laptop!',
      locationId:   locId('Lozenets'),
      address:      'Coworking Hub Sofia, ul. Cherni Vrah 47, Lozenets',
      startsAt:     inDays(7, 18),
      endsAt:       inDays(7, 20),
      maxCapacity:  20,
      status:       'published',
    },
    // Elena organises a cooking workshop in two weeks
    {
      organizerId:  elena.id,
      title:        'Traditional Bulgarian Kitchen Workshop',
      description:  'Hands-on cooking session: we make shopska salad, tarator, and gyuvech from scratch. Elena provides all ingredients. Max 6 people — book early! Includes tasting.',
      locationId:   locId('Oborishte'),
      address:      'Elena\'s home kitchen, ul. Oborishte 22, Sofia',
      startsAt:     inDays(14, 11),
      endsAt:       inDays(14, 14),
      maxCapacity:  6,
      status:       'published',
    },
    // Nikola organises a group yoga session this weekend
    {
      organizerId:  nikola.id,
      title:        'Sunrise Yoga in Borisova Garden',
      description:  'Open-air yoga session for all levels. Meet at the main fountain. Bring your own mat (or borrow one of Nikola\'s). Suitable for complete beginners. Free of charge.',
      locationId:   locId('Studentski Grad'),
      address:      'Borisova Garden — main fountain entrance',
      startsAt:     inDays(3, 7),
      endsAt:       inDays(3, 9),
      maxCapacity:  15,
      status:       'published',
    },
    // Maria organised a language exchange last month — completed
    {
      organizerId:  maria.id,
      title:        'Language Exchange Café — English & German',
      description:  'Monthly language exchange at a local café. Participants pair up: native English speakers practice German, native German speakers practice English. Great atmosphere!',
      locationId:   locId('Mladost 1'),
      address:      'Café Centrale, bul. Al. Malinov 51, Mladost 1',
      startsAt:     inDays(-30, 17),
      endsAt:       inDays(-30, 19),
      maxCapacity:  null,
      status:       'completed',
    },
  ]).returning()

  console.log('Seeding demo event attendees...')

  await db.insert(eventAttendees).values([
    // Dev meetup: maria, georgi, elena attending
    { eventId: devMeetup.id,        userId: maria.id,  status: 'attending' },
    { eventId: devMeetup.id,        userId: georgi.id, status: 'attending' },
    { eventId: devMeetup.id,        userId: elena.id,  status: 'attending' },
    // Cooking workshop: ivan, nikola attending
    { eventId: cookingWorkshop.id,  userId: ivan.id,   status: 'attending' },
    { eventId: cookingWorkshop.id,  userId: nikola.id, status: 'attending' },
    // Yoga session: maria, georgi, elena attending; nikola is organizer so not in attendees
    { eventId: yogaSession.id,      userId: maria.id,  status: 'attending' },
    { eventId: yogaSession.id,      userId: georgi.id, status: 'attending' },
    { eventId: yogaSession.id,      userId: elena.id,  status: 'attending' },
    { eventId: yogaSession.id,      userId: ivan.id,   status: 'cancelled' },
    // Language exchange (completed): all four others attended
    { eventId: languageExchange.id, userId: ivan.id,   status: 'attending' },
    { eventId: languageExchange.id, userId: georgi.id, status: 'attending' },
    { eventId: languageExchange.id, userId: elena.id,  status: 'attending' },
    { eventId: languageExchange.id, userId: nikola.id, status: 'attending' },
  ]).onConflictDoNothing()
}

async function seedDrives() {
  const existing = await db.select({ id: communityDrives.id }).from(communityDrives).limit(1)
  if (existing.length > 0) {
    console.log('Drives already seeded, skipping')
    return
  }

  console.log('Seeding demo community drives...')

  const demoUsers = await db.select({ id: users.id, email: users.email }).from(users)

  const byEmail = (email: string) => {
    const found = demoUsers.find((u) => u.email === email)
    if (!found) throw new Error(`Demo user not found: ${email}`)
    return found
  }

  const ivan   = byEmail('ivan@demo.bg')
  const maria  = byEmail('maria@demo.bg')
  const georgi = byEmail('georgi@demo.bg')
  const elena  = byEmail('elena@demo.bg')
  const nikola = byEmail('nikola@demo.bg')

  const inDays = (n: number) => {
    const d = new Date()
    d.setDate(d.getDate() + n)
    d.setHours(23, 59, 0, 0)
    return d
  }

  const [winterClothes, schoolBooks, homemadeFood, gardenFund] = await db.insert(communityDrives).values([
    // Georgi collects winter clothes — open
    {
      organizerId:      georgi.id,
      title:            'Winter Clothes Collection for Families in Need',
      description:      'Collecting warm winter clothes (jackets, jumpers, boots) for families in Serdika and Nadezhda. Drop off clean, gently used items at the address below. All sizes welcome.',
      driveType:        'items',
      goalDescription:  'Collect at least 50 items of warm clothing by end of November',
      dropOffAddress:   'ul. Pirotska 12, Sredets — Georgi\'s storage room (ring bell on intercom)',
      deadline:         inDays(21),
      status:           'open',
    },
    // Maria collects books — open
    {
      organizerId:      maria.id,
      title:            'Books for Mladost Community Library',
      description:      'Donating books to the newly opened community reading room in Mladost 1. We especially need children\'s books, fiction, and language learning materials. Any language welcome.',
      driveType:        'items',
      goalDescription:  'Collect 200 books to fill the new shelves',
      dropOffAddress:   'bul. Al. Malinov 32, Mladost 1 — lobby of residential block',
      deadline:         inDays(14),
      status:           'open',
    },
    // Elena did a homemade food drive — completed
    {
      organizerId:      elena.id,
      title:            'Homemade Meals for Elderly Neighbours',
      description:      'Neighbours cooked and delivered homemade lunches to isolated elderly residents in Oborishte and Sredets. 12 residents received meals every day for a week.',
      driveType:        'food',
      goalDescription:  'Deliver 60+ homemade meals over 7 days',
      dropOffAddress:   null,
      deadline:         inDays(-7),
      status:           'completed',
    },
    // Ivan raises money for a community garden — open
    {
      organizerId:      ivan.id,
      title:            'Community Garden Fund — Lozenets',
      description:      'Raising funds to build raised garden beds in the small park on ul. Cherni Vrah. We need ~800 BGN for timber, soil, and seeds. Excess funds go toward watering equipment.',
      driveType:        'money',
      goalDescription:  'Raise 800 BGN for materials and tools',
      dropOffAddress:   null,
      deadline:         inDays(30),
      status:           'open',
    },
  ]).returning()

  console.log('Seeding demo drive pledges...')

  await db.insert(drivePledges).values([
    // Winter clothes: three pledges
    {
      driveId:            winterClothes.id,
      userId:             maria.id,
      pledgeDescription:  'I have 2 winter jackets (size M and L) and a bag of knitted jumpers to donate.',
      status:             'pledged',
    },
    {
      driveId:            winterClothes.id,
      userId:             elena.id,
      pledgeDescription:  'Dropping off children\'s boots (sizes 28–32) and a warm coat.',
      status:             'pledged',
    },
    {
      driveId:            winterClothes.id,
      userId:             nikola.id,
      pledgeDescription:  'Sports jackets and fleece tops — about 5 items total.',
      status:             'pledged',
    },
    // School books: two pledges
    {
      driveId:            schoolBooks.id,
      userId:             ivan.id,
      pledgeDescription:  'Around 15 programming and tech books — Python, JavaScript, Linux basics.',
      status:             'pledged',
    },
    {
      driveId:            schoolBooks.id,
      userId:             georgi.id,
      pledgeDescription:  'Box of children\'s books and a few Bulgarian fiction classics.',
      status:             'pledged',
    },
    // Homemade food drive (completed): all four others fulfilled
    {
      driveId:            homemadeFood.id,
      userId:             ivan.id,
      pledgeDescription:  'Cooked lentil soup and sandwiches for 3 residents on Tuesday and Thursday.',
      status:             'fulfilled',
    },
    {
      driveId:            homemadeFood.id,
      userId:             maria.id,
      pledgeDescription:  'Made banitsa and yoghurt pots for 4 residents every morning.',
      status:             'fulfilled',
    },
    {
      driveId:            homemadeFood.id,
      userId:             nikola.id,
      pledgeDescription:  'Delivered protein-rich meals (chicken, rice, salad) to 2 residents.',
      status:             'fulfilled',
    },
    // Community garden fund: two pledges
    {
      driveId:            gardenFund.id,
      userId:             maria.id,
      pledgeDescription:  'Contributing 100 BGN towards the timber for raised beds.',
      status:             'pledged',
    },
    {
      driveId:            gardenFund.id,
      userId:             georgi.id,
      pledgeDescription:  'I can donate 50 BGN and also help with the actual construction work.',
      status:             'pledged',
    },
  ]).onConflictDoNothing()
}

seed().catch((err) => {
  console.error(err)
  process.exit(1)
})
