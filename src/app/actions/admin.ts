"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  clearAdminSession,
  createAdminSession,
  getAdminPassword,
  isAdminSession,
} from "@/lib/admin-session";
import { saveMatchAccess } from "@/lib/match-config-store";

export async function adminLoginAction(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  if (password !== getAdminPassword()) {
    return { ok: false as const, error: "Неверный пароль администратора." };
  }
  await createAdminSession();
  return { ok: true as const };
}

export async function adminLogoutAction() {
  await clearAdminSession();
  redirect("/admin");
}

export async function saveMatchAccessAction(formData: FormData) {
  if (!(await isAdminSession())) {
    return { ok: false as const, error: "Нужен вход в админку." };
  }

  try {
    await saveMatchAccess({
      tournamentId: String(formData.get("tournamentId") ?? ""),
      roomId: String(formData.get("roomId") ?? ""),
      password: String(formData.get("password") ?? ""),
      joinUrl: String(formData.get("joinUrl") ?? "") || undefined,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Не удалось сохранить";
    return { ok: false as const, error: message };
  }

  revalidatePath("/admin");
  revalidatePath("/account");
  revalidatePath("/tournaments");
  revalidatePath(`/tournaments/${String(formData.get("tournamentId") ?? "")}`);

  return { ok: true as const };
}
