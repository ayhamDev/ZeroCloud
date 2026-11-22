#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform vec2 res;
uniform float phase;

float grain(vec2 point) {
  vec3 seed = fract(vec3(point.xyx) * 0.1031);
  seed += dot(seed, seed.yzx + 33.33);
  return fract((seed.x + seed.y) * seed.z);
}

float valueNoise(vec2 point) {
  vec2 cell = floor(point);
  vec2 weight = fract(point);
  weight = weight * weight * (3.0 - 2.0 * weight);
  float lower = mix(grain(cell), grain(cell + vec2(1.0, 0.0)), weight.x);
  float upper = mix(grain(cell + vec2(0.0, 1.0)), grain(cell + vec2(1.0, 1.0)), weight.x);
  return mix(lower, upper, weight.y);
}

void main() {
  vec2 uv = gl_FragCoord.xy / res;
  vec2 field = uv * vec2(3.2, 1.7) + vec2(phase * 0.58, -phase * 0.26);
  float broad = valueNoise(field);
  float curl = valueNoise(field * 2.65 + vec2(broad * 2.1, broad + 3.7));
  float mist = mix(broad, curl, 0.32);
  float crest = 0.14 + 0.4 * uv.x + 0.12 * sin(5.0 * uv.x + phase) + (mist - 0.5) * 0.66;
  float distanceToCrest = uv.y - crest;
  float wash = exp(-9.0 * distanceToCrest * distanceToCrest);
  float rim = exp(-9.0 * abs(distanceToCrest - 0.16)) * curl;
  float right = smoothstep(0.12, 0.94, uv.x);

  vec3 base = mix(vec3(0.055, 0.124, 0.089), vec3(0.105, 0.210, 0.151), right);
  vec3 color = mix(base, vec3(0.35, 0.49, 0.37), right * wash * (0.30 + 0.65 * mist));
  color += right * rim * vec3(0.04, 0.055, 0.035);
  color += (grain(gl_FragCoord.xy) - 0.5) * mix(0.025, 0.055, right);
  gl_FragColor = vec4(color, 1.0);
}
