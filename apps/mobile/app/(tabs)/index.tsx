import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

export default function TodayScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>STAFF PICKS</Text>
          <Text style={styles.date}>THURSDAY · MAR 5</Text>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Sync prompt */}
        <TouchableOpacity
          style={styles.syncCard}
          onPress={() => router.push('/sync')}
          activeOpacity={0.8}
        >
          <View style={styles.syncCardInner}>
            <Text style={styles.syncLabel}>TONIGHT'S CHECK-IN</Text>
            <Text style={styles.syncTitle}>What did you watch today?</Text>
            <Text style={styles.syncCta}>TAP TO SYNC →</Text>
          </View>
        </TouchableOpacity>

        {/* Feed placeholder */}
        <Text style={styles.sectionLabel}>FROM YOUR CREW</Text>
        <View style={styles.emptyFeed}>
          <Text style={styles.emptyIcon}>📼</Text>
          <Text style={styles.emptyText}>Follow friends to see what they're watching.</Text>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>Be kind. Rewind. Come back tomorrow.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1A1612' },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },
  header: { paddingTop: 24, paddingBottom: 8 },
  title: {
    fontWeight: '700',
    fontSize: 36,
    letterSpacing: 6,
    color: '#E8A44A',
    fontFamily: 'System',
  },
  date: {
    fontSize: 11,
    letterSpacing: 3,
    color: '#8A7A6A',
    marginTop: 2,
  },
  divider: { height: 1, backgroundColor: '#3A3028', marginVertical: 16 },
  syncCard: {
    backgroundColor: '#221E19',
    borderLeftWidth: 3,
    borderLeftColor: '#E8A44A',
    borderRadius: 4,
    marginBottom: 24,
    overflow: 'hidden',
  },
  syncCardInner: { padding: 20 },
  syncLabel: {
    fontSize: 10,
    letterSpacing: 2,
    color: '#E8A44A',
    marginBottom: 6,
  },
  syncTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F5EDD6',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  syncCta: {
    fontSize: 11,
    letterSpacing: 2,
    color: '#8A7A6A',
  },
  sectionLabel: {
    fontSize: 11,
    letterSpacing: 3,
    color: '#8A7A6A',
    marginBottom: 12,
  },
  emptyFeed: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: { fontSize: 32, marginBottom: 12 },
  emptyText: {
    color: '#5A4A3A',
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
  },
  footer: {
    textAlign: 'center',
    color: '#3A3028',
    fontSize: 11,
    letterSpacing: 2,
    marginTop: 40,
  },
});
