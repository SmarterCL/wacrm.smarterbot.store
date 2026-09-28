/**
 * Datos del responsable del tratamiento, compartidos por las páginas
 * legales `/privacidad`, `/condiciones` y `/eliminacion`.
 *
 * Único punto de edición: si cambia un dato fiscal o de contacto, se
 * actualiza aquí y las tres páginas lo reflejan sin tocar JSX.
 */
export const LEGAL = {
  razonSocial: 'Smarter SpA',
  rut: '78.233.471-4',
  domicilio: 'Padre Mariano 103, comuna de Providencia, Santiago, Chile',
  marca: 'SmarterBOT',
  producto: 'SmarterCRM',
  email: 'hola@smarterbot.store',
  emailHref: 'mailto:hola@smarterbot.store',
  telefono: '+56 9 7954 0471',
  whatsappUrl: 'https://wa.me/56979540471',
  /** Sitio corporativo donde se publican las páginas legales. */
  sitio: 'https://www.smarterbot.store',
  /** Aplicación CRM que presta el servicio. */
  aplicacion: 'https://crm.smarterbot.store',
  actualizado: '28 de septiembre de 2026',
} as const;

export const LEGAL_NAV = [
  { href: '/privacidad', label: 'Política de Privacidad' },
  { href: '/condiciones', label: 'Términos y Condiciones' },
  { href: '/eliminacion', label: 'Eliminación de datos' },
] as const;

/**
 * Marco normativo citado en las páginas.
 *
 * Criterio: sólo leyes efectivamente promulgadas. La Ley 21.719 se
 * menciona SIEMPRE como norma aún no vigente (entrada en vigor
 * 1 de diciembre de 2026), nunca como derecho aplicable hoy.
 */
export const NORMS = {
  constitucion: 'Artículo 19 N.o 7 de la Constitución Política de la República',
  ley19628: 'Ley N.o 19.628 sobre Protección de la Vida Privada',
  ley19911: 'Ley N.o 19.911, sobre comunicaciones publicitarias',
  ley19496:
    'Ley N.o 19.496 sobre Protección de los Derechos de los Consumidores',
  ley19799: 'Ley N.o 19.799, sobre documentos electrónicos y contratos',
  ley21459: 'Ley N.o 21.459, sobre delitos informáticos',
  ley21719: 'Ley N.o 21.719',
  ley21719Fecha: '1 de diciembre de 2026',
} as const;
