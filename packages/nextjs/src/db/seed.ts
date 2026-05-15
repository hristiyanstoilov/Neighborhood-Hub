import { loadEnvConfig } from '@next/env'
loadEnvConfig(process.cwd())

import bcrypt from 'bcryptjs'
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { eq, sql as sqlExpr } from 'drizzle-orm'
import * as schema from './schema'
import { locations, categories, users, profiles, skills, skillRequests, tools, toolReservations, foodShares, foodReservations, events, eventAttendees, communityDrives, drivePledges, ratings, conversations, messages, feedEvents } from './schema'

const sql = neon(process.env.DATABASE_URL!)
const db = drizzle(sql, { schema })

// ─── Demo credentials (all users share this password) ───────────────────────
const DEMO_PASSWORD = 'Demo1234!'
const DEMO_USER_EMAIL = 'demo@neighborhoodhub.bg'
const DEMO_USER_PASSWORD = 'demo1234'
const DEMO_USER_NAME = 'Demo User'
const DEMO_USER_BIO = 'Explore the app freely.'

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

  if (process.argv.includes('--conversations')) {
    await seedConversations()
    console.log('Done.')
    process.exit(0)
  }

  if (process.argv.includes('--bulk')) {
    await seedBulk()
    console.log('Done.')
    process.exit(0)
  }

  // ─── 3. Guard: skip demo data if it already exists ───────────────────────
  const existing = await db.select({ id: users.id })
    .from(users)
    .where(eq(users.email, 'ivan@demo.bg'))
    .limit(1)

  if (existing.length > 0) {
    await ensureDemoUserAndProfile()

    // Users already seeded — check if tools exist too
    const toolsExist = await db.select({ id: tools.id }).from(tools).limit(1)
    if (toolsExist.length > 0) {
      // Tools exist — still run events/drives/food in case they were added later
      await seedFood()
      await seedEvents()
      await seedDrives()
      await seedRatings()
      await seedConversations()
      console.log('Done.')
      process.exit(0)
    }

    // Users exist but tools don't — seed only tools + reservations
    console.log('Demo users exist. Seeding tools and reservations only...')
    const demoUsers = await db.select({ id: users.id, email: users.email }).from(users)
      .where(eq(users.email, 'ivan@demo.bg'))
      .limit(1)
    // Re-fetch all demo users
    const allDemoUsers = await db.select({ id: users.id, email: users.email }).from(users)
    const byEmail = (e: string) => allDemoUsers.find((u) => u.email === e)!
    const _ivan    = byEmail('ivan@demo.bg')
    const _maria   = byEmail('maria@demo.bg')
    const _georgi  = byEmail('georgi@demo.bg')
    const _elena   = byEmail('elena@demo.bg')
    const _nikola  = byEmail('nikola@demo.bg')
    const _stoyan  = byEmail('stoyan@demo.bg')
    const _petya   = byEmail('petya@demo.bg')
    const _dimitar = byEmail('dimitar@demo.bg')

    const allLocations2 = await db.select({ id: locations.id, neighborhood: locations.neighborhood }).from(locations)
    const allCategories2 = await db.select({ id: categories.id, slug: categories.slug }).from(categories)
    const loc2 = (name: string) => allLocations2.find((l) => l.neighborhood === name)!.id
    const cat2 = (slug: string) => allCategories2.find((c) => c.slug === slug)!.id

    await seedTools(db, { ivan: _ivan, maria: _maria, georgi: _georgi, elena: _elena, nikola: _nikola, stoyan: _stoyan, petya: _petya, dimitar: _dimitar }, loc2, cat2)
    await seedFood()
    await seedEvents()
    await seedDrives()
    await seedRatings()
    await seedConversations()
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
  const demoPasswordHash = await bcrypt.hash(DEMO_USER_PASSWORD, 12)
  const now = new Date()

  const [ivan, maria, georgi, elena, nikola, stoyan, petya, dimitar, demoUser] = await db.insert(users).values([
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
    {
      email: 'stoyan@demo.bg',
      passwordHash,
      role: 'user',
      emailVerifiedAt: now,
    },
    {
      email: 'petya@demo.bg',
      passwordHash,
      role: 'user',
      emailVerifiedAt: now,
    },
    {
      email: 'dimitar@demo.bg',
      passwordHash,
      role: 'user',
      emailVerifiedAt: now,
    },
    {
      email: DEMO_USER_EMAIL,
      passwordHash: demoPasswordHash,
      role: 'user',
      emailVerifiedAt: now,
    },
  ]).onConflictDoNothing().returning()

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
    {
      userId: stoyan.id,
      name: 'Stoyan Nikolov',
      bio: 'Guitar teacher and musician with 12 years of experience. I teach acoustic and electric guitar for all levels — from picking up the instrument for the first time to preparing for a stage performance.',
      locationId: loc('Lyulin'),
      isPublic: true,
    },
    {
      userId: petya.id,
      name: 'Petya Ivanova',
      bio: 'Freelance graphic designer specialising in brand identity and UI/UX. I help small businesses and individuals create professional visuals — logos, social media kits, and clickable prototypes.',
      locationId: loc('Vitosha'),
      isPublic: true,
    },
    {
      userId: dimitar.id,
      name: 'Dimitar Vasilev',
      bio: 'Passionate urban gardener with a rooftop garden and two balcony plots. I grow tomatoes, herbs, and flowers, and love helping neighbours set up their first container gardens.',
      locationId: loc('Boyana'),
      isPublic: true,
    },
    {
      userId: demoUser.id,
      name: DEMO_USER_NAME,
      bio: DEMO_USER_BIO,
      isPublic: true,
    },
  ]).onConflictDoNothing()

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
    guitarSkill,
    _musicTheorySkill,
    logoSkill,
    _uiSkill,
    balconySkill,
    _veggieSkill,
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
    {
      ownerId: stoyan.id,
      title: 'Guitar lessons — beginner to intermediate',
      description: 'Learn acoustic or electric guitar from scratch. We cover chords, strumming patterns, music theory basics, and your favourite songs. Lessons at my place in Lyulin or online.',
      categoryId: cat('music'),
      availableHours: 6,
      status: 'available',
      locationId: loc('Lyulin'),
    },
    {
      ownerId: stoyan.id,
      title: 'Music theory & ear training',
      description: 'Understand scales, intervals, chord progressions, and rhythm. Perfect for self-taught musicians who want to fill gaps in their theory knowledge. Online sessions available.',
      categoryId: cat('music'),
      availableHours: 4,
      status: 'available',
      locationId: loc('Lyulin'),
    },
    {
      ownerId: petya.id,
      title: 'Logo & brand identity design',
      description: 'Professional logo design for small businesses, freelancers, or community projects. I deliver vector files, a colour palette, and a mini brand guide. 2–3 revision rounds included.',
      categoryId: cat('design'),
      availableHours: 8,
      status: 'available',
      locationId: loc('Vitosha'),
    },
    {
      ownerId: petya.id,
      title: 'UI/UX prototyping in Figma',
      description: 'From wireframes to clickable Figma prototypes. I can help design a landing page, mobile app screen, or dashboard. Also happy to do design reviews of existing interfaces.',
      categoryId: cat('design'),
      availableHours: 5,
      status: 'available',
      locationId: loc('Vitosha'),
    },
    {
      ownerId: dimitar.id,
      title: 'Balcony & terrace garden setup',
      description: 'I help you plan and set up a balcony or terrace garden. We choose containers, soil, plants, and watering systems to suit your space and sunlight. Visits or video calls.',
      categoryId: cat('gardening'),
      availableHours: 6,
      status: 'available',
      locationId: loc('Boyana'),
    },
    {
      ownerId: dimitar.id,
      title: 'Growing vegetables & composting',
      description: 'Practical guide to growing tomatoes, peppers, cucumbers, and herbs in containers or small plots. Covers composting, natural pest control, and soil enrichment.',
      categoryId: cat('gardening'),
      availableHours: 4,
      status: 'available',
      locationId: loc('Boyana'),
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
    // Ivan requests guitar lessons from Stoyan (pending)
    {
      userFromId: ivan.id,
      userToId: stoyan.id,
      skillId: guitarSkill.id,
      scheduledStart: d(6, 17),
      scheduledEnd: d(6, 18),
      meetingType: 'in_person',
      status: 'pending',
      notes: 'I always wanted to learn guitar. A colleague recommended you — hope we can arrange something!',
    },
    // Maria requests logo design from Petya (pending)
    {
      userFromId: maria.id,
      userToId: petya.id,
      skillId: logoSkill.id,
      scheduledStart: d(4, 10),
      scheduledEnd: d(4, 11),
      meetingType: 'online',
      meetingUrl: 'https://meet.google.com/demo-logo-session',
      status: 'pending',
      notes: 'I need a simple logo for my language tutoring service. Something clean and friendly.',
    },
    // Georgi requests balcony garden advice from Dimitar (accepted)
    {
      userFromId: georgi.id,
      userToId: dimitar.id,
      skillId: balconySkill.id,
      scheduledStart: d(2, 15),
      scheduledEnd: d(2, 16),
      meetingType: 'in_person',
      status: 'accepted',
      notes: 'South-facing balcony, want to grow peppers and tomatoes this summer.',
    },
    // Petya requests React consulting from Ivan (accepted)
    {
      userFromId: petya.id,
      userToId: ivan.id,
      skillId: reactSkill.id,
      scheduledStart: d(1, 14),
      scheduledEnd: d(1, 15),
      meetingType: 'online',
      meetingUrl: 'https://meet.google.com/demo-react-petya',
      status: 'accepted',
      notes: 'Building a portfolio site in Next.js — need help with routing and image optimisation.',
    },
  ])

  // ─── 9 + 10. Tools & Reservations ───────────────────────────────────────
  await seedTools(db, { ivan, maria, georgi, elena, nikola, stoyan, petya, dimitar }, loc, cat)
  await seedFood()
  await seedEvents()
  await seedDrives()
  await seedRatings()
  await seedConversations()

  console.log('\nDone! Demo accounts created:')
  console.log('  ivan@demo.bg    — Ivan Petrov     (IT & Technology)')
  console.log('  maria@demo.bg   — Maria Georgieva  (Languages)')
  console.log('  georgi@demo.bg  — Georgi Dimitrov  (Home Repair)')
  console.log('  elena@demo.bg   — Elena Stoyanova  (Cooking)')
  console.log('  nikola@demo.bg  — Nikola Hristov   (Fitness)')
  console.log('  stoyan@demo.bg  — Stoyan Nikolov   (Music)')
  console.log('  petya@demo.bg   — Petya Ivanova    (Design)')
  console.log('  dimitar@demo.bg — Dimitar Vasilev  (Gardening)')
  console.log(`  Password for all: ${DEMO_PASSWORD}`)
  process.exit(0)
}

