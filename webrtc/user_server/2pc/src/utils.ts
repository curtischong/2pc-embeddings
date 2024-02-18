import { getRandomValues } from "crypto";
import { Bit } from "./circuit/garble";
import webcrypto from "crypto";

export function bufferToBigInt(buffer: Buffer): bigint {
  return BigInt("0x" + buffer.toString("hex"));
}

export function bigIntToBuffer(bigint: bigint): Buffer {
  return Buffer.from(bigint.toString(16), "hex");
}

export function getJwkInt(param: string): bigint {
  return bufferToBigInt(Buffer.from(param, "base64url"));
}

export function cartesianProduct(...a: unknown[][]): any[] {
  return a.reduce((a, b) => a.flatMap((d) => b.map((e) => [d, e].flat())));
}

export function secureShuffle(array: unknown[]) {
  for (let i = array.length - 1; i > 0; i--) {
    const buf = new Uint8Array(1);
    window.crypto.getRandomValues(buf);
    const j = Math.floor((buf[0] / 2 ** 8) * i);
    const temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
}

export function getNthBit(number: number, n: number): Bit {
  return (number & (1 << n)) > 0 ? 1 : 0;
}

export function getLeastSignificantBit(buffer: Buffer): Bit {
  const lastByte = buffer[buffer.byteLength - 1];
  return getNthBit(lastByte, 0) as Bit;
}

// function base64UrlToBase64(base64url:string) {
//   // Replace URL-safe characters with their standard counterparts
//   let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
//   // Add padding if necessary
//   let paddingNeeded = (4 - (base64.length % 4)) % 4;
//   base64 += "=".repeat(paddingNeeded);
//   return base64;
// }

// export function base64ToBigInt(base64Str:string) {
//   return getJwkInt(base64UrlToBase64(base64Str));
// }

// export function b64ToBn(b64) {
//   var bin = atob(b64);
//   var hex = [];

//   bin.split('').forEach(function (ch) {
//     var h = ch.charCodeAt(0).toString(16);
//     if (h.length % 2) { h = '0' + h; }
//     hex.push(h);
//   });

//   return BigInt('0x' + hex.join(''));
// }


// Helper function to decode base64url to base64
function base64urlToBase64(base64url) {
  // Replace URL-friendly characters with regular base64 characters
  base64url = base64url.replace(/-/g, '+').replace(/_/g, '/');
  // Pad with equals signs to make the length a multiple of 4
  while (base64url.length % 4) {
    base64url += '=';
  }
  return base64url;
}

// Function to convert base64url-encoded string to a BigInt
export function base64urlToBigInt(base64url) {
  // Decode base64url to base64 then to binary string
  const base64 = base64urlToBase64(base64url);
  const binaryString = atob(base64);

  // Convert binary string to a hexadecimal string
  let hex = '';
  for (let i = 0; i < binaryString.length; i++) {
    const byteHex = binaryString.charCodeAt(i).toString(16).padStart(2, '0');
    hex += byteHex;
  }

  // Convert hexadecimal string to BigInt
  return BigInt(`0x${hex}`);
}


// check that the RSA is legit

// Function to verify RSA parameters e, N, and d
export function verifyRSA(e, N, d) {
  // Example message m
  const m = BigInt(123); // Choose a small test message
  
  // Encrypt the message
  const c = modPow(m, e, N);
  
  // Decrypt the message
  const mDecrypted = modPow(c, d, N);
  
  // Check if decryption gives back the original message
  if (m === mDecrypted) {
      console.log("RSA parameters are correct.");
  } else {
      console.log("RSA parameters are incorrect.");
  }
}

// Function to perform modular exponentiation (m^e mod N)
function modPow(base, exponent, modulus) {
  if (modulus === BigInt(1)) return BigInt(0);
  var result = BigInt(1);
  base = base % modulus;
  while (exponent > 0) {
      if (exponent % BigInt(2) === BigInt(1))
          result = (result * base) % modulus;
      exponent = exponent >> BigInt(1);
      base = (base * base) % modulus;
  }
  return result;
}