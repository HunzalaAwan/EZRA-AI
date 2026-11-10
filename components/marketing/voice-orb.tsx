"use client";

import * as React from "react";
import * as THREE from "three";
import { cn } from "@/lib/utils";

/**
 * The hero's 3D scene: a voice, drawn as a living sphere of light.
 *
 * Several thousand points sit on a sphere and are pushed out along their
 * normals by layered waves, so the surface ripples the way a voice moves.
 * The amplitude follows a speech envelope (bursts and pauses), which is what
 * makes it read as someone talking rather than as a screensaver. Points are
 * coloured by how far they are displaced: deep violet at rest, lilac on the
 * swell, a pink crest at the peaks.
 *
 * Around it, three tilted rings each carry a bright marker: calls in
 * progress. And streams of particles fly in from the dark and land on the
 * surface, fading as they arrive: calls being answered.
 *
 * Cost is capped the same way the old globe was, because an uncapped WebGL
 * loop starves the main thread on integrated graphics:
 *   30 frames a second, device pixel ratio capped at 2.
 *   Paused entirely while the panel is off screen.
 *   One still frame under prefers-reduced-motion, then nothing.
 *   A quiet return if WebGL is unavailable. The panel reads without it.
 *
 * The panel is dark in both themes, so the scene never reads the theme.
 * Reduced motion is read inside the effect, never during render, because the
 * hook is null on the server and a boolean on the client.
 */

const SPHERE_POINTS = 4200;
const ARRIVALS = 90;
const RADIUS = 1.35;

const VERT = /* glsl */ `
  uniform float uTime;
  uniform float uAmp;
  uniform float uPixel;
  attribute float aSeed;
  varying float vLift;
  varying float vFacing;

  // Layered travelling waves. Cheap, smooth, and periodic enough to loop.
  float waves(vec3 p, float t) {
    float a = sin(p.x * 3.1 + t * 1.30) * sin(p.y * 2.7 - t * 1.10);
    float b = sin(p.y * 4.3 + p.z * 3.7 + t * 1.90) * 0.6;
    float c = sin(p.z * 5.9 - p.x * 4.1 + t * 2.70) * 0.35;
    return a + b + c;
  }

  void main() {
    vec3 n = normalize(position);
    float w = waves(n * 1.6, uTime);
    float lift = w * uAmp;
    vLift = clamp(w * 0.5 + 0.5, 0.0, 1.0) * clamp(uAmp * 4.0, 0.25, 1.0);
    vec3 displaced = position + n * lift;
    vec4 mv = modelViewMatrix * vec4(displaced, 1.0);
    vFacing = clamp(dot(normalize(normalMatrix * n), vec3(0.0, 0.0, 1.0)), 0.0, 1.0);
    gl_Position = projectionMatrix * mv;
    // Sized so a point is a visible bead at 1x, not a hairline. The first
    // version came out near 2px and the sphere all but disappeared.
    float size = (3.4 + aSeed * 2.2 + vLift * 4.5) * uPixel;
    gl_PointSize = size * (8.5 / -mv.z);
  }
`;

const FRAG = /* glsl */ `
  varying float vLift;
  varying float vFacing;
  uniform vec3 uDeep;
  uniform vec3 uMid;
  uniform vec3 uCrest;

  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    if (d > 0.5) discard;
    float soft = smoothstep(0.5, 0.08, d);
    vec3 col = mix(uDeep, uMid, smoothstep(0.05, 0.5, vLift));
    col = mix(col, uCrest, smoothstep(0.62, 0.95, vLift));
    // Rim light: points turning away from the camera glow lilac, so the orb
    // reads as a lit volume instead of a flat disc of one colour.
    col += uMid * pow(1.0 - vFacing, 2.0) * 0.75;
    // Back of the sphere recedes, so it reads as a volume, not a disc.
    float alpha = soft * mix(0.28, 1.0, vFacing);
    gl_FragColor = vec4(col, alpha);
  }
`;

const GLOW_FRAG = /* glsl */ `
  varying vec2 vUv;
  uniform float uPulse;
  uniform vec3 uColor;
  void main() {
    float d = length(vUv - 0.5) * 2.0;
    float a = pow(smoothstep(1.0, 0.0, d), 2.4) * (0.32 + uPulse * 0.28);
    gl_FragColor = vec4(uColor, a);
  }
`;

const GLOW_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

/** Speech is bursts and pauses, not a sine. Deterministic, so it never stutters. */
function speech(t: number) {
  const phrase = Math.max(0, Math.sin(t * 0.55)) ** 0.6;
  const syllables = 0.55 + 0.45 * Math.abs(Math.sin(t * 6.3) * Math.sin(t * 2.9 + 1.3));
  return 0.05 + 0.17 * phrase * syllables;
}

