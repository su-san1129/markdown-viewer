/** Convert 0-based column index to Excel column letter (0→A, 25→Z, 26→AA, ...) */
export function columnIndexToLetter(index: number): string {
  let result = "";
  let n = index;
  while (n >= 0) {
    result = String.fromCharCode((n % 26) + 65) + result;
    n = Math.floor(n / 26) - 1;
  }
  return result;
}

/** Convert (row, col) to cell address like "A1" (both 0-based) */
export function cellAddress(row: number, col: number): string {
  return `${columnIndexToLetter(col)}${row + 1}`;
}

/** Check if a string looks like a numeric value (for right-alignment) */
export function isNumericValue(value: string): boolean {
  if (!value) return false;
  return /^-?[\d,]+\.?\d*$/.test(value.trim());
}

/** Convert XLSX character-unit column width to pixels (approx: 1 char ≈ 8px + 5px padding) */
export function charWidthToPx(charWidth: number): number {
  return Math.round(charWidth * 8 + 5);
}

/** Convert points to pixels (1pt ≈ 1.333px at 96dpi) */
export function ptToPx(pt: number): number {
  return Math.round(pt * 1.333);
}

/** Map XLSX border style name to CSS border shorthand */
export function borderStyleToCss(style: string, color?: string): string {
  const c = color ?? "var(--xlsx-grid)";
  const widthMap: Record<string, string> = {
    thin: "1px",
    medium: "2px",
    thick: "3px",
    double: "3px",
    hair: "1px",
    dashed: "1px",
    dotted: "1px",
    mediumDashed: "2px",
    dashDot: "1px",
    mediumDashDot: "2px",
    dashDotDot: "1px",
    mediumDashDotDot: "2px",
    slantDashDot: "2px"
  };
  const cssStyle: Record<string, string> = {
    thin: "solid",
    medium: "solid",
    thick: "solid",
    double: "double",
    hair: "solid",
    dashed: "dashed",
    dotted: "dotted",
    mediumDashed: "dashed",
    dashDot: "dashed",
    mediumDashDot: "dashed",
    dashDotDot: "dotted",
    mediumDashDotDot: "dotted",
    slantDashDot: "solid"
  };
  return `${widthMap[style] ?? "1px"} ${cssStyle[style] ?? "solid"} ${c}`;
}
