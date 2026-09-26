import Link from "next/link";
import {
  MessageSquare, CheckCircle, ArrowRight, Bot,
  CalendarCheck, Mail, Sparkles, ShieldCheck, Clock, Zap, TrendingUp
} from "lucide-react";

export const metadata = {
  title: "SmarterBOT — CRM + WhatsApp + IA",
  description: "Automatiza ventas, atención y seguimiento con WhatsApp, CRM e Inteligencia Artificial.",
};

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/30 selection:text-foreground">
      {/* NAV */}
      <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm shadow-primary/20">
              <Bot className="h-5 w-5" />
            </div>
            <span className="text-base font-bold tracking-tight">SmarterBOT</span>
          </Link>
          <div className="flex items-center gap-1.5">
            <Link href="/login" className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              Ingresar al CRM
            </Link>
            <Link href="#contact" className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-3.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 shadow-sm shadow-primary/20 transition-colors">
              Agendar demo <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--primary-soft)_0%,_transparent_60%)]" />
        <div className="mx-auto max-w-6xl px-6 pt-24 pb-16 text-center md:pt-32 md:pb-24">
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl md:text-7xl md:leading-[1.15]">
            CRM + WhatsApp + <span className="text-primary">IA</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl md:leading-relaxed">
            Agenda una demostración gratuita. Automatiza ventas, atención al cliente y seguimiento comercial con WhatsApp, CRM e Inteligencia Artificial.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="#contact" className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-3.5 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90 transition-colors">
              Agendar demostración <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="#pricing" className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-8 py-3.5 text-sm font-semibold text-foreground hover:bg-muted transition-colors">
              Ver plan
            </Link>
          </div>
          <p className="mt-5 text-xs text-muted-foreground">7 días gratis, sin tarjeta</p>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section className="mx-auto max-w-6xl px-6 py-16 md:py-24">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Un embudo comercial completo</h2>
          <p className="mt-4 text-muted-foreground">SmarterBOT convierte conversaciones y formularios en reuniones comerciales, seguimiento y clientes activos.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-4 md:gap-8">
          {[
            { n: "1", title: "Formulario", desc: "El cliente deja nombre, empresa, WhatsApp, email y necesidad principal." },
            { n: "2", title: "Lead", desc: "SmarterBOT registra el contacto, clasifica el interés y crea el lead." },
            { n: "3", title: "Agenda", desc: "El sistema propone horarios y confirma la cita por WhatsApp." },
            { n: "4", title: "Venta", desc: "Después de la demo, seguimiento, propuesta, pago y cliente activo." },
          ].map((step) => (
            <div key={step.n} className="group relative rounded-2xl border border-border bg-card p-7 shadow-sm hover:shadow-md transition-shadow">
              <div className="absolute -top-4 left-6 flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-extrabold text-primary-foreground shadow-md shadow-primary/25">{step.n}</div>
              <h3 className="mt-3 text-lg font-bold text-foreground">{step.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FUNCIONALIDADES */}
      <section className="mx-auto max-w-6xl px-6 py-16 md:py-24 border-t border-border">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">La infraestructura existe para vender más</h2>
          <p className="mt-4 text-muted-foreground">No para acumular integraciones.</p>
        </div>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: MessageSquare, title: "WhatsApp conectado a tu negocio", desc: "Captura conversaciones reales y conviértelas en oportunidades comerciales." },
            { icon: ShieldCheck, title: "CRM para seguimiento de clientes", desc: "Ordena personas, interacciones, leads y citas en una fuente de verdad." },
            { icon: CalendarCheck, title: "Agendamiento automático", desc: "Pasa de interés a reunión confirmada sin depender de planillas manuales." },
            { icon: Mail, title: "Correos y campañas automatizadas", desc: "Confirma demos, envía recordatorios y activa seguimientos por email." },
            { icon: Sparkles, title: "IA y agentes inteligentes", desc: "Clasifica intenciones, prioriza oportunidades y reduce trabajo repetitivo." },
            { icon: Zap, title: "Implementación rápida", desc: "Un sistema práctico para vender, atender y medir conversiones desde el primer día." },
          ].map((f, i) => (
            <div key={i} className="rounded-2xl border border-border bg-card p-8 shadow-sm hover:shadow-md transition-all">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-sm font-medium text-primary-foreground">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-3 text-base font-bold text-foreground">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PRECIOS */}
      <section id="pricing" className="mx-auto max-w-6xl px-6 py-16 md:py-24 border-t border-border">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Oferta comercial</h2>
          <p className="mt-4 text-muted-foreground">Un producto único para negocios que necesitan capturar, ordenar y convertir oportunidades desde WhatsApp.</p>
        </div>
        <div className="mx-auto max-w-md">
          <div className="rounded-3xl border-2 border-primary/30 bg-card p-8 shadow-xl shadow-primary/5">
            <div className="mb-2 text-xs font-bold uppercase text-primary">Plan Profesional</div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-5xl font-extrabold text-foreground">$19.500</span>
              <span className="text-lg text-muted-foreground">CLP + IVA / mes</span>
            </div>
            <ul className="mt-6 space-y-3">
              {[
                "CRM comercial",
                "WhatsApp Business integrado",
                "Agenda online y recordatorios",
                "Automatizaciones y formularios",
                "Email marketing y soporte",
              ].map((feat) => (
                <li key={feat} className="flex items-start gap-3 text-sm text-muted-foreground">
                  <CheckCircle className="mt-0.5 h-4 w-4 text-primary" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6 rounded-xl bg-primary/5 p-4 text-sm text-muted-foreground">
              <span className="font-bold text-foreground">Promoción anual</span> — Paga 10 recibe 12 meses. 2 meses gratis con código SMARTER.
            </div>
            <div className="mt-8 flex flex-col gap-3">
              <Link href="#contact" className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-base font-bold text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 transition-colors">
                Agendar demostración
              </Link>
              <Link href="#pricing" className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-6 py-3 text-sm font-medium text-foreground hover:bg-muted transition-colors">
                Ver planes completos
              </Link>
            </div>
            <div className="mt-4 text-center text-xs text-muted-foreground">Implementación guiada · 7 días gratis sin tarjeta</div>
          </div>
        </div>
      </section>

      {/* MÉTRICAS */}
      <section className="mx-auto max-w-6xl px-6 py-16 md:py-24 border-t border-border">
        <div className="grid gap-8 md:grid-cols-3 md:gap-6">
          {[
            { num: "50", label: "clientes = $975.000 MRR" },
            { num: "100", label: "clientes = $1.950.000 MRR" },
            { num: "250", label: "clientes = $4.875.000 MRR" },
          ].map((m) => (
            <div key={m.num} className="rounded-2xl border border-border bg-card p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="text-4xl font-black text-primary tracking-tight">{m.num}</div>
              <div className="mt-3 text-base font-semibold text-foreground">{m.label}</div>
              <div className="mt-1 text-xs text-muted-foreground">Objetivo: convertir CTA en lead → lead en demo → demo en pago → cliente activo</div>
            </div>
          ))}
        </div>
      </section>

      {/* DEMO FORM */}
      <section id="contact" className="mx-auto max-w-xl px-6 py-16 md:py-24 border-t border-border">
        <div className="rounded-3xl border border-border bg-card p-8 shadow-xl shadow-black/5">
          <h2 className="text-2xl font-extrabold tracking-tight text-foreground">Solicita tu demo</h2>
          <p className="mt-2 text-sm text-muted-foreground">Completa el formulario y SmarterBOT iniciará el flujo: lead, appointment, WhatsApp, email y confirmación.</p>
          <form className="mt-7 flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <input placeholder="Nombre" required className="h-11 rounded-lg border border-border bg-background px-3.5 text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-primary/20" />
              <input placeholder="Empresa" className="h-11 rounded-lg border border-border bg-background px-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all" />
              <input placeholder="WhatsApp (ej: +56 9 7954 0471)" className="h-11 rounded-lg border border-border bg-background px-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all" />
              <input placeholder="Correo electrónico" type="email" required className="h-11 rounded-lg border border-border bg-background px-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all" />
              <select className="h-11 rounded-lg border border-border bg-background px-3.5 text-sm text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all">
                <option>Necesidad principal</option>
                <option>CRM</option>
                <option>WhatsApp</option>
                <option>Agenda</option>
                <option>Automatización</option>
              </select>
              <button type="button" className="h-11 rounded-xl bg-primary text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
                Agendar demostración
              </button>
            </div>
            <p className="text-xs text-muted-foreground text-center">Al enviar, el sistema registra el lead y activa seguimiento comercial por WhatsApp y email.</p>
          </form>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border bg-card/50 py-10">
        <div className="mx-auto max-w-6xl px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm shadow-primary/20">
              <Bot className="h-4 w-4" />
            </div>
            <span className="text-sm font-bold">SmarterBOT</span>
          </div>
          <p className="text-xs text-muted-foreground">CRM + WhatsApp + Agenda + IA · Implementación guiada</p>
          <Link href="/login" className="text-sm font-medium text-primary hover:text-primary/80 transition-colors">Ingresar al CRM</Link>
        </div>
      </footer>
    </main>
  );
}