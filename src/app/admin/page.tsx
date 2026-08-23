import { adminLogoutAction } from "@/app/actions/admin";
import { AdminLoginForm } from "@/components/AdminLoginForm";
import { AdminMatchForm } from "@/components/AdminMatchForm";
import { isAdminSession } from "@/lib/admin-session";
import { getAllMatchAccess } from "@/lib/match-config-store";
import { getTournaments } from "@/lib/tournament-store";

export const metadata = { title: "Админка" };

export default async function AdminPage() {
  const isAdmin = await isAdminSession();

  if (!isAdmin) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-6xl items-center justify-center px-4 py-16 sm:px-6">
        <AdminLoginForm />
      </div>
    );
  }

  const tournaments = await getTournaments();
  const configs = await getAllMatchAccess();

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Админка матчей</h1>
          <p className="mt-2 text-sm text-zinc-500">
            Один раз введите Room ID и пароль — все оплатившие игроки увидят их на
            странице турнира и в кабинете.
          </p>
        </div>
        <form action={adminLogoutAction}>
          <button type="submit" className="btn-secondary">
            Выйти
          </button>
        </form>
      </div>

      <div className="mt-10">
        <AdminMatchForm tournaments={tournaments} configs={configs} />
      </div>
    </div>
  );
}
