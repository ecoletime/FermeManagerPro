import crypto from "node:crypto";

const TOKEN_TTL_SECONDS = 60 * 60 * 12;

export interface TokenPayload {
  sub: number;
  username: string;
  role: string;
}

interface SignedPayload extends TokenPayload {
  iat: number;
  exp: number;
}

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }
  return secret;
}

function base64url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64url");
}

function sign(data: string): string {
  return crypto.createHmac("sha256", getSecret()).update(data).digest("base64url");
}

export function signToken(payload: TokenPayload): string {
  const now = Math.floor(Date.now() / 1000);
  const body: SignedPayload = { ...payload, iat: now, exp: now + TOKEN_TTL_SECONDS };
  const encoded = base64url(JSON.stringify(body));
  return `${encoded}.${sign(encoded)}`;
}

export function verifyToken(token: string): TokenPayload | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [encoded, signature] = parts;
  const expected = sign(encoded);
  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }
  try {
    const decoded = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as SignedPayload;
    if (typeof decoded.exp !== "number" || decoded.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return { sub: decoded.sub, username: decoded.username, role: decoded.role };
  } catch {
    return null;
  }
}
