import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolView, type SFSymbol } from 'expo-symbols';
import { Platform, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

/**
 * Platform-standard icons: SF Symbols on iOS, Material Symbols on Android/web.
 * Add a name here before using it, so every icon has both platform versions.
 */
const ICONS = {
  add: { ios: 'plus', android: 'add' },
  remove: { ios: 'minus', android: 'remove' },
  close: { ios: 'xmark', android: 'close' },
  search: { ios: 'magnifyingglass', android: 'search' },
  play: { ios: 'play.fill', android: 'play_arrow' },
  pause: { ios: 'pause.fill', android: 'pause' },
  'play-skip-back': { ios: 'backward.end.fill', android: 'skip_previous' },
  videocam: { ios: 'video.fill', android: 'videocam' },
  'videocam-outline': { ios: 'video', android: 'videocam' },
  options: { ios: 'slider.horizontal.3', android: 'tune' },
  'options-outline': { ios: 'slider.horizontal.3', android: 'tune' },
  'trash-outline': { ios: 'trash', android: 'delete' },
  'chevron-forward': { ios: 'chevron.right', android: 'chevron_right' },
  'time-outline': { ios: 'clock', android: 'schedule' },
  'calendar-outline': { ios: 'calendar', android: 'calendar_today' },
  'images-outline': { ios: 'photo.on.rectangle', android: 'photo_library' },
  'phone-portrait-outline': { ios: 'iphone', android: 'smartphone' },
  person: { ios: 'person.fill', android: 'person' },
  'person-circle': { ios: 'person.crop.circle.fill', android: 'account_circle' },
  'person-circle-outline': { ios: 'person.crop.circle', android: 'account_circle' },
  'shield-checkmark-outline': { ios: 'checkmark.shield', android: 'verified_user' },
  'information-circle-outline': { ios: 'info.circle', android: 'info' },
  'ellipsis-horizontal': { ios: 'ellipsis', android: 'more_horiz' },
  'document-text': { ios: 'doc.text.fill', android: 'description' },
  'document-text-outline': { ios: 'doc.text', android: 'description' },
  'copy-outline': { ios: 'doc.on.doc', android: 'content_copy' },
  pin: { ios: 'pin', android: 'push_pin' },
  'pin-filled': { ios: 'pin.fill', android: 'push_pin' },
  palette: { ios: 'paintpalette', android: 'palette' },
  checkmark: { ios: 'checkmark', android: 'check' },
  'no-color': { ios: 'nosign', android: 'format_color_reset' },
  takes: { ios: 'play.rectangle.on.rectangle', android: 'video_library' },
  mic: { ios: 'mic.fill', android: 'mic' },
  'replay': { ios: 'arrow.counterclockwise', android: 'replay' },
  heart: { ios: 'heart.fill', android: 'favorite' },
  'heart-outline': { ios: 'heart', android: 'favorite_border' },
  'add-square': { ios: 'plus.app', android: 'add_box' },
  'albums-outline': { ios: 'square.grid.2x2', android: 'grid_view' },
  'create-outline': { ios: 'square.and.pencil', android: 'edit_note' },
} as const satisfies Record<string, { ios: SFSymbol; android: string }>;

export type IconName = keyof typeof ICONS;

/**
 * Material Symbols on Android draw outlined shapes only, so icons that must look
 * filled (a liked heart, a pinned pin) use the filled Material Icons font there.
 */
const ANDROID_FILLED: Partial<Record<IconName, keyof typeof MaterialIcons.glyphMap>> = {
  heart: 'favorite',
  'pin-filled': 'push-pin',
  videocam: 'videocam',
  'document-text': 'description',
  'person-circle': 'account-circle',
  person: 'person',
  play: 'play-arrow',
  mic: 'mic',
  pause: 'pause',
};

export function Icon({
  name,
  size = 22,
  color,
  style,
}: {
  name: IconName;
  size?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const icon = ICONS[name];
  const filled = Platform.OS === 'android' ? ANDROID_FILLED[name] : undefined;
  if (filled) {
    return (
      <View style={[{ width: size, height: size }, style]}>
        <MaterialIcons name={filled} size={size} color={color} />
      </View>
    );
  }
  return (
    <SymbolView
      name={{ ios: icon.ios, android: icon.android, web: icon.android } as never}
      size={size}
      tintColor={color}
      style={[{ width: size, height: size }, style]}
    />
  );
}
