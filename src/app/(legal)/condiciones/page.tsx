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
  title: 'Términos y Condiciones de Uso',
  description: `Condiciones que regulan el uso de ${LEGAL.producto}, la plataforma de CRM, WhatsApp e IA de ${LEGAL.razonSocial} en Chile.`,
  alternates: { canonical: `${LEGAL.sitio}/condiciones` },
};

export default function CondicionesPage() {
  return (
    <LegalShell activeHref="/condiciones">
      <LegalHeader
        eyebrow="Documento legal"
        title="Términos y Condiciones de Uso"
        intro={`Estos términos regulan el acceso y uso de ${LEGAL.producto}, servicio prestado por ${LEGAL.razonSocial}, RUT ${LEGAL.rut}, con domicilio en ${LEGAL.domicilio}, exclusivamente en el territorio de la República de Chile.`}
      />
      <div className="mx-auto max-w-3xl px-6 pb-20">
        <LegalSection index={1} title="Aceptación">
          <p>
            Al crear una cuenta, solicitar una demostración o utilizar{' '}
            {LEGAL.producto}, usted declara haber leído y aceptado estos
            términos en su calidad de representante de la empresa o
            profesional que usará el servicio, con capacidad legal para
            obligarla. Si no está de acuerdo, no debe utilizar la plataforma.
          </p>
          <p>
            Estos términos se aplican junto con la{' '}
            <Link href="/privacidad" className="text-primary hover:text-primary/80 font-medium underline">
              Política de Privacidad
            </Link>
            , que forma parte integrante de ellos, y con las condiciones de
            los servicios de terceros que el cliente conecte a la plataforma.
          </p>
        </LegalSection>

        <LegalSection index={2} title="Descripción del servicio">
          <p>
            {LEGAL.producto} es una plataforma en línea que puede incluir,
            según lo contratado:
          </p>
          <ul className="ml-5 list-disc space-y-1.5">
            <li>CRM: contactos, notas, embudos de venta y oportunidades.</li>
            <li>
              Bandeja de entrada compartida y gestión de conversaciones de
              WhatsApp mediante WhatsApp Business Platform.
            </li>
            <li>
              Agenda y seguimiento, automatizaciones y flujos de trabajo,
              plantillas de mensajes y envíos segmentados.
            </li>
            <li>
              Funciones asistidas por inteligencia artificial: respuestas
              sugeridas y conocimiento documental, activadas y configuradas
              por el cliente.
            </li>
            <li>
              API, integraciones y notificaciones por correo electrónico.
            </li>
          </ul>
          <p>
            Las funciones disponibles dependen del plan contratado y de la
            configuración de la cuenta. Nos reservamos la facultad de añadir,
            modificar o retirar funcionalidades del servicio, procurando no
            reducir materialmente las prestaciones contratadas sin aviso
            previo.
          </p>
        </LegalSection>

        <LegalSection index={3} title="Cuenta del cliente">
          <ul className="ml-5 list-disc space-y-2">
            <li>
              El cliente debe proporcionar información veraz y mantenerla
              actualizada al crear y administrar su cuenta.
            </li>
            <li>
              Las credenciales son personales e intransferibles. El cliente es
              responsable de su custodia y de toda actividad realizada con
              ellas, incluida la de los usuarios que invite a su cuenta.
            </li>
            <li>
              El cliente debe comunicar sin demora el uso no autorizado de su
              cuenta o de sus credenciales a {LEGAL.email}.
            </li>
            <li>
              Los roles y permisos dentro de la cuenta (administrador, agente,
              visualizador) son gestionados por el propio cliente, que responde
              por el acceso que otorgue a su información.
            </li>
          </ul>
        </LegalSection>

        <LegalSection index={4} title="Uso aceptable">
          <p>Está prohibido utilizar el servicio para:</p>
          <ul className="ml-5 list-disc space-y-1.5">
            <li>
              Envío de spam, mensajes masivos no solicitados o comunicaciones
              comerciales sin consentimiento o base legal, incluidas las
              afectadas por la {NORMS.ley19911}.
            </li>
            <li>
              Fraude, suplantación de identidad, phishing o ingeniería social.
            </li>
            <li>
              Distribución de malware, exploits o cualquier código destinado a
              interrumpir, destruir o limitar la funcionalidad de sistemas.
            </li>
            <li>
              Contenidos ilegales, que vulneren derechos fundamentales, la
              honra, la imagen o la propiedad intelectual de terceros.
            </li>
            <li>
              Uso de WhatsApp contrario a las políticas y condiciones de Meta,
              incluido el envío masivo no autorizado o la manipulación de la
              plataforma para evadir sus límites.
            </li>
            <li>
              Tratamiento de datos personales sin base legal o sin la
              autorización de su titular, o la carga de datos sensibles de
              terceros sin sustento jurídico.
            </li>
            <li>
              Accesos no autorizados a la plataforma, elusión de controles,
              saturación de recursos o intento de extraer información de otras
              cuentas.
            </li>
            <li>
              Revender, sublicenciar o incorporar el servicio a un producto
              competidor sin autorización escrita.
            </li>
          </ul>
          <p>
            El incumplimiento de esta sección faculta a {LEGAL.razonSocial} a
            suspender o terminar el acceso conforme a la sección 11, sin
            perjuicio de las acciones legales que correspondan.
          </p>
        </LegalSection>

        <LegalSection index={5} title="WhatsApp y servicios de terceros">
          <p>
            WhatsApp Business Platform es un servicio de Meta que mantiene sus
            propias condiciones, políticas y límites operativos, incluyendo
            categorías de mensajes, ventanas de conversación, aprobación de
            plantillas y posibles tarifas que Meta cobre directamente al
            cliente. {LEGAL.razonSocial} no controla a Meta ni puede garantizar
            la disponibilidad, las cuotas o las decisiones de esa plataforma
            sobre las cuentas conectadas.
          </p>
          <p>
            El cliente es responsable de usar WhatsApp conforme a las reglas
            aplicables, de mantener correctamente configurados sus números,
            plantillas y consentimientos, y de las consecuencias —incluida la
            restricción o bloqueo de su número— que derive del uso que haga de
            la mensajería. Igual regla se aplica a los demás servicios
            externos que conecte a la plataforma.
          </p>
          <p>
            La indisponibilidad o el cambio de condiciones de un servicio de
            tercero puede afectar funciones determinadas de{' '}
            {LEGAL.producto}, sin que ello constituya incumplimiento de{' '}
            {LEGAL.razonSocial} cuando haya actuado con la diligencia esperable.
          </p>
        </LegalSection>

        <LegalSection index={6} title="Inteligencia artificial">
          <p>
            Ciertas funciones de la plataforma pueden utilizar modelos de
            lenguaje de terceros, con claves API que el cliente configura para
            su cuenta. Al usarlas, el cliente debe considerar:
          </p>
          <ul className="ml-5 list-disc space-y-1.5">
            <li>
              Las respuestas generadas pueden contener errores, imprecisiones,
              información desactualizada o sesgos, y no son asesoría
              profesional.
            </li>
            <li>
              El cliente debe revisar la información crítica antes de enviarla
              a sus propios clientes o tomar decisiones con ella.
            </li>
            <li>
              El cliente es responsable de las decisiones y comunicaciones que
              realice apoyándose en las salidas del sistema.
            </li>
            <li>
              El sistema no sustituye asesoría jurídica, contable, médica ni de
              otra índole cuando se requiera opinión de un profesional
              habilitado.
            </li>
            <li>
              El cliente debe contar con las autorizaciones y bases legales
              necesarias para comunicar a los proveedores de modelos la
              información que habilite en las funciones de IA, y debe evitar
              cargar datos cuya divulgación a un tercero no esté permitida.
            </li>
          </ul>
          <p>
            Los proveedores de modelos aplican sus propios términos y políticas
            de uso. Recomendamos revisarlos al activar estas funciones.
          </p>
        </LegalSection>

        <LegalSection index={7} title="Datos del cliente">
          <p>
            El cliente conserva la titularidad y la responsabilidad sobre la
            información que ingresa o procesa en la plataforma, y sobre el
            cumplimiento de sus propias obligaciones respecto de los titulares
            de esos datos. {LEGAL.razonSocial} trata esa información para
            prestar el servicio y según las instrucciones del cliente, en los
            términos descritos en la Política de Privacidad.
          </p>
        </LegalSection>

        <LegalSection index={8} title="Propiedad intelectual">
          <ul className="ml-5 list-disc space-y-2">
            <li>
              El software, la interfaz, la arquitectura, la marca{' '}
              {LEGAL.marca} y {LEGAL.producto}, sus textos y demás contenidos
              propios son de titularidad de {LEGAL.razonSocial} o de sus
              licenciantes, y quedan protegidos por la normativa chilena de
              propiedad intelectual.
            </li>
            <li>
              El cliente recibe una licencia de uso temporal, no exclusiva,
              intransferible y revocable, limitada a operar el servicio para su
              actividad interna mientras esté vigente su contrato.
            </li>
            <li>
              Los datos, contenidos y materiales que el cliente carga en la
              plataforma siguen siendo suyos. No reclamamos propiedad sobre
              ellos, y el cliente sólo nos otorga el acceso necesario para
              prestar el servicio.
            </li>
            <li>
              No se autoriza la reproducción, ingeniería inversa ni uso
              comercial de la plataforma más allá de lo que estos términos
              permiten.
            </li>
          </ul>
        </LegalSection>

        <LegalSection index={9} title="Disponibilidad">
          <p>
            Procuramos mantener el servicio disponible de forma continua, pero
            no existe una promesa de disponibilidad porcentual ni un acuerdo de
            nivel de servicio (SLA) salvo que se pacte por escrito en un
            contrato especial. El servicio puede interrumpirse por mantenimiento
            programado, actualizaciones, incidentes de seguridad, fallos o
            limitaciones de proveedores externos (infraestructura, base de
            datos, Meta/WhatsApp, correo, modelos de IA), casos fortuitos o de
            fuerza mayor, y situaciones razonablemente fuera de nuestro
            control.
          </p>
          <p>
            Cuando sea posible, avisaremos las mantenciones con anticipación y
            trataremos de limitar su duración e impacto.
          </p>
        </LegalSection>

        <LegalSection index={10} title="Pagos, planes y facturación">
          <p>
            Los valores, tributos aplicables y condiciones de cada plan se
            acuerdan en la cotización, el enlace de pago o el contrato que
            se celebre con el cliente, y los precios se expresan en pesos
            chilenos más los impuestos que correspondan. La información
            comercial publicada en este sitio es referencial y puede actualizarse
            sin previo aviso; el texto vigente será siempre el del documento de
            contratación.
          </p>
          <p>
            El cliente es responsable de los cargos asociados a los servicios
            de terceros que contrate e habilite, incluidas, cuando proceda, las
            tarifas de WhatsApp Business Platform que facture Meta de forma
            independiente a {LEGAL.razonSocial}.
          </p>
          <p>
            Salvo pacto escrito distinto, la terminación o suspensión del
            servicio no genera derecho a reembolso de períodos ya consumidos.
            No se aplican renovaciones automáticas por el solo ministerio de
            estos términos: sólo regirán si el cliente las acepta
            expresamente al contratar.
          </p>
        </LegalSection>

        <LegalSection index={11} title="Suspensión y término">
          <p>
            {LEGAL.razonSocial} puede limitar, suspender o poner término al
            acceso, total o parcial, cuando concurra alguna de estas causas:
          </p>
          <ul className="ml-5 list-disc space-y-1.5">
            <li>Incumplimiento de estos términos o de la Política de Privacidad.</li>
            <li>Uso fraudulento, abusivo o ilícito del servicio.</li>
            <li>Riesgo para la seguridad de la plataforma o de otros clientes.</li>
            <li>Impago de las cantidades exigibles, previa notificación.</li>
            <li>Requerimiento de autoridad competente.</li>
            <li>
              Uso contrario a las políticas de terceros de los que depende el
              servicio, en particular Meta, cuando pueda comprometer la
              operación de las cuentas conectadas.
            </li>
          </ul>
          <p>
            Procuraremos notificar la medida y permitir su subsanación cuando
            la gravedad del caso y la seguridad de la plataforma lo permitan.
            Producido el término, el cliente puede solicitar la exportación de
            su información y la eliminación de datos conforme a la sección de
            derechos de la Política de Privacidad y al formulario disponible
            en <Link href="/eliminacion" className="text-primary hover:text-primary/80 font-medium underline">/eliminacion</Link>,
            sujeto a las obligaciones legales de conservación.
          </p>
        </LegalSection>

        <LegalSection index={12} title="Limitación de responsabilidad">
          <p>
            {LEGAL.razonSocial} responde por el servicio con la diligencia
            ordinaria de un proveedor profesional y en los casos en que la
            ley chilena establezca responsabilidad. No responderá por daños
            indirectos, lucro cesante o pérdida de datos atribuibles a causas
            no imputables a ella, al uso indebido del cliente, a decisiones
            tomadas sobre la base de salidas de IA no revisadas, o a fallos de
            servicios de terceros, sin perjuicio de los derechos irrenunciables
            que correspondan a los consumidores conforme a la{' '}
            {NORMS.ley19496} y de la responsabilidad que la ley no permita
            limitar o excluir.
          </p>
          <p>
            Nada de estos términos constituye una cláusula manifiestamente
            abusiva ni exime de responsabilidad por dolo, culpa grave o
            infracción de obligaciones legales esenciales.
          </p>
        </LegalSection>

        <LegalSection index={13} title="Modificaciones">
          <p>
            Podemos actualizar estos términos para reflejar cambios
            regulatorios, del servicio o de los riesgos de seguridad. Los
            cambios relevantes se comunicarán con antelación razonable
            —mediante aviso en la plataforma, correo a la cuenta de contacto o
            actualización de la fecha visible en esta página—. Al continuar
            usando el servicio después de la entrada en vigor de la modificación, el
            cliente acepta las nuevas condiciones; si no está de acuerdo, puede
            poner término al contrato.
          </p>
        </LegalSection>

        <LegalSection index={14} title="Comunicaciones y contratos electrónicos">
          <p>
            Conforme a la {NORMS.ley19799}, las comunicaciones y documentos
            electrónicos que intercambiemos (correos, avisos en la plataforma,
            confirmaciones y contratos celebrados en línea) tienen la misma
            validez que los escritos en papel. El cliente acepta recibir por
            correo electrónico en la dirección de su cuenta las comunicaciones
            contractuales y operativas relevantes, y se obliga a mantenerla
            actualizada.
          </p>
        </LegalSection>

        <LegalSection index={15} title="Ley aplicable y jurisdicción">
          <p>
            Estos términos se rigen por la ley chilena. Para cualquier
            controversia derivada de su interpretación o ejecución, las partes
            podrán ocurrir ante los tribunales de justicia ordinarios
            competentes conforme a las reglas generales de competencia del
            Código Orgánico de Tribunales y, tratándose de consumidores, de
            acuerdo con la {NORMS.ley19496}. El servicio se presta
            exclusivamente en el territorio de Chile.
          </p>
        </LegalSection>

        <LegalSection index={16} title="Contacto">
          <ul className="ml-5 list-disc space-y-1.5">
            <li>
              {LEGAL.razonSocial} · RUT {LEGAL.rut}
            </li>
            <li>{LEGAL.domicilio}</li>
            <li>
              Correo:{' '}
              <a href={LEGAL.emailHref} className="text-primary hover:text-primary/80 font-medium underline">
                {LEGAL.email}
              </a>
            </li>
            <li>WhatsApp o teléfono: {LEGAL.telefono}</li>
            <li>
              Documento de privacidad:{' '}
              <Link href="/privacidad" className="text-primary hover:text-primary/80 font-medium underline">
                {LEGAL.sitio}/privacidad
              </Link>
            </li>
            <li>
              Eliminación de datos:{' '}
              <Link href="/eliminacion" className="text-primary hover:text-primary/80 font-medium underline">
                {LEGAL.sitio}/eliminacion
              </Link>
            </li>
          </ul>
          <LegalCallout className="mt-6">
            Este documento tiene carácter informativo del servicio en línea y
            no constituye asesoría legal para el caso particular de ningún
            cliente.
          </LegalCallout>
        </LegalSection>
      </div>
    </LegalShell>
  );
}
