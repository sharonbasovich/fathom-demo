precision highp float;
uniform sampler2D uPos;      // xyz = position, w = life
uniform float uTime; uniform float uDt; uniform float uDepth;
uniform vec2 uPointer; uniform vec2 uPointerVel; uniform float uAspect;
uniform vec3 uPing;          // xy = origin (world units), z = seconds since ping (negative = none)
in vec2 vUv; out vec4 outColor;

// simplex-ish 3D noise (iq) → curl
vec3 hash3(vec3 p){ p = vec3(dot(p,vec3(127.1,311.7,74.7)), dot(p,vec3(269.5,183.3,246.1)), dot(p,vec3(113.5,271.9,124.6))); return -1.0 + 2.0*fract(sin(p)*43758.5453123); }
float noise(vec3 p){ vec3 i = floor(p); vec3 f = fract(p); vec3 u = f*f*(3.0-2.0*f);
  return mix(mix(mix(dot(hash3(i+vec3(0,0,0)),f-vec3(0,0,0)), dot(hash3(i+vec3(1,0,0)),f-vec3(1,0,0)),u.x),
                 mix(dot(hash3(i+vec3(0,1,0)),f-vec3(0,1,0)), dot(hash3(i+vec3(1,1,0)),f-vec3(1,1,0)),u.x),u.y),
             mix(mix(dot(hash3(i+vec3(0,0,1)),f-vec3(0,0,1)), dot(hash3(i+vec3(1,0,1)),f-vec3(1,0,1)),u.x),
                 mix(dot(hash3(i+vec3(0,1,1)),f-vec3(0,1,1)), dot(hash3(i+vec3(1,1,1)),f-vec3(1,1,1)),u.x),u.y),u.z); }
vec3 curl(vec3 p){ float e = 0.1;
  float n1 = noise(p + vec3(0,e,0)), n2 = noise(p - vec3(0,e,0)), n3 = noise(p + vec3(0,0,e)), n4 = noise(p - vec3(0,0,e));
  float n5 = noise(p + vec3(e,0,0)), n6 = noise(p - vec3(e,0,0));
  float x = (n1 - n2) - (n3 - n4); float y = (n3 - n4) - (n5 - n6); float z = (n5 - n6) - (n1 - n2);
  return normalize(vec3(x, y, z) + 1e-5); }

void main(){
  vec4 p = texture(uPos, vUv);
  vec3 pos = p.xyz; float life = p.w;
  float slow = mix(1.0, 0.35, uDepth);               // deep water is still water
  vec3 flow = curl(pos * 0.35 + vec3(0.0, uTime * 0.03, uTime * 0.02)) * 0.12 * slow;
  flow.y -= 0.05 * slow + 0.02;                         // marine snow sinks
  // cursor current: push particles along pointer velocity, falloff by distance in screen-ish space
  vec2 d = vec2((pos.x - uPointer.x) / uAspect, pos.y - uPointer.y);
  float r = length(d);
  float infl = exp(-r * r * 6.0);
  flow.xy += uPointerVel * infl * 2.4;
  flow.xy += normalize(d + 1e-4) * infl * 0.25;        // slight outward displacement like water parting
  if (uPing.z >= 0.0) {
    vec2 pd = vec2((pos.x - uPing.x) / uAspect, pos.y - uPing.y);
    float pr = length(pd);
    float ring = uPing.z * 1.1;                          // ring radius grows ~1.1 units/s
    float band = exp(-pow((pr - ring) / 0.07, 2.0)) * exp(-uPing.z * 1.4);
    flow.xy += normalize(pd + 1e-4) * band * 0.9;
  }
  pos += flow * uDt * 60.0 * 0.016;
  life -= uDt * 0.05;
  // respawn / wrap
  if (pos.y < -1.15 || life <= 0.0) { vec3 h = hash3(vec3(vUv * 913.0, uTime)); pos = vec3(h.x * uAspect * 1.1, 1.15, h.z * 0.5); life = 1.0 + 0.5 * h.y; }
  if (pos.x > uAspect * 1.15) pos.x -= uAspect * 2.3; if (pos.x < -uAspect * 1.15) pos.x += uAspect * 2.3;
  outColor = vec4(pos, life);
}
