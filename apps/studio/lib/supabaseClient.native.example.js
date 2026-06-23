// TODO: LAUNCH BLOCKER - move this into apps/mobile/lib/supabaseClient.js in the Expo app.
// This is the required native Supabase Auth shape for persistent sessions.
//
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { createClient } from "@supabase/supabase-js";
//
// export const supabase = createClient(
//   process.env.EXPO_PUBLIC_SUPABASE_URL,
//   process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
//   {
//     auth: {
//       storage: AsyncStorage,
//       autoRefreshToken: true,
//       persistSession: true,
//       detectSessionInUrl: false
//     }
//   }
// );
