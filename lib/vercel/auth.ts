import { createRemoteJWKSet, jwtVerify } from "jose";
import { JWTExpired, JWTInvalid } from "jose/errors";
import { NextRequest, NextResponse } from "next/server";
import { env } from "../env";

const JWKS = createRemoteJWKSet(
  new URL(`https://marketplace.vercel.com/.well-known/jwks`),
);

export interface OidcClaims {
  sub: string;
  aud: string;
  iss: string;
  exp: number;
  iat: number;
  account_id: string;
  installation_id: string;
  user_id: string;
  user_role: string;
  user_name?: string;
  user_avatar_url?: string;
}

// Dev-mode mock claims for local testing without a real JWT
// Use header: X-Dev-Installation-Id to specify the installation ID
function getDevModeClaims(req: NextRequest): OidcClaims | null {
  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  const devInstallationId = req.headers.get("X-Dev-Installation-Id");
  if (!devInstallationId) {
    return null;
  }

  console.log("[DEV MODE] Using mock claims for installation:", devInstallationId);
  return {
    sub: "dev:user:123",
    aud: env.INTEGRATION_CLIENT_ID,
    iss: "https://marketplace.vercel.com",
    exp: Math.floor(Date.now() / 1000) + 3600,
    iat: Math.floor(Date.now() / 1000),
    account_id: "dev_account_123",
    installation_id: devInstallationId,
    user_id: "dev_user_123",
    user_role: "ADMIN",
    user_name: "Dev User",
  };
}

export function withAuth(
  callback: (
    claims: OidcClaims,
    req: NextRequest,
    ...rest: any[]
  ) => Promise<Response>,
): (req: NextRequest, ...rest: any[]) => Promise<Response> {
  return async (req: NextRequest, ...rest: any[]): Promise<Response> => {
    try {
      // Check for dev mode bypass first
      const devClaims = getDevModeClaims(req);
      if (devClaims) {
        return callback(devClaims, req, ...rest);
      }

      const token = getAuthorizationToken(req);
      const claims = await verifyToken(token);

      return callback(claims, req, ...rest);
    } catch (err) {
      if (err instanceof AuthError) {
        return new NextResponse(err.message, { status: 403 });
      }

      throw err;
    }
  };
}

export async function verifyToken(token: string): Promise<OidcClaims> {
  try {
    const { payload: claims } = await jwtVerify<OidcClaims>(token, JWKS);

    if (claims.aud !== env.INTEGRATION_CLIENT_ID) {
      throw new AuthError("Invalid audience");
    }

    if (claims.iss !== "https://marketplace.vercel.com") {
      throw new AuthError("Invalid issuer");
    }

    return claims;
  } catch (err) {
    if (err instanceof JWTExpired) {
      throw new AuthError("Auth expired");
    }

    if (err instanceof JWTInvalid) {
      throw new AuthError("Auth invalid");
    }

    throw err;
  }
}

function getAuthorizationToken(req: Request): string {
  const authHeader = req.headers.get("Authorization");
  const match = authHeader?.match(/^bearer (.+)$/i);

  if (!match) {
    throw new AuthError("Invalid Authorization header");
  }

  // For logging and fetching JWT for quick testing
  console.log("[DEBUG] Received JWT token:", match[1]);

  // Parse and log JWT payload (base64url decode the middle part)
  const [, payload] = match[1].split(".");
  const decoded = JSON.parse(Buffer.from(payload, "base64url").toString());
  console.log("[DEBUG] Decoded JWT claims:", decoded);

  return match[1];
}

class AuthError extends Error {}
