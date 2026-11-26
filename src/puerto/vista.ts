import * as T from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { cargarRecursos } from './recursos';
import { crearMaqueta } from './maqueta';
import { alturaPaseo, PASTOR, rutaPuerto, transitable, type PuntoPuerto } from './paseo';
import { PUERTO as t } from '../data/dialogos';
import './puerto.css';

export async function abrirPuerto(hablar: () => void, salir: () => void, objetivo: () => string) {
  const recursos = await cargarRecursos();
  const renderer = new T.WebGLRenderer({ antialias: true, powerPreference: 'low-power' });
  const root = document.createElement('section');
  root.className = 'puerto';
  root.innerHTML = `<header><div class="marca"><span class="rosa" aria-hidden="true">✥</span>${t.marca}</div>
    <div class="acciones"><button data-accion="luz" aria-label="${t.luz}">☀ ${t.dia}</button><button data-accion="mapa">${t.mapa} ↗</button>
    <details><summary aria-label="${t.controles}">?</summary><p>${t.ayuda}</p></details></div></header>
    <aside><small>${t.lugar}</small><h1>${t.titulo}</h1></aside>
    <footer><article aria-live="polite"><small>${t.jornada}</small><h2>${t.encargo}</h2><p></p><button data-accion="accion"></button></article>
    <div class="camara"><button aria-label="${t.izquierda}" data-accion="izq">↶</button><button aria-label="${t.derecha}" data-accion="der">↷</button>
    <button aria-label="${t.lejos}" data-accion="menos">−</button><button aria-label="${t.cerca}" data-accion="mas">+</button></div></footer>`;
  root.prepend(renderer.domElement);
  document.body.append(root);
  const canvas = renderer.domElement;
  canvas.setAttribute('aria-label', t.escena);
  const escena = new T.Scene(),
    camara = new T.PerspectiveCamera(37, 1, 0.15, 175);
  const tinteNoche = new T.Color(0x43567d);
  const dia = new T.Color('#efd6b9'),
    noche = new T.Color('#344e70');
  const cielo = new T.Color();
  escena.background = cielo;
  escena.fog = new T.Fog(cielo, 26, 68);
  const ambiente = new T.HemisphereLight(0xffedd4, 0x8199ae, 1.5);
  const sol = new T.DirectionalLight(0xffdcaa, 2.4);
  sol.position.set(-16, 13, 8);
  sol.castShadow = true;
  Object.assign(sol.shadow.camera, { left: -19, right: 19, top: 16, bottom: -16, far: 65 });
  sol.shadow.mapSize.set(1024, 1024);
  sol.shadow.normalBias = 0.035;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFShadowMap;
  escena.add(ambiente, sol);
  const paisaje = new T.MeshBasicMaterial({ map: recursos.horizonte, side: T.BackSide, fog: false });
  const horizonte = new T.Mesh(new T.CylinderGeometry(50, 50, 44, 96, 1, true), paisaje);
  horizonte.position.y = 15;
  horizonte.rotation.y = -0.82;
  escena.add(horizonte);
  const luces = [-8.5, -3, 3, 8.5].map((x) => {
    const luz = new T.PointLight(0xffab52, 0, 6, 1.7);
    luz.position.set(x, 1.96, 3.35);
    escena.add(luz);
    return luz;
  });
  const { jugador, pastor, barcos, cristal } = crearMaqueta(escena, recursos);
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
      },
      vertexShader: `uniform mat4 textureMatrix; varying vec4 reflejado; varying vec3 pos; void main(){reflejado=textureMatrix*vec4(position,1.);vec4 p=modelMatrix*vec4(position,1.);pos=p.xyz;gl_Position=projectionMatrix*viewMatrix*p;}`,
      fragmentShader: `uniform sampler2D tDiffuse; varying vec4 reflejado; varying vec3 pos; uniform float tiempo; uniform float oscuridad;
      void main(){vec2 p=pos.xz; float a=sin(p.y*5.+sin(p.x*1.8+tiempo*.5)*.6-tiempo*.85);
        float b=sin(p.y*8.+p.x*.4+sin(p.x*3.-tiempo*.33)-tiempo);
        float costa=exp(-max(0.,p.y-3.7)*.28)*(1.-smoothstep(8.,12.,abs(p.x)));
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
  escena.add(mar);
  // Una señal suspendida distingue al personaje con el que se puede hablar.
  const marca = new T.Mesh(new T.OctahedronGeometry(0.16), new T.MeshBasicMaterial({ color: 0xffd17c }));
  marca.position.copy(pastor.position);
  escena.add(marca);
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
    hablarAlLlegar = false,
    dialogo: string[] = [],
    finDialogo: (() => void) | undefined;
  const centro = new T.Vector3(0, 2.2, -1.9);
  const accion = root.querySelector<HTMLButtonElement>('[data-accion="accion"]')!;
  const parrafo = root.querySelector('article p')!,
    titulo = root.querySelector('h2')!;
  const cerca = () => Math.hypot(jugador.position.x - PASTOR.x, jugador.position.z - PASTOR.z) < 1.45;
  function refrescar() {
    titulo.textContent = dialogo.length ? t.pastor : t.encargo;
    parrafo.textContent = dialogo[0] ?? (objetivo() || t.buscar);
    accion.textContent = dialogo.length
      ? dialogo.length === 1
        ? t.cerrar
        : t.seguir
      : cerca()
        ? t.hablar
        : objetivo()
          ? t.salir
          : t.acercar;
  }
  function ir(p: PuntoPuerto, conversar = false) {
    ruta = rutaPuerto(jugador.position, p);
    hablarAlLlegar = conversar && ruta.length > 0;
  }
  function interactuar() {
    if (dialogo.length) {
      dialogo.shift();
      if (!dialogo.length) {
        finDialogo?.();
        finDialogo = undefined;
      }
      refrescar();
    } else if (cerca()) hablar();
    else if (objetivo()) salir();
    else ir({ x: PASTOR.x - 0.8, z: PASTOR.z }, true);
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
          distancia = Math.min(42, distancia + 3);
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
      if (
        ray.intersectObject(pastor, true).length ||
        (punto && Math.hypot(punto.x - PASTOR.x, punto.z - PASTOR.z) < 0.85)
      ) {
        if (cerca()) hablar();
        else ir({ x: PASTOR.x - 0.8, z: PASTOR.z }, true);
      } else if (punto && transitable(punto.x, punto.z)) ir(punto);
    },
    opts,
  );
  window.addEventListener(
    'keydown',
    (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.code)) e.preventDefault();
      teclas.add(e.code);
      if (!e.repeat && e.code === 'KeyE' && (dialogo.length || cerca())) {
        if (dialogo.length) interactuar();
        else hablar();
      }
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
    const antes = cerca(),
      pos = jugador.position;
    let dx = 0,
      dz = 0;
    if (!dialogo.length) {
      const h = pulsada('KeyD', 'ArrowRight') - pulsada('KeyA', 'ArrowLeft'),
        v = pulsada('KeyS', 'ArrowDown') - pulsada('KeyW', 'ArrowUp');
      angulo += (pulsada('KeyR') - pulsada('KeyQ')) * dt * 1.4;
      if (h || v) {
        ruta = [];
        hablarAlLlegar = false;
        dx = h * Math.cos(angulo) + v * Math.sin(angulo);
        dz = -h * Math.sin(angulo) + v * Math.cos(angulo);
      } else if (ruta.length) {
        dx = ruta[0].x - pos.x;
        dz = ruta[0].z - pos.z;
        if (Math.hypot(dx, dz) < 0.06) {
          ruta.shift();
          dx = dz = 0;
        }
      }
      const largo = Math.hypot(dx, dz);
      if (largo > 0) {
        const paso = Math.min(largo, dt * 3.8);
        const nx = pos.x + (dx / largo) * paso,
          nz = pos.z + (dz / largo) * paso;
        if (transitable(nx, pos.z)) pos.x = nx;
        if (transitable(pos.x, nz)) pos.z = nz;
        jugador.rotation.y = Math.atan2(dx, dz);
      }
      if (hablarAlLlegar && !ruta.length) {
        hablarAlLlegar = false;
        if (cerca()) hablar();
      }
    }
    if (antes !== cerca()) refrescar();
    pos.y = alturaPaseo(pos.x, pos.z) + (dx || dz ? Math.abs(Math.sin(tiempo * 11)) * 0.055 : 0);
    marca.position.y = 1.83 + Math.sin(tiempo * 2.4) * 0.07;
    marca.rotation.y = tiempo;
    barcos.forEach((b, i) => {
      b.position.y = -1.03 + 0.045 * Math.sin(tiempo * 1.6 + i);
      b.rotation.z = 0.035 * Math.sin(tiempo + i);
      b.rotation.y = 1.15 + i * 0.55;
    });
    luz = T.MathUtils.damp(luz, destinoLuz, 2.8, dt);
    paisaje.color.setRGB(1, 1, 1).lerp(tinteNoche, luz);
    for (const farol of luces) farol.intensity = luz * 11;
    cristal.emissiveIntensity = 0.2 + luz * 2.2;
    ambiente.intensity = 1.42 - luz * 1.05;
    sol.intensity = 2.45 - luz * 2.12;
    cielo.copy(dia).lerp(noche, luz);
    (escena.fog as T.Fog).color.copy(cielo);
    aguaMaterial.uniforms.tiempo.value = tiempo;
    aguaMaterial.uniforms.oscuridad.value = luz;
    const radio = distancia * (camara.aspect < 1 ? 1.13 : 1);
    centro.x = T.MathUtils.damp(centro.x, pos.x * (camara.aspect < 1 ? 0.6 : 0.18), 3, dt);
    camara.position.set(
      centro.x + Math.sin(angulo) * radio,
      centro.y + radio * (0.32 + Math.max(0, -Math.cos(angulo)) * 0.58),
      centro.z + Math.cos(angulo) * radio,
    );
    camara.lookAt(centro);
    renderer.render(escena, camara);
    animacion = requestAnimationFrame(frame);
  }
  animacion = requestAnimationFrame(frame);
  return {
    mostrar(lineas: string[], alTerminar?: () => void) {
      ruta = [];
      hablarAlLlegar = false;
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
      recursos.horizonte.dispose();
      mar.getRenderTarget().dispose();
      sol.shadow.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      root.remove();
    },
  };
}
