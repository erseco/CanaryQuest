// Norte hacia +Z y este hacia −X: al entrar en Tirajana se mira hacia las dunas.
const escala = 0.16;
function situar(lon: number, lat: number) {
  return { x: (-15.576662 - lon) * 98470 * escala, z: (lat - 27.746906) * 110820 * escala - 9.5 };
}
export const plano = {
  pepe: situar(-15.5764304, 27.75138),
  cita: situar(-15.57533, 27.75163), // frente sur de la manzana, leído sobre PNOA
  mirador: situar(-15.5764968, 27.7452663),
  hotel: situar(-15.576662, 27.746906),
  noroeste: situar(-15.5804, 27.754),
  sureste: situar(-15.5722, 27.743),
};
const rotonda = situar(-15.576979, 27.75118);
export const francia = [
  rotonda,
  situar(-15.5765955, 27.7512009),
  situar(-15.57539, 27.7514),
  situar(-15.5745452, 27.751584),
];
export const tirajana = [
  rotonda,
  situar(-15.57693, 27.750835),
  situar(-15.57668, 27.74774),
  { x: 0, z: -5 },
  plano.hotel,
  plano.mirador,
];
export const inicioDunas = francia[1];

export function caminoDunas(x: number, z: number) {
  for (const calle of [francia, tirajana]) {
    for (let i = 1; i < calle.length; i++) {
      const a = calle[i - 1],
        b = calle[i],
        dx = b.x - a.x,
        dz = b.z - a.z;
      const t = Math.max(0, Math.min(1, ((x - a.x) * dx + (z - a.z) * dz) / (dx * dx + dz * dz)));
      const ancho = calle === francia ? 2.5 : z < -5 && z > -14 ? 1.9 : 2.6;
      if (Math.hypot(x - a.x - t * dx, z - a.z - t * dz) < ancho) return true;
    }
  }
  return z <= plano.mirador.z && z > plano.mirador.z - 25 && Math.abs(x - plano.mirador.x) < 5;
}