async function ensureDemoUserAndProfile() {
  const existingDemo = await db.query.users.findFirst({
    where: eq(users.email, DEMO_USER_EMAIL),
  })

  if (existingDemo) {
    await db.insert(profiles).values({
      userId: existingDemo.id,
      name: DEMO_USER_NAME,
      bio: DEMO_USER_BIO,
      isPublic: true,
    }).onConflictDoNothing()
    return existingDemo
  }

  const demoPasswordHash = await bcrypt.hash(DEMO_USER_PASSWORD, 12)
  const now = new Date()

  const [createdDemo] = await db.insert(users).values({
    email: DEMO_USER_EMAIL,
    passwordHash: demoPasswordHash,
    role: 'user',
    emailVerifiedAt: now,
  }).onConflictDoNothing().returning()

  const resolvedDemo = createdDemo ?? await db.query.users.findFirst({
    where: eq(users.email, DEMO_USER_EMAIL),
  })

  if (resolvedDemo) {
    await db.insert(profiles).values({
      userId: resolvedDemo.id,
      name: DEMO_USER_NAME,
      bio: DEMO_USER_BIO,
      isPublic: true,
    }).onConflictDoNothing()
  }

  return resolvedDemo
}

// ─── Tools + Reservations (extracted so it can run standalone) ──────────────

