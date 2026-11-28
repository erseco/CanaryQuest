import { describe, expect, it } from 'vitest';
import { PUEBLOS } from '../src/data/pueblos';
import { alturaPaseo, inicio, rutaPuerto, transitable } from '../src/puerto/paseo';
import { CIMA, MESA, aLaMesa } from '../src/puerto/sitios/chipude';

const pisa = (x: number, z: number) => transitable(x, z, 'chipude');
const alto = (x: number, z: number) => alturaPaseo(x, z, 'chipude');

describe('La Fortaleza de Chipude', () => {
  it('se pisan la plaza, la senda y la cima, no la iglesia ni el vacío', () => {
    expect(pisa(3, 17)).toBe(true); // atrio
    expect(pisa(6, -5)).toBe(true); // plaza
    expect(pisa(1.75, -20.75)).toBe(true); // paso del barranquillo
    expect(pisa(-6.5, -33)).toBe(true); // Pavón
    expect(pisa(11.6, -46)).toBe(true); // canal de la arista nordeste
    expect(pisa(24, -41)).toBe(true); // cima
    expect(pisa(-2.4, 9)).toBe(false); // iglesia
    expect(pisa(-3, 14.4)).toBe(false); // campanario
    expect(pisa(16, -38)).toBe(false); // pared norte de la mesa, fuera de la canal
    expect(pisa(30, -52)).toBe(false); // el vacío sobre Erque
    expect(pisa(10, -20)).toBe(false); // bancales
  });

  it('la cima queda dentro de la cornisa, con margen para no asomarse al borde', () => {
    expect(aLaMesa(24, -41)).toBeLessThan(-3);
    expect(aLaMesa(0, 0)).toBeGreaterThan(20);
    expect(MESA.length).toBeGreaterThan(8);
    for (const { r, y, y2 } of PUEBLOS.chipude.plano.suelos!)
      if (y === CIMA && y2 === undefined)
        for (const [x, z] of [
          [r[0], r[1]],
          [r[2], r[1]],
          [r[0], r[3]],
          [r[2], r[3]],
        ])
          expect(aLaMesa(x, z)).toBeLessThan(-0.9);
  });

  it('la senda sube sin escalones bruscos de la plaza a la cima', () => {
    for (const [x, z] of [
      [1.75, -11], // plaza y camino
      [1.75, -19.5], // camino y paso del barranquillo
      [1.75, -22], // paso y cuesta de Pavón
      [1.75, -31], // cuesta y Pavón
      [-3.75, -35], // Pavón y senda
      [-3.75, -46], // senda y collado
      [3, -49.3], // collado y canal
      [10.5, -49.3],
      [11.6, -48.2],
      [11.6, -43.6],
      [12.7, -42.5],
      [19, -42.5], // paso de la cornisa y cima
    ])
      expect(Math.abs(alto(x - 0.01, z - 0.01) - alto(x + 0.01, z + 0.01))).toBeLessThan(0.25);
    expect(alto(24, -41)).toBe(CIMA);
  });

  it('a la punta sur solo se llega por el collado y la canal, siempre subiendo desde Pavón', () => {
    const { rincones } = PUEBLOS.chipude;
    for (const r of rincones) expect(rutaPuerto(inicio('chipude'), r, 'chipude').at(-1)).toEqual(r);
    const punta = rincones.find((r) => r.nombre === 'Punta sur')!;
    const pavon = { x: -6.5, z: -33 };
    const ruta = [pavon, ...rutaPuerto(pavon, punta, 'chipude')];
    expect(ruta.at(-1)).toEqual(punta);
    expect(ruta.some((p) => p.z <= -46 && p.x <= 3.5)).toBe(true); // pasa por el collado
    expect(ruta.some((p) => p.x > 10 && p.x < 13 && p.z < -43)).toBe(true); // y trepa por la canal
    for (let i = 1; i < ruta.length; i++)
      expect(alto(ruta[i].x, ruta[i].z)).toBeGreaterThanOrEqual(alto(ruta[i - 1].x, ruta[i - 1].z) - 0.05);
  });
});
