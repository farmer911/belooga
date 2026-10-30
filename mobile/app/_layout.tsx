import React, { useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { restoreMobileSession } from "@/services/api-client";
import { NEUMORPHIC_TOKENS } from "@/theme/tokens";

function SessionGate() {
  const restore = useQuery({
    queryKey: ["mobile", "session", "restore"],
    queryFn: restoreMobileSession,
    staleTime: Infinity,
    retry: false,
  });

  if (restore.isPending) {
    return (
      <View
        testID="mobile-hydrating-indicator"
        style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: NEUMORPHIC_TOKENS.canvas }}
      >
        <ActivityIndicator color={NEUMORPHIC_TOKENS.primaryTeal} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: NEUMORPHIC_TOKENS.canvas } }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(auth)/login" options={{ presentation: "modal" }} />
      <Stack.Screen name="(auth)/register" options={{ presentation: "modal" }} />
      <Stack.Screen name="candidate/[username]" options={{ headerShown: true, title: "Candidate" }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [queryClient] = useState(
    () => new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: 1 } } })
  );
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="dark" />
        <SessionGate />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
