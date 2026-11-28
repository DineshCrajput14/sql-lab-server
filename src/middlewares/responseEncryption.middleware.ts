
import { Request, Response, NextFunction } from "express";
import { createCipheriv, randomBytes } from "crypto";
import { env } from "../config/env.config";

const keyHex = env.API_RESPONSE_ENCRYPTION_KEY;

// Validate encryption key at startup when encryption is enabled
if (
  env.ENCRYPT_API_RESPONSE &&
  !/^[0-9a-fA-F]{64}$/.test(keyHex)
) {
  throw new Error(
    "Invalid API_RESPONSE_ENCRYPTION_KEY. A 32-byte hexadecimal key is required."
  );
}

export function responseEncryptionMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {

console.log("========== ENCRYPTION DEBUG ==========");
console.log("ENCRYPT_API_RESPONSE:", env.ENCRYPT_API_RESPONSE);
console.log(
  "X-Encrypt-Response:",
  req.header("X-Encrypt-Response")
);
console.log(
  "X-Skip-Response-Encryption:",
  req.header("X-Skip-Response-Encryption")
);

  const shouldEncrypt =
    env.ENCRYPT_API_RESPONSE &&
    req.header("X-Encrypt-Response") === "true" &&
    req.header("X-Skip-Response-Encryption") !== "true";

  if (!shouldEncrypt) {
    return next();
  }

  const originalJson = res.json.bind(res);

  (res as any).json = (body: any) => {
    if (body === undefined || res.headersSent) {
      return originalJson(body);
    }

    const iv = randomBytes(12);

    const cipher = createCipheriv(
      "aes-256-gcm",
      Buffer.from(keyHex, "hex"),
      iv
    );

    const plainText = Buffer.from(
      JSON.stringify(body),
      "utf8"
    );

    const encryptedData = Buffer.concat([
      cipher.update(plainText),
      cipher.final(),
      cipher.getAuthTag(),
    ]);

    res.setHeader("X-Response-Encrypted", "1");
    res.setHeader("Cache-Control", "no-store");

    return originalJson({
      __encrypted: true,
      iv: iv.toString("base64"),
      data: encryptedData.toString("base64"),
    });
  };

  next();
}
