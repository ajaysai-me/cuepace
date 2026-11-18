import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { colors } from '../lib/theme';

export default function RootLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: '600', fontSize: 16 },
          headerBackButtonDisplayMode: 'minimal',
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false, animation: 'fade' }} />
        <Stack.Screen name="profile" options={{ title: 'Profile' }} />
        <Stack.Screen name="recordings" options={{ title: 'Recordings' }} />
        <Stack.Screen name="liked" options={{ title: 'Liked' }} />
        <Stack.Screen name="script/[id]" options={{ title: '' }} />
        <Stack.Screen name="takes/[id]" options={{ title: 'Takes' }} />
        <Stack.Screen name="recording/[id]" options={{ headerShown: false, animation: 'fade' }} />
        <Stack.Screen name="record/[id]" options={{ headerShown: false, animation: 'fade' }} />
      </Stack>
    </View>
  );
}
