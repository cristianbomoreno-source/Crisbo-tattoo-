import { Anton } from 'next/font/google'

/** Letra condensada de los carruseles de @crisbotattoo. Se usa por nombre de
 * familia (no por variable CSS) para que funcione también dentro de los
 * popups, que se abren fuera del layout de /marketing. */
export const anton = Anton({ weight: '400', subsets: ['latin'], display: 'swap' })