async function seedTools(
  dbInstance: typeof db,
  userIds: { ivan: { id: string }; maria: { id: string }; georgi: { id: string }; elena: { id: string }; nikola: { id: string }; stoyan: { id: string }; petya: { id: string }; dimitar: { id: string } },
  loc: (name: string) => string,
  cat: (slug: string) => string,
) {
  console.log('Seeding demo tools...')

  const { ivan, maria, georgi, elena, nikola, stoyan, petya, dimitar } = userIds

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
    {
      ownerId:     stoyan.id,
      title:       'Fender Frontman 10G Guitar Amplifier',
      description: 'Compact 10-watt practice amplifier. Perfect for beginners or acoustic rehearsal sessions. Has a clean channel and overdrive. Includes a 3m instrument cable.',
      categoryId:  cat('music'),
      locationId:  loc('Lyulin'),
      condition:   'good',
      status:      'available',
    },
    {
      ownerId:     petya.id,
      title:       'Wacom Intuos Pro Drawing Tablet (M)',
      description: 'Professional-grade graphics tablet, medium size. Comes with the Wacom Pro Pen 2. Compatible with Photoshop, Illustrator, Figma, Procreate (via sidecar). USB and Bluetooth.',
      categoryId:  cat('design'),
      locationId:  loc('Vitosha'),
      condition:   'good',
      status:      'available',
    },
    {
      ownerId:     dimitar.id,
      title:       'Bosch ART 23 SL Cordless Grass Trimmer',
      description: 'Lightweight cordless grass trimmer for balconies and small gardens. 18V battery included. Ideal for edging paths or trimming lawn borders. Easy to store in a small flat.',
      categoryId:  cat('gardening'),
      locationId:  loc('Boyana'),
      condition:   'good',
      status:      'available',
    },
    {
      ownerId:     dimitar.id,
      title:       'Garden Tool Set (spade, fork, trowel, rake)',
      description: 'Complete 4-piece garden tool set in a canvas carry bag. Perfect for raised beds, balcony planters, or allotment plots. Tools are clean and well-maintained.',
      categoryId:  cat('gardening'),
      locationId:  loc('Boyana'),
      condition:   'fair',
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
  const stoyan = byEmail('stoyan@demo.bg')
  const petya = byEmail('petya@demo.bg')
  const dimitar = byEmail('dimitar@demo.bg')

  const [banitsa, bread, lyutenitsa, cake, soup, tarator, jam, tomatoes, moussaka] = await db.insert(foodShares).values([
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
    {
      ownerId: stoyan.id,
      title: 'Таратор — 4 порции',
      description: 'Домашен студен таратор с кисело мляко, краставица и орехи. Перфектен за горещите дни.',
      quantity: 4,
      locationId: locId('Lyulin'),
      availableUntil: new Date(Date.now() + 24 * 60 * 60 * 1000),
      pickupInstructions: 'Вземане сутринта между 9:00 и 12:00.',
      status: 'available',
    },
    {
      ownerId: petya.id,
      title: 'Домашно сладко от ягоди — 2 буркана',
      description: 'Сладко от пресни ягоди, наготвено без консерванти. Буркани от по 400 мл.',
      quantity: 2,
      locationId: locId('Vitosha'),
      availableUntil: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      pickupInstructions: 'По договорка — пиши преди да дойдеш.',
      status: 'available',
    },
    {
      ownerId: dimitar.id,
      title: 'Пресни домати от градината — 2 кг',
      description: 'Узрели домати от балконската градина, отглеждани без пестициди. Разни сортове — черешови и телешко сърце.',
      quantity: 2,
      locationId: locId('Boyana'),
      availableUntil: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      pickupInstructions: 'Вземане следобед между 17:00 и 20:00.',
      status: 'available',
    },
    {
      ownerId: elena.id,
      title: 'Мусака — 6 порции',
      description: 'Класическа домашна мусака с картофи, кайма и млечна заливка. Направена днес, готова за вземане.',
      quantity: 6,
      locationId: locId('Oborishte'),
      availableUntil: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      pickupInstructions: 'Вземане след 18:00, носете кутия или тенджера.',
      status: 'available',
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
    {
      foodShareId: tarator.id,
      requesterId: elena.id,
      ownerId: stoyan.id,
      pickupAt: new Date(Date.now() + 20 * 60 * 60 * 1000),
      status: 'pending',
      notes: 'Ще мина сутринта преди пазар.',
    },
    {
      foodShareId: tomatoes.id,
      requesterId: nikola.id,
      ownerId: dimitar.id,
      pickupAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 17 * 60 * 60 * 1000),
      status: 'pending',
      notes: 'Търсех точно такива, без химия! Мога да взема след 18:00.',
    },
    {
      foodShareId: moussaka.id,
      requesterId: stoyan.id,
      ownerId: elena.id,
      pickupAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 18 * 60 * 60 * 1000),
      status: 'reserved',
      notes: 'Страхотно! Идвам в 18:30.',
    },
  ])
}

