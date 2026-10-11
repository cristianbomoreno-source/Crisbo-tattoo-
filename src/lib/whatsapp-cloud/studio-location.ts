/** Ubicación del estudio que envía el botón "Ubicación" del chat: llega al
 * cliente como mensaje de ubicación nativo de WhatsApp (mapa con pin, nombre
 * y dirección debajo). */
export const STUDIO_LOCATION = {
  latitude: 4.7275,
  longitude: -74.064499,
  name: 'Crisbo Tattoo',
  address: 'Calle 137B, Bogotá, Bogotá, Colombia',
}

/** Texto de la burbuja en la bandeja (mismo formato que una ubicación entrante). */
export function studioLocationText() {
  const l = STUDIO_LOCATION
  return `${l.name} — ${l.address}\nhttps://maps.google.com/?q=${l.latitude},${l.longitude}`
}
