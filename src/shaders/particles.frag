precision highp float;
uniform vec3 uColor; uniform vec3 uAccent; uniform float uDepth;
in float vAlpha; in float vSeed; out vec4 outColor;
void main(){
  vec2 c = gl_PointCoord - 0.5; float r = length(c);
  float a = smoothstep(0.5, 0.15, r) * vAlpha;
  // a few flakes catch the lander's light (accent) only once it's dark
  float spark = step(0.985, vSeed) * uDepth;
  vec3 col = mix(uColor, uAccent, spark);
  outColor = vec4(col, a);
}
