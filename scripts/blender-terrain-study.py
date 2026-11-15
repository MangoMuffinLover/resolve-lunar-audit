"""Run in Blender background mode after prepare-terrain-study.py."""
import argparse, hashlib, json, math, struct, sys
from pathlib import Path
import bpy
from mathutils import Vector

parser=argparse.ArgumentParser()
parser.add_argument('--input',required=True,type=Path)
parser.add_argument('--public-root',required=True,type=Path)
parser.add_argument('--blend',required=True,type=Path)
args=parser.parse_args(sys.argv[sys.argv.index('--')+1:])
args.public_root=args.public_root.resolve()
args.blend=args.blend.resolve()
payload=json.loads(args.input.read_text(encoding='utf-8'))
vertices=payload['vertices']; n=payload['side']; faces=[]
for r in range(n-1):
    for c in range(n-1):
        a=r*n+c; b=a+1; d=a+n; e=d+1
        faces.extend([(a,d,b),(b,d,e)])
# Square physical sample boundary; skirts only close the model at its outer edge.
edge=list(range(n))+[r*n+n-1 for r in range(1,n)]+list(range(n*n-2,n*(n-1)-1,-1))+[r*n for r in range(n-2,0,-1)]
base=min(v[2] for v in vertices)-0.25
first=len(vertices)
for i in edge:
    x,y,_=vertices[i]; vertices.append([x,y,base])
for j,a in enumerate(edge):
    k=(j+1)%len(edge); b=edge[k]
    faces.extend([(a,first+j,b),(b,first+j,first+k)])
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
mesh=bpy.data.meshes.new('NASA Product 90 / native 80m sample centres')
mesh.from_pydata(vertices,[],faces); mesh.update()
terrain=bpy.data.objects.new('dGR101 / 12.8 km native terrain study',mesh)
bpy.context.collection.objects.link(terrain)
for polygon in mesh.polygons:
    polygon.use_smooth=polygon.index < (n-1)*(n-1)*2
mat=bpy.data.materials.new('Neutral lunar material / no synthesized detail');mat.diffuse_color=(0.34,0.36,0.35,1);mat.use_nodes=True
bsdf=mat.node_tree.nodes.get('Principled BSDF');bsdf.inputs['Base Color'].default_value=(0.34,0.36,0.35,1);bsdf.inputs['Roughness'].default_value=0.94
# Measured-height contour ink, derived from mesh coordinates; no displacement or invented texture.
nodes=mat.node_tree.nodes; links=mat.node_tree.links
geometry=nodes.new('ShaderNodeNewGeometry'); separate=nodes.new('ShaderNodeSeparateXYZ')
links.new(geometry.outputs['Position'],separate.inputs[0])
datum=nodes.new('ShaderNodeMath');datum.operation='ADD';datum.inputs[1].default_value=payload['provenance']['height_origin_m']/1000+10
links.new(separate.outputs['Z'],datum.inputs[0])
modulo=nodes.new('ShaderNodeMath');modulo.operation='MODULO';modulo.inputs[1].default_value=0.25
links.new(datum.outputs[0],modulo.inputs[0])
band=nodes.new('ShaderNodeMath');band.operation='LESS_THAN';band.inputs[1].default_value=0.004
links.new(modulo.outputs[0],band.inputs[0])
mix=nodes.new('ShaderNodeMixRGB');mix.blend_type='MIX';mix.inputs[1].default_value=(0.38,0.43,0.50,1);mix.inputs[2].default_value=(0.12,0.19,0.25,1)
links.new(band.outputs[0],mix.inputs[0]);links.new(mix.outputs[0],bsdf.inputs['Base Color'])
terrain.data.materials.append(mat)
cut=bpy.data.materials.new('Sample boundary / display-only closure');cut.use_nodes=True
cut.node_tree.nodes.get('Principled BSDF').inputs['Base Color'].default_value=(0.065,0.09,0.13,1)
cut.node_tree.nodes.get('Principled BSDF').inputs['Roughness'].default_value=0.9
terrain.data.materials.append(cut)
for polygon in mesh.polygons:
    if polygon.index >= (n-1)*(n-1)*2: polygon.material_index=1
# Site pin is a cartographic display marker, not a scientific observer elevation.
sx,sy,sz=payload['provenance']['site']
gold=bpy.data.materials.new('Site marker / muted brass');gold.diffuse_color=(0.9,0.52,0.12,1);gold.use_nodes=True
gold_bsdf=gold.node_tree.nodes.get('Principled BSDF');gold_bsdf.inputs['Base Color'].default_value=(0.9,0.52,0.12,1);gold_bsdf.inputs['Emission Color'].default_value=(1,0.55,0.15,1);gold_bsdf.inputs['Emission Strength'].default_value=0.6
bpy.ops.mesh.primitive_cylinder_add(vertices=12,radius=0.035,depth=0.58,location=(sx,sy,sz+0.31))
bpy.context.object.data.materials.append(gold)
bpy.ops.mesh.primitive_uv_sphere_add(segments=16,ring_count=8,radius=0.11,location=(sx,sy,sz+0.60))
bpy.context.object.data.materials.append(gold)
folder=args.public_root/'visuals'/'terrain';folder.mkdir(parents=True,exist_ok=True)
binary=bytearray()
for v in mesh.vertices:
    binary.extend(struct.pack('<6f',*v.co,*v.normal))
