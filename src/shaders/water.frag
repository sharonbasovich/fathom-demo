precision highp float;
uniform float uTime; uniform float uDepth; uniform vec2 uRes; uniform vec3 uTop; uniform vec3 uBottom; uniform vec3 uDeep; uniform vec3 uPing; uniform vec3 uAccent;
in vec2 vUv; out vec4 outColor;
float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
void main(){
  vec2 uv = vUv;
  // the water column: a vertical gradient whose exposure falls with depth; faint caustic bands near the surface only
  float light = 1.0 - uDepth;
  // the ground must already be dark when the DOM flips to pale type (~20% through the descent), so darken early and steeply
  float dark = smoothstep(0.06, 0.3, uDepth);
  vec3 a = mix(uTop, uDeep, dark);
  vec3 b = mix(uBottom, uDeep, smoothstep(0.0, 0.22, uDepth));
  vec3 col = mix(b, a, pow(uv.y, 1.6));
  float caustic = sin(uv.x * 9.0 + uTime * 0.6 + sin(uv.y * 5.0 + uTime * 0.4) * 1.5) * sin(uv.y * 7.0 - uTime * 0.5);
  col += caustic * 0.03 * light * light * smoothstep(0.3, 1.0, uv.y);
  // vignette toward the edges, slightly stronger when dark
  float v = smoothstep(1.2, 0.35, length((uv - 0.5) * vec2(uRes.x / uRes.y, 1.0)));
  col *= mix(1.0, v, 0.25 + 0.35 * uDepth);
  if (uPing.z >= 0.0) {                                 // the sonar ring itself: a thin band, accent-tinted, fading with time
    float aspect = uRes.x / uRes.y;
    vec2 pd = vec2((uv.x * 2.0 - 1.0) * aspect - uPing.x, (uv.y * 2.0 - 1.0) - uPing.y) / vec2(aspect, 1.0);
    float pr = length(pd); float ring = uPing.z * 1.1;
    float band = exp(-pow((pr - ring) / 0.012, 2.0)) * exp(-uPing.z * 1.6);
    col = mix(col, uAccent, band * 0.55);
  }
  col += (hash(uv * uRes + uTime) - 0.5) * 0.012;      // dither to kill banding
  outColor = vec4(col, 1.0);
}
