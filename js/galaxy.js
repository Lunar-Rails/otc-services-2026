// Aurora background — pure WebGL2, no external dependencies
// Direct port of ReactBits Aurora component

const VERT = `#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const FRAG = `#version 300 es
precision highp float;

uniform float uTime;
uniform float uAmplitude;
uniform vec3 uColorStops[3];
uniform vec2 uResolution;
uniform float uBlend;

out vec4 fragColor;

vec3 permute(vec3 x) {
  return mod(((x * 34.0) + 1.0) * x, 289.0);
}

float snoise(vec2 v) {
  const vec4 C = vec4(
    0.211324865405187, 0.366025403784439,
    -0.577350269189626, 0.024390243902439
  );
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1  = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy  -= i1;
  i = mod(i, 289.0);
  vec3 p = permute(
    permute(i.y + vec3(0.0, i1.y, 1.0))
    + i.x + vec3(0.0, i1.x, 1.0)
  );
  vec3 m = max(
    0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)),
    0.0
  );
  m = m * m; m = m * m;
  vec3 x  = 2.0 * fract(p * C.www) - 1.0;
  vec3 h  = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

struct ColorStop {
  vec3  color;
  float position;
};

#define COLOR_RAMP(colors, factor, finalColor) {                           \
  int index = 0;                                                           \
  for (int i = 0; i < 2; i++) {                                            \
    ColorStop currentColor = colors[i];                                    \
    bool isInBetween = currentColor.position <= factor;                    \
    index = int(mix(float(index), float(i), float(isInBetween)));          \
  }                                                                        \
  ColorStop currentColor = colors[index];                                  \
  ColorStop nextColor    = colors[index + 1];                              \
  float range      = nextColor.position - currentColor.position;           \
  float lerpFactor = (factor - currentColor.position) / range;             \
  finalColor = mix(currentColor.color, nextColor.color, lerpFactor);       \
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;

  ColorStop colors[3];
  colors[0] = ColorStop(uColorStops[0], 0.0);
  colors[1] = ColorStop(uColorStops[1], 0.5);
  colors[2] = ColorStop(uColorStops[2], 1.0);

  vec3 rampColor;
  COLOR_RAMP(colors, uv.x, rampColor);

  float height = snoise(vec2(uv.x * 2.0 + uTime * 0.1, uTime * 0.25)) * 0.5 * uAmplitude;
  height = exp(height);
  height = (uv.y * 2.0 - height + 0.2);
  float intensity = 0.6 * height;

  float midPoint    = 0.20;
  float auroraAlpha = smoothstep(midPoint - uBlend * 0.5, midPoint + uBlend * 0.5, intensity);

  vec3 auroraColor = intensity * rampColor;
  // Pre-composite over black — prevents white blowout at high intensity
  vec3 finalColor = mix(vec3(0.0), auroraColor, auroraAlpha);
  fragColor = vec4(finalColor, 1.0);
}
`;

function hexToRgb(hex) {
  return [
    parseInt(hex.slice(1,3), 16) / 255,
    parseInt(hex.slice(3,5), 16) / 255,
    parseInt(hex.slice(5,7), 16) / 255,
  ];
}

function initAurora(container, opts = {}) {
  const colorStops = opts.colorStops || ['#20CFEA', '#497CDD', '#6D18C9'];
  const amplitude  = opts.amplitude  ?? 1.0;
  const blend      = opts.blend      ?? 0.5;
  const speed      = opts.speed      ?? 0.5;

  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;background:transparent;';
  container.appendChild(canvas);

  // Match original: alpha:true, premultipliedAlpha:true
  const gl = canvas.getContext('webgl2', { alpha: false, antialias: true });
  if (!gl) { console.warn('Aurora: WebGL2 not available'); return; }
  gl.clearColor(0, 0, 0, 1);

  function compileShader(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
      console.error('Aurora shader error:', gl.getShaderInfoLog(s));
    return s;
  }

  const prog = gl.createProgram();
  gl.attachShader(prog, compileShader(gl.VERTEX_SHADER,   VERT));
  gl.attachShader(prog, compileShader(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  gl.useProgram(prog);

  // Full-screen triangle
  const vbo = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 3,-1, -1,3]), gl.STATIC_DRAW);
  const posLoc = gl.getAttribLocation(prog, 'position');
  gl.enableVertexAttribArray(posLoc);
  gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

  const U = {};
  ['uTime','uAmplitude','uColorStops','uResolution','uBlend']
    .forEach(n => { U[n] = gl.getUniformLocation(prog, n); });

  function resize() {
    const w = container.offsetWidth, h = container.offsetHeight;
    canvas.width  = w;
    canvas.height = h;
    gl.viewport(0, 0, w, h);
    gl.uniform2f(U.uResolution, w, h);
  }
  window.addEventListener('resize', resize);
  resize();

  gl.uniform1f(U.uAmplitude, amplitude);
  gl.uniform1f(U.uBlend, blend);
  gl.uniform3fv(U.uColorStops, new Float32Array(colorStops.flatMap(hexToRgb)));

  let rafId;
  function frame(t) {
    rafId = requestAnimationFrame(frame);

    // Exact match to original React component timing:
    // const { time = t * 0.01, speed = 1.0 } = propsRef.current;
    // program.uniforms.uTime.value = time * speed * 0.1;
    const time = t * 0.01;
    gl.uniform1f(U.uTime, time * speed * 0.1);

    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  rafId = requestAnimationFrame(frame);
}

function sizeAuroraBg() {
  const bg       = document.getElementById('galaxy-bg');
  const header   = document.querySelector('header');
  const hero     = document.querySelector('.hero');
  const partners = document.getElementById('partners-section');
  if (!bg || !header || !hero || !partners) return;
  bg.style.height = (header.offsetHeight + hero.offsetHeight + partners.offsetHeight) + 'px';
}

document.addEventListener('DOMContentLoaded', () => {
  const bg = document.getElementById('galaxy-bg');
  if (!bg) return;

  sizeAuroraBg();
  window.addEventListener('resize', sizeAuroraBg);

  initAurora(bg, {
    colorStops: ['#20CFEA', '#497CDD', '#6D18C9'],
    amplitude:  1.0,
    blend:      0.5,
    speed:      0.5,
  });
});
