import { Engine } from '@babylonjs/core/Engines/engine';
import { Scene } from '@babylonjs/core/scene';
import { FreeCamera } from '@babylonjs/core/Cameras/freeCamera';
import { Camera } from '@babylonjs/core/Cameras/camera';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { DirectionalLight } from '@babylonjs/core/Lights/directionalLight';
import { Vector3, Matrix } from '@babylonjs/core/Maths/math.vector';
import { Color4 } from '@babylonjs/core/Maths/math.color';
import { ImportMeshAsync } from '@babylonjs/core/Loading/sceneLoader';
import '@babylonjs/core/Culling/ray';
import '@babylonjs/loaders/glTF';
export async function abrir(canvas:HTMLCanvasElement,url:string){
  const engine=new Engine(canvas,true), scene=new Scene(engine);
  scene.useRightHandedSystem=true;scene.clearColor=new Color4(.12,.5,.56,1);
  const cam=new FreeCamera('Cámara',Vector3.Zero(),scene);cam.mode=Camera.ORTHOGRAPHIC_CAMERA;
  new HemisphericLight('Cielo',Vector3.Up(),scene);
  new DirectionalLight('Sol',new Vector3(-.5,-1,-.3),scene);
  await ImportMeshAsync(url,scene);
  const viajero=scene.getNodeByName('Viajero') as import('@babylonjs/core').TransformNode;
  const puerto=scene.getNodeByName('Puerto')!, casa=scene.getNodeByName('Casa')!;
  viajero.rotationQuaternion=null;
  return {
    mover(x:number,y:number,z:number,g:number,interior:boolean){
      puerto.setEnabled(!interior);casa.setEnabled(interior);viajero.position.set(x,y,z);viajero.rotation.y=g;
      engine.resize();const ancho=7*canvas.clientWidth/canvas.clientHeight;
      cam.orthoLeft=-ancho;cam.orthoRight=ancho;cam.orthoTop=7;cam.orthoBottom=-7;
      cam.position.set(x+7,12,z+15);cam.setTarget(new Vector3(x,0,z));
    },
    suelo(x:number,y:number){const r=scene.createPickingRay(x,y,Matrix.Identity(),cam);return r.origin.add(r.direction.scale(-r.origin.y/r.direction.y));},
    animar(fn:(dt:number)=>void){engine.runRenderLoop(()=>{fn(engine.getDeltaTime()/1000);scene.render();});}
  };
}
