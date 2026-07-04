# Halaqa App Store Launch Handoff

Date: July 4, 2026

## Current Repo

Local project folder:

`C:\Dev\Halaqa`

Monorepo shape:

```text
C:\Dev\Halaqa
  apps/
    mobile/   Expo React Native app
    studio/   Next.js admin/studio app
  supabase/
    migrations/
    schema.sql
```

## Product Summary

Halaqa is now a social reflection app for Muslims, combining a Twitter/BeReal-style weekly prompt feed with the original closed halaqa-group study circle experience.

The current direction includes:

- Public/private user profiles with username, bio, and avatar URL.
- Mutual friend requests.
- A global weekly prompt shared by all users.
- Individual text responses gated by post-to-unlock visibility.
- Likes and threaded comments on global prompt responses.
- Existing closed halaqa groups with weekly lessons, Reflection Mode, and Open Chat.
- Private local journal entries scoped per signed-in user.

The original closed-group halaqa feature still exists and should continue working unchanged.

## Design Direction

Keep the existing palette:

- Background: `#FAF8F5`
- Primary green: `#1B4332`
- Accent gold: `#C9A84C`
- Text: `#24352D`
- Muted text: `#6F776D`

The app should still feel warm and spiritually respectful, but the product is no longer purely quiet/book-like. It is now social-feed oriented, with profiles, friends, weekly public/private reflection visibility, likes, and threaded discussion.

## What Is Done

- Expo mobile app under `apps/mobile`.
- Next.js admin/studio app under `apps/studio`.
- Supabase migrations for App Store safety tables:
  - `reports`
  - `blocked_users`
- Supabase migration for profiles and friends:
  - `username`
  - `bio`
  - `is_private`
  - `friend_requests`
  - `are_friends(user_a, user_b)`
- Supabase migration for global weekly prompts:
  - `global_prompts`
  - `prompt_responses`
  - post-to-unlock RLS
- Supabase migration for feed engagement:
  - `response_likes`
  - `response_comments`
  - threaded comment support
  - `can_view_response(...)`
- Mobile Feed tab:
  - current global prompt
  - user response composer
  - friends' visible responses after posting
  - likes
  - threaded comments
- Mobile Profile tab:
  - own profile
  - edit profile
  - friends list
  - incoming/outgoing friend requests
  - user search
  - other-user profile screen
- Settings:
  - sign out
  - change password
  - delete account link
  - blocked users from Supabase
- Closed-group Halaqa tab:
  - group drawer
  - invite code/deep link
  - weekly lesson display
  - Reflection Mode
  - Open Chat
- Journal:
  - local-only AsyncStorage journal
  - scoped per user account
  - export to `.txt`

## Next Steps

- Build Gems feed:
  - top-liked responses
  - public accounts only
  - no paywall
  - no private-account leakage
- Extend reporting and blocking:
  - reports should cover `prompt_responses`
  - reports should cover `response_comments`
  - blocked users should affect feed responses, comments, and search consistently
- Add moderation review in Studio for response/comment reports.
- Future premium halaqa groups:
  - paid private group tools
  - collaborative paid "byline" feature for group-created reflections/lessons
- App Store polish:
  - real icon/splash
  - screenshots
  - privacy labels
  - support URL
  - privacy policy
  - TestFlight QA

## Apple Review Notes

Because Halaqa now includes social profiles, public/private discovery, friend requests, feed responses, likes, comments, and group chat, Apple will treat it as user-generated content.

Before App Store submission, make sure the app has:

- Report content flows for messages, prompt responses, and comments.
- Block user flows that work across all social surfaces.
- Admin/moderation review tooling.
- Clear support/contact path.
- Account deletion inside the app.
- Privacy policy and support URL.

## Religious Content Notes

Halaqa includes Islamic lesson content, Ayat, Hadith, translations, and user discussion around religious topics. Before launch:

- Verify every Ayah Arabic text.
- Verify translations and references.
- Verify Hadith attribution.
- Avoid inflammatory, sectarian, political, medical, or legal claims.
- Keep owner-curated lessons accurate and respectful.

## TestFlight Path

Recommended launch sequence:

```bash
npm install
npm --workspace apps/mobile run start
npx tsc --noEmit
eas build --platform ios --profile production
eas submit --platform ios
```

Before TestFlight, run through:

- signup/login
- profile edit
- friend request flows
- global prompt response
- post-to-unlock visibility
- likes/comments
- group invite/join
- group reflection/chat
- journal privacy per account
- block/report/account deletion
