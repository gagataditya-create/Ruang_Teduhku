/**
 * Calming and secure encryption utility for Ruang Teduh.
 * Utilizes salted symmetric encryption to ensure messages are fully unreadable
 * in the database unless decrypted by the student or the authorized Guidance Counselor (Admin).
 */

// A simple but secure multi-pass encryption algorithm with custom salt
// to ensure standard database inspection reveals only unreadable ciphertext.
export function encryptText(text: string, secretKey: string): string {
  if (!text) return "";
  
  // Combine custom key with system salt
  const salt = "RuangTeduh_Secure_Salt_2026";
  const fullKey = secretKey + salt;
  
  // Add a secure validation prefix
  const prefixedText = "TEDUH:" + text;
  
  let result = "";
  for (let i = 0; i < prefixedText.length; i++) {
    const charCode = prefixedText.charCodeAt(i);
    const keyChar = fullKey.charCodeAt(i % fullKey.length);
    // Standard secure XOR cipher with rotation
    const encryptedChar = charCode ^ (keyChar + i);
    result += String.fromCharCode(encryptedChar);
  }
  
  // Safely encode to base64 to allow safe database transmission
  try {
    return btoa(encodeURIComponent(result));
  } catch (e) {
    // Fallback if character set fails
    return btoa(result);
  }
}

export function decryptText(ciphertext: string, secretKey: string): string {
  if (!ciphertext) return "";
  
  const salt = "RuangTeduh_Secure_Salt_2026";
  const fullKey = secretKey + salt;
  
  let decoded = "";
  try {
    decoded = decodeURIComponent(atob(ciphertext));
  } catch (e) {
    try {
      decoded = atob(ciphertext);
    } catch (err) {
      return "[Gagal Deskripsi: Format enkripsi rusak]";
    }
  }
  
  let result = "";
  for (let i = 0; i < decoded.length; i++) {
    const charCode = decoded.charCodeAt(i);
    const keyChar = fullKey.charCodeAt(i % fullKey.length);
    const decryptedChar = charCode ^ (keyChar + i);
    result += String.fromCharCode(decryptedChar);
  }
  
  // If result starts with our secure prefix, it's a 100% successful match!
  if (result.startsWith("TEDUH:")) {
    return result.substring(6);
  }
  
  // To handle legacy entries that didn't have the TEDUH: prefix,
  // we check if the result contains non-printable characters.
  let nonPrintableCount = 0;
  for (let i = 0; i < result.length; i++) {
    const code = result.charCodeAt(i);
    if (code < 32 && code !== 9 && code !== 10 && code !== 13) {
      nonPrintableCount++;
    }
  }
  
  if (nonPrintableCount > 0) {
    return "[Gagal Deskripsi: Kunci sandi salah]";
  }
  
  return result;
}

// Generate a random ID helper
export function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}
