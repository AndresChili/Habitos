import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/dal";
import { changePasswordAction, logoutAction } from "@/app/actions";
import { IconLogout } from "@/components/icons";
import ThemeToggle from "@/components/ThemeToggle";

export const dynamic = "force-dynamic";

const ERRORS: Record<string, string> = {
  current: "Contraseña actual incorrecta.",
  weak: "La nueva contraseña debe tener al menos 8 caracteres.",
  match: "Las contraseñas nuevas no coinciden.",
};

export default async function CuentaPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  const userId = await requireUserId();
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { email: true } });
  const params = await searchParams;
  const errorMessage = params.error ? ERRORS[params.error] : undefined;

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-text">Cuenta</h1>
        <p className="text-sm text-text-muted">{user.email}</p>
      </header>

      <section className="space-y-2.5">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-text-faint">Apariencia</h2>
        <ThemeToggle />
      </section>

      <section className="space-y-2.5">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-text-faint">Cambiar contraseña</h2>
        <form
          action={changePasswordAction}
          className="space-y-3 rounded-2xl border border-border bg-surface p-4 shadow-sm shadow-black/[0.03]"
        >
          <input
            type="password"
            name="currentPassword"
            autoComplete="current-password"
            required
            placeholder="Contraseña actual"
            className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text outline-none transition-colors focus:border-accent"
          />
          <input
            type="password"
            name="newPassword"
            autoComplete="new-password"
            required
            minLength={8}
            placeholder="Nueva contraseña (mínimo 8 caracteres)"
            className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text outline-none transition-colors focus:border-accent"
          />
          <input
            type="password"
            name="confirm"
            autoComplete="new-password"
            required
            minLength={8}
            placeholder="Repite la nueva contraseña"
            className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text outline-none transition-colors focus:border-accent"
          />

          {errorMessage && <p className="text-sm text-danger">{errorMessage}</p>}
          {params.ok && <p className="text-sm text-accent-strong">Contraseña actualizada.</p>}

          <button
            type="submit"
            className="w-full rounded-xl bg-accent py-3 text-sm font-semibold text-accent-on shadow-sm shadow-black/10 transition-all active:scale-[0.98] hover:bg-accent-strong"
          >
            Actualizar contraseña
          </button>
        </form>
      </section>

      <section>
        <form action={logoutAction}>
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-surface py-3 text-sm font-semibold text-text-muted shadow-sm shadow-black/[0.03] transition-all active:scale-[0.98] hover:text-text"
          >
            <IconLogout className="h-4 w-4" />
            Cerrar sesión
          </button>
        </form>
      </section>
    </div>
  );
}
