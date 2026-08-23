"use server";

import { createSession, clearSession } from "@/lib/session";
import { findOrCreateUser } from "@/lib/user-store";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const nickname = String(formData.get("nickname") ?? "").trim();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false as const, error: "Введите корректный email." };
  }
  if (nickname.length > 0 && nickname.length < 2) {
    return { ok: false as const, error: "Ник должен быть не короче 2 символов." };
  }

  try {
    const user = await findOrCreateUser(email, nickname);
    await createSession({
      userId: user.id,
      email: user.email,
      nickname: user.nickname,
    });
    return { ok: true as const };
  } catch {
    return {
      ok: false as const,
      error: "Не удалось войти. Проверьте, что сервер может сохранять данные.",
    };
  }
}

export async function logoutAction() {
  await clearSession();
  return { ok: true as const };
}
