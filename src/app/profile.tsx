import { router } from 'expo-router';
import { Icon, type IconName } from '../components/Icon';
import Constants from 'expo-constants';
import { useState, type ReactNode } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SettingsSheet } from '../components/SettingsSheet';
import { deleteRecording } from '../lib/recordings';
import { actions, formatDuration, getState, initials, useStore } from '../lib/store';
import { avatarColor, colors, radius } from '../lib/theme';

function deleteAll() {
  const count = getState().recordings.length;
  if (count === 0) return;
  Alert.alert(
    `Delete all ${count} recordings?`,
    'The videos are removed from CuePace. Copies already in Photos are kept.',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete all',
        style: 'destructive',
        onPress: () => getState().recordings.forEach(deleteRecording),
      },
    ],
  );
}

export default function Profile() {
  const insets = useSafeAreaInsets();
  const profile = useStore((s) => s.profile);
  const settings = useStore((s) => s.settings);
  const scripts = useStore((s) => s.scripts);
  const recordings = useStore((s) => s.recordings);
  const [showSettings, setShowSettings] = useState(false);
  const [editingName, setEditingName] = useState(false);

  const totalSecs = recordings.reduce((sum, r) => sum + r.duration, 0);
  const letters = initials(profile.name);
  const tone = avatarColor(profile.name.trim().toLowerCase());

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: insets.bottom + 40, gap: 28 }}
      keyboardShouldPersistTaps="handled"
    >
      {/* Who you are */}
      <View style={styles.identity}>
        <View style={[styles.avatar, { backgroundColor: tone.bg }]}>
          {letters ? (
            <Text style={[styles.avatarText, { color: tone.fg }]}>{letters}</Text>
          ) : (
            <Icon name="person" size={28} color={tone.fg} />
          )}
        </View>
        {editingName ? (
          <>
            <TextInput
              value={profile.name}
              onChangeText={(name) => actions.updateProfile({ name })}
              placeholder="Your name"
              placeholderTextColor={colors.textMuted}
              style={styles.nameInput}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={() => setEditingName(false)}
              onBlur={() => setEditingName(false)}
              accessibilityLabel="Your name"
            />
            <Pressable onPress={() => setEditingName(false)} accessibilityRole="button" hitSlop={8}>
              <Text style={styles.done}>Done</Text>
            </Pressable>
          </>
        ) : (
          <Pressable
            onPress={() => setEditingName(true)}
            accessibilityRole="button"
            accessibilityLabel="Edit your name"
            style={({ pressed }) => [styles.identityText, pressed && { opacity: 0.6 }]}
          >
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={[styles.name, !profile.name && { color: colors.textSecondary }]} numberOfLines={1}>
                {profile.name || 'Add your name'}
              </Text>
              <Text style={styles.edit}>Edit name</Text>
            </View>
            <Icon name="chevron-forward" size={16} color={colors.textSecondary} />
          </Pressable>
        )}
      </View>

      {/* Your numbers */}
      <View style={styles.stats}>
        <Stat value={String(scripts.length)} label={scripts.length === 1 ? 'Script' : 'Scripts'} />
        <Stat value={String(recordings.length)} label={recordings.length === 1 ? 'Take' : 'Takes'} />
        <Stat value={formatDuration(totalSecs)} label="Recorded" />
      </View>

      <Section title="Library">
        <Item
          icon="videocam-outline"
          label="Recordings"
          detail={recordings.length === 1 ? '1 take' : `${recordings.length} takes`}
          onPress={() => router.push('/recordings')}
        />
        <Item
          icon="heart-outline"
          label="Liked videos"
          detail={`${recordings.filter((r) => r.liked).length} liked`}
          onPress={() => router.push('/liked')}
          last
        />
      </Section>

      <Section title="Recording">
        <Item icon="images-outline" label="Save to Photos" detail="Keep a copy of every new take">
          <Switch
            value={profile.saveToPhotos}
            onValueChange={(saveToPhotos) => actions.updateProfile({ saveToPhotos })}
            trackColor={{ true: colors.primary, false: colors.surfaceRaised }}
            thumbColor="#FFFFFF"
          />
        </Item>
        <Item
          icon="options-outline"
          label="Prompter"
          detail={`Speed ${settings.speed} · ${settings.fontSize}pt text`}
          onPress={() => setShowSettings(true)}
          last
        />
      </Section>

      <Section title="Privacy & storage">
        <Item
          icon="replay"
          label="Replay intro"
          detail="See the welcome tour again"
          onPress={() => {
            actions.updateProfile({ onboarded: false });
            router.replace('/onboarding');
          }}
        />
        <Item
          icon="shield-checkmark-outline"
          label="On-device only"
          detail="Scripts and videos never leave this phone"
        />
        <Item
          icon="trash-outline"
          label="Delete all recordings"
          detail={recordings.length ? `${recordings.length} in CuePace` : 'Nothing to delete'}
          onPress={recordings.length ? deleteAll : undefined}
          danger
          last
        />
      </Section>

      <Text style={styles.footer}>CuePace {Constants.expoConfig?.version ?? '1.0.0'}</Text>

      <SettingsSheet visible={showSettings} onClose={() => setShowSettings(false)} settings={settings} cameraMode />
    </ScrollView>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={{ gap: 4 }}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Item({
  icon,
  label,
  detail,
  onPress,
  danger,
  last,
  children,
}: {
  icon: IconName;
  label: string;
  detail?: string;
  onPress?: () => void;
  danger?: boolean;
  last?: boolean;
  children?: ReactNode;
}) {
  const tint = danger ? colors.danger : colors.text;
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      style={({ pressed }) => [styles.item, pressed && { opacity: 0.6 }]}
    >
      <View style={styles.itemIcon}>
        <Icon name={icon} size={20} color={tint} />
      </View>
      <View style={[styles.itemBody, !last && styles.itemDivider]}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={[styles.itemLabel, danger && { color: colors.danger }]}>{label}</Text>
          {detail !== undefined && <Text style={styles.itemDetail}>{detail}</Text>}
        </View>
        {children}
        {onPress && !children && <Icon name="chevron-forward" size={14} color={colors.textMuted} />}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  identity: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.onInk, fontSize: 24, fontWeight: '700' },
  identityText: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  name: { color: colors.text, fontSize: 22, fontWeight: '700', letterSpacing: -0.3 },
  edit: { color: colors.textSecondary, fontSize: 14, fontWeight: '500', textDecorationLine: 'underline' },
  nameInput: {
    flex: 1,
    color: colors.text,
    fontSize: 22,
    fontWeight: '700',
    paddingVertical: 6,
    borderBottomWidth: 2,
    borderBottomColor: colors.ink,
  },
  done: { color: colors.text, fontSize: 16, fontWeight: '600' },
  stats: { flexDirection: 'row', gap: 10 },
  stat: { flex: 1, padding: 16, gap: 4, borderRadius: radius.lg, backgroundColor: colors.surface },
  statValue: { color: colors.text, fontSize: 24, fontWeight: '700', fontVariant: ['tabular-nums'] },
  statLabel: { color: colors.textSecondary, fontSize: 13, fontWeight: '500' },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: '600', marginBottom: 6 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  itemIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemBody: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 64, paddingVertical: 12 },
  itemDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  itemLabel: { color: colors.text, fontSize: 16, fontWeight: '500' },
  itemDetail: { color: colors.textSecondary, fontSize: 14 },
  footer: { color: colors.textMuted, fontSize: 13, textAlign: 'center' },
});
