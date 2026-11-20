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

## Download

**Android:** grab the latest `CuePace-vX.Y.Z.apk` from the [**Releases page**](../../releases/latest).

1. Download the APK on your phone and open it.
2. If Android asks, allow installs from your browser or file manager.
3. Tap **Install**. Play Protect may warn you because the app isn't from the Play Store; tap **More details → Install anyway**.

Each release lists the APK's SHA-256 checksum so you can verify the download. Updates install over the previous version and keep your scripts.

**iPhone:** not available as a download yet (iOS doesn't allow installing app files directly). You can run it from source with the steps in [Getting started](#getting-started).

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

The APK is written to `android/app/build/outputs/apk/release/app-release.apk`. Without extra setup it's signed with the default debug key, which is fine for testing. To sign with your own key, see the comment at the top of `plugins/with-release-signing.js`.

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
| `plugins/` | Config plugins that shape the generated native projects |

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
