/**
 * Paints a draw description on a Skia canvas. Shared by the app (inside a worklet, with the
 * native Skia API) and the contact-sheet script (headless Skia on CanvasKit). Only types are
 * imported from Skia, so this file runs anywhere the API object is passed in.
 */

import type { PaintStyle, SkCanvas, SkFont, SkPicture, Skia } from '@shopify/react-native-skia';

import type { CourtGeometry } from './court';
import { describeCourt, type DrawOp, type SceneLook } from './scene';

type SkiaApi = typeof Skia;

// PaintStyle is a runtime enum in the Skia entry point, which cannot load in Node; its values
// (Fill 0, Stroke 1) are stable, so they are written here.
// eslint-disable-next-line @typescript-eslint/no-unsafe-enum-assignment
const FILL = 0 as PaintStyle;
// eslint-disable-next-line @typescript-eslint/no-unsafe-enum-assignment
const STROKE = 1 as PaintStyle;

/** Advance width of a string (measureText is not available on every Skia backend). */
export function textWidth(font: SkFont, text: string): number {
  'worklet';
  const widths = font.getGlyphWidths(font.getGlyphIDs(text));
  let w = 0;
  for (const x of widths) w += x;
  return w;
}

export function paintOps(
  Skia: SkiaApi,
  canvas: SkCanvas,
  ops: readonly DrawOp[],
  fonts: readonly (SkFont | null)[],
  court: SkPicture | null,
): void {
  'worklet';
  const paint = Skia.Paint();
  paint.setAntiAlias(true);
  for (const op of ops) {
    switch (op.k) {
      case 'court':
        if (court) {
          canvas.save();
          canvas.translate(op.tx, op.ty);
          canvas.scale(op.s, op.s);
          canvas.drawPicture(court);
          canvas.restore();
        }
        break;
      case 'circle':
        paint.setColor(Skia.Color(op.color));
        paint.setAlphaf(op.alpha);
        paint.setStyle(op.stroke > 0 ? STROKE : FILL);
        paint.setStrokeWidth(op.stroke);
        canvas.drawCircle(op.x, op.y, op.r, paint);
        break;
      case 'rect': {
        paint.setColor(Skia.Color(op.color));
        paint.setAlphaf(op.alpha);
        paint.setStyle(op.stroke > 0 ? STROKE : FILL);
        paint.setStrokeWidth(op.stroke);
        const r = Skia.XYWHRect(op.x, op.y, op.w, op.h);
        if (op.r > 0) canvas.drawRRect(Skia.RRectXY(r, op.r, op.r), paint);
        else canvas.drawRect(r, paint);
        break;
      }
      case 'line':
        paint.setColor(Skia.Color(op.color));
        paint.setAlphaf(op.alpha);
        paint.setStyle(STROKE);
        paint.setStrokeWidth(op.width);
        canvas.drawLine(op.x0, op.y0, op.x1, op.y1, paint);
        break;
      case 'arc':
        paint.setColor(Skia.Color(op.color));
        paint.setAlphaf(op.alpha);
        paint.setStyle(STROKE);
        paint.setStrokeWidth(op.width);
        canvas.drawArc(
          Skia.XYWHRect(op.x - op.r, op.y - op.r, op.r * 2, op.r * 2),
          op.start,
          op.sweep,
          false,
          paint,
        );
        break;
      case 'text': {
        const font = fonts[op.font];
        if (!font || op.text.length === 0) break;
        paint.setColor(Skia.Color(op.color));
        paint.setAlphaf(op.alpha);
        paint.setStyle(FILL);
        const w = op.align === 0 ? 0 : textWidth(font, op.text);
        const x = op.align === 1 ? op.x - w / 2 : op.align === 2 ? op.x - w : op.x;
        canvas.drawText(op.text, x, op.y, paint, font);
        break;
      }
      case 'pill': {
        const font = fonts[op.font];
        if (!font) break;
        const w = textWidth(font, op.text) + 16;
        const x = op.align === 2 ? op.x - w : op.x;
        paint.setColor(Skia.Color(op.bg));
        paint.setAlphaf(op.alpha);
        paint.setStyle(FILL);
        canvas.drawRRect(Skia.RRectXY(Skia.XYWHRect(x, op.y, w, op.h), 4, 4), paint);
        paint.setColor(Skia.Color(op.color));
        paint.setAlphaf(1);
        canvas.drawText(op.text, x + 8, op.y + op.h / 2 + 4, paint, font);
        break;
      }
    }
  }
}

/** Records the court (in feet) once, to be drawn under every frame with the camera transform. */
export function recordCourt(Skia: SkiaApi, geo: CourtGeometry, look: SceneLook): SkPicture {
  const recorder = Skia.PictureRecorder();
  const canvas = recorder.beginRecording(Skia.XYWHRect(-6, -6, 106, 62));
  paintOps(Skia, canvas, describeCourt(geo, look), [], null);
  return recorder.finishRecordingAsPicture();
}

/** Records one whole frame as a picture in logical pixels, scaled by `scale`. */
export function recordFrame(
  Skia: SkiaApi,
  ops: readonly DrawOp[],
  fonts: readonly (SkFont | null)[],
  court: SkPicture | null,
  width: number,
  height: number,
  scale: number,
): SkPicture {
  'worklet';
  const recorder = Skia.PictureRecorder();
  const canvas = recorder.beginRecording(Skia.XYWHRect(0, 0, width, height));
  canvas.save();
  canvas.scale(scale, scale);
  paintOps(Skia, canvas, ops, fonts, court);
  canvas.restore();
  return recorder.finishRecordingAsPicture();
}