vertex_bytes=len(binary)
for face in faces:
    binary.extend(struct.pack('<3H',*face))
(folder/'dgr101-native80.bin').write_bytes(binary)
provenance=payload['provenance']
provenance.update(blender_version=bpy.app.version_string,mesh_vertices=len(mesh.vertices),mesh_triangles=len(faces),surface_vertices=n*n,surface_triangles=(n-1)*(n-1)*2,edge_skirts='Display-only vertical perimeter closure, excluded from scientific interpretation',binary=dict(href='/visuals/terrain/dgr101-native80.bin',bytes=len(binary),sha256=hashlib.sha256(binary).hexdigest(),vertex_bytes=vertex_bytes,vertex_stride_floats=6,indices_count=len(faces)*3,index_type='uint16'),poster='/visuals/terrain/dgr101-native80.webp')
(folder/'provenance.json').write_text(json.dumps(provenance,indent=2)+'\n',encoding='utf-8')
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=64;scene.cycles.use_denoising=False
scene.render.resolution_x=1600;scene.render.resolution_y=1000;scene.render.resolution_percentage=100
scene.world.color=(0.08,0.08,0.08)
world=scene.world;world.use_nodes=True;world.node_tree.nodes['Background'].inputs[0].default_value=(0.18,0.25,0.36,1);world.node_tree.nodes['Background'].inputs[1].default_value=0.25
bpy.ops.object.light_add(type='SUN',location=(0,0,10));light=bpy.context.object;light.rotation_euler=(math.radians(65),math.radians(-20),math.radians(-50));light.data.energy=3.2;light.data.angle=math.radians(1.2)
bpy.ops.object.camera_add(location=(10,-15,14));camera=bpy.context.object;camera.rotation_euler=(Vector((0,0,-0.5))-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.type='ORTHO';camera.data.ortho_scale=24;scene.camera=camera
# A camera-facing map label and measured 4 km map-plane ruler belong to the display layer.
ink=bpy.data.materials.new('Atlas label / emission');ink.use_nodes=True
ink_bsdf=ink.node_tree.nodes.get('Principled BSDF');ink_bsdf.inputs['Base Color'].default_value=(0.8,0.9,1,1);ink_bsdf.inputs['Emission Color'].default_value=(0.8,0.9,1,1);ink_bsdf.inputs['Emission Strength'].default_value=0.7
def label(text,position,size,material=ink):
    curve=bpy.data.curves.new(text,'FONT');curve.body=text;curve.size=size;curve.align_x='CENTER';curve.align_y='CENTER'
    obj=bpy.data.objects.new(text,curve);bpy.context.collection.objects.link(obj);obj.location=position;obj.rotation_euler=camera.rotation_euler;obj.data.materials.append(material)
label('dGR101',(sx,sy,sz+1.1),0.27,gold)
def stroke(name,points,material=ink):
    curve=bpy.data.curves.new(name,'CURVE');curve.dimensions='3D';curve.bevel_depth=0.012;curve.bevel_resolution=2
    line=curve.splines.new('POLY');line.points.add(len(points)-1)
    for point,co in zip(line.points,points):point.co=(*co,1)
    obj=bpy.data.objects.new(name,curve);bpy.context.collection.objects.link(obj);obj.data.materials.append(material)
stroke('4 km in native map plane',[(-5,-7,base),(-1,-7,base)])
for tick in [-5,-3,-1]:stroke('Scale tick',[(tick,-7,base-.08),(tick,-7,base+.08)])
label('4 km',(-3,-7,base-.42),0.28)
provenance['cartography']=dict(contour_interval_m=250,contour_datum='Radial height above 1737400 m reference sphere',contours='Display contours of the triangulated native mesh; not additional measurements',ruler='4 km in the native map plane; displayed in perspective',lighting='Grazing illustrative light; not the modeled Sun',render_samples=64)
(folder/'provenance.json').write_text(json.dumps(provenance,indent=2)+'\n',encoding='utf-8')
scene.render.film_transparent=True;scene.render.image_settings.file_format='PNG';scene.render.filepath=str(folder/'poster.png')
scene.view_settings.view_transform='AgX'
args.blend.parent.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=str(args.blend))
bpy.ops.render.render(write_still=True)
print(json.dumps(dict(blender=bpy.app.version_string,vertices=len(vertices),triangles=len(faces),binary_bytes=len(binary))))
