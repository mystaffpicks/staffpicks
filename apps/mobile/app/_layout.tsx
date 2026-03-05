import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts({
    // Custom fonts loaded via Expo Fonts
    // Bebas Neue is a Google Font — for dev, using system fonts
    // In production, download and bundle TTF files in assets/fonts/
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <>
      <StatusBar style="light" backgroundColor="#1A1612" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#1A1612' },
          headerTintColor: '#E8A44A',
          headerTitleStyle: {
            fontFamily: 'System',
            fontWeight: '700',
            letterSpacing: 2,
          },
          contentStyle: { backgroundColor: '#1A1612' },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="content/[id]"
          options={{ title: '', headerBackTitle: 'Back' }}
        />
        <Stack.Screen
          name="sync"
          options={{ title: 'DAILY SYNC', presentation: 'modal' }}
        />
        <Stack.Screen
          name="onboarding"
          options={{ headerShown: false, gestureEnabled: false }}
        />
      </Stack>
    </>
  );
}
