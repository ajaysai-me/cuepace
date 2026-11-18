import { useEvent, useEventListener } from 'expo';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect, useMemo, useState } from 'react';
import { FlatList, PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../../components/Icon';
import { IconButton } from '../../components/ui';
import { recordingUri } from '../../lib/recordings';
import { formatDuration, useStore, type Recording } from '../../lib/store';
import { colors } from '../../lib/theme';

const clamp = (v: number) => Math.min(1, Math.max(0, v));

/** Draggable progress bar. Reports the new time once you let go. */
function Timeline({
  time,
  duration,
  onScrubStart,
  onSeek,
}: {
  time: number;
  duration: number;
  onScrubStart: () => void;
  onSeek: (seconds: number) => void;
}) {
  const [width, setWidth] = useState(1);
  const [scrub, setScrub] = useState<number | null>(null);
  const start = useSharedValue(0);

  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        // Keep the scrub even if the finger drifts vertically (the feed would otherwise take it).
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: (e) => {
          const r = clamp(e.nativeEvent.locationX / width);
          start.set(r);
          setScrub(r);
          onScrubStart();
        },
        onPanResponderMove: (_, g) => setScrub(clamp(start.get() + g.dx / width)),
        onPanResponderRelease: (_, g) => {
          onSeek(clamp(start.get() + g.dx / width) * duration);
          setScrub(null);
        },
        onPanResponderTerminate: () => setScrub(null),
      }),
    [width, duration, onScrubStart, onSeek, start],
  );

  const ratio = scrub ?? (duration > 0 ? clamp(time / duration) : 0);
  return (
    <View style={styles.timeline}>
      <Text style={styles.time}>{formatDuration(scrub !== null ? scrub * duration : time)}</Text>
      <View
        style={styles.trackArea}
        onLayout={(e) => setWidth(Math.max(1, e.nativeEvent.layout.width))}
        accessibilityRole="adjustable"
        accessibilityLabel="Timeline"
        {...pan.panHandlers}
      >
        <View style={styles.track} pointerEvents="none">
          <View style={[styles.fill, { width: `${ratio * 100}%` }]} />
        </View>
        <View
          pointerEvents="none"
          style={[styles.knob, scrub !== null && styles.knobActive, { left: ratio * width - (scrub !== null ? 9 : 7) }]}
        />
      </View>
      <Text style={styles.time}>{formatDuration(duration)}</Text>
    </View>
  );
}

/** One full-screen take. Plays only while it's the page on screen. */
function Page({ rec, active, height }: { rec: Recording; active: boolean; height: number }) {
  const insets = useSafeAreaInsets();
  const player = useVideoPlayer({ uri: recordingUri(rec) }, (p) => {
    p.loop = false;
    p.timeUpdateEventInterval = 0.1;
  });

  const { isPlaying } = useEvent(player, 'playingChange', { isPlaying: player.playing });
  const { currentTime } = useEvent(player, 'timeUpdate', {
    currentTime: player.currentTime,
    currentLiveTimestamp: null,
    currentOffsetFromLive: null,
    bufferedPosition: 0,
  });
  const [duration, setDuration] = useState(rec.duration);
  const [ended, setEnded] = useState(false);
  const [controls, setControls] = useState(true);

  useEventListener(player, 'sourceLoad', (e) => {
    if (e.duration > 0) setDuration(e.duration);
  });
  useEventListener(player, 'playingChange', ({ isPlaying: playing }) => {
    if (playing) setEnded(false);
  });
  useEventListener(player, 'playToEnd', () => {
    setEnded(true);
    setControls(true);
  });

  // Start when swiped to; pause and rewind when swiped away (like Reels).
  useEffect(() => {
    if (active) {
      player.play();
    } else {
      player.pause();
      player.seekBy(-player.currentTime);
    }
  }, [active, player]);

  // Controls fade out after a few seconds of playback; any tap brings them back.
  useEffect(() => {
    if (!controls || !isPlaying) return;
    const t = setTimeout(() => setControls(false), 2500);
    return () => clearTimeout(t);
  }, [controls, isPlaying, currentTime]);

  const togglePlay = () => {
    if (isPlaying) return player.pause();
    if (ended) {
      setEnded(false);
      return player.replay();
    }
    player.play();
  };

  const seek = (seconds: number) => {
    player.seekBy(seconds - player.currentTime);
    setEnded(false);
    setControls(true);
  };

  return (
    <View style={{ height, backgroundColor: '#000' }}>
      <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="contain" nativeControls={false} />

      {/* Tap anywhere on the video to show or hide the controls. */}
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={() => setControls((c) => !c)}
        accessibilityLabel={controls ? 'Hide controls' : 'Show controls'}
      />

      {controls && (
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          <View style={styles.center} pointerEvents="box-none">
            <Pressable
              onPress={togglePlay}
              accessibilityRole="button"
              accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
              style={({ pressed }) => [styles.play, pressed && { transform: [{ scale: 0.94 }] }]}
            >
              <Icon
                name={isPlaying ? 'pause' : 'play'}
                size={34}
                color="#FFFFFF"
                style={isPlaying ? undefined : { marginLeft: 4 }}
              />
            </Pressable>
          </View>
          <View style={[styles.bottom, { paddingBottom: insets.bottom + 16 }]}>
            <Timeline time={currentTime} duration={duration} onScrubStart={() => setControls(true)} onSeek={seek} />
          </View>
        </View>
      )}
    </View>
  );
}

