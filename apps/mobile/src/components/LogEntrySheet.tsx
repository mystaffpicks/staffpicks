/**
 * LogEntrySheet — bottom sheet / modal for logging a watch entry on mobile.
 * Wraps in a full-screen Modal since we don't have a native bottom sheet lib.
 */
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { useState, useCallback, useRef, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-expo';
import { Image } from 'expo-image';
import { api, type WatchEntry, type ContentResult } from '../../lib/api';

// ─── Constants ────────────────────────────────────────────────────────────────

type WatchStatus = 'watched' | 'watching' | 'dropped' | 'rewatching';

const STATUS_OPTIONS: { value: WatchStatus; label: string }[] = [
  { value: 'watched',    label: 'Watched'    },
  { value: 'watching',   label: 'Watching'   },
  { value: 'dropped',    label: 'Dropped'    },
  { value: 'rewatching', label: 'Rewatching' },
];

const RATING_LABELS: Record<number, string> = {
  1: 'Unwatchable', 2: 'Very bad', 3: 'Bad', 4: 'Below average',
  5: 'Average', 6: 'Decent', 7: 'Good', 8: 'Great', 9: 'Excellent', 10: 'Masterpiece',
};

const MOOD_TAGS = [
  'cozy', 'intense', 'funny', 'sad', 'thought-provoking',
  'binge-worthy', 'slow-burn', 'rewatchable', 'nostalgic', 'mind-bending',
];

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  visible: boolean;
  editEntry?: WatchEntry | null;
  onSave: () => void;
  onClose: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function LogEntrySheet({ visible, editEntry, onSave, onClose }: Props) {
  const { getToken } = useAuth();

  // Search
  const [searchQuery,   setSearchQuery]    = useState('');
  const [searchResults, setSearchResults]  = useState<ContentResult[]>([]);
  const [searching,     setSearching]      = useState(false);
  const [selectedContent, setSelectedContent] = useState<ContentResult | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Form
  const [status,    setStatus]    = useState<WatchStatus>('watched');
  const [rating,    setRating]    = useState<number | null>(null);
  const [take,      setTake]      = useState('');
  const [moodTags,  setMoodTags]  = useState<string[]>([]);

  // Submission
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState<string | null>(null);

  // Prefill when editing
  useEffect(() => {
    if (editEntry) {
      setSelectedContent({
        id:           editEntry.content_id,
        source:       'manual',
        content_type: editEntry.content_type,
        title:        editEntry.content_title,
        thumbnail_url: editEntry.content_thumbnail_url ?? undefined,
        poster_url:    editEntry.content_poster_url ?? undefined,
      } as ContentResult);
      setStatus(editEntry.status);
      setRating(editEntry.rating);
      setTake(editEntry.take ?? '');
      setMoodTags(editEntry.mood_tags ?? []);
    }
  }, [editEntry]);

  const reset = () => {
    lastEditId.current = null;
    setSearchQuery('');
    setSearchResults([]);
    setSelectedContent(null);
    setStatus('watched');
    setRating(null);
    setTake('');
    setMoodTags([]);
    setError(null);
  };

  const handleClose = () => { reset(); onClose(); };

  // Debounced search
  const handleSearchChange = useCallback((q: string) => {
    setSearchQuery(q);
    setSelectedContent(null);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!q.trim()) { setSearchResults([]); return; }
    searchTimer.current = setTimeout(async () => {
      setSearching(true);
      try {
        const token = await getToken();
        if (!token) return;
        const { results } = await api.content.search(token, q);
        setSearchResults(results.slice(0, 6));
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);
  }, [getToken]);

  const handleSubmit = async () => {
    if (!selectedContent) { setError('Please select a title first.'); return; }
    setSaving(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');

      if (editEntry) {
        await api.watchEntries.update(token, editEntry.id, {
          status,
          rating: rating ?? undefined,
          take:   take || undefined,
          mood_tags: moodTags,
        });
      } else {
        await api.watchEntries.create(token, {
          content_id: selectedContent.id,
          status,
          ...(rating !== null && { rating }),
          ...(take              && { take }),
          ...(moodTags.length   && { mood_tags: moodTags }),
        });
      }
      reset();
      onSave();
    } catch (err: any) {
      setError(err?.message ?? 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  };

  const toggleTag = (tag: string) =>
    setMoodTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>
                {editEntry ? 'EDIT ENTRY' : 'LOG SOMETHING'}
              </Text>
              <Text style={styles.headerSub}>
                {editEntry ? editEntry.content_title : 'What did you watch?'}
              </Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn} hitSlop={8}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* ── Title search (hidden in edit mode) ── */}
            {!editEntry && (
              <View style={styles.section}>
                <Text style={styles.label}>TITLE</Text>

                {selectedContent ? (
                  <View style={styles.selectedChip}>
                    {(selectedContent.poster_url || selectedContent.thumbnail_url) && (
                      <Image
                        source={{ uri: selectedContent.poster_url ?? selectedContent.thumbnail_url }}
                        style={styles.chipPoster}
                        contentFit="cover"
                      />
                    )}
                    <View style={styles.chipInfo}>
                      <Text style={styles.chipTitle} numberOfLines={1}>
                        {selectedContent.title}
                      </Text>
                      <Text style={styles.chipMeta}>
                        {selectedContent.content_type.toUpperCase()}
                        {(selectedContent.metadata as any)?.year && ` · ${(selectedContent.metadata as any).year}`}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => { setSelectedContent(null); setSearchQuery(''); setSearchResults([]); }}
                      hitSlop={8}
                    >
                      <Text style={styles.chipClear}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <>
                    <View style={styles.searchRow}>
                      <TextInput
                        style={styles.input}
                        value={searchQuery}
                        onChangeText={handleSearchChange}
                        placeholder="Search movies, shows, YouTube…"
                        placeholderTextColor="#5A4A3A"
                        autoFocus={false}
                        returnKeyType="search"
                      />
                      {searching && (
                        <ActivityIndicator size="small" color="#E8A44A" style={styles.spinner} />
                      )}
                    </View>

                    {searchResults.length > 0 && (
                      <View style={styles.searchResults}>
                        {searchResults.map((result) => (
                          <Pressable
                            key={`${result.source}-${result.id}`}
                            style={({ pressed }) => [
                              styles.searchResultItem,
                              pressed && styles.searchResultItemPressed,
                            ]}
                            onPress={() => { setSelectedContent(result); setSearchResults([]); }}
                          >
                            {(result.poster_url || result.thumbnail_url) && (
                              <Image
                                source={{ uri: result.poster_url ?? result.thumbnail_url }}
                                style={styles.resultPoster}
                                contentFit="cover"
                              />
                            )}
                            <View style={styles.resultInfo}>
                              <Text style={styles.resultTitle} numberOfLines={1}>
                                {result.title}
                              </Text>
                              <Text style={styles.resultMeta}>
                                {result.content_type.toUpperCase()}
                                {(result.metadata as any)?.year && ` · ${(result.metadata as any).year}`}
                              </Text>
                            </View>
                          </Pressable>
                        ))}
                      </View>
                    )}
                  </>
                )}
              </View>
            )}

            {/* ── Status ── */}
            <View style={styles.section}>
              <Text style={styles.label}>STATUS</Text>
              <View style={styles.statusRow}>
                {STATUS_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[styles.statusBtn, status === opt.value && styles.statusBtnActive]}
                    onPress={() => setStatus(opt.value)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.statusBtnText, status === opt.value && styles.statusBtnTextActive]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* ── Rating ── */}
            <View style={styles.section}>
              <Text style={styles.label}>
                RATING{rating ? `  —  ${RATING_LABELS[rating]}` : ''}
              </Text>
              <View style={styles.ratingRow}>
                {[1,2,3,4,5,6,7,8,9,10].map((n) => (
                  <TouchableOpacity
                    key={n}
                    style={[styles.ratingBtn, rating === n && styles.ratingBtnActive]}
                    onPress={() => setRating(rating === n ? null : n)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.ratingBtnText, rating === n && styles.ratingBtnTextActive]}>
                      {n}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* ── Take ── */}
            <View style={styles.section}>
              <Text style={styles.label}>YOUR TAKE  <Text style={styles.labelOptional}>(optional)</Text></Text>
              <TextInput
                style={[styles.input, styles.textarea]}
                value={take}
                onChangeText={setTake}
                placeholder="What did you think? Any spoiler-free reaction…"
                placeholderTextColor="#5A4A3A"
                multiline
                numberOfLines={3}
                maxLength={500}
                textAlignVertical="top"
              />
              <Text style={styles.charCount}>{take.length}/500</Text>
            </View>

            {/* ── Mood tags ── */}
            <View style={styles.section}>
              <Text style={styles.label}>VIBES</Text>
              <View style={styles.tagsWrap}>
                {MOOD_TAGS.map((tag) => (
                  <TouchableOpacity
                    key={tag}
                    style={[styles.tag, moodTags.includes(tag) && styles.tagActive]}
                    onPress={() => toggleTag(tag)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.tagText, moodTags.includes(tag) && styles.tagTextActive]}>
                      {tag}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* ── Error ── */}
            {error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* ── Submit ── */}
            <TouchableOpacity
              style={[styles.submitBtn, (saving || (!editEntry && !selectedContent)) && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={saving || (!editEntry && !selectedContent)}
              activeOpacity={0.8}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#1A1612" />
              ) : (
                <Text style={styles.submitBtnText}>
                  {editEntry ? 'SAVE CHANGES' : 'LOG IT'}
                </Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
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
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: C.bg },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 4,
    color: C.cream,
  },
  headerSub: {
    fontSize: 11,
    letterSpacing: 2,
    color: C.mist,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: { fontSize: 18, color: C.mist },

  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },

  section: { marginTop: 24 },

  label: {
    fontSize: 10,
    letterSpacing: 3,
    color: C.mist,
    marginBottom: 10,
    fontWeight: '600',
  },
  labelOptional: {
    fontSize: 10,
    letterSpacing: 0,
    color: C.dim,
    fontWeight: '400',
  },

  input: {
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    color: C.cream,
    fontSize: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  textarea: {
    minHeight: 80,
    paddingTop: 12,
  },
  charCount: { fontSize: 10, color: C.dim, textAlign: 'right', marginTop: 4 },

  searchRow: { position: 'relative' },
  spinner: { position: 'absolute', right: 12, top: 12 },

  searchResults: {
    backgroundColor: C.surface,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: C.border,
    maxHeight: 280,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: C.border + '66',
  },
  searchResultItemPressed: { backgroundColor: C.bg },
  resultPoster: { width: 32, height: 44, marginRight: 12 },
  resultInfo: { flex: 1, minWidth: 0 },
  resultTitle: { color: C.cream, fontSize: 13, fontWeight: '500' },
  resultMeta: { color: C.mist, fontSize: 10, letterSpacing: 1, marginTop: 1 },

  selectedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.amber,
    padding: 12,
    gap: 12,
  },
  chipPoster: { width: 36, height: 50 },
  chipInfo: { flex: 1, minWidth: 0 },
  chipTitle: { color: C.cream, fontSize: 14, fontWeight: '500' },
  chipMeta: { color: C.mist, fontSize: 10, letterSpacing: 1, marginTop: 2 },
  chipClear: { color: C.mist, fontSize: 16, paddingHorizontal: 4 },

  statusRow: { flexDirection: 'row', gap: 8 },
  statusBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
  },
  statusBtnActive: { backgroundColor: C.amber, borderColor: C.amber },
  statusBtnText: { fontSize: 10, letterSpacing: 1, color: C.mist, fontWeight: '600' },
  statusBtnTextActive: { color: C.bg },

  ratingRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  ratingBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
  },
  ratingBtnActive: { backgroundColor: C.amber, borderColor: C.amber },
  ratingBtnText: { fontSize: 13, color: C.mist, fontWeight: '600' },
  ratingBtnTextActive: { color: C.bg },

  tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
  },
  tagActive: { backgroundColor: C.amber + '33', borderColor: C.amber },
  tagText: { fontSize: 11, letterSpacing: 1, color: C.mist },
  tagTextActive: { color: C.amber },

  errorBox: {
    marginTop: 16,
    backgroundColor: '#FF6B6B22',
    borderWidth: 1,
    borderColor: '#FF6B6B55',
    padding: 12,
  },
  errorText: { color: '#FF6B6B', fontSize: 12, letterSpacing: 0.5 },

  submitBtn: {
    marginTop: 24,
    backgroundColor: C.amber,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnDisabled: { opacity: 0.4 },
  submitBtnText: {
    color: C.bg,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 3,
  },
});
