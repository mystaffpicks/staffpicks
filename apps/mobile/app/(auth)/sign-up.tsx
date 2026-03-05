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
  ScrollView,
} from 'react-native';
import { useSignUp } from '@clerk/clerk-expo';
import { Link, useRouter } from 'expo-router';

type Step = 'form' | 'verify';

export default function SignUpScreen() {
  const { signUp, setActive, isLoaded } = useSignUp();
  const router = useRouter();

  const [step, setStep] = useState<Step>('form');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSignUp() {
    if (!isLoaded) return;
    setLoading(true);

    try {
      await signUp.create({
        emailAddress: email.trim().toLowerCase(),
        password,
        username: username.trim().toLowerCase(),
      });

      // Send email verification code
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setStep('verify');
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      Alert.alert('Sign up failed', message);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify() {
    if (!isLoaded) return;
    setLoading(true);

    try {
      const result = await signUp.attemptEmailAddressVerification({ code: code.trim() });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        router.replace('/onboarding');
      } else {
        Alert.alert('Verification incomplete', 'Please double-check your code and try again.');
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Invalid verification code.';
      Alert.alert('Verification failed', message);
    } finally {
      setLoading(false);
    }
  }

  if (step === 'verify') {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Text style={styles.wordmark}>STAFFPICKS</Text>
        <Text style={styles.tagline}>Check your email.</Text>

        <View style={styles.form}>
          <Text style={styles.hint}>
            We sent a 6-digit code to {email}. Enter it below to verify your account.
          </Text>

          <Text style={styles.label}>VERIFICATION CODE</Text>
          <TextInput
            style={[styles.input, styles.codeInput]}
            value={code}
            onChangeText={setCode}
            placeholder="000000"
            placeholderTextColor="#6B5F57"
            keyboardType="number-pad"
            maxLength={6}
            textContentType="oneTimeCode"
            autoFocus
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleVerify}
            disabled={loading || code.length !== 6}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#1A1612" size="small" />
            ) : (
              <Text style={styles.buttonText}>VERIFY →</Text>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.subtext}>Be kind. Rewind.</Text>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.wordmark}>STAFFPICKS</Text>
        <Text style={styles.tagline}>Join the video store.</Text>

        <View style={styles.form}>
          <Text style={styles.label}>USERNAME</Text>
          <TextInput
            style={styles.input}
            value={username}
            onChangeText={setUsername}
            placeholder="your_handle"
            placeholderTextColor="#6B5F57"
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="username"
          />

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
            placeholder="Min. 8 characters"
            placeholderTextColor="#6B5F57"
            secureTextEntry
            textContentType="newPassword"
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSignUp}
            disabled={loading || !email || !password || !username}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#1A1612" size="small" />
            ) : (
              <Text style={styles.buttonText}>CREATE ACCOUNT →</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already a member? </Text>
          <Link href="/(auth)/sign-in" asChild>
            <TouchableOpacity>
              <Text style={styles.footerLink}>Sign in</Text>
            </TouchableOpacity>
          </Link>
        </View>

        <Text style={styles.subtext}>Be kind. Rewind.</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1612',
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
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
  hint: {
    fontFamily: 'System',
    fontSize: 13,
    color: '#B8A898',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
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
  codeInput: {
    textAlign: 'center',
    fontSize: 28,
    letterSpacing: 12,
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
    marginTop: 48,
    fontFamily: 'System',
    fontSize: 10,
    color: '#3D322C',
    letterSpacing: 4,
    textTransform: 'uppercase',
  },
});
