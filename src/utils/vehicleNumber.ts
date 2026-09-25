// utils/vehicleNumber.ts

export function normalizeVehicleNumber(value: string): string {
  return value.toUpperCase().replace(/\s+/g, "").trim();
}

export function getVehicleType(value: string): string {
  const v = normalizeVehicleNumber(value);

  // BH series: BH 12 AB 1234 => BH12AB1234
  const bhRegex = /^BH\d{2}[A-Z]{2}\d{4}$/;

  // Normal Indian vehicle number: state + RTO (1-2 digits) + series (1-3
  // letters) + number (1-4 digits). Covers TN01AB1234, KA05MN9999,
  // DL08C1234, and 1-digit-RTO plates with a category letter such as
  // DL3CAB1234 / TN6CXL2028.
  const normalRegex = /^[A-Z]{2}\d{1,2}[A-Z]{1,3}\d{1,4}$/;

  // 1975-style vintage number:
  // MAA1025, MDS4578, etc.
  const vintageRegex = /^[A-Z]{3}\d{1,4}$/;

  if (bhRegex.test(v)) return "BH_SERIES";
  if (normalRegex.test(v)) return "NORMAL_INDIAN";
  if (vintageRegex.test(v)) return "VINTAGE";
  return "INVALID";
}

// Formats progressively as the user types, not just once the full plate is
// complete — the previous version only matched against the FULL fixed
// regexes, so anything not yet complete (or, previously, a duplicated ad-hoc
// copy of this function in various dialogs) fell back to raw/unformatted
// text, and every such duplicate always split the series as exactly 2
// letters at a fixed position. Real Indian plates have a 1-OR-2-letter
// series (e.g. "TN 00 A 0007" vs "TN 04 AB 1234"), so a fixed-position split
// corrupts any single-letter-series plate — "TN 00 A 0007" would come out as
// "TN 00 A0 007", silently eating a digit from the plate number and making
// it look like the number is short by one digit.
export function formatVehicleNumber(value: string): string {
  const v = normalizeVehicleNumber(value);
  if (!v) return "";

  // BH series (BH 12 AB 1234) — always a fixed-width 2+2+2+4, no ambiguity.
  if (v.startsWith("BH")) {
    let out = v.slice(0, 2);
    if (v.length > 2) out += " " + v.slice(2, 4);
    if (v.length > 4) out += " " + v.slice(4, 6);
    if (v.length > 6) out += " " + v.slice(6, 10);
    return out;
  }

  // Vintage-style (MAA1025) — 3 letters then up to 4 digits, no RTO segment.
  // Only taken once a 3rd letter actually follows the first two; a normal
  // plate's 3rd character is always the start of the RTO digits.
  if (/^[A-Z]{3}/.test(v) && !/^[A-Z]{2}\d/.test(v)) {
    return v.length > 3 ? `${v.slice(0, 3)} ${v.slice(3, 7)}` : v;
  }

  // Normal Indian plate: state(2 letters) + RTO(2 digits) + series(1-2
  // letters) + number(up to 4 digits). Rather than assume the series is
  // always 2 letters, split the remainder after the RTO code into its actual
  // leading-letters run (the series) and trailing-digits run (the number) —
  // this self-corrects live as the user types, the moment a digit follows
  // the series letters.
  // The RTO code is 1-2 digits; a 1-digit RTO followed by 3 letters is shown
  // with its category letter attached, e.g. "DL 3C AB 1234" / "TN 6C XL 2028".
  let out = v.slice(0, 2);
  if (v.length <= 2) return out;

  const afterState = v.slice(2);
  let rto = afterState.match(/^\d{0,2}/)?.[0] || "";
  if (!rto) return `${out} ${afterState}`;
  let rest = afterState.slice(rto.length);
  let letters = rest.match(/^[A-Z]{0,3}/)?.[0] || "";
  if (rto.length === 1 && letters.length === 3) {
    rto += letters[0];
    letters = letters.slice(1);
    rest = rest.slice(1);
  }
  const number = rest.slice(letters.length).match(/^\d{0,4}/)?.[0] || "";

  out += " " + rto;
  if (letters) out += " " + letters;
  if (number) out += " " + number;
  return out;
}
