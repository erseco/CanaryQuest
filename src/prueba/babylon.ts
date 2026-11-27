import { CreateGround } from '@babylonjs/core/Meshes/Builders/groundBuilder';
import { ShaderMaterial } from '@babylonjs/core/Materials/shaderMaterial';
import { ShadowGenerator } from '@babylonjs/core/Lights/Shadows/shadowGenerator';
import '@babylonjs/core/Lights/Shadows/shadowGeneratorSceneComponent';
import { Engine } from '@babylonjs/core/Engines/engine';
import { Scene } from '@babylonjs/core/scene';
import { FreeCamera } from '@babylonjs/core/Cameras/freeCamera';
import { Camera } from '@babylonjs/core/Cameras/camera';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { DirectionalLight } from '@babylonjs/core/Lights/directionalLight';
import { Vector3, Matrix } from '@babylonjs/core/Maths/math.vector';
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color';
import { ImportMeshAsync } from '@babylonjs/core/Loading/sceneLoader';
import '@babylonjs/core/Culling/ray';
import '@babylonjs/loaders/glTF';
export async function abrir(canvas:HTMLCanvasElement,url:string){
  const engine=new Engine(canvas,true), scene=new Scene(engine);
  scene.useRightHandedSystem=true;scene.clearColor=new Color4(.12,.5,.56,1);
  const cam=new FreeCamera('Cámara',Vector3.Zero(),scene);cam.mode=Camera.ORTHOGRAPHIC_CAMERA;
  const cielo = new HemisphericLight('Luz del Atlántico', Vector3.Up(), scene);
  cielo.intensity = .8;
  cielo.groundColor = new Color3(.33,.37,.42);
  const sol = new DirectionalLight('Sol de tarde', new Vector3(-.55,-1,-.45),scene);
  sol.position.set(14,25,12);
  sol.diffuse = new Color3(1,.87,.68);
  sol.intensity = 2.1;
  const sombras = new ShadowGenerator(1024,sol);
  sombras.usePercentageCloserFiltering = true;
  sombras.bias = .0004;
  sombras.normalBias = .017;
  const modelo = await ImportMeshAsync(url,scene);
  for (const mesh of modelo.meshes) {
    if (!mesh.getTotalVertices()) continue;
    mesh.receiveShadows = true;
    sombras.addShadowCaster(mesh,false);
  }
  const mar = CreateGround('Dársena',{width:180,height:180},scene);
  mar.position.y = -.84;
  const agua = new ShaderMaterial('Agua del puerto',scene,{
    vertexSource:`precision highp float;
      attribute vec3 position; uniform mat4 worldViewProjection; varying vec2 costa;
      void main(){costa=position.xz;gl_Position=worldViewProjection*vec4(position,1.0);}`,
    fragmentSource:`precision highp float;
      varying vec2 costa; uniform float tiempo;
      void main(){
        float ola=sin(costa.y*4.0+sin(costa.x*1.3+tiempo)*.8-tiempo*1.6);
        float brillo=smoothstep(.86,1.0,ola)*smoothstep(.25,.95,sin(costa.x*2.6+costa.y+tiempo*.6));
        float fondo=smoothstep(3.,22.,costa.y+.85*sin(costa.x*.5));
        vec3 color=mix(vec3(.12,.61,.60),vec3(.045,.32,.46),fondo);
        gl_FragColor=vec4(color+brillo*vec3(.24,.26,.20),1.);
      }`
  },{attributes:['position'],uniforms:['worldViewProjection','tiempo']});
  agua.backFaceCulling=false;
  mar.material=agua;
  let tiempo=0;
  const viajero=scene.getNodeByName('Viajero') as import('@babylonjs/core').TransformNode;
  const puerto=scene.getNodeByName('Puerto')!, casa=scene.getNodeByName('Casa')!;
  viajero.rotationQuaternion=null;
  return {
    mover(x:number,y:number,z:number,g:number,interior:boolean){
      mar.setEnabled(!interior);puerto.setEnabled(!interior);casa.setEnabled(interior);viajero.position.set(x,y,z);viajero.rotation.y=g;
      engine.resize();const ancho=7*canvas.clientWidth/canvas.clientHeight;
      cam.orthoLeft=-ancho;cam.orthoRight=ancho;cam.orthoTop=7;cam.orthoBottom=-7;
      cam.position.set(x+7,12,z+15);cam.setTarget(new Vector3(x,0,z));
    },
    suelo(x:number,y:number){const r=scene.createPickingRay(x,y,Matrix.Identity(),cam);return r.origin.add(r.direction.scale(-r.origin.y/r.direction.y));},
    animar(fn:(dt:number)=>void){engine.runRenderLoop(()=>{const dt=engine.getDeltaTime()/1000;tiempo+=Math.min(dt,.1);agua.setFloat('tiempo',tiempo);fn(dt);scene.render();});}
  };
}
