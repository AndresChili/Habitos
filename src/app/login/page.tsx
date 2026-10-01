import Link from "next/link";
import { loginAction } from "@/app/actions";
import InstallButton from "@/components/InstallButton";
import { IconHabits } from "@/components/icons";

const ERRORS: Record<string, string> = {
  "1": "Email o contraseña incorrectos.",
  rate: "Demasiados intentos. Prueba de nuevo en unos minutos.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const params = await searchParams;
  const next = params.next ?? "/";
  const errorMessage = params.error ? ERRORS[params.error] ?? ERRORS["1"] : undefined;

  return (
    <main className="flex min-h-dvh items-center justify-center bg-bg px-6">
      <div className="w-full max-w-xs space-y-8">
        <form
          action={loginAction}
          className="space-y-5 rounded-2xl border border-border bg-surface p-6 shadow-sm shadow-black/[0.04]"
        >
          <div className="space-y-2 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-soft text-accent shadow-sm shadow-black/[0.03]">
              <IconHabits className="h-6 w-6" />
            </div>
            <h1 className="text-xl font-semibold tracking-tight text-text">Hábitos</h1>
            <p className="text-sm text-text-muted">Inicia sesión para continuar</p>
          </div>

          <input type="hidden" name="next" value={next} />

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
              autoComplete="current-password"
              required
              placeholder="Contraseña"
              className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text outline-none transition-colors focus:border-accent"
            />
          </div>

          {errorMessage && <p className="text-center text-sm text-danger">{errorMessage}</p>}

          <button
            type="submit"
            className="w-full rounded-xl bg-accent py-3 text-sm font-semibold text-accent-on shadow-sm shadow-black/10 transition-all active:scale-[0.98] hover:bg-accent-strong"
          >
            Entrar
          </button>

          <p className="text-center text-sm text-text-faint">
            ¿No tienes cuenta?{" "}
            <Link href="/register" className="font-medium text-accent hover:text-accent-strong">
              Crea una
            </Link>
          </p>
        </form>

        <InstallButton />
      </div>
    </main>
  );
}
