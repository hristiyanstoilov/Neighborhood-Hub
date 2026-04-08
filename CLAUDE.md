# Neighborhood Hub – Claude Context

All project instructions, tech stack, coding rules, architecture, and business logic are in **AGENTS.md**.

## Rule #1
Do not make any changes until you have 95% confidence in what you need to build. Ask follow-up questions until you reach that confidence.

## UI Modularity Rule
Step 7 applies: split UI into modular React components and feature folders. Keep these refactors structure-only unless behavior changes are explicitly requested.

## Build Commands
```bash
npm run dev:web                          # Start Next.js dev server
npm run dev:mobile                       # Start Expo dev server
cd packages/nextjs && npx drizzle-kit generate  # Generate DB migration
cd packages/nextjs && npx drizzle-kit migrate   # Run DB migration
npm run build:web                        # Build web app
```

## Applied Learning
When something fails repeatedly or a workaround is found, add a one-line bullet. Keep under 15 words. Only things that save time in future sessions.

- Neon MCP requires `start <API_KEY>` as args, not env variable.
- Use `@filename` to point Claude at specific files instead of letting it explore freely.
- `apiFetch` must skip `Content-Type` header for `FormData` bodies — fetch sets multipart boundary automatically.
- `drizzle-orm/neon-http` does not support `db.transaction`; use sequential writes + compensation.
- Mobile `npm install` requires `--legacy-peer-deps` due to react-native peer constraints.
- Never hardcode `'image/jpeg'` for mobile image picker — use `asset.mimeType` from expo-image-picker.
