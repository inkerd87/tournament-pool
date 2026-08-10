import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const COOKIE_NAME = "pa_session";

function getSecret() {
  return new TextEncoder().encode(
    process.env.AUTH_SECRET ?? "poolarena-dev-secret-change-me",
  );
}

export type SessionUser = {
  userId: string;
  email: string;
  nickname: string;
};

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    const userId = payload.userId;
    const email = payload.email;
    const nickname = payload.nickname;
    if (
      typeof userId !== "string" ||
      typeof email !== "string" ||
      typeof nickname !== "string"
    ) {
      return null;
    }
    return { userId, email, nickname };
  } catch {
    return null;
  }
}

export async function createSession(user: SessionUser) {
  const token = await new SignJWT({ ...user })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("30d")
    .sign(getSecret());

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
