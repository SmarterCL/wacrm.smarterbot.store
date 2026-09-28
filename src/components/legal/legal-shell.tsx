import Link from 'next/link';
import { ArrowLeft, ArrowRight, Bot } from 'lucide-react';
import { LEGAL, LEGAL_NAV } from '@/lib/legal';

/**
 * Chrome de las páginas públicas legales.
 *
 * Repite los clases del nav/footer de `src/app/landing/page.tsx` para
 * que `/privacidad`, `/condiciones` y `/eliminacion` se vean como el
 * resto del producto sin importar un layout de dashboard (que exige
 * sesión) ni duplicar estilos.
 */
export function LegalShell({
  children,
  activeHref,
}: {
  children: React.ReactNode;
  activeHref: string;
}) {
  return (
    <main className="bg-background text-foreground selection:bg-primary/30 min-h-screen font-sans">
      <nav className="border-border bg-background/80 sticky top-0 z-50 border-b backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/landing" className="flex items-center gap-2.5">
            <div className="bg-primary text-primary-foreground shadow-primary/20 flex h-9 w-9 items-center justify-center rounded-lg shadow-sm">
              <Bot className="h-5 w-5" />
            </div>
            <span className="text-base font-bold tracking-tight">
              {LEGAL.producto}
            </span>
          </Link>
          <div className="hidden items-center gap-1.5 md:flex">
            {LEGAL_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  item.href === activeHref
                    ? 'bg-muted text-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
          <Link
            href="/landing#contact"
            className="bg-primary text-primary-foreground shadow-primary/20 hover:bg-primary/90 inline-flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-semibold shadow-sm transition-colors"
          >
            Agendar demo <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </nav>

      {children}

      <footer className="border-border bg-card/50 border-t py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 md:flex-row">
          <div className="flex items-center gap-2">
            <div className="bg-primary text-primary-foreground shadow-primary/20 flex h-8 w-8 items-center justify-center rounded-lg shadow-sm">
              <Bot className="h-4 w-4" />
            </div>
            <span className="text-sm font-bold">{LEGAL.producto}</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
            {LEGAL_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-muted-foreground hover:text-foreground text-xs font-medium transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </div>
          <p className="text-muted-foreground text-xs">
            {LEGAL.razonSocial} · RUT {LEGAL.rut} · Chile
          </p>
        </div>
      </footer>
    </main>
  );
}

/** Encabezado común de cada documento legal. */
export function LegalHeader({
  eyebrow,
  title,
  intro,
}: {
  eyebrow: string;
  title: string;
  intro: string;
}) {
  return (
    <section className="border-border relative overflow-hidden border-b">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--primary-soft)_0%,_transparent_60%)]" />
      <div className="mx-auto max-w-3xl px-6 pt-20 pb-14 text-left">
        <div className="text-primary text-xs font-bold tracking-wide uppercase">
          {eyebrow}
        </div>
        <h1 className="text-foreground mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">
          {title}
        </h1>
        <p className="text-muted-foreground mt-5 text-base leading-relaxed md:text-lg">
          {intro}
        </p>
        <p className="text-muted-foreground mt-5 text-xs">
          Última actualización: {LEGAL.actualizado}
        </p>
        <Link
          href="/landing"
          className="text-primary hover:text-primary/80 mt-6 inline-flex items-center gap-1.5 text-sm font-medium transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Volver al sitio
        </Link>
      </div>
    </section>
  );
}

/** Sección numerada del cuerpo del documento. */
export function LegalSection({
  index,
  title,
  children,
  id,
}: {
  index: number;
  title: string;
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <section id={id} className="border-border border-b py-10 last:border-b-0">
      <h2 className="text-foreground flex items-baseline gap-3 text-xl font-bold tracking-tight md:text-2xl">
        <span className="text-primary text-sm font-semibold">
          {String(index).padStart(2, '0')}
        </span>
        {title}
      </h2>
      <div className="text-muted-foreground mt-4 space-y-4 text-sm leading-relaxed md:text-[15px]">
        {children}
      </div>
    </section>
  );
}

/** Caja de énfasis para advertencias y links de acción. */
export function LegalCallout({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`border-primary/20 bg-primary/5 text-muted-foreground rounded-xl border p-5 text-sm leading-relaxed ${className}`}
    >
      {children}
    </div>
  );
}
