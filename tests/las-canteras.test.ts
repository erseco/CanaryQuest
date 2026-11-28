import { describe, expect, it } from 'vitest';
import { PUEBLOS } from '../src/data/pueblos';
import { alturaPaseo, camino, inicio, rutaPuerto, transitable } from '../src/puerto/paseo';
import { ESCALERAS, PASEO, arena, orilla } from '../src/puerto/sitios/canteras-plano';

const pisa = (x: number, z: number) => transitable(x, z, 'las-canteras');
const alto = (x: number, z: number) => alturaPaseo(x, z, 'las-canteras');

describe('Playa de Las Canteras', () => {
  it('se pisan el paseo, la arena y La Puntilla, no los edificios, el mar ni las rocas', () => {
    expect(pisa(-10, -5.5)).toBe(true); // paseo
    expect(pisa(-10, 3)).toBe(true); // arena de Playa Grande
    expect(pisa(27.5, 2.2)).toBe(true); // Playa Chica
    expect(pisa(-50, -4)).toBe(true); // plaza de La Puntilla
    expect(pisa(-50.8, 8)).toBe(true); // varadero
    expect(pisa(-54.2, -16.5)).toBe(true); // calle hacia La Isleta
    expect(pisa(-10, -10)).toBe(false); // primera línea de edificios
    expect(pisa(-10, 10)).toBe(false); // la laguna
    expect(pisa(40, 13)).toBe(false); // Peña de la Vieja
    expect(pisa(21, 3)).toBe(false); // rocas de Playa Chica
    expect(pisa(60, 0)).toBe(false); // La Cícer queda al fondo, sin pisar
    expect(pisa(-10, -3.1)).toBe(false); // muro del paseo
    for (const x of ESCALERAS) expect(pisa(x, -3.1)).toBe(true); // salvo en las escaleras
  });

  it('el paseo va en alto sobre la arena, que baja hasta el agua, y las escaleras no dan saltos', () => {
    expect(alto(-10, -5)).toBeCloseTo(PASEO);
    expect(alto(-10, -2)).toBeLessThan(0.05);
    expect(alto(-10, orilla(-10) - 0.1)).toBeLessThan(alto(-10, 0) - 0.5);
    expect(arena(-10, orilla(-10) + 1.2)).toBeLessThan(-0.84); // la arena se mete bajo el agua
    for (const x of ESCALERAS)
      for (const z of [-3.6, -1.4]) expect(Math.abs(alto(x, z - 0.01) - alto(x, z + 0.01))).toBeLessThan(0.05);
  });

  it('del paseo a la arena se baja por una escalera, y se llega a cada rincón y a la calle de La Isleta', () => {
    const ruta = rutaPuerto({ x: -10, z: -5.5 }, { x: -10, z: 2 }, 'las-canteras');
    expect(ruta.at(-1)).toEqual({ x: -10, z: 2 });
    let antes = { x: -10, z: -5.5 };
    let porEscalera = false;
    for (const p of ruta) {
      for (let i = 0; i <= 50; i++) {
        const x = antes.x + ((p.x - antes.x) * i) / 50,
          z = antes.z + ((p.z - antes.z) * i) / 50;
        if (z > -3.3 && z < -2.9) porEscalera ||= ESCALERAS.some((e) => Math.abs(x - e) <= 0.8);
      }
      antes = p;
    }
    expect(porEscalera).toBe(true);
    for (const destino of [...PUEBLOS['las-canteras'].rincones, camino('las-canteras')])
      expect(rutaPuerto(inicio('las-canteras'), destino, 'las-canteras').at(-1)).toEqual(destino);
  });
});
