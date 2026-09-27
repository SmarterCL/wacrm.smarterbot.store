'use server';

// ============================================================
// Server Action — formulario de demo landing
//
// 1. Envía notificación a hola@smarterbot.store
// 2. Envía confirmación al lead pidiendo horario de contacto
// ============================================================

import { sendMail } from '@/lib/email/mailer';

export interface ContactFormData {
  nombre: string;
  empresa: string;
  whatsapp: string;
  email: string;
  necesidad: string;
}

export async function submitContactForm(data: ContactFormData): Promise<{ ok: boolean; error?: string }> {
  try {
    const { nombre, empresa, whatsapp, email, necesidad } = data;

    if (!nombre?.trim() || !email?.trim()) {
      return { ok: false, error: 'Nombre y correo son obligatorios.' };
    }

    // ── 1. Notificación interna a hola@smarterbot.store ──────────────
    await sendMail({
      to: 'hola@smarterbot.store',
      subject: `Nuevo lead: ${nombre}${empresa ? ` — ${empresa}` : ''}`,
      replyTo: email,
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a">
          <h2 style="color:#6d28d9;margin-bottom:4px">Nuevo lead desde la landing</h2>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:12px 0"/>
          <table style="width:100%;border-collapse:collapse;font-size:14px">
            <tr><td style="padding:6px 0;color:#6b7280;width:130px">Nombre</td><td style="padding:6px 0;font-weight:600">${nombre}</td></tr>
            <tr><td style="padding:6px 0;color:#6b7280">Empresa</td><td style="padding:6px 0">${empresa || '—'}</td></tr>
            <tr><td style="padding:6px 0;color:#6b7280">WhatsApp</td><td style="padding:6px 0">${whatsapp || '—'}</td></tr>
            <tr><td style="padding:6px 0;color:#6b7280">Email</td><td style="padding:6px 0"><a href="mailto:${email}" style="color:#6d28d9">${email}</a></td></tr>
            <tr><td style="padding:6px 0;color:#6b7280">Necesidad</td><td style="padding:6px 0">${necesidad || '—'}</td></tr>
          </table>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0"/>
          <p style="font-size:12px;color:#9ca3af">Lead registrado automáticamente desde wacrm.smarterbot.store</p>
        </div>
      `,
    });

    // ── 2. Confirmación al lead ──────────────────────────────────────
    await sendMail({
      to: email,
      subject: '¡Recibimos tu solicitud de demo, ${nombre}!'.replace('${nombre}', nombre),
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a">
          <h2 style="color:#6d28d9">¡Hola, ${nombre}!</h2>
          <p style="font-size:15px;line-height:1.6;color:#374151">
            Recibimos tu solicitud de demostración de <strong>SmarterCRM</strong>.
            Nuestro equipo se pondrá en contacto contigo a la brevedad.
          </p>
          <div style="background:#f5f3ff;border-left:4px solid #6d28d9;border-radius:4px;padding:16px 20px;margin:20px 0">
            <p style="margin:0;font-size:15px;color:#4b5563;line-height:1.7">
              Para coordinar la demo, <strong>responde este correo indicando:</strong><br/>
              👉 ¿En qué <strong>día y horario</strong> te podemos contactar?<br/>
              <span style="font-size:13px;color:#6b7280">(Ej: "martes o miércoles entre 10:00 y 12:00 hrs")</span>
            </p>
          </div>
          <p style="font-size:14px;color:#374151;line-height:1.6">
            También puedes escribirnos directamente por WhatsApp:
            <a href="https://wa.me/56979540471" style="color:#6d28d9;font-weight:600">+56 9 7954 0471</a>
          </p>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/>
          <p style="font-size:12px;color:#9ca3af">
            SmarterCRM · CRM + WhatsApp + IA<br/>
            <a href="https://wacrm.smarterbot.store" style="color:#6d28d9">wacrm.smarterbot.store</a>
          </p>
        </div>
      `,
    });

    return { ok: true };
  } catch (err) {
    console.error('[landing/contact] email error:', err);
    return { ok: false, error: 'No pudimos enviar el correo. Intenta de nuevo o escríbenos por WhatsApp.' };
  }
}
