<p align="center">
  <img src="assets/icon.png" width="96" height="96" alt="CuePace icon" />
</p>

<h1 align="center">CuePace</h1>

<p align="center">
  An open-source video teleprompter for iOS and Android.<br />
  Record yourself on the front camera while your script scrolls right under the lens.
</p>

---

CuePace runs entirely on your phone. There is no server, no account and no tracking: your scripts and recordings stay on the device unless you choose to save or share them.

## Features

- **Script library**: write, edit, duplicate and delete scripts, with word count and spoken-length estimate
- **Record while you read**: the script scrolls in a see-through panel under the front camera, so your eyes stay near the lens. Drag its handle to resize it.
- **Smooth scrolling**: runs on the UI thread; tap the text to play or pause, drag to move back or forward
- **Make it yours**: speed, text size, side margins, alignment, countdown and an eye-line marker
- **Takes stay organized**: every recording is kept in the app, listed under its script and in the Recordings tab, with playback
- **Optional gallery copy** of each take, a profile with stats, and storage management
- Screen stays awake while recording

## Getting started

You need Node.js 20 or newer, and a phone or emulator.

```bash
git clone <this-repo-url>
cd cuepace
npm install
npx expo start
```

Then open the app on your phone:

- **Quick try**: scan the QR code with the Expo Go app. Most of the app works there.
- **Full app** (recommended for camera work): make a development build.

  ```bash
  npx expo run:android   # needs the Android SDK and JDK 17
  npx expo run:ios       # needs Xcode on a Mac
  ```

The `android/` and `ios/` folders are generated from `app.json` and are not committed. Change native settings in `app.json`, not in those folders.

### Build an installable Android APK

```bash
npx expo prebuild --platform android
cd android
./gradlew assembleRelease -PreactNativeArchitectures=arm64-v8a,armeabi-v7a
```

The APK is written to `android/app/build/outputs/apk/release/app-release.apk`. It is signed with the default debug key, which is fine for testing; use your own release key for anything you distribute.

## Project structure

| Path | What lives there |
| --- | --- |
| `src/app/` | Screens (file-based routing): home, profile, recordings, liked, script editor, camera, player |
| `src/components/Prompter.tsx` | The scrolling engine used on the camera screen |
| `src/components/` | Shared UI pieces |
| `src/lib/store.ts` | Scripts and settings, saved to on-device SQLite |
| `src/lib/recordings.ts` | Keeps video files in the app's documents folder |
| `src/lib/theme.ts` | Colors, fonts and spacing |
| `assets/` | App icon and splash image |

## Contributing

Contributions of every size are welcome: bug reports, ideas, docs, design and code. First-time contributors especially.

1. Read [CONTRIBUTING.md](CONTRIBUTING.md) for setup and the pull request checklist.
2. Pick an issue labelled **good first issue** or **help wanted**, or open an issue to propose something new.
3. Please follow our [Code of Conduct](CODE_OF_CONDUCT.md).

On the roadmap, and open for contributors:

- Voice-following scroll (the text moves as you speak)
- Import scripts from text files
- Bluetooth remote and keyboard control
- Landscape and tablet layouts
- Translations

## License

[MIT](LICENSE) © The CuePace contributors
