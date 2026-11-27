import { alturaPaseo, sueloInterior, MUELLE, rutaPuerto, umbral, type PuntoPuerto } from '../puerto/paseo';
import { PUEBLOS } from '../data/pueblos';
const canvas = document.querySelector('canvas')!;
const mensaje = document.querySelector('aside span')!;
const boton = document.querySelector('button')!;
const puerta = umbral(PUEBLOS.mogan.casas[0]);
const posicion = { ...MUELLE };
let interior = false, paso = 0, giro = 0;
let ruta: PuntoPuerto[] = [];
const cerca = (p: PuntoPuerto) => Math.hypot(posicion.x-p.x,posicion.z-p.z)<1.5;
function refrescar() {
  mensaje.textContent = ['Recoge el encargo en el muelle.', 'Busca la red en la casa del pescador.', 'Devuelve la red al muelle.', 'Red entregada. ¡Buen viaje!'][paso];
  const accion = interior ? (paso===1 ? 'Recoger red' : 'Salir') : cerca(puerta) ? 'Entrar en la casa' : cerca(MUELLE) && (paso===0 || paso===2) ? (paso===0 ? 'Aceptar encargo' : 'Entregar red') : '';
  boton.hidden = !accion;
  boton.textContent = accion;
}
boton.onclick = () => {
  if (interior && paso===1) paso++;
  else if (interior || cerca(puerta)) {
    interior = !interior;
    Object.assign(posicion, interior ? {x:0,z:1} : puerta);
  } else paso++;
  ruta=[]; refrescar();
};
async function iniciar() {
  const babylon = new URLSearchParams(location.search).get('motor') !== 'playcanvas';
  const motor = babylon ? await import('./babylon') : await import('./playcanvas');
  const vista = await motor.abrir(canvas, import.meta.env.BASE_URL+'assets/puerto/mogan.glb');
  document.title = 'Mogán · '+(babylon?'Babylon.js':'PlayCanvas');
  canvas.onpointerdown = e => {
    const p = vista.suelo(e.clientX,e.clientY);
    if (interior) ruta = sueloInterior(p.x,p.z) ? [p] : [];
    else {
      const destino = [puerta, MUELLE].find(lugar => Math.hypot(p.x-lugar.x,p.z-lugar.z)<2);
      ruta = rutaPuerto(posicion, destino ?? p);
    }
  };
  vista.animar(dt=>{
    const p=ruta[0];
    if(p){
      const dx=p.x-posicion.x,dz=p.z-posicion.z,dist=Math.hypot(dx,dz);
      const t=dist?Math.min(1,Math.min(dt,.08)*3.4/dist):1;
      const x=posicion.x+dx*t,z=posicion.z+dz*t;
      if(!interior || sueloInterior(x,z)) Object.assign(posicion,{x,z});
      else ruta=[];
      giro=Math.atan2(dx,dz);
      if(t===1) ruta.shift();
    }
    vista.mover(posicion.x,interior?0:alturaPaseo(posicion.x,posicion.z),posicion.z,giro,interior);
    refrescar();
  });
}
iniciar().catch(e=>{mensaje.textContent='No se pudo abrir Mogán: '+e.message;});
