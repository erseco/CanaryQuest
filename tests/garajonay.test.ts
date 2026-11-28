import { describe, expect, it } from 'vitest';
import { PUEBLOS } from '../src/data/pueblos';
import { MISIONES } from '../src/data/misiones';
import { alturaPaseo, inicio, rutaPuerto, transitable } from '../src/puerto/paseo';

const pisa = (x: number, z: number) => transitable(x, z, 'garajonay');
const alto = (x: number, z: number) => alturaPaseo(x, z, 'garajonay');
const { rincones, plano } = PUEBLOS.garajonay;

describe('Garajonay', () => {
  it('se pisan el claro, los senderos y el mirador, no el bosque ni las aras', () => {
    expect(pisa(-23, -1)).toBe(true); // claro de la Laguna Grande
    expect(pisa(-14, -28)).toBe(true); // corazón del bosque
    expect(pisa(10, -28)).toBe(true); // sendero de El Cedro
    expect(pisa(31, -27)).toBe(true); // explanada de la ermita
    expect(pisa(4, 23)).toBe(true); // mirador del Alto
    expect(pisa(4, 26)).toBe(false); // las aras, en medio del mirador
    expect(pisa(-11, -29)).toBe(false); // el til viejo
    expect(pisa(0, -15)).toBe(false); // bosque cerrado
    expect(pisa(31, -34.6)).toBe(false); // la ermita
  });

  it('el Alto es lo más alto y El Cedro lo más hondo, sin escalones en los cruces', () => {
    const alturas = rincones.map((r) => alto(r.x, r.z));
    expect(alto(4, 23.2)).toBe(Math.max(...alturas));
    expect(alto(31, -29)).toBe(Math.min(...alturas));
    for (const [x, z] of [
      [-20, -8], // claro y sendero del corazón
      [-20, -24], // sendero y corazón del bosque
      [-8, -28], // corazón y sendero de El Cedro
      [26, -28], // sendero y explanada de la ermita
      [32, -24], // explanada y subida al Contadero
      [32, -2], // subida y Contadero
      [20, -1], // Contadero y carretera
      [-12, -1], // carretera y claro
      [26, 4], // Contadero y sendero del Alto
      [24, 24], // recodo y último tramo
      [7.5, 24], // último tramo y mirador
      [-24, 6], // claro y pista del Alto
      [-22.5, 25], // recodo y subida al mirador
      [0.5, 25], // subida y mirador
    ])
      expect(Math.abs(alto(x - 0.01, z - 0.01) - alto(x + 0.01, z + 0.01))).toBeLessThan(0.15);
  });

  it('la misión del silbo se juega aquí: la maestra en el claro y el corazón del bosque al norte', () => {
    const pasos = MISIONES['silbo-del-bosque'].pasos;
    const maestra = rincones.find((r) => r.npc === 'maestra-silbo')!;
    const corazon = rincones.find((r) => r.poi === 'corazon-garajonay')!;
    expect(pasos.filter((p) => p.tipo === 'hablar').every((p) => p.npc === maestra.npc)).toBe(true);
    expect(pasos.some((p) => p.tipo === 'llegar' && p.poi === corazon.poi)).toBe(true);
    expect(corazon.z).toBeLessThan(maestra.z - 15); // «ve al corazón de Garajonay, al norte»
    const ruta = rutaPuerto(inicio('garajonay'), maestra, 'garajonay');
    expect(ruta.at(-1)).toEqual(maestra);
    expect(rutaPuerto(maestra, corazon, 'garajonay').at(-1)).toEqual(corazon);
  });

  it('el circuito se cierra: del Alto se baja al Contadero, a El Cedro y de vuelta al claro', () => {
    const [alto_, ermita, claro] = ['Alto de Garajonay', 'Ermita de Lourdes', 'Laguna Grande'].map(
      (n) => rincones.find((r) => r.nombre === n)!,
    );
    expect(rutaPuerto(alto_, ermita, 'garajonay').at(-1)).toEqual(ermita);
    expect(rutaPuerto(ermita, claro, 'garajonay').at(-1)).toEqual(claro);
    expect(plano.sinMar && plano.bruma).toBeTruthy();
  });
});
