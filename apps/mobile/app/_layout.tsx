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
      } else if (url?.startsWith("halaqa://join")) {
        const parsed = Linking.parse(url);
        const code = typeof parsed.queryParams?.code === "string" ? parsed.queryParams.code : "";
        router.push(`/(app)/halaqa?joinCode=${encodeURIComponent(code)}`);
      }
    }

    routeInitialUrl();
    const subscription = Linking.addEventListener("url", ({ url }) => {
      if (url.startsWith("halaqa://reset-password")) {
        router.push(`/(auth)/reset-password?url=${encodeURIComponent(url)}`);
      } else if (url.startsWith("halaqa://join")) {
        const parsed = Linking.parse(url);
        const code = typeof parsed.queryParams?.code === "string" ? parsed.queryParams.code : "";
        router.push(`/(app)/halaqa?joinCode=${encodeURIComponent(code)}`);
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
