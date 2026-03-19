import { ReactNode } from "react";

export function AuthShell({
  title,
  subtitle,
  error,
  children,
}: {
  title: string;
  subtitle?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-8 px-4 py-16">
      <div className="text-primary text-lg font-mono font-semibold tracking-tight">
        Validator 3000
      </div>
      <section className="w-full max-w-[480px] border border-border rounded-lg bg-bg-secondary p-6">
        <div className="flex flex-col gap-4">
          <header className="flex flex-col gap-1">
            <h1 className="m-0 text-xl font-semibold text-primary">{title}</h1>
            {subtitle ? <p className="m-0 text-sm text-tertiary">{subtitle}</p> : null}
          </header>
          {error ? (
            <div className="rounded border border-error/30 bg-error/10 px-3 py-2 text-sm text-error">
              {error}
            </div>
          ) : null}
          {children}
        </div>
      </section>
    </main>
  );
}
