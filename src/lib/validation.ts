/**
 * Validates a GSTIN (Goods and Services Tax Identification Number)
 * Format: 29ABCDE1234F1Z5
 * - First 2 digits: State Code (01-38)
 * - Next 10 characters: PAN (5 letters, 4 digits, 1 letter)
 * - Next 1 character: Entity code (1-9 or A-Z)
 * - Next 1 character: Default 'Z'
 * - Last character: Check digit
 */
export function isValidGST(gst: string): boolean {
  if (!gst) return false;
  const uppercaseGST = gst.toUpperCase();
  
  // Standard 15 character GSTIN structure regex
  const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  if (!gstRegex.test(uppercaseGST)) return false;
  
  // Verify state code is between 01 and 38
  const stateCode = parseInt(uppercaseGST.substring(0, 2), 10);
  return stateCode >= 1 && stateCode <= 38;
}

/**
 * Sanitizes and formats an input string to strictly match the character 
 * types allowed at each index of a GSTIN (e.g. 29ABCDE1234F1Z5) as the user types.
 */
export function formatGSTInput(val: string): string {
  // Allow only alphanumeric characters, cap length to 15, and convert to uppercase
  const clean = val.replace(/[^A-Za-z0-9]/g, "").slice(0, 15).toUpperCase();
  
  let formatted = "";
  for (let i = 0; i < clean.length; i++) {
    const char = clean[i];
    if (i === 0 || i === 1) {
      // First 2 digits: State code (numbers only)
      if (/[0-9]/.test(char)) formatted += char;
    } else if (i >= 2 && i <= 6) {
      // Next 5 characters: PAN prefix (letters only)
      if (/[A-Z]/.test(char)) formatted += char;
    } else if (i >= 7 && i <= 10) {
      // Next 4 characters: PAN serial (numbers only)
      if (/[0-9]/.test(char)) formatted += char;
    } else if (i === 11) {
      // 12th character: PAN suffix (letter only)
      if (/[A-Z]/.test(char)) formatted += char;
    } else if (i === 12) {
      // 13th character: Entity code (alphanumeric)
      if (/[A-Z0-9]/.test(char)) formatted += char;
    } else if (i === 13) {
      // 14th character: Must be 'Z'
      if (char === 'Z') formatted += char;
    } else if (i === 14) {
      // 15th character: Check digit (alphanumeric)
      if (/[A-Z0-9]/.test(char)) formatted += char;
    }
  }
  return formatted;
}
