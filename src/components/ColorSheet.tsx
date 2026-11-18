import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, noteColors, radius, type NoteColor } from '../lib/theme';
import { Icon } from './Icon';
import { IconButton } from './ui';

/** Keep-style colour picker: a row of swatches; the current colour is ringed and ticked. */
export function ColorSheet({
  visible,
  value,
  onPick,
  onClose,
}: {
  visible: boolean;
  /** The shared colour of the selection, or undefined if they differ. */
  value: NoteColor | undefined;
  onPick: (c: NoteColor) => void;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close" />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.header}>
          <IconButton icon="close" label="Close" plain size={18} onPress={onClose} style={styles.close} />
          <Text style={styles.heading}>Color</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
          {(Object.keys(noteColors) as NoteColor[]).map((key) => {
            const selected = value === key;
            return (
              // The ring sits outside the swatch so it shows against every colour, even ink.
              <View key={key} style={[styles.ring, selected && styles.ringSelected]}>
                <Pressable
                  onPress={() => onPick(key)}
                  accessibilityRole="button"
                  accessibilityLabel={noteColors[key].label}
                  accessibilityState={{ selected }}
                  style={({ pressed }) => [
                    styles.swatch,
                    { backgroundColor: noteColors[key].bg },
                    pressed && { transform: [{ scale: 0.92 }] },
                  ]}
                >
                  {selected ? (
                    <Icon name="checkmark" size={20} color={noteColors[key].fg} />
                  ) : key === 'default' ? (
                    <Icon name="no-color" size={20} color={colors.textSecondary} />
                  ) : null}
                </Pressable>
              </View>
            );
          })}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(10,10,10,0.4)' },
  sheet: { backgroundColor: colors.bg, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl },
  header: {
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  close: { position: 'absolute', left: 12 },
  heading: { color: colors.text, fontSize: 16, fontWeight: '700' },
  row: { gap: 8, paddingHorizontal: 16, paddingTop: 16 },
  ring: { padding: 3, borderRadius: 30, borderWidth: 2, borderColor: 'transparent' },
  ringSelected: { borderColor: colors.ink },
  swatch: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
