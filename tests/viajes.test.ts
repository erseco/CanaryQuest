import { describe, expect, it } from 'vitest';
import { ISLAS, RUTAS_BARCO, buscarTerminal, type Punto } from '../src/data/islas';
import { destinosDesde } from '../src/sistemas/viajes';
import geografia from '../src/data/geografia.json';

const islasDe = (terminalId: string) => destinosDesde(terminalId).map((d) => d.isla);

describe('datos de islas', () => {
  it('define las 8 islas', () => {
    expect(Object.keys(ISLAS)).toHaveLength(8);
  });

  it('posiciona todas las islas dentro del mapa-mundo (2752×1536)', () => {
    for (const isla of Object.values(ISLAS)) {
      expect(isla.mapaMundo.x).toBeGreaterThan(0);
      expect(isla.mapaMundo.x).toBeLessThan(2752);
      expect(isla.mapaMundo.y).toBeGreaterThan(0);
      expect(isla.mapaMundo.y).toBeLessThan(1536);
    }
  });

  it('todas las islas tienen puerto y solo La Graciosa carece de aeropuerto', () => {
    for (const isla of Object.values(ISLAS)) {
      expect(isla.terminales.some((t) => t.tipo === 'puerto')).toBe(true);
    }
    const sinAeropuerto = Object.values(ISLAS)
      .filter((i) => !i.terminales.some((t) => t.tipo === 'aeropuerto'))
      .map((i) => i.id);
    expect(sinAeropuerto).toEqual(['la-graciosa']);
  });

  it('las rutas de ferry unen puertos existentes', () => {
    for (const { a, b } of RUTAS_BARCO) {
      expect(buscarTerminal(a)?.terminal.tipo).toBe('puerto');
      expect(buscarTerminal(b)?.terminal.tipo).toBe('puerto');
    }
  });

  it('todos los puertos tienen al menos una línea', () => {
    for (const isla of Object.values(ISLAS)) {
      for (const t of isla.terminales.filter((t) => t.tipo === 'puerto')) {
        expect(destinosDesde(t.id).length, t.id).toBeGreaterThan(0);
      }
    }
  });
});

describe('destinosDesde', () => {
  it('en avión conecta aeropuertos entre sí, sin incluir la isla de origen', () => {
    const destinos = islasDe('gc-aeropuerto');
    expect(destinos).toContain('tenerife');
    expect(destinos).toContain('la-gomera');
    expect(destinos).not.toContain('gran-canaria');
    expect(destinos).not.toContain('la-graciosa');
  });

  it('a La Graciosa solo se llega en barco desde Órzola', () => {
    expect(destinosDesde('lgr-caleta-sebo').map((d) => d.terminal.id)).toEqual(['lz-orzola']);
  });

  it('las rutas de barco son simétricas', () => {
    for (const { a, b } of RUTAS_BARCO) {
      expect(destinosDesde(a).map((d) => d.terminal.id)).toContain(b);
      expect(destinosDesde(b).map((d) => d.terminal.id)).toContain(a);
    }
  });

  it('desde Agaete solo sale el Fred. Olsen a Santa Cruz de Tenerife', () => {
    expect(destinosDesde('gc-agaete')).toEqual([
      expect.objectContaining({ isla: 'tenerife', compania: 'Fred. Olsen Express' }),
    ]);
  });

  it('a La Gomera se va desde Los Cristianos, no desde Santa Cruz', () => {
    expect(islasDe('tf-los-cristianos')).toContain('la-gomera');
    expect(islasDe('tf-santa-cruz')).not.toContain('la-gomera');
  });
});

/** Point-in-polygon (ray casting). */
function dentro(p: Punto, poligono: Punto[]): boolean {
  let c = false;
  for (let i = 0, j = poligono.length - 1; i < poligono.length; j = i++) {
    const a = poligono[i];
    const b = poligono[j];
    if (a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) c = !c;
  }
  return c;
}

describe('terminales y zonas alcanzables a pie', () => {
  const mapas = import.meta.glob<string>('../public/assets/maps/islas/*.tmj', {
    eager:true,query:'?raw',import:'default',
  });
  for(const isla of Object.values(ISLAS)){
    it(isla.nombre,()=>{
      const mapa=JSON.parse(mapas[`../public/assets/maps/islas/${isla.id}.tmj`]) as {
        layers: Array<{name:string;objects:Array<{name:string;x:number;y:number;polygon:Punto[]}>}>
      };
      const poligono=mapa.layers.find(l=>l.name==='colisiones')!.objects[0].polygon;
      const pois=mapa.layers.find(l=>l.name==='pois')!.objects;
      expect(pois.map(p=>p.name).sort()).toEqual(['spawn',...Object.keys(geografia[isla.id])].sort());
      for(const t of isla.terminales)expect(pois.some(p=>p.name===t.id)).toBe(true);
      for(const p of pois)expect(dentro(p,poligono),p.name).toBe(true);
    });
  }
});
