"use client";

import * as React from "react";
import * as THREE from "three";

/**
 * The hero's 3D scene.
 *
 * What it shows is the product's actual shape: a world of places, and calls
 * arriving into it from all over. A globe with a lit atmosphere, a shell of
 * points, latitude rings, arcs that travel between real cities, and a ring
 * that pulses out of each city as a call lands.
 *
 * Written against three directly rather than React Three Fiber, because R3F
 * pins React below 19.3 and pulls Expo and React Native into a web-only tree.
 *
 * Performance rules it follows, all of which matter on integrated graphics:
 *   Frame rate capped at 30. Nothing here moves fast enough to need more, and
 *   an uncapped loop starves the main thread.
 *   Device pixel ratio capped at 2.
 *   The whole loop stops when the scene is scrolled out of view.
 *   One static frame under prefers-reduced-motion, then it stops entirely.
 *   A quiet return if WebGL is unavailable, because the hero reads without it.
 */

/** Real cities, spread around the sphere so the arcs are not one cluster. */
const CITIES: [name: string, lat: number, lon: number][] = [
  ["Bend", 44.06, -121.31],
  ["Los Angeles", 34.05, -118.24],
  ["Chicago", 41.88, -87.63],
  ["New York", 40.71, -74.01],
  ["Mexico City", 19.43, -99.13],
  ["Bogota", 4.71, -74.07],
  ["Sao Paulo", -23.55, -46.63],
  ["London", 51.51, -0.13],
  ["Lisbon", 38.72, -9.14],
  ["Lagos", 6.52, 3.38],
  ["Cape Town", -33.92, 18.42],
  ["Dubai", 25.2, 55.27],
  ["Mumbai", 19.08, 72.88],
  ["Singapore", 1.35, 103.82],
  ["Tokyo", 35.68, 139.69],
  ["Sydney", -33.87, 151.21],
  ["Auckland", -36.85, 174.76],
  ["Toronto", 43.65, -79.38],
];

/** Index pairs into CITIES. Chosen to cross the sphere rather than hug it. */
const ROUTES: [number, number][] = [
  [0, 1],
  [0, 3],
  [3, 7],
  [7, 11],
  [11, 13],
  [13, 14],
  [14, 15],
  [15, 16],
  [4, 6],
  [9, 10],
  [12, 7],
  [17, 2],
  [6, 8],
  [5, 3],
];

function toVec3(lat: number, lon: number, r: number) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta),
  );
}

