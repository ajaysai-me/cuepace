import { Modal, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { actions, DEFAULT_SETTINGS, LIMITS, type Settings } from '../lib/store';
import { colors, radius } from '../lib/theme';
import { Button, IconButton, Row, Segmented, Stepper } from './ui';

export function SettingsSheet({
  visible,
  onClose,
  settings,
  cameraMode,
}: {
  visible: boolean;
  onClose: () => void;
  settings: Settings;
  /** Hide options that make no sense over the camera (mirroring, colors). */
  cameraMode?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const set = actions.updateSettings;
  const toggle = (value: boolean, onChange: (v: boolean) => void) => (
    <Switch
      value={value}
      onValueChange={onChange}
      trackColor={{ true: colors.primary, false: colors.surfaceRaised }}
      thumbColor="#FFFFFF"
    />
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} supportedOrientations={['portrait', 'landscape']}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close settings" />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.header}>
          <IconButton icon="close" label="Close" plain onPress={onClose} style={styles.close} />
          <Text style={styles.title}>Prompter settings</Text>
        </View>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 24 }}>
          <Row label="Scroll speed">
            <Stepper label="Speed" value={settings.speed} {...LIMITS.speed} onChange={(speed) => set({ speed })} />
          </Row>
          <Row label="Text size">
            <Stepper
              label="Points"
              value={settings.fontSize}
              {...LIMITS.fontSize}
              onChange={(fontSize) => set({ fontSize })}
            />
          </Row>
          <Row label="Side margins">
            <Stepper
              label="Percent"
              value={settings.margin}
              display={`${settings.margin}%`}
              {...LIMITS.margin}
              onChange={(margin) => set({ margin })}
            />
          </Row>
          <Row label="Countdown">
            <Segmented
              value={settings.countdown}
              onChange={(countdown) => set({ countdown })}
              options={[
                { label: 'Off', value: 0 },
                { label: '3s', value: 3 },
                { label: '5s', value: 5 },
                { label: '10s', value: 10 },
              ]}
            />
          </Row>
          <Row label="Alignment">
            <Segmented
              value={settings.align}
              onChange={(align) => set({ align })}
              options={[
                { label: 'Left', value: 'left' },
                { label: 'Center', value: 'center' },
              ]}
            />
          </Row>
          <Row label="Eye-line marker">{toggle(settings.cueLine, (cueLine) => set({ cueLine }))}</Row>
          {cameraMode && (
            <>
              <Row label="Eye-line position">
                <Stepper
                  label="Eye-line position"
                  value={settings.cuePosition}
                  display={`${settings.cuePosition}%`}
                  {...LIMITS.cuePosition}
                  onChange={(cuePosition) => set({ cuePosition })}
                />
              </Row>
              <Row label="Overlay opacity">
                <Stepper
                  label="Overlay opacity"
                  value={settings.overlayOpacity}
                  display={`${settings.overlayOpacity}%`}
                  {...LIMITS.overlayOpacity}
                  onChange={(overlayOpacity) => set({ overlayOpacity })}
                />
              </Row>
            </>
          )}
          {!cameraMode && (
            <>
              <Row label="Colors">
                <Segmented
                  value={settings.theme}
                  onChange={(theme) => set({ theme })}
                  options={[
                    { label: 'Dark', value: 'dark' },
                    { label: 'Light', value: 'light' },
                    { label: 'Yellow', value: 'contrast' },
                  ]}
                />
              </Row>
              <Row label="Mirror horizontally (for glass rigs)">
                {toggle(settings.mirrorH, (mirrorH) => set({ mirrorH }))}
              </Row>
              <Row label="Flip vertically">{toggle(settings.mirrorV, (mirrorV) => set({ mirrorV }))}</Row>
            </>
          )}
        </ScrollView>
        <View style={styles.footer}>
          <Pressable onPress={() => set(DEFAULT_SETTINGS)} accessibilityRole="button" hitSlop={8}>
            <Text style={styles.reset}>Reset</Text>
          </Pressable>
          <Button title="Done" onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(10,10,10,0.4)' },
  sheet: {
    maxHeight: '85%',
    backgroundColor: colors.bg,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
  },
  header: {
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  close: { position: 'absolute', left: 12 },
  title: { color: colors.text, fontSize: 16, fontWeight: '700' },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  reset: { color: colors.text, fontSize: 16, fontWeight: '600', textDecorationLine: 'underline' },
});
