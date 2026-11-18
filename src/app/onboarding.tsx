import { useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
  type FlatList,
} from 'react-native';
import Animated, {
  interpolate,
  interpolateColor,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../components/Icon';
import { Button } from '../components/ui';
import { actions, initials, useStore } from '../lib/store';
import { avatarColor, colors, noteColors, radius } from '../lib/theme';

type Step = 'welcome' | 'write' | 'read' | 'watch' | 'name' | 'camera';
const STEPS: Step[] = ['welcome', 'write', 'read', 'watch', 'name', 'camera'];

const COPY: Record<Step, { title: string; body: string }> = {
  welcome: {
    title: 'Say it once.\nSay it right.',
    body: 'CuePace scrolls your script right under the camera, so you look into the lens and never lose your place.',
  },
  write: {
    title: 'Write it like a note',
    body: 'Keep every script in one place. Colour them, pin the ones that matter, and search in a tap.',
  },
  read: {
    title: 'Read at eye level',
    body: 'Your words scroll just below the lens. Keep the yellow line on the sentence you’re saying.',
  },
  watch: {
    title: 'Watch every take',
    body: 'Takes are saved with their script. Swipe through them, like your best, and record again.',
  },
  name: { title: 'What should we call you?', body: 'It’s only shown on this phone.' },
  camera: {
    title: 'Camera and microphone',
    body: 'CuePace needs both to record you while your script scrolls. Videos stay on your phone.',
  },
};

/* ---------- Illustrations, drawn with plain views ---------- */

function Lines({ n, color, widths = ['92%', '78%', '86%', '64%'] }: { n: number; color: string; widths?: string[] }) {
  return (
    <View style={{ gap: 7 }}>
      {Array.from({ length: n }, (_, i) => (
        <View
          key={i}
          style={{ height: 7, borderRadius: 4, backgroundColor: color, width: widths[i % widths.length] as `${number}%` }}
        />
      ))}
    </View>
  );
}

function WelcomeArt() {
  return (
    <View style={art.center}>
      <View style={art.sun} />
      <View style={[art.card, { transform: [{ rotate: '-4deg' }] }]}>
        <View style={art.recRow}>
          <View style={art.recDot} />
          <Text style={art.recText}>REC 0:42</Text>
        </View>
        <Lines n={4} color={colors.surfaceRaised} />
        <View style={art.eyeLine} />
      </View>
    </View>
  );
}

function WriteArt() {
  const cards = [
    { c: noteColors.coral.bg, r: '-8deg', x: -54, y: 8 },
    { c: noteColors.sand.bg, r: '6deg', x: 52, y: -6 },
    { c: noteColors.mint.bg, r: '-1deg', x: 0, y: 26 },
  ];
  return (
    <View style={art.center}>
      {cards.map((k, i) => (
        <View
          key={i}
          style={[
            art.note,
            { backgroundColor: k.c, transform: [{ translateX: k.x }, { translateY: k.y }, { rotate: k.r }] },
          ]}
        >
          <View style={art.noteTitle} />
          <Lines n={4} color="rgba(10,10,10,0.14)" />
        </View>
      ))}
      <View style={art.pin}>
        <Icon name="pin-filled" size={16} color={colors.ink} />
      </View>
    </View>
  );
}

function ReadArt() {
  return (
    <View style={art.center}>
      <View style={art.phone}>
        <View style={art.lens} />
        <View style={art.phoneScript}>
          <Lines n={2} color="rgba(255,255,255,0.35)" />
          <View style={art.phoneEye}>
            <View style={art.phoneEyeMark} />
            <View style={{ flex: 1, height: 7, borderRadius: 4, backgroundColor: '#FFFFFF' }} />
          </View>
          <Lines n={2} color="rgba(255,255,255,0.35)" widths={['70%', '84%']} />
        </View>
        <View style={art.person}>
          <View style={art.head} />
          <View style={art.body} />
        </View>
      </View>
    </View>
  );
}

function WatchArt() {
  return (
    <View style={art.center}>
      <View style={art.grid}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={art.take}>
            {i === 0 && (
              <View style={art.latest}>
                <Text style={art.latestText}>Latest</Text>
              </View>
            )}
            {i === 1 && (
              <View style={art.heart}>
                <Icon name="heart" size={11} color={colors.liked} />
              </View>
            )}
            <View style={art.durPill}>
              <Icon name="play" size={9} color="#FFFFFF" />
              <Text style={art.durText}>{['0:42', '0:17', '1:05', '0:31'][i]}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

function CameraArt({ granted }: { granted: boolean }) {
  return (
    <View style={art.center}>
      <View style={{ flexDirection: 'row', gap: 16 }}>
        {(['videocam', 'mic'] as const).map((n) => (
          <View key={n} style={art.permTile}>
            <Icon name={n} size={40} color={colors.ink} />
          </View>
        ))}
      </View>
      {granted && (
        <View style={art.check}>
          <Icon name="checkmark" size={20} color={colors.onInk} />
        </View>
      )}
    </View>
  );
}

/* ---------- Progress dots that stretch into a yellow pill ---------- */

function Dot({ i, x, width }: { i: number; x: SharedValue<number>; width: number }) {
  const style = useAnimatedStyle(() => {
    const p = x.get() / width;
    return {
      width: interpolate(p, [i - 1, i, i + 1], [8, 26, 8], 'clamp'),
      backgroundColor: interpolateColor(p, [i - 1, i, i + 1], ['#D6D6D6', colors.primary, '#D6D6D6']),
    };
  });
  return <Animated.View style={[styles.dot, style]} />;
}

/* ---------- Screen ---------- */

export default function Onboarding() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const name = useStore((s) => s.profile.name);
  const [camPerm, requestCam] = useCameraPermissions();
  const [micPerm, requestMic] = useMicrophonePermissions();
  const granted = !!camPerm?.granted && !!micPerm?.granted;

  const list = useRef<FlatList<Step>>(null);
  const x = useSharedValue(0);
  const [index, setIndex] = useState(0);
  const step = STEPS[index]!;

  const onScroll = useAnimatedScrollHandler((e) => {
    x.set(e.contentOffset.x);
  });

  const goTo = (i: number) => {
    list.current?.scrollToIndex({ index: i, animated: true });
    setIndex(i);
  };

  const finish = () => {
    actions.updateProfile({ onboarded: true });
    // Replayed from Profile: go back to the existing home screen. First launch: open it.
    if (router.canDismiss()) router.dismissAll();
    else router.replace('/');
  };

  const allow = async () => {
    if (!camPerm?.granted) await requestCam();
    if (!micPerm?.granted) await requestMic();
    finish();
  };

  const primary =
    step === 'camera'
      ? { title: granted ? 'Get started' : 'Allow access', onPress: granted ? finish : allow }
      : step === 'name'
        ? { title: name.trim() ? 'Continue' : 'Skip for now', onPress: () => goTo(index + 1) }
        : { title: step === 'welcome' ? 'Get started' : 'Next', onPress: () => goTo(index + 1) };

  const tone = avatarColor(name.trim().toLowerCase());
  const letters = initials(name);

  const renderStep = (s: Step) => (
    <View style={{ width, flex: 1 }}>
      <View style={styles.artArea}>
        {s === 'welcome' && <WelcomeArt />}
        {s === 'write' && <WriteArt />}
        {s === 'read' && <ReadArt />}
        {s === 'watch' && <WatchArt />}
        {s === 'camera' && <CameraArt granted={granted} />}
        {s === 'name' && (
          <View style={[styles.bigAvatar, { backgroundColor: tone.bg }]}>
            {letters ? (
              <Text style={[styles.bigAvatarText, { color: tone.fg }]}>{letters}</Text>
            ) : (
              <Icon name="person" size={56} color={tone.fg} />
            )}
          </View>
        )}
      </View>
      <View style={styles.copy}>
        {s === 'welcome' && <Text style={styles.wordmark}>CuePace</Text>}
        <Text style={styles.title}>{COPY[s].title}</Text>
        <Text style={styles.body}>{COPY[s].body}</Text>
        {s === 'name' && (
          <TextInput
            value={name}
            onChangeText={(n) => actions.updateProfile({ name: n })}
            placeholder="Your name"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            returnKeyType="done"
            autoCapitalize="words"
            onSubmitEditing={() => goTo(index + 1)}
            accessibilityLabel="Your name"
          />
        )}
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom + 16 }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.topBar}>
        {index > 0 ? (
          <Pressable onPress={() => goTo(index - 1)} hitSlop={10} accessibilityRole="button" accessibilityLabel="Back">
            <Text style={styles.topLink}>Back</Text>
          </Pressable>
        ) : (
          <View />
        )}
        {step !== 'camera' && (
          <Pressable onPress={finish} hitSlop={10} accessibilityRole="button">
            <Text style={styles.topLink}>Skip</Text>
          </Pressable>
        )}
      </View>

      <Animated.FlatList
        ref={list}
        data={STEPS}
        keyExtractor={(s) => s}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        onScroll={onScroll}
        scrollEventThrottle={16}
        onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
        renderItem={({ item }) => renderStep(item)}
      />

      <View style={styles.footer}>
        <View style={styles.dots}>
          {STEPS.map((s, i) => (
            <Dot key={s} i={i} x={x} width={width} />
          ))}
        </View>
        <Button title={primary.title} onPress={primary.onPress} style={styles.cta} />
        {step === 'camera' && !granted && (
          <Pressable onPress={finish} hitSlop={8} accessibilityRole="button" style={{ alignSelf: 'center' }}>
            <Text style={styles.notNow}>Not now</Text>
          </Pressable>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  topBar: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
  },
  topLink: { color: colors.text, fontSize: 16, fontWeight: '600' },
  artArea: { flex: 1, minHeight: 260, alignItems: 'center', justifyContent: 'center' },
  copy: { paddingHorizontal: 28, paddingBottom: 12, gap: 10 },
  wordmark: { color: colors.ink, fontSize: 20, fontWeight: '800', letterSpacing: -0.6 },
  title: { color: colors.text, fontSize: 32, lineHeight: 37, fontWeight: '800', letterSpacing: -0.8 },
  body: { color: colors.textSecondary, fontSize: 17, lineHeight: 24 },
  input: {
    marginTop: 8,
    height: 56,
    paddingHorizontal: 18,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    color: colors.text,
    fontSize: 18,
    fontWeight: '600',
  },
  bigAvatar: { width: 140, height: 140, borderRadius: 70, alignItems: 'center', justifyContent: 'center' },
  bigAvatarText: { fontSize: 52, fontWeight: '800' },
  footer: { paddingHorizontal: 24, gap: 18 },
  dots: { flexDirection: 'row', alignSelf: 'center', gap: 6 },
  dot: { height: 8, borderRadius: 4 },
  cta: { height: 56, borderRadius: radius.pill },
  notNow: { color: colors.textSecondary, fontSize: 16, fontWeight: '600' },
});

const art = StyleSheet.create({
  center: { width: 280, height: 280, alignItems: 'center', justifyContent: 'center' },
  sun: { position: 'absolute', width: 230, height: 230, borderRadius: 115, backgroundColor: colors.primary },
  card: {
    width: 200,
    padding: 18,
    gap: 12,
    borderRadius: 22,
    backgroundColor: colors.bg,
    borderWidth: 1.5,
    borderColor: colors.ink,
  },
  recRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  recDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.recording },
  recText: { color: colors.ink, fontSize: 13, fontWeight: '800', letterSpacing: 0.5 },
  eyeLine: { position: 'absolute', left: -10, right: -10, top: 66, height: 3, backgroundColor: colors.primary },
  note: {
    position: 'absolute',
    width: 150,
    padding: 14,
    gap: 10,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: colors.ink,
  },
  noteTitle: { width: '60%', height: 10, borderRadius: 5, backgroundColor: colors.ink },
  pin: {
    position: 'absolute',
    top: 34,
    right: 40,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primary,
    borderWidth: 1.5,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  phone: {
    width: 160,
    height: 270,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: colors.ink,
    backgroundColor: '#3A3A3A',
    overflow: 'hidden',
    alignItems: 'center',
  },
  lens: { position: 'absolute', top: 10, width: 12, height: 12, borderRadius: 6, backgroundColor: colors.ink, zIndex: 2 },
  phoneScript: {
    alignSelf: 'stretch',
    paddingTop: 32,
    paddingHorizontal: 14,
    paddingBottom: 14,
    gap: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
  },
  phoneEye: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  phoneEyeMark: { width: 10, height: 4, borderRadius: 2, backgroundColor: colors.primary },
  person: { position: 'absolute', bottom: -10, alignItems: 'center' },
  head: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#8A8A8A', marginBottom: 6 },
  body: { width: 110, height: 70, borderTopLeftRadius: 55, borderTopRightRadius: 55, backgroundColor: '#8A8A8A' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', width: 220, gap: 10 },
  take: { width: 105, height: 130, borderRadius: 16, backgroundColor: '#2A2A2A', borderWidth: 1.5, borderColor: colors.ink },
  latest: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: colors.primary,
  },
  latestText: { color: colors.onPrimary, fontSize: 10, fontWeight: '800' },
  heart: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  durPill: {
    position: 'absolute',
    left: 8,
    bottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  durText: { color: '#FFFFFF', fontSize: 10, fontWeight: '700' },
  permTile: {
    width: 110,
    height: 110,
    borderRadius: 28,
    backgroundColor: colors.primary,
    borderWidth: 1.5,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  check: {
    position: 'absolute',
    bottom: 50,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