export function Globe({ className }: { className?: string }) {
  const hostRef = React.useRef<HTMLDivElement>(null);
  const [themeKey, setThemeKey] = React.useState(0);

  // The scene samples CSS custom properties once at build time, so it has to
  // be rebuilt when the theme changes or it keeps the old palette.
  React.useEffect(() => {
    const mo = new MutationObserver(() => setThemeKey((k) => k + 1));
    mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => mo.disconnect();
  }, []);

  React.useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const light =
      document.documentElement.getAttribute("data-theme") === "light";

    const css = getComputedStyle(document.documentElement);
    const read = (name: string, fallback: string) =>
      new THREE.Color(css.getPropertyValue(name).trim() || fallback);
    const primary = read("--color-primary", "#a78bfa");
    const accent = read("--color-series-2", "#4785e0");
    const signal = read("--color-signal", "#ff6b3d");
    const violet = read("--color-series-4", "#b562c9");

    // The same line opacity that glows on near-black vanishes on white, so
    // the light theme gets its own values rather than a shared compromise.
    const op = light
      ? { wire: 0.42, shell: 0.8, arc: 0.9, dust: 0.5, ring: 0.3, glow: 0.3 }
      : {
          wire: 0.16,
          shell: 0.55,
          arc: 0.72,
          dust: 0.42,
          ring: 0.16,
          glow: 0.42,
        };

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
    camera.position.set(0, 0, 7.4);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "low-power",
      });
    } catch {
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    host.appendChild(renderer.domElement);
    Object.assign(renderer.domElement.style, {
      width: "100%",
      height: "100%",
      display: "block",
    });

    const world = new THREE.Group();
    world.rotation.z = -0.36;
    scene.add(world);

    const R = 2.05;
    const disposables: { dispose(): void }[] = [];
    const track = <T extends { dispose(): void }>(x: T) => {
      disposables.push(x);
      return x;
    };

    // --- Atmosphere -------------------------------------------------------
    // A fresnel rim on a slightly larger back-facing sphere, added only in the
    // dark theme.
    //
    // On light it has to go. Additive blending adds light, which reads as a
    // glow on near-black; normal blending over white instead lays a milky
    // film across the whole sphere and fogs the line work behind it. Nothing
    // about the shell size or falloff fixes that, because the problem is the
    // blend mode, and additive over white is invisible. So the light theme
    // gets no atmosphere and relies on the wireframe and arcs, which it
    // already renders at much higher opacity.
    if (!light) {
      const atmoGeo = track(new THREE.SphereGeometry(R * 1.1, 48, 48));
      const atmoMat = track(
        new THREE.ShaderMaterial({
          transparent: true,
          side: THREE.BackSide,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          uniforms: {
            uColor: { value: primary },
            uIntensity: { value: op.glow },
          },
          vertexShader: `
          varying vec3 vNormal;
          varying vec3 vView;
          void main() {
            vNormal = normalize(normalMatrix * normal);
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            vView = normalize(-mv.xyz);
            gl_Position = projectionMatrix * mv;
          }
        `,
          fragmentShader: `
          uniform vec3 uColor;
          uniform float uIntensity;
          varying vec3 vNormal;
          varying vec3 vView;
          void main() {
            // Brightest where the surface turns away from the camera, which
            // is what an atmosphere actually does.
            float rim = pow(1.0 - abs(dot(vNormal, vView)), 4.5);
            gl_FragColor = vec4(uColor, rim * uIntensity);
          }
        `,
        }),
      );
      const atmo = new THREE.Mesh(atmoGeo, atmoMat);
      // Drawn before everything else so it can never composite over the
      // wireframe, the arcs or the city dots.
      atmo.renderOrder = -1;
      world.add(atmo);
    }

    // --- Wireframe --------------------------------------------------------
    const wireGeo = track(
      new THREE.WireframeGeometry(new THREE.IcosahedronGeometry(R, 2)),
    );
    world.add(
      new THREE.LineSegments(
        wireGeo,
        track(
          new THREE.LineBasicMaterial({
            color: primary,
            transparent: true,
            opacity: op.wire,
          }),
        ),
      ),
    );

    // --- Latitude rings ---------------------------------------------------
    // Three rings give the sphere an axis and make the rotation legible.
    const ringMat = track(
      new THREE.LineBasicMaterial({
        color: accent,
        transparent: true,
        opacity: op.ring,
      }),
    );
    for (const lat of [-40, 0, 40]) {
      const rr = R * Math.cos((lat * Math.PI) / 180);
      const y = R * Math.sin((lat * Math.PI) / 180);
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i <= 96; i++) {
        const a = (i / 96) * Math.PI * 2;
        pts.push(new THREE.Vector3(Math.cos(a) * rr, y, Math.sin(a) * rr));
      }
      world.add(
        new THREE.Line(
          track(new THREE.BufferGeometry().setFromPoints(pts)),
          ringMat,
        ),
      );
    }

    // --- Point shell ------------------------------------------------------
    const shellCount = 900;
    const shellPos = new Float32Array(shellCount * 3);
    for (let i = 0; i < shellCount; i++) {
      // Fibonacci sphere: even coverage without clustering at the poles.
      const y = 1 - (i / (shellCount - 1)) * 2;
      const rad = Math.sqrt(Math.max(0, 1 - y * y));
      const theta = i * 2.399963;
      shellPos.set(
        [Math.cos(theta) * rad * R, y * R, Math.sin(theta) * rad * R],
        i * 3,
      );
    }
    const shellGeo = track(new THREE.BufferGeometry());
    shellGeo.setAttribute("position", new THREE.BufferAttribute(shellPos, 3));
    world.add(
      new THREE.Points(
        shellGeo,
        track(
          new THREE.PointsMaterial({
            color: primary,
            size: light ? 0.026 : 0.022,
            transparent: true,
            opacity: op.shell,
          }),
        ),
      ),
    );

    // --- Cities, arcs, travellers, and landing rings ----------------------
    const arcGroup = new THREE.Group();
    world.add(arcGroup);

    const cityDotMat = track(new THREE.MeshBasicMaterial({ color: primary }));
    const cityGeo = track(new THREE.SphereGeometry(0.032, 8, 8));
    const cityPoints = CITIES.map(([, lat, lon]) => toVec3(lat, lon, R));
    for (const p of cityPoints) {
      const dot = new THREE.Mesh(cityGeo, cityDotMat);
      dot.position.copy(p);
      arcGroup.add(dot);
    }

    const travellers: {
      curve: THREE.QuadraticBezierCurve3;
      mesh: THREE.Mesh;
      mat: THREE.MeshBasicMaterial;
      ring: THREE.Mesh;
      ringMat: THREE.MeshBasicMaterial;
      offset: number;
    }[] = [];

    const ARC_COLORS = [primary, accent, signal, violet];
    const ringGeo = track(new THREE.RingGeometry(0.05, 0.075, 24));
    const travellerGeo = track(new THREE.SphereGeometry(0.045, 10, 10));

    ROUTES.forEach(([ai, bi], i) => {
      const a = cityPoints[ai]!;
      const b = cityPoints[bi]!;
      const mid = a.clone().add(b).multiplyScalar(0.5);
      mid.setLength(R * (1 + a.distanceTo(b) * 0.3));
      const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
      const color = ARC_COLORS[i % ARC_COLORS.length]!;

      arcGroup.add(
        new THREE.Line(
          track(new THREE.BufferGeometry().setFromPoints(curve.getPoints(40))),
          track(
            new THREE.LineBasicMaterial({
              color,
              transparent: true,
              opacity: op.arc,
            }),
          ),
        ),
      );

      const mat = track(
        new THREE.MeshBasicMaterial({ color, transparent: true }),
      );
      const mesh = new THREE.Mesh(travellerGeo, mat);
      arcGroup.add(mesh);

      // A ring that expands out of the destination as the call lands.
      const rMat = track(
        new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          side: THREE.DoubleSide,
          depthWrite: false,
        }),
      );
      const ring = new THREE.Mesh(ringGeo, rMat);
      ring.position.copy(b);
      ring.lookAt(b.clone().multiplyScalar(2));
      arcGroup.add(ring);

      travellers.push({
        curve,
        mesh,
        mat,
        ring,
        ringMat: rMat,
        offset: i / ROUTES.length,
      });
    });

    // --- Surrounding dust -------------------------------------------------
    const dustCount = 180;
    const dustPos = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount; i++) {
      const r = 2.9 + Math.random() * 2.8;
      const t = Math.random() * Math.PI * 2;
      const u = Math.random() * 2 - 1;
      const s = Math.sqrt(1 - u * u);
      dustPos.set(
        [r * s * Math.cos(t), r * u * 0.7, r * s * Math.sin(t)],
        i * 3,
      );
    }
    const dustGeo = track(new THREE.BufferGeometry());
    dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPos, 3));
    const dust = new THREE.Points(
      dustGeo,
      track(
        new THREE.PointsMaterial({
          color: accent,
          size: 0.03,
          transparent: true,
          opacity: op.dust,
        }),
      ),
    );
    scene.add(dust);

    // --- Pointer parallax -------------------------------------------------
    // Held in plain locals, never React state: this updates on every pointer
    // move and must not re-render anything.
    const target = { x: 0, y: 0 };
    const current = { x: 0, y: 0 };
    const onPointer = (e: PointerEvent) => {
      const r = host.getBoundingClientRect();
      target.x = ((e.clientX - r.left) / r.width - 0.5) * 0.5;
      target.y = ((e.clientY - r.top) / r.height - 0.5) * 0.28;
    };
    if (!reduced) {
      window.addEventListener("pointermove", onPointer, { passive: true });
    }

    function resize() {
      const { clientWidth: w, clientHeight: h } = host!;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    const ro = new ResizeObserver(resize);
    ro.observe(host);
    resize();

    let visible = true;
    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry?.isIntersecting ?? true;
      },
      { threshold: 0 },
    );
    io.observe(host);

    let raf = 0;
    const clock = new THREE.Clock();
    const FPS = 30;
    const STEP = 1 / FPS;
    let acc = 0;
    let elapsed = 0;

    function frame() {
      raf = requestAnimationFrame(frame);
      const delta = clock.getDelta();
      if (!visible) return;
      acc += delta;
      if (acc < STEP) return;
      elapsed += acc;
      acc = 0;

      const t = elapsed;
      world.rotation.y = t * 0.075;
      dust.rotation.y = -t * 0.018;

      current.x += (target.x - current.x) * 0.045;
      current.y += (target.y - current.y) * 0.045;
      world.rotation.x = current.y;
      camera.position.x = current.x * 1.7;
      camera.lookAt(0, 0, 0);

      for (const tr of travellers) {
        const p = (t * 0.14 + tr.offset) % 1;
        tr.mesh.position.copy(tr.curve.getPoint(p));
        // Fade in and out at the ends, so a call appears to depart and land.
        tr.mat.opacity = Math.sin(p * Math.PI);

        // The landing ring fires over the last fifth of the journey.
        const landing = p > 0.8 ? (p - 0.8) / 0.2 : 0;
        const s = 1 + landing * 2.6;
        tr.ring.scale.set(s, s, s);
        tr.ringMat.opacity = landing > 0 ? (1 - landing) * 0.85 : 0;
      }

      renderer.render(scene, camera);
    }

    if (reduced) {
      renderer.render(scene, camera);
    } else {
      frame();
    }

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("pointermove", onPointer);
      for (const d of disposables) d.dispose();
      renderer.dispose();
      host.removeChild(renderer.domElement);
    };
  }, [themeKey]);

  return (
    <div
      ref={hostRef}
      aria-hidden
      className={className}
      // The scene is decoration over the headline. It carries no information
      // that is not also in the copy, so it is hidden from assistive tech.
    />
  );
}
