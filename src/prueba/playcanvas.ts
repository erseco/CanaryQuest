import * as pc from 'playcanvas';
export async function abrir(canvas: HTMLCanvasElement,url:string){
  const app=new pc.Application(canvas);
  app.setCanvasResolution(pc.RESOLUTION_AUTO);
  const cam=new pc.Entity();cam.addComponent('camera',{clearColor:new pc.Color(.12,.5,.56),projection:pc.PROJECTION_ORTHOGRAPHIC,orthoHeight:7});app.root.addChild(cam);
  const luz=new pc.Entity();luz.addComponent('light',{type:'directional',intensity:1.6});luz.setEulerAngles(52,25,160);app.root.addChild(luz);
  app.scene.ambientLight=new pc.Color(.65,.65,.65);
  const modelo=await new Promise<pc.Entity>((ok,fail)=>app.assets.loadFromUrl(url,'container',(err,asset)=>err?fail(err):ok(asset!.resource!.instantiateRenderEntity())));
  app.root.addChild(modelo);
  const viajero=modelo.findByName('Viajero') as pc.Entity, puerto=modelo.findByName('Puerto') as pc.Entity,casa=modelo.findByName('Casa') as pc.Entity;
  app.start();
  return {
    mover(x:number,y:number,z:number,g:number,interior:boolean){
      puerto.enabled=!interior;casa.enabled=interior;viajero.setPosition(x,y,z);viajero.setEulerAngles(0,g*180/Math.PI,0);
      cam.setPosition(x+7,12,z+15);cam.lookAt(x,0,z);app.resizeCanvas();
    },
    suelo(x:number,y:number){const a=cam.camera!.screenToWorld(x,y,1),b=cam.camera!.screenToWorld(x,y,100);return a.lerp(a,b,-a.y/(b.y-a.y));},
    animar(fn:(dt:number)=>void){app.on('update',fn);}
  };
}
