import { Icon } from '../../components/Icon';
import { router, Stack, useLocalSearchParams, useNavigation, type NativeStackNavigationProp } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconButton } from '../../components/ui';
import { actions, getState, readingTime, useStore, wordCount } from '../../lib/store';
import { colors } from '../../lib/theme';

/** "3:40 PM" for today, otherwise "Nov 18". */
function editedLabel(ts: number) {
  const d = new Date(ts);
  return d.toDateString() === new Date().toDateString()
    ? d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    : d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export default function Editor() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const script = useStore((s) => s.scripts.find((x) => x.id === id));
  const recordings = useStore((s) => s.recordings);
  const takes = useMemo(() => recordings.filter((r) => r.scriptId === id), [recordings, id]);
  const insets = useSafeAreaInsets();
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  useEffect(() => {
    const show = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', () =>
      setKeyboardOpen(true),
    );
    const hide = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () =>
      setKeyboardOpen(false),
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  const navigation = useNavigation<NativeStackNavigationProp<Record<string, object | undefined>>>();

  // Going back from a script that was never written in (no title, no text, no takes) discards it.
  // 'removed' fires after the screen is gone, so effect cleanup must defer unsubscribing.
  useEffect(() => {
    const unsubscribe = navigation.addListener('removed', () => {
      const { scripts, recordings: takesNow } = getState();
      const s = scripts.find((x) => x.id === id);
      const hasTakes = takesNow.some((r) => r.scriptId === id);
      if (s && !s.title.trim() && !s.body.trim() && !hasTakes) actions.deleteScript(id);
    });
    return () => queueMicrotask(unsubscribe);
  }, [navigation, id]);

  if (!script) {
    return (
      <View style={[styles.root, { alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ color: colors.textMuted }}>This script was deleted.</Text>
      </View>
    );
  }

  const remove = () =>
    Alert.alert('Delete script?', takes.length ? 'Its recordings stay in Profile → Recordings.' : 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          router.back();
          actions.deleteScript(script.id);
        },
      },
    ]);

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
      <Stack.Screen
        options={{
          headerRight: () => (
            <View style={styles.headerIcons}>
              {takes.length > 0 && (
                <Pressable
                  onPress={() => router.push(`/takes/${script.id}`)}
                  accessibilityRole="button"
                  accessibilityLabel={`View ${takes.length} takes`}
                  hitSlop={8}
                  style={({ pressed }) => [styles.takesButton, pressed && { opacity: 0.55 }]}
                >
                  <Icon name="takes" size={22} color={colors.ink} />
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{takes.length > 99 ? '99+' : takes.length}</Text>
                  </View>
                </Pressable>
              )}
              <IconButton icon="trash-outline" label="Delete script" plain size={22} color={colors.ink} onPress={remove} />
            </View>
          ),
        }}
      />
      {/* Title and text scroll together; only the Record bar stays put. */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >
        <TextInput
          value={script.title}
          onChangeText={(title) => actions.updateScript(script.id, { title })}
          placeholder="Title"
          placeholderTextColor={colors.textMuted}
          style={styles.title}
          returnKeyType="next"
        />
        <Text style={styles.meta}>
          {wordCount(script.body)} words · {readingTime(script.body)} read · Edited {editedLabel(script.updatedAt)}
        </Text>
        <TextInput
          value={script.body}
          onChangeText={(body) => actions.updateScript(script.id, { body })}
          placeholder="Write or paste your script here…"
          placeholderTextColor={colors.textMuted}
          style={styles.body}
          multiline
          scrollEnabled={false}
          textAlignVertical="top"
          autoFocus={!script.body}
        />
      </ScrollView>
      {/* Floating record capsule; tucked away while typing so the keyboard area stays clear. */}
      {!keyboardOpen && (
        <Pressable
          onPress={() => router.push(`/record/${script.id}`)}
          accessibilityRole="button"
          accessibilityLabel={`Record, about ${readingTime(script.body)}`}
          style={({ pressed }) => [
            styles.record,
            { bottom: insets.bottom + 20 },
            pressed && { transform: [{ scale: 0.96 }] },
          ]}
        >
          <View style={styles.recDot} />
          <Text style={styles.recordText}>Record</Text>
          <Text style={styles.recordTime}>· {readingTime(script.body)}</Text>
        </Pressable>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 8,
  },
  body: { minHeight: 320, color: colors.text, fontSize: 18, lineHeight: 28, paddingHorizontal: 20, paddingTop: 8 },
  meta: { color: colors.textSecondary, fontSize: 13, paddingHorizontal: 20, marginTop: -2, marginBottom: 4 },
  record: {
    position: 'absolute',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 56,
    paddingHorizontal: 26,
    borderRadius: 999,
    backgroundColor: colors.primary,
    // Thin outline so the yellow reads against white paper.
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(10,10,10,0.2)',
  },
  recDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.recording },
  recordText: { color: colors.onPrimary, fontSize: 17, fontWeight: '700' },
  recordTime: { color: 'rgba(10,10,10,0.6)', fontSize: 15, fontWeight: '600', fontVariant: ['tabular-nums'] },
  headerIcons: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  takesButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  badge: {
    position: 'absolute',
    top: 2,
    right: 0,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: colors.primary,
    borderWidth: 1.5,
    borderColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: colors.onPrimary, fontSize: 10, fontWeight: '800' },
});
