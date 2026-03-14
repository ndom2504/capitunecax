import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
  TextInput, FlatList, Linking, Dimensions, Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { UI } from '../../constants/UI';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const JOBS_API = 'https://www.capitune.com/api/jobs';

const CARD_COLORS = [
  { bg: '#0a2744', accent: Colors.orange },
  { bg: '#1a3a5c', accent: '#38bdf8' },
  { bg: '#1e3a2e', accent: '#4ade80' },
  { bg: '#2d1b4e', accent: '#a78bfa' },
  { bg: '#3b1a1a', accent: '#f87171' },
  { bg: '#1a2e3b', accent: '#fb923c' },
];

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  description_short: string;
  url_officielle: string;
}

export default function EmploisCVScreen() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const listRef = useRef<FlatList<Job> | null>(null);

  const [query, setQuery]           = useState('');
  const [location, setLocation]     = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [jobs, setJobs]             = useState<Job[]>([]);
  const [page, setPage]             = useState(1);
  const pageRef                     = useRef(1);        // évite la stale closure
  const [loading, setLoading]       = useState(false);
  const loadingRef                  = useRef(false);    // même raison
  const [hasMore, setHasMore]       = useState(true);
  const hasMoreRef                  = useRef(true);
  const [error, setError]           = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeQuery, setActiveQuery]     = useState('*');
  const [activeLoc, setActiveLoc]         = useState('');

  const fetchJobs = useCallback(async (q: string, loc: string, p: number, replace: boolean) => {
    if (loadingRef.current) return;   // dédoublonnage
    loadingRef.current = true;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ q: q || '*', page: String(p) });
      if (loc) params.set('location', loc);
      const res  = await fetch(`${JOBS_API}?${params.toString()}`);
      if (!res.ok) throw new Error(`Erreur serveur (${res.status})`);
      const data: Job[] = await res.json();
      const newHasMore = data.length >= 10;
      setJobs(prev => replace ? data : [...prev, ...data]);
      setHasMore(newHasMore);
      hasMoreRef.current = newHasMore;
      setPage(p);
      pageRef.current = p;
      if (replace) { setActiveIndex(0); setActiveQuery(q); setActiveLoc(loc); }
    } catch (e: any) {
      setError(e?.message ?? 'Connexion echouee');
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, []);

  useEffect(() => { fetchJobs('*', '', 1, true); }, []);

  const handleSearch = () => {
    setShowSearch(false);
    fetchJobs(query || '*', location, 1, true);
  };

  const resetToAll = () => {
    setQuery('');
    setLocation('');
    fetchJobs('*', '', 1, true);
  };

  const isFiltered = activeQuery !== '*' && activeQuery !== '';

  const handlePrev = () => {
    if (activeIndex <= 0) return;
    const idx = activeIndex - 1;
    setActiveIndex(idx);
    listRef.current?.scrollToIndex({ index: idx, animated: true });
  };

  const handleNext = () => {
    if (activeIndex >= jobs.length - 1) {
      if (hasMoreRef.current && !loadingRef.current)
        fetchJobs(activeQuery || '*', activeLoc, pageRef.current + 1, false);
      return;
    }
    const idx = activeIndex + 1;
    setActiveIndex(idx);
    listRef.current?.scrollToIndex({ index: idx, animated: true });
    // Précharger 4 cartes avant la fin
    if (idx >= jobs.length - 4 && hasMoreRef.current && !loadingRef.current)
      fetchJobs(activeQuery || '*', activeLoc, pageRef.current + 1, false);
  };

  const renderJob = ({ item, index }: { item: Job; index: number }) => {
    const color  = CARD_COLORS[index % CARD_COLORS.length];
    const isActive = index === activeIndex;

    const tags: string[] = [];
    if (item.location) tags.push(item.location);
    if (item.salary)   tags.push(item.salary);

    const initials = (item.company ?? 'C')
      .trim().split(/\s+/).filter(Boolean).slice(0, 2)
      .map(w => w[0]).join('').toUpperCase();

    return (
      <View style={[styles.story, { width: SCREEN_W, backgroundColor: color.bg }]}>
        {/* Fond deco */}
        <View style={[styles.storyDecoBuble, { backgroundColor: color.accent + '18' }]} />
        <View style={[styles.storyDecoBuble2, { backgroundColor: color.accent + '10' }]} />

        {/* Overlay */}
        <View style={styles.storyShade} pointerEvents="none" />

        {/* Barre de progression */}
        <View style={[styles.storyTop, { paddingTop: insets.top + 80 }]}>
          <View style={styles.storyProgress}>
            {jobs.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.storyBar,
                  i < activeIndex  && styles.storyBarDone,
                  i === activeIndex && styles.storyBarActive,
                ]}
              />
            ))}
          </View>
        </View>

        {/* Contenu bas */}
        <View style={[styles.storyContent, { paddingBottom: insets.bottom + 24 }]}>

          {/* Ligne entreprise + badge */}
          <View style={styles.storyCompanyRow}>
            <View style={[styles.storyAvatar, { backgroundColor: color.accent + '33' }]}>
              <Text style={[styles.storyAvatarInitial, { color: color.accent }]}>{initials}</Text>
            </View>
            <Text style={styles.storySubtitle} numberOfLines={1}>{item.company}</Text>
            <View style={[styles.badge, { backgroundColor: color.accent + '22', borderColor: color.accent + '44' }]}>
              <Ionicons name="briefcase" size={13} color={color.accent} />
              <Text style={[styles.badgeText, { color: color.accent }]}>Emploi</Text>
            </View>
          </View>

          {/* Grand titre pleine largeur */}
          <Text style={styles.storyName} numberOfLines={3}>{item.title}</Text>

          {/* Meta pills */}
          <View style={styles.storyMetaRow}>
            {!!item.location && (
              <View style={styles.storyMetaItem}>
                <Ionicons name="location-outline" size={13} color={Colors.surface + 'CC'} />
                <Text style={styles.storyMetaText} numberOfLines={1}>{item.location}</Text>
              </View>
            )}
            {!!item.salary && (
              <View style={styles.storyMetaItem}>
                <Ionicons name="cash-outline" size={13} color={Colors.surface + 'CC'} />
                <Text style={styles.storyMetaText} numberOfLines={1}>{item.salary}</Text>
              </View>
            )}
          </View>

          {/* Date */}
          {!!item.description_short && (
            <Text style={styles.storyBio} numberOfLines={2}>{item.description_short}</Text>
          )}

          {/* Bouton */}
          <TouchableOpacity
            style={[styles.storyBtn, { backgroundColor: color.accent }]}
            activeOpacity={0.85}
            onPress={() => Linking.openURL(item.url_officielle).catch(() => {})}
          >
            <Ionicons name="open-outline" size={17} color="#fff" />
            <Text style={styles.storyBtnText}>Voir l'offre complète</Text>
          </TouchableOpacity>

          {/* Compteur + reset filtre */}
          <Text style={styles.storyCounter}>{activeIndex + 1} / {jobs.length}{hasMore ? '+' : ''}</Text>
          {!hasMore && isFiltered && jobs.length < 15 && (
            <View style={styles.resetBanner}>
              <Text style={styles.resetBannerText}>Seulement {jobs.length} résultat{jobs.length > 1 ? 's' : ''} pour ce filtre.</Text>
              <TouchableOpacity style={styles.resetBannerBtn} onPress={resetToAll} activeOpacity={0.8}>
                <Text style={styles.resetBannerBtnText}>↺  Voir toutes les offres</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Navigation tap zones */}
        <View style={styles.storyNav} pointerEvents="box-none">
          <TouchableOpacity style={styles.storyNavLeft}  activeOpacity={1} onPress={handlePrev} />
          <TouchableOpacity style={styles.storyNavRight} activeOpacity={1} onPress={handleNext} />
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* Header fixe */}
      <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.replace('/carriere')} activeOpacity={0.8}>
          <Ionicons name="chevron-back" size={22} color={Colors.surface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Marche de l'Emploi</Text>
        <TouchableOpacity
          style={styles.searchIconBtn}
          activeOpacity={0.8}
          onPress={() => setShowSearch(s => !s)}
        >
          <Ionicons name={showSearch ? 'close' : 'search'} size={20} color={Colors.surface} />
        </TouchableOpacity>
      </View>

      {/* Barre de recherche dépliable */}
      {showSearch && (
        <View style={[styles.searchDrawer, { paddingTop: insets.top + 20 }]}>
          <View style={styles.searchRow}>
            <Ionicons name="search-outline" size={15} color={Colors.textMuted} style={{ marginRight: 6 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Poste, competence..."
              placeholderTextColor={Colors.textMuted}
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
              autoFocus
            />
            {!!query && (
              <TouchableOpacity onPress={() => setQuery('')}>
                <Ionicons name="close-circle" size={15} color={Colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.searchRow}>
            <Ionicons name="location-outline" size={15} color={Colors.textMuted} style={{ marginRight: 6 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Ville ou province"
              placeholderTextColor={Colors.textMuted}
              value={location}
              onChangeText={setLocation}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
          </View>
          <TouchableOpacity style={styles.searchBtn} onPress={handleSearch} activeOpacity={0.8}>
            <Text style={styles.searchBtnText}>Chercher</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* États */}
      {loading && jobs.length === 0 ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={Colors.orange} />
          <Text style={styles.loadingText}>Chargement des offres...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerBox}>
          <Ionicons name="cloud-offline-outline" size={44} color={Colors.textMuted} />
          <Text style={styles.errorTitle}>Connexion echouee</Text>
          <Text style={styles.errorSub}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => fetchJobs('*', '', 1, true)} activeOpacity={0.8}>
            <Text style={styles.retryText}>Reessayer</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          ref={r => { listRef.current = r; }}
          data={jobs}
          keyExtractor={item => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          pagingEnabled
          decelerationRate="fast"
          snapToInterval={SCREEN_W}
          snapToAlignment="start"
          disableIntervalMomentum
          onMomentumScrollEnd={e => {
            const x   = e.nativeEvent.contentOffset.x;
            const idx = Math.round(x / SCREEN_W);
            const safe = Math.max(0, Math.min(jobs.length - 1, idx));
            setActiveIndex(safe);
            // Précharger dès qu'on est à 4 cartes de la fin
            if (safe >= jobs.length - 4 && hasMoreRef.current && !loadingRef.current)
              fetchJobs(activeQuery || '*', activeLoc, pageRef.current + 1, false);
          }}
          onEndReached={() => {
            if (hasMoreRef.current && !loadingRef.current)
              fetchJobs(activeQuery || '*', activeLoc, pageRef.current + 1, false);
          }}
          onEndReachedThreshold={0.3}
          ListFooterComponent={loading ? (
            <View style={{ width: SCREEN_W, justifyContent: 'center', alignItems: 'center' }}>
              <ActivityIndicator size="small" color={Colors.orange} />
            </View>
          ) : null}
          onScrollToIndexFailed={() => {}}
          renderItem={renderJob}
          ListEmptyComponent={
            <View style={[styles.centerBox, { width: SCREEN_W }]}>
              <Ionicons name="briefcase-outline" size={44} color={Colors.textMuted} />
              <Text style={styles.errorTitle}>Aucune offre trouvee</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.primaryDark },

  header: {
    position: 'absolute',
    top: 0, left: 0, right: 0, zIndex: 10,
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingBottom: 12,
    backgroundColor: 'transparent',
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  headerTitle: {
    flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '700', color: Colors.surface,
  },
  searchIconBtn: {
    width: 38, height: 38, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },

  searchDrawer: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20,
    backgroundColor: '#fff', padding: 12, gap: 8,
    borderBottomLeftRadius: 16, borderBottomRightRadius: 16,
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 10, elevation: 8,
  },
  searchRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.bgLight, borderRadius: 10, paddingHorizontal: 10, height: 40,
  },
  searchInput: { flex: 1, fontSize: 14, color: Colors.text },
  searchBtn: {
    backgroundColor: Colors.orange, borderRadius: 10,
    alignItems: 'center', paddingVertical: 10,
  },
  searchBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  story: { flex: 1 },
  storyDecoBuble: {
    position: 'absolute', width: 280, height: 280, borderRadius: 140,
    top: -60, right: -60,
  },
  storyDecoBuble2: {
    position: 'absolute', width: 180, height: 180, borderRadius: 90,
    bottom: 160, left: -40,
  },
  storyShade: {
    position: 'absolute', top: 0, right: 0, bottom: 0, left: 0,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },

  storyTop: { paddingHorizontal: 12 },
  storyProgress: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  storyBar:       { flex: 1, height: 3, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.25)' },
  storyBarDone:   { backgroundColor: 'rgba(255,255,255,0.55)' },
  storyBarActive: { backgroundColor: Colors.orange },

  storyContent: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    paddingHorizontal: 18, paddingTop: 20, gap: 12,
  },

  storyCompanyRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  storyAvatar: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  storyAvatarInitial: { fontSize: 15, fontWeight: '900' },
  storyName:    { fontSize: 28, fontWeight: '900', color: Colors.surface, lineHeight: 34 },
  storySubtitle:{ flex: 1, fontSize: 13, color: Colors.surface + 'CC', fontWeight: '700' },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1,
  },
  badgeText: { fontSize: 11, fontWeight: '700' },

  storyMetaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  storyMetaItem:{ flexDirection: 'row', alignItems: 'center', gap: 5, maxWidth: '75%' },
  storyMetaText:{ fontSize: 12, color: Colors.surface + 'CC', fontWeight: '600' },
  storyBio:     { fontSize: 13, color: Colors.surface + 'BB', lineHeight: 18 },

  storyBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, borderRadius: 16, paddingVertical: 14, paddingHorizontal: 16,
    marginTop: 4, ...UI.cardShadow,
  },
  storyBtnText: { color: '#fff', fontSize: 14, fontWeight: '900' },
  storyCounter: {
    textAlign: 'center', fontSize: 12, color: Colors.surface + '88',
    fontWeight: '600', marginTop: -4,
  },

  resetBanner: {
    backgroundColor: 'rgba(255,148,8,0.12)',
    borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,148,8,0.3)',
    padding: 12, alignItems: 'center', gap: 8,
  },
  resetBannerText: { fontSize: 12, color: Colors.surface + 'BB', textAlign: 'center' },
  resetBannerBtn: {
    backgroundColor: Colors.orange, borderRadius: 10,
    paddingHorizontal: 20, paddingVertical: 8,
  },
  resetBannerBtnText: { color: '#fff', fontWeight: '800', fontSize: 13 },

  storyNav: {
    position: 'absolute', left: 0, right: 0, top: 0, bottom: 220,
    flexDirection: 'row',
  },
  storyNavLeft:  { flex: 1 },
  storyNavRight: { flex: 1 },

  centerBox: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12,
    paddingVertical: 80,
  },
  loadingText: { fontSize: 14, color: Colors.textMuted },
  errorTitle:  { fontSize: 16, fontWeight: '700', color: Colors.text },
  errorSub:    { fontSize: 13, color: Colors.textMuted, textAlign: 'center', paddingHorizontal: 30 },
  retryBtn: {
    paddingHorizontal: 28, paddingVertical: 12,
    backgroundColor: Colors.orange, borderRadius: 12,
  },
  retryText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
