const PRIVATE_KEY_STORAGE_KEY = "algochat-e2ee-private-key";

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

const getWindow = () => (typeof window !== "undefined" ? window : undefined);

const toBase64 = (buffer) => {
  const uint8Array = new Uint8Array(buffer);
  let binary = "";
  uint8Array.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
};

const fromBase64 = (base64) => {
  const binary = atob(base64);
  const length = binary.length;
  const bytes = new Uint8Array(length);
  for (let i = 0; i < length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
};

export const isCryptoAvailable = () => {
  const w = getWindow();
  return Boolean(w?.crypto?.subtle);
};

export const generateEncryptionKeyPair = async () => {
  if (!isCryptoAvailable()) {
    throw new Error("Web Crypto API is not available in this environment");
  }

  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
      hash: "SHA-256",
    },
    true,
    ["encrypt", "decrypt"]
  );

  const publicKeyBase64 = await exportPublicKey(keyPair.publicKey);
  const privateKeyBase64 = await exportPrivateKey(keyPair.privateKey);

  return {
    publicKey: keyPair.publicKey,
    privateKey: keyPair.privateKey,
    publicKeyBase64,
    privateKeyBase64,
  };
};

export const exportPublicKey = async (publicKey) => {
  if (!isCryptoAvailable() || !publicKey) return null;
  const spki = await window.crypto.subtle.exportKey("spki", publicKey);
  return toBase64(spki);
};

export const exportPrivateKey = async (privateKey) => {
  if (!isCryptoAvailable() || !privateKey) return null;
  const pkcs8 = await window.crypto.subtle.exportKey("pkcs8", privateKey);
  return toBase64(pkcs8);
};

export const importPublicKey = async (base64) => {
  if (!isCryptoAvailable() || !base64) return null;
  const buffer = fromBase64(base64);
  return window.crypto.subtle.importKey(
    "spki",
    buffer,
    { name: "RSA-OAEP", hash: "SHA-256" },
    true,
    ["encrypt"]
  );
};

export const importPrivateKey = async (base64) => {
  if (!isCryptoAvailable() || !base64) return null;
  const buffer = fromBase64(base64);
  return window.crypto.subtle.importKey(
    "pkcs8",
    buffer,
    { name: "RSA-OAEP", hash: "SHA-256" },
    true,
    ["decrypt"]
  );
};

export const storePrivateKey = (base64) => {
  const w = getWindow();
  if (!w || !base64) return;
  try {
    w.localStorage.setItem(PRIVATE_KEY_STORAGE_KEY, base64);
  } catch (error) {
    console.error("Failed to store private key", error);
  }
};

export const loadStoredPrivateKey = () => {
  const w = getWindow();
  if (!w) return null;
  try {
    return w.localStorage.getItem(PRIVATE_KEY_STORAGE_KEY);
  } catch (error) {
    console.error("Failed to load private key", error);
    return null;
  }
};

export const clearStoredPrivateKey = () => {
  const w = getWindow();
  if (!w) return;
  try {
    w.localStorage.removeItem(PRIVATE_KEY_STORAGE_KEY);
  } catch (error) {
    console.error("Failed to clear private key", error);
  }
};

export const encodeText = (text) => textEncoder.encode(text);
export const decodeText = (buffer) => textDecoder.decode(buffer);

export const arrayBufferToBase64 = toBase64;
export const base64ToArrayBuffer = fromBase64;

export const generateAesKey = async () => {
  if (!isCryptoAvailable()) {
    throw new Error("Web Crypto API is not available");
  }

  return window.crypto.subtle.generateKey(
    {
      name: "AES-GCM",
      length: 256,
    },
    true,
    ["encrypt", "decrypt"]
  );
};

export const exportAesKeyRaw = async (key) => {
  if (!isCryptoAvailable() || !key) return null;
  const raw = await window.crypto.subtle.exportKey("raw", key);
  return raw;
};

export const encryptWithAesGcm = async ({ key, data, iv }) => {
  if (!isCryptoAvailable() || !key) {
    throw new Error("Missing cryptographic key or Web Crypto not available");
  }

  const ivBytes = iv || window.crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: ivBytes,
    },
    key,
    data
  );

  return {
    ciphertext,
    iv: ivBytes,
  };
};

export const encryptKeyWithPublicKey = async ({ publicKeyBase64, rawKey }) => {
  if (!isCryptoAvailable() || !publicKeyBase64 || !rawKey) return null;
  const publicKey = await importPublicKey(publicKeyBase64);
  if (!publicKey) return null;
  const encrypted = await window.crypto.subtle.encrypt(
    {
      name: "RSA-OAEP",
    },
    publicKey,
    rawKey
  );
  return arrayBufferToBase64(encrypted);
};

