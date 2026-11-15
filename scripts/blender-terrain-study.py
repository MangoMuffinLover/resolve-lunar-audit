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
terrain.data.materials.append(mat)
# Site pin is a cartographic display marker, not a scientific observer elevation.
sx,sy,sz=payload['provenance']['site']
gold=bpy.data.materials.new('Site marker / muted brass');gold.diffuse_color=(0.62,0.37,0.14,1)
bpy.ops.mesh.primitive_cylinder_add(vertices=12,radius=0.027,depth=0.58,location=(sx,sy,sz+0.31))
bpy.context.object.data.materials.append(gold)
bpy.ops.mesh.primitive_uv_sphere_add(segments=16,ring_count=8,radius=0.10,location=(sx,sy,sz+0.60))
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
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=24;scene.cycles.use_denoising=True
scene.render.resolution_x=1400;scene.render.resolution_y=900;scene.render.resolution_percentage=100
scene.world.color=(0.08,0.08,0.08)
world=scene.world;world.use_nodes=True;world.node_tree.nodes['Background'].inputs[0].default_value=(0.12,0.15,0.16,1);world.node_tree.nodes['Background'].inputs[1].default_value=0.4
bpy.ops.object.light_add(type='SUN',location=(0,0,10));light=bpy.context.object;light.rotation_euler=(math.radians(45),math.radians(-30),math.radians(-45));light.data.energy=2.1;light.data.angle=math.radians(2)
bpy.ops.object.camera_add(location=(10,-15,14));camera=bpy.context.object;camera.rotation_euler=(Vector((0,0,-0.3))-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.type='ORTHO';camera.data.ortho_scale=24;scene.camera=camera
scene.render.film_transparent=True;scene.render.image_settings.file_format='PNG';scene.render.filepath=str(folder/'poster.png')
scene.view_settings.view_transform='AgX'
args.blend.parent.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=str(args.blend))
bpy.ops.render.render(write_still=True)
print(json.dumps(dict(blender=bpy.app.version_string,vertices=len(vertices),triangles=len(faces),binary_bytes=len(binary))))
