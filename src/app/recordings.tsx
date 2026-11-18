import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ActionSheet } from '../components/ActionSheet';
import { Icon } from '../components/Icon';
import { recordingActions, recordingTitle } from '../components/recordingMenu';
import { TakeThumb } from '../components/TakeThumb';
import { EmptyState } from '../components/ui';
import { dayLabel, formatDuration, takeNumbers, useStore, type Recording } from '../lib/store';
import { colors, radius } from '../lib/theme';

type Filter = 'all' | 'liked';

/** Video library: a big "latest" card, then one horizontal shelf per script. */
export default function Recordings() {
  const insets = useSafeAreaInsets();
  const all = useStore((s) => s.recordings);
  const scripts = useStore((s) => s.scripts);
  const [filter, setFilter] = useState<Filter>('all');
  const [menuId, setMenuId] = useState<string | null>(null);

  const numbers = useMemo(() => takeNumbers(all), [all]);
  const titles = useMemo(() => new Map(scripts.map((s) => [s.id, s.title])), [scripts]);
  const scriptName = (r: Recording) => titles.get(r.scriptId) || r.scriptTitle || 'Untitled script';

  const visible = useMemo(
    () => all.filter((r) => filter === 'all' || r.liked).sort((a, b) => b.createdAt - a.createdAt),
    [all, filter],
  );
  const latest = visible[0];

  // One shelf per script, ordered by each script's newest take.
  const shelves = useMemo(() => {
    const byScript = new Map<string, Recording[]>();
    for (const r of visible) byScript.set(r.scriptId, [...(byScript.get(r.scriptId) ?? []), r]);
    return [...byScript.entries()].map(([scriptId, takes]) => ({ scriptId, takes }));
  }, [visible]);

  const menuFor = all.find((r) => r.id === menuId) ?? null;
  const longPress = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setMenuId(id);
  };

  if (all.length === 0) {
    return (
      <View style={[styles.root, { paddingHorizontal: 20 }]}>
        <EmptyState
          title="No recordings yet"
          body="When you record a script, your takes show up here so you can watch them back."
          action={{ title: 'Choose a script', onPress: () => router.dismissTo('/') }}
        />
      </View>
    );
  }

  return (
    <>
      <ScrollView style={styles.root} contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}>
        {/* Filter chips */}
        <View style={styles.chips}>
          {(['all', 'liked'] as Filter[]).map((f) => {
            const on = filter === f;
            return (
              <Pressable
                key={f}
                onPress={() => setFilter(f)}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                style={[styles.chip, on && styles.chipOn]}
              >
                {f === 'liked' && <Icon name={on ? 'heart' : 'heart-outline'} size={14} color={colors.ink} />}
                <Text style={[styles.chipText, on && styles.chipTextOn]}>{f === 'all' ? 'All' : 'Liked'}</Text>
              </Pressable>
            );
          })}
        </View>

        {!latest ? (
          <View style={{ paddingHorizontal: 20 }}>
            <EmptyState title="No liked takes yet" body="Long-press any take and tap Like to keep it here." />
          </View>
        ) : (
          <>
            {/* Latest take, front and centre */}
            <Pressable
              onPress={() => router.push({ pathname: '/recording/[id]', params: { id: latest.id, list: filter } })}
              onLongPress={() => longPress(latest.id)}
              accessibilityRole="button"
              accessibilityLabel={`Play latest take, ${scriptName(latest)}`}
              style={({ pressed }) => [styles.hero, pressed && { transform: [{ scale: 0.98 }] }]}
            >
              <TakeThumb rec={latest} style={StyleSheet.absoluteFill} />
              <View style={styles.heroTag}>
                <Text style={styles.heroTagText}>Latest</Text>
              </View>
              <View style={styles.heroBand}>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={styles.heroTitle} numberOfLines={1}>
                    {scriptName(latest)}
                  </Text>
                  <Text style={styles.heroMeta}>
                    Take {numbers.get(latest.id) ?? 1} · {formatDuration(latest.duration)} · {dayLabel(latest.createdAt)}
                  </Text>
                </View>
                <View style={styles.heroPlay}>
                  <Icon name="play" size={20} color={colors.ink} style={{ marginLeft: 2 }} />
                </View>
              </View>
            </Pressable>

            {/* One shelf per script */}
            {shelves.map(({ scriptId, takes }) => (
              <View key={scriptId} style={styles.shelf}>
                <View style={styles.shelfHead}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.shelfTitle} numberOfLines={1}>
                      {titles.get(scriptId) || takes[0]!.scriptTitle || 'Untitled script'}
                    </Text>
                    <Text style={styles.shelfCount}>{takes.length === 1 ? '1 take' : `${takes.length} takes`}</Text>
                  </View>
                  {titles.has(scriptId) && (
                    <Pressable
                      onPress={() => router.push(`/takes/${scriptId}`)}
                      accessibilityRole="button"
                      hitSlop={8}
                      style={({ pressed }) => [styles.seeAll, pressed && { opacity: 0.6 }]}
                    >
                      <Text style={styles.seeAllText}>See all</Text>
                      <Icon name="chevron-forward" size={12} color={colors.ink} />
                    </Pressable>
                  )}
                </View>
                <FlatList
                  horizontal
                  data={takes}
                  keyExtractor={(t) => t.id}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
                  renderItem={({ item }) => (
                    <Pressable
                      onPress={() =>
                        router.push({ pathname: '/recording/[id]', params: { id: item.id, list: `script:${scriptId}` } })
                      }
                      onLongPress={() => longPress(item.id)}
                      delayLongPress={300}
                      accessibilityRole="button"
                      accessibilityLabel={`Play take ${numbers.get(item.id) ?? 1}, ${formatDuration(item.duration)}`}
                      style={({ pressed }) => [styles.card, pressed && { transform: [{ scale: 0.97 }] }]}
                    >
                      <View>
                        <TakeThumb rec={item} style={styles.cardThumb} />
                        <View style={styles.durationPill}>
                          <Text style={styles.durationText}>{formatDuration(item.duration)}</Text>
                        </View>
                        {item.liked && (
                          <View style={styles.likedDot}>
                            <Icon name="heart" size={12} color={colors.liked} />
                          </View>
                        )}
                      </View>
                      <Text style={styles.cardTitle}>Take {numbers.get(item.id) ?? 1}</Text>
                      <Text style={styles.cardMeta}>{dayLabel(item.createdAt)}</Text>
                    </Pressable>
                  )}
                />
              </View>
            ))}
          </>
        )}
      </ScrollView>

      <ActionSheet
        visible={menuFor !== null}
        heading="Take options"
        icon="videocam-outline"
        title={menuFor ? recordingTitle(menuFor, titles.get(menuFor.scriptId), numbers.get(menuFor.id)) : ''}
        subtitle={menuFor ? `${formatDuration(menuFor.duration)} · ${dayLabel(menuFor.createdAt)}` : undefined}
        actions={menuFor ? recordingActions(menuFor) : []}
        onClose={() => setMenuId(null)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  chips: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 36,
    paddingHorizontal: 16,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
  },
  chipOn: { backgroundColor: colors.primary },
  chipText: { color: colors.text, fontSize: 14, fontWeight: '600' },
  chipTextOn: { color: colors.onPrimary, fontWeight: '700' },

  hero: {
    marginHorizontal: 20,
    aspectRatio: 4 / 5,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#1A1A1A',
  },
  heroTag: {
    position: 'absolute',
    top: 14,
    left: 14,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  heroTagText: { color: colors.onPrimary, fontSize: 12, fontWeight: '800', letterSpacing: 0.3 },
  heroBand: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  heroTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '700', letterSpacing: -0.3 },
  heroMeta: { color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: '500' },
  heroPlay: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  shelf: { marginTop: 28 },
  shelfHead: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 20, marginBottom: 12, gap: 12 },
  shelfTitle: { color: colors.text, fontSize: 18, fontWeight: '700', letterSpacing: -0.2 },
  shelfCount: { color: colors.textSecondary, fontSize: 13, marginTop: 2 },
  seeAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
  },
  seeAllText: { color: colors.text, fontSize: 13, fontWeight: '600' },

  card: { width: 124, gap: 2 },
  cardThumb: { width: 124, aspectRatio: 9 / 16, borderRadius: 16, marginBottom: 6 },
  durationPill: {
    position: 'absolute',
    left: 8,
    bottom: 14,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  durationText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700', fontVariant: ['tabular-nums'] },
  likedDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: { color: colors.text, fontSize: 14, fontWeight: '600' },
  cardMeta: { color: colors.textSecondary, fontSize: 12 },
});
