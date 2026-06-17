const encoder = new TextEncoder();

const toHex = (bytes: Uint8Array) =>
  Array.from(bytes)
    .map((value) => value.toString(16).padStart(2, '0'))
    .join('');

const encodeQueryValue = (value: string) =>
  encodeURIComponent(value).replace(/[!'()*]/g, (character) =>
    `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
  );

const rightRotate = (value: number, amount: number) => (value >>> amount) | (value << (32 - amount));

const SHA256_K = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5,
  0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
  0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc,
  0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7,
  0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
  0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3,
  0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5,
  0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
  0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
]);

const sha256Bytes = (message: Uint8Array) => {
  const bitLength = message.length * 8;
  const paddedLength = (((message.length + 9 + 63) >> 6) << 6);
  const padded = new Uint8Array(paddedLength);
  padded.set(message);
  padded[message.length] = 0x80;

  const view = new DataView(padded.buffer);
  const highBits = Math.floor(bitLength / 0x100000000);
  const lowBits = bitLength >>> 0;
  view.setUint32(paddedLength - 8, highBits, false);
  view.setUint32(paddedLength - 4, lowBits, false);

  const hash = new Uint32Array([
    0x6a09e667,
    0xbb67ae85,
    0x3c6ef372,
    0xa54ff53a,
    0x510e527f,
    0x9b05688c,
    0x1f83d9ab,
    0x5be0cd19,
  ]);

  const words = new Uint32Array(64);

  for (let offset = 0; offset < padded.length; offset += 64) {
    for (let index = 0; index < 16; index += 1) {
      words[index] = view.getUint32(offset + index * 4, false);
    }

    for (let index = 16; index < 64; index += 1) {
      const s0 =
        rightRotate(words[index - 15], 7) ^
        rightRotate(words[index - 15], 18) ^
        (words[index - 15] >>> 3);
      const s1 =
        rightRotate(words[index - 2], 17) ^
        rightRotate(words[index - 2], 19) ^
        (words[index - 2] >>> 10);
      words[index] = (words[index - 16] + s0 + words[index - 7] + s1) >>> 0;
    }

    let [a, b, c, d, e, f, g, h] = hash;

    for (let index = 0; index < 64; index += 1) {
      const s1 = rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25);
      const choice = (e & f) ^ (~e & g);
      const temp1 = (h + s1 + choice + SHA256_K[index] + words[index]) >>> 0;
      const s0 = rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22);
      const majority = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (s0 + majority) >>> 0;

      h = g;
      g = f;
      f = e;
      e = (d + temp1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) >>> 0;
    }

    hash[0] = (hash[0] + a) >>> 0;
    hash[1] = (hash[1] + b) >>> 0;
    hash[2] = (hash[2] + c) >>> 0;
    hash[3] = (hash[3] + d) >>> 0;
    hash[4] = (hash[4] + e) >>> 0;
    hash[5] = (hash[5] + f) >>> 0;
    hash[6] = (hash[6] + g) >>> 0;
    hash[7] = (hash[7] + h) >>> 0;
  }

  const output = new Uint8Array(32);
  const outputView = new DataView(output.buffer);
  hash.forEach((value, index) => {
    outputView.setUint32(index * 4, value, false);
  });
  return output;
};

const hmacSha256Bytes = (keyBytes: Uint8Array, messageBytes: Uint8Array) => {
  const blockSize = 64;
  let normalizedKey = keyBytes;

  if (normalizedKey.length > blockSize) {
    normalizedKey = sha256Bytes(normalizedKey);
  }

  if (normalizedKey.length < blockSize) {
    const paddedKey = new Uint8Array(blockSize);
    paddedKey.set(normalizedKey);
    normalizedKey = paddedKey;
  }

  const outerPad = new Uint8Array(blockSize);
  const innerPad = new Uint8Array(blockSize);

  for (let index = 0; index < blockSize; index += 1) {
    outerPad[index] = normalizedKey[index] ^ 0x5c;
    innerPad[index] = normalizedKey[index] ^ 0x36;
  }

  const innerInput = new Uint8Array(innerPad.length + messageBytes.length);
  innerInput.set(innerPad);
  innerInput.set(messageBytes, innerPad.length);

  const innerHash = sha256Bytes(innerInput);
  const outerInput = new Uint8Array(outerPad.length + innerHash.length);
  outerInput.set(outerPad);
  outerInput.set(innerHash, outerPad.length);

  return sha256Bytes(outerInput);
};

export const sha256Hex = async (input: string) => toHex(sha256Bytes(encoder.encode(input)));

export const hmacSha256Hex = async (secret: string, input: string) =>
  toHex(hmacSha256Bytes(encoder.encode(secret), encoder.encode(input)));

export const buildCanonicalQuery = (params?: Record<string, unknown>) => {
  if (!params) {
    return '';
  }

  const parts = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && !Array.isArray(value))
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${encodeQueryValue(key)}=${encodeQueryValue(String(value))}`);

  return parts.join('&');
};

export const buildSigningString = ({
  method,
  requestPath,
  canonicalQuery,
  bodySha256,
  timestamp,
  nonce,
  apiId,
}: {
  method: string;
  requestPath: string;
  canonicalQuery: string;
  bodySha256: string;
  timestamp: string;
  nonce: string;
  apiId: string;
}) =>
  [
    method.toUpperCase(),
    requestPath,
    canonicalQuery,
    bodySha256,
    timestamp,
    nonce,
    apiId,
  ].join('\n');

const buildNonce = () => {
  const bytes = new Uint8Array(16);
  if (globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(bytes);
  } else {
    for (let index = 0; index < bytes.length; index += 1) {
      bytes[index] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(bytes)
    .map((value) => value.toString(16).padStart(2, '0'))
    .join('');
};

export const buildNodeControlHeaders = async ({
  method,
  requestPath,
  params,
  body,
  apiId,
  apiSecret,
}: {
  method: string;
  requestPath: string;
  params?: Record<string, unknown>;
  body?: unknown;
  apiId: string;
  apiSecret: string;
}) => {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = buildNonce();
  const serializedBody =
    body === undefined || method.toUpperCase() === 'GET' ? '' : JSON.stringify(body);
  const canonicalQuery = buildCanonicalQuery(params);
  const bodySha256 = await sha256Hex(serializedBody);
  const signingString = buildSigningString({
    method,
    requestPath,
    canonicalQuery,
    bodySha256,
    timestamp,
    nonce,
    apiId,
  });
  const signature = await hmacSha256Hex(apiSecret, signingString);

  return {
    'X-API-ID': apiId,
    'X-Timestamp': timestamp,
    'X-Nonce': nonce,
    'X-Body-SHA256': bodySha256,
    'X-Signature': signature,
  };
};
