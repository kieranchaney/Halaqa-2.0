# Halaqa Launch Checklist

## Production Services

- Create a production Supabase project separate from development.
- Enable Supabase Auth email/password and configure password reset deep links.
- Deploy Halaqa Studio as a separate Vercel project connected to the same Supabase backend.
- Configure all Supabase URLs and anon keys in environment variables. Do not commit secrets.
- Use EAS Build for native binaries:

```bash
eas build --platform ios --profile production
eas build --platform android --profile production
```

## Store Accounts

- Apple Developer Program is required for App Store and TestFlight submission.
- Google Play Developer account is required for Android submission.
- Prepare privacy policy URL, terms URL, app description, age rating answers, and screenshots.

## Launch Blockers

- TODO: LAUNCH BLOCKER - publish Privacy Policy page.
- TODO: LAUNCH BLOCKER - publish Terms of Service page.
- TODO: LAUNCH BLOCKER - implement in-app account deletion, including auth record deletion, group membership cleanup, messages cleanup, and admin transfer/delete handling.
- TODO: LAUNCH BLOCKER - build first-time onboarding for users with no groups.
- TODO: LAUNCH BLOCKER - connect Supabase password reset deep links end to end.
- TODO: LAUNCH BLOCKER - replace placeholder SVG icon/splash with store-ready PNG assets generated at required sizes.
- TODO: LAUNCH BLOCKER - produce App Store and Play Store screenshots.

## Recommended Monorepo Target

This current project is still a web prototype. Before native submission, organize the repository as:

```text
apps/mobile
apps/studio
packages/shared
```

The mobile app should be Expo React Native. Studio can remain a separate Next/Vercel app.
