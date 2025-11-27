import { Stack, useSegments } from 'expo-router';
import React from 'react';
import VoiceAssistant from '../src/components/voice/VoiceAssistant';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { NotificationProvider } from '../src/context/NotificationContext';

function AppContent() {
  const { state } = useAuth();
  const segments = useSegments(); 
  const inAuthGroup = segments[0] === '(auth)';
  const showVoiceAssistant = state.status === 'authenticated' && !inAuthGroup;

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(app)" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
      {showVoiceAssistant && <VoiceAssistant />}
    </>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <AppContent />
      </NotificationProvider>
    </AuthProvider>
  );
}