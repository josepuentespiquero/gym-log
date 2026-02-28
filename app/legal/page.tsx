export default function LegalPage() {
  const BB: React.CSSProperties = { fontFamily: 'var(--font-bebas)' }

  const H1: React.CSSProperties = {
    ...BB,
    fontSize: '2.8rem',
    color: '#c8f135',
    letterSpacing: 3,
    marginBottom: 4,
  }

  const H2: React.CSSProperties = {
    fontSize: '1.1rem',
    fontWeight: 700,
    color: '#c8f135',
    marginTop: 32,
    marginBottom: 8,
  }

  const P: React.CSSProperties = {
    color: '#ccc',
    fontSize: '0.9rem',
    lineHeight: 1.75,
    marginBottom: 0,
  }

  const LI: React.CSSProperties = {
    color: '#ccc',
    fontSize: '0.9rem',
    lineHeight: 1.75,
    marginBottom: 4,
  }

  return (
    <div style={{ background: '#0e0e0e', minHeight: '100vh', display: 'flex', justifyContent: 'center', padding: '48px 16px 80px', fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif' }}>
      <div style={{ width: '100%', maxWidth: 680 }}>

        {/* ── Política de Privacidad ─────────────────────────────── */}
        <div style={{ marginBottom: 64 }}>
          <div style={H1}>Política de Privacidad</div>
          <p style={{ color: '#555', fontSize: '0.8rem', letterSpacing: 1, marginBottom: 32 }}>Última actualización: febrero de 2026</p>

          <h2 style={H2}>1. ¿Quién es el responsable del tratamiento?</h2>
          <p style={P}>El responsable del tratamiento de tus datos personales es el equipo desarrollador de Gym Log (en adelante, &apos;Gym Log&apos;, &apos;nosotros&apos; o &apos;nuestro&apos;). Para cualquier consulta relacionada con tu privacidad, puedes contactarnos en: <a href="mailto:appgymlog@gmail.com" style={{ color: '#c8f135' }}>appgymlog@gmail.com</a></p>

          <h2 style={H2}>2. ¿Qué datos recogemos?</h2>
          <p style={{ ...P, marginBottom: 8 }}>Al usar Gym Log, recopilamos los siguientes tipos de datos:</p>
          <ul style={{ paddingLeft: 20, margin: 0 }}>
            <li style={LI}><strong style={{ color: '#f0f0f0' }}>Datos de registro:</strong> nombre de usuario, dirección de correo electrónico y contraseña (almacenada de forma cifrada).</li>
            <li style={LI}><strong style={{ color: '#f0f0f0' }}>Datos de entrenamiento:</strong> ejercicios registrados, series, repeticiones, pesos, tiempos, notas y cualquier otro contenido que introduzcas en la app.</li>
            <li style={LI}><strong style={{ color: '#f0f0f0' }}>Datos de uso:</strong> cómo navegas por la app, funcionalidades que utilizas, frecuencia de uso y datos de rendimiento técnico.</li>
            <li style={LI}><strong style={{ color: '#f0f0f0' }}>Datos del dispositivo:</strong> tipo de dispositivo, sistema operativo y versión de la app.</li>
          </ul>

          <h2 style={H2}>3. ¿Para qué usamos tus datos?</h2>
          <div style={{ borderLeft: '3px solid #c8f135', paddingLeft: 16, marginBottom: 12 }}>
            <p style={{ ...P, color: '#c8f135', fontStyle: 'italic' }}>Ser transparentes sobre el uso de tus datos es fundamental para nosotros. Gym Log es gratuita porque los datos que generas nos permiten mejorar el producto y desarrollar nuevos servicios.</p>
          </div>
          <p style={{ ...P, marginBottom: 8 }}>Usamos tus datos para:</p>
          <ul style={{ paddingLeft: 20, margin: 0 }}>
            <li style={LI}>Prestarte el servicio de registro y seguimiento de entrenamientos.</li>
            <li style={LI}>Analizar patrones de uso para mejorar la experiencia de la app.</li>
            <li style={LI}>Realizar análisis estadísticos e investigación sobre hábitos de entrenamiento (siempre de forma anonimizada o agregada cuando se comparte externamente).</li>
            <li style={LI}>Entrenar y mejorar modelos de análisis de rendimiento deportivo.</li>
            <li style={LI}>Enviarte comunicaciones relacionadas con el servicio (novedades, cambios importantes).</li>
          </ul>

          <h2 style={H2}>4. ¿Cuál es la base legal del tratamiento? (RGPD)</h2>
          <p style={{ ...P, marginBottom: 8 }}>Dado que nuestra app opera en Europa, el tratamiento de tus datos se basa en:</p>
          <ul style={{ paddingLeft: 20, margin: 0 }}>
            <li style={LI}>Tu consentimiento explícito, prestado al aceptar esta política durante el registro. Puedes retirar tu consentimiento en cualquier momento (ver sección 7).</li>
            <li style={LI}>Interés legítimo para el análisis interno y mejora del servicio.</li>
          </ul>

          <h2 style={H2}>5. ¿Compartimos tus datos con terceros?</h2>
          <p style={{ ...P, marginBottom: 8 }}>No vendemos tus datos personales a terceros. Sin embargo, podemos compartir datos en los siguientes casos:</p>
          <ul style={{ paddingLeft: 20, margin: 0 }}>
            <li style={LI}>Proveedores de servicios técnicos (hosting, bases de datos, analítica) que tratan los datos anonimizados y bajo nuestras instrucciones.</li>
            <li style={LI}>Datos estadísticos o de investigación siempre de forma anonimizada y agregada, nunca datos individuales identificables.</li>
            <li style={LI}>Cuando sea requerido por ley o autoridad competente.</li>
          </ul>

          <h2 style={H2}>6. ¿Durante cuánto tiempo conservamos tus datos?</h2>
          <p style={P}>Conservamos tus datos mientras mantengas tu cuenta activa. Si decides eliminar tu cuenta, procederemos a borrar tus datos personales en un plazo máximo de 30 días, salvo que exista obligación legal de conservarlos.</p>

          <h2 style={H2}>7. ¿Cuáles son tus derechos?</h2>
          <p style={{ ...P, marginBottom: 8 }}>En virtud del RGPD, tienes los siguientes derechos:</p>
          <ul style={{ paddingLeft: 20, margin: 0 }}>
            <li style={LI}><strong style={{ color: '#f0f0f0' }}>Rectificación:</strong> corregir datos inexactos o incompletos.</li>
            <li style={LI}><strong style={{ color: '#f0f0f0' }}>Supresión (&apos;derecho al olvido&apos;):</strong> solicitar la eliminación de tus datos.</li>
            <li style={LI}><strong style={{ color: '#f0f0f0' }}>Portabilidad:</strong> recibir tus datos en formato estructurado y legible por máquina.</li>
            <li style={LI}><strong style={{ color: '#f0f0f0' }}>Oposición:</strong> oponerte al tratamiento de tus datos para determinados fines.</li>
            <li style={LI}><strong style={{ color: '#f0f0f0' }}>Retirada del consentimiento:</strong> en cualquier momento, sin que ello afecte a la licitud del tratamiento previo.</li>
          </ul>
          <p style={{ ...P, marginTop: 12 }}>Para ejercer cualquiera de estos derechos, contacta con nosotros en: <a href="mailto:appgymlog@gmail.com" style={{ color: '#c8f135' }}>appgymlog@gmail.com</a> — Responderemos en un plazo máximo de 30 días.</p>

          <h2 style={H2}>8. Seguridad de los datos</h2>
          <p style={P}>Aplicamos medidas técnicas y organizativas adecuadas para proteger tus datos frente a accesos no autorizados, pérdida o destrucción, incluyendo cifrado de contraseñas y transmisión segura mediante HTTPS.</p>

          <h2 style={H2}>9. Cambios en esta política</h2>
          <p style={P}>Podemos actualizar esta Política de Privacidad. Te notificaremos cualquier cambio relevante mediante un aviso en la app o por correo electrónico con al menos 15 días de antelación.</p>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid #2e2e2e', marginBottom: 64 }} />

        {/* ── Términos de Uso ────────────────────────────────────── */}
        <div>
          <div style={H1}>Términos de Uso</div>
          <p style={{ color: '#555', fontSize: '0.8rem', letterSpacing: 1, marginBottom: 32 }}>Última actualización: febrero de 2026</p>

          <h2 style={H2}>1. Aceptación de los términos</h2>
          <p style={P}>Al registrarte y usar Gym Log, aceptas íntegramente estos Términos de Uso. Si no estás de acuerdo con alguno de ellos, no podrás utilizar la aplicación.</p>

          <h2 style={H2}>2. Descripción del servicio</h2>
          <p style={P}>Gym Log es una aplicación móvil y/o web gratuita que permite a los usuarios registrar, organizar y hacer seguimiento de sus entrenamientos deportivos. El servicio se presta de forma gratuita a cambio del uso de los datos generados por el usuario, tal y como se describe en la Política de Privacidad.</p>

          <h2 style={H2}>3. Licencia de uso</h2>
          <p style={P}>Te otorgamos una licencia limitada, no exclusiva, no transferible y revocable para usar Gym Log exclusivamente para tus fines personales y no comerciales.</p>

          <h2 style={H2}>4. Licencia sobre el contenido que introduces</h2>
          <p style={P}>Al introducir datos en Gym Log, nos concedes una licencia mundial, gratuita y no exclusiva para usar, analizar, procesar y mejorar nuestros servicios con dicho contenido. Esta licencia no te priva de la propiedad de tus datos ni te impide eliminarlos.</p>

          <h2 style={H2}>5. Conducta del usuario</h2>
          <p style={{ ...P, marginBottom: 8 }}>Al usar Gym Log te comprometes a:</p>
          <ul style={{ paddingLeft: 20, margin: 0 }}>
            <li style={LI}>No introducir información falsa, fraudulenta o engañosa.</li>
            <li style={LI}>No intentar acceder a cuentas o datos de otros usuarios.</li>
            <li style={LI}>No realizar ingeniería inversa, descompilar o intentar extraer el código fuente de la app.</li>
            <li style={LI}>No usar la app para fines ilegales o que violen derechos de terceros.</li>
          </ul>

          <h2 style={H2}>6. Disponibilidad del servicio</h2>
          <p style={P}>Nos esforzamos por mantener Gym Log disponible de forma continua, pero no garantizamos una disponibilidad del 100%. Podemos interrumpir el servicio temporalmente por mantenimiento, actualizaciones o causas ajenas a nuestra voluntad.</p>

          <h2 style={H2}>7. Modificaciones del servicio</h2>
          <p style={P}>Nos reservamos el derecho de modificar, suspender o discontinuar el servicio (total o parcialmente) en cualquier momento, con un aviso previo razonable cuando sea posible.</p>

          <h2 style={H2}>8. Limitación de responsabilidad</h2>
          <p style={P}>Gym Log se proporciona &apos;tal cual&apos;, sin garantías de ningún tipo. No seremos responsables de daños indirectos, incidentales o consecuentes derivados del uso o la imposibilidad de uso de la app.</p>

          <h2 style={H2}>9. Modificaciones de los términos</h2>
          <p style={P}>Podemos actualizar estos Términos de Uso. Te notificaremos los cambios con al menos 15 días de antelación. El uso continuado de la app tras la entrada en vigor de los nuevos términos implica su aceptación.</p>

          <h2 style={H2}>10. Ley aplicable</h2>
          <p style={P}>Estos términos se rigen por la legislación española. Para cualquier controversia, las partes se someten a los juzgados y tribunales de Granada.</p>
        </div>

      </div>
    </div>
  )
}
