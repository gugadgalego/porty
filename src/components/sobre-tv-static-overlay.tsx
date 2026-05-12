"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

type Props = {
  active: boolean;
  className?: string;
};

const VERT = /* glsl */ `
void main() {
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

const FRAG = /* glsl */ `
uniform float uTime;
uniform vec2 uResolution;

float rand(vec2 co) {
  return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
  vec2 px = max(uResolution, vec2(1.0));
  vec2 uv = gl_FragCoord.xy / px;
  float t = uTime * 48.0;
  float a = rand(uv * 920.0 + t);
  float b = rand(uv * -310.0 - t * 0.72);
  float m = mix(a, b, 0.52);
  float scan = sin(gl_FragCoord.y * 0.48 + uTime * 86.0) * 0.042;
  vec3 col = vec3(m * 0.78 + 0.08);
  col += vec3(scan);
  gl_FragColor = vec4(col, 0.93);
}
`;

export function SobreTvStaticOverlay({ active, className }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const runRef = useRef<{
    raf: number;
    renderer: THREE.WebGLRenderer;
    material: THREE.ShaderMaterial;
    geometry: THREE.PlaneGeometry;
    resizeObserver: ResizeObserver;
    clock: THREE.Clock;
  } | null>(null);

  useEffect(() => {
    if (!active) {
      const run = runRef.current;
      if (run) {
        cancelAnimationFrame(run.raf);
        run.resizeObserver.disconnect();
        run.material.dispose();
        run.geometry.dispose();
        run.renderer.dispose();
        const c = run.renderer.domElement;
        c.parentNode?.removeChild(c);
        runRef.current = null;
      }
      return;
    }

    const el = mountRef.current;
    if (!el) return;

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const geom = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: new THREE.Vector2(1, 1) },
      },
      vertexShader: VERT,
      fragmentShader: FRAG,
    });
    scene.add(new THREE.Mesh(geom, material));

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: false,
      powerPreference: "low-power",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const clock = new THREE.Clock();

    const resize = () => {
      const w = el.clientWidth || 1;
      const h = el.clientHeight || 1;
      renderer.setSize(w, h, false);
      const rw = renderer.domElement.width;
      const rh = renderer.domElement.height;
      material.uniforms.uResolution.value.set(rw, rh);
    };

    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(el);

    Object.assign(renderer.domElement.style, {
      position: "absolute",
      inset: "0",
      width: "100%",
      height: "100%",
      display: "block",
    });
    el.appendChild(renderer.domElement);

    const loop = () => {
      const run = runRef.current;
      if (!run) return;
      run.material.uniforms.uTime.value = run.clock.getElapsedTime();
      run.renderer.render(scene, camera);
      run.raf = requestAnimationFrame(loop);
    };

    runRef.current = {
      raf: 0,
      renderer,
      material,
      geometry: geom,
      resizeObserver,
      clock,
    };
    runRef.current.raf = requestAnimationFrame(loop);

    return () => {
      const run = runRef.current;
      if (!run) return;
      cancelAnimationFrame(run.raf);
      run.resizeObserver.disconnect();
      run.material.dispose();
      run.geometry.dispose();
      run.renderer.dispose();
      const c = run.renderer.domElement;
      c.parentNode?.removeChild(c);
      runRef.current = null;
    };
  }, [active]);

  return <div ref={mountRef} className={className} aria-hidden />;
}
