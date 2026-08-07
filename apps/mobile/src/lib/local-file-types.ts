/*
 * Reading a file the user just picked, on both the app and the browser.
 *
 * `expo-file-system` is native-only. Its web build ships a stub whose
 * `FileSystemFile` has a constructor and nothing else, while the `File` class
 * that extends it calls `this.validatePath()` — a method that only exists on the
 * native class. So `new File(uri)` on web throws
 *
 *   this.validatePath is not a function
 *
 * from inside the constructor, before any of our code runs. That is exactly what
 * a guest saw when they tried to add a photo to a gallery: the gallery is served
 * at /media/* on the web, because a guest scanning a QR code has a browser and
 * no reason to install anything.
 *
 * Splitting the two readers by platform keeps `expo-file-system` out of the web
 * bundle entirely rather than guarding each call site, which is the same shape
 * the ads, analytics and notification gateways already use here.
 */

/** The bytes to upload. */
export type ReadFileBytes = (uri: string) => Promise<Uint8Array>;

/**
 * Size in bytes, or null when it cannot be determined. Best-effort by design:
 * it is only ever a fallback for a size the picker usually reports itself, and
 * failing to measure a file is not a reason to refuse to upload it.
 */
export type ReadFileSize = (uri: string) => Promise<number | null>;
