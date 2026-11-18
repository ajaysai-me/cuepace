import { useCallback, useEffect, useImperativeHandle, useRef, useState, type Ref } from 'react';
import { Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import Animated, {
  scrollTo,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useFrameCallback,
  useSharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN, scheduleOnUI } from 'react-native-worklets';
import * as Haptics from 'expo-haptics';
import { actions, LIMITS, type PrompterTheme, type Settings } from '../lib/store';
import { colors } from '../lib/theme';
import { IconButton, Stepper } from './ui';

export type PrompterHandle = {
  play: () => void;
  pause: () => void;
  restart: () => void;
};

type Props = {
  text: string;
  settings: Settings;
  /** Small overlay version used on top of the camera. Ignores mirroring. */
  compact?: boolean;
  ref?: Ref<PrompterHandle>;
  onPlayingChange?: (playing: boolean) => void;
  onOpenSettings?: () => void;
};

const THEMES: Record<PrompterTheme, { bg: string; fg: string }> = {
  dark: { bg: '#000000', fg: '#FFFFFF' },
  light: { bg: '#FFFFFF', fg: '#111111' },
  contrast: { bg: '#000000', fg: '#FFE14D' },
};

/** Pixels per second. Scales with font size so a speed level means roughly the same words per second at any size. */
function speedToPx(speed: number, fontSize: number) {
  return speed * 8 * (fontSize / 40);
}

export function Prompter({ text, settings, compact, ref, onPlayingChange, onOpenSettings }: Props) {
  const theme = THEMES[settings.theme];
  // Eye line, as a fraction of the view height. On the camera it's adjustable in settings.
  const cue = compact ? settings.cuePosition / 100 : 0.3;

  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const offset = useSharedValue(0);
  const playing = useSharedValue(false);
  const userScrolling = useSharedValue(false);
  const contentH = useSharedValue(0);
  const viewH = useSharedValue(0);
  const pxPerSec = useSharedValue(speedToPx(settings.speed, settings.fontSize));

  const [viewHeight, setViewHeight] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [count, setCount] = useState<number | null>(null);
  const countTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    pxPerSec.set(speedToPx(settings.speed, settings.fontSize));
  }, [settings.speed, settings.fontSize, pxPerSec]);

  useEffect(() => {
    onPlayingChange?.(isPlaying || count !== null);
  }, [isPlaying, count, onPlayingChange]);

  const clearCountdown = useCallback(() => {
    if (countTimer.current) clearInterval(countTimer.current);
    countTimer.current = null;
    setCount(null);
  }, []);

  useEffect(() => clearCountdown, [clearCountdown]);

  const startScrolling = useCallback(() => {
    playing.set(true);
    setIsPlaying(true);
  }, [playing]);

  const pause = useCallback(() => {
    clearCountdown();
    playing.set(false);
    setIsPlaying(false);
  }, [clearCountdown, playing]);

  const play = useCallback(() => {
    if (playing.get() || countTimer.current) return;
    // Count down only when starting from the top; resuming mid-script starts instantly.
    if (settings.countdown > 0 && offset.get() < 1) {
      let n = settings.countdown;
      setCount(n);
      countTimer.current = setInterval(() => {
        n -= 1;
        if (n <= 0) {
          clearCountdown();
          startScrolling();
        } else {
          setCount(n);
        }
      }, 1000);
    } else {
      startScrolling();
    }
  }, [playing, offset, settings.countdown, clearCountdown, startScrolling]);

  const restart = useCallback(() => {
    pause();
    offset.set(0);
    scheduleOnUI(() => {
      'worklet';
      scrollTo(scrollRef, 0, 0, true);
    });
  }, [pause, offset, scrollRef]);

  const toggle = useCallback(() => {
    if (playing.get() || countTimer.current) pause();
    else play();
  }, [playing, pause, play]);

  useImperativeHandle(ref, () => ({ play, pause, restart }), [play, pause, restart]);

  const onReachedEnd = useCallback(() => {
    setIsPlaying(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  }, []);

  // Runs on the UI thread every frame, so scrolling stays smooth even if JS is busy.
  useFrameCallback((frame) => {
    'worklet';
    if (!playing.get() || userScrolling.get()) return;
    const dt = Math.min((frame.timeSincePreviousFrame ?? 16) / 1000, 0.1);
    const max = Math.max(0, contentH.get() - viewH.get());
    const next = Math.min(offset.get() + pxPerSec.get() * dt, max);
    offset.set(next);
    scrollTo(scrollRef, 0, next, false);
    if (next >= max) {
      playing.set(false);
      scheduleOnRN(onReachedEnd);
    }
  });

  // Manual dragging takes over; auto-scroll resumes from wherever the reader lets go.
  const scrollHandler = useAnimatedScrollHandler({
    onBeginDrag: () => {
      userScrolling.set(true);
    },
    onEndDrag: () => {
      userScrolling.set(false);
    },
    onMomentumBegin: () => {
      userScrolling.set(true);
    },
    onMomentumEnd: () => {
      userScrolling.set(false);
    },
    onScroll: (e) => {
      if (userScrolling.get() || !playing.get()) offset.set(e.contentOffset.y);
    },
  });

  const progressStyle = useAnimatedStyle(() => {
    const max = Math.max(1, contentH.get() - viewH.get());
    return { width: `${Math.min(100, (offset.get() / max) * 100)}%` };
  });

  const onLayout = (e: LayoutChangeEvent) => {
    const h = e.nativeEvent.layout.height;
    viewH.set(h);
    setViewHeight(h);
  };

  const mirror = !compact && (settings.mirrorH || settings.mirrorV);
  const fontSize = settings.fontSize;
  const active = isPlaying || count !== null;

  return (
    <View style={[styles.root, { backgroundColor: compact ? 'transparent' : theme.bg }]}>
      <View
        style={[
          styles.stage,
          mirror && {
            transform: [{ scaleX: settings.mirrorH ? -1 : 1 }, { scaleY: settings.mirrorV ? -1 : 1 }],
          },
        ]}
        onLayout={onLayout}
      >
        <Animated.ScrollView
          ref={scrollRef}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={(_, h) => {
            contentH.set(h);
          }}
          contentContainerStyle={{
            paddingTop: viewHeight * cue,
            paddingBottom: viewHeight * (1 - cue),
            paddingHorizontal: `${settings.margin}%`,
          }}
        >
          <Pressable onPress={toggle} accessibilityRole="button" accessibilityLabel={active ? 'Pause' : 'Play'}>
            <Text
              style={{
                color: compact ? '#FFFFFF' : theme.fg,
                fontSize,
                lineHeight: Math.round(fontSize * 1.35),
                fontWeight: '600',
                textAlign: settings.align,
              }}
            >
              {text.trim() || 'This script is empty. Go back and add some text.'}
            </Text>
          </Pressable>
        </Animated.ScrollView>

        {settings.cueLine && viewHeight > 0 && (
          <View pointerEvents="none" style={[styles.cue, { top: viewHeight * cue + fontSize * 0.68 }]}>
            <View style={styles.cueArrow} />
            <View style={styles.cueLine} />
          </View>
        )}
      </View>

      {!compact && (
        <View style={styles.progressTrack} pointerEvents="none">
          <Animated.View style={[styles.progressFill, progressStyle]} />
        </View>
      )}

      {count !== null && (
        <View pointerEvents="none" style={styles.countdown}>
          <Text style={[styles.countdownText, compact && { fontSize: 64 }]}>{count}</Text>
        </View>
      )}

      {!compact && (
        <View style={[styles.controls, active && { opacity: 0.45 }]}>
          <IconButton icon="play-skip-back" label="Restart" onPress={restart} />
          <Stepper
            label="Speed"
            value={settings.speed}
            {...LIMITS.speed}
            onChange={(speed) => actions.updateSettings({ speed })}
          />
          <IconButton
            icon={active ? 'pause' : 'play'}
            label={active ? 'Pause' : 'Play'}
            size={28}
            active
            onPress={toggle}
            style={styles.playButton}
          />
          <Stepper
            label="Size"
            value={settings.fontSize}
            display={`${settings.fontSize}pt`}
            {...LIMITS.fontSize}
            onChange={(f) => actions.updateSettings({ fontSize: f })}
          />
          {onOpenSettings && <IconButton icon="options" label="Prompter settings" onPress={onOpenSettings} />}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  stage: { flex: 1, overflow: 'hidden' },
  cue: { position: 'absolute', left: 0, right: 0, flexDirection: 'row', alignItems: 'center' },
  cueArrow: {
    width: 0,
    height: 0,
    borderTopWidth: 9,
    borderBottomWidth: 9,
    borderLeftWidth: 14,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: colors.highlight,
  },
  cueLine: { flex: 1, height: 2, backgroundColor: colors.highlight, opacity: 0.4 },
  progressTrack: { height: 3, backgroundColor: 'rgba(255,255,255,0.12)' },
  progressFill: { height: 3, backgroundColor: colors.primary },
  countdown: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  countdownText: { color: colors.primary, fontSize: 120, fontWeight: '800', fontVariant: ['tabular-nums'] },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: colors.surface,
  },
  playButton: { width: 60, height: 60 },
});
