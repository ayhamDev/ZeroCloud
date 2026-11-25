import downloadsFragment from '../shaders/downloads.frag?raw';

export type FieldVariant = 'light' | 'dark' | 'downloads' | 'footer';
export type FieldMessage =
  | { surface: OffscreenCanvas; variant: FieldVariant }
  | { width: number; height: number; phase: number };

type Frame = Extract<FieldMessage, { phase: number }>;
let draw: ((frame: Frame) => void) | undefined;
let painted = false;

self.onmessage = ({ data }: MessageEvent<FieldMessage>) => {
  if ('surface' in data) {
    draw = createRenderer(data.surface, data.variant);
    if (!draw) self.postMessage('fallback');
    return;
  }
  if (!draw) return;
  draw(data);
  if (!painted) {
    painted = true;
    self.postMessage('painted');
  }
};

function createRenderer(canvas: OffscreenCanvas, variant: FieldVariant) {
  const gl = canvas.getContext('webgl', {
    alpha: false,
    antialias: false,
    depth: false,
    failIfMajorPerformanceCaveat: true,
    powerPreference: 'low-power',
    preserveDrawingBuffer: false,
  });
  if (!gl) return;
  const vertex = 'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}';
  const fragment =
    variant === 'downloads' || variant === 'footer'
      ? downloadsFragment
      : `precision mediump float;
  uniform vec2 res;uniform float phase;uniform float dark;
  float grain(vec2 p){vec3 q=fract(vec3(p.xyx)*.1031);q+=dot(q,q.yzx+33.33);return fract((q.x+q.y)*q.z);}
  void main(){
    vec2 uv=gl_FragCoord.xy/res;
    float sweep=uv.y-.18-.58*uv.x-.16*sin(4.2*uv.x+phase);
    float band=exp(-6.0*abs(sweep)) * smoothstep(.17,.99,uv.x);
    float edge=exp(-20.0*abs(sweep-.18))*smoothstep(.28,1.,uv.x);
    vec3 light=mix(vec3(.962,.97,.956),vec3(.77,.87,.82),smoothstep(.1,1.,uv.x)*.68);
    light=mix(light,vec3(.65,.83,.74),band*.65)+edge*.075;
    vec3 deep=mix(vec3(.075,.093,.088),vec3(.16,.23,.20),uv.x);
    deep=mix(deep,vec3(.25,.37,.32),band*.65)+edge*.035;
    vec3 color=mix(light,deep,dark)+(grain(gl_FragCoord.xy)-.5)*.023;
    gl_FragColor=vec4(color,1.);
  }`;
  function compile(type: number, source: string) {
    if (!gl) return null;
    const shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }
  const vs = compile(gl.VERTEX_SHADER, vertex),
    fs = compile(gl.FRAGMENT_SHADER, fragment);
  const program = gl.createProgram();
  if (!vs || !fs || !program) return;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
  gl.useProgram(program);
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const attribute = gl.getAttribLocation(program, 'a');
  gl.enableVertexAttribArray(attribute);
  gl.vertexAttribPointer(attribute, 2, gl.FLOAT, false, 0, 0);
  const res = gl.getUniformLocation(program, 'res'),
    phase = gl.getUniformLocation(program, 'phase');
  gl.uniform1f(gl.getUniformLocation(program, 'dark'), variant === 'dark' ? 1 : 0);
  canvas.addEventListener('webglcontextlost', () => self.postMessage('fallback'));
  return (frame: Frame) => {
    if (canvas.width !== frame.width || canvas.height !== frame.height) {
      canvas.width = frame.width;
      canvas.height = frame.height;
    }
    gl.viewport(0, 0, frame.width, frame.height);
    gl.uniform2f(res, frame.width, frame.height);
    gl.uniform1f(phase, frame.phase);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };
}
