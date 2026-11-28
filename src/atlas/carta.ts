import type Phaser from 'phaser';
import { ISLAS, proyectarLugar } from '../data/islas';
import geografia from '../data/geografia.json';
import { CARTA } from '../data/dialogos';

export const SITIOS = {
  dunas:{isla:'gran-canaria',carta:proyectarLugar(geografia['gran-canaria'].dunas)},
  'la-restinga': { isla:'el-hierro', carta:proyectarLugar(geografia['el-hierro']['la-restinga']) },
  'orchilla': { isla:'el-hierro', carta:proyectarLugar(geografia['el-hierro']['orchilla']) },
  'la-caleta': { isla: 'el-hierro', carta: proyectarLugar(geografia['el-hierro']['la-caleta']) },
  'las-palmas': { isla: 'gran-canaria', carta: proyectarLugar(geografia['gran-canaria']['las-palmas']) },
  valverde: { isla: 'el-hierro', carta: proyectarLugar(geografia['el-hierro'].valverde) },
  'las-canteras': { isla: 'gran-canaria', carta: proyectarLugar(geografia['gran-canaria']['las-canteras']) },
  isleta: { isla: 'gran-canaria', carta: proyectarLugar(geografia['gran-canaria'].isleta) },
  'las-teresitas': { isla: 'tenerife', carta: proyectarLugar(geografia.tenerife['las-teresitas']) },
} as const;
export type Sitio = keyof typeof SITIOS;

/** La carta y sus rótulos comparten la misma proyección en la visita y en el ferry. */
export function fondoCarta(scene: Phaser.Scene) {
  const { width, height } = scene.scale;
  const fondo = scene.add.image(width / 2, height / 2, 'mapa-mundo');
  const escala = Math.min(width / fondo.width, height / fondo.height);
  fondo.setScale(escala);
  const pantalla = (p: { x: number; y: number }) => ({
    x: (width - fondo.displayWidth) / 2 + p.x * escala,
    y: (height - fondo.displayHeight) / 2 + p.y * escala,
  });
  const rotulo = {
    fontFamily: 'Georgia, serif',
    fontSize: '15px',
    color: '#fff0c6',
    stroke: '#164853',
    strokeThickness: 3,
  };
  const offsets = [
    [-13, -56],
    [-4, 34],
    [-7, 33],
    [9, 42],
    [0, 41],
    [24, 47],
    [-46, 21],
    [-5, -23],
  ];
  Object.values(ISLAS).forEach((isla, i) => {
    const p = pantalla(isla.mapaMundo),
      [dx, dy] = offsets[i];
    scene.add.text(p.x + dx, p.y + dy, isla.nombre, rotulo).setOrigin(0.5);
  });
  scene.add
    .text(width * 0.37, height * 0.78, CARTA.oceano, {
      ...rotulo,
      fontStyle: 'italic',
      fontSize: '11px',
      color: '#acccbd',
      strokeThickness: 0,
    })
    .setLetterSpacing(3)
    .setOrigin(0.5);
  const x = width - 42,
    y = height - 110;
  scene.add.text(x, y - 11, CARTA.norte, { ...rotulo, fontSize: '12px' }).setOrigin(0.5, 1);
  scene.add.triangle(x, y + 4, 0, 20, 6, 0, 12, 20, 0xf3db9e).setOrigin(0.5);
  scene.add
    .text(width - 12, height - 4, CARTA.fuente, {
      fontSize: '10px',
      fontFamily: 'sans-serif',
      color: '#d6e5d9',
    })
    .setOrigin(1, 1);
  return pantalla;
}
