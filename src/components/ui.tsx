import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, radius } from '../lib/theme';
import { Icon, type IconName } from './Icon';

export type { IconName };

/** Round icon button: white with a hairline ring, or plain for bars. */
export function IconButton({
  icon,
  onPress,
  size = 20,
  active,
  label,
  style,
  color,
  disabled,
  plain,
}: {
  icon: IconName;
  onPress: () => void;
  size?: number;
  active?: boolean;
  label: string;
  style?: StyleProp<ViewStyle>;
  color?: string;
  disabled?: boolean;
  /** No ring or fill: for buttons inside a bar. */
  plain?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active, disabled }}
      onPress={onPress}
      disabled={disabled}
      hitSlop={6}
      style={({ pressed }) => [
        styles.iconButton,
        plain && styles.iconButtonPlain,
        active && styles.iconButtonActive,
        pressed && { transform: [{ scale: 0.94 }] },
        disabled && { opacity: 0.3 },
        style,
      ]}
    >
      <Icon name={icon} size={size} color={color ?? (active ? colors.onInk : colors.text)} />
    </Pressable>
  );
}

/** Round outlined − value + stepper. */
export function Stepper({
  label,
  value,
  display,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  display?: string;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  const clamp = (v: number) => Math.min(max, Math.max(min, v));
  return (
    <View style={styles.stepper}>
      <IconButton
        icon="remove"
        label={`Decrease ${label}`}
        size={16}
        onPress={() => onChange(clamp(value - step))}
        disabled={value <= min}
        style={styles.stepperButton}
        color={colors.textSecondary}
      />
      <Text style={styles.stepperValue}>{display ?? value}</Text>
      <IconButton
        icon="add"
        label={`Increase ${label}`}
        size={16}
        onPress={() => onChange(clamp(value + step))}
        disabled={value >= max}
        style={styles.stepperButton}
        color={colors.textSecondary}
      />
    </View>
  );
}

/**
 * "primary" is solid brand yellow with ink text; "dark" is solid ink; "destructive" is solid red;
 * "secondary" is outlined; "danger" is outlined red.
 */
export function Button({
  title,
  icon,
  onPress,
  variant = 'primary',
  style,
}: {
  title: string;
  icon?: IconName;
  onPress: () => void;
  variant?: 'primary' | 'dark' | 'destructive' | 'secondary' | 'danger';
  style?: StyleProp<ViewStyle>;
}) {
  const filled = variant === 'primary' || variant === 'dark' || variant === 'destructive';
  const fg =
    variant === 'primary'
      ? colors.onPrimary
      : filled
        ? colors.onInk
        : variant === 'danger'
          ? colors.danger
          : colors.text;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        variant === 'primary' && { backgroundColor: colors.primary },
        variant === 'dark' && { backgroundColor: colors.ink },
        variant === 'destructive' && { backgroundColor: colors.danger },
        !filled && styles.buttonOutline,
        variant === 'danger' && { borderColor: colors.danger },
        pressed && { transform: [{ scale: 0.98 }], opacity: 0.9 },
        style,
      ]}
    >
      {icon && <Icon name={icon} size={18} color={fg} />}
      <Text style={[styles.buttonText, { color: fg }]}>{title}</Text>
    </Pressable>
  );
}

/** Row of pill choices; the selected one is filled ink. */
export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: T }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View style={styles.segmented}>
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <Pressable
            key={String(o.value)}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => onChange(o.value)}
            style={[styles.segment, selected && styles.segmentSelected]}
          >
            <Text style={[styles.segmentText, selected && { color: colors.onPrimary, fontWeight: '700' }]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      {children}
    </View>
  );
}

/** Large bold page title that scrolls away with the content (tab screens). */
export function ScreenTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={styles.screenTitle}>
      <Text style={styles.screenTitleText} accessibilityRole="header">
        {title}
      </Text>
      {subtitle ? <Text style={styles.screenSubtitle}>{subtitle}</Text> : null}
    </View>
  );
}

/** Small pill badge, e.g. "3 takes" on a cover. */
export function Badge({ children, tone = 'light' }: { children: ReactNode; tone?: 'light' | 'highlight' }) {
  return (
    <View style={[styles.badge, tone === 'highlight' && { backgroundColor: colors.highlight }]}>
      <Text style={styles.badgeText}>{children}</Text>
    </View>
  );
}

/** Friendly empty state: bold headline, short body, optional action. */
export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: { title: string; onPress: () => void };
}) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyBody}>{body}</Text>
      {action && (
        <Button title={action.title} onPress={action.onPress} style={{ alignSelf: 'flex-start' }} />
      )}
    </View>
  );
}

/* ---- Camera screen pieces ---- */

/** Floating translucent pill that holds a row of controls over the camera. */
export function GlassBar({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.glassBar, style]}>{children}</View>;
}

/** Big round record/stop button. */
export function RecordButton({
  recording,
  onPress,
  disabled,
  size = 72,
}: {
  recording: boolean;
  onPress: () => void;
  disabled?: boolean;
  size?: number;
}) {
  const inner = recording ? size * 0.38 : size - 14;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={recording ? 'Stop recording' : 'Start recording'}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.recordRing,
        { width: size, height: size, borderRadius: size / 2 },
        pressed && { transform: [{ scale: 0.95 }] },
        disabled && { opacity: 0.4 },
      ]}
    >
      <View
        style={{
          width: inner,
          height: inner,
          borderRadius: recording ? 6 : inner / 2,
          backgroundColor: colors.recording,
        }}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
  },
  iconButtonPlain: { borderWidth: 0, backgroundColor: 'transparent' },
  iconButtonActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepperButton: { width: 32, height: 32 },
  stepperValue: { minWidth: 32, textAlign: 'center', color: colors.text, fontSize: 16, fontVariant: ['tabular-nums'] },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 50,
    paddingHorizontal: 24,
    borderRadius: radius.sm,
  },
  buttonOutline: { backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.ink },
  buttonText: { fontSize: 16, fontWeight: '600' },
  segmented: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  segment: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
  },
  segmentSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  segmentText: { color: colors.text, fontSize: 14, fontWeight: '500' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowLabel: { color: colors.text, fontSize: 16, flexShrink: 1 },
  screenTitle: { paddingTop: 12, paddingBottom: 8, gap: 4 },
  screenTitleText: { color: colors.text, fontSize: 32, fontWeight: '700', letterSpacing: -0.6 },
  screenSubtitle: { color: colors.textSecondary, fontSize: 15 },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: colors.bg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
  },
  badgeText: { color: colors.text, fontSize: 12, fontWeight: '600' },
  empty: {
    flex: 1,
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 48,
  },
  emptyTitle: { color: colors.text, fontSize: 22, fontWeight: '600' },
  emptyBody: { color: colors.textSecondary, fontSize: 16, lineHeight: 22, marginBottom: 10 },
  glassBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.glass,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
  },
  recordRing: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
