import * as Haptics from 'expo-haptics';
import { Redirect, router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, BackHandler, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { useAnimatedScrollHandler, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar } from '../components/Avatar';
import { ColorSheet } from '../components/ColorSheet';
import { Icon } from '../components/Icon';
import { ScriptGrid } from '../components/ScriptGrid';
import { EmptyState, IconButton } from '../components/ui';
import { actions, useStore, type Script } from '../lib/store';
import { colors, radius, type NoteColor } from '../lib/theme';

function newScript() {
  const id = actions.createScript();
  router.push(`/script/${id}`);
}

const HEADER_H = 56;

export default function Library() {
  const insets = useSafeAreaInsets();
  const scripts = useStore((s) => s.scripts);
  const onboarded = useStore((s) => s.profile.onboarded);
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [colorOpen, setColorOpen] = useState(false);
  const selecting = selected.size > 0;

  const closeSearch = () => {
    setQuery('');
    setSearchOpen(false);
  };

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const clearSelection = () => setSelected(new Set());

  // Android back button leaves selection mode first.
  useEffect(() => {
    if (!selecting) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      setSelected(new Set());
      return true;
    });
    return () => sub.remove();
  }, [selecting]);

  // Drop ids of scripts that were deleted elsewhere.
  const chosen = useMemo(() => scripts.filter((s) => selected.has(s.id)), [scripts, selected]);
  const allPinned = chosen.length > 0 && chosen.every((s) => s.pinned);
  const sharedColor: NoteColor | undefined = chosen.every((s) => (s.color ?? 'default') === (chosen[0]?.color ?? 'default'))
    ? (chosen[0]?.color ?? 'default')
    : undefined;

  const pin = () => {
    Haptics.selectionAsync().catch(() => {});
    actions.updateScripts([...selected], { pinned: !allPinned });
    clearSelection();
  };
  const copy = () => {
    chosen.forEach((s) => actions.duplicateScript(s.id));
    clearSelection();
  };
  const remove = () => {
    const n = chosen.length;
    Alert.alert(n === 1 ? 'Delete this script?' : `Delete ${n} scripts?`, 'Their recordings stay in Profile → Recordings.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          actions.deleteScripts([...selected]);
          clearSelection();
        },
      },
    ]);
  };
  const pickColor = (color: NoteColor) => actions.updateScripts([...selected], { color });

  // Header offset follows the scroll delta, clamped to [-HEADER_H, 0].
  const lastY = useSharedValue(0);
  const shift = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => {
    const y = Math.max(0, e.contentOffset.y);
    const dy = y - lastY.get();
    lastY.set(y);
    shift.set(Math.min(0, Math.max(-HEADER_H, shift.get() - dy)));
  });
  const pinHeader = searchOpen || selecting;
  const headerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: pinHeader ? 0 : shift.get() }],
  }));

  const { pinned, others } = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = scripts
      .filter((s) => !q || s.title.toLowerCase().includes(q) || s.body.toLowerCase().includes(q))
      .sort((a, b) => b.updatedAt - a.updatedAt);
    return { pinned: list.filter((s) => s.pinned), others: list.filter((s) => !s.pinned) };
  }, [scripts, query]);

  const empty = pinned.length === 0 && others.length === 0;
  const section = (label: string | null, list: Script[]) =>
    list.length === 0 ? null : (
      <View style={{ marginBottom: 18 }}>
        {label && <Text style={styles.sectionLabel}>{label}</Text>}
        <ScriptGrid scripts={list} selected={selected} onToggle={toggle} />
      </View>
    );

  // First launch: show onboarding before anything else.
  if (!onboarded) return <Redirect href="/onboarding" />;

  return (
    <View style={styles.root}>
      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={{
          paddingTop: insets.top + HEADER_H + 8,
          paddingHorizontal: 12,
          paddingBottom: insets.bottom + 110,
          flexGrow: 1,
        }}
      >
        {empty ? (
          <View style={{ flex: 1, paddingHorizontal: 8 }}>
            {query.trim() ? (
              <EmptyState title="No matches" body="Try another word." />
            ) : (
              <EmptyState
                title="No scripts yet"
                body="Write what you want to say, then record yourself reading it."
                action={{ title: 'Write a script', onPress: newScript }}
              />
            )}
          </View>
        ) : (
          <>
            {section(pinned.length ? 'Pinned' : null, pinned)}
            {section(pinned.length ? 'Others' : null, others)}
          </>
        )}
      </Animated.ScrollView>

      {/* Instagram-style header: slides away while scrolling down, comes back on any scroll up.
          While cards are selected it turns into the Keep-style selection bar. */}
      <Animated.View style={[styles.header, { top: insets.top }, selecting && styles.headerSelecting, headerStyle]}>
        {selecting ? (
          <View style={styles.selectBar}>
            <IconButton icon="close" label="Clear selection" plain size={22} color={colors.ink} onPress={clearSelection} />
            <Text style={styles.count}>{selected.size}</Text>
            <IconButton
              icon={allPinned ? 'pin-filled' : 'pin'}
              label={allPinned ? 'Unpin' : 'Pin'}
              plain
              size={22}
              color={colors.ink}
              onPress={pin}
            />
            <IconButton icon="palette" label="Color" plain size={22} color={colors.ink} onPress={() => setColorOpen(true)} />
            <IconButton icon="copy-outline" label="Make a copy" plain size={22} color={colors.ink} onPress={copy} />
            <IconButton icon="trash-outline" label="Delete" plain size={22} color={colors.ink} onPress={remove} />
          </View>
        ) : searchOpen ? (
          <View style={styles.searchRow}>
            <View style={styles.search}>
              <Icon name="search" size={16} color={colors.textSecondary} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search"
                placeholderTextColor={colors.textSecondary}
                style={styles.searchInput}
                returnKeyType="search"
                clearButtonMode="while-editing"
                autoFocus
                accessibilityLabel="Search your scripts"
              />
            </View>
            <Pressable onPress={closeSearch} accessibilityRole="button" hitSlop={8}>
              <Text style={styles.cancel}>Cancel</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <Text style={styles.wordmark} accessibilityRole="header">
              CuePace
            </Text>
            <View style={styles.headerIcons}>
              <IconButton
                icon="search"
                label="Search scripts"
                plain
                size={24}
                color={colors.ink}
                onPress={() => setSearchOpen(true)}
              />
              <Pressable
                onPress={() => router.push('/profile')}
                accessibilityRole="button"
                accessibilityLabel="Profile"
                hitSlop={8}
                style={({ pressed }) => [styles.avatarButton, pressed && { opacity: 0.7 }]}
              >
                <Avatar size={30} />
              </Pressable>
            </View>
          </>
        )}
      </Animated.View>
      {/* Keeps the status bar area solid while the header is hidden. */}
      <View style={[styles.statusCover, { height: insets.top }, selecting && styles.headerSelecting]} />

      {!selecting && (
        <Pressable
          onPress={newScript}
          accessibilityRole="button"
          accessibilityLabel="New script"
          style={({ pressed }) => [
            styles.fab,
            { bottom: insets.bottom + 20 },
            pressed && { transform: [{ scale: 0.94 }] },
          ]}
        >
          <Icon name="add" size={30} color={colors.onPrimary} />
        </Pressable>
      )}

      <ColorSheet
        visible={colorOpen}
        value={sharedColor}
        onPick={pickColor}
        onClose={() => {
          setColorOpen(false);
          clearSelection();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: HEADER_H,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 16,
    paddingRight: 8,
    backgroundColor: colors.bg,
  },
  headerIcons: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  avatarButton: { marginLeft: 6, marginRight: 4 },
  headerSelecting: { backgroundColor: colors.primary },
  wordmark: { color: colors.ink, fontSize: 28, fontWeight: '800', letterSpacing: -1 },
  statusCover: { position: 'absolute', top: 0, left: 0, right: 0, backgroundColor: colors.bg },
  selectBar: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: -8 },
  count: { flex: 1, color: colors.ink, fontSize: 20, fontWeight: '600', marginLeft: 6 },
  fab: {
    position: 'absolute',
    right: 20,
    width: 60,
    height: 60,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    // Thin ink outline so the yellow button reads against light cards scrolling under it.
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(10,10,10,0.2)',
  },
  sectionLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginLeft: 4,
    marginBottom: 10,
  },
  searchRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 14, paddingRight: 8 },
  search: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 38,
    paddingHorizontal: 12,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  searchInput: { flex: 1, color: colors.text, fontSize: 16, paddingVertical: 0 },
  cancel: { color: colors.text, fontSize: 16, fontWeight: '600' },
});
