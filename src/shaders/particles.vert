precision highp float;
uniform sampler2D uPos; uniform float uSize; uniform float uDpr; uniform float uDepth; uniform float uAspect;
in vec2 ref;                       // texel reference into the position texture
out float vAlpha; out float vSeed;
float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
void main(){
  vec4 p = texture(uPos, ref);
  vec3 pos = p.xyz;
  vSeed = hash(ref);
  float depthFade = smoothstep(1.2, -1.2, pos.y);      // lower = further down the column
  vAlpha = (0.35 + 0.65 * vSeed) * mix(0.32, 0.7, uDepth) * smoothstep(0.0, 0.08, p.w);
  gl_Position = vec4(pos.x / uAspect, pos.y, 0.0, 1.0);   // world x spans ±aspect, clip spans ±1
  float sz = uSize * (0.6 + 0.9 * vSeed) * mix(1.0, 1.5, pos.z) * uDpr;
  gl_PointSize = sz;
}
