# Light Switcher

A deliberately simple, standalone Android app: one screen with a big switch that
turns the device **flashlight (torch)** on and off. Tap the bulb or the button to
toggle. The whole screen and the bulb change to reflect the current state, and the
screen is kept awake while the light is on.

This is a self-contained native Android project and is **independent** of the
WM 2026 Fan-Portal (Capacitor) app in the repository root — it just lives in the
same repo, in its own `light-switcher-app/` folder.

## Features

- Toggle the real hardware flashlight via `CameraManager.setTorchMode`.
- Visual feedback: bulb icon + background switch between on/off.
- Stays in sync if the torch is changed by another app (`TorchCallback`).
- Graceful fallback on devices without a flash — works as a screen-only switch.
- Never leaves the torch on in the background (turned off in `onStop`).

## Build

Requires the Android SDK (e.g. via Android Studio) with API level 36 installed.

```bash
cd light-switcher-app
./gradlew assembleDebug
```

The APK is written to `app/build/outputs/apk/debug/app-debug.apk`.

Or open the `light-switcher-app/` folder directly in Android Studio and press Run.

## Project layout

```
light-switcher-app/
├── settings.gradle / build.gradle        # Gradle config (AGP 8.13, Gradle 8.14.3)
├── app/
│   ├── build.gradle                      # module config (minSdk 26, targetSdk 36)
│   └── src/main/
│       ├── AndroidManifest.xml
│       ├── java/.../MainActivity.kt      # all the logic (~130 lines)
│       └── res/                          # layout, strings, colors, icons
```

## Notes

- `minSdk` is 26 (Android 8.0). `setTorchMode` works from API 23, but 26 lets the
  app ship an adaptive launcher icon without bundling PNG assets.
- The `CAMERA` permission is declared and requested before turning the torch on;
  if it is denied the app still switches into a screen-light state.
