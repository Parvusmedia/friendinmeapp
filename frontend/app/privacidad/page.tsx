import type { Metadata } from "next";
import styles from "./privacidad.module.css";

export const metadata: Metadata = {
  title: "Política de privacidad — FriendInMe",
  description: "Política de privacidad de FriendInMe, plataforma de adopción responsable de perros.",
};

const CONTACT_EMAIL = "dpo@friendinme.app";

export default function PrivacidadPage() {
  return (
    <article className={`container ${styles.page}`}>
      <h1 className={styles.title}>Política de privacidad de FriendInMe</h1>
      <p className={styles.updated}>Última actualización: 26/05/2026</p>

      <section className={styles.section}>
        <h2>1. Responsable del tratamiento</h2>
        <p>El responsable del tratamiento de los datos personales recogidos a través de FriendInMe es:</p>
        <p>
          <strong>Parvus Media, S.L.U.</strong>
          <br />
          CIF: B86670296
          <br />
          Domicilio: Calle Puerto Rico Nº4, Majadahonda, Madrid (28220). España.
        </p>
        <p>
          Email de contacto en materia de privacidad:{" "}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
        </p>
        <p>
          FriendInMe es una plataforma digital orientada a facilitar el contacto entre personas interesadas en adoptar
          un perro y refugios, protectoras u organizaciones que gestionan animales en adopción.
        </p>
      </section>

      <section className={styles.section}>
        <h2>2. Qué es FriendInMe</h2>
        <p>FriendInMe es una página de uso gratuito tanto para adoptantes como para refugios.</p>
        <p>
          El objetivo principal de la plataforma es ayudar a que las personas que desean adoptar puedan encontrar
          perros compatibles con sus preferencias, ubicación, estilo de vida y capacidad de cuidado, y facilitar que
          los refugios puedan recibir solicitudes de adopción más adecuadas.
        </p>
        <p>FriendInMe no cobra a los adoptantes ni a los refugios por el uso básico de la plataforma.</p>
      </section>

      <section className={styles.section} id="modelo-financiacion">
        <h2>3. Modelo de financiación de FriendInMe</h2>
        <p>
          FriendInMe obtiene ingresos principalmente mediante publicidad, patrocinios, acuerdos comerciales y
          colaboraciones con empresas del sector de las mascotas.
        </p>
        <p>
          Esto puede incluir, entre otros, acuerdos con empresas de alimentación para mascotas, seguros para mascotas,
          clínicas veterinarias, adiestradores, servicios de cuidado animal, tiendas especializadas u otros servicios
          relacionados con la adopción y el bienestar de los perros.
        </p>
        <p>
          Siempre que sea necesario, FriendInMe solicitará el consentimiento del usuario antes de compartir sus datos
          con terceros con fines comerciales o publicitarios.
        </p>
      </section>

      <section className={styles.section}>
        <h2>4. Datos personales que podemos tratar</h2>
        <p>En función del uso que hagas de FriendInMe, podemos tratar los siguientes datos:</p>
        <p className={styles.subheading}>a) Datos de adoptantes:</p>
        <ul>
          <li>Email.</li>
          <li>Región, provincia o zona aproximada de residencia.</li>
          <li>
            Preferencias de adopción, como tipo de perro buscado, tamaño, edad, nivel de energía, compatibilidad con
            niños, compatibilidad con otros animales u otros criterios indicados en el cuestionario.
          </li>
          <li>Información declarada voluntariamente en formularios o cuestionarios.</li>
          <li>Consentimientos otorgados en la plataforma.</li>
          <li>
            Datos técnicos básicos derivados del uso de la web, como cookies, identificadores técnicos, navegador,
            dispositivo o dirección IP, cuando aplique.
          </li>
        </ul>
        <p className={styles.subheading}>b) Datos de refugios o protectoras:</p>
        <ul>
          <li>Nombre de la entidad.</li>
          <li>Datos de contacto profesional.</li>
          <li>Ubicación aproximada.</li>
          <li>Información sobre los perros publicados.</li>
          <li>Información necesaria para gestionar las fichas de adopción.</li>
        </ul>
        <p>
          FriendInMe no solicita ni comparte datos especialmente sensibles como DNI, dirección postal completa,
          documentación personal, datos bancarios o información médica del usuario adoptante, salvo que en el futuro
          se indique expresamente y exista una base legal adecuada.
        </p>
      </section>

      <section className={styles.section}>
        <h2>5. Finalidades del tratamiento</h2>
        <p>Tratamos tus datos para las siguientes finalidades:</p>
        <p className={styles.subheading}>a) Gestionar el uso de la plataforma:</p>
        <ul>
          <li>Crear y gestionar solicitudes de adopción.</li>
          <li>Poner en contacto a adoptantes y refugios.</li>
          <li>Mostrar perros compatibles con las preferencias del usuario.</li>
          <li>Facilitar la comunicación relacionada con una posible adopción.</li>
        </ul>
        <p className={styles.subheading}>b) Mejorar la experiencia de usuario:</p>
        <ul>
          <li>Analizar el funcionamiento de la plataforma.</li>
          <li>Mejorar el sistema de recomendaciones.</li>
          <li>Detectar errores técnicos.</li>
          <li>Entender qué tipos de perros, regiones o necesidades generan mayor interés.</li>
        </ul>
        <p className={styles.subheading}>c) Comunicaciones relacionadas con la plataforma:</p>
        <ul>
          <li>Enviar información operativa sobre solicitudes de adopción.</li>
          <li>Confirmar registros, formularios o cambios relevantes.</li>
          <li>Contactar con el usuario en relación con su actividad en FriendInMe.</li>
        </ul>
        <p className={styles.subheading}>d) Comunicaciones comerciales propias:</p>
        <p>
          Enviar información sobre servicios, novedades, colaboraciones o contenidos relacionados con adopción,
          mascotas, alimentación, salud animal, seguros para mascotas, educación canina u otros servicios afines,
          siempre que exista base legal para ello.
        </p>
        <p className={styles.subheading}>e) Comunicación de datos a empresas colaboradoras:</p>
        <p>
          Cuando el usuario haya dado su consentimiento, FriendInMe podrá compartir determinados datos con empresas
          del sector de las mascotas para que puedan ofrecer servicios relacionados con sus intereses.
        </p>
        <p>Estos servicios pueden incluir, entre otros:</p>
        <ul>
          <li>Alimento para mascotas.</li>
          <li>Seguros para mascotas.</li>
          <li>Servicios veterinarios.</li>
          <li>Clínicas veterinarias locales.</li>
          <li>Adiestradores.</li>
          <li>Peluquerías caninas.</li>
          <li>Cuidadores.</li>
          <li>Tiendas o servicios especializados para perros.</li>
        </ul>
      </section>

      <section className={styles.section}>
        <h2>6. Qué datos podemos compartir con empresas colaboradoras</h2>
        <p>
          Si el usuario acepta expresamente esta opción, FriendInMe podrá compartir con empresas colaboradoras una
          selección limitada de datos orientados a ofrecer servicios relacionados con la adopción o el cuidado de
          mascotas.
        </p>
        <p>Los datos que podrán compartirse son:</p>
        <ul>
          <li>Email.</li>
          <li>Región, provincia o zona aproximada en la que vive el usuario.</li>
          <li>Tipo de perro que busca o por el que ha mostrado interés.</li>
          <li>Preferencias generales indicadas en el cuestionario de adopción.</li>
        </ul>
        <p>FriendInMe no compartirá con empresas colaboradoras:</p>
        <ul>
          <li>Nombre y apellidos.</li>
          <li>DNI, NIE o documento identificativo.</li>
          <li>Dirección postal completa.</li>
          <li>Teléfono, salvo consentimiento específico adicional.</li>
          <li>Datos bancarios.</li>
          <li>Información no necesaria para la finalidad comercial autorizada.</li>
        </ul>
        <p>
          La finalidad de esta comunicación será permitir que empresas del sector puedan ofrecer productos o servicios
          afines a la adopción y cuidado de perros.
        </p>
      </section>

      <section className={styles.section}>
        <h2>7. Base legal del tratamiento</h2>
        <p>Las bases legales para tratar tus datos son:</p>
        <p className={styles.subheading}>a) Ejecución de una relación solicitada por el usuario:</p>
        <p>
          Cuando utilizas FriendInMe para buscar perros en adopción, enviar formularios o contactar con refugios.
        </p>
        <p className={styles.subheading}>b) Consentimiento:</p>
        <p>
          Cuando aceptas recibir comunicaciones comerciales, participar en acciones promocionales o permitir que
          determinados datos sean compartidos con empresas colaboradoras.
        </p>
        <p className={styles.subheading}>c) Interés legítimo:</p>
        <p>
          Para mejorar la seguridad, prevenir abusos, analizar el funcionamiento de la plataforma y mejorar el
          servicio, siempre respetando tus derechos y libertades.
        </p>
        <p className={styles.subheading}>d) Cumplimiento de obligaciones legales:</p>
        <p>Cuando sea necesario conservar determinada información para cumplir obligaciones legales aplicables.</p>
      </section>

      <section className={styles.section}>
        <h2>8. Consentimientos</h2>
        <p>Los consentimientos que marques en el cuestionario o en los formularios de FriendInMe quedarán registrados.</p>
        <p>Podrás aceptar o rechazar de forma separada:</p>
        <ul>
          <li>El uso de tus datos para gestionar solicitudes de adopción.</li>
          <li>La recepción de comunicaciones informativas o comerciales de FriendInMe.</li>
          <li>La comunicación limitada de tus datos a empresas colaboradoras del sector de mascotas.</li>
        </ul>
        <p>
          El uso gratuito de FriendInMe no estará condicionado a aceptar comunicaciones comerciales de terceros, salvo
          que se indique expresamente en una promoción concreta y de forma transparente.
        </p>
        <p>
          Puedes retirar tu consentimiento en cualquier momento escribiendo a{" "}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        </p>
      </section>

      <section className={styles.section}>
        <h2>9. Publicidad y cookies</h2>
        <p>FriendInMe puede mostrar publicidad en la plataforma.</p>
        <p>
          Esta publicidad puede ser contextual, basada en el contenido de la página o en el tipo de servicio
          consultado, o personalizada cuando el usuario haya aceptado las cookies o tecnologías equivalentes que lo
          permitan.
        </p>
        <p>
          El uso de cookies publicitarias, analíticas o de personalización se regulará en la correspondiente Política
          de Cookies.
        </p>
      </section>

      <section className={styles.section}>
        <h2>10. Conservación de los datos</h2>
        <p>
          FriendInMe conservará los datos personales durante el tiempo necesario para cumplir las finalidades para las
          que fueron recogidos.
        </p>
        <p>En general:</p>
        <ul>
          <li>
            Los datos de adoptantes se conservarán mientras el usuario mantenga una relación activa con la
            plataforma o no solicite su supresión.
          </li>
          <li>
            Los consentimientos se conservarán mientras estén vigentes y, posteriormente, durante el plazo necesario
            para acreditar su obtención.
          </li>
          <li>Los datos técnicos o analíticos se conservarán durante los plazos indicados en la Política de Cookies.</li>
          <li>
            Los datos necesarios para cumplir obligaciones legales podrán conservarse durante los plazos legalmente
            exigidos.
          </li>
        </ul>
      </section>

      <section className={styles.section}>
        <h2>11. Destinatarios de los datos</h2>
        <p>Los datos podrán ser comunicados a:</p>
        <ul>
          <li>
            Refugios, protectoras u organizaciones de adopción, cuando sea necesario para gestionar una solicitud de
            adopción.
          </li>
          <li>
            Proveedores tecnológicos que prestan servicios necesarios para el funcionamiento de la plataforma, como
            hosting, email, analítica, formularios, CRM o herramientas de automatización.
          </li>
          <li>
            Empresas colaboradoras del sector de mascotas, únicamente cuando el usuario haya dado su consentimiento
            para ello.
          </li>
          <li>Administraciones públicas, juzgados o autoridades competentes, cuando exista obligación legal.</li>
        </ul>
        <p>
          Los proveedores tecnológicos actuarán, cuando corresponda, como encargados del tratamiento y deberán tratar
          los datos conforme a las instrucciones de Parvus Media, S.L.U.
        </p>
      </section>

      <section className={styles.section}>
        <h2>12. Transferencias internacionales</h2>
        <p>
          Algunos proveedores tecnológicos utilizados por FriendInMe podrían estar ubicados fuera del Espacio Económico
          Europeo.
        </p>
        <p>
          En caso de producirse transferencias internacionales de datos, FriendInMe adoptará las garantías legalmente
          exigidas, como cláusulas contractuales tipo aprobadas por la Comisión Europea u otros mecanismos válidos
          conforme a la normativa aplicable.
        </p>
      </section>

      <section className={styles.section}>
        <h2>13. Derechos del usuario</h2>
        <p>Puedes ejercer en cualquier momento los siguientes derechos:</p>
        <ul>
          <li>
            <strong>Acceso:</strong> saber qué datos tratamos sobre ti.
          </li>
          <li>
            <strong>Rectificación:</strong> corregir datos inexactos.
          </li>
          <li>
            <strong>Supresión:</strong> solicitar la eliminación de tus datos.
          </li>
          <li>
            <strong>Oposición:</strong> oponerte a determinados tratamientos.
          </li>
          <li>
            <strong>Limitación:</strong> solicitar que limitemos el uso de tus datos.
          </li>
          <li>
            <strong>Portabilidad:</strong> solicitar que te entreguemos tus datos en un formato estructurado.
          </li>
          <li>
            <strong>Retirada del consentimiento:</strong> retirar consentimientos previamente otorgados.
          </li>
        </ul>
        <p>
          Para ejercer tus derechos, puedes escribir a: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
        </p>
        <p>Indicando en el asunto: «Protección de datos - FriendInMe».</p>
        <p>
          También puedes presentar una reclamación ante la Agencia Española de Protección de Datos si consideras que
          el tratamiento de tus datos no se ajusta a la normativa aplicable.
        </p>
      </section>

      <section className={styles.section}>
        <h2>14. Seguridad de los datos</h2>
        <p>
          FriendInMe aplicará medidas técnicas y organizativas razonables para proteger los datos personales frente a
          accesos no autorizados, pérdida, alteración, uso indebido o divulgación no autorizada.
        </p>
        <p>
          Estas medidas se aplicarán teniendo en cuenta la naturaleza de los datos tratados, el contexto del
          tratamiento y los riesgos existentes.
        </p>
      </section>

      <section className={styles.section}>
        <h2>15. Datos de menores</h2>
        <p>FriendInMe no está dirigida a menores de 14 años.</p>
        <p>
          Si detectamos que se han recogido datos de un menor de 14 años sin autorización válida de sus padres,
          madres o tutores legales, procederemos a eliminarlos tan pronto como sea posible.
        </p>
      </section>

      <section className={styles.section}>
        <h2>16. Cambios en la Política de Privacidad</h2>
        <p>
          FriendInMe podrá actualizar esta Política de Privacidad para adaptarla a cambios legales, técnicos,
          comerciales o funcionales.
        </p>
        <p>
          Cuando los cambios sean relevantes, se informará a los usuarios a través de la web o por otros medios
          adecuados.
        </p>
      </section>

      <section className={styles.section}>
        <h2>17. Contacto</h2>
        <p>
          Para cualquier consulta relacionada con esta Política de Privacidad o con el tratamiento de tus datos
          personales, puedes escribir a: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
        </p>
      </section>
    </article>
  );
}
