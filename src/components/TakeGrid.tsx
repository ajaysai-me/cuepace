import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useMemo, useState, type ReactElement } from 'react';
import { FlatList, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { dayLabel, formatDuration, takeNumbers, useStore, type Recording } from '../lib/store';
import { colors, radius } from '../lib/theme';
import { ActionSheet } from './ActionSheet';
import { Icon } from './Icon';
import { recordingActions, recordingTitle } from './recordingMenu';
import { TakeThumb } from './TakeThumb';

const PAD = 20;
const GAP = 12;

/**
 * Two-column gallery of rounded take cards with real video stills and captions.
 * Tap plays; long-press opens options. `showScript` captions each card with its script.
 */
export function TakeGrid({
  recordings,
  scope,
  showScript,
  header,
  empty,
}: {
  recordings: Recording[];
  /** Which list the player swipes through: "all", "liked" or "script:<id>". */
  scope: string;
  showScript?: boolean;
  header?: ReactElement;
  empty: ReactElement;
}) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const all = useStore((s) => s.recordings);
  const scripts = useStore((s) => s.scripts);
  const numbers = useMemo(() => takeNumbers(all), [all]);
  const titles = useMemo(() => new Map(scripts.map((s) => [s.id, s.title])), [scripts]);
  const [menuId, setMenuId] = useState<string | null>(null);
  const menuFor = all.find((r) => r.id === menuId) ?? null;

  const sorted = useMemo(() => [...recordings].sort((a, b) => b.createdAt - a.createdAt), [recordings]);
  const cardW = (width - PAD * 2 - GAP) / 2;
  const scriptName = (r: Recording) => titles.get(r.scriptId) || r.scriptTitle || 'Untitled script';

  return (
    <>
      <FlatList
        style={styles.root}
        data={sorted}
        keyExtractor={(t) => t.id}
        numColumns={2}
        columnWrapperStyle={{ gap: GAP, paddingHorizontal: PAD }}
        contentContainerStyle={{ gap: 20, paddingBottom: insets.bottom + 32, flexGrow: 1 }}
        ListHeaderComponent={header}
        ListEmptyComponent={<View style={{ flex: 1, paddingHorizontal: PAD }}>{empty}</View>}
        renderItem={({ item, index }) => (
          <Pressable
            onPress={() => router.push({ pathname: '/recording/[id]', params: { id: item.id, list: scope } })}
            onLongPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
              setMenuId(item.id);
            }}
            delayLongPress={300}
            accessibilityRole="button"
            accessibilityLabel={`Play ${recordingTitle(item, titles.get(item.scriptId), numbers.get(item.id))}, ${formatDuration(item.duration)}`}
            style={({ pressed }) => [{ width: cardW }, pressed && { transform: [{ scale: 0.97 }] }]}
          >
            <View>
              <TakeThumb rec={item} style={styles.thumb} />
              {index === 0 && (
                <View style={styles.latest}>
                  <Text style={styles.latestText}>Latest</Text>
                </View>
              )}
              {item.liked && (
                <View style={styles.liked}>
                  <Icon name="heart" size={13} color={colors.liked} />
                </View>
              )}
              <View style={styles.duration}>
                <Icon name="play" size={11} color="#FFFFFF" />
                <Text style={styles.durationText}>{formatDuration(item.duration)}</Text>
              </View>
            </View>
            <Text style={styles.title} numberOfLines={1}>
              {showScript ? scriptName(item) : `Take ${numbers.get(item.id) ?? 1}`}
            </Text>
            <Text style={styles.meta} numberOfLines={1}>
              {showScript ? `Take ${numbers.get(item.id) ?? 1} · ` : ''}
              {dayLabel(item.createdAt)}
            </Text>
          </Pressable>
        )}
      />
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
  thumb: { width: '100%', aspectRatio: 9 / 16, borderRadius: 18, marginBottom: 8 },
  latest: {
    position: 'absolute',
    top: 10,
    left: 10,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  latestText: { color: colors.onPrimary, fontSize: 11, fontWeight: '800' },
  liked: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  duration: {
    position: 'absolute',
    left: 10,
    bottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  durationText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700', fontVariant: ['tabular-nums'] },
  title: { color: colors.text, fontSize: 15, fontWeight: '600' },
  meta: { color: colors.textSecondary, fontSize: 13, marginTop: 1 },
});
