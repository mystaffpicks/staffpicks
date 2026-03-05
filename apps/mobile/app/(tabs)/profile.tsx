import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.content}>
        <Text style={styles.title}>PROFILE</Text>
        <Text style={styles.subtitle}>Your account and settings.</Text>
        <Text style={styles.placeholder}>👤 Sign in to see your profile.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1A1612' },
  content: { flex: 1, padding: 20 },
  title: { fontSize: 36, fontWeight: '700', letterSpacing: 6, color: '#E8A44A', marginBottom: 4 },
  subtitle: { color: '#8A7A6A', fontSize: 13, letterSpacing: 1, marginBottom: 40 },
  placeholder: { color: '#5A4A3A', textAlign: 'center', marginTop: 60, fontSize: 14 },
});
