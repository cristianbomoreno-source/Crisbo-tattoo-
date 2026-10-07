/**
 * Abrir WhatsApp DESPUÉS de esperar una respuesta del servidor (crear la
 * cita, pedir el link) rompe la cadena síncrona del gesto del usuario —
 * Safari/iOS bloquea `window.open` en ese caso. El truco: abrir una
 * pestaña en blanco de una vez (síncrono, dentro del propio click), y
 * cuando ya se tiene el link real, redirigir esa misma pestaña.
 *
 * Uso:
 *   const tab = openWhatsAppTab()      // primera línea del handler, sin await antes
 *   const { link } = await creaLaCitaYPideElLink()
 *   redirectWhatsAppTab(tab, link)     // navega la pestaña ya abierta (o la cierra si no hay link)
 */
export function openWhatsAppTab(): Window | null {
  try {
    return window.open('', '_blank')
  } catch {
    return null
  }
}

export function redirectWhatsAppTab(tab: Window | null, link: string | null | undefined) {
  if (!tab || tab.closed) return
  if (link) {
    tab.location.href = link
  } else {
    tab.close()
  }
}