/**
 * Full-screen player. Swipe up for the next take and down for the previous one,
 * within the list it was opened from (`list`: "all", "liked" or "script:<id>").
 */
export default function Player() {
  const { id, list } = useLocalSearchParams<{ id: string; list?: string }>();
  const insets = useSafeAreaInsets();
  const all = useStore((s) => s.recordings);

  const items = useMemo(() => {
    const scope = list ?? 'all';
    const inScope =
      scope === 'liked'
        ? all.filter((r) => r.liked)
        : scope.startsWith('script:')
          ? all.filter((r) => r.scriptId === scope.slice('script:'.length))
          : all;
    const sorted = [...inScope].sort((a, b) => b.createdAt - a.createdAt);
    if (sorted.some((r) => r.id === id)) return sorted;
    // Fall back to just this take if it isn't in the list (e.g. it was unliked meanwhile).
    const self = all.find((r) => r.id === id);
    return self ? [self] : [];
  }, [all, list, id]);

  const initialIndex = Math.max(0, items.findIndex((r) => r.id === id));
  const [active, setActive] = useState(initialIndex);
  const [pageH, setPageH] = useState(0);

  if (items.length === 0) {
    return (
      <View style={[styles.root, styles.center]}>
        <StatusBar hidden />
        <Text style={styles.time}>This take was deleted.</Text>
      </View>
    );
  }

  return (
    <View style={styles.root} onLayout={(e) => setPageH(e.nativeEvent.layout.height)}>
      <StatusBar hidden />
      {pageH > 0 && (
        <FlatList
          data={items}
          keyExtractor={(r) => r.id}
          pagingEnabled
          showsVerticalScrollIndicator={false}
          initialScrollIndex={initialIndex}
          getItemLayout={(_, index) => ({ length: pageH, offset: pageH * index, index })}
          onMomentumScrollEnd={(e) => setActive(Math.round(e.nativeEvent.contentOffset.y / pageH))}
          windowSize={3}
          initialNumToRender={1}
          maxToRenderPerBatch={2}
          renderItem={({ item, index }) => <Page rec={item} active={index === active} height={pageH} />}
        />
      )}

      {/* Shared chrome: close and position in the list. */}
      <View style={[styles.topBar, { top: insets.top + 8 }]} pointerEvents="box-none">
        <IconButton icon="close" label="Close" plain size={24} color="#FFFFFF" onPress={() => router.back()} />
        {items.length > 1 && (
          <View style={styles.counter}>
            <Text style={styles.counterText}>
              {Math.min(active, items.length - 1) + 1} / {items.length}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const shadow = { textShadowColor: 'rgba(0,0,0,0.6)', textShadowRadius: 4, textShadowOffset: { width: 0, height: 1 } };

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  topBar: { position: 'absolute', left: 8, right: 8, flexDirection: 'row', alignItems: 'center' },
  counter: {
    marginLeft: 'auto',
    marginRight: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  counterText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700', fontVariant: ['tabular-nums'] },
  play: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottom: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 16 },
  timeline: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  time: { color: '#FFFFFF', fontSize: 13, fontWeight: '600', fontVariant: ['tabular-nums'], ...shadow },
  trackArea: { flex: 1, height: 36, justifyContent: 'center' },
  track: { height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.3)', overflow: 'hidden' },
  fill: { height: 4, backgroundColor: colors.primary },
  knob: { position: 'absolute', width: 14, height: 14, borderRadius: 7, backgroundColor: colors.primary },
  knobActive: { width: 18, height: 18, borderRadius: 9 },
});
