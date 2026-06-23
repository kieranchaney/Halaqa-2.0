import { useEffect } from "react";
import { Stack, router } from "expo-router";
import * as Linking from "expo-linking";
import { AuthProvider } from "../context/AuthContext";

export default function RootLayout() {
  useEffect(() => {
    async function routeInitialUrl() {
      const url = await Linking.getInitialURL();
      if (url?.startsWith("halaqa://reset-password")) {
        router.push(`/(auth)/reset-password?url=${encodeURIComponent(url)}`);
      }
    }

    routeInitialUrl();
    const subscription = Linking.addEventListener("url", ({ url }) => {
      if (url.startsWith("halaqa://reset-password")) {
        router.push(`/(auth)/reset-password?url=${encodeURIComponent(url)}`);
      }
    });

    return () => subscription.remove();
  }, []);

  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </AuthProvider>
  );
}