export const encryptMessageForRecipients = async ({ plaintext, recipients }) => {
  if (!isCryptoAvailable()) {
    throw new Error("Web Crypto API is not available");
  }

  if (!Array.isArray(recipients) || recipients.length === 0) {
    throw new Error("No recipients provided for encryption");
  }

  const aesKey = await generateAesKey();
  const plaintextBuffer = encodeText(plaintext ?? "");
  const { ciphertext, iv } = await encryptWithAesGcm({ key: aesKey, data: plaintextBuffer });
  const rawAesKey = await exportAesKeyRaw(aesKey);
  const rawKeyBase64 = arrayBufferToBase64(rawAesKey);

  const encryptedRecipients = [];

  for (const recipient of recipients) {
    if (!recipient?.publicKey) {
      throw new Error(`Recipient ${recipient?.userId || "unknown"} is missing a public key`);
    }

    const encryptedKey = await encryptKeyWithPublicKey({
      publicKeyBase64: recipient.publicKey,
      rawKey: rawAesKey,
    });

    encryptedRecipients.push({
      userId: recipient.userId,
      encryptedKey,
    });
  }

  return {
    algorithm: "RSA-OAEP+AES-GCM",
    ciphertext: arrayBufferToBase64(ciphertext),
    iv: arrayBufferToBase64(iv.buffer),
    recipients: encryptedRecipients,
    aesKey,
    rawKey: rawAesKey,
    rawKeyBase64,
  };
};

export const decryptMessageSessionKey = async ({ message, privateKeyBase64, userId }) => {
  if (!isCryptoAvailable()) return null;
  if (!message?.encryption || !privateKeyBase64 || !userId) return null;

  const { recipients } = message.encryption;
  if (!Array.isArray(recipients) || !recipients.length) {
    return null;
  }

  const recipientEntry = recipients.find((entry) => entry.userId === userId);
  if (!recipientEntry?.encryptedKey) {
    return null;
  }

  try {
    const privateKey = await importPrivateKey(privateKeyBase64);
    if (!privateKey) return null;

    const encryptedKeyBuffer = base64ToArrayBuffer(recipientEntry.encryptedKey);
    const aesKeyBuffer = await window.crypto.subtle.decrypt(
      { name: "RSA-OAEP" },
      privateKey,
      encryptedKeyBuffer
    );

    const aesKey = await window.crypto.subtle.importKey(
      "raw",
      aesKeyBuffer,
      { name: "AES-GCM" },
      false,
      ["decrypt"]
    );

    return {
      aesKey,
      rawKey: aesKeyBuffer,
    };
  } catch (error) {
    console.error("Failed to derive message session key", error);
    return null;
  }
};

export const decryptDataWithAesKey = async ({ key, iv, data }) => {
  if (!isCryptoAvailable() || !key || !data) return null;

  try {
    const ivBytes = typeof iv === "string" ? new Uint8Array(base64ToArrayBuffer(iv)) : iv;
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: ivBytes,
      },
      key,
      data
    );
    return decryptedBuffer;
  } catch (error) {
    console.error("Failed to decrypt data with AES key", error);
    return null;
  }
};

export const decryptMessage = async ({ message, privateKeyBase64, userId }) => {
  if (!message?.encryption) return null;

  const session = await decryptMessageSessionKey({ message, privateKeyBase64, userId });
  if (!session) return null;

  try {
    const ciphertextBuffer = base64ToArrayBuffer(message.content);
    const decryptedBuffer = await decryptDataWithAesKey({
      key: session.aesKey,
      iv: message.encryption.iv,
      data: ciphertextBuffer,
    });

    if (!decryptedBuffer) return null;

    return {
      content: decodeText(decryptedBuffer),
      session,
    };
  } catch (error) {
    console.error("Failed to decrypt message content", error);
    return null;
  }
};

export const decryptMessageForUser = async ({ message, privateKeyBase64, userId }) => {
  const result = await decryptMessage({ message, privateKeyBase64, userId });
  return result?.content ?? null;
};

export const decryptAttachment = async ({ attachment, session }) => {
  if (!attachment?.encryption || !session?.aesKey) return null;
  const { iv } = attachment.encryption;
  const url = attachment.url;
  if (!iv || !url) return null;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch attachment: ${response.status}`);
  }
  const dataBuffer = await response.arrayBuffer();

  const decryptedBuffer = await decryptDataWithAesKey({
    key: session.aesKey,
    iv,
    data: dataBuffer,
  });

  return decryptedBuffer;
};

export const encryptFileBuffer = async ({ fileBuffer, aesKey }) => {
  if (!isCryptoAvailable() || !fileBuffer || !aesKey) {
    throw new Error("Missing file buffer, AES key, or Web Crypto not available");
  }

  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encryptedBuffer = await encryptWithAesGcm({
    key: aesKey,
    data: fileBuffer,
    iv,
  });

  return {
    encryptedBuffer,
    iv: arrayBufferToBase64(iv.buffer),
  };
};
