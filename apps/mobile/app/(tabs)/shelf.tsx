/**
 * Shelf Tab — shows the authenticated user's watch history and watchlist.
 *
 * Tabs:  All · Watched · Watching · Dropped · Watchlist
 * Features:
 *  - Paginated FlatList of watch entries (or watchlist items)
 *  - Pull-to-refresh
 *  - Floating "+ Log" button that opens LogEntrySheet
 *  - Long-press on card → quick Edit / Delete action sheet
 */
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Pressable,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useAuth } from '@clerk/clerk-expo';
import { useState, useCallback, useEffect, useRef } from 'react';
import { api, type WatchEntry, type WatchlistItem } from '../../lib/api';
import { LogEntrySheet } from '../../src/components/LogEntrySheet';

// ─── Types ────────────────────────────────────────────────────────────────────

type FilterTab = 'all' | 'watched' | 'watching' | 'dropped' | 'watchlist';

const TABS: { key: FilterTab; label: string }[] = [
  { key: 'all',       label: 'All'       },
  { key: 'watched',   label: 'Watched'   },
  { key: 'watching',  label: 'Watching'  },
  { key: 'dropped',   label: 'Dropped'   },
  { key: 'watchlist', label: 'Watchlist' },
];

const PAGE_SIZE  = 20;
const CARD_GAP   = 10;
const NUM_COLS   = 3;
const SCREEN_W   = Dimensions.get('window').width;
const CARD_W     = (SCREEN_W - 40 - CARD_GAP * (NUM_COLS - 1)) / NUM_COLS;
const CARD_H     = CARD_W * (3 / 2);   // 2:3 poster ratio

const STATUS_BADGE_COLORS: Record<string, string> = {
  watching:   '#4A90D9',
  dropped:    '#D94A4A',
  rewatching: '#9B59B6',
};

