/**
 * Formats an out pass ID cleanly.
 * Converts raw UIDs like "OPMUFAKZ0A5G0X" into clean sequential numbers like "OP-00001".
 * Retains existing formatted IDs like "OP-00001".
 */
export function formatOutPassId(id?: string | null, index?: number): string {
  if (!id) return "OP-00001";

  const trimmed = id.trim();

  // If already in OP-00001 or OP-12345 format
  if (/^OP-\d+$/i.test(trimmed)) {
    return trimmed.toUpperCase();
  }

  // If it's OP- followed by alphanumeric or raw CUID like OPMUFAKZ0A5G0X
  if (trimmed.toUpperCase().startsWith("OP")) {
    const rest = trimmed.slice(2).replace(/^[-_]/, "");

    // If rest is purely digits
    if (/^\d+$/.test(rest)) {
      return `OP-${rest.padStart(5, "0")}`;
    }

    // If an index was provided for fallback ordering
    if (typeof index === "number" && index >= 0) {
      return `OP-${String(index + 1).padStart(5, "0")}`;
    }

    // Extract digits if any
    const digitsOnly = rest.replace(/\D/g, "");
    if (digitsOnly.length > 0) {
      return `OP-${digitsOnly.padStart(5, "0").slice(0, 5)}`;
    }

    // Otherwise use clean short 5-char alphanumeric code uppercase
    return `OP-${rest.slice(0, 5).toUpperCase()}`;
  }

  return trimmed;
}
