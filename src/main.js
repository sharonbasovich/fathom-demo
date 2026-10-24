import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { paintBathymetry } from "./scene/bathymetry.js";

gsap.registerPlugin(ScrollTrigger);
ScrollTrigger.config({ ignoreMobileResize: true });

const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const isMobile = matchMedia("(max-width: 820px)").matches;
const root = document.documentElement;

const state = { depth: 0, scene: null };

// ---------- smooth scroll: one loop (GSAP ticker drives Lenis) ----------
let lenis = null;
if (!reduce) {
  lenis = new Lenis({ duration: 1.15, smoothWheel: true, syncTouch: false });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}
window.__lenis = lenis; // QA hook: lets headless capture jump without fighting the smoother
document.querySelectorAll('a[href^="#"]').forEach((a) =>
  a.addEventListener("click", (e) => {
    const el = document.querySelector(a.getAttribute("href"));
    if (!el) return;
    e.preventDefault();
    lenis ? lenis.scrollTo(el, { offset: 0 }) : el.scrollIntoView();
  })
);

// ---------- scene ----------
const canvas = document.getElementById("gl");
const gl2 = canvas.getContext("webgl2") ? true : false;
if (gl2 && !reduce) {
  import("./scene/scene.js").then(({ createScene }) => {        // three.js is its own chunk; copy and layout never wait for it
    state.scene = createScene(canvas, { mobile: isMobile });
    gsap.ticker.add((t, dt) => state.scene.render(t, dt / 1000, state.depth));
  });
} else {
  canvas.remove();
}

// ---------- expedition tiles: procedural bathymetry textures ----------
document.querySelectorAll(".tile__media").forEach((el) => {
  const c = document.createElement("canvas");
  c.width = 640; c.height = 480;
  paintBathymetry(c, Number(el.dataset.seed));
  el.appendChild(c);
});

// ---------- choreography ----------
const depthEl = document.querySelector("[data-depth]");
const pressureEl = document.querySelector("[data-pressure]");
const tempEl = document.querySelector("[data-temp]");
const lightEl = document.querySelector("[data-light]");
const fmt = new Intl.NumberFormat("fr-FR"); // thin-space thousands like the chart world
const ZONES = [0, 200, 1000, 4000, 6000, 11000];

function setDepthMeters(m) {
  depthEl.textContent = fmt.format(Math.round(m));
  const atm = 1 + m / 10;
  pressureEl.textContent = fmt.format(Math.round(atm));
  const temp = m < 200 ? 22 - (m / 200) * 12 : m < 1000 ? 10 - ((m - 200) / 800) * 6 : Math.max(1.2, 4 - ((m - 1000) / 10000) * 2.8);
  tempEl.textContent = temp.toFixed(temp < 10 ? 1 : 0);
  const light = m < 200 ? 100 - (m / 200) * 99 : m < 1000 ? Math.max(0, 1 - (m - 200) / 800) : 0;
  lightEl.textContent = light < 1 && light > 0 ? "<1" : Math.round(light);
}

function init() {
  // one authored moment: hero load
  const intro = gsap.timeline({ defaults: { ease: "expo.out" } });
  intro
    .to(".hero__title .line > span", { y: 0, duration: 1.3, stagger: 0.09 }, 0.15)
    .to(".hero__lead", { opacity: 1, duration: 0.9 }, 0.7)
    .to(".hero__hint", { opacity: 1, duration: 0.9 }, 0.9);
  if (reduce) { intro.progress(1); }

  // hero → mission: shallow descent (0 → 200 m) while the mission reads
  ScrollTrigger.create({
    trigger: ".mission", start: "top bottom", end: "bottom top",
    onUpdate: (self) => { state.depth = self.progress * 0.02; setDepthMeters(self.progress * 200); },
  });

  // breakpoint-dependent choreography lives in gsap.matchMedia so a desktop<->mobile resize rebuilds pins instead of stranding them
  const mm = gsap.matchMedia();
  mm.add({ desktop: "(min-width: 821px)", mobile: "(max-width: 820px)", motionOK: "(prefers-reduced-motion: no-preference)" }, (ctx) => {
    const { mobile, motionOK } = ctx.conditions;
    if (!motionOK) { root.dataset.dark = "false"; return; }

    // the descent: pinned scroll-film through five zones
    const zones = gsap.utils.toArray(".zone");
    const n = zones.length;
    const scalePin = document.querySelector("[data-scale-pin]");
    const scaleEl = document.querySelector(".descent__scale");
    const scaleH = () => scaleEl.clientHeight - 10;
    const film = gsap.timeline({
      scrollTrigger: {
        trigger: ".descent", start: "top top", end: () => "+=" + (mobile ? innerHeight * 3 : innerHeight * 4.5),
        pin: ".descent__pin", scrub: 0.6, anticipatePin: 1, invalidateOnRefresh: true,
        onUpdate: (self) => {
          const p = self.progress;
          const u = Math.min(n - 1e-4, p * (n + 0.6));          // timeline units: zone i spans [i, i+1)
          const seg = Math.floor(u); const f = u - seg;
          const m = gsap.utils.interpolate(ZONES[seg], ZONES[seg + 1], f);
          setDepthMeters(m);
          scalePin.style.setProperty("--pin-y", `${(u / n) * scaleH()}px`);
          state.depth = 0.02 + p * 0.98;
          root.dataset.dark = p > 0.2 ? "true" : "false";   // shader ground is ~75% dark here (see water.frag curve)
        },
      },
    });
    gsap.set(zones[0], { opacity: 1, y: 0 });
    zones.forEach((z, i) => {
      if (i === 0) return;
      film.to(zones[i - 1], { opacity: 0, y: -24, duration: 0.2, ease: "power2.in" }, i);
      film.fromTo(z, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.3, ease: "power3.out" }, i + 0.2);
    });
    film.to({}, { duration: 0.6 }, n);

    // expeditions: horizontal track on desktop; native snap scroller on mobile (CSS)
    const track = document.querySelector(".track");
    if (!mobile) {
      gsap.to(track, {
        x: () => -(track.scrollWidth - innerWidth + parseFloat(getComputedStyle(track.parentElement).paddingLeft)),  // resolved px, not the raw clamp() token
        ease: "none",
        scrollTrigger: { trigger: ".expeditions", start: "top top", end: () => "+=" + track.scrollWidth * 0.8, pin: true, scrub: 0.5, invalidateOnRefresh: true, anticipatePin: 1 },
      });
    }

    // after the descent: stay at hadal depth, keep dark
    ScrollTrigger.create({ trigger: ".expeditions", start: "top bottom", onEnter: () => { state.depth = 1; root.dataset.dark = "true"; } });
    ScrollTrigger.create({ trigger: ".join", start: "top 60%", onEnter: () => (root.dataset.dark = "true") });

    return () => { gsap.set(track, { clearProps: "transform" }); gsap.set(zones, { clearProps: "all" }); };
  });

  // text rise for section headings (once, not on every block)
  gsap.utils.toArray(".mission__h, .expeditions h2, .instruments h2, .join h2").forEach((h) => {
    gsap.from(h, { opacity: 0, y: 18, duration: 0.9, ease: "expo.out", scrollTrigger: { trigger: h, start: "top 85%", once: true } });
  });

  ScrollTrigger.refresh();
}

document.fonts.ready.then(init);
addEventListener("load", () => ScrollTrigger.refresh());