export function VoiceOrb({
  className,
  minimal = false,
}: {
  className?: string;
  /**
   * The hero background. No rings, no arrivals: one large sphere sitting low
   * in the frame so it rises from the bottom edge, moving slowly. The full
   * scene with orbits and arriving particles reads as busy behind a headline.
   */
  minimal?: boolean;
}) {
  const host = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const el = host.current;
    if (!el) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    } catch {
      return; // No WebGL. The panel still reads.
    }
    const dpr = Math.min(window.devicePixelRatio, 2);
    renderer.setPixelRatio(dpr);
    renderer.setClearColor(0x000000, 0);
    el.appendChild(renderer.domElement);
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.display = "block";

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.set(0, 0, 6.2);

    const disposables: { dispose(): void }[] = [];
    const track = <T extends { dispose(): void }>(x: T) => {
      disposables.push(x);
      return x;
    };

    const rig = new THREE.Group();
    scene.add(rig);
    // In the hero the sphere is large and low, cropped by the bottom edge.
    const baseY = minimal ? -2.45 : 0;
    if (minimal) rig.scale.setScalar(1.7);
    rig.position.y = baseY;

    // ---- Glow behind the orb.
    const glowMat = track(
      new THREE.ShaderMaterial({
        vertexShader: GLOW_VERT,
        fragmentShader: GLOW_FRAG,
        uniforms: { uPulse: { value: 0 }, uColor: { value: new THREE.Color("#7c4dff") } },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    const glow = new THREE.Mesh(track(new THREE.PlaneGeometry(7.5, 7.5)), glowMat);
    glow.position.z = -1.2;
    if (minimal) {
      glow.position.y = -2.45;
      glow.scale.setScalar(1.9);
    }
    scene.add(glow);

    // ---- The voice sphere: Fibonacci points, so the spacing is even.
    const pos = new Float32Array(SPHERE_POINTS * 3);
    const seed = new Float32Array(SPHERE_POINTS);
    const golden = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < SPHERE_POINTS; i++) {
      const y = 1 - (i / (SPHERE_POINTS - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const th = golden * i;
      pos[i * 3] = Math.cos(th) * r * RADIUS;
      pos[i * 3 + 1] = y * RADIUS;
      pos[i * 3 + 2] = Math.sin(th) * r * RADIUS;
      seed[i] = ((i * 2654435761) % 1000) / 1000;
    }
    const sphereGeo = track(new THREE.BufferGeometry());
    sphereGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    sphereGeo.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
    const sphereMat = track(
      new THREE.ShaderMaterial({
        vertexShader: VERT,
        fragmentShader: FRAG,
        uniforms: {
          uTime: { value: 0 },
          uAmp: { value: 0.12 },
          uPixel: { value: dpr },
          uDeep: { value: new THREE.Color("#4c2a9e") },
          uMid: { value: new THREE.Color("#a78bfa") },
          uCrest: { value: new THREE.Color("#f5a6d8") },
        },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    const sphere = new THREE.Points(sphereGeo, sphereMat);
    rig.add(sphere);

    // ---- Three orbit rings, each carrying one call marker.
    const rings: { group: THREE.Group; marker: THREE.Mesh; speed: number; phase: number; r: number }[] = [];
    const ringSpecs = minimal ? [] : [
      { r: 1.85, tilt: [1.15, 0.2, 0.0], speed: 0.42, color: "#c4b5fd" },
      { r: 2.08, tilt: [-0.55, 0.9, 0.3], speed: -0.3, color: "#f5a6d8" },
      { r: 2.3, tilt: [0.35, -0.7, -0.4], speed: 0.22, color: "#8be3f0" },
    ];
    for (const [i, spec] of ringSpecs.entries()) {
      const group = new THREE.Group();
      group.rotation.set(spec.tilt[0]!, spec.tilt[1]!, spec.tilt[2]!);
      const pts: THREE.Vector3[] = [];
      for (let k = 0; k <= 160; k++) {
        const a = (k / 160) * Math.PI * 2;
        pts.push(new THREE.Vector3(Math.cos(a) * spec.r, Math.sin(a) * spec.r, 0));
      }
      const lineGeo = track(new THREE.BufferGeometry().setFromPoints(pts));
      const lineMat = track(
        new THREE.LineBasicMaterial({
          color: spec.color,
          transparent: true,
          opacity: 0.22,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        }),
      );
      group.add(new THREE.Line(lineGeo, lineMat));
      const marker = new THREE.Mesh(
        track(new THREE.SphereGeometry(0.055, 16, 16)),
        track(new THREE.MeshBasicMaterial({ color: spec.color })),
      );
      const halo = new THREE.Mesh(
        track(new THREE.SphereGeometry(0.15, 16, 16)),
        track(
          new THREE.MeshBasicMaterial({
            color: spec.color,
            transparent: true,
            opacity: 0.22,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
          }),
        ),
      );
      marker.add(halo);
      group.add(marker);
      rig.add(group);
      rings.push({ group, marker, speed: spec.speed, phase: i * 2.1, r: spec.r });
    }

    // ---- Arrivals: particles that fly in and land on the surface.
    const arrivals = minimal ? 0 : ARRIVALS;
    const arrPos = new Float32Array(arrivals * 3);
    const arrAlpha = new Float32Array(arrivals);
    const arrival = Array.from({ length: arrivals }, (_, i) => {
      const u = ((i * 0.618033) % 1) * Math.PI * 2;
      const v = Math.acos(1 - 2 * (((i * 0.381966) % 1)));
      const dir = new THREE.Vector3(Math.sin(v) * Math.cos(u), Math.cos(v), Math.sin(v) * Math.sin(u));
      return { dir, t: (i / arrivals) % 1, speed: 0.16 + ((i * 37) % 10) / 70 };
    });
    const arrGeo = track(new THREE.BufferGeometry());
    arrGeo.setAttribute("position", new THREE.BufferAttribute(arrPos, 3));
    arrGeo.setAttribute("aAlpha", new THREE.BufferAttribute(arrAlpha, 1));
    const arrMat = track(
      new THREE.ShaderMaterial({
        vertexShader: /* glsl */ `
          attribute float aAlpha;
          varying float vA;
          uniform float uPixel;
          void main() {
            vA = aAlpha;
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            gl_Position = projectionMatrix * mv;
            gl_PointSize = 5.0 * uPixel * (7.0 / -mv.z);
          }
        `,
        fragmentShader: /* glsl */ `
          varying float vA;
          void main() {
            float d = length(gl_PointCoord - 0.5);
            if (d > 0.5) discard;
            gl_FragColor = vec4(0.93, 0.86, 1.0, smoothstep(0.5, 0.0, d) * vA);
          }
        `,
        uniforms: { uPixel: { value: dpr } },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    rig.add(new THREE.Points(arrGeo, arrMat));

    // ---- Pointer parallax: the orb leans toward the cursor, gently.
    const target = { x: 0, y: 0 };
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      target.x = ((e.clientX - r.left) / r.width - 0.5) * 0.5;
      target.y = ((e.clientY - r.top) / r.height - 0.5) * 0.35;
    };
    el.addEventListener("pointermove", onMove);

    const resize = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      // Keep the orb the same visual size on a tall phone panel.
      camera.position.z = w / h < 1 ? 7.6 : 6.2;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);

    let t = 4.2; // Start mid-phrase so the first frame is already speaking.
    const frame = (dt: number) => {
      t += dt;
      const amp = speech(t);
      sphereMat.uniforms.uTime!.value = t;
      sphereMat.uniforms.uAmp!.value = amp;
      glowMat.uniforms.uPulse!.value = (amp - 0.05) / 0.17;

      rig.rotation.y += dt * (minimal ? 0.06 : 0.12);
      rig.rotation.x += (target.y - rig.rotation.x) * 0.04;
      sphere.rotation.z = Math.sin(t * 0.2) * 0.1;
      rig.position.x += (target.x * (minimal ? 0.4 : 1) - rig.position.x) * 0.04;

      for (const ring of rings) {
        const a = t * ring.speed + ring.phase;
        ring.marker.position.set(Math.cos(a) * ring.r, Math.sin(a) * ring.r, 0);
      }

      for (let i = 0; i < arrivals; i++) {
        const p = arrival[i]!;
        p.t += dt * p.speed;
        if (p.t > 1) p.t -= 1;
        // Ease in: fast from far away, slowing as it lands.
        const k = 1 - (1 - p.t) ** 3;
        const dist = THREE.MathUtils.lerp(5.4, RADIUS * 1.02, k);
        arrPos[i * 3] = p.dir.x * dist;
        arrPos[i * 3 + 1] = p.dir.y * dist;
        arrPos[i * 3 + 2] = p.dir.z * dist;
        arrAlpha[i] = Math.sin(p.t * Math.PI) * 0.9;
      }
      arrGeo.attributes.position!.needsUpdate = true;
      arrGeo.attributes.aAlpha!.needsUpdate = true;

      renderer.render(scene, camera);
    };

    let raf = 0;
    let visible = true;
    let last = performance.now();
    let acc = 0;
    const STEP = 1 / 30;

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (!visible) {
        last = now;
        return;
      }
      acc += Math.min(0.1, (now - last) / 1000);
      last = now;
      if (acc < STEP) return;
      frame(acc);
      acc = 0;
    };

    const io = new IntersectionObserver(([entry]) => {
      visible = Boolean(entry?.isIntersecting);
    });
    io.observe(el);

    if (reduced) {
      frame(0);
    } else {
      raf = requestAnimationFrame(loop);
    }

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      el.removeEventListener("pointermove", onMove);
      for (const d of disposables) d.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [minimal]);

  return <div ref={host} aria-hidden className={cn("pointer-events-auto", className)} />;
}
