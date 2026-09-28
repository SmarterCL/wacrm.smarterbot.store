import type { Metadata } from 'next';
import Link from 'next/link';
import {
  LegalCallout,
  LegalHeader,
  LegalSection,
  LegalShell,
} from '@/components/legal/legal-shell';
import { LEGAL, NORMS } from '@/lib/legal';

export const metadata: Metadata = {
  title: 'Política de Privacidad',
  description: `Cómo ${LEGAL.razonSocial} trata los datos personales en ${LEGAL.marca} / ${LEGAL.producto}, en conformidad con la legislación chilena vigente.`,
  alternates: { canonical: `${LEGAL.sitio}/privacidad` },
};

export default function PrivacidadPage() {
  return (
    <LegalShell activeHref="/privacidad">
      <LegalHeader
        eyebrow="Documento legal"
        title="Política de Privacidad"
        intro={`${LEGAL.razonSocial}, RUT ${LEGAL.rut}, domiciliada en ${LEGAL.domicilio} (en adelante "${LEGAL.marca}"), describe en este documento cómo recoge, usa, conserva y protege los datos personales que trata al prestar ${LEGAL.producto}, la plataforma de CRM, WhatsApp Business Platform, automatizaciones y agentes de IA operada en ${LEGAL.aplicacion}.`}
      />
      <div className="mx-auto max-w-3xl px-6 pb-20">
        <LegalSection index={1} title="Responsable del tratamiento">
          <p>
            El responsable del tratamiento de los datos personales descritos en
            esta política es {LEGAL.razonSocial}, RUT {LEGAL.rut}, con domicilio
            en {LEGAL.domicilio}, Chile. Para todo lo relativo a datos
            personales puede contactarnos en{' '}
            <a href={LEGAL.emailHref} className="text-primary hover:text-primary/80 font-medium underline">
              {LEGAL.email}
            </a>{' '}
            o al teléfono {LEGAL.telefono}.
          </p>
          <p>
            Cuando el cliente usa {LEGAL.producto} para gestionar los datos de
            sus propios contactos y clientes, {LEGAL.razonSocial} actúa como
            proveedor de servicios que trata esos datos por cuenta del cliente,
            conforme a las instrucciones y finalidades del servicio contratado.
            El cliente es responsable de contar con la base legal y las
            autorizaciones necesarias para tratar los datos que ingresa o
            procesa mediante la plataforma.
          </p>
        </LegalSection>

        <LegalSection index={2} title="Legislación aplicable">
          <p>
            Esta política se rige por la {NORMS.constitucion} y por la{' '}
            {NORMS.ley19628}, sobre protección de los derechos de las personas
            respecto del tratamiento de datos personales, que constituye el
            marco vigente en Chile a la fecha de este documento, así como por
            las normas sectoriales que resulten aplicables ({NORMS.ley19911} en
            materia de comunicaciones publicitarias y {NORMS.ley19496} en
            materia de derechos de los consumidores).
          </p>
          <LegalCallout>
            <strong>Estado de la reforma.</strong> La {NORMS.ley21719}, que crea la Agencia de
            Protección de Datos Personales y moderniza el régimen de
            protección de datos en Chile, se encuentra publicada, pero su
            entrada en vigencia está prevista
            para el {NORMS.ley21719Fecha}, por lo que{' '}
            <em>no es aún exigible</em>. Hasta esa fecha seguimos aplicando la
            Ley {NORMS.ley19628.replace('Ley N.o ', '')} y, una vez vigente la
            nueva institucionalidad, ajustaremos este documento a sus
            requisitos sin que ello signifique reconocerla como derecho hoy
            aplicable.
          </LegalCallout>
        </LegalSection>

        <LegalSection index={3} title="Datos que tratamos">
          <p>
            Tratamos únicamente las categorías de datos necesarias para
            prestar el servicio:
          </p>
          <ul className="ml-5 list-disc space-y-2">
            <li>
              <strong>Identificación y contacto:</strong> nombre, correo
              electrónico, teléfono o número de WhatsApp y datos de la empresa
              que usted entrega al solicitar una demo, crear una cuenta o
              contactarnos.
            </li>
            <li>
              <strong>Cuenta y acceso:</strong> credenciales de autenticación,
              información de perfil, roles y permisos dentro de la cuenta, y
              preferencias de la aplicación.
            </li>
            <li>
              <strong>Datos operacionales del CRM:</strong> la información que
              el cliente registra en la plataforma —contactos propios,
              conversaciones, mensajes, notas, oportunidades, pipelines,
              campañas y archivos adjuntos—.
            </li>
            <li>
              <strong>Mensajería de WhatsApp:</strong> contenido y metadatos de
              los mensajes que circulan por la cuenta de WhatsApp Business
              Platform conectada, necesarios para mostrar la bandeja de
              entrada y ejecutar automatizaciones.
            </li>
            <li>
              <strong>Datos técnicos y de seguridad:</strong> registros de
              actividad (logs), direcciones IP, identificadores de eventos y
              información de dispositivos o navegadores empleada para
              operar, depurar y proteger el servicio.
            </li>
            <li>
              <strong>Soporte comercial:</strong> antecedentes que usted
              facilite al comunicarse con nuestro equipo por correo, WhatsApp,
              formularios o la plataforma.
            </li>
          </ul>
          <p>
            No tratamos deliberadamente categorías sensibles (por ejemplo,
            datos de salud, creencias religiosas u orientación sexual), ni
            datos de menores de edad. Si un cliente ingresa esa información en
            la plataforma, es su responsabilidad y deberá eliminarla.
          </p>
        </LegalSection>

        <LegalSection index={4} title="Finalidades del tratamiento">
          <p>Usamos los datos para las siguientes finalidades:</p>
          <ul className="ml-5 list-disc space-y-2">
            <li>Prestar, operar y mantener el servicio contratado.</li>
            <li>
              Administrar cuentas, accesos, credenciales y la relación con el
              cliente.
            </li>
            <li>
              Ejecutar las funciones de CRM: agenda, contactos, embudos de
              venta y seguimiento comercial.
            </li>
            <li>
              Procesar y mostrar comunicaciones de WhatsApp Business Platform
              y coordinar conversaciones entre el equipo del cliente y sus
              propios contactos.
            </li>
            <li>
              Ejecutar automatizaciones, flujos y notificaciones configuradas
              por el cliente.
            </li>
            <li>
              Operar funciones de inteligencia artificial disponibles en la
              plataforma, según se describe en la sección correspondiente.
            </li>
            <li>Entregar soporte técnico y atención comercial.</li>
            <li>
              Resguardar la seguridad: autenticación, control de accesos,
              detección de abuso, prevención de fraude, spam y uso indebido.
            </li>
            <li>
              Cumplir obligaciones legales, requerimientos de autoridad
              competente y la normativa aplicable.
            </li>
          </ul>
        </LegalSection>

        <LegalSection index={5} title="WhatsApp y Meta">
          <p>
            Cuando un cliente conecta su cuenta a WhatsApp Business Platform,{' '}
            {LEGAL.marca} accede y trata los datos estrictamente necesarios
            para prestar el servicio contratado: números de teléfono,
            identificadores de conversación y de mensaje, contenido de los
            mensajes y medios adjuntos, y estado de entrega. Ese tratamiento se
            hace en nombre del cliente, que decide las finalidades operacionales
            dentro de su propia cuenta.
          </p>
          <p>
            Meta Platforms Inc. y sus empresas relacionadas tienen sus propias
            políticas de privacidad y condiciones de servicio para WhatsApp y
            la Business Platform, que son independientes de las nuestras.{' '}
            {LEGAL.razonSocial} no es Meta ni actúa como su representante, y no
            controla la información que Meta trate como responsable del
            servicio de mensajería. Le recomendamos revisar los documentos de
            privacidad y condiciones de Meta aplicables a su cuenta.
          </p>
        </LegalSection>

        <LegalSection index={6} title="Proveedores y encargados de tratamiento">
          <p>
            Para operar la plataforma utilizamos proveedores tecnológicos
            que tratan datos en nuestra dependencia o en la del cliente, bajo
            obligaciones de confidencialidad y seguridad:
          </p>
          <ul className="ml-5 list-disc space-y-2">
            <li>
              <strong>Base de datos y autenticación (Supabase):</strong>{' '}
              almacenamiento de la información del CRM, sesiones y archivos
              asociados.
            </li>
            <li>
              <strong>Infraestructura y alojamiento (Hostinger VPS con proxy
              inverso Caddy y contenedores Docker):</strong> ejecución de la
              aplicación y su base de datos.
            </li>
            <li>
              <strong>Correo transaccional (nuestro servidor SMTP{' '}
              mail.smarterbot.store):</strong> confirmaciones de solicitudes,
              avisos de leads y notificaciones operativas.
            </li>
            <li>
              <strong>Proveedores de modelos de lenguaje elegidos por el
              cliente (OpenAI, Anthropic u OpenRouter):</strong> generación de
              respuestas asistidas por IA, usando la clave API que el cliente
              configura para su cuenta.
            </li>
            <li>
              <strong>WhatsApp Business Platform (Meta):</strong> envío y
              recepción de mensajes.
            </li>
          </ul>
          <p>
            No vendemos datos personales con fines publicitarios ni los
            compartimos con terceros ajenos a la prestación del servicio, salvo
            obligación legal o requerimiento de autoridad competente.
          </p>
        </LegalSection>

        <LegalSection index={7} title="Transferencias internacionales">
          <p>
            Algunos de los proveedores señalados procesan información en
            servidores ubicados fuera de Chile (por ejemplo, servicios de
            base de datos, de alojamiento o de modelos de lenguaje). Cuando
            ello ocurre, los datos pueden quedar sujetos a regímenes de
            protección distintos del chileno. Aplicamos medidas técnicas y
            contractuales razonables para resguardar la información, y
            extremaremos esos resguardos cuando la normativa chilena resulte
            exigible, incluidas las salvaguardas que correspondan una vez
            entre en vigencia la {NORMS.ley21719}.
          </p>
        </LegalSection>

        <LegalSection index={8} title="Seguridad">
          <p>
            Mantendremos medidas de seguridad coherentes con el estado de la
            técnica y el riesgo que presenta el tratamiento, entre ellas:
          </p>
          <ul className="ml-5 list-disc space-y-2">
            <li>
              Autenticación de usuarios y sesiones administradas, con
              rotación de tokens.
            </li>
            <li>
              Control de accesos por cuenta y por rol: cada usuario sólo ve la
              información de la cuenta a la que pertenece.
            </li>
            <li>
              Cifrado en reposo con AES-256-GCM de las credenciales y secretos
              que la plataforma almacena (tokens de WhatsApp, claves de API,
              secretos de webhooks).
            </li>
            <li>
              Reglas de seguridad a nivel de base de datos que restringen qué
              filas puede leer o modificar cada sesión autenticada.
            </li>
            <li>
              Encabezados de seguridad en las respuestas de la aplicación,
              transporte cifrado (HTTPS) y limitación de frecuencia de
              solicitudes en los endpoints públicos.
            </li>
            <li>
              Minimización del acceso interno: el equipo sólo accede a los datos
              cuando resulta necesario para soporte o seguridad.
            </li>
          </ul>
          <p>
            Ninguna medida elimina por completo el riesgo. Esta política no
            afirma que contemos con certificaciones de seguridad específicas;
            si en el futuro obtenemos alguna, lo informaremos por estos mismos
            medios.
          </p>
        </LegalSection>

        <LegalSection index={9} title="Conservación de los datos">
          <p>
            Conservamos los datos mientras la cuenta permanezca activa o la
            relación comercial esté vigente, porque ese es el plazo necesario
            para prestar el servicio. Al término de la relación, conservamos la
            información sólo durante los plazos que exijan las normas
            aplicables —por ejemplo, obligaciones tributarias, contables o de
            atención de requerimientos de autoridad— y, en su defecto,
            mientras subsista una necesidad legítima documentada, tales como la
            prevención de fraude y abuso, la resolución de disputas o el
            ejercicio de derechos en procedimientos.
          </p>
          <p>
            Vencidos esos plazos, los datos se suprimen o se anonimizan de
            forma que ya no permitan identificar a una persona. Las
            solicitudes de eliminación se atienden por el canal descrito en la
            sección de derechos.
          </p>
        </LegalSection>

        <LegalSection index={10} title="Derechos de las personas">
          <p>
            Conforme a la {NORMS.ley19628}, toda persona puede requerir el
            acceso a la información que sobre ella tengamos, conocer el origen
            de esos datos y la finalidad del tratamiento, y solicitar la
            rectificación de datos inexactos o la eliminación de los que
            resulten innecesarios o excesivos. Atendemos esos requerimientos
            dentro de los plazos legales, previa acreditación suficiente de la
            identidad del solicitante, y podemos negarlos sólo por causa
            justificada (secreto comercial o industrial, derechos de terceros,
            obligación legal de conservación o instrucción judicial), lo que
            informaremos al solicitante.
          </p>
          <p>
            Adicionalmente, y en la medida en que resulten compatibles con el
            régimen vigente, facilitamos el ejercicio de derechos de oposición
            al tratamiento con fines publicitarios o de cesión, y de
            portabilidad, mediante exportación de la información de la cuenta
            en formatos estructurados. Cuando la {NORMS.ley21719} entre en
            vigencia el {NORMS.ley21719Fecha}, incorporaremos en este
            documento los derechos, plazos y canales que esa ley establezca,
            incluido el de reclamo ante la autoridad de control.
          </p>
          <LegalCallout>
            <strong>Ejercer sus derechos o pedir la eliminación de datos.</strong>{' '}
            Use nuestro formulario oficial de solicitud de eliminación, con
            validación de identidad y seguimiento por ticket.{' '}
            <Link
              href="/eliminacion"
              className="text-primary hover:text-primary/80 inline-flex items-center gap-1 font-semibold underline"
            >
              Ir a Solicitud de eliminación de datos →
            </Link>
          </LegalCallout>
        </LegalSection>

        <LegalSection index={11} title="Decisiones automatizadas e IA">
          <p>
            La plataforma puede ofrecer funciones asistidas por modelos de
            lenguaje —respuestas sugeridas, resúmenes, clasificación y flujos
            automatizados—. Cuando se generan, el contenido del CRM y de las
            conversaciones que el cliente habilite puede transmitirse al
            proveedor de modelos que el propio cliente haya configurado, con
            el único fin de producir la respuesta solicitada.
          </p>
          <p>
            Las sugerencias de IA no sustituyen la revisión humana: el cliente
            decide si las usa, y es responsable de las comunicaciones que
            envía. Adoptaremos medidas razonables para impedir que decisiones
            con efectos jurídicos o significativos sobre una persona se tomen
            de forma exclusivamente automatizada sin intervención humana.
          </p>
        </LegalSection>

        <LegalSection index={12} title="Menores de edad">
          <p>
            {LEGAL.producto} está destinado a empresas y profesionales. No
            solicitamos ni aceptamos deliberadamente datos de menores de
            dieciocho años. Si detectamos que un menor nos ha facilitado datos
            personales, los eliminaremos en cuanto tengamos constancia de ello.
          </p>
        </LegalSection>

        <LegalSection index={13} title="Cambios de esta política">
          <p>
            Podemos modificar este documento para reflejar cambios del
            servicio, de los proveedores tecnológicos o del marco normativo
            (en particular, la entrada en vigencia de la {NORMS.ley21719} el{' '}
            {NORMS.ley21719Fecha}). Cuando la modificación afecte de forma
            relevante el tratamiento de datos, lo anunciaremos en esta misma
            página, con fecha de última actualización visible, y —cuando
            corresponda— por correo electrónico a los administradores de
            cuenta. Le recomendamos revisar el documento de vez en cuando.
          </p>
        </LegalSection>

        <LegalSection index={14} title="Contacto">
          <p>
            Para ejercer derechos, formular consultas o reclamos sobre el
            tratamiento de datos personales:
          </p>
          <ul className="ml-5 list-disc space-y-1">
            <li>
              Correo: <a href={LEGAL.emailHref} className="text-primary hover:text-primary/80 font-medium underline">{LEGAL.email}</a>
            </li>
            <li>WhatsApp o teléfono: {LEGAL.telefono}</li>
            <li>
              Solicitud de eliminación:{' '}
              <Link href="/eliminacion" className="text-primary hover:text-primary/80 font-medium underline">
                {LEGAL.sitio}/eliminacion
              </Link>
            </li>
            <li>
              Condiciones de uso:{' '}
              <Link href="/condiciones" className="text-primary hover:text-primary/80 font-medium underline">
                {LEGAL.sitio}/condiciones
              </Link>
            </li>
            <li>
              Responsable: {LEGAL.razonSocial}, RUT {LEGAL.rut},{' '}
              {LEGAL.domicilio}
            </li>
          </ul>
        </LegalSection>
      </div>
    </LegalShell>
  );
}
