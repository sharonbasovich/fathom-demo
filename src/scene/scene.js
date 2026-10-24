import * as THREE from "three";
import simFrag from "../shaders/sim.frag";
import particlesVert from "../shaders/particles.vert";
import particlesFrag from "../shaders/particles.frag";
import waterFrag from "../shaders/water.frag";


// THREE.Color does not parse oklch(); convert OKLCH → sRGB hex ourselves so tokens stay in one colour space.
function oklch(L, C, H) {
  const h = (H * Math.PI) / 180, a = C * Math.cos(h), b = C * Math.sin(h);
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b, m_ = L - 0.1055613458 * a - 0.0638541728 * b, s_ = L - 0.0894841775 * a - 1.2914855480 * b;
  const l = l_ ** 3, m = m_ ** 3, s = s_ ** 3;
  const r = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, bb = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;
  const c = new THREE.Color(Math.min(1, Math.max(0, r)), Math.min(1, Math.max(0, g)), Math.min(1, Math.max(0, bb)));
  return c.convertLinearToSRGB(); // raw shaders write straight to the canvas, so hand them sRGB-encoded values
}

const quadVert = /* glsl */ `precision highp float; in vec3 position; in vec2 uv; out vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position, 1.0); }`;

export function createScene(canvas, { mobile = false } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: "high-performance" });
  const dpr = Math.min(devicePixelRatio || 1, mobile ? 1.5 : 2);
  renderer.setPixelRatio(dpr);
  renderer.setSize(innerWidth, innerHeight, false);
  renderer.autoClear = false;

  const SIZE = mobile ? 80 : 144;                     // 6k / 20k particles
  const COUNT = SIZE * SIZE;
  const aspect = () => innerWidth / innerHeight;

  // ---- simulation: ping-pong float textures ----
  const rtOpts = { type: THREE.FloatType, format: THREE.RGBAFormat, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, depthBuffer: false, stencilBuffer: false };
  let rtA = new THREE.WebGLRenderTarget(SIZE, SIZE, rtOpts), rtB = new THREE.WebGLRenderTarget(SIZE, SIZE, rtOpts);
  const seed = new Float32Array(COUNT * 4);
  for (let i = 0; i < COUNT; i++) { seed[i * 4] = (Math.random() * 2 - 1) * aspect() * 1.1; seed[i * 4 + 1] = Math.random() * 2.3 - 1.15; seed[i * 4 + 2] = Math.random(); seed[i * 4 + 3] = 0.5 + Math.random(); }
  const seedTex = new THREE.DataTexture(seed, SIZE, SIZE, THREE.RGBAFormat, THREE.FloatType); seedTex.needsUpdate = true;

  const simScene = new THREE.Scene(); const simCam = new THREE.Camera();
  const simMat = new THREE.RawShaderMaterial({
    glslVersion: THREE.GLSL3, vertexShader: quadVert, fragmentShader: simFrag,
    uniforms: { uPos: { value: seedTex }, uTime: { value: 0 }, uDt: { value: 0.016 }, uDepth: { value: 0 }, uPointer: { value: new THREE.Vector2(9, 9) }, uPointerVel: { value: new THREE.Vector2() }, uAspect: { value: aspect() }, uPing: { value: new THREE.Vector3(0, 0, -1) } },
  });
  simScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), simMat));

  // ---- water column background ----
  const bgScene = new THREE.Scene();
  const bgMat = new THREE.RawShaderMaterial({
    glslVersion: THREE.GLSL3, vertexShader: quadVert, fragmentShader: waterFrag, depthTest: false, depthWrite: false,
    uniforms: { uTime: { value: 0 }, uDepth: { value: 0 }, uRes: { value: new THREE.Vector2(innerWidth, innerHeight) }, uPing: { value: new THREE.Vector3(0, 0, -1) }, uAccent: { value: oklch(0.7, 0.19, 45) },
      uTop: { value: oklch(0.97, 0.012, 220) }, uBottom: { value: oklch(0.9, 0.03, 225) }, uDeep: { value: oklch(0.13, 0.03, 250) } },
  });
  bgScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), bgMat));

  // ---- particles ----
  const geo = new THREE.BufferGeometry();
  const refs = new Float32Array(COUNT * 2); const pos = new Float32Array(COUNT * 3);
  for (let i = 0; i < COUNT; i++) { refs[i * 2] = ((i % SIZE) + 0.5) / SIZE; refs[i * 2 + 1] = (Math.floor(i / SIZE) + 0.5) / SIZE; }
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("ref", new THREE.BufferAttribute(refs, 2));
  const ptMat = new THREE.RawShaderMaterial({
    glslVersion: THREE.GLSL3, vertexShader: particlesVert, fragmentShader: particlesFrag, transparent: true, depthTest: false, depthWrite: false, blending: THREE.NormalBlending,
    uniforms: { uPos: { value: rtA.texture }, uSize: { value: mobile ? 1.6 : 2.0 }, uDpr: { value: dpr }, uDepth: { value: 0 }, uAspect: { value: aspect() },
      uColor: { value: oklch(0.45, 0.04, 240) }, uAccent: { value: oklch(0.7, 0.19, 45) } },
  });
  const ptScene = new THREE.Scene(); const ptCam = new THREE.Camera();
  const points = new THREE.Points(geo, ptMat); points.frustumCulled = false; ptScene.add(points);

  // ---- pointer (normalised clip space, lerped; velocity drives the current) ----
  const target = new THREE.Vector2(9, 9), cur = new THREE.Vector2(9, 9), prev = new THREE.Vector2(9, 9), vel = new THREE.Vector2();
  const onMove = (e) => { const x = (e.clientX / innerWidth) * 2 - 1, y = -((e.clientY / innerHeight) * 2 - 1); target.set(x * aspect(), y); };
  addEventListener("pointermove", onMove, { passive: true });
  addEventListener("pointerleave", () => target.set(9, 9));
  let pingAt = -1; const pingOrigin = new THREE.Vector2();
  addEventListener("pointerdown", (e) => {
    if (e.target.closest("a, button, input, [data-no-ping]")) return;
    pingOrigin.set(((e.clientX / innerWidth) * 2 - 1) * aspect(), -((e.clientY / innerHeight) * 2 - 1)); pingAt = time;
  });

  let resizeT; addEventListener("resize", () => { clearTimeout(resizeT); resizeT = setTimeout(() => { renderer.setSize(innerWidth, innerHeight, false); bgMat.uniforms.uRes.value.set(innerWidth, innerHeight); simMat.uniforms.uAspect.value = aspect(); ptMat.uniforms.uAspect.value = aspect(); }, 120); });

  // deep-colour particles when dark so they stay visible but quiet
  const colLight = oklch(0.45, 0.04, 240), colDark = oklch(0.7, 0.02, 230);

  let first = true; let depthS = 0; let time = 0;
  renderer.compile(bgScene, simCam); renderer.compile(ptScene, ptCam); renderer.compile(simScene, simCam);

  function render(t, dt, depth) {
    dt = Math.min(dt || 0.016, 0.05); time += dt;
    depthS += (depth - depthS) * (1 - Math.exp(-6 * dt));
    cur.lerp(target, 1 - Math.exp(-10 * dt));
    vel.subVectors(cur, prev).multiplyScalar(1 / Math.max(dt, 1e-3) / 60); prev.copy(cur);

    simMat.uniforms.uTime.value = time; simMat.uniforms.uDt.value = dt; simMat.uniforms.uDepth.value = depthS;
    simMat.uniforms.uPointer.value.copy(cur); simMat.uniforms.uPointerVel.value.copy(vel.clampLength(0, 0.6));
    const pingT = pingAt < 0 || time - pingAt > 3 ? -1 : time - pingAt;
    simMat.uniforms.uPing.value.set(pingOrigin.x, pingOrigin.y, pingT); bgMat.uniforms.uPing.value.copy(simMat.uniforms.uPing.value);
    simMat.uniforms.uPos.value = first ? seedTex : rtA.texture;
    renderer.setRenderTarget(rtB); renderer.render(simScene, simCam); renderer.setRenderTarget(null);
    [rtA, rtB] = [rtB, rtA]; first = false;

    bgMat.uniforms.uTime.value = time; bgMat.uniforms.uDepth.value = depthS;
    ptMat.uniforms.uPos.value = rtA.texture; ptMat.uniforms.uDepth.value = depthS;
    ptMat.uniforms.uColor.value.lerpColors(colLight, colDark, THREE.MathUtils.smoothstep(depthS, 0.15, 0.35));
    renderer.clear(); renderer.render(bgScene, simCam); renderer.render(ptScene, ptCam);
  }
  return { render, renderer, dispose() { renderer.dispose(); rtA.dispose(); rtB.dispose(); } };
}
