/**
 * Signs Android release builds with the maintainer's own key when it is configured,
 * and falls back to the debug key otherwise (so anyone can still build a release APK).
 *
 * To sign with your own key, add these to ~/.gradle/gradle.properties (never commit them):
 *
 *   CUEPACE_UPLOAD_STORE_FILE=/absolute/path/to/cuepace-release.jks
 *   CUEPACE_UPLOAD_STORE_PASSWORD=...
 *   CUEPACE_UPLOAD_KEY_ALIAS=cuepace
 *   CUEPACE_UPLOAD_KEY_PASSWORD=...
 */
const { withAppBuildGradle } = require('expo/config-plugins');

const RELEASE_CONFIG = `
        release {
            if (project.hasProperty('CUEPACE_UPLOAD_STORE_FILE')) {
                storeFile file(CUEPACE_UPLOAD_STORE_FILE)
                storePassword CUEPACE_UPLOAD_STORE_PASSWORD
                keyAlias CUEPACE_UPLOAD_KEY_ALIAS
                keyPassword CUEPACE_UPLOAD_KEY_PASSWORD
            }
        }`;

const RELEASE_SIGNING =
  "signingConfig project.hasProperty('CUEPACE_UPLOAD_STORE_FILE') ? signingConfigs.release : signingConfigs.debug";

module.exports = function withReleaseSigning(config) {
  return withAppBuildGradle(config, (cfg) => {
    let gradle = cfg.modResults.contents;
    if (gradle.includes('CUEPACE_UPLOAD_STORE_FILE')) return cfg;

    // Add a `release` signing config right after the `debug` one.
    gradle = gradle.replace(
      /(signingConfigs\s*\{\s*debug\s*\{[^}]*\})/,
      (match) => match + RELEASE_CONFIG,
    );

    // Point the release build type at it.
    gradle = gradle.replace(
      /(buildTypes\s*\{[\s\S]*?release\s*\{[\s\S]*?)signingConfig signingConfigs\.debug/,
      (_, before) => before + RELEASE_SIGNING,
    );

    if (!gradle.includes(RELEASE_SIGNING)) {
      throw new Error('with-release-signing: could not find the release signingConfig in app/build.gradle');
    }
    cfg.modResults.contents = gradle;
    return cfg;
  });
};
