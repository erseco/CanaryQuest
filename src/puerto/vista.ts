import * as T from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { cargarRecursos } from './recursos';
import { crearMaqueta } from './maqueta';
import {
  alturaPaseo,
  PASTOR,
  camino,
  muelle,
  umbral,
  rutaPuerto,
  transitable,
  type PuntoPuerto,
} from './paseo';
import { PUERTO as t, PASEO as guia } from '../data/dialogos';
import { PUEBLOS, type Pueblo, type CasaPuerto } from '../data/pueblos';
import { ISLAS } from '../data/islas';
import { crearInterior, sueloInterior } from './interior';
import './puerto.css';

export async function abrirPuerto(
  hablar: () => void,
  salir: () => void,
  objetivo: () => string,
  pueblo: Pueblo,
  viajar: (destino: Pueblo | 'ferry', porMar?: boolean) => void,
  llegada?: PuntoPuerto,
) {
  const barrio = PUEBLOS[pueblo];
  const { plano, salidas } = barrio;
  /** Con playa o tercer barrio, la cámara, las sombras y el horizonte abarcan más. */
  const grande = !!plano.playa || plano.orillas.length > 2 || !!plano.suelos;
  /** Un lugar sin casas (un faro, unas piscinas) no es un pueblo: sus textos hablan de rincones. */
  const textoLugares = barrio.casas.length ? guia.lugares : guia.rincones;
  const recursos = await cargarRecursos();
  const renderer = new T.WebGLRenderer({ antialias: true, powerPreference: 'low-power' });
  const root = document.createElement('section');
  root.className = 'puerto';
  root.innerHTML = `<header><div class="marca"><span class="rosa" aria-hidden="true">✥</span>${t.marca}</div>
    <div class="acciones"><button data-accion="luz" aria-label="${t.luz}">☀ ${t.dia}</button><button data-accion="mapa">${t.mapa} ↗</button>
    <details><summary aria-label="${t.controles}">?</summary><p>${t.ayuda}</p></details></div></header>
    <aside><small>${ISLAS[barrio.isla].nombre}</small><h1>${barrio.nombre}</h1></aside>
    <select class="destinos" aria-label="${textoLugares}"><option value="">${textoLugares}</option></select>
    <footer><article aria-live="polite"><small>${t.jornada}</small><h2>${t.encargo}</h2><p></p><button data-accion="accion"></button></article>
    <div class="camara"><button aria-label="${t.izquierda}" data-accion="izq">↶</button><button aria-label="${t.derecha}" data-accion="der">↷</button>
    <button aria-label="${t.lejos}" data-accion="menos">−</button><button aria-label="${t.cerca}" data-accion="mas">+</button></div></footer>`;
  root.prepend(renderer.domElement);
  document.body.append(root);
  const canvas = renderer.domElement;
  canvas.setAttribute('aria-label', barrio.nombre);
  const escena = new T.Scene(),
    camara = new T.PerspectiveCamera(37, 1, 0.15, 175);
  const tinteNoche = new T.Color(0x43567d);
  const dia = new T.Color('#efd6b9'),
    noche = new T.Color('#344e70');
  const cielo = new T.Color();
  escena.background = cielo;
  escena.fog = new T.Fog(cielo, plano.bruma?.[0] ?? (grande ? 44 : 26), plano.bruma?.[1] ?? (grande ? 150 : 68));
  const ambiente = new T.HemisphereLight(0xffedd4, 0x8199ae, 1.5);
  const sol = new T.DirectionalLight(0xffdcaa, 2.4);
  sol.castShadow = true;
  if (grande) {
    // Más lejos en la misma dirección, para que la playa también quede delante del foco.
    sol.position.set(-41.6, 33.8, 20.8);
    Object.assign(sol.shadow.camera, { left: -42, right: 42, top: 26, bottom: -26, far: 140 });
    if (plano.suelos) {
      // Un trazado propio se extiende mar adentro: el foco apunta al centro de la bahía.
      sol.target.position.set(4, 0, 12);
      sol.position.set(-37.6, 33.8, 32.8);
      Object.assign(sol.shadow.camera, { left: -50, right: 50, top: 38, bottom: -38, far: 170 });
    }
    sol.shadow.mapSize.set(2048, 2048);
  } else {
    sol.position.set(-16, 13, 8);
    Object.assign(sol.shadow.camera, { left: -19, right: 19, top: 16, bottom: -16, far: 65 });
    sol.shadow.mapSize.set(1024, 1024);
  }
  sol.shadow.normalBias = 0.035;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFShadowMap;
  escena.add(ambiente, sol, sol.target);
  const exterior = new T.Group();
  escena.add(exterior);
  const habitacion = crearInterior();
  escena.add(habitacion.grupo);
  const paisaje = new T.MeshBasicMaterial({ map: recursos.horizonte, side: T.BackSide, fog: false });
  const horizonte = new T.Mesh(new T.CylinderGeometry(50, 50, 44, 96, 1, true), paisaje);
  horizonte.scale.setScalar(grande ? 1.6 : 1);
  horizonte.position.y = (grande ? 24 : 15) - (plano.cuesta?.desnivel ?? 0);
  horizonte.rotation.y = -0.82;
  exterior.add(horizonte);
  const luces = [-8.5, -3, 3, 8.5].map((x) => {
    const luz = new T.PointLight(0xffab52, 0, 6, 1.7);
    luz.position.set(x, 1.96, 3.35);
    escena.add(luz);
    return luz;
  });
  const { jugador, pastor, barcos, cristal, fachadas } = crearMaqueta(exterior, recursos, pueblo);
  escena.add(jugador);
  if (llegada) jugador.position.set(llegada.x, 0, llegada.z);
  pastor.visible = pueblo === 'mogan';
  const mar = new Reflector(new T.PlaneGeometry(240, 240), {
    textureWidth: 512,
    textureHeight: 512,
    multisample: 0,
    clipBias: 0.002,
    shader: {
      name: 'Agua del puerto',
      uniforms: {
        color: { value: null },
        tDiffuse: { value: null },
        textureMatrix: { value: null },
        tiempo: { value: 0 },
        oscuridad: { value: 0 },
        costaZ: { value: plano.costa ?? 3.7 },
        orilla: {
          value: plano.suelos
            ? new T.Vector2(-32, 14)
            : grande
              ? new T.Vector2(-31, Math.max(...plano.orillas) + 8.1)
              : new T.Vector2(-8, 8),
        },
      },
      vertexShader: `uniform mat4 textureMatrix; varying vec4 reflejado; varying vec3 pos; void main(){reflejado=textureMatrix*vec4(position,1.);vec4 p=modelMatrix*vec4(position,1.);pos=p.xyz;gl_Position=projectionMatrix*viewMatrix*p;}`,
      fragmentShader: `uniform sampler2D tDiffuse; varying vec4 reflejado; varying vec3 pos; uniform float tiempo; uniform float oscuridad; uniform vec2 orilla; uniform float costaZ;
      void main(){vec2 p=pos.xz; float a=sin(p.y*5.+sin(p.x*1.8+tiempo*.5)*.6-tiempo*.85);
        float b=sin(p.y*8.+p.x*.4+sin(p.x*3.-tiempo*.33)-tiempo);
        float costa=exp(-max(0.,p.y-costaZ)*.28)*smoothstep(orilla.x-4.,orilla.x,p.x)*(1.-smoothstep(orilla.y,orilla.y+4.,p.x));
        vec3 c=mix(vec3(.025,.34,.39),vec3(.12,.60,.55),costa*.72+.16*sin(p.x*.18+p.y*.21));
        c+=vec3(.19,.22,.18)*smoothstep(.88,1.,a)*smoothstep(.45,.95,b);
        c=mix(c,c*vec3(.23,.34,.49),oscuridad);
        float reflejo=exp(-abs(abs(p.x)-3.)*2.)*exp(-abs(p.y-4.)*.48);
        c+=vec3(.8,.38,.08)*reflejo*smoothstep(.45,1.,a)*oscuridad;
        float bruma=smoothstep(25.,90.,length(p));
        c=mix(c,mix(vec3(.49,.75,.74),vec3(.04,.08,.16),oscuridad),bruma);
        vec2 uv=reflejado.xy/reflejado.w;
        vec2 onda=vec2(sin(p.y*3.+tiempo*.8)+a,b+a)*.0027;
        vec3 espejo=texture2D(tDiffuse,uv+onda).rgb;
        c=mix(c,espejo,.37+.25*oscuridad);
        gl_FragColor=vec4(c,1.);
        #include <colorspace_fragment>
      }`,
    },
  });
  const aguaMaterial = mar.material as T.ShaderMaterial;
  mar.rotation.x = -Math.PI / 2;
  mar.position.y = -0.84;
  mar.visible = !plano.sinMar;
  exterior.add(mar);
  // Una señal suspendida distingue al personaje con el que se puede hablar.
  const marca = new T.Mesh(new T.OctahedronGeometry(0.16), new T.MeshBasicMaterial({ color: 0xffd17c }));
  marca.position.copy(pastor.position);
  exterior.add(marca);
  marca.visible = pastor.visible;
  const abort = new AbortController(),
    opts = { signal: abort.signal };
  const teclas = new Set<string>();
  let angulo = -0.36,
    distancia = 28.5,
    luz = 0,
    destinoLuz = 0,
    animacion = 0,
    previo = performance.now(),
    tiempo = 0;
  let ruta: PuntoPuerto[] = [],
    alLlegar: (() => void) | undefined,
    quienHabla = t.pastor,
    dialogo: string[] = [],
    finDialogo: (() => void) | undefined;
  const centro = new T.Vector3(0, 2.2, -1.9);
  const accion = root.querySelector<HTMLButtonElement>('[data-accion="accion"]')!;
  const parrafo = root.querySelector('article p')!,
    titulo = root.querySelector('h2')!;
  let casaActual: CasaPuerto | undefined,
    puntoRetorno: PuntoPuerto = { x: 0, z: 0 };
  const nombre = root.querySelector('h1')!,
    selector = root.querySelector('select')!;
  const pos = jugador.position;
  const lugares: { nombre: string; punto: PuntoPuerto; activar: () => void }[] = [];
  let anguloCalle=angulo;
  let giroRincon: number | undefined;
  function entrar(c: CasaPuerto) {
    anguloCalle=angulo;angulo=-0.18;
    puntoRetorno = umbral(c);
    casaActual = c;
    habitacion.decorar(c);
    habitacion.grupo.visible = true;
    exterior.visible = false;
    selector.hidden = true;
    root.querySelector<HTMLButtonElement>('[data-accion="luz"]')!.hidden=true;
    pos.set(0, 0, 2.25);
    nombre.textContent = c.nombre;
    teclas.clear();
    ruta = [];
    alLlegar = undefined;
    refrescar();
  }
  function volverCalle() {
    angulo=anguloCalle;
    casaActual = undefined;
    habitacion.grupo.visible = false;
    exterior.visible = true;
    selector.hidden = false;
    root.querySelector<HTMLButtonElement>('[data-accion="luz"]')!.hidden=false;
    pos.set(puntoRetorno.x, 0, puntoRetorno.z);
    nombre.textContent = barrio.nombre;
    ruta = [];
    alLlegar = undefined;
    refrescar();
  }
  barrio.casas.forEach((c) =>
    lugares.push({ nombre: guia.entrar + ' ' + c.nombre, punto: umbral(c), activar: () => entrar(c) }),
  );
  // Salidas del pueblo, cada una con su cartel: el barco del muelle y la carretera.
  const carteles: { indice: number; texto: string }[] = [];
  let indiceBarco = -1;
  const { mar: porMar, tierra } = salidas;
  if (porMar) {
    indiceBarco = lugares.length;
    const texto = porMar === 'ferry' ? guia.ferry : guia.lancha;
    carteles.push({ indice: indiceBarco, texto });
    lugares.push({ nombre: texto, punto: muelle(pueblo), activar: () => viajar(porMar, true) });
  }
  if (tierra) {
    carteles.push({ indice: lugares.length, texto: PUEBLOS[tierra].nombre + ' →' });
    lugares.push({
      nombre: guia.ir + ' ' + PUEBLOS[tierra].nombre,
      punto: camino(pueblo),
      activar: () => viajar(tierra),
    });
  }
  // Rincones a los que se pasea: al llegar se describen, como en una aventura gráfica.
  for (const r of barrio.rincones)
    lugares.push({
      nombre: r.nombre,
      punto: r,
      activar: () => {
        quienHabla = r.nombre;
        dialogo = [r.texto];
        // Gira por el camino más corto hacia el encuadre del rincón.
        if (r.vista !== undefined) giroRincon = angulo + Math.atan2(Math.sin(r.vista - angulo), Math.cos(r.vista - angulo));
        refrescar();
      },
    });
  if (pastor.visible)
    lugares.push({ nombre: t.hablar, punto: { x: PASTOR.x - 0.75, z: PASTOR.z }, activar: hablar });
  const senales = carteles.map(({ indice, texto }) => {
    const l = lugares[indice],
      lienzo = document.createElement('canvas');
    lienzo.width = 512;
    lienzo.height = 92;
    const ctx = lienzo.getContext('2d')!;
    ctx.fillStyle = '#204f50';
    ctx.fillRect(0, 0, 512, 92);
    ctx.strokeStyle = '#e0c493';
    ctx.lineWidth = 5;
    ctx.strokeRect(4, 4, 504, 84);
    ctx.fillStyle = '#fff0ce';
    ctx.font = '600 32px Georgia';
    ctx.textAlign = 'center';
    ctx.fillText(texto, 256, 57, 472);
    const mapa = new T.CanvasTexture(lienzo);
    mapa.colorSpace = T.SRGBColorSpace;
    const cartel = new T.Sprite(new T.SpriteMaterial({ map: mapa }));
    cartel.position.set(l.punto.x, 1.45, l.punto.z);
    cartel.scale.set(3, 0.54, 1);
    exterior.add(cartel);
    return cartel;
  });
  lugares.forEach((l, i) => selector.add(new Option(l.nombre, String(i))));
  selector.addEventListener(
    'change',
    () => {
      if (selector.value !== '') visitar(Number(selector.value));
      selector.value = '';
    },
    opts,
  );
  const cercano = () =>
    lugares.reduce((mejor, l, i) => {
      const dist = Math.hypot(pos.x - l.punto.x, pos.z - l.punto.z);
      return dist < 1.12 &&
        (mejor < 0 || dist < Math.hypot(pos.x - lugares[mejor].punto.x, pos.z - lugares[mejor].punto.z))
        ? i
        : mejor;
    }, -1);
  function refrescar() {
    const i = cercano();
    titulo.textContent = dialogo.length
      ? quienHabla
      : casaActual
        ? casaActual.nombre
        : pastor.visible
          ? t.encargo
          : plano.sitio
            ? barrio.nombre
            : guia.muelle;
    parrafo.textContent =
      dialogo[0] ?? (casaActual ? guia.enCasa : pastor.visible ? objetivo() || t.buscar : barrio.casas.length ? guia.explorar : guia.recorrer);
    accion.textContent = dialogo.length
      ? dialogo.length === 1
        ? t.cerrar
        : t.seguir
      : casaActual
        ? guia.puerta
        : i >= 0
          ? lugares[i].nombre
          : pastor.visible && !objetivo()
            ? t.acercar
            : textoLugares;
    selector.disabled = !!dialogo.length;
  }
  function ir(p: PuntoPuerto, luego?: () => void) {
    ruta = rutaPuerto(pos, p, pueblo);
    alLlegar = ruta.length ? luego : undefined;
  }
  function visitar(i: number) {
    if (dialogo.length || casaActual) return;
    const l = lugares[i];
    if (cercano() === i) l.activar();
    else ir(l.punto, l.activar);
  }
  function interactuar() {
    if (dialogo.length) {
      dialogo.shift();
      if (!dialogo.length) {
        finDialogo?.();
        finDialogo = undefined;
      }
      refrescar();
      return;
    }
    if (casaActual) {
      volverCalle();
      return;
    }
    const i = cercano();
    if (i >= 0) lugares[i].activar();
    else if (pastor.visible && !objetivo()) visitar(lugares.length - 1);
    else {
      selector.focus();
      try {
        selector.showPicker();
      } catch {
        /* El select conserva su control nativo. */
      }
    }
  }
  root.addEventListener(
    'click',
    (e) => {
      const boton = (e.target as HTMLElement).closest('button')?.dataset.accion;
      switch (boton) {
        case 'accion':
          interactuar();
          break;
        case 'mapa':
          salir();
          break;
        case 'luz': {
          destinoLuz = 1 - destinoLuz;
          const btn = root.querySelector<HTMLButtonElement>('[data-accion="luz"]')!;
          btn.textContent = destinoLuz ? '☾ ' + t.noche : '☀ ' + t.dia;
          btn.setAttribute('aria-pressed', String(!!destinoLuz));
          break;
        }
        case 'izq':
          angulo -= Math.PI / 8;
          break;
        case 'der':
          angulo += Math.PI / 8;
          break;
        case 'menos':
          distancia = Math.min(grande ? 58 : 42, distancia + 3);
          break;
        case 'mas':
          distancia = Math.max(16, distancia - 3);
          break;
      }
    },
    opts,
  );
  const ray = new T.Raycaster(),
    suelo = new T.Plane(new T.Vector3(0, 1, 0), 0);
  let inicioX = 0,
    inicioY = 0,
    ultimoX = 0,
    arrastre = false;
  canvas.addEventListener(
    'pointerdown',
    (e) => {
      if (e.button !== 0 || !e.isPrimary) return;
      inicioX = ultimoX = e.clientX;
      inicioY = e.clientY;
      arrastre = false;
      canvas.setPointerCapture(e.pointerId);
    },
    opts,
  );
  canvas.addEventListener(
    'pointermove',
    (e) => {
      if (!canvas.hasPointerCapture(e.pointerId)) return;
      if (Math.hypot(e.clientX - inicioX, e.clientY - inicioY) > 5) arrastre = true;
      if (arrastre) angulo -= (e.clientX - ultimoX) * 0.007;
      ultimoX = e.clientX;
    },
    opts,
  );
  canvas.addEventListener(
    'lostpointercapture',
    () => {
      arrastre = false;
    },
    opts,
  );
  canvas.addEventListener(
    'pointerup',
    (e) => {
      if (!canvas.hasPointerCapture(e.pointerId) || arrastre || dialogo.length) return;
      const rect = canvas.getBoundingClientRect();
      ray.setFromCamera(
        new T.Vector2(
          ((e.clientX - rect.left) / rect.width) * 2 - 1,
          1 - ((e.clientY - rect.top) / rect.height) * 2,
        ),
        camara,
      );
      const punto = ray.ray.intersectPlane(suelo, new T.Vector3());
      if (casaActual) {
        if (punto && sueloInterior(punto.x, punto.z)) {
          ruta = [{ x: 0, z: pos.z }, { x: 0, z: punto.z }, punto];
          alLlegar = undefined;
          if (Math.abs(punto.x) < 0.85 && punto.z > 2.45) alLlegar = volverCalle;
        }
        return;
      }
      const elegido = ray.intersectObjects(
        [...fachadas, barcos[0], ...senales, ...(pastor.visible ? [pastor] : [])],
        true,
      )[0];
      if (elegido) {
        let obj: T.Object3D | null = elegido.object;
        while (obj) {
          const i = fachadas.indexOf(obj as T.Mesh);
          if (i >= 0) {
            visitar(i);
            return;
          }
          if (senales.includes(obj as T.Sprite)) {
            visitar(carteles[senales.indexOf(obj as T.Sprite)].indice);
            return;
          }
          if (obj === barcos[0] && indiceBarco >= 0) {
            visitar(indiceBarco);
            return;
          }
          if (obj === pastor) {
            visitar(lugares.length - 1);
            return;
          }
          obj = obj.parent;
        }
      }
      if (punto && transitable(punto.x, punto.z, pueblo)) ir(punto);
    },
    opts,
  );
  window.addEventListener(
    'keydown',
    (e) => {
      if (e.target === selector) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.code)) e.preventDefault();
      teclas.add(e.code);
      if (!e.repeat && e.code === 'KeyE') interactuar();
    },
    opts,
  );
  window.addEventListener('keyup', (e) => teclas.delete(e.code), opts);
  window.addEventListener('blur', () => teclas.clear(), opts);
  function tamano() {
    const w = root.clientWidth,
      h = root.clientHeight;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
    renderer.setSize(w, h, false);
    camara.aspect = w / h;
    camara.updateProjectionMatrix();
  }
  window.addEventListener('resize', tamano, opts);
  tamano();
  refrescar();
  const pulsada = (...codigos: string[]) => Number(codigos.some((c) => teclas.has(c)));
  function frame(ahora: number) {
    const dt = Math.min(0.06, (ahora - previo) / 1000);
    previo = ahora;
    tiempo += dt;
    const antes = cercano(),
      pos = jugador.position;
    let dx = 0,
      dz = 0;
    if (!dialogo.length) {
      const h = pulsada('KeyD', 'ArrowRight') - pulsada('KeyA', 'ArrowLeft'),
        v = pulsada('KeyS', 'ArrowDown') - pulsada('KeyW', 'ArrowUp');
      angulo += (pulsada('KeyR') - pulsada('KeyQ')) * dt * 1.4;
      if (h || v) {
        ruta = [];
        alLlegar = undefined;
        const giro = angulo;
        dx = h * Math.cos(giro) + v * Math.sin(giro);
        dz = -h * Math.sin(giro) + v * Math.cos(giro);
      } else if (ruta.length) {
        dx = ruta[0].x - pos.x;
        dz = ruta[0].z - pos.z;
        if (Math.hypot(dx, dz) < 0.008) {
          ruta.shift();
          dx = dz = 0;
        }
      }
      const largo = Math.hypot(dx, dz);
      if (largo > 0) {
        const paso = Math.min(largo, dt * 3.8);
        const nx = pos.x + (dx / largo) * paso,
          nz = pos.z + (dz / largo) * paso;
        const libre = (x: number, z: number) =>
          casaActual ? sueloInterior(x, z) : transitable(x, z, pueblo);
        if (libre(nx, pos.z)) pos.x = nx;
        if (libre(pos.x, nz)) pos.z = nz;
        jugador.rotation.y = Math.atan2(dx, dz);
      }
      if (alLlegar && !ruta.length) {
        const activar = alLlegar;
        alLlegar = undefined;
        activar();
      }
    }
    if (antes !== cercano()) refrescar();
    pos.y =
      (casaActual ? 0 : alturaPaseo(pos.x, pos.z, pueblo)) +
      (dx || dz ? Math.abs(Math.sin(tiempo * 11)) * 0.055 : 0);
    marca.position.y = 1.83 + Math.sin(tiempo * 2.4) * 0.07;
    marca.rotation.y = tiempo;
    barcos.forEach((b, i) => {
      b.position.y = -1.03 + 0.045 * Math.sin(tiempo * 1.6 + i);
      b.rotation.z = 0.035 * Math.sin(tiempo + i);
      b.rotation.y = b.userData.rumbo ?? 1.15 + i * 0.55;
    });
    luz = T.MathUtils.damp(luz, casaActual ? 0 : destinoLuz, 2.8, dt);
    paisaje.color.setRGB(1, 1, 1).lerp(tinteNoche, luz);
    for (const farol of luces) farol.intensity = plano.sinFaroles ? 0 : luz * 11;
    cristal.emissiveIntensity = 0.2 + luz * 2.2;
    ambiente.intensity = 1.42 - luz * 1.05;
    sol.intensity = 2.45 - luz * 2.12;
    cielo.copy(dia).lerp(noche, luz);
    (escena.fog as T.Fog).color.copy(cielo);
    aguaMaterial.uniforms.tiempo.value = tiempo;
    aguaMaterial.uniforms.oscuridad.value = luz;
    if (giroRincon !== undefined) {
      angulo = T.MathUtils.damp(angulo, giroRincon, 2.6, dt);
      if (Math.abs(giroRincon - angulo) < 0.005) giroRincon = undefined;
    }
    if(casaActual)angulo=T.MathUtils.clamp(angulo,-0.85,0.85);
    const radio = (casaActual ? distancia/3 : distancia) * (camara.aspect < 1 ? 1.13 : 1);
    // En un lugar en cuesta la cámara va pegada al viajero y sube y baja con la calle.
    const cuesta = !casaActual && !!plano.cuesta;
    centro.x = T.MathUtils.damp(
      centro.x,
      casaActual ? pos.x * 0.2 : cuesta ? pos.x : pos.x * (grande ? 0.86 : camara.aspect < 1 ? 0.78 : 0.5),
      5,
      dt,
    );
    centro.z = T.MathUtils.damp(centro.z, casaActual ? 0 : cuesta ? pos.z : pos.z * 0.55 - 2.5, 5, dt);
    centro.y = casaActual
      ? 0.75
      : cuesta
        ? T.MathUtils.damp(centro.y, 5 + alturaPaseo(pos.x, pos.z, pueblo), 5, dt)
        : 2.2;
    const giro = angulo;
    const elevacion = casaActual
      ? 0.77
      : (cuesta ? (plano.cuesta?.picado ?? 0.54) : 0.32) + Math.max(0, -Math.cos(giro)) * 0.58 + (cuesta ? 0 : Math.max(0, -pos.z) * 0.09);
    camara.position.set(
      centro.x + Math.sin(giro) * radio,
      centro.y + radio * elevacion,
      centro.z + Math.cos(giro) * radio,
    );
    camara.lookAt(centro);
    renderer.render(escena, camara);
    animacion = requestAnimationFrame(frame);
  }
  animacion = requestAnimationFrame(frame);
  return {
    mostrar(lineas: string[], alTerminar?: () => void) {
      ruta = [];
      alLlegar = undefined;
      quienHabla = t.pastor;
      dialogo = [...lineas];
      finDialogo = alTerminar;
      refrescar();
    },
    destruir() {
      cancelAnimationFrame(animacion);
      abort.abort();
      const materiales = new Set<T.Material>();
      escena.traverse((obj) => {
        if (obj instanceof T.Mesh) {
          obj.geometry.dispose();
          for (const m of [obj.material].flat()) materiales.add(m);
        }
      });
      materiales.forEach((m) => {
        if (m instanceof T.MeshStandardMaterial) m.map?.dispose();
        m.dispose();
      });
      for (const cartel of senales) {
        cartel.material.map?.dispose();
        cartel.material.dispose();
      }
      recursos.horizonte.dispose();
      mar.getRenderTarget().dispose();
      sol.shadow.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      root.remove();
    },
  };
}
