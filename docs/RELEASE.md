# Releasing the Android app

The mobile app ships as a signed production APK attached to a GitHub Release and saved as a GitHub Actions workflow artifact.

**Zero Setup Required**: Pushing to `production` or `main`, or running `workflow_dispatch` manually builds and publishes the APK automatically. If no signing secrets are set in repository settings, the CI automatically generates a production-grade release keystore on the fly.

The workflow is [`.github/workflows/release-mobile.yml`](../.github/workflows/release-mobile.yml).

---

## Fully Automatic Pipeline (Zero Setup)

You don't have to configure any secrets or generate keystores manually.
- Push your changes to `production` or `main`.
- Or trigger the build manually via **GitHub Actions → Release Android APK → Run workflow**.
- The pipeline will typecheck, bundle JS with Hermes, sign the release APK, upload the artifact, and publish the release.

---

## (Optional) Custom Signing Keystore

If you prefer to use your own custom organisation signing key rather than the auto-generated release key:

### 1. Generate your signing keystore

```bash
keytool -genkeypair -v \
  -keystore dealbridge-release.keystore \
  -alias dealbridge \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -storetype PKCS12
```

### 2. Add the repository secrets

In `Settings → Secrets and variables → Actions → New repository secret`:

| Secret | Value |
|---|---|
| `ANDROID_KEYSTORE_BASE64` | `base64 -w0 dealbridge-release.keystore` |
| `ANDROID_KEYSTORE_PASSWORD` | the `-storepass` you chose |
| `ANDROID_KEY_ALIAS` | `dealbridge` |
| `ANDROID_KEY_PASSWORD` | the key password |
| `EXPO_PUBLIC_API_URL` | *optional.* Defaults to `https://apidealbridge.autonexai360.com`. |

```bash
# Prints the one-line value for ANDROID_KEYSTORE_BASE64
base64 -w0 dealbridge-release.keystore
```

---

## Shipping a build

```bash
# 1. Work on a feature branch, as usual
git checkout -b feat/whatever
# ...changes...
git commit -m "feat: whatever"
git push -u origin feat/whatever

# 2. Merge to main through a PR (CI runs typecheck, lint, tests)

# 3. Ship: fast-forward production to main
git checkout production
git pull
git merge --ff-only main
git push
```

That push triggers the release. It takes roughly 10–15 minutes. When it
finishes, the APK is at:

**https://github.com/kedar49/autonex-crm-app/releases/latest**

To re-cut a build without a code change — say the previous run failed on a
transient network error — use `Actions → Release Android APK → Run workflow`.

### Bumping the version

The user-visible version comes from `apps/mobile/app.json`:

```json
{ "expo": { "version": "1.1.0" } }
```

Edit it in the same PR as the change it describes. The internal `versionCode`
Android uses to order upgrades is derived from the workflow run number, so it
always increases whether or not you bump the version — you never have to
manage it by hand.

---

## What makes it a production build

- **No Metro.** `assembleRelease` runs the Metro bundler at build time and
  packages the resulting Hermes bytecode into the APK. The installed app reads
  its JS from disk and never looks for a development server.
- **No debug UI.** LogBox, the red error screen, the yellow warning boxes and
  the shake-to-open dev menu are all compiled out of a release build. An
  unexpected render error is caught by
  [`ErrorBoundary`](../apps/mobile/src/ui/ErrorBoundary.tsx) and shown as a
  normal screen with a "Try again" button.
- **Signed with the real key**, verified by `apksigner` before publishing.
- **arm64 + arm32 only.** x86 slices exist for emulators and would add tens of
  megabytes to a download nobody installs on a phone.

---

## Building a release APK locally

Useful for smoke-testing a production bundle before pushing.

```bash
export ANDROID_HOME=$HOME/Android/Sdk
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk   # 17 or 21; NOT 24+
export PATH=$JAVA_HOME/bin:$ANDROID_HOME/platform-tools:$PATH

cd apps/mobile/android
./gradlew :app:assembleRelease
# → app/build/outputs/apk/release/app-release.apk

adb install -r app/build/outputs/apk/release/app-release.apk
```

Without the signing environment variables this falls back to the debug key.
That is fine for a local smoke test and **is not publishable** — install it
over a real release and Android will refuse.

To sign locally with the real key, put the four values in
`~/.gradle/gradle.properties` (outside the repository, so it can never be
committed):

```properties
DEALBRIDGE_KEYSTORE_FILE=/absolute/path/to/dealbridge-release.keystore
DEALBRIDGE_KEYSTORE_PASSWORD=...
DEALBRIDGE_KEY_ALIAS=dealbridge
DEALBRIDGE_KEY_PASSWORD=...
```

---

## Troubleshooting

**`Error resolving plugin [id: 'com.facebook.react.settings'] > 25.0.4.1`**
You are on JDK 24 or newer. Gradle 8.8 and the Kotlin 1.9 plugin do not
support it. Point `JAVA_HOME` at JDK 17 (or 21) and run `./gradlew --stop` to
kill the daemons that started under the wrong JDK.

**`Failed to resolve the Android SDK path`**
`ANDROID_HOME` is unset or wrong. It is `~/Android/Sdk` on a standard Android
Studio install — note the capital `S`.

**The workflow fails at "Verify the APK is production-signed"**
The custom keystore was used but Gradle did not recognize it, or the custom secret passwords did not match. Check your keystore with:

```bash
keytool -list -v -keystore dealbridge-release.keystore
```

**Users see "App not installed"**
Almost always an older build signed with a different key is already on the
device. Uninstall it first. This should only ever happen for people who
installed a debug build during development.
