import Link from "next/link";
import { registerAction } from "@/app/actions";
import { IconHabits } from "@/components/icons";

const ERRORS: Record<string, string> = {
  email: "Introduce un email válido.",
  weak: "La contraseña debe tener al menos 8 caracteres.",
  match: "Las contraseñas no coinciden.",
  exists: "Ya existe una cuenta con ese email.",
  rate: "Demasiados intentos. Prueba de nuevo en unos minutos.",
};

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const errorMessage = params.error ? ERRORS[params.error] : undefined;

  return (
    <main className="flex min-h-dvh items-center justify-center bg-bg px-6">
      <div className="w-full max-w-xs space-y-8">
        <form
          action={registerAction}
          className="space-y-5 rounded-2xl border border-border bg-surface p-6 shadow-card"
        >
          <div className="space-y-2 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-accent-2 text-accent-on shadow-glow">
              <IconHabits className="h-6 w-6" />
            </div>
            <h1 className="text-xl font-semibold tracking-tight text-text">Crear cuenta</h1>
            <p className="text-sm text-text-muted">Tus datos quedan aislados de los de cualquier otra cuenta</p>
          </div>

          <div className="space-y-3">
            <input
              type="email"
              name="email"
              autoComplete="email"
              autoFocus
              required
              placeholder="Email"
              className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text outline-none transition-colors focus:border-accent"
            />
            <input
              type="password"
              name="password"
              autoComplete="new-password"
              required
              minLength={8}
              placeholder="Contraseña (mínimo 8 caracteres)"
              className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text outline-none transition-colors focus:border-accent"
            />
            <input
              type="password"
              name="confirm"
              autoComplete="new-password"
              required
              minLength={8}
              placeholder="Repite la contraseña"
              className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text outline-none transition-colors focus:border-accent"
            />
          </div>

          {errorMessage && <p className="text-center text-sm text-danger">{errorMessage}</p>}

          <button
            type="submit"
            className="w-full rounded-xl bg-gradient-to-br from-accent to-accent-2 py-3 text-sm font-semibold text-accent-on shadow-glow transition-all active:scale-[0.98] hover:brightness-110"
          >
            Crear cuenta
          </button>

          <p className="text-center text-sm text-text-faint">
            ¿Ya tienes cuenta?{" "}
            <Link href="/login" className="font-medium text-accent hover:text-accent-strong">
              Inicia sesión
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}
