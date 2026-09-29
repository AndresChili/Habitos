import { loginAction } from "@/app/actions";
import InstallButton from "@/components/InstallButton";
import { IconHabits } from "@/components/icons";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const params = await searchParams;
  const next = params.next ?? "/";

  return (
    <main className="flex min-h-dvh items-center justify-center bg-bg px-6">
      <div className="w-full max-w-xs space-y-8">
        <form action={loginAction} className="space-y-5">
          <div className="space-y-2 text-center">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-accent-soft text-accent">
              <IconHabits className="h-6 w-6" />
            </div>
            <h1 className="text-xl font-semibold text-text">Hábitos</h1>
            <p className="text-sm text-text-muted">Introduce tu código para entrar</p>
          </div>

          <input type="hidden" name="next" value={next} />
          <input
            type="password"
            inputMode="numeric"
            name="passcode"
            autoFocus
            required
            placeholder="••••••"
            className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-center text-lg tracking-widest text-text outline-none transition focus:border-accent"
          />

          {params.error && <p className="text-center text-sm text-danger">Código incorrecto.</p>}

          <button
            type="submit"
            className="w-full rounded-xl bg-accent py-3 text-sm font-medium text-accent-on transition hover:bg-accent-strong"
          >
            Entrar
          </button>
        </form>

        <InstallButton />
      </div>
    </main>
  );
}
