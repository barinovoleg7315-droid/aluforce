/* Алюфорс: 3D-разрез алюминиевого профиля на первом экране.
   Сцена строится кодом (без моделей), анимация привязана к прокрутке через GSAP ScrollTrigger. */
import * as THREE from "three";
import { RoomEnvironment } from "../vendor/RoomEnvironment.js";

const hero = document.querySelector(".hero3d");
const canvas = document.getElementById("hero-canvas");
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

function webglOk() {
  try { const c = document.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")); } catch (e) { return false; }
}

if (!hero || !canvas || reduce || !webglOk() || !window.gsap || !window.ScrollTrigger) {
  if (hero) hero.classList.add("is-static");
} else {
  start();
}

function start() {
  const gsap = window.gsap, ScrollTrigger = window.ScrollTrigger;
  gsap.registerPlugin(ScrollTrigger);
  const mobile = () => innerWidth < 920;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, mobile() ? 1.5 : 1.75));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const camera = new THREE.PerspectiveCamera(28, 1, 1, 4000);

  const key = new THREE.DirectionalLight(0xffffff, 1.6); key.position.set(-200, 260, 300); scene.add(key);
  const rim = new THREE.DirectionalLight(0x9fc4a6, 1.1); rim.position.set(300, -80, -200); scene.add(rim);

  /* ---------- geometry helpers ---------- */
  const DEPTH = 150;
  const ext = { depth: DEPTH, bevelEnabled: true, bevelThickness: 0.6, bevelSize: 0.5, bevelSegments: 2, curveSegments: 4 };
  function rectPath(x0, y0, x1, y1, P) {
    const p = P || new THREE.Path();
    p.moveTo(x0, y0); p.lineTo(x1, y0); p.lineTo(x1, y1); p.lineTo(x0, y1); p.lineTo(x0, y0);
    return p;
  }
  function poly(points, holes) {
    const s = new THREE.Shape();
    points.forEach((pt, i) => (i ? s.lineTo(pt[0], pt[1]) : s.moveTo(pt[0], pt[1])));
    s.closePath();
    (holes || []).forEach((h) => s.holes.push(rectPath(h[0], h[1], h[2], h[3])));
    return s;
  }
  function mesh(shape, mats) {
    const g = new THREE.ExtrudeGeometry(shape, ext);
    g.translate(0, 0, -DEPTH / 2);
    return new THREE.Mesh(g, mats);
  }

  /* ---------- materials: cut face is bright aluminium, sides are anthracite powder coat ---------- */
  const cutAlu = new THREE.MeshStandardMaterial({ color: 0xd9dde0, metalness: 1, roughness: 0.22 });
  const coat = new THREE.MeshStandardMaterial({ color: 0x2d3236, metalness: 0.55, roughness: 0.42 });
  const breakCap = new THREE.MeshStandardMaterial({ color: 0x1c1d1c, metalness: 0, roughness: 0.65, emissive: 0x5a735e, emissiveIntensity: 0 });
  const breakSide = new THREE.MeshStandardMaterial({ color: 0x151615, metalness: 0, roughness: 0.75, emissive: 0x5a735e, emissiveIntensity: 0 });
  const rubber = new THREE.MeshStandardMaterial({ color: 0x0b0c0b, metalness: 0, roughness: 0.9 });
  const glassFace = new THREE.MeshPhysicalMaterial({ color: 0xd6e7e2, metalness: 0, roughness: 0.04, transparent: true, opacity: 0.22, clearcoat: 1, side: THREE.DoubleSide, depthWrite: false });
  const glassEdge = new THREE.MeshStandardMaterial({ color: 0x6e9a8b, metalness: 0.1, roughness: 0.15, transparent: true, opacity: 0.9 });
  const spacerMat = new THREE.MeshStandardMaterial({ color: 0xbfc4c7, metalness: 1, roughness: 0.35, transparent: true });

  /* ---------- profile parts (units ~ mm) ---------- */
  const outer = mesh(poly(
    [[-36, 0], [-6, 0], [-6, 46], [-19, 46], [-19, 74], [-36, 74]],
    [[-32, 4, -10, 20], [-32, 24, -10, 42], [-32, 48, -23, 70]]
  ), [cutAlu, coat]);
  const inner = mesh(poly(
    [[6, 0], [36, 0], [36, 74], [19, 74], [19, 46], [6, 46]],
    [[10, 4, 32, 20], [10, 24, 32, 42], [23, 48, 32, 70]]
  ), [cutAlu, coat]);
  const brk = new THREE.Group();
  [[6, 13], [33, 40]].forEach(([y0, y1]) => {
    brk.add(mesh(poly([[-7, y0], [7, y0], [7, y1], [-7, y1]]), [breakCap, breakSide]));
  });
  const gaskets = new THREE.Group();
  gaskets.add(mesh(poly([[-19, 58], [-16, 58], [-16, 72], [-19, 72]]), [rubber, rubber]));
  gaskets.add(mesh(poly([[16, 58], [19, 58], [19, 72], [16, 72]]), [rubber, rubber]));

  const glass = new THREE.Group();
  const GH = 115;
  [[-16, -10], [10, 16]].forEach(([x0, x1]) => {
    glass.add(mesh(poly([[x0, 48], [x1, 48], [x1, 48 + GH], [x0, 48 + GH]]), [glassEdge, glassFace]));
  });
  glass.add(mesh(poly([[-10, 48], [10, 48], [10, 58], [-10, 58]], [[-7, 51, 7, 55]]), [spacerMat, spacerMat]));
  glass.add(mesh(poly([[-10, 48 + GH - 10], [10, 48 + GH - 10], [10, 48 + GH], [-10, 48 + GH]]), [spacerMat, spacerMat]));

  const model = new THREE.Group();
  [outer, inner, brk, gaskets, glass].forEach((m) => model.add(m));
  model.position.y = -62;
  const rig = new THREE.Group();
  rig.add(model);
  scene.add(rig);

  /* ---------- layout ---------- */
  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const m = mobile();
    camera.position.set(0, 40, m ? 820 : 760);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
    rig.position.x = m ? 0 : 26;
    render();
  }

  /* ---------- scroll-driven state ---------- */
  const st = { p: 0 };
  const ease = (t) => (t < 0 ? 0 : t > 1 ? 1 : t * t * (3 - 2 * t));
  const seg = (p, a, b) => ease((p - a) / (b - a));
  const caps = [...hero.querySelectorAll("[data-stage]")];
  const ticks = [...hero.querySelectorAll("[data-tick]")];
  let float = 0;

  function apply() {
    const p = st.p;
    const turn = seg(p, 0, 0.35);
    const explode = seg(p, 0.18, 0.45) * (1 - seg(p, 0.62, 0.86));
    const glassIn = seg(p, 0.58, 0.86);
    rig.rotation.y = -0.85 + turn * 0.62 + seg(p, 0.86, 1) * 0.12 + Math.sin(float) * 0.04;
    rig.rotation.x = 0.36 - turn * 0.18;
    rig.scale.setScalar((mobile() ? 1.05 : 1.35) * (1 + turn * 0.15));
    const ex = mobile() ? 40 : 34;
    outer.position.x = -ex * explode;
    inner.position.x = ex * explode;
    gaskets.position.y = 30 * explode;
    glass.position.y = 230 * (1 - glassIn);
    glassFace.opacity = 0.22 * glassIn;
    glassEdge.opacity = 0.9 * glassIn;
    spacerMat.opacity = glassIn;
    glass.visible = glassIn > 0.01;
    const glow = seg(p, 0.26, 0.4) * (1 - seg(p, 0.55, 0.66));
    breakCap.emissiveIntensity = breakSide.emissiveIntensity = glow * 1.4;
    const stage = p < 0.28 ? 0 : p < 0.56 ? 1 : p < 0.84 ? 2 : 3;
    caps.forEach((c, i) => c.classList.toggle("on", i === stage));
    ticks.forEach((t, i) => t.classList.toggle("on", i <= stage));
    render();
  }
  function render() { renderer.render(scene, camera); }

  /* idle float only while the hero is on screen */
  let visible = true;
  new IntersectionObserver((es) => { visible = es[0].isIntersecting; }).observe(canvas);
  (function loop() {
    if (visible && !hero.closest("[hidden]")) { float += 0.012; apply(); }
    requestAnimationFrame(loop);
  })();

  ScrollTrigger.create({
    trigger: hero,
    start: () => "top " + (document.querySelector(".hdr") || { offsetHeight: 0 }).offsetHeight,
    end: () => "+=" + Math.round(innerHeight * (mobile() ? 1.4 : 2)),
    pin: true,
    scrub: 0.6,
    invalidateOnRefresh: true,
    onUpdate: (self) => { st.p = self.progress; apply(); },
  });

  addEventListener("resize", resize);
  document.addEventListener("pagechange", (e) => {
    if (e.detail === "home") requestAnimationFrame(() => { resize(); ScrollTrigger.refresh(); });
  });
  resize();
  apply();
  hero.classList.add("is-3d");
}
