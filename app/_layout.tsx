import { AuthProvider } from '@/app/contexts/AuthContext';
import { TokenProvider } from '@/app/contexts/TokenContext';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';

export default function RootLayout() {
  console.log("RootLayout 렌더링됨"); // 최상위 렌더링 체크

  return (
    <AuthProvider>
      <TokenProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="+not-found" />
        </Stack>
      </TokenProvider>
      <StatusBar style="auto" />
    </AuthProvider>
  );
}
