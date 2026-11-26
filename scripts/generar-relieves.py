"""Genera ocho maquetas ilustradas y sus mapas Tiled. Requiere el ArcGrid de generar-carta.py,
numpy, scipy, rasterio y Pillow. Uso: python scripts/generar-relieves.py recorte-IGN.asc
"""
import json
import math
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw
from rasterio.features import shapes
from scipy.ndimage import distance_transform_edt, label, map_coordinates, gaussian_filter
from scipy.spatial import Delaunay

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "public/assets"
LUGARES = json.loads((ROOT / "src/data/geografia.json").read_text())
MDT = np.loadtxt(sys.argv[1], skiprows=6, dtype="float32")
assert MDT.shape == (1000, 2400) and MDT.max() > 3600
COMPONENTES, _ = label(MDT > .7)
W, H = 1920, 1600
# Semilla en tierra firme y color de las medianías.
ISLAS = {
    "el-hierro": (-18.00, 27.75, "#738551"), "la-palma": (-17.83, 28.64, "#638453"),
    "la-gomera": (-17.23, 28.12, "#6e945f"), "tenerife": (-16.60, 28.26, "#869459"),
    "gran-canaria": (-15.59, 27.96, "#98a463"), "lanzarote": (-13.65, 29.01, "#b5775c"),
    "fuerteventura": (-14.04, 28.40, "#c79e68"), "la-graciosa": (-13.51, 29.25, "#c9a66c"),
}


def celdas(lon, lat):
    return ((lon + 18.4) / .0021875 - .5, (29.58 - lat) / .00216 - .5)


def rgb(t):
    return tuple(bytes.fromhex(t.lstrip("#")))


