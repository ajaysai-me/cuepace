import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius } from '../lib/theme';
import { Icon, type IconName } from './Icon';
import { Button, IconButton } from './ui';

export type SheetAction = {
  label: string;
  icon: IconName;
  onPress: () => void;
  /** Shown as a red underlined link under the grid instead of a tile. */
  destructive?: boolean;
  /** Ask again inside the sheet before running onPress. */
  confirm?: { title: string; message: string; confirmLabel: string };
};

/**
 * Options modal for a long-pressed item: close button and centred heading,
 * a preview of the item, a two-column grid of outlined action tiles, and a
 * destructive link underneath.
 */
export function ActionSheet({
  visible,
  heading,
  icon,
  title,
  subtitle,
  actions,
  onClose,
}: {
  visible: boolean;
  /** Centred header text, e.g. "Script options". */
  heading: string;
  /** Icon on the preview tile. */
  icon: IconName;
  title: string;
  subtitle?: string;
  actions: SheetAction[];
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [pending, setPending] = useState<SheetAction | null>(null);

  const close = () => {
    setPending(null);
    onClose();
  };

  const run = (a: SheetAction) => {
    if (a.confirm && !pending) {
      setPending(a);
      return;
    }
    close();
    a.onPress();
  };

  const tiles = actions.filter((a) => !a.destructive);
  const destructive = actions.filter((a) => a.destructive);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <Pressable style={styles.backdrop} onPress={close} accessibilityLabel="Close" />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 12 }]}>
        <View style={styles.header}>
          <IconButton
            icon="close"
            label="Close"
            plain
            size={18}
            onPress={pending ? () => setPending(null) : close}
            style={styles.close}
          />
          <Text style={styles.heading}>{heading}</Text>
        </View>

        {pending?.confirm ? (
          <>
            <View style={styles.confirm}>
              <Text style={styles.confirmTitle}>{pending.confirm.title}</Text>
              <Text style={styles.confirmBody}>{pending.confirm.message}</Text>
            </View>
            <View style={styles.footer}>
              <Pressable onPress={() => setPending(null)} accessibilityRole="button" hitSlop={8}>
                <Text style={styles.cancel}>Cancel</Text>
              </Pressable>
              <Button
                title={pending.confirm.confirmLabel}
                variant="destructive"
                onPress={() => run(pending)}
              />
            </View>
          </>
        ) : (
          <>
            <View style={styles.preview}>
              <View style={styles.previewTile}>
                <Icon name={icon} size={24} color={colors.text} />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={styles.previewTitle} numberOfLines={1}>
                  {title}
                </Text>
                {subtitle ? (
                  <Text style={styles.previewSub} numberOfLines={1}>
                    {subtitle}
                  </Text>
                ) : null}
              </View>
            </View>

            <View style={styles.grid}>
              {tiles.map((a) => (
                <Pressable
                  key={a.label}
                  onPress={() => run(a)}
                  accessibilityRole="button"
                  style={({ pressed }) => [styles.tile, pressed && styles.tilePressed]}
                >
                  <Icon name={a.icon} size={22} color={colors.text} />
                  <Text style={styles.tileLabel} numberOfLines={1}>
                    {a.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {destructive.map((a) => (
              <Pressable
                key={a.label}
                onPress={() => run(a)}
                accessibilityRole="button"
                hitSlop={8}
                style={styles.dangerLink}
              >
                <Text style={styles.danger}>{a.label}</Text>
              </Pressable>
            ))}
          </>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(10,10,10,0.4)' },
  sheet: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
  },
  header: {
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  close: { position: 'absolute', left: 12 },
  heading: { color: colors.text, fontSize: 16, fontWeight: '700' },
  preview: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 24, paddingTop: 24 },
  previewTile: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewTitle: { color: colors.text, fontSize: 16, fontWeight: '600' },
  previewSub: { color: colors.textSecondary, fontSize: 14 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: 24, paddingTop: 24 },
  tile: {
    // Two per row: half the width minus half the gap.
    flexBasis: '47%',
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    height: 64,
    paddingHorizontal: 16,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  tilePressed: { backgroundColor: colors.primarySoft, borderColor: colors.ink },
  tileLabel: { flex: 1, color: colors.text, fontSize: 15, fontWeight: '600' },
  dangerLink: { alignSelf: 'center', paddingTop: 24, paddingBottom: 8 },
  danger: { color: colors.danger, fontSize: 16, fontWeight: '600', textDecorationLine: 'underline' },
  confirm: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 28, gap: 10 },
  confirmTitle: { color: colors.text, fontSize: 22, fontWeight: '700', letterSpacing: -0.3 },
  confirmBody: { color: colors.textSecondary, fontSize: 16, lineHeight: 22 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  cancel: { color: colors.text, fontSize: 16, fontWeight: '600', textDecorationLine: 'underline' },
});
