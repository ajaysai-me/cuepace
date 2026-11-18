import { Directory, File, Paths } from 'expo-file-system';
import { Asset, requestPermissionsAsync } from 'expo-media-library';
import { getThumbnailAsync } from 'expo-video-thumbnails';
import { actions, getState, newId, type Recording } from './store';

function folder() {
  const dir = new Directory(Paths.document, 'recordings');
  dir.create({ idempotent: true });
  return dir;
}

export function recordingFile(rec: Pick<Recording, 'file'>) {
  return new File(folder(), rec.file);
}

/** Uri to play a recording from. */
export function recordingUri(rec: Pick<Recording, 'file'>) {
  return recordingFile(rec).uri;
}

/** The still image saved next to a take's video ("<name>.jpg"). */
function thumbFile(rec: Pick<Recording, 'file'>) {
  return new File(folder(), rec.file.replace(/\.\w+$/, '') + '.jpg');
}

/**
 * Returns a file uri for the take's still, making and saving it first if needed.
 * The frame is taken half a second in so it isn't a black first frame.
 */
export async function ensureThumb(rec: Pick<Recording, 'file'>): Promise<string | null> {
  const thumb = thumbFile(rec);
  if (thumb.exists) return thumb.uri;
  const video = recordingFile(rec);
  if (!video.exists) return null;
  let made: string;
  try {
    made = (await getThumbnailAsync(video.uri, { time: 500, quality: 0.7 })).uri;
  } catch {
    // Very short clips may not have a frame at 0.5s; fall back to the first frame.
    made = (await getThumbnailAsync(video.uri, { time: 0, quality: 0.7 })).uri;
  }
  // The generator writes to the cache folder; keep it with the video instead.
  await new File(made).move(thumb);
  return thumb.uri;
}

/** Copies a video to the photo library. Returns false if the person denied access. */
export async function saveToPhotos(uri: string) {
  const perm = await requestPermissionsAsync(true, ['video']);
  if (!perm.granted) return false;
  await Asset.create(uri);
  return true;
}

/**
 * Moves a fresh camera recording (which lives in the temporary cache) into the app's own
 * recordings folder and adds it to the library. Optionally copies it to Photos as well.
 */
export async function keepRecording(opts: { tempUri: string; scriptId: string; scriptTitle: string; duration: number }) {
  const id = newId();
  const ext = opts.tempUri.match(/\.\w+$/)?.[0] ?? '.mp4';
  const name = `${id}${ext}`;
  const dest = new File(folder(), name);
  await new File(opts.tempUri).move(dest);

  // Make the gallery still now so it's ready the first time the take is shown.
  ensureThumb({ file: name }).catch(() => {});

  let savedToPhotos = false;
  if (getState().profile.saveToPhotos) {
    try {
      savedToPhotos = await saveToPhotos(dest.uri);
    } catch {
      // The take is still kept in the app; Photos is only a bonus copy.
    }
  }

  actions.addRecording({
    id,
    scriptId: opts.scriptId,
    scriptTitle: opts.scriptTitle,
    file: name,
    duration: opts.duration,
    savedToPhotos,
  });
  return id;
}

export function deleteRecording(rec: Recording) {
  try {
    const f = recordingFile(rec);
    if (f.exists) f.delete();
    const t = thumbFile(rec);
    if (t.exists) t.delete();
  } catch {
    // File already gone; still remove the entry.
  }
  actions.removeRecording(rec.id);
}
