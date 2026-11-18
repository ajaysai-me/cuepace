import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { TakeGrid } from '../../components/TakeGrid';
import { EmptyState } from '../../components/ui';
import { formatDuration, useStore } from '../../lib/store';
import { colors, radius } from '../../lib/theme';

/** Gallery of one script's takes. */
export default function Takes() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const script = useStore((s) => s.scripts.find((x) => x.id === id));
  const recordings = useStore((s) => s.recordings);
  const takes = useMemo(() => recordings.filter((r) => r.scriptId === id), [recordings, id]);
  const total = takes.reduce((sum, r) => sum + r.duration, 0);
  const record = () => router.push(`/record/${id}`);

  return (
    <>
      <Stack.Screen options={{ title: script?.title || 'Takes' }} />
      <TakeGrid
        recordings={takes}
        scope={`script:${id}`}
        header={
          takes.length > 0 ? (
            <View style={styles.header}>
              <View style={{ flex: 1 }}>
                <Text style={styles.count}>{takes.length === 1 ? '1 take' : `${takes.length} takes`}</Text>
                <Text style={styles.total}>{formatDuration(total)} recorded</Text>
              </View>
              {script && (
                <Pressable
                  onPress={record}
                  accessibilityRole="button"
                  style={({ pressed }) => [styles.newTake, pressed && { transform: [{ scale: 0.96 }] }]}
                >
                  <View style={styles.recDot} />
                  <Text style={styles.newTakeText}>New take</Text>
                </Pressable>
              )}
            </View>
          ) : undefined
        }
        empty={
          <EmptyState
            title="No takes yet"
            body="Record this script and your takes will show up here."
            action={script ? { title: 'Record', onPress: record } : undefined}
          />
        }
      />
    </>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4 },
  count: { color: colors.text, fontSize: 20, fontWeight: '700', letterSpacing: -0.3 },
  total: { color: colors.textSecondary, fontSize: 14, marginTop: 2 },
  newTake: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 40,
    paddingHorizontal: 16,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  recDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.recording },
  newTakeText: { color: colors.onPrimary, fontSize: 15, fontWeight: '700' },
});
