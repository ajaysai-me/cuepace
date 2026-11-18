import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { useKeepAwake } from 'expo-keep-awake';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Linking, PanResponder, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Prompter, type PrompterHandle } from '../../components/Prompter';
import { SettingsSheet } from '../../components/SettingsSheet';
import { Button, IconButton, RecordButton } from '../../components/ui';
import { keepRecording } from '../../lib/recordings';
import { formatDuration, getState, useStore } from '../../lib/store';
import { colors, radius } from '../../lib/theme';

export default function RecordScreen() {
  useKeepAwake();
  const { id } = useLocalSearchParams<{ id: string }>();
  const script = useStore((s) => s.scripts.find((x) => x.id === id));
  const settings = useStore((s) => s.settings);
  const insets = useSafeAreaInsets();

  const [camPerm, requestCam] = useCameraPermissions();
  const [micPerm, requestMic] = useMicrophonePermissions();

  const camera = useRef<CameraView>(null);
  const prompter = useRef<PrompterHandle>(null);
  const [ready, setReady] = useState(false);
  const [recording, setRecording] = useState(false);
  const [saving, setSaving] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [showSettings, setShowSettings] = useState(false);

  // The script panel can be resized by dragging its bottom handle.
  const { height: screenH } = useWindowDimensions();
  const panelH = useSharedValue(screenH * 0.4);
  const dragStartH = useSharedValue(0);
  const resize = useMemo(() => {
    const min = screenH * 0.28; // room for the top row plus a few lines of script
    const max = screenH * 0.75;
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        dragStartH.set(panelH.get());
      },
      onPanResponderMove: (_, g) => {
        panelH.set(Math.min(max, Math.max(min, dragStartH.get() + g.dy)));
      },
    });
  }, [screenH, panelH, dragStartH]);
  const panelStyle = useAnimatedStyle(() => ({ height: panelH.get() }));

  useEffect(() => {
    if (!recording) return;
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, [recording]);

  if (!camPerm || !micPerm) {
    return <View style={styles.center}><ActivityIndicator color={colors.text} /></View>;
  }

  if (!camPerm.granted || !micPerm.granted) {
    const blocked = (!camPerm.granted && !camPerm.canAskAgain) || (!micPerm.granted && !micPerm.canAskAgain);
    return (
      <View style={[styles.center, { padding: 32, gap: 16 }]}>
        <Text style={styles.permTitle}>Camera and microphone</Text>
        <Text style={styles.permBody}>
          CuePace needs both to record you while your script scrolls under the lens. Videos stay on your phone.
        </Text>
        <Button
          title={blocked ? 'Open Settings' : 'Allow access'}
          onPress={async () => {
            if (blocked) return Linking.openSettings();
            if (!camPerm.granted) await requestCam();
            if (!micPerm.granted) await requestMic();
          }}
        />
        <Button title="Not now" variant="secondary" onPress={() => router.back()} />
      </View>
    );
  }

  const keep = async (tempUri: string, duration: number) => {
    setSaving(true);
    try {
      const recId = await keepRecording({
        tempUri,
        scriptId: id,
        scriptTitle: script?.title || 'Untitled script',
        duration,
      });
      const inPhotos = getState().recordings.find((r) => r.id === recId)?.savedToPhotos;
      Alert.alert('Take saved', inPhotos ? 'Saved to this script and your photo library.' : 'Saved to this script.', [
        { text: 'Record again', style: 'cancel' },
        { text: 'View takes', onPress: () => router.replace(`/takes/${id}`) },
      ]);
    } catch (e) {
      Alert.alert('Could not save the video', String(e));
    } finally {
      setSaving(false);
    }
  };

  const start = async () => {
    if (!camera.current || !ready || recording) return;
    setElapsed(0);
    setRecording(true);
    const startedAt = Date.now();
    prompter.current?.restart();
    prompter.current?.play();
    try {
      // Resolves when stopRecording() is called.
      const result = await camera.current.recordAsync();
      if (result?.uri) await keep(result.uri, (Date.now() - startedAt) / 1000);
    } catch (e) {
      Alert.alert('Recording failed', String(e));
    } finally {
      setRecording(false);
      prompter.current?.pause();
    }
  };

  const stop = () => {
    camera.current?.stopRecording();
  };

  return (
    <View style={styles.root}>
      <StatusBar hidden />
      <CameraView
        ref={camera}
        style={StyleSheet.absoluteFill}
        facing="front"
        mode="video"
        mirror
        onCameraReady={() => setReady(true)}
      />

      {/* Script sits at the top, right under the front camera, so your eyes stay near the lens. */}
      <Animated.View
        style={[
          styles.panel,
          { paddingTop: insets.top, backgroundColor: `rgba(0,0,0,${settings.overlayOpacity / 100})` },
          panelStyle,
        ]}
      >
        {/* Top row: close · title (or REC timer) · settings */}
        <View style={styles.topRow}>
          {recording ? (
            <View style={styles.rec}>
              <View style={styles.dot} />
              <Text style={styles.recText}>REC</Text>
              <Text style={styles.timerText}>{formatDuration(elapsed)}</Text>
            </View>
          ) : (
            <IconButton icon="close" label="Close camera" plain size={22} color="#FFFFFF" onPress={() => router.back()} />
          )}
          {!recording && (
            <Text style={styles.title} numberOfLines={1}>
              {script?.title || 'Untitled script'}
            </Text>
          )}
          {recording ? (
            <View style={{ flex: 1 }} />
          ) : (
            <IconButton
              icon="options-outline"
              label="Prompter settings"
              plain
              size={22}
              color="#FFFFFF"
              onPress={() => setShowSettings(true)}
            />
          )}
        </View>
        <Prompter ref={prompter} compact text={script?.body ?? ''} settings={settings} />
        <View
          {...resize.panHandlers}
          style={styles.handleZone}
          accessibilityLabel="Drag to resize the script area"
          hitSlop={{ top: 8, bottom: 16 }}
        >
          <View style={styles.handle} />
        </View>
      </Animated.View>

      {/* Camera-app style: one big shutter, centred, with a short hint under it. */}
      <View style={[styles.bottom, { paddingBottom: insets.bottom + 20 }]}>
        <RecordButton recording={recording} onPress={recording ? stop : start} disabled={!ready || saving} size={78} />
        <Text style={styles.hint}>
          {recording ? 'Tap to stop' : ready ? 'Tap to record · script starts from the top' : 'Starting camera…'}
        </Text>
      </View>

      {saving && (
        <View style={styles.saving}>
          <ActivityIndicator color="#FFFFFF" size="large" />
          <Text style={styles.timerText}>Saving…</Text>
        </View>
      )}

      <SettingsSheet visible={showSettings} onClose={() => setShowSettings(false)} settings={settings} cameraMode />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  permTitle: { color: colors.text, fontSize: 26, fontWeight: '700', textAlign: 'center' },
  permBody: { color: colors.textMuted, fontSize: 16, lineHeight: 22, textAlign: 'center', marginBottom: 8 },
  panel: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
    overflow: 'hidden',
    paddingBottom: 28,
  },
  handleZone: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  handle: { width: 44, height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.55)' },
  topRow: { flexDirection: 'row', alignItems: 'center', height: 48, paddingHorizontal: 8, gap: 4 },
  title: { flex: 1, color: '#FFFFFF', fontSize: 15, fontWeight: '600', textAlign: 'center' },
  rec: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginLeft: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(224,73,42,0.22)',
  },
  recText: { color: colors.recording, fontSize: 13, fontWeight: '800', letterSpacing: 1 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.recording },
  timerText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', fontVariant: ['tabular-nums'] },
  bottom: { position: 'absolute', left: 0, right: 0, bottom: 0, alignItems: 'center', gap: 12 },
  hint: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowRadius: 6,
    textShadowOffset: { width: 0, height: 1 },
  },
  saving: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
});
