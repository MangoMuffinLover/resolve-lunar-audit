"""Read-only native NASA pixels for a display mesh; never updates research artifacts."""
import argparse, hashlib, json
from pathlib import Path
import numpy as np
import rasterio
from rasterio.windows import Window
from pyproj import CRS, Transformer

parser = argparse.ArgumentParser()
parser.add_argument('--research-root', required=True, type=Path)
parser.add_argument('--output', required=True, type=Path)
args = parser.parse_args()
relative = 'data/raw/r01c/LDEM_80S_80MPP_ADJ.TIF.native_window.tif'
path = args.research_root / relative
receipt = json.loads(path.with_suffix(path.suffix+'.retrieval.json').read_text(encoding='utf-8'))
sha = hashlib.sha256(path.read_bytes()).hexdigest()
assert sha == receipt['sha256']
with rasterio.open(path) as src:
    crs = CRS.from_wkt(src.crs.to_wkt())
    sx, sy = Transformer.from_crs(crs.geodetic_crs, crs, always_xy=True).transform(-68.01460926527753, -88.5134116385092)
    row, col = src.index(sx, sy)
    side = 161
    row0 = min(max(0,row-side//2), src.height-side)
    col0 = min(max(0,col-side//2), src.width-side)
    assert row0 >= 0 and col0 >= 0 and row0+side <= src.height and col0+side <= src.width
    heights = src.read(1, window=Window(col0, row0, side, side)).astype('float64')
    heights = heights*src.scales[0]+src.offsets[0]
    assert np.isfinite(heights).all()
    origin_x, origin_y = src.xy(row0+side//2, col0+side//2)
    datum = float(src.read(1,window=Window(col,row,1,1))[0,0])*src.scales[0]+src.offsets[0]
    vertices=[]
    for r in range(side):
        for c in range(side):
            x,y=src.xy(row0+r,col0+c)
            vertices.append([(x-origin_x)/1000,(y-origin_y)/1000,(float(heights[r,c])-datum)/1000])
    provenance = dict(schema='resolve.terrain-study.v1', nasa_product=90, source_filename=receipt['source_filename'], source_url=receipt['source_url'], source_page=receipt['source_page'], source_native_window_sha256=sha, source_native_window=relative, mesh_native_window_pixels=dict(row=row0,col=col0,rows=side,cols=side), native_spacing_m=80, sample_stride=1, source_crs_wkt=src.crs.to_wkt(), source_scale=src.scales[0], source_offset=src.offsets[0], units='kilometres', vertical_scale=1, height_origin_m=datum, horizontal_origin_m=[origin_x,origin_y], site_lon_lat=[-68.01460926527753,-88.5134116385092], site=[(sx-origin_x)/1000,(sy-origin_y)/1000,0], display_only=True, note='Native polar-stereographic sample centres triangulated for display. No interpolation, texture synthesis, subdivision or science solver. Lighting and camera are illustrative, not the modeled Sun. Height is relative to the central native pixel; marker identifies site plan position, not the scientific observer elevation.')
    payload=dict(side=side,vertices=vertices,provenance=provenance)
args.output.parent.mkdir(parents=True,exist_ok=True)
args.output.write_text(json.dumps(payload,separators=(',',':')),encoding='utf-8')
print(json.dumps(dict(vertices=len(vertices),height_range_m=[float(heights.min()),float(heights.max())],source_sha256=sha)))
