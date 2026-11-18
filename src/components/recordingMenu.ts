import { router } from 'expo-router';
import { Alert } from 'react-native';
import { deleteRecording, recordingUri, saveToPhotos } from '../lib/recordings';
import { actions, getState, type Recording } from '../lib/store';
import type { SheetAction } from './ActionSheet';

export function recordingTitle(rec: Recording, scriptTitle: string | undefined, take: number | undefined) {
  return `${scriptTitle || rec.scriptTitle || 'Untitled script'} · Take ${take ?? 1}`;
}

async function copyToPhotos(rec: Recording) {
  try {
    if (await saveToPhotos(recordingUri(rec))) {
      actions.updateRecording(rec.id, { savedToPhotos: true });
      Alert.alert('Saved', 'This take is now in your photo library.');
    } else {
      Alert.alert('Not saved', 'Allow photo library access in Settings to save videos.');
    }
  } catch (e) {
    Alert.alert('Could not save the video', String(e));
  }
}

/**
 * Actions for a take's action sheet. `onDeleted` runs right before the take is
 * removed (e.g. to leave its screen). `includePlay` adds Play for list rows.
 */
export function recordingActions(
  rec: Recording,
  opts: { onDeleted?: () => void; includePlay?: boolean } = {},
): SheetAction[] {
  const scriptExists = getState().scripts.some((s) => s.id === rec.scriptId);
  return [
    ...(opts.includePlay
      ? [{ label: 'Play', icon: 'play' as const, onPress: () => router.push(`/recording/${rec.id}`) }]
      : []),
    {
      label: rec.liked ? 'Unlike' : 'Like',
      icon: rec.liked ? 'heart' : 'heart-outline',
      onPress: () => actions.toggleRecordingLike(rec.id),
    },
    ...(rec.savedToPhotos
      ? []
      : [{ label: 'Save to Photos', icon: 'images-outline' as const, onPress: () => copyToPhotos(rec) }]),
    ...(scriptExists
      ? [
          {
            label: 'New take',
            icon: 'videocam-outline' as const,
            onPress: () => router.push(`/record/${rec.scriptId}`),
          },
        ]
      : []),
    {
      label: 'Delete take',
      icon: 'trash-outline',
      destructive: true,
      confirm: {
        title: 'Delete this take?',
        message: 'The video is removed from CuePace. Copies in Photos are kept.',
        confirmLabel: 'Delete',
      },
      onPress: () => {
        opts.onDeleted?.();
        deleteRecording(rec);
      },
    },
  ];
}
