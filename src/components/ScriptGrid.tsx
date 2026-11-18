import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { readingTime, useStore, type Script } from '../lib/store';
import { colors, noteTone, radius } from '../lib/theme';
import { Icon } from './Icon';

/** Rough card height, used to balance the two grid columns. */
function estimateHeight(s: Script) {
  return 56 + (s.title ? 24 : 0) + Math.min(s.body.trim().length, 360) * 0.45;
}

/** Splits scripts into two columns, always adding to the shorter one (staggered grid). */
function toColumns(list: Script[]): [Script[], Script[]] {
  const cols: [Script[], Script[]] = [[], []];
  const heights = [0, 0];
  for (const s of list) {
    const i = heights[0]! <= heights[1]! ? 0 : 1;
    cols[i].push(s);
    heights[i]! += estimateHeight(s);
  }
  return cols;
}

/**
 * Two-column staggered grid of script cards, Keep-style:
 * long-press selects a card; while anything is selected, taps toggle selection.
 */
export function ScriptGrid({
  scripts,
  selected,
  onToggle,
}: {
  scripts: Script[];
  selected: Set<string>;
  onToggle: (id: string) => void;
}) {
  const recordings = useStore((s) => s.recordings);
  const selecting = selected.size > 0;

  const takes = useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of recordings) counts.set(r.scriptId, (counts.get(r.scriptId) ?? 0) + 1);
    return counts;
  }, [recordings]);

  const columns = useMemo(() => toColumns(scripts), [scripts]);

  const renderCard = (item: Script) => {
    const n = takes.get(item.id) ?? 0;
    const isSelected = selected.has(item.id);
    const tone = noteTone(item.color);
    const colored = !!item.color && item.color !== 'default';
    // Selection must show on dark cards too.
    const selectColor = tone.dark ? colors.highlight : colors.ink;
    return (
      <Pressable
        key={item.id}
        onPress={() => (selecting ? onToggle(item.id) : router.push(`/script/${item.id}`))}
        onLongPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
          onToggle(item.id);
        }}
        delayLongPress={300}
        accessibilityRole="button"
        accessibilityLabel={item.title || 'Untitled script'}
        accessibilityState={{ selected: isSelected }}
        style={({ pressed }) => [
          styles.note,
          { backgroundColor: tone.bg },
          colored && { borderColor: 'transparent' },
          isSelected && [styles.noteSelected, { borderColor: selectColor }],
          pressed && !selecting && { opacity: 0.8 },
        ]}
      >
        {isSelected && (
          <View style={[styles.check, { backgroundColor: colors.primary, borderColor: selectColor }]}>
            <Icon name="checkmark" size={12} color={colors.onPrimary} />
          </View>
        )}
        {item.title ? (
          <Text style={[styles.noteTitle, { color: tone.fg }]} numberOfLines={2}>
            {item.title}
          </Text>
        ) : null}
        {item.body.trim() ? (
          <Text style={[styles.noteBody, { color: tone.fg }]} numberOfLines={10}>
            {item.body.trim()}
          </Text>
        ) : (
          !item.title && <Text style={[styles.noteEmpty, { color: tone.sub }]}>Empty script</Text>
        )}
        <View style={styles.footer}>
          <View style={[styles.chip, { borderColor: tone.line }]}>
            <Icon name="time-outline" size={12} color={tone.sub} />
            <Text style={[styles.chipText, { color: tone.sub }]}>{readingTime(item.body)}</Text>
          </View>
          {n > 0 && (
            <Pressable
              onPress={() => (selecting ? onToggle(item.id) : router.push(`/takes/${item.id}`))}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={`View ${n} takes`}
              style={({ pressed }) => [
                styles.chip,
                { backgroundColor: colors.primary, borderColor: colors.primary },
                pressed && { opacity: 0.7 },
              ]}
            >
              <Icon name="videocam" size={12} color={colors.onPrimary} />
              <Text style={[styles.chipText, { color: colors.onPrimary, fontWeight: '700' }]}>{n}</Text>
            </Pressable>
          )}
        </View>
      </Pressable>
    );
  };

  return (
    <View style={styles.grid}>
      {columns.map((col, i) => (
        <View key={i} style={styles.column}>
          {col.map(renderCard)}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', gap: 10 },
  column: { flex: 1, gap: 10 },
  note: {
    padding: 14,
    gap: 8,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  // Thicker border; padding shrinks by the same amount so the card doesn't jump.
  noteSelected: { borderWidth: 2, borderColor: colors.ink, padding: 13 },
  check: {
    position: 'absolute',
    top: -8,
    left: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  noteTitle: { color: colors.text, fontSize: 16, fontWeight: '600', lineHeight: 21 },
  noteBody: { color: colors.text, fontSize: 14, lineHeight: 20 },
  noteEmpty: { color: colors.textMuted, fontSize: 14, fontStyle: 'italic' },
  footer: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginTop: 2 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipText: { color: colors.textSecondary, fontSize: 12, fontWeight: '500' },
});
