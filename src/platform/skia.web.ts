import { LoadSkiaWeb } from '@shopify/react-native-skia/lib/module/web';

/** Loads CanvasKit from the web build's public folder before anything draws with Skia. */
export function loadSkia(): Promise<void> {
  return LoadSkiaWeb({ locateFile: () => '/canvaskit.wasm' });
}
