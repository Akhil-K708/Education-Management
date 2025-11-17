// app/_layout.tsx
import { Stack } from 'expo-router';
import { AuthProvider } from '../src/context/AuthContext'; // <-- మీ పాత్ ../src కరెక్ట్!

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(app)" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
    </AuthProvider>
  );
}