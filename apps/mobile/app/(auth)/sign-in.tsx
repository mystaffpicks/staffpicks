import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSignIn } from '@clerk/clerk-expo';
import { Link, useRouter } from 'expo-router';

export default function SignInScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSignIn() {
    if (!isLoaded) return;
    setLoading(true);

    try {
      const result = await signIn.create({
        identifier: email.trim().toLowerCase(),
        password,
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        router.replace('/(tabs)');
      } else {
        Alert.alert('Sign in incomplete', 'Please check your credentials and try again.');
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      Alert.alert('Sign in failed', message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Wordmark */}
      <Text style={styles.wordmark}>STAFFPICKS</Text>
      <Text style={styles.tagline}>Your friends work here.</Text>

      {/* Form */}
      <View style={styles.form}>
        <Text style={styles.label}>EMAIL</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          placeholderTextColor="#6B5F57"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          textContentType="emailAddress"
        />

        <Text style={styles.label}>PASSWORD</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          placeholderTextColor="#6B5F57"
          secureTextEntry
          textContentType="password"
          returnKeyType="go"
          onSubmitEditing={handleSignIn}
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSignIn}
          disabled={loading || !email || !password}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#1A1612" size="small" />
          ) : (
            <Text style={styles.buttonText}>SIGN IN →</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>New here? </Text>
        <Link href="/(auth)/sign-up" asChild>
          <TouchableOpacity>
            <Text style={styles.footerLink}>Create account</Text>
          </TouchableOpacity>
        </Link>
      </View>

      <Text style={styles.subtext}>Be kind. Rewind.</Text>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1612',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  wordmark: {
    fontFamily: 'System',
    fontSize: 40,
    fontWeight: '900',
    color: '#E8A44A',
    letterSpacing: 8,
    marginBottom: 4,
  },
  tagline: {
    fontFamily: 'System',
    fontSize: 14,
    fontStyle: 'italic',
    color: '#B8A898',
    marginBottom: 48,
  },
  form: {
    width: '100%',
    gap: 8,
  },
  label: {
    fontFamily: 'System',
    fontSize: 10,
    fontWeight: '600',
    color: '#6B5F57',
    letterSpacing: 3,
    marginTop: 12,
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#2A2420',
    borderWidth: 1,
    borderColor: '#3D322C',
    color: '#F5EDD6',
    fontFamily: 'System',
    fontSize: 15,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  button: {
    backgroundColor: '#E8A44A',
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontFamily: 'System',
    fontSize: 12,
    fontWeight: '700',
    color: '#1A1612',
    letterSpacing: 3,
  },
  footer: {
    flexDirection: 'row',
    marginTop: 32,
  },
  footerText: {
    fontFamily: 'System',
    fontSize: 13,
    color: '#B8A898',
  },
  footerLink: {
    fontFamily: 'System',
    fontSize: 13,
    color: '#E8A44A',
    textDecorationLine: 'underline',
  },
  subtext: {
    position: 'absolute',
    bottom: 48,
    fontFamily: 'System',
    fontSize: 10,
    color: '#3D322C',
    letterSpacing: 4,
    textTransform: 'uppercase',
  },
});
