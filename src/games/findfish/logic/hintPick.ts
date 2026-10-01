/**
 * Chooses which fish the hint points at. Picking the first match would always choose
 * the top row (fish are stored row by row); instead every row that has a candidate is
 * equally likely, then one fish in that row is picked at random.
 */
export type Random = () => number;

export function pickEvenlyByRow<T extends { row: number }>(candidates: readonly T[], random: Random): T | undefined {
  const rows = [...new Set(candidates.map((c) => c.row))];
  if (rows.length === 0) return undefined;
  const row = rows[Math.min(rows.length - 1, Math.floor(random() * rows.length))];
  const inRow = candidates.filter((c) => c.row === row);
  return inRow[Math.min(inRow.length - 1, Math.floor(random() * inRow.length))];
}
