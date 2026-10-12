/** Ratings as letter grades, so the roster never shows raw numbers (§11). */
export function letter(v: number): string {
  if (v >= 80) return 'A+';
  if (v >= 74) return 'A';
  if (v >= 69) return 'A−';
  if (v >= 65) return 'B+';
  if (v >= 61) return 'B';
  if (v >= 57) return 'B−';
  if (v >= 53) return 'C+';
  if (v >= 49) return 'C';
  if (v >= 45) return 'C−';
  if (v >= 40) return 'D';
  return 'F';
}
