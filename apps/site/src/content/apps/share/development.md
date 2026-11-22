---

title: Development
description: Run the existing interface and prepare the platform shells.
order: 2
---

## Start at the workspace root

Use the Bun version in `.bun-version` and Node.js 24. Run the commands below from the ZeroCloud checkout. Bun installs dependencies for every workspace from the root lockfile.

```sh
bun install --frozen-lockfile
bun run dev
```

The shared React shell opens at `http://127.0.0.1:14370`. It currently displays the product scaffold.

## Desktop

```sh
bun run desktop:prepare
bun run dev:desktop
```

The first command prepares the Electrobun SDK. The second builds the shared interface and opens the desktop shell.

## Android

With JDK 21, Android Studio, and Android SDK 36 installed, build the shared interface and copy it into the Android project.

```sh
bun run android:sync
bun run android:open
```

Use Android Studio to run the native shell on an emulator or connected device.
