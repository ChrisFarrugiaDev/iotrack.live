// ---------------------------------------------------------------------


export function divideLine(
    start: number[],
    end: number[],
    divider: number
): number[][] {
    if (divider < 2) throw new Error("Divider must be >= 2");

    const result: number[][] = [];

    for (let i = 1; i <= divider; i++) {
        const t = i / divider;
        const lat = start[0] + (end[0] - start[0]) * t;
        const lng = start[1] + (end[1] - start[1]) * t;
        result.push([lat, lng]);
    }

    return result;
}

// ---------------------------------------------------------------------

export function formatLabel(apiString: string): string {
  if (!apiString) return "";
  return apiString
    .replace(/_/g, " ")                // Replace underscores with spaces
    .replace(/\w\S*/g, (txt) =>        // Capitalize each word
      txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );
}

// ---------------------------------------------------------------------
