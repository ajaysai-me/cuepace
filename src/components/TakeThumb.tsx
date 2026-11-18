import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { ensureThumb } from '../lib/recordings';
import type { Recording } from '../lib/store';
import { Icon } from './Icon';

/*
 * Stills are JPEG files saved next to each take, so after the first time they load
 * straight from disk. Missing ones are made in the background, two at a time.
 */
const known = new Map<string, string>();
const queue: (() => void)[] = [];
let running = 0;
const MAX_PARALLEL = 2;

function schedule<T>(job: () => Promise<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const run = () => {
      running++;
      job()
        .then(resolve, reject)
        .finally(() => {
          running--;
          queue.shift()?.();
        });
    };
    if (running < MAX_PARALLEL) run();
    else queue.push(run);
  });
}

/** A still frame from a take; a dark tile with a play glyph until it's ready. */
export function TakeThumb({ rec, style }: { rec: Recording; style?: StyleProp<ViewStyle> }) {
  const [uri, setUri] = useState<string | null>(() => known.get(rec.file) ?? null);

  useEffect(() => {
    if (known.has(rec.file)) return;
    let alive = true;
    schedule(() => ensureThumb(rec))
      .then((u) => {
        if (!u) return;
        known.set(rec.file, u);
        if (alive) setUri(u);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [rec]);

  return (
    <View style={[styles.tile, style]}>
      {uri ? (
        <Image source={{ uri }} recyclingKey={uri} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} />
      ) : (
        <View style={styles.placeholder}>
          <Icon name="play" size={18} color="rgba(255,255,255,0.35)" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tile: { backgroundColor: '#1A1A1A', overflow: 'hidden' },
  placeholder: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
});
