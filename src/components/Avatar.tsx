import { StyleSheet, Text, View } from 'react-native';
import { initials, useStore } from '../lib/store';
import { avatarColor } from '../lib/theme';
import { Icon } from './Icon';

/** Your initials in a coloured circle (colour comes from your name). */
export function Avatar({ size = 30 }: { size?: number }) {
  const name = useStore((s) => s.profile.name);
  const letters = initials(name);
  const tone = avatarColor(name.trim().toLowerCase());
  return (
    <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2, backgroundColor: tone.bg }]}>
      {letters ? (
        <Text style={{ color: tone.fg, fontSize: size * 0.4, fontWeight: '700' }}>{letters}</Text>
      ) : (
        <Icon name="person" size={size * 0.5} color={tone.fg} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  circle: { alignItems: 'center', justifyContent: 'center' },
});