async function seedRatings() {
  const existing = await db.select({ id: ratings.id }).from(ratings).limit(1)
  if (existing.length > 0) {
    console.log('Ratings already seeded, skipping')
    return
  }

  console.log('Seeding demo ratings...')

  const [completedRequest] = await db
    .select({ id: skillRequests.id, userFromId: skillRequests.userFromId, userToId: skillRequests.userToId })
    .from(skillRequests)
    .where(eq(skillRequests.status, 'completed'))
    .limit(1)

  const [returnedReservation] = await db
    .select({ id: toolReservations.id, borrowerId: toolReservations.borrowerId, ownerId: toolReservations.ownerId })
    .from(toolReservations)
    .where(eq(toolReservations.status, 'returned'))
    .limit(1)

  const seedRows: Array<typeof ratings.$inferInsert> = []

  if (completedRequest) {
    seedRows.push(
      {
        raterId: completedRequest.userFromId,
        ratedUserId: completedRequest.userToId,
        contextType: 'skill_request',
        contextId: completedRequest.id,
        score: 5,
        comment: 'Excellent help, very professional and quick.',
      },
      {
        raterId: completedRequest.userToId,
        ratedUserId: completedRequest.userFromId,
        contextType: 'skill_request',
        contextId: completedRequest.id,
        score: 4,
        comment: 'Great communication and prepared in advance.',
      }
    )
  }

  if (returnedReservation) {
    seedRows.push(
      {
        raterId: returnedReservation.borrowerId,
        ratedUserId: returnedReservation.ownerId,
        contextType: 'tool_reservation',
        contextId: returnedReservation.id,
        score: 5,
        comment: 'Tool was exactly as described and easy to coordinate pickup.',
      },
      {
        raterId: returnedReservation.ownerId,
        ratedUserId: returnedReservation.borrowerId,
        contextType: 'tool_reservation',
        contextId: returnedReservation.id,
        score: 3,
        comment: 'Returned safely, but with a small delay.',
      }
    )
  }

  if (seedRows.length === 0) {
    console.log('No completed contexts found for ratings seed, skipping')
    return
  }

  await db.insert(ratings).values(seedRows).onConflictDoNothing()

  const impactedUserIds = [...new Set(seedRows.map((row) => row.ratedUserId))]
  for (const userId of impactedUserIds) {
    const [agg] = await db
      .select({
        avg: sqlExpr<string | null>`AVG(${ratings.score})::numeric(3,2)`,
        count: sqlExpr<number>`COUNT(*)::int`,
      })
      .from(ratings)
      .where(eq(ratings.ratedUserId, userId))

    await db
      .update(profiles)
      .set({
        avgRating: agg?.avg ?? null,
        ratingCount: agg?.count ?? 0,
      })
      .where(eq(profiles.userId, userId))
  }
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
  const stoyan = byEmail('stoyan@demo.bg')
  const petya  = byEmail('petya@demo.bg')
  const dimitar = byEmail('dimitar@demo.bg')

  const inDays = (n: number, hour = 10) => {
    const d = new Date()
    d.setDate(d.getDate() + n)
    d.setHours(hour, 0, 0, 0)
    return d
  }

  const [devMeetup, cookingWorkshop, yogaSession, languageExchange, guitarJam, gardenDay] = await db.insert(events).values([
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
    // Stoyan organises a guitar jam session next week
    {
      organizerId:  stoyan.id,
      title:        'Open Guitar Jam — All Levels Welcome',
      description:  'Bring your guitar and join a relaxed jam session in Lyulin Park. We play folk, pop, and blues. Absolute beginners can watch and ask questions. Stoyan brings extra guitars.',
      locationId:   locId('Lyulin'),
      address:      'Lyulin Park — main stage area near the fountain',
      startsAt:     inDays(10, 15),
      endsAt:       inDays(10, 18),
      maxCapacity:  20,
      status:       'published',
    },
    // Dimitar organises a community garden planting day
    {
      organizerId:  dimitar.id,
      title:        'Community Garden Planting Day — Boyana',
      description:  'Join us to plant seedlings and set up raised beds at the Boyana community plot. Dimitar brings seeds, tools, and soil mix. Perfect for gardening beginners. Kids welcome!',
      locationId:   locId('Boyana'),
      address:      'Boyana Community Garden, ul. Boyanska Rzeka 3',
      startsAt:     inDays(5, 9),
      endsAt:       inDays(5, 13),
      maxCapacity:  12,
      status:       'published',
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
    // Guitar jam: ivan, petya, nikola attending
    { eventId: guitarJam.id,        userId: ivan.id,   status: 'attending' },
    { eventId: guitarJam.id,        userId: petya.id,  status: 'attending' },
    { eventId: guitarJam.id,        userId: nikola.id, status: 'attending' },
    { eventId: guitarJam.id,        userId: maria.id,  status: 'cancelled' },
    // Garden planting day: georgi, elena, stoyan attending
    { eventId: gardenDay.id,        userId: georgi.id, status: 'attending' },
    { eventId: gardenDay.id,        userId: elena.id,  status: 'attending' },
    { eventId: gardenDay.id,        userId: stoyan.id, status: 'attending' },
    { eventId: gardenDay.id,        userId: petya.id,  status: 'attending' },
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
  const stoyan = byEmail('stoyan@demo.bg')
  const petya  = byEmail('petya@demo.bg')
  const dimitar = byEmail('dimitar@demo.bg')

  const inDays = (n: number) => {
    const d = new Date()
    d.setDate(d.getDate() + n)
    d.setHours(23, 59, 0, 0)
    return d
  }

  const [winterClothes, schoolBooks, homemadeFood, gardenFund, seedSwap] = await db.insert(communityDrives).values([
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
    // Dimitar organises a seed and seedling swap — open
    {
      organizerId:      dimitar.id,
      title:            'Spring Seed Swap — Boyana & Vitosha',
      description:      'Bring seeds or seedlings you have to spare and take home something new. Tomatoes, peppers, herbs, flowers — all welcome. Free event, donations of seeds appreciated.',
      driveType:        'items',
      goalDescription:  'Collect 30+ seed varieties for the community swap table',
      dropOffAddress:   'Boyana Community Garden, ul. Boyanska Rzeka 3',
      deadline:         inDays(18),
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
    // Seed swap: four pledges
    {
      driveId:            seedSwap.id,
      userId:             elena.id,
      pledgeDescription:  'Bringing a mix of basil, parsley, and dill seeds, plus 6 tomato seedlings.',
      status:             'pledged',
    },
    {
      driveId:            seedSwap.id,
      userId:             georgi.id,
      pledgeDescription:  'I have pepper seeds (4 varieties) and a few sunflower plants to contribute.',
      status:             'pledged',
    },
    {
      driveId:            seedSwap.id,
      userId:             petya.id,
      pledgeDescription:  'Bringing strawberry runners and a small pot of mint.',
      status:             'pledged',
    },
    {
      driveId:            seedSwap.id,
      userId:             ivan.id,
      pledgeDescription:  'Courgette and cucumber seeds from last year\'s harvest.',
      status:             'pledged',
    },
  ]).onConflictDoNothing()
}

async function seedConversations() {
  const existingConvs = await db.select({ id: conversations.id }).from(conversations).limit(1)
  if (existingConvs.length > 0) {
    console.log('Conversations already seeded, skipping')
    return
  }

  console.log('Seeding demo conversations and messages...')

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
  const stoyan = byEmail('stoyan@demo.bg')
  const petya  = byEmail('petya@demo.bg')
  const dimitar = byEmail('dimitar@demo.bg')

  const pair = (a: string, b: string) =>
    a < b ? { participantA: a, participantB: b } : { participantA: b, participantB: a }

  // Conversation 1: Ivan ↔ Maria
  const [convIvanMaria] = await db.insert(conversations).values(pair(ivan.id, maria.id)).returning()

  const msgsAgo = (minutes: number) => new Date(Date.now() - minutes * 60 * 1000)

  await db.insert(messages).values([
    {
      conversationId: convIvanMaria.id,
      senderId: maria.id,
      body: 'Здравей Ivan! Исках да попитам — все още ли предлагаш Python tutoring? Интересувам се от Data Analysis.',
      createdAt: msgsAgo(120),
      readAt: msgsAgo(110),
    },
    {
      conversationId: convIvanMaria.id,
      senderId: ivan.id,
      body: 'Привет Maria! Да, точно сега имам свободни часове. Какво ниво имаш — начинаещ или вече имаш малко опит?',
      createdAt: msgsAgo(100),
      readAt: msgsAgo(90),
    },
    {
      conversationId: convIvanMaria.id,
      senderId: maria.id,
      body: 'Имам малко опит с Excel и основите на програмирането, но Python ми е напълно ново. Може ли да тренираме онлайн?',
      createdAt: msgsAgo(85),
      readAt: msgsAgo(80),
    },
    {
      conversationId: convIvanMaria.id,
      senderId: ivan.id,
      body: 'Разбира се! Ще ти изпратя линк за първата сесия — събота 10:00 ти подходящо ли е?',
      createdAt: msgsAgo(70),
      readAt: msgsAgo(65),
    },
    {
      conversationId: convIvanMaria.id,
      senderId: maria.id,
      body: 'Перфектно! Ще съм готова. Благодаря!',
      createdAt: msgsAgo(60),
      readAt: msgsAgo(55),
    },
  ])

  // Conversation 2: Georgi ↔ Elena
  const [convGeorgiElena] = await db.insert(conversations).values(pair(georgi.id, elena.id)).returning()

  await db.insert(messages).values([
    {
      conversationId: convGeorgiElena.id,
      senderId: georgi.id,
      body: 'Elena, видях обявата ти за баница. Все още ли е налична? Ще мина около 19:30.',
      createdAt: msgsAgo(48 * 60),
      readAt: msgsAgo(47 * 60),
    },
    {
      conversationId: convGeorgiElena.id,
      senderId: elena.id,
      body: 'Да, налична е! Запазвам ти 2 порции. Звъни на входа като дойдеш.',
      createdAt: msgsAgo(47 * 60 - 30),
      readAt: msgsAgo(47 * 60 - 20),
    },
    {
      conversationId: convGeorgiElena.id,
      senderId: georgi.id,
      body: 'Страхотно, благодаря! Ще взема и нещо за ответност — обичаш ли домати от градината?',
      createdAt: msgsAgo(46 * 60),
      readAt: msgsAgo(45 * 60),
    },
    {
      conversationId: convGeorgiElena.id,
      senderId: elena.id,
      body: '😄 Много обичам! Ще се видим тази вечер.',
      createdAt: msgsAgo(44 * 60),
      readAt: null,
    },
  ])

  // Conversation 3: Nikola ↔ Ivan (about the fitness skill)
  const [convNikolaIvan] = await db.insert(conversations).values(pair(nikola.id, ivan.id)).returning()

  await db.insert(messages).values([
    {
      conversationId: convNikolaIvan.id,
      senderId: nikola.id,
      body: 'Иван, искам да направим size for size — аз те уча на Yoga, ти ме учиш React. Как ти звучи?',
      createdAt: msgsAgo(3 * 24 * 60),
      readAt: msgsAgo(3 * 24 * 60 - 30),
    },
    {
      conversationId: convNikolaIvan.id,
      senderId: ivan.id,
      body: 'Много интересна идея! Аз точно исках да се науча на yoga. Напиши ми кога си свободен.',
      createdAt: msgsAgo(3 * 24 * 60 - 60),
      readAt: msgsAgo(3 * 24 * 60 - 50),
    },
    {
      conversationId: convNikolaIvan.id,
      senderId: nikola.id,
      body: 'Уикенд сутрин — събота или неделя около 8:00. Ти?',
      createdAt: msgsAgo(3 * 24 * 60 - 90),
      readAt: null,
    },
  ])

  // Conversation 4: Stoyan ↔ Petya (creative collaboration)
  const [convStoyanPetya] = await db.insert(conversations).values(pair(stoyan.id, petya.id)).returning()

  await db.insert(messages).values([
    {
      conversationId: convStoyanPetya.id,
      senderId: stoyan.id,
      body: 'Привет Petya! Организирам jam сесия за началото на май и ми трябва малко помощ с флайер. Мислиш ли, че можеш да направиш нещо просто?',
      createdAt: msgsAgo(2 * 24 * 60),
      readAt: msgsAgo(2 * 24 * 60 - 20),
    },
    {
      conversationId: convStoyanPetya.id,
      senderId: petya.id,
      body: 'Разбира се! Много обичам музикални проекти. Изпрати ми детайли — дата, място, тема/жанр — и ще скицирам нещо тази вечер.',
      createdAt: msgsAgo(2 * 24 * 60 - 40),
      readAt: msgsAgo(2 * 24 * 60 - 30),
    },
    {
      conversationId: convStoyanPetya.id,
      senderId: stoyan.id,
      body: '10 май, Lyulin Park, Blues & Folk jam, безплатно. Искам нещо ръчно рисувано ако е възможно — или поне такъв вид.',
      createdAt: msgsAgo(2 * 24 * 60 - 50),
      readAt: msgsAgo(2 * 24 * 60 - 45),
    },
    {
      conversationId: convStoyanPetya.id,
      senderId: petya.id,
      body: 'Перфектно! Ще направя нещо с линейна илюстрация и топли цветове. Ще ти пратя 2 варианта утре.',
      createdAt: msgsAgo(2 * 24 * 60 - 55),
      readAt: null,
    },
  ])

  // Conversation 5: Dimitar ↔ Elena (garden + cooking)
  const [convDimitarElena] = await db.insert(conversations).values(pair(dimitar.id, elena.id)).returning()

  await db.insert(messages).values([
    {
      conversationId: convDimitarElena.id,
      senderId: dimitar.id,
      body: 'Елена, видях мусаката ти — изглежда невероятно! Имам пресни домати и босилек от градината, ако те интересуват.',
      createdAt: msgsAgo(5 * 60),
      readAt: msgsAgo(4 * 60),
    },
    {
      conversationId: convDimitarElena.id,
      senderId: elena.id,
      body: 'О, точно такива търся за следващата готварска сесия! Мога ли да взема утре сутринта? И ако имаш излишни семена — много ми трябват за урока.',
      createdAt: msgsAgo(3 * 60),
      readAt: msgsAgo(2 * 60),
    },
    {
      conversationId: convDimitarElena.id,
      senderId: dimitar.id,
      body: 'Разбира се! Ще сложа торбичка с домати и ще ти дам и семена от черешови домати — много вкусни. Елате в 9:00.',
      createdAt: msgsAgo(90),
      readAt: null,
    },
  ])

  // ─── Feed events ──────────────────────────────────────────────────────────
  const existingFeed = await db.select({ id: feedEvents.id }).from(feedEvents).limit(1)
  if (existingFeed.length > 0) {
    console.log('Feed events already seeded, skipping')
    return
  }

  console.log('Seeding demo feed events...')

  const daysAgo = (n: number) => new Date(Date.now() - n * 24 * 60 * 60 * 1000)

  // Fetch IDs we need for target references
  const [skillRow] = await db.select({ id: skills.id }).from(skills).limit(1)
  const [toolRow] = await db.select({ id: tools.id }).from(tools).limit(1)
  const [foodRow] = await db.select({ id: foodShares.id }).from(foodShares).limit(1)
  const [driveRow] = await db.select({ id: communityDrives.id }).from(communityDrives).limit(1)
  const [eventRow] = await db.select({ id: events.id }).from(events).limit(1)

  const feedRows: Array<typeof feedEvents.$inferInsert> = []

  if (skillRow) feedRows.push({
    actorId: ivan.id,
    actorName: 'Ivan Petrov',
    eventType: 'skill_listed',
    targetId: skillRow.id,
    targetTitle: 'Python & Django tutoring',
    targetUrl: `/skills/${skillRow.id}`,
    createdAt: daysAgo(6),
  })

  if (toolRow) feedRows.push({
    actorId: ivan.id,
    actorName: 'Ivan Petrov',
    eventType: 'tool_listed',
    targetId: toolRow.id,
    targetTitle: 'Bosch Cordless Drill',
    targetUrl: `/tools/${toolRow.id}`,
    createdAt: daysAgo(5),
  })

  if (foodRow) feedRows.push({
    actorId: elena.id,
    actorName: 'Elena Stoyanova',
    eventType: 'food_shared',
    targetId: foodRow.id,
    targetTitle: 'Домашна баница — 6 порции',
    targetUrl: `/food/${foodRow.id}`,
    createdAt: daysAgo(3),
  })

  if (driveRow) feedRows.push({
    actorId: georgi.id,
    actorName: 'Georgi Dimitrov',
    eventType: 'drive_opened',
    targetId: driveRow.id,
    targetTitle: 'Winter Clothes Collection for Families in Need',
    targetUrl: `/drives/${driveRow.id}`,
    createdAt: daysAgo(2),
  })

  if (eventRow) feedRows.push({
    actorId: ivan.id,
    actorName: 'Ivan Petrov',
    eventType: 'event_created',
    targetId: eventRow.id,
    targetTitle: 'Sofia Dev Meetup — Web Performance',
    targetUrl: `/events/${eventRow.id}`,
    createdAt: daysAgo(1),
  })

  const [stoyanSkillRow] = await db.select({ id: skills.id }).from(skills)
    .where(eq(skills.ownerId, stoyan.id)).limit(1)
  const [dimitar_eventRow] = await db.select({ id: events.id }).from(events)
    .where(eq(events.organizerId, dimitar.id)).limit(1)
  const [petya_toolRow] = await db.select({ id: tools.id }).from(tools)
    .where(eq(tools.ownerId, petya.id)).limit(1)

  if (stoyanSkillRow) feedRows.push({
    actorId: stoyan.id,
    actorName: 'Stoyan Nikolov',
    eventType: 'skill_listed',
    targetId: stoyanSkillRow.id,
    targetTitle: 'Guitar lessons — beginner to intermediate',
    targetUrl: `/skills/${stoyanSkillRow.id}`,
    createdAt: daysAgo(4),
  })

  if (petya_toolRow) feedRows.push({
    actorId: petya.id,
    actorName: 'Petya Ivanova',
    eventType: 'tool_listed',
    targetId: petya_toolRow.id,
    targetTitle: 'Wacom Intuos Pro Drawing Tablet (M)',
    targetUrl: `/tools/${petya_toolRow.id}`,
    createdAt: daysAgo(2),
  })

  if (dimitar_eventRow) feedRows.push({
    actorId: dimitar.id,
    actorName: 'Dimitar Vasilev',
    eventType: 'event_created',
    targetId: dimitar_eventRow.id,
    targetTitle: 'Community Garden Planting Day — Boyana',
    targetUrl: `/events/${dimitar_eventRow.id}`,
    createdAt: daysAgo(1),
  })

  if (feedRows.length > 0) {
    await db.insert(feedEvents).values(feedRows).onConflictDoNothing()
  }
}

// ─── Bulk seed (10k+ records for scalability) ───────────────────────────────
// Run with: npm run db:seed -- --bulk

async function seedBulk() {
  const guard = await db.select({ id: users.id })
    .from(users).where(eq(users.email, 'bulk_0001@demo.bg')).limit(1)
  if (guard.length > 0) {
    console.log('Bulk data already seeded, skipping')
    return
  }

  console.log('Seeding bulk data (10,000+ records)...')

  const allLocations = await db.select({ id: locations.id }).from(locations)
  const allCategories = await db.select({ id: categories.id }).from(categories)
  const locIds = allLocations.map((l) => l.id)
  const catIds = allCategories.map((c) => c.id)
  const rand = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]
  const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min
  const daysAgo = (n: number) => new Date(Date.now() - n * 24 * 60 * 60 * 1000)
  const daysAhead = (n: number) => new Date(Date.now() + n * 24 * 60 * 60 * 1000)

  const pwHash = await bcrypt.hash('Demo1234!', 10)
  const now = new Date()
  const N = 200

  const NAMES = ['Александър', 'Антон', 'Борислав', 'Валентин', 'Георги', 'Димитър', 'Емил', 'Живко', 'Ивайло', 'Йордан', 'Ангелина', 'Биляна', 'Валерия', 'Галя', 'Даниела', 'Зорница', 'Ирина', 'Калина', 'Пламен', 'Теодора']
  const SURNAMES = ['Петров', 'Иванов', 'Георгиев', 'Димитров', 'Стоянов', 'Николов', 'Тодоров', 'Атанасов', 'Христов', 'Маринов']
  const SKILL_TITLES = ['Web development tutoring', 'Home repair help', 'Language lessons', 'Cooking assistance', 'Garden advice', 'Music lessons', 'Design consultation', 'Fitness coaching', 'Pet care', 'Photography tips']
  const TOOL_TITLES = ['Power drill', 'Extension ladder', 'Stand mixer', 'Projector', 'Bicycle pump', 'Cordless vacuum', 'Sewing machine', 'Pasta maker', 'Pressure washer', 'Circular saw']
  const FOOD_TITLES = ['Домашна баница', 'Кисело тесто хляб', 'Лютеница', 'Постна чорба', 'Таратор', 'Плодова торта', 'Домашно сладко', 'Мусака', 'Пилешка супа', 'Зеленчукова яхния']
  const MSG_BODIES = [
    'Здравей! Интересувам се от твоята обява.',
    'Мога ли да взема утре?',
    'Перфектно, ще се видим!',
    'Благодаря, много помогна!',
    'Кога е удобно за теб?',
    'Ще се свържа допълнително.',
    'Звучи добре, запазено!',
    'Ок, ще мина в 18:00.',
  ]

  // ─── Users (200) ─────────────────────────────────────────────────────────
  const bulkIds: string[] = []
  for (let i = 0; i < N; i += 50) {
    const batch = Array.from({ length: Math.min(50, N - i) }, (_, j) => ({
      email: `bulk_${String(i + j + 1).padStart(4, '0')}@demo.bg`,
      passwordHash: pwHash,
      role: 'user' as const,
      emailVerifiedAt: now,
    }))
    const inserted = await db.insert(users).values(batch).onConflictDoNothing().returning({ id: users.id })
    bulkIds.push(...inserted.map((u) => u.id))
  }
  console.log(`  ✓ ${bulkIds.length} users`)

  // ─── Profiles (200) ──────────────────────────────────────────────────────
  await db.insert(profiles).values(
    bulkIds.map((userId, i) => ({
      userId,
      name: `${NAMES[i % NAMES.length]} ${SURNAMES[i % SURNAMES.length]}`,
      bio: 'Community member and neighbour.',
      locationId: rand(locIds),
      isPublic: true,
    })),
  ).onConflictDoNothing()
  console.log(`  ✓ ${bulkIds.length} profiles`)

  // ─── Skills (600 — 3 per user) ────────────────────────────────────────────
  const bulkSkillIds: string[] = []
  for (let i = 0; i < bulkIds.length; i += 50) {
    const batch: Array<typeof skills.$inferInsert> = []
    for (let j = i; j < Math.min(i + 50, bulkIds.length); j++) {
      for (let k = 0; k < 3; k++) {
        const id = crypto.randomUUID()
        bulkSkillIds.push(id)
        batch.push({
          id,
          ownerId: bulkIds[j],
          title: `${SKILL_TITLES[(j * 3 + k) % SKILL_TITLES.length]} — community offer`,
          description: 'Happy to help neighbours in the community. Contact me to arrange.',
          categoryId: catIds[(j + k) % catIds.length],
          availableHours: randInt(2, 10),
          status: 'available',
          locationId: rand(locIds),
        })
      }
    }
    await db.insert(skills).values(batch).onConflictDoNothing()
  }
  console.log(`  ✓ ${bulkSkillIds.length} skills`)

  // ─── Tools (400 — 2 per user) ─────────────────────────────────────────────
  const bulkToolIds: string[] = []
  for (let i = 0; i < bulkIds.length; i += 50) {
    const batch: Array<typeof tools.$inferInsert> = []
    for (let j = i; j < Math.min(i + 50, bulkIds.length); j++) {
      for (let k = 0; k < 2; k++) {
        const id = crypto.randomUUID()
        bulkToolIds.push(id)
        batch.push({
          id,
          ownerId: bulkIds[j],
          title: TOOL_TITLES[(j * 2 + k) % TOOL_TITLES.length],
          description: 'Available for short-term loan to neighbours.',
          categoryId: catIds[(j + k) % catIds.length],
          locationId: rand(locIds),
          condition: (['good', 'fair', 'new'] as const)[k % 3],
          status: 'available',
        })
      }
    }
    await db.insert(tools).values(batch).onConflictDoNothing()
  }
  console.log(`  ✓ ${bulkToolIds.length} tools`)

  // ─── Food shares (200 — 1 per user) ──────────────────────────────────────
  const bulkFoodIds: string[] = []
  for (let i = 0; i < bulkIds.length; i += 50) {
    const batch: Array<typeof foodShares.$inferInsert> = []
    for (let j = i; j < Math.min(i + 50, bulkIds.length); j++) {
      const id = crypto.randomUUID()
      bulkFoodIds.push(id)
      batch.push({
        id,
        ownerId: bulkIds[j],
        title: `${FOOD_TITLES[j % FOOD_TITLES.length]} — ${j + 1}`,
        description: 'Домашна храна, приготвена с грижа за съседите.',
        quantity: randInt(2, 8),
        locationId: rand(locIds),
        availableUntil: daysAhead(randInt(1, 5)),
        pickupInstructions: 'Вземане по договорка.',
        status: 'available',
      })
    }
    await db.insert(foodShares).values(batch).onConflictDoNothing()
  }
  console.log(`  ✓ ${bulkFoodIds.length} food shares`)

  // ─── Skill requests (3,000) ───────────────────────────────────────────────
  for (let batch = 0; batch < 15; batch++) {
    const rows: Array<typeof skillRequests.$inferInsert> = []
    for (let i = 0; i < 200; i++) {
      const fromIdx = randInt(0, bulkIds.length - 1)
      let toIdx = randInt(0, bulkIds.length - 1)
      while (toIdx === fromIdx) toIdx = randInt(0, bulkIds.length - 1)
      const skillIdx = toIdx * 3 + (i % 3)
      const start = daysAhead(randInt(1, 30))
      const end = new Date(start.getTime() + randInt(1, 3) * 60 * 60 * 1000)
      rows.push({
        userFromId: bulkIds[fromIdx],
        userToId: bulkIds[toIdx],
        skillId: bulkSkillIds[Math.min(skillIdx, bulkSkillIds.length - 1)],
        scheduledStart: start,
        scheduledEnd: end,
        meetingType: i % 2 === 0 ? 'online' : 'in_person',
        status: (['pending', 'accepted', 'completed', 'rejected'] as const)[i % 4],
      })
    }
    await db.insert(skillRequests).values(rows).onConflictDoNothing()
  }
  console.log('  ✓ 3,000 skill requests')

  // ─── Tool reservations (2,000) ────────────────────────────────────────────
  for (let batch = 0; batch < 10; batch++) {
    const rows: Array<typeof toolReservations.$inferInsert> = []
    for (let i = 0; i < 200; i++) {
      const ownerIdx = randInt(0, bulkIds.length - 1)
      let borrowerIdx = randInt(0, bulkIds.length - 1)
      while (borrowerIdx === ownerIdx) borrowerIdx = randInt(0, bulkIds.length - 1)
      const toolIdx = ownerIdx * 2 + (i % 2)
      const start = daysAhead(randInt(1, 14))
      const end = new Date(start.getTime() + randInt(1, 7) * 24 * 60 * 60 * 1000)
      rows.push({
        toolId: bulkToolIds[Math.min(toolIdx, bulkToolIds.length - 1)],
        borrowerId: bulkIds[borrowerIdx],
        ownerId: bulkIds[ownerIdx],
        startDate: start,
        endDate: end,
        status: (['pending', 'approved', 'returned'] as const)[i % 3],
      })
    }
    await db.insert(toolReservations).values(rows).onConflictDoNothing()
  }
  console.log('  ✓ 2,000 tool reservations')

  // ─── Food reservations (1,000) ────────────────────────────────────────────
  for (let batch = 0; batch < 5; batch++) {
    const rows: Array<typeof foodReservations.$inferInsert> = []
    for (let i = 0; i < 200; i++) {
      const ownerIdx = (batch * 200 + i) % bulkIds.length
      let requesterIdx = randInt(0, bulkIds.length - 1)
      while (requesterIdx === ownerIdx) requesterIdx = randInt(0, bulkIds.length - 1)
      rows.push({
        foodShareId: bulkFoodIds[ownerIdx],
        requesterId: bulkIds[requesterIdx],
        ownerId: bulkIds[ownerIdx],
        pickupAt: daysAhead(randInt(1, 3)),
        status: (['pending', 'reserved', 'cancelled'] as const)[i % 3],
      })
    }
    await db.insert(foodReservations).values(rows).onConflictDoNothing()
  }
  console.log('  ✓ 1,000 food reservations')

  // ─── Conversations + messages (300 convs × 8 msgs = 2,400 messages) ────────
  const pairsSeen = new Set<string>()
  const pairs: Array<{ participantA: string; participantB: string }> = []
  let attempts = 0
  while (pairs.length < 300 && attempts < 5000) {
    attempts++
    const aIdx = randInt(0, bulkIds.length - 1)
    const bIdx = randInt(0, bulkIds.length - 1)
    if (aIdx === bIdx) continue
    const a = bulkIds[aIdx]
    const b = bulkIds[bIdx]
    const key = a < b ? `${a}:${b}` : `${b}:${a}`
    if (pairsSeen.has(key)) continue
    pairsSeen.add(key)
    pairs.push(a < b ? { participantA: a, participantB: b } : { participantA: b, participantB: a })
  }

  let msgTotal = 0
  for (let i = 0; i < pairs.length; i += 50) {
    const inserted = await db.insert(conversations)
      .values(pairs.slice(i, i + 50))
      .onConflictDoNothing()
      .returning({ id: conversations.id, participantA: conversations.participantA })
    if (inserted.length === 0) continue
    const msgRows: Array<typeof messages.$inferInsert> = []
    for (const conv of inserted) {
      for (let m = 0; m < 8; m++) {
        msgRows.push({
          conversationId: conv.id,
          senderId: m % 2 === 0 ? conv.participantA : bulkIds[randInt(0, bulkIds.length - 1)],
          body: MSG_BODIES[m % MSG_BODIES.length],
          createdAt: daysAgo(randInt(0, 14)),
        })
      }
    }
    await db.insert(messages).values(msgRows).onConflictDoNothing()
    msgTotal += msgRows.length
  }
  console.log(`  ✓ ${pairs.length} conversations, ${msgTotal} messages`)

  // ─── Feed events (2,000) ──────────────────────────────────────────────────
  const FEED_TYPES = ['skill_listed', 'tool_listed', 'food_shared'] as const
  for (let batch = 0; batch < 10; batch++) {
    const rows: Array<typeof feedEvents.$inferInsert> = []
    for (let i = 0; i < 200; i++) {
      const type = FEED_TYPES[(batch * 200 + i) % FEED_TYPES.length]
      const actorIdx = randInt(0, bulkIds.length - 1)
      let targetId: string
      let targetTitle: string
      let targetUrl: string
      if (type === 'skill_listed') {
        targetId = bulkSkillIds[actorIdx * 3]
        targetTitle = 'Community skill offer'
        targetUrl = `/skills/${targetId}`
      } else if (type === 'tool_listed') {
        targetId = bulkToolIds[actorIdx * 2]
        targetTitle = 'Tool available for loan'
        targetUrl = `/tools/${targetId}`
      } else {
        targetId = bulkFoodIds[actorIdx]
        targetTitle = 'Food share available'
        targetUrl = `/food/${targetId}`
      }
      rows.push({
        actorId: bulkIds[actorIdx],
        actorName: `${NAMES[actorIdx % NAMES.length]} ${SURNAMES[actorIdx % SURNAMES.length]}`,
        eventType: type,
        targetId,
        targetTitle,
        targetUrl,
        createdAt: daysAgo(randInt(0, 30)),
      })
    }
    await db.insert(feedEvents).values(rows).onConflictDoNothing()
  }
  console.log('  ✓ 2,000 feed events')

  console.log('\n  Bulk seed summary:')
  console.log(`    Users:             ${bulkIds.length}`)
  console.log(`    Profiles:          ${bulkIds.length}`)
  console.log(`    Skills:            ${bulkSkillIds.length}`)
  console.log(`    Tools:             ${bulkToolIds.length}`)
  console.log(`    Food shares:       ${bulkFoodIds.length}`)
  console.log('    Skill requests:    3,000')
  console.log('    Tool reservations: 2,000')
  console.log('    Food reservations: 1,000')
  console.log(`    Conversations:     ${pairs.length}`)
  console.log(`    Messages:          ${msgTotal}`)
  console.log('    Feed events:       2,000')
  console.log('    ──────────────────────────')
  console.log('    TOTAL NEW:         ~12,300+')
}

seed().catch((err) => {
  console.error(err)
  process.exit(1)
})
