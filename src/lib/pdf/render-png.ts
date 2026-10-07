import { ImageResponse } from 'next/og'

/** `new ImageResponse(...)` no lanza el error de render de forma síncrona:
 * arma un stream y lo va llenando después, así que un try/catch alrededor
 * del constructor NO atrapa el fallo real. Forzar `.arrayBuffer()` obliga a
 * esperar el render completo, así el error sí llega como una promesa
 * rechazada que se puede capturar de verdad. */
export async function renderPng(node: React.ReactElement, width: number, height: number): Promise<ArrayBuffer> {
  const res = new ImageResponse(node, { width, height })
  return res.arrayBuffer()
}
