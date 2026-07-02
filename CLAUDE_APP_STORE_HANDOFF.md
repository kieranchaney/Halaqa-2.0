# Halaqa App Store Launch Handoff for Claude

Date: June 28, 2026

## Product Summary

Halaqa is an Islamic study circle app for iOS and Android. The core idea is a calm, focused spiritual community app where Muslims can join small halaqa groups, receive a weekly curated lesson, reflect quietly for the first 24 hours, then discuss in an unlocked group chat. It also includes a fully private local journal that never syncs to the server.

Design direction: warm off-white background, deep green primary color, gold accent, calm and book-like rather than social-media-like.

## Current Repository Location

Local project folder:

`C:\Users\kiera\OneDrive\Documentos\New project\AI Stuff\Halaqa`

The project is currently organized as a monorepo:

```text
AI Stuff/Halaqa
  apps/
    mobile/   Expo React Native mobile app
    studio/   Next.js web app / owner studio
  packages/
    shared/   shared package placeholder
  supabase/
    schema.sql
    migrations/
    functions/
    seed_10_lessons.sql
```

## Current State

The original Next.js app has been moved into `apps/studio`. It builds successfully as the studio/web app.

The mobile app exists under `apps/mobile` as an Expo React Native scaffold. It has starter auth screens, onboarding, home, account deletion, and Supabase helpers, but it is not App Store launch-ready yet.

Supabase has been connected through local environment files:

```text
apps/studio/.env.local
apps/mobile/.env.local
```

These files should not be committed. `.env.local` is already ignored by git.

Auth was recently reworked because signup was failing with a Supabase row-level security error on the `users` table. The fix changed the auth/profile flow so profile creation happens only after a valid Supabase session exists, and profile repair can happen after session load.

Known current auth issue: Supabase email rate limiting has appeared during repeated signup tests. This is a Supabase Auth throttle, not necessarily an app-code failure. The app should still improve error messages so users know whether the issue is rate limiting, an existing account, unconfirmed email, or bad login credentials.

## Files Recently Changed For Auth

```text
apps/studio/lib/auth.js
apps/studio/context/AuthContext.jsx
apps/mobile/context/AuthContext.jsx
apps/studio/app/signup/SignupClient.jsx
apps/studio/app/login/LoginClient.jsx
```

## Mobile App Files That Exist

```text
apps/mobile/package.json
apps/mobile/app.json
apps/mobile/tsconfig.json
apps/mobile/babel.config.js
apps/mobile/.env.example
apps/mobile/lib/supabaseClient.js
apps/mobile/lib/groups.js
apps/mobile/lib/messages.js
apps/mobile/context/AuthContext.jsx
apps/mobile/app/_layout.tsx
apps/mobile/app/index.tsx
apps/mobile/app/(auth)/login.tsx
apps/mobile/app/(auth)/signup.tsx
apps/mobile/app/(auth)/reset-password.tsx
apps/mobile/app/(app)/home.tsx
apps/mobile/app/(app)/onboarding.tsx
apps/mobile/app/(app)/delete-account.tsx
```

## Supabase Files That Exist

```text
supabase/schema.sql
supabase/seed_10_lessons.sql
supabase/migrations/20260613_connect_halaqa.sql
supabase/functions/assign-weekly-lessons/index.ts
supabase/functions/delete-account/index.ts
```

## What Is Done

- Monorepo structure exists.
- Studio app exists under `apps/studio`.
- Expo mobile app scaffold exists under `apps/mobile`.
- Supabase client setup exists for studio and mobile.
- Auth context exists for studio and mobile.
- Basic login, signup, reset password, onboarding, home, and account deletion screens exist in mobile.
- Supabase schema, migration, seed lessons, and Edge Functions exist.
- Studio build has worked with `npm --workspace apps/studio run build`.

## Major Blockers Before Apple App Store Launch

1. Verify the mobile app actually runs

   Install/verify dependencies and launch the Expo app:

   ```bash
   npm install
   npm --workspace apps/mobile run start
   ```

   Then fix any Expo, TypeScript, routing, environment, or Supabase runtime errors.

