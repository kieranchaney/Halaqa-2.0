# Halaqa

Halaqa is an Islamic study circle app with weekly group lessons, 24-hour Reflection Mode, unlocked group chat, and a private local-only journal.

## Monorepo Structure

```text
apps/
  mobile/        Expo React Native app for iOS and Android
  studio/        Existing Next.js Studio/web prototype for Vercel
packages/
  shared/        Shared utilities and constants
supabase/
  schema.sql
  functions/
    assign-weekly-lessons/
    delete-account/
```

## Root Setup

Install workspace dependencies from the repository root:

```bash
npm install
```

Run the mobile app:

```bash
npm run mobile
```

Run Halaqa Studio:

```bash
npm run studio
```

Build Halaqa Studio:

```bash
npm run build:studio
```

## Mobile App

Path: `apps/mobile`

Required environment variables in `apps/mobile/.env`:

```text
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
```

Start Expo directly:

```bash
cd apps/mobile
npm run start
```

Production EAS builds:

```bash
cd apps/mobile
eas build --platform ios --profile production
eas build --platform android --profile production
```

Before production, replace the placeholder EAS project ID in `apps/mobile/app.json`:

```json
{ "projectId": "TODO-LAUNCH-BLOCKER-EAS-PROJECT-ID" }
```

## Halaqa Studio

Path: `apps/studio`

Required environment variables in `apps/studio/.env.local`:

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Deploy `apps/studio` to Vercel as the project root. In Vercel:

1. Create a new project.
2. Set the root directory to `apps/studio`.
3. Add the Supabase environment variables above.
4. Use the default Next.js build command, or `npm run build`.

## Supabase Setup

1. Run the schema:

```sql
\i supabase/schema.sql
```

2. Run the Studio/mobile connection migration:

```sql
\i supabase/migrations/20260613_connect_halaqa.sql
```

3. Seed the first ten lessons:

```sql
\i supabase/seed_10_lessons.sql
```

4. Enable Realtime for:

```text
messages
reflection_responses
group_lessons
join_requests
```

5. Mark Studio owner accounts:

```sql
update public.users
set is_studio_user = true, role = 'owner'
where id = '<owner-auth-user-id>';
```

## Edge Functions

Deploy weekly lesson assignment:

```bash
supabase functions deploy assign-weekly-lessons
```

Deploy account deletion:

```bash
supabase functions deploy delete-account
```

Schedule weekly lessons every Monday at 6:00 AM UTC. Either use Supabase Scheduled Edge Functions or call the SQL helper:

```sql
select cron.schedule('weekly-halaqa-lessons', '0 6 * * 1', 'select public.assign_weekly_lessons();');
```

## Privacy Boundary

The journal remains local-only. Do not sync private journal entries to Supabase, analytics, backups, or any remote service.

