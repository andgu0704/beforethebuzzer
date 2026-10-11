/** Skia is built in on devices; only the web needs to load CanvasKit first. */
export function loadSkia(): Promise<void> {
  return Promise.resolve();
}