2. Finish the actual mobile product

   The mobile app still needs the real launch experience:

   - Halaqa tab
   - Weekly lesson screen
   - Reflection Mode for first 24 hours
   - Countdown until Open Chat unlocks
   - Open Chat
   - Group drawer / hamburger menu
   - Create group
   - Join private invite-link group
   - Public group discovery with admin approval
   - Roles: Admin, Co-Admin, Member
   - Private local-only journal
   - Journal tags: Reflection, Goal, Gratitude, Dua, Note
   - Local export only
   - Account settings and account deletion

3. Finish and test auth

   Auth needs end-to-end testing on mobile:

   - Email/password signup
   - Email/password login
   - Google OAuth
   - Session persistence
   - Email confirmation behavior
   - Password reset deep link
   - Clear user-facing errors
   - Account deletion
   - App Review demo account

4. Prepare Supabase for production

   Supabase needs a production-readiness pass:

   - Run schema/migrations in the linked Supabase project.
   - Seed the initial curated lessons.
   - Deploy Edge Functions.
   - Confirm realtime is enabled for chat.
   - Test row-level security policies for every role.
   - Confirm private journal data is not stored in Supabase.
   - Create owner/admin access for Halaqa Studio.

5. Add user-generated content safety

   Because Halaqa includes reflections and chat, Apple will treat this as user-generated content. Before launch, the app should include:

   - Report message/reflection
   - Block user or equivalent safety control
   - Admin/moderation workflow
   - Contact/support path
   - Clear community expectations

   Apple App Review Guideline 1.2 specifically requires safety controls for apps with user-generated content.

6. Review religious content carefully

   Halaqa includes Ayat, Hadith, transliteration, and Islamic lesson content. Apple flags inaccurate, misleading, or objectionable religious commentary. Before launch:

   - Verify every Ayah Arabic text.
   - Verify every translation.
   - Verify Hadith attribution and grading if shown.
   - Avoid making medical, legal, political, or sectarian claims.
   - Make the app feel educational and reflective, not inflammatory.

7. Prepare App Store requirements

   Apple requires:

   - Complete app metadata.
   - Accurate screenshots and previews.
   - Privacy policy URL.
   - Support URL.
   - App privacy labels.
   - Working backend services.
   - Demo account or demo mode for reviewers if login is required.
   - No placeholder content, placeholder icons, or broken flows.
   - App tested on-device.
   - Account deletion available inside the app.

8. Prepare native iOS build

   Before App Store submission:

   - Replace placeholder app icon.
   - Replace placeholder splash screen.
   - Confirm bundle identifier in Expo config.
   - Configure EAS project.
   - Configure Apple Developer account.
   - Build with EAS.
   - Test with TestFlight.
   - Submit to App Store Connect.

   Typical commands:

   ```bash
   eas build --platform ios --profile production
   eas submit --platform ios
   ```

## Recommended Next Prompts For Codex

Prompt 1:

```text
In apps/mobile, install/verify dependencies and run the Expo app. Fix any startup, routing, TypeScript, environment, or Supabase errors until the first mobile screen loads successfully. Do not change product scope yet.
```

Prompt 2:

```text
Build the real mobile home experience for Halaqa: authenticated app shell, Halaqa tab, lesson display, reflection mode, countdown, and open chat. Use the existing Supabase helpers and keep the design calm, warm, and mobile-first.
```

Prompt 3:

```text
Build the private local-only Journal tab for the Expo mobile app. Entries should stay on-device only, support the tags Reflection, Goal, Gratitude, Dua, and Note, and export to a local file without syncing to Supabase.
```

Prompt 4:

```text
Add Apple-required user safety features for chat and reflections: report content, block user or equivalent safety control, admin review flow, and support/contact path. Keep the implementation simple but App Review ready.
```

Prompt 5:

```text
Prepare the app for iOS TestFlight: replace placeholder icon/splash, verify app.json, add privacy/support metadata notes, build with EAS, and create an App Store submission checklist.
```

## Official References To Keep In Mind

- Apple App Review Guidelines: https://developer.apple.com/app-store/review/guidelines/
- Apple App Privacy Information: https://developer.apple.com/help/app-store-connect/reference/app-privacy-information/
- Expo iOS Submit docs: https://docs.expo.dev/submit/ios/

## Highest Priority Next Step

The next best technical step is to run the Expo mobile app locally and fix whatever prevents it from opening cleanly. Once the mobile shell runs, the project can move feature-by-feature toward TestFlight.
