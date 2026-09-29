/**
 * Enemigos: especie (lo que se pone en Tiled como `name` de un objeto `enemigo`)
 * → sprite de BrowserQuest (public/assets/sprites/bq/) y estadísticas.
 */
export interface Especie {
  nombre: string;
  sprite: string;
  /** Golpes de espada para derrotarlo. */
  vida: number;
  velocidad: number;
  /** Probabilidad de soltar un corazón al morir (0..1). */
  corazon: number;
}

export const ESPECIES: Record<string, Especie> = {
  alimana: { nombre: 'Alimaña', sprite: 'crab', vida: 1, velocidad: 85, corazon: 0.3 },
  culebra: { nombre: 'Culebra real (invasora)', sprite: 'snake', vida: 2, velocidad: 70, corazon: 0.35 },
  rata: { nombre: 'Rata', sprite: 'rat', vida: 1, velocidad: 95, corazon: 0.25 },
  murcielago: { nombre: 'Murciélago', sprite: 'bat', vida: 1, velocidad: 110, corazon: 0.25 },
  ladron: { nombre: 'Ladrón de quesos', sprite: 'goblin', vida: 3, velocidad: 90, corazon: 0.5 },
  esqueleto: { nombre: 'Esqueleto', sprite: 'skeleton', vida: 3, velocidad: 60, corazon: 0.4 },
};

/** Sprites de BrowserQuest con animaciones (JSON original) que carga PreloadScene. */
export const SPRITES_BQ = ['crab', 'rat', 'snake', 'bat', 'goblin', 'skeleton', 'spectre'];

/** NPCs de BrowserQuest (2 frames de reposo, 48×48 a escala 2). */
export const NPCS_BQ = [
  'villager',
  'villagegirl',
  'priest',
  'forestnpc',
  'desertnpc',
  'lavanpc',
  'beachnpc',
];
