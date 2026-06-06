# Halaqa

Halaqa is a mobile-first spiritual community app for weekly group lessons, 24-hour Reflection Mode, unlocked group discussion, and a private local-only journal.

## Stack

This implementation uses Next.js as the runnable web client in this workspace, with Supabase designed as the backend for Auth, Postgres, Row Level Security, Realtime, and scheduled lesson assignment. The original prompt recommended Expo React Native; this workspace already has a Next runtime available locally, so the first build targets mobile web/PWA-style UX while preserving the Supabase architecture and keeping the client portable.

## What is included

- Persistent session boot check with landing, sign-up, log-in, password reset placeholder, and log-out flows ready for Supabase wiring.
- Halaqa tab with hamburger group drawer, create-group modal, role-aware admin panel, sticky collapsible lesson card, Reflection Mode countdown, one-reflection UI, cached reflection/message history, and Open Chat UI.
- Journal tab with local-only CRUD, search, fixed tags, delete/edit, and on-device text export confirmation.
- Supabase schema with tables, enums, RLS policies, helper functions, Reflection Mode enforcement, rate limiting, weekly assignment logic, first-lesson system message, and public/private group support.
- 52 seed lesson rows using content-review placeholders for exact Arabic/transliteration/translation/Hadith wording.
- Halaqa Studio at `/studio` for owner lesson and schedule management.
- App launch support files: `app.json`, `eas.json`, `README.env.example`, placeholder app icon/splash, and `LAUNCH_CHECKLIST.md`.

## Journal privacy boundary

Journal entries are stored in browser localStorage in `lib/journalStorage.js`. The module intentionally contains no server calls. Adding sync, analytics, API calls, or backup behavior to that module violates the product architecture.

## Run locally

```bash
npm run dev
```

Then open the local URL shown by Next.js.

## Native launch target

The current runnable app is still a mobile-first web prototype. For App Store and Play Store submission, move the app into an Expo workspace and use the native Supabase client setup shown in `lib/supabaseClient.native.example.js`. The intended repository shape is documented in `LAUNCH_CHECKLIST.md`.

## Supabase setup order

1. Run `supabase/schema.sql`.
2. Content-review and replace placeholder source text in `supabase/seed_lessons.sql`.
3. Run `supabase/seed_lessons.sql`.
4. Enable Realtime for `messages`, `reflection_responses`, `group_lessons`, and `join_requests`.
5. Schedule `select public.assign_weekly_lessons();` every Monday at 6:00 AM UTC with Supabase scheduled functions or `pg_cron`.
