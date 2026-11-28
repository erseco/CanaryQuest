import { describe, expect, it } from 'vitest';
import { PUEBLOS } from '../src/data/pueblos';
import { alturaPaseo, inicio, muelle, puebloDeTerminal, rutaPuerto, transitable } from '../src/puerto/paseo';
import { destinosDesde } from '../src/sistemas/viajes';

const pisa = (x: number, z: number) => transitable(x, z, 'playa-blanca');
const alto = (x: number, z: number) => alturaPaseo(x, z, 'playa-blanca');

describe('Playa Blanca', () => {
  it('es terminal del ferry, como Agaete: se entra en el pueblo y se desembarca en su muelle', () => {
    expect(puebloDeTerminal('gc-agaete')).toBe('agaete');
    expect(puebloDeTerminal('lz-playa-blanca')).toBe('playa-blanca');
    expect(puebloDeTerminal('fv-corralejo')).toBeUndefined();
    expect(puebloDeTerminal('lz-arrecife')).toBeUndefined();
    expect(PUEBLOS['playa-blanca'].salidas.mar).toBe('ferry');
    expect(destinosDesde('lz-playa-blanca').map((d) => d.terminal.id)).toEqual(['fv-corralejo']);
    expect(destinosDesde('fv-corralejo').some((d) => puebloDeTerminal(d.terminal.id) === 'playa-blanca')).toBe(true);
  });

  it('se camina por el puerto, los paseos y la marina sin pisar el agua', () => {
    expect(pisa(-42, 12)).toBe(true); // explanada del puerto
    expect(pisa(-21, 21.75)).toBe(true); // punta del muelle del ferry
    expect(pisa(-12.5, 4)).toBe(true); // playa del Pueblo
    expect(pisa(-3, -6)).toBe(true); // plaza del Carmen
    expect(pisa(14, 6)).toBe(true); // Playa Dorada
    expect(pisa(24, 19)).toBe(true); // dique de la marina
    expect(pisa(49, 17.5)).toBe(true); // junto al castillo
    expect(pisa(-30, 18)).toBe(false); // el ferry amarrado
    expect(pisa(-33, 6)).toBe(false); // la dársena pesquera
    expect(pisa(-12.5, 8)).toBe(false); // el mar frente a la playa
    expect(pisa(34, 10)).toBe(false); // el agua de la marina
    expect(pisa(-3, -11)).toBe(false); // la iglesia
    expect(pisa(49.3, 12.8)).toBe(false); // el castillo
  });

  it('las playas bajan al agua y la punta del Águila queda en alto, sin escalones bruscos', () => {
    expect(alto(-12.5, 6)).toBeLessThan(-0.6);
    expect(alto(14, 6.9)).toBeLessThan(-0.6);
    expect(alto(48, 16)).toBeCloseTo(1.5);
    expect(Math.abs(alto(45.49, 11) - alto(45.51, 11))).toBeLessThan(0.05); // fin de la subida
    expect(Math.abs(alto(42.49, 11) - alto(42.51, 11))).toBeLessThan(0.05); // su arranque
  });

  it('del inicio se llega al embarcadero del ferry y al castillo', () => {
    const castillo = PUEBLOS['playa-blanca'].rincones.find((r) => r.nombre === 'Castillo de las Coloradas')!;
    expect(rutaPuerto(inicio('playa-blanca'), muelle('playa-blanca'), 'playa-blanca').at(-1)).toEqual(muelle('playa-blanca'));
    expect(rutaPuerto(muelle('playa-blanca'), castillo, 'playa-blanca').at(-1)).toEqual(castillo);
  });
});
