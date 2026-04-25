import CryptoJS from 'crypto-js';

// In a real E2EE app, we would use asymmetric keys (RSA/ECC)
// to exchange a symmetric key (AES) per chat.
// This is a simplified implementation for demonstration.

export function encryptMessage(content: string, secretKey: string): string {
  try {
    return CryptoJS.AES.encrypt(content, secretKey).toString();
  } catch (err) {
    console.error('Encryption failed:', err);
    return content;
  }
}

export function decryptMessage(encryptedContent: string, secretKey: string): string {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedContent, secretKey);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (err) {
    console.error('Decryption failed:', err);
    return '[Decryption Error]';
  }
}
