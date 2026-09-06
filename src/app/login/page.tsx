import { loginAction } from "@/app/actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const params = await searchParams;
  const next = params.next ?? "/";

  return (
    <main className="flex min-h-dvh items-center justify-center bg-neutral-50 px-6 dark:bg-neutral-950">
      <form action={loginAction} className="w-full max-w-xs space-y-5">
        <div className="space-y-1 text-center">
          <h1 className="text-xl font-medium text-neutral-900 dark:text-neutral-100">Hábitos</h1>
          <p className="text-sm text-neutral-500">Introduce tu código para entrar</p>
        </div>

        <input type="hidden" name="next" value={next} />
        <input
          type="password"
          inputMode="numeric"
          name="passcode"
          autoFocus
          required
          placeholder="••••••"
          className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-center text-lg tracking-widest text-neutral-900 outline-none focus:border-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:focus:border-neutral-300"
        />

        {params.error && (
          <p className="text-center text-sm text-red-500">Código incorrecto.</p>
        )}

        <button
          type="submit"
          className="w-full rounded-xl bg-neutral-900 py-3 text-sm font-medium text-white transition hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
        >
          Entrar
        </button>
      </form>
    </main>
  );
}
