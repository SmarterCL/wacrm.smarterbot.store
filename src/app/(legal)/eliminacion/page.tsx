'use client';

import type { Metadata } from 'next';
import { useState } from 'react';
import { CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import {
  LegalCallout,
  LegalHeader,
  LegalSection,
  LegalShell,
} from '@/components/legal/legal-shell';
import { LEGAL } from '@/lib/legal';

// Metadata no se puede exportar desde un Client Component.
// Para SEO se define en un archivo separado o en el layout del grupo.
// En este caso el layout del grupo (legal) ya es suficiente; si se
// necesita metadata específica se puede convertir esta página a Server
// Component y extraer el formulario a un Client Component hijo.

type IdType = 'rut_cl' | 'passport' | 'other';
type Reason = 'arco_suppression' | 'account_closure' | 'meta_callback' | 'other';
type FormState = 'idle' | 'loading' | 'success' | 'error';

interface FormData {
  full_name: string;
  email: string;
  phone: string;
  id_type: IdType;
  id_value: string;
  reason: Reason;
  notes: string;
  consent: boolean;
}

const INITIAL: FormData = {
  full_name: '',
  email: '',
  phone: '',
  id_type: 'rut_cl',
  id_value: '',
  reason: 'arco_suppression',
  notes: '',
  consent: false,
};

const ID_TYPE_LABELS: Record<IdType, string> = {
  rut_cl: 'RUT (Chile)',
  passport: 'Pasaporte',
  other: 'Otro documento',
};

const REASON_LABELS: Record<Reason, string> = {
  arco_suppression: 'Ejercer derecho de supresión (ARCO)',
  account_closure: 'Cierre de cuenta y eliminación de datos',
  meta_callback: 'Solicitud de eliminación enviada por Meta / Facebook',
  other: 'Otro motivo',
};

export default function EliminacionPage() {
  const [form, setForm] = useState<FormData>(INITIAL);
  const [state, setState] = useState<FormState>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  function set<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.consent) {
      setErrorMsg('Debes aceptar la declaración de veracidad para continuar.');
      setState('error');
      return;
    }

    setState('loading');
    setErrorMsg('');

    try {
      const res = await fetch('/api/eliminacion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: form.full_name,
          email: form.email,
          phone: form.phone || undefined,
          id_type: form.id_type,
          id_value: form.id_value,
          reason: form.reason,
          notes: form.notes || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error ?? 'Ocurrió un error. Inténtalo de nuevo.');
        setState('error');
        return;
      }

      setState('success');
    } catch {
      setErrorMsg('No pudimos conectarnos al servidor. Inténtalo más tarde.');
      setState('error');
    }
  }

  const inputClass =
    'w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors';
  const labelClass = 'block text-sm font-medium text-foreground mb-1.5';

  return (
    <LegalShell activeHref="/eliminacion">
      <LegalHeader
        eyebrow="Documento legal"
        title="Solicitud de eliminación de datos"
        intro={`Usa este formulario para ejercer tu derecho de supresión conforme a la Ley N.o 19.628 o para solicitar el cierre de tu cuenta en ${LEGAL.producto}. También lo puedes usar si recibes de Meta una solicitud de eliminación de datos.`}
      />

      <div className="mx-auto max-w-3xl px-6 pb-20">

        {/* ── Qué pasa con tu solicitud ── */}
        <LegalSection index={1} title="¿Qué ocurre al enviar este formulario?">
          <ul className="ml-5 list-disc space-y-2">
            <li>
              Registramos tu solicitud con un número de ticket y la revisamos
              dentro de <strong>10 días hábiles</strong>.
            </li>
            <li>
              Te contactaremos al correo que indiques para confirmar tu
              identidad antes de procesar cualquier eliminación. Este paso
              es obligatorio para proteger tu información frente a
              solicitudes fraudulentas.
            </li>
            <li>
              Una vez verificada la identidad, procederemos a la eliminación
              o anonimización de los datos en los plazos que permite la ley,
              considerando las obligaciones legales de conservación que
              puedan aplicar (por ejemplo, registros contables o tributarios).
            </li>
            <li>
              La eliminación de los datos de la cuenta puede implicar la
              pérdida definitiva de conversaciones, contactos, automatizaciones
              y configuraciones asociadas a ella.
            </li>
          </ul>
          <LegalCallout>
            <strong>Solicitudes de Meta / Facebook.</strong> Si recibiste un
            aviso de Meta indicando que debes gestionar la eliminación de datos
            de un usuario de tu cuenta de Facebook o WhatsApp Business,
            selecciona <em>&ldquo;Solicitud de eliminación enviada por Meta&rdquo;</em> en el
            campo Motivo e indica en Notas el identificador o correo del
            usuario afectado.
          </LegalCallout>
        </LegalSection>

        {/* ── Formulario ── */}
        <LegalSection index={2} title="Formulario de solicitud">
          {state === 'success' ? (
            <div className="rounded-xl border border-green-500/30 bg-green-500/5 p-6 text-center">
              <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-green-500" />
              <h3 className="text-foreground text-base font-bold">
                Solicitud recibida correctamente
              </h3>
              <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                Revisaremos tu solicitud y te contactaremos al correo
                indicado dentro de los próximos 10 días hábiles para
                confirmar tu identidad y avanzar con el proceso.
              </p>
              <p className="text-muted-foreground mt-4 text-xs">
                Si tienes dudas, escríbenos a{' '}
                <a
                  href={LEGAL.emailHref}
                  className="text-primary hover:text-primary/80 font-medium underline"
                >
                  {LEGAL.email}
                </a>
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="space-y-5">

              {/* Nombre */}
              <div>
                <label htmlFor="full_name" className={labelClass}>
                  Nombre completo <span className="text-destructive">*</span>
                </label>
                <input
                  id="full_name"
                  type="text"
                  required
                  autoComplete="name"
                  placeholder="Ej.: María González Pérez"
                  value={form.full_name}
                  onChange={(e) => set('full_name', e.target.value)}
                  className={inputClass}
                />
              </div>

              {/* Correo */}
              <div>
                <label htmlFor="email" className={labelClass}>
                  Correo electrónico <span className="text-destructive">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="tu@correo.com"
                  value={form.email}
                  onChange={(e) => set('email', e.target.value)}
                  className={inputClass}
                />
                <p className="text-muted-foreground mt-1 text-xs">
                  Lo usaremos únicamente para confirmar tu identidad y
                  responderte sobre esta solicitud.
                </p>
              </div>

              {/* Teléfono (opcional) */}
              <div>
                <label htmlFor="phone" className={labelClass}>
                  Teléfono / WhatsApp{' '}
                  <span className="text-muted-foreground font-normal">(opcional)</span>
                </label>
                <input
                  id="phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="+56 9 1234 5678"
                  value={form.phone}
                  onChange={(e) => set('phone', e.target.value)}
                  className={inputClass}
                />
              </div>

              {/* Tipo y número de documento */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="id_type" className={labelClass}>
                    Tipo de documento <span className="text-destructive">*</span>
                  </label>
                  <select
                    id="id_type"
                    required
                    value={form.id_type}
                    onChange={(e) => set('id_type', e.target.value as IdType)}
                    className={inputClass}
                  >
                    {(Object.keys(ID_TYPE_LABELS) as IdType[]).map((k) => (
                      <option key={k} value={k}>
                        {ID_TYPE_LABELS[k]}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="id_value" className={labelClass}>
                    Número de documento <span className="text-destructive">*</span>
                  </label>
                  <input
                    id="id_value"
                    type="text"
                    required
                    placeholder={
                      form.id_type === 'rut_cl' ? 'Ej.: 12.345.678-9' : 'Número o código'
                    }
                    value={form.id_value}
                    onChange={(e) => set('id_value', e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Motivo */}
              <div>
                <label htmlFor="reason" className={labelClass}>
                  Motivo de la solicitud <span className="text-destructive">*</span>
                </label>
                <select
                  id="reason"
                  required
                  value={form.reason}
                  onChange={(e) => set('reason', e.target.value as Reason)}
                  className={inputClass}
                >
                  {(Object.keys(REASON_LABELS) as Reason[]).map((k) => (
                    <option key={k} value={k}>
                      {REASON_LABELS[k]}
                    </option>
                  ))}
                </select>
              </div>

              {/* Notas adicionales */}
              <div>
                <label htmlFor="notes" className={labelClass}>
                  Información adicional{' '}
                  <span className="text-muted-foreground font-normal">(opcional)</span>
                </label>
                <textarea
                  id="notes"
                  rows={4}
                  maxLength={2000}
                  placeholder="Describe cualquier detalle relevante: cuenta afectada, datos específicos que deseas eliminar, etc."
                  value={form.notes}
                  onChange={(e) => set('notes', e.target.value)}
                  className={`${inputClass} resize-none`}
                />
                <p className="text-muted-foreground mt-1 text-right text-xs">
                  {form.notes.length} / 2 000
                </p>
              </div>

              {/* Consentimiento */}
              <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-4">
                <input
                  id="consent"
                  type="checkbox"
                  required
                  checked={form.consent}
                  onChange={(e) => set('consent', e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-primary"
                />
                <label
                  htmlFor="consent"
                  className="cursor-pointer text-sm text-muted-foreground leading-relaxed"
                >
                  Declaro que los datos entregados son verídicos y que soy
                  el titular o representante autorizado para ejercer este
                  derecho. Entiendo que {LEGAL.razonSocial} puede solicitar
                  acreditación adicional de identidad antes de procesar la
                  solicitud. <span className="text-destructive">*</span>
                </label>
              </div>

              {/* Error */}
              {state === 'error' && errorMsg && (
                <div className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  {errorMsg}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={state === 'loading'}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {state === 'loading' && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                {state === 'loading'
                  ? 'Enviando solicitud…'
                  : 'Enviar solicitud de eliminación'}
              </button>

              <p className="text-center text-xs text-muted-foreground">
                Los campos marcados con <span className="text-destructive">*</span> son
                obligatorios. Tus datos serán tratados conforme a nuestra{' '}
                <a href="/privacidad" className="text-primary hover:text-primary/80 underline">
                  Política de Privacidad
                </a>.
              </p>
            </form>
          )}
        </LegalSection>

        {/* ── Canal alternativo ── */}
        <LegalSection index={3} title="¿Prefieres otro canal?">
          <p>
            Si tienes dificultades para completar el formulario, también
            puedes enviarnos tu solicitud directamente:
          </p>
          <ul className="ml-5 list-disc space-y-2">
            <li>
              Correo:{' '}
              <a
                href={LEGAL.emailHref}
                className="text-primary hover:text-primary/80 font-medium underline"
              >
                {LEGAL.email}
              </a>{' '}
              — asunto: <em>&ldquo;Solicitud eliminación de datos&rdquo;</em>
            </li>
            <li>
              WhatsApp o teléfono:{' '}
              <a
                href={LEGAL.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-primary/80 font-medium underline"
              >
                {LEGAL.telefono}
              </a>
            </li>
          </ul>
          <p>
            En cualquier caso, incluye: nombre completo, correo de la
            cuenta, RUT u otro documento de identidad y una breve
            descripción de los datos que deseas eliminar.
          </p>
          <LegalCallout>
            Atendemos solicitudes de lunes a viernes en horario hábil
            (Chile continental, UTC−3). El plazo de respuesta es de hasta
            10 días hábiles contados desde la verificación de identidad.
          </LegalCallout>
        </LegalSection>

      </div>
    </LegalShell>
  );
}