def dibujar(isla, semilla):
    lon, lat, tono = ISLAS[isla]
    cx, cy = celdas(lon, lat)
    mascara = COMPONENTES == COMPONENTES[round(cy), round(cx)]
    ys, xs = np.where(mascara)
    assert 250 < len(xs) < 100000
    # Malla local en coordenadas de la proyección oblicua, norte arriba.
    x0, y0 = xs.min()-3, ys.min()-3
    corte = mascara[y0:ys.max()+4, x0:xs.max()+4]
    z = np.where(corte, MDT[y0:ys.max()+4, x0:xs.max()+4], 0)
    alto, ancho = z.shape
    ky = .00216 / (.0021875 * math.cos(math.radians(lat))) * .79
    k = min((W-310)/ancho, (H-260)/(alto*ky))
    ox, oy = (W-ancho*k)/2, (H-alto*k*ky)/2+18
    relieve = min(.22, 145 / z.max())
    rng = np.random.default_rng(semilla)
    def proyectar(x, y, altura=0):
        return (round(ox+x*k), round(oy+y*k*ky-altura*relieve))
    def altura(x, y):
        return float(map_coordinates(z, [[y],[x]],order=1)[0])
    costa = next(g["coordinates"][0] for g,_ in shapes(corte.astype("uint8"),mask=corte))
    # La orilla pasa entre las muestras de tierra y agua.
    costa = [proyectar(x-.5,y-.5) for x,y in costa]
    for _ in range(2):
        costa = [(round(a[0]*f+b[0]*(1-f)),round(a[1]*f+b[1]*(1-f)))
                 for a,b in zip(costa,costa[1:]+costa[:1]) for f in (.75,.25)]
    costa = list(dict.fromkeys(costa))
    mask = Image.new("L",(W,H)); ImageDraw.Draw(mask).polygon(costa,fill=255)
    playa = np.asarray(mask.resize((W//4,H//4),Image.Resampling.BILINEAR))>127
    dist = distance_transform_edt(~playa)*4
    y,x = np.indices(dist.shape)
    olas = np.sin(y*.71 + np.sin(x*.075)*2.2 + np.sin(x*.022+y*.1))*.95
    a = np.exp(-dist/68)
    luz = (8*np.sin(x*.007-y*.006)+olas)[:,:,None]
    mar = [28,91,111] + a[:,:,None]*[29,93,70]+luz
    for nivel in [6,17,34,61,96]:
        mar += np.exp(-((dist-nivel)/2.7)**2)[:,:,None]*[19,25,17]
    img = Image.fromarray(np.uint8(np.clip(mar,0,255))).resize((W,H),Image.Resampling.BICUBIC)
    d = ImageDraw.Draw(img)
    for _ in range(850):
        u,v=rng.integers([2,2],[W-14,H-3])
        if dist[v//4,u//4]>8 and math.sin(u*.013+v*.022)>.25:
            color=tuple(min(255,c+int(rng.integers(7,17))) for c in img.getpixel((u,v)))
            d.line((u,v,u+int(rng.integers(3,18)),v),fill=color,width=2)
    d.polygon([(u+2,v+8) for u,v in costa],fill="#706b57")
    d.line([(u,v+7) for u,v in costa]+[(costa[0][0],costa[0][1]+7)],fill="#d1e0c9",width=3)
    tierra = Image.new("RGB",(W,H),"#e6c990")
    t = ImageDraw.Draw(tierra)
    # Triangulación irregular: cada cara recibe luz según la pendiente real del MDT.
    paso = 23/k
    yy,xx=np.mgrid[-paso:alto+paso:paso,-paso:ancho+paso:paso]
    vertices=np.column_stack((xx.ravel(),yy.ravel()))+rng.uniform(-.34,.34,(xx.size,2))*paso
    elev=map_coordinates(z,[vertices[:,1],vertices[:,0]],order=1)
    proyectados=np.array([proyectar(u,v,h) for (u,v),h in zip(vertices,elev)])
    caras=Delaunay(vertices).simplices
    medias=vertices[caras].mean(axis=1)
    seco=isla in ("lanzarote","la-graciosa","fuerteventura")
    niveles=[0,45,220,700,1350,2050,3050,3800]
    paleta=np.array([rgb(i) for i in ("#e7cf94","#c7b679",tono,("#ad805b" if seco else "#889960"),"#ad9272","#9b7f70","#bc9c85","#ead8b6")])
    base=gaussian_filter(rng.normal(size=z.shape),max(1,ancho/42));base/=max(.001,base.std())
    for j in medias[:,1].argsort():
        f=caras[j]; u,v=medias[j]
        if not (-1<u<ancho and -1<v<alto): continue
        h=elev[f].mean()
        if h<.2: continue
        xyz=np.column_stack((vertices[f,0]*k,vertices[f,1]*k*ky,elev[f]*relieve))
        n=np.cross(xyz[1]-xyz[0],xyz[2]-xyz[0]);n/=max(.00001,np.linalg.norm(n))
        if n[2]<0:n=-n
        shade=.76+np.dot(n,[-.60,-.48,.64])*.39
        albedo=np.array([np.interp(h,niveles,c) for c in paleta.T])
        albedo+=base[min(alto-1,round(v)),min(ancho-1,round(u))]*np.array([3,4,2])
        color=tuple(np.uint8(np.clip(albedo*shade+rng.normal(0,1.3),0,255)))
        t.polygon([tuple(p) for p in proyectados[f]],fill=color)
    img.paste(tierra,mask=mask); d=ImageDraw.Draw(img)
    tierra_firme=distance_transform_edt(corte)
    lugares={}
    for nombre,(lon_p,lat_p) in LUGARES[isla].items():
        u,v=celdas(lon_p,lat_p);u-=x0;v-=y0
        # El muelle puede estar en el mar en el MDT200. Se desembarca en tierra contigua.
        borde=max(1.1,9/k)
        if not (0<=round(v)<alto and 0<=round(u)<ancho and tierra_firme[round(v),round(u)]>=borde):
            vy,vx=np.where(tierra_firme>=borde);ind=np.argmin((vx-u)**2+(vy-v)**2);u,v=vx[ind],vy[ind]
        lugares[nombre]=proyectar(u,v,altura(u,v))
    miradores = {"teide","caldera","montana-amarilla","malpaso"}
    aeropuertos = {n for n in lugares if n.endswith(("aeropuerto","-norte","-sur"))}
    puertos = {n for n in lugares if n.split("-")[0] in ("gc","tf","lp","eh","lg","fv","lz","lgr")} - aeropuertos
    # En el mapa de paseo las construcciones y los caminos son miniaturas ilustradas.
    for n,(px,py) in lugares.items():
        if n in miradores:continue
        if n in puertos or n in ("las-palmas","pueblo","betancuria","isleta"):
            for dy in (-12,0,12):
                puntos=[(px-32,py+dy+8),(px-13,py+dy+4),(px+6,py+dy-2),(px+26,py+dy-6)]
                for a,b in zip(puntos,puntos[1:]):
                    if mask.getpixel(a) and mask.getpixel(b):
                        d.line((a,b),fill="#e3c89d",width=4)
        if n in puertos:
            # Coloca el pesquero del lado de mar usando el contorno de esta isla.
            candidatos=[(px+round(50*math.cos(a)),py+round(50*math.sin(a))) for a in np.linspace(0,2*math.pi,36)]
            barco=next(((x,y) for x,y in candidatos if not mask.getpixel((x,y))),None)
            if barco:
                x,y=barco
                d.ellipse((x-13,y,x+12,y+4),fill="#4c9f9e")
                d.polygon([(x-12,y-1),(x+11,y-2),(x+7,y+2),(x-6,y+3)],fill="#784f3d")
                d.polygon([(x-7,y-2),(x,y-14),(x,y-2)],fill="#fae5b7")
                d.polygon([(x+2,y-12),(x+8,y-3),(x+2,y-3)],fill="#ddaa70")
        if n in aeropuertos:
            # Pista simbólica; el marcador identifica la terminal.
            d.line((px-19,py+10,px+24,py-13),fill="#ddcdb6",width=8)
            d.line((px-19,py+10,px+24,py-13),fill="#84877c",width=5)
            for i in range(4):d.line((px-15+i*10,py+8-i*5,px-11+i*10,py+6-i*5),fill="#e7e2cf",width=1)
        if n=="roque-nublo":
            d.polygon([(px-9,py+1),(px-7,py-23),(px-3,py-31),(px+3,py-30),(px+6,py-20),(px+4,py)],fill="#8b6854")
            d.polygon([(px-9,py),(px-7,py-23),(px-3,py-31),(px,py-25),(px-2,py)],fill="#bd9870")
    decor=[]
    for _ in range(3200 if not seco else 1200):
        u,v=rng.uniform(0,ancho-1),rng.uniform(0,alto-1)
        h=altura(u,v)
        if h<20 or h>2060 or tierra_firme[round(v),round(u)]<2:continue
        bosque=not seco and h>180 and base[round(v),round(u)]>-.18
        if not bosque and rng.random()>.22:continue
        px,py=proyectar(u,v,h)
        if any((px-a)**2+(py-b)**2<2400 for a,b in lugares.values()):continue
        decor.append((py,px,"pino" if bosque else "roca",int(rng.integers(4,10))))
    for nombre,(px,py) in lugares.items():
        if nombre in miradores or nombre in ("roque-nublo","garajonay","dunas","jameos","timanfaya"):continue
        for _ in range(16 if nombre in ("las-palmas","pueblo","isleta") else 8):
            x,y=round(px+rng.normal(0,19)),round(py+rng.normal(0,12))
            if 0<x<W and 0<y<H and mask.getpixel((x,y)):decor.append((y,x,"casa",int(rng.integers(4,8))))
    for y,x,tipo,s in sorted(decor):
        if tipo=="pino":
            d.ellipse((x-s//2,y-1,x+s+2,y+2),fill="#687957")
            d.line((x,y,x,y-5),fill="#725d46",width=2)
            d.polygon([(x,y-s*2),(x-s//2-1,y-3),(x+s//2+1,y-3)],fill="#386a56")
            d.polygon([(x,y-s*2),(x-s//2-1,y-3),(x,y-5)],fill="#659061")
        elif tipo=="casa":
            d.polygon([(x-s,y-s),(x,y-2),(x,y+3),(x-s,y-1)],fill="#eee1b6")
            d.polygon([(x,y-2),(x+s,y-s),(x+s,y-1),(x,y+3)],fill="#b7a483")
            d.polygon([(x-s-1,y-s),(x-1,y-s-3),(x+s+1,y-s),(x,y-2)],fill="#b87551")
        else:
            d.polygon([(x-s//2,y),(x-2,y-s//2),(x+2,y-s//2-1),(x+s//2,y)],fill="#9c8768")
    img.save(ASSETS/f"islas/{isla}.webp",quality=88,method=4)
    # Polígono simplificado en coordenadas del mismo render. Preserva las ensenadas pequeñas.
    def simplificar(p):
        if len(p)<3:return p
        a,b=np.array(p[0]),np.array(p[-1]);linea=b-a
        q=np.array(p)-a
        delta=q-np.outer(np.clip(q@linea/max(1,linea@linea),0,1),linea)
        distancias=np.sum(delta**2,axis=1);i=distancias.argmax()
        return simplificar(p[:i+1])[:-1]+simplificar(p[i:]) if distancias[i]>4 else [p[0],p[-1]]
    pol=simplificar(costa+[costa[0]])[:-1]
    def capa(i,nombre,objetos):
        return dict(id=i,name=nombre,type="objectgroup",visible=True,opacity=1,x=0,y=0,objects=objetos)
    def punto(i,nombre,tipo,p):
        return dict(id=i,name=nombre,type=tipo,point=True,x=p[0],y=p[1],visible=True,rotation=0)
    borde=dict(id=1,name="andable",type="andable",x=0,y=0,visible=True,rotation=0,polygon=[dict(x=x,y=y) for x,y in pol])
    spawn=lugares.get("pueblo",next(iter(lugares.values())))
    pois=[punto(2,"spawn","spawn",spawn)]
    for i,(nombre,p) in enumerate(lugares.items(),3):
        tipo="transporte" if nombre[:3] in ("gc-","tf-","lp-","eh-","lg-","fv-","lz-","lgr") else ("paisaje" if nombre in miradores else "entrada")
        assert mask.getpixel(p), (isla,nombre,p)
        pois.append(punto(i,nombre,tipo,p))
    mapa=dict(type="map",version="1.10",tiledversion="1.10.2",orientation="orthogonal",renderorder="right-down",
              infinite=False,width=W//32,height=H//32,tilewidth=32,tileheight=32,nextlayerid=3,nextobjectid=len(pois)+2,
              tilesets=[],layers=[capa(1,"colisiones",[borde]),capa(2,"pois",pois)])
    (ASSETS/f"maps/islas/{isla}.tmj").write_text(json.dumps(mapa,separators=(",",":"))+"\n")
    print(isla,len(pol),flush=True)


if __name__ == "__main__":
    for i, nombre in enumerate(ISLAS):
        dibujar(nombre,i+85)
