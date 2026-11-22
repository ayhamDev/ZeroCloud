---

title: Capacitor on Android
description: How the web build is packaged into a native Android application.
group: Platform shells
order: 50
keywords: [mobile, Android Studio, plugins, WebView, Java, Kotlin]
---

## The native container

Capacitor hosts web content inside a native application. Share’s Android project embeds the built React interface in a WebView. Android builds and installs that container as an application with its own package identity.

## Sync the interface

```sh
bun run android:sync
bun run android:open
```

The sync command builds the shared interface, copies the web assets, and synchronizes Capacitor’s native dependencies. The open command launches the project in Android Studio.

## Where a plugin fits

A Capacitor plugin can expose a narrowly defined native operation to code in the WebView. A future networking plugin might provide a capability that the browser environment lacks. The current Android project contains the application shell. Local pairing and transfer plugins are still design decisions.

[Capacitor workflow](https://capacitorjs.com/docs/basics/workflow) · [Plugin documentation](https://capacitorjs.com/docs/plugins)
