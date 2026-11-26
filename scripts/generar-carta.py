"""Carta de Canarias. python generar-carta.py [recorte-IGN.asc] (numpy, scipy, Pillow)."""
from pathlib import Path
from io import BytesIO
import sys
from urllib.request import urlopen
import numpy as np
from scipy.ndimage import distance_transform_edt, gaussian_filter, map_coordinates
from PIL import Image, ImageDraw

URL = ("https://servicios.idee.es/wcs-inspire/mdt?service=WCS&version=1.0.0&request=GetCoverage"
       "&coverage=Elevacion4258_200&crs=EPSG:4258&bbox=-18.40,27.42,-13.15,29.58"
       "&width=2400&height=1000&format=ArcGrid")
fuente = Path(sys.argv[1]).read_bytes() if len(sys.argv) > 1 else urlopen(URL, timeout=90).read()
mdt = np.loadtxt(BytesIO(fuente), skiprows=6, dtype='float32')
assert mdt.shape == (1000, 2400) and mdt.max() > 3600
w, h = 2752, 1536
y, x = np.indices((h,w), dtype='float32')
lon, lat = -18.53 + (x+.5)*5.45/w, 29.83 - (y+.5)*2.68/h
z = map_coordinates(mdt, [(29.58-lat)*1000/2.16-.5,(lon+18.4)*2400/5.25-.5],order=1)
tierra = z > .7
dist = distance_transform_edt(~tierra)
rng = np.random.default_rng(8)
grano = rng.normal(0,1.7,z.shape)
oleaje = np.sin(y*.23+np.sin(x*.014)*3+np.sin(x*.005+y*.009)*5)
mar = np.array([27,85,97]) + np.exp(-dist[:,:,None]/35)*[24,50,40]
mar += (grano*.64+oleaje*1.4+7*np.sin(x/w*3+y/h*1.2))[:,:,None]
for metros in [5,13,26,43]:
    mar += np.exp(-((dist-metros)/1.35)**2)[:,:,None]*[10,19,16]
mar += (dist < 2.3)[:,:,None]*[53,52,29]
# Luz rasante del noroeste, combinada con el relieve a escala de barranco.
suave = gaussian_filter(z,1)
dy,dx = np.gradient(suave)
luz = np.clip((dx+dy)*.011,-.48,.45) + np.clip((z-gaussian_filter(z,5))*.002,-.12,.14)
alt = [0,60,220,600,1000,1600,2250,3100,3750]
paleta = np.array([[220,197,145],[169,169,111],[138,155,101],[139,153,103],[170,153,112],[167,131,98],[155,126,111],[183,159,135],[237,219,182]])
terreno = np.stack([np.interp(z,alt,c) for c in paleta.T],axis=2)
arido = np.clip((lon+15)*1.6,0,1) * tierra
terreno += arido[:,:,None]*[28,2,-7]
terreno *= (1+luz[:,:,None])
terreno += (grano*.7 - 6*np.exp(-(np.mod(z+7,130)-7)**2/44))[:,:,None]
img=Image.fromarray(np.clip(np.where(tierra[:,:,None],terreno,mar),0,255).astype('uint8'))
d=ImageDraw.Draw(img,'RGBA')
for l in [-18,-17,-16,-15,-14]:
    xx=round((l+18.53)*w/5.45)
    d.line((xx,0,xx,h),fill=(235,224,181,25),width=2)
for l in [28,29]:
    yy=round((29.83-l)*h/2.68)
    d.line((0,yy,w,yy),fill=(235,224,181,25),width=2)
img.save(Path(__file__).resolve().parents[1]/'public/assets/islas/carta-canarias.webp',quality=90,method=6)
