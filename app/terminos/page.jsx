import Link from "next/link";

export const metadata = {
  title: "Términos y Condiciones - Rifa Crisbo Tattoo",
  description: "Términos y condiciones de la rifa de tatuaje + boleta Ryan Castro organizada por Crisbo Tattoo Studio.",
};

export default function TerminosPage() {
  return (
    <div className="min-h-screen bg-bg text-cream">
      {/* Header */}
      <div className="sticky top-0 bg-bg/95 backdrop-blur-sm border-b border-line z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-muted hover:text-cream transition-colors">
            ← Volver
          </Link>
          <h1 className="font-bold text-lg" style={{ fontFamily: 'var(--font-display)' }}>
            TÉRMINOS Y CONDICIONES
          </h1>
          <div className="w-16" />
        </div>
      </div>

      {/* Contenido */}
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        {/* Intro */}
        <div className="bg-surface rounded-2xl p-6">
          <h2 className="text-orange text-xl font-bold mb-4" style={{ fontFamily: 'var(--font-headline)' }}>
            RIFA CRISBO TATTOO 2026
          </h2>
          <p className="text-muted text-sm">
            Al participar en esta rifa, aceptas los siguientes términos y condiciones.
            Te recomendamos leerlos detenidamente antes de adquirir tu boleta.
          </p>
        </div>

        {/* Secciones */}
        <Section title="1. ORGANIZADOR">
          <p>
            Esta rifa es organizada por <strong>Crisbo Tattoo Studio</strong>,
            con domicilio en Cl. 137b #57b - 39, piso 2, Bogotá, Colombia.
            Contacto: WhatsApp +57 320 210 7769, Instagram @crisbotattoo.
          </p>
        </Section>

        <Section title="2. DESCRIPCIÓN DE LOS PREMIOS">
          <ul className="list-disc list-inside space-y-2 text-muted">
            <li>
              <strong className="text-cream">Premio principal:</strong> Un (1) tatuaje en blanco y negro
              de hasta 25 cm, valorado en $1.000.000 COP. El diseño será personalizado y acordado
              entre el ganador y el artista.
            </li>
            <li>
              <strong className="text-cream">Premio adicional:</strong> Una (1) boleta para el
              concierto de Ryan Castro en Bogotá, localidad Oriental Baja. Fecha del evento por confirmar.
            </li>
          </ul>
        </Section>

        <Section title="3. VALOR Y CANTIDAD DE BOLETAS">
          <ul className="list-disc list-inside space-y-2 text-muted">
            <li>Valor por boleta: <strong className="text-cream">$30.000 COP</strong></li>
            <li>Cantidad total de boletas: <strong className="text-cream">200 unidades</strong></li>
            <li>Numeración: Del 001 al 200</li>
            <li>Cada participante puede adquirir una o más boletas</li>
          </ul>
        </Section>

        <Section title="4. FECHA Y MÉTODO DEL SORTEO">
          <ul className="list-disc list-inside space-y-2 text-muted">
            <li>
              <strong className="text-cream">Fecha del sorteo:</strong> 24 de octubre de 2026
            </li>
            <li>
              <strong className="text-cream">Método:</strong> El número ganador corresponderá a las
              últimas tres (3) cifras del premio mayor de la <strong>Lotería de Boyacá</strong>
              en el sorteo de la fecha indicada.
            </li>
            <li>
              Si las últimas tres cifras corresponden a un número no vendido, se tomará el número
              vendido inmediatamente superior. Si no existe superior, se tomará el inferior más cercano.
            </li>
          </ul>
        </Section>

        <Section title="5. FORMA DE PAGO">
          <ul className="list-disc list-inside space-y-2 text-muted">
            <li>
              El pago se realiza mediante transferencia bancaria usando <strong className="text-cream">Llave Bre-B</strong>
              (Transfiya) o escaneando el código QR proporcionado.
            </li>
            <li>Llave Bre-B: <strong className="text-cream">@bfms892177</strong></li>
            <li>
              El participante debe incluir en la descripción del pago el número de boleta seleccionado
              (ejemplo: "RIFA #027").
            </li>
            <li>
              La boleta se considera reservada una vez enviado el comprobante de pago.
              La confirmación oficial se realizará por WhatsApp dentro de las 24 horas siguientes.
            </li>
          </ul>
        </Section>

        <Section title="6. REQUISITOS DE PARTICIPACIÓN">
          <ul className="list-disc list-inside space-y-2 text-muted">
            <li>Ser mayor de 18 años</li>
            <li>Residir en Colombia</li>
            <li>Proporcionar datos verídicos (nombre completo y número de WhatsApp)</li>
            <li>Completar el pago de la boleta antes de la fecha del sorteo</li>
          </ul>
        </Section>

        <Section title="7. CONDICIONES DEL PREMIO - TATUAJE">
          <ul className="list-disc list-inside space-y-2 text-muted">
            <li>
              El tatuaje debe realizarse en las instalaciones de Crisbo Tattoo Studio en Bogotá.
            </li>
            <li>
              El ganador debe agendar su cita dentro de los <strong className="text-cream">60 días</strong>
              siguientes al sorteo.
            </li>
            <li>
              El tatuaje debe realizarse antes del <strong className="text-cream">31 de diciembre de 2026</strong>.
              Pasada esta fecha, el premio no podrá ser reclamado.
            </li>
            <li>
              El diseño será acordado entre el ganador y el artista. No se permiten diseños que
              promuevan odio, discriminación o contenido ilegal.
            </li>
            <li>
              El premio no es transferible a terceros ni canjeable por dinero en efectivo.
            </li>
            <li>
              Si el tatuaje acordado tiene un valor inferior a $1.000.000, no se realizará
              reembolso de la diferencia.
            </li>
          </ul>
        </Section>

        <Section title="8. CONDICIONES DEL PREMIO - BOLETA CONCIERTO">
          <ul className="list-disc list-inside space-y-2 text-muted">
            <li>
              La boleta corresponde a la localidad <strong className="text-cream">Oriental Baja</strong>
              del concierto de Ryan Castro en Bogotá.
            </li>
            <li>
              La fecha y lugar del concierto serán comunicados oportunamente según información oficial.
            </li>
            <li>
              En caso de cancelación del evento por causas ajenas al organizador, se buscará una
              alternativa de compensación equivalente.
            </li>
            <li>
              El premio no es canjeable por dinero en efectivo.
            </li>
          </ul>
        </Section>

        <Section title="9. NOTIFICACIÓN AL GANADOR">
          <ul className="list-disc list-inside space-y-2 text-muted">
            <li>
              El ganador será notificado el mismo día del sorteo a través del número de WhatsApp
              registrado al momento de la compra.
            </li>
            <li>
              El resultado también será publicado en las redes sociales oficiales de Crisbo Tattoo
              (@crisbotattoo en Instagram).
            </li>
            <li>
              El ganador deberá responder dentro de las <strong className="text-cream">48 horas</strong>
              siguientes a la notificación para coordinar la entrega de los premios.
            </li>
          </ul>
        </Section>

        <Section title="10. DEVOLUCIONES Y CAMBIOS">
          <ul className="list-disc list-inside space-y-2 text-muted">
            <li>
              Una vez confirmado el pago, <strong className="text-cream">no se realizan devoluciones</strong>
              ni cambios de número de boleta.
            </li>
            <li>
              En caso de duplicidad de pago por error, se realizará el reembolso correspondiente
              previa verificación.
            </li>
          </ul>
        </Section>

        <Section title="11. PROTECCIÓN DE DATOS">
          <ul className="list-disc list-inside space-y-2 text-muted">
            <li>
              Los datos personales recopilados (nombre, WhatsApp, email) serán utilizados
              exclusivamente para la gestión de la rifa.
            </li>
            <li>
              No se compartirán los datos con terceros sin consentimiento del participante.
            </li>
            <li>
              El participante autoriza el uso de su imagen y nombre para fines publicitarios
              relacionados con la rifa en caso de resultar ganador.
            </li>
          </ul>
        </Section>

        <Section title="12. RESPONSABILIDADES">
          <ul className="list-disc list-inside space-y-2 text-muted">
            <li>
              El organizador no se hace responsable por errores en los datos proporcionados
              por el participante.
            </li>
            <li>
              El organizador se reserva el derecho de descalificar participantes que incumplan
              estos términos o actúen de manera fraudulenta.
            </li>
            <li>
              En caso de fuerza mayor que impida la realización del sorteo en la fecha programada,
              el organizador comunicará la nueva fecha con anticipación.
            </li>
          </ul>
        </Section>

        <Section title="13. ACEPTACIÓN">
          <p>
            Al adquirir una boleta, el participante declara haber leído, entendido y aceptado
            la totalidad de estos términos y condiciones.
          </p>
        </Section>

        {/* Contacto */}
        <div className="bg-surface rounded-2xl p-6 text-center">
          <p className="text-muted text-sm mb-4">
            ¿Tienes dudas? Contáctanos:
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://wa.me/573202107769"
              className="bg-green-600 text-white px-6 py-3 rounded-full font-semibold text-sm"
            >
              WhatsApp: 320 210 7769
            </a>
            <a
              href="https://instagram.com/crisbotattoo"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-full font-semibold text-sm"
            >
              @crisbotattoo
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-muted text-xs pb-8">
          <p>Última actualización: Septiembre 2026</p>
          <p className="mt-2">© 2026 Crisbo Tattoo Studio. Todos los derechos reservados.</p>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section>
      <h3 className="text-gold font-bold text-sm tracking-wider mb-3" style={{ fontFamily: 'var(--font-display)' }}>
        {title}
      </h3>
      <div className="text-cream/80 text-sm leading-relaxed">
        {children}
      </div>
    </section>
  );
}