const RATING_LABELS: Record<number, string> = {
  1: 'Unwatchable', 2: 'Very bad', 3: 'Bad', 4: 'Below avg',
  5: 'Average', 6: 'Decent', 7: 'Good', 8: 'Great', 9: 'Excellent', 10: 'Masterpiece',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function PosterCard({
  title,
  posterUrl,
  thumbUrl,
  status,
  rating,
  onPress,
  onLongPress,
}: {
  title: string;
  posterUrl?: string | null;
  thumbUrl?: string | null;
  status?: string;
  rating?: number | null;
  onPress?: () => void;
  onLongPress?: () => void;
}) {
  const img = posterUrl ?? thumbUrl;
  const badgeColor = status ? STATUS_BADGE_COLORS[status] : undefined;

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={onPress}
      onLongPress={onLongPress}
    >
      <View style={styles.posterWrap}>
        {img ? (
          <Image
            source={{ uri: img }}
            style={styles.poster}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View style={[styles.poster, styles.posterPlaceholder]}>
            <Text style={styles.posterPlaceholderText}>📼</Text>
          </View>
        )}

        {/* Status badge (only for non-watched statuses) */}
        {badgeColor && status && (
          <View style={[styles.statusBadge, { backgroundColor: badgeColor + 'DD' }]}>
            <Text style={styles.statusBadgeText}>{status.toUpperCase()}</Text>
          </View>
        )}

        {/* Rating pill */}
        {rating !== null && rating !== undefined && (
          <View style={styles.ratingPill}>
            <Text style={styles.ratingPillText}>{rating}</Text>
          </View>
        )}
      </View>

      <Text style={styles.cardTitle} numberOfLines={2}>{title}</Text>
    </Pressable>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ShelfScreen() {
  const { getToken } = useAuth();

  const [activeTab,     setActiveTab]     = useState<FilterTab>('all');
  const [entries,       setEntries]       = useState<WatchEntry[]>([]);
  const [watchlistItems, setWatchlistItems] = useState<WatchlistItem[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [refreshing,    setRefreshing]    = useState(false);
  const [loadingMore,   setLoadingMore]   = useState(false);
  const [total,         setTotal]         = useState(0);
  const offsetRef = useRef(0);

  // Modal state
  const [sheetVisible, setSheetVisible] = useState(false);
  const [editEntry,    setEditEntry]    = useState<WatchEntry | null>(null);

  // ── Fetch entries ──
  const fetchEntries = useCallback(async (reset = true) => {
    try {
      const token = await getToken();
      if (!token) return;

      if (activeTab === 'watchlist') {
        const { items } = await api.watchlist.list(token);
        setWatchlistItems(items);
        setTotal(items.length);
        return;
      }

      const offset = reset ? 0 : offsetRef.current;
      const params: Record<string, any> = { limit: PAGE_SIZE, offset };
      if (activeTab !== 'all') params.status = activeTab;

      const { entries: newEntries, pagination } = await api.watchEntries.list(token, params);

      if (reset) {
        setEntries(newEntries);
        offsetRef.current = newEntries.length;
      } else {
        setEntries((prev) => [...prev, ...newEntries]);
        offsetRef.current += newEntries.length;
      }
      setTotal(pagination.total);
    } catch (err) {
      console.error('Shelf fetch error:', err);
    }
  }, [activeTab, getToken]);

  // Initial load + tab change
  useEffect(() => {
    setLoading(true);
    offsetRef.current = 0;
    fetchEntries(true).finally(() => setLoading(false));
  }, [activeTab]);  // eslint-disable-line react-hooks/exhaustive-deps

  // Pull-to-refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    offsetRef.current = 0;
    await fetchEntries(true);
    setRefreshing(false);
  }, [fetchEntries]);

  // Load more (infinite scroll)
  const handleLoadMore = useCallback(async () => {
    if (loadingMore || activeTab === 'watchlist') return;
    if (offsetRef.current >= total) return;
    setLoadingMore(true);
    await fetchEntries(false);
    setLoadingMore(false);
  }, [loadingMore, total, activeTab, fetchEntries]);

  // ── Delete ──
  const handleDelete = (entry: WatchEntry) => {
    Alert.alert(
      'Delete entry',
      `Remove "${entry.content_title}" from your shelf?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await getToken();
              if (!token) return;
              await api.watchEntries.delete(token, entry.id);
              await fetchEntries(true);
            } catch (err: any) {
              Alert.alert('Error', err?.message ?? 'Could not delete entry.');
            }
          },
        },
      ],
    );
  };

  // ── Remove from watchlist ──
  const handleRemoveFromWatchlist = (item: WatchlistItem) => {
    Alert.alert(
      'Remove from watchlist',
      `Remove "${item.content_title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await getToken();
              if (!token) return;
              await api.watchlist.remove(token, item.content_id);
              await fetchEntries(true);
            } catch (err: any) {
              Alert.alert('Error', err?.message ?? 'Could not remove item.');
            }
          },
        },
      ],
    );
  };

  // ── Long-press on watch entry → Edit / Delete ──
  const handleEntryLongPress = (entry: WatchEntry) => {
    Alert.alert(entry.content_title, undefined, [
      { text: 'Edit',   onPress: () => { setEditEntry(entry); setSheetVisible(true); } },
      { text: 'Delete', style: 'destructive', onPress: () => handleDelete(entry) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  // ── Render ──

  const listData =
    activeTab === 'watchlist'
      ? watchlistItems.map((item) => ({ ...item, _type: 'watchlist' as const }))
      : entries.map((e)       => ({ ...e,    _type: 'entry'     as const }));

  const renderItem = ({ item }: { item: typeof listData[number] }) => {
    if (item._type === 'watchlist') {
      const wl = item as WatchlistItem & { _type: 'watchlist' };
      return (
        <PosterCard
          title={wl.content_title}
          posterUrl={wl.content_poster_url}
          thumbUrl={wl.content_thumbnail_url}
          onLongPress={() => handleRemoveFromWatchlist(wl)}
        />
      );
    }
    const entry = item as WatchEntry & { _type: 'entry' };
    return (
      <PosterCard
        title={entry.content_title}
        posterUrl={entry.content_poster_url}
        thumbUrl={entry.content_thumbnail_url}
        status={entry.status !== 'watched' ? entry.status : undefined}
        rating={entry.rating}
        onLongPress={() => handleEntryLongPress(entry)}
      />
    );
  };

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyIcon}>📼</Text>
        <Text style={styles.emptyText}>
          {activeTab === 'watchlist'
            ? 'Your watchlist is empty.\nAdd titles you want to watch.'
            : 'Nothing here yet.\nTap + Log to add your first entry.'}
        </Text>
      </View>
    );
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#E8A44A" />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>MY SHELF</Text>
          <Text style={styles.headerSub}>
            {loading ? '…' : `${total} ${activeTab === 'watchlist' ? 'saved' : 'entries'}`}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.logBtn}
          onPress={() => { setEditEntry(null); setSheetVisible(true); }}
          activeOpacity={0.8}
        >
          <Text style={styles.logBtnText}>+ LOG</Text>
        </TouchableOpacity>
      </View>

      {/* ── Filter tabs ── */}
      <View style={styles.tabsWrap}>
        <FlatList
          horizontal
          data={TABS}
          keyExtractor={(t) => t.key}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsList}
          renderItem={({ item: tab }) => (
            <TouchableOpacity
              style={[styles.tab, activeTab === tab.key && styles.tabActive]}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* ── Content ── */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E8A44A" />
        </View>
      ) : (
        <FlatList
          data={listData}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          numColumns={NUM_COLS}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.grid}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderFooter}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#E8A44A"
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.4}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* ── Log Entry Sheet ── */}
      <LogEntrySheet
        visible={sheetVisible}
        editEntry={editEntry}
        onSave={() => {
          setSheetVisible(false);
          fetchEntries(true);
        }}
        onClose={() => setSheetVisible(false)}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const C = {
  bg:      '#1A1612',
  surface: '#221E19',
  border:  '#3A3028',
  amber:   '#E8A44A',
  cream:   '#F5EDD6',
  mist:    '#8A7A6A',
  dim:     '#5A4A3A',
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 5,
    color: C.amber,
  },
  headerSub: {
    fontSize: 10,
    letterSpacing: 2,
    color: C.mist,
    marginTop: 2,
  },
  logBtn: {
    backgroundColor: C.amber,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  logBtnText: {
    color: C.bg,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
  },

  tabsWrap: {
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    marginBottom: 4,
  },
  tabsList: {
    paddingHorizontal: 20,
    gap: 4,
    paddingBottom: 0,
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: C.amber },
  tabText: {
    fontSize: 11,
    letterSpacing: 2,
    color: C.mist,
    fontWeight: '600',
  },
  tabTextActive: { color: C.cream },

  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  grid: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  columnWrapper: {
    gap: CARD_GAP,
    marginBottom: CARD_GAP,
  },

  card: {
    width: CARD_W,
  },
  cardPressed: { opacity: 0.75 },

  posterWrap: {
    width: CARD_W,
    height: CARD_H,
    position: 'relative',
    backgroundColor: C.surface,
  },
  poster: {
    width: '100%',
    height: '100%',
  },
  posterPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  posterPlaceholderText: { fontSize: 24 },

  statusBadge: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 3,
    alignItems: 'center',
  },
  statusBadgeText: {
    fontSize: 7,
    letterSpacing: 1.5,
    color: '#FFFFFF',
    fontWeight: '700',
  },

  ratingPill: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: C.amber,
    width: 22,
    height: 22,
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingPillText: {
    color: C.bg,
    fontSize: 11,
    fontWeight: '700',
  },

  cardTitle: {
    color: C.mist,
    fontSize: 11,
    marginTop: 5,
    lineHeight: 14,
  },

  empty: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 40,
  },
  emptyIcon: { fontSize: 36, marginBottom: 16 },
  emptyText: {
    color: C.dim,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },

  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});
