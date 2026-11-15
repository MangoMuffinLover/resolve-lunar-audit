// Display-only WebGL viewer. Source vertices and normals are authored in Blender.
export interface TerrainMesh {
  site: number[];
  surface_triangles: number;
  binary: {
    href: string;
    bytes: number;
    sha256: string;
    vertex_bytes: number;
    indices_count: number;
  };
}
export type TerrainView = 'oblique' | 'rim' | 'overhead';
const cameras: Record<TerrainView, [number, number]> = {
  oblique: [-0.9, 0.72],
  rim: [-1.45, 0.3],
  overhead: [-Math.PI / 2, 1.54],
};
const normalize = (v: number[]) => {
  const length = Math.hypot(...v);
  return v.map((n) => n / length);
};
const cross = (a: number[], b: number[]) => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const dot = (a: number[], b: number[]) => a.reduce((sum, n, i) => sum + n * b[i], 0);
function multiply(a: number[], b: number[]) {
  const out = Array(16).fill(0);
  for (let c = 0; c < 4; c++)
    for (let r = 0; r < 4; r++)
      for (let k = 0; k < 4; k++) out[c * 4 + r] += a[k * 4 + r] * b[c * 4 + k];
  return new Float32Array(out);
}
export async function mountTerrain(
  canvas: HTMLCanvasElement,
  mesh: TerrainMesh,
  signal: AbortSignal,
  onProject?: (x: number, y: number) => void,
) {
  const response = await fetch(mesh.binary.href, { signal });
  if (!response.ok) throw new Error('Terrain asset unavailable');
  const bytes = await response.arrayBuffer();
  const digest = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), (b) =>
    b.toString(16).padStart(2, '0'),
  ).join('');
  if (bytes.byteLength !== mesh.binary.bytes || digest !== mesh.binary.sha256)
    throw new Error('Terrain asset verification failed');
  if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
  const gl = canvas.getContext('webgl', {
    antialias: true,
    alpha: false,
    preserveDrawingBuffer: false,
  });
  if (!gl) throw new Error('3D rendering is unavailable');
  const derivatives = gl.getExtension('OES_standard_derivatives');
  function shader(type: number, source: string) {
    const item = gl!.createShader(type)!;
    gl!.shaderSource(item, source);
    gl!.compileShader(item);
    if (!gl!.getShaderParameter(item, gl!.COMPILE_STATUS)) {
      gl!.deleteShader(item);
      throw new Error('3D shader unavailable');
    }
    return item;
  }
  const vertex = shader(
    gl.VERTEX_SHADER,
    `attribute vec3 position; attribute vec3 normal; uniform mat4 matrix; varying vec3 surfaceNormal; varying float height; void main(){surfaceNormal=normal;height=position.z;gl_Position=matrix*vec4(position,1.0);}`,
  );
  const fragment = shader(
    gl.FRAGMENT_SHADER,
    `${derivatives ? '#extension GL_OES_standard_derivatives : enable\n' : ''}
    precision highp float;
    varying vec3 surfaceNormal; varying float height; uniform float marker;
    void main(){
      vec3 n=normalize(surfaceNormal);
      float diffuse=max(0.0,dot(n,normalize(vec3(-0.75,-0.5,0.38))));
      float width=${derivatives ? 'max(0.002,fwidth(height)*1.15)' : '0.012'};
      float distance=abs(fract((height+1.532495605)/0.25+0.5)-0.5)*0.25;
      float contour=1.0-smoothstep(0.0,width,distance);
      vec3 stone=vec3(0.47,0.50,0.54)*(0.18+diffuse*1.15);
      stone=mix(stone,vec3(0.12,0.21,0.28),contour*0.65);
      vec3 color=sqrt(stone);
      if(marker>1.5) color=vec3(0.12,0.17,0.23)*(0.6+diffuse*0.5);
      else if(marker>0.5) color=vec3(1.0,0.76,0.35);
      gl_FragColor=vec4(color,1.0);
    }`,
  );
  const program = gl.createProgram()!;
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error('3D program unavailable');
  const vertices = gl.createBuffer(),
    indices = gl.createBuffer(),
    pin = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertices);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array(bytes, 0, mesh.binary.vertex_bytes / 4),
    gl.STATIC_DRAW,
  );
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indices);
  gl.bufferData(
    gl.ELEMENT_ARRAY_BUFFER,
    new Uint16Array(bytes, mesh.binary.vertex_bytes),
    gl.STATIC_DRAW,
  );
  const [x, y, z] = mesh.site;
  gl.bindBuffer(gl.ARRAY_BUFFER, pin);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([
      x,
      y,
      z + 0.04,
      0,
      0,
      1,
      x,
      y,
      z + 0.6,
      0,
      0,
      1,
      x - 0.14,
      y,
      z + 0.6,
      0,
      0,
      1,
      x + 0.14,
      y,
      z + 0.6,
      0,
      0,
      1,
      x,
      y - 0.14,
      z + 0.6,
      0,
      0,
      1,
      x,
      y + 0.14,
      z + 0.6,
      0,
      0,
      1,
    ]),
    gl.STATIC_DRAW,
  );
  const pos = gl.getAttribLocation(program, 'position'),
    normal = gl.getAttribLocation(program, 'normal'),
    matrix = gl.getUniformLocation(program, 'matrix'),
    marker = gl.getUniformLocation(program, 'marker');
  gl.useProgram(program);
  gl.enable(gl.DEPTH_TEST);
  gl.enableVertexAttribArray(pos);
  gl.enableVertexAttribArray(normal);
  let camera = cameras.oblique.slice(),
    frame = 0,
    destroyed = false;
  function draw() {
    if (destroyed || gl!.isContextLost()) return;
    const ratio = Math.min(devicePixelRatio || 1, 1.75),
      w = Math.round(canvas.clientWidth * ratio),
      h = Math.round(canvas.clientHeight * ratio);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    gl!.viewport(0, 0, w, h);
    gl!.clearColor(0.035, 0.055, 0.085, 1);
    gl!.clear(gl!.COLOR_BUFFER_BIT | gl!.DEPTH_BUFFER_BIT);
    const [yaw, pitch] = camera,
      radius = 28,
      target = [0, 0, -0.65],
      eye = [
        radius * Math.cos(pitch) * Math.cos(yaw),
        radius * Math.cos(pitch) * Math.sin(yaw),
        radius * Math.sin(pitch) - 0.65,
      ];
    const zz = normalize(eye.map((v, i) => v - target[i])),
      xx = normalize(cross([0, 0, 1], zz)),
      yy = cross(zz, xx);
    const view = [
      xx[0],
      yy[0],
      zz[0],
      0,
      xx[1],
      yy[1],
      zz[1],
      0,
      xx[2],
      yy[2],
      zz[2],
      0,
      -dot(xx, eye),
      -dot(yy, eye),
      -dot(zz, eye),
      1,
    ];
    const half = Math.max(7.6, 10.5 / (w / h)),
      aspect = w / h,
      near = 0.1,
      far = 80;
    const projection = [
      1 / (half * aspect),
      0,
      0,
      0,
      0,
      1 / half,
      0,
      0,
      0,
      0,
      -2 / (far - near),
      0,
      0,
      0,
      -(far + near) / (far - near),
      1,
    ];
    const transform = multiply(projection, view);
    gl!.uniformMatrix4fv(matrix, false, transform);
    const project = (row: number) =>
      transform[row] * x +
      transform[4 + row] * y +
      transform[8 + row] * (z + 0.6) +
      transform[12 + row];
    onProject?.((project(0) + 1) * 50, (1 - project(1)) * 50);
    gl!.bindBuffer(gl!.ARRAY_BUFFER, vertices);
    gl!.vertexAttribPointer(pos, 3, gl!.FLOAT, false, 24, 0);
    gl!.vertexAttribPointer(normal, 3, gl!.FLOAT, false, 24, 12);
    gl!.uniform1f(marker, 0);
    gl!.bindBuffer(gl!.ELEMENT_ARRAY_BUFFER, indices);
    const surfaceIndices = mesh.surface_triangles * 3;
    gl!.drawElements(gl!.TRIANGLES, surfaceIndices, gl!.UNSIGNED_SHORT, 0);
    gl!.uniform1f(marker, 2);
    gl!.drawElements(
      gl!.TRIANGLES,
      mesh.binary.indices_count - surfaceIndices,
      gl!.UNSIGNED_SHORT,
      surfaceIndices * 2,
    );
    gl!.bindBuffer(gl!.ARRAY_BUFFER, pin);
    gl!.vertexAttribPointer(pos, 3, gl!.FLOAT, false, 24, 0);
    gl!.vertexAttribPointer(normal, 3, gl!.FLOAT, false, 24, 12);
    gl!.uniform1f(marker, 1);
    gl!.drawArrays(gl!.LINES, 0, 6);
  }
  const resize = new ResizeObserver(draw);
  resize.observe(canvas);
  draw();
  return {
    move(view: TerrainView, done: () => void) {
      cancelAnimationFrame(frame);
      const from = camera.slice(),
        to = cameras[view],
        start = performance.now();
      const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
      function tick(now: number) {
        if (destroyed) return;
        const progress = reduced ? 1 : Math.min(1, (now - start) / 2600),
          ease = (1 - Math.cos(progress * Math.PI)) / 2;
        camera = from.map((v, i) => v + (to[i] - v) * ease);
        draw();
        if (progress < 1) frame = requestAnimationFrame(tick);
        else done();
      }
      frame = requestAnimationFrame(tick);
    },
    destroy() {
      destroyed = true;
      cancelAnimationFrame(frame);
      resize.disconnect();
      [vertices, indices, pin].forEach((buffer) => gl!.deleteBuffer(buffer));
      gl!.deleteProgram(program);
      gl!.deleteShader(vertex);
      gl!.deleteShader(fragment);
    },
  };
}
