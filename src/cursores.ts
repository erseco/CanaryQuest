/**
 * Cursores de aventura gráfica, como en Broken Sword: la flecha para andar y,
 * sobre lo que se puede usar, el gesto de lo que hará el clic.
 */
const BORDE = "stroke='#143e44' stroke-width='2' stroke-linejoin='round'";
const CREMA = `fill='#fff0ce' ${BORDE}`;

function cursor(dibujo: string, x: number, y: number, respaldo: string): string {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'>${dibujo}</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}") ${x} ${y}, ${respaldo}`;
}

export const CURSOR = {
  /** Flecha: andar, o nada que hacer. */
  andar: cursor(`<path d='M4 3v22l6-5.5 4 8.5 4-1.7-4-8.3h8Z' ${CREMA}/>`, 4, 3, 'default'),
  /** Mano que señala: entrar, usar, pulsar. */
  usar: cursor(
    `<path d='M12 4a2 2 0 0 1 4 0v9h1.5a2 2 0 0 1 3.5.9 2 2 0 0 1 3.5 1.1 2 2 0 0 1 3 1.7V23c0 4-3 7-7 7h-3c-3 0-5-2-6.5-4.5L6 20a2 2 0 0 1 3-2.5l3 3Z' ${CREMA}/>`,
    14,
    2,
    'pointer',
  ),
  /** Ojo: un rincón que se mira y se describe. */
  mirar: cursor(
    `<path d='M2 16c5-8 23-8 28 0-5 8-23 8-28 0Z' ${CREMA}/><circle cx='16' cy='16' r='5' fill='#2f7f86' ${BORDE}/><circle cx='16' cy='16' r='2' fill='#143e44'/><circle cx='14.4' cy='14.4' r='1' fill='#fff'/>`,
    16,
    16,
    'help',
  ),
  /** Bocadillo: alguien con quien hablar. */
  hablar: cursor(
    `<path d='M5 4h22a3 3 0 0 1 3 3v11a3 3 0 0 1-3 3H14l-6 6v-6H5a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3Z' ${CREMA}/><circle cx='10' cy='12.5' r='1.6' fill='#143e44'/><circle cx='16' cy='12.5' r='1.6' fill='#143e44'/><circle cx='22' cy='12.5' r='1.6' fill='#143e44'/>`,
    16,
    12,
    'pointer',
  ),
  /** Flecha de salida: el barco, la carretera, la puerta de la calle. */
  salir: cursor(`<path d='M3 11h13V4l13 12-13 12v-7H3Z' fill='#f2c45a' ${BORDE}/>`, 28, 16, 'pointer'),
} as const;
export type Gesto = keyof typeof CURSOR;
