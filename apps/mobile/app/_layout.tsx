import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { ClerkProvider, ClerkLoaded, useAuth } from '@clerk/clerk-expo';
import { tokenCache } from '../lib/token-cache';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;
if (!publishableKey) {
  throw new Error('Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in .env');
}

/**
 * AuthGuard — redirects based on auth state once the layout is mounted.
 * Runs inside ClerkLoaded so useAuth() is always ready.
 */
function AuthGuard() {
  const { isSignedIn, isLoaded } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (isSignedIn && inAuthGroup) {
      router.replace('/(tabs)');
    } else if (!isSignedIn && !inAuthGroup) {
      router.replace('/(auth)/sign-in');
    }
  }, [isSignedIn, isLoaded, segments]);

  return null;
}

export default function RootLayout() {
  const [loaded] = useFonts({
    // Custom fonts — add TTF files to assets/fonts/ for production
    // Bebas Neue + Libre Baskerville require bundled assets on native
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
    <ClerkProvider publishableKey={publishableKey!} tokenCache={tokenCache}>
      <ClerkLoaded>
        <AuthGuard />
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
          {/* Auth screens */}
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />

          {/* App screens */}
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
      </ClerkLoaded>
    </ClerkProvider>
  );
}
