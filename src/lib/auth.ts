import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { and, eq, gt, isNull } from "drizzle-orm";
import { db, schema } from "./db";
import { env } from "./env";
import { randomToken, sha256 } from "./tokens";
export { randomToken, sha256 };

const COOKIE = "rr_session";
const SESSION_DAYS = 30;
const LINK_MINUTES = 30;

const key = () => new TextEncoder().encode(env.SESSION_SECRET);

/** Creates a single-use sign-in link for a parent. */
export async function createLoginLink(parentId: string, next = "/account"): Promise<string> {
  const token = randomToken();
  await db.insert(schema.loginTokens).values({
    tokenHash: sha256(token),
    parentId,
    expiresAt: new Date(Date.now() + LINK_MINUTES * 60_000),
  });
  const url = new URL("/auth/verify", env.APP_URL);
  url.searchParams.set("t", token);
  url.searchParams.set("next", next);
  return url.toString();
}

/** Consumes a sign-in token. Returns the parent id, or null if invalid/expired/used. */
export async function consumeLoginToken(token: string): Promise<string | null> {
  const [row] = await db
    .update(schema.loginTokens)
    .set({ usedAt: new Date() })
    .where(
      and(
        eq(schema.loginTokens.tokenHash, sha256(token)),
        isNull(schema.loginTokens.usedAt),
        gt(schema.loginTokens.expiresAt, new Date()),
      ),
    )
    .returning({ parentId: schema.loginTokens.parentId });
  return row?.parentId ?? null;
}

export async function startSession(parentId: string) {
  const jwt = await new SignJWT({ sub: parentId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(key());
  (await cookies()).set(COOKIE, jwt, {
    httpOnly: true,
    secure: env.APP_URL.startsWith("https"),
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 86400,
  });
}

export async function endSession() {
  (await cookies()).delete(COOKIE);
}

export async function currentParentId(): Promise<string | null> {
  const jwt = (await cookies()).get(COOKIE)?.value;
  if (!jwt) return null;
  try {
    const { payload } = await jwtVerify(jwt, key());
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}

export async function currentParent() {
  const id = await currentParentId();
  if (!id) return null;
  return (await db.query.parents.findFirst({ where: eq(schema.parents.id, id) })) ?? null;
}
