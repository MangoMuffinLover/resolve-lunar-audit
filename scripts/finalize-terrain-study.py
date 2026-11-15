"""Compress the Blender poster and freeze the display asset's file references."""
from pathlib import Path
import hashlib, json
from PIL import Image

root=Path.cwd()
folder=root/'public/visuals/terrain'
image=Image.open(folder/'poster.png')
image.save(folder/'dgr101-native80.webp','WEBP',quality=90,method=6)
def ref(path):
    raw=path.read_bytes()
    return dict(href='/'+path.relative_to(root/'public').as_posix(),bytes=len(raw),sha256=hashlib.sha256(raw).hexdigest())
path=folder/'provenance.json'
provenance=json.loads(path.read_text(encoding='utf-8'))
provenance['note']=provenance['note'].replace('central native pixel','native pixel containing the site')
provenance['poster_file']=ref(folder/'dgr101-native80.webp')
path.write_text(json.dumps(provenance,indent=2)+'\n',encoding='utf-8',newline='\n')
(root/'src/visuals/terrain.json').write_text(json.dumps(ref(path))+'\n',encoding='utf-8',newline='\n')
(folder/'poster.png').unlink()
print(json.dumps(dict(poster=provenance['poster_file'],mesh=provenance['binary'])))
