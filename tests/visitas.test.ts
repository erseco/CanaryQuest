import { describe, it, expect } from 'vitest';
import { paseable } from '../src/atlas/recintos';

describe('paseos sobre las ortofotos', () => {
  it('permite caminar desde el acceso al borde de las piscinas y bloquea el agua', () => {
    for (let x = 385; x < 420; x++) expect(paseable(true, [x, 328])).toBe(true);
    for (const [x, y] of [
      [464, 276],
      [421, 350],
      [453, 321],
      [650, 510],
    ])
      expect(paseable(true, [x, y])).toBe(false);
  });
  it('mantiene el paseo de Vegueta en la plaza', () => {
    expect(paseable(false, [368, 308])).toBe(true);
    expect(paseable(false, [490, 260])).toBe(true);
    expect(paseable(false, [640, 245])).toBe(false);
  });
});
