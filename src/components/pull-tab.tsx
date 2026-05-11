"use client";

import * as React from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import {
  CaretLeft,
  CaretRight,
  DotsSixVertical,
  Keyhole,
  MoonStars,
  ReadCvLogo,
  Sun,
} from "@phosphor-icons/react/dist/ssr";
import { useLanguage } from "@/components/providers/language-provider";
import { cn } from "@/lib/utils";
import { isChromeReady, subscribeChromeReady } from "@/lib/ui-chrome";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { animate, motion, useMotionValue } from "motion/react";

/**
 * Pull tab flutuante inspirado no PiP do iOS.
 *
 * Estados:
 *  - collapsed: encolhido, grudado num canto.
 *  - expanded:  toolbar flutuante em qualquer lugar.
 *
 * Interações:
 *  - Tap (sem arrastar)   → abre no canto atual, com 48px de padding.
 *  - Drag lento           → arrasta livre; se entrar na hitbox de canto, cola
 *                           e colapsa; se solta fora, fica flutuando livre.
 *  - Flick (velocidade)   → arremessa para o canto na direção do movimento
 *                           (mesmo de longe) e colapsa com bounce.
 *
 * Arrasto além da viewport: overscroll em Motion Values (`x`/`y`) com
 * `animate()` para voltar a zero em spring ao soltar — feeling próximo ao UIKit.
 */

type Corner = "top-left" | "top-right" | "bottom-left" | "bottom-right";
type Mode = "collapsed" | "expanded";

const STORAGE_KEY = "porty.pullTab.v2";

/** JSON sem `userPlaced` (formato antigo): uma vez migra para topo-direita; depois lê-se o guardado. */
type StoredPullTab = {
  userPlaced?: boolean;
  mode?: Mode;
  corner?: Corner;
  floatX?: number | null;
  floatY?: number | null;
};

const COLLAPSED_W = 32;
const COLLAPSED_H = 48;
const EXPANDED_W = 160;
const EXPANDED_H = 32;

/** Distância vertical do canto enquanto colapsado (o lado encosta na borda). */
const COLLAPSED_VERTICAL_MARGIN = 24;
/** Margem usada ao abrir via tap — a barra fica colada ao canto com 48px de folga. */
const TAP_OPEN_MARGIN = 48;

/** Tamanho do imã em cada canto (em px a partir da esquina). */
const CORNER_HIT_SIZE = 140;
/**
 * Dead-zone em px — deslocamento do ponteiro precisa ultrapassar isso para
 * que a interação seja considerada arraste e NÃO um clique.  Aumentado em
 * relação ao valor anterior (5 -> 9) porque tremores naturais de mouse/touch
 * dentro de ~5px eram interpretados como drag, engolindo cliques.
 */
const DRAG_THRESHOLD_PX = 9;

/**
 * Detecção de flick:
 *  - velocidade mínima (px/ms) para considerar arremesso
 *  - quanto tempo olhar para trás nos samples (janela)
 *  - quanto no futuro projetar a trajetória para escolher o canto alvo
 */
const FLICK_MIN_SPEED_PX_MS = 0.6;
const FLICK_SAMPLE_WINDOW_MS = 100;
const FLICK_PROJECTION_MS = 320;
const DRAG_STRETCH_MAX = 0.145;
const DRAG_ROTATE_MAX_DEG = 8;
const DRAG_VELOCITY_FOR_MAX_STRETCH = 1.8;
const SHAKE_MIN_SPEED_PX_MS = 0.55;
const SHAKE_FLIP_WINDOW_MS = 160;
const SHAKE_TRIGGER_FLIPS = 3;
const SHAKE_DECAY_MS = 220;
const SHAKE_STRETCH_BOOST = 0.055;
const SHAKE_ROTATE_BOOST_DEG = 3.2;
/** Arrasto para fora da borda: resistência + limite (px) antes do spring de volta. */
const OVERSCROLL_RESISTANCE = 0.38;
const OVERSCROLL_CAP = 76;

/** Spring só no overscroll — soltar “cospe” de volta à borda com leve inércia. */
const SPRING_OVERFLOW_RELEASE = {
  type: "spring" as const,
  stiffness: 440,
  damping: 34,
  mass: 0.76,
};
const DROP_OVERSHOOT_MS = 90;
const DROP_MIN_SPEED_PX_MS = 0.08;

/** Ancoragem do ponteiro sobre o handle de drag quando o modo expande mid-drag. */
const EXPANDED_DRAG_ANCHOR = { x: 16, y: 16 };

/** Cantos da pull-tab — zero raio (retângulo rente à borda). */
const CORNER_RADIUS_PX = 0;

/** Springs estilo UIKit — stiff + damping moderado, leve “carrying momentum”. */
const SPRING_SNAP = {
  type: "spring" as const,
  stiffness: 520,
  damping: 36,
  mass: 0.88,
};
const SPRING_SNAP_QUICK = {
  type: "spring" as const,
  stiffness: 680,
  damping: 40,
  mass: 0.78,
};
const SPRING_SIZE = {
  type: "spring" as const,
  stiffness: 410,
  damping: 32,
  mass: 0.92,
};
const SPRING_SIZE_QUICK = {
  type: "spring" as const,
  stiffness: 520,
  damping: 36,
  mass: 0.82,
};
const SPRING_RADIUS = {
  type: "spring" as const,
  stiffness: 360,
  damping: 34,
  mass: 0.95,
};
const SPRING_RADIUS_QUICK = {
  type: "spring" as const,
  stiffness: 460,
  damping: 36,
  mass: 0.88,
};
/** Entrada (opacity + escala global) e settle após largar o stretch do drag. */
const SPRING_ENTRANCE = {
  type: "spring" as const,
  stiffness: 320,
  damping: 22,
  mass: 1,
};
const SPRING_RELEASE_ROTATE = {
  type: "spring" as const,
  stiffness: 580,
  damping: 42,
  mass: 0.82,
};

const TRANSITION_INSTANT = { duration: 0 };

const PULLTAB_TOOLTIP_DELAY_MS = 650;

function subscribePullTabReducedMotion(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {};
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", onStoreChange);
  return () => mq.removeEventListener("change", onStoreChange);
}

function getPullTabReducedMotionSnapshot() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

const CORNERS: readonly Corner[] = [
  "top-left",
  "top-right",
  "bottom-left",
  "bottom-right",
] as const;

function isCorner(v: unknown): v is Corner {
  return typeof v === "string" && (CORNERS as readonly string[]).includes(v);
}
function isMode(v: unknown): v is Mode {
  return v === "collapsed" || v === "expanded";
}

function collapsedCornerPos(corner: Corner, vw: number, vh: number) {
  const edge = corner.endsWith("left") ? "left" : "right";
  const half = corner.startsWith("top") ? "top" : "bottom";
  const x = edge === "left" ? 0 : vw - COLLAPSED_W;
  const y =
    half === "top"
      ? COLLAPSED_VERTICAL_MARGIN
      : vh - COLLAPSED_H - COLLAPSED_VERTICAL_MARGIN;
  return { x, y };
}

function hitCorner(
  x: number,
  y: number,
  vw: number,
  vh: number,
): Corner | null {
  const left = x < CORNER_HIT_SIZE;
  const right = x > vw - CORNER_HIT_SIZE;
  const top = y < CORNER_HIT_SIZE;
  const bottom = y > vh - CORNER_HIT_SIZE;
  if (top && left) return "top-left";
  if (top && right) return "top-right";
  if (bottom && left) return "bottom-left";
  if (bottom && right) return "bottom-right";
  return null;
}

function nearestCorner(
  cx: number,
  cy: number,
  vw: number,
  vh: number,
): Corner {
  const isLeft = cx < vw / 2;
  const isTop = cy < vh / 2;
  if (isTop && isLeft) return "top-left";
  if (isTop) return "top-right";
  if (isLeft) return "bottom-left";
  return "bottom-right";
}

function cornerExpandedPos(
  corner: Corner,
  vw: number,
  vh: number,
  margin: number,
) {
  const edge = corner.endsWith("left") ? "left" : "right";
  const half = corner.startsWith("top") ? "top" : "bottom";
  const x = edge === "left" ? margin : vw - EXPANDED_W - margin;
  const y = half === "top" ? margin : vh - EXPANDED_H - margin;
  return { x, y };
}

function clampInViewport(
  x: number,
  y: number,
  w: number,
  h: number,
  vw: number,
  vh: number,
) {
  return {
    x: Math.min(Math.max(x, 0), Math.max(0, vw - w)),
    y: Math.min(Math.max(y, 0), Math.max(0, vh - h)),
  };
}

/** Deslocamento visível além da borda (dedo segue com resistência; Motion faz o snap). */
function dampOverscroll(delta: number): number {
  if (delta === 0) return 0;
  const sign = Math.sign(delta);
  const resisted = Math.abs(delta) * OVERSCROLL_RESISTANCE;
  return sign * Math.min(OVERSCROLL_CAP, resisted);
}

type DragVisual = {
  scaleX: number;
  scaleY: number;
  rotateDeg: number;
};

const IDLE_DRAG_VISUAL: DragVisual = { scaleX: 1, scaleY: 1, rotateDeg: 0 };

export function PullTab() {
  const [mounted, setMounted] = React.useState(false);
  const [mode, setMode] = React.useState<Mode>("collapsed");
  const [corner, setCorner] = React.useState<Corner>("top-right");
  /** `true` após o utilizador arrastar a tab — só então persistimos canto/float entre visitas. */
  const [userPlaced, setUserPlaced] = React.useState(false);
  const [floatPos, setFloatPos] = React.useState<{
    x: number;
    y: number;
  } | null>(null);
  const [pos, setPos] = React.useState<{ x: number; y: number } | null>(null);
  const [dragging, setDragging] = React.useState(false);
  const [snapping, setSnapping] = React.useState(false);
  const [dragVisual, setDragVisual] = React.useState<DragVisual>(
    IDLE_DRAG_VISUAL,
  );
  const [quickOpen, setQuickOpen] = React.useState(false);
  const quickOpenTimerRef = React.useRef<number | null>(null);
  /** Sinal de "chrome da página já carregou" — só então o tab faz entrada dramática. */
  const revealed = React.useSyncExternalStore(
    subscribeChromeReady,
    isChromeReady,
    () => false,
  );
  const prefersReducedMotion = React.useSyncExternalStore(
    subscribePullTabReducedMotion,
    getPullTabReducedMotionSnapshot,
    () => false,
  );
  /** Incrementa a cada troca de modo para re-disparar a animação de squish. */
  const [pulseKey, setPulseKey] = React.useState(0);
  /** Nó raiz fixo da pull-tab (não desmonta), usado para pointer-capture estável. */
  const rootRef = React.useRef<HTMLDivElement | null>(null);

  /** Overscroll em translate — posição `left`/`top` fica sempre clampada ao viewport. */
  const overflowX = useMotionValue(0);
  const overflowY = useMotionValue(0);
  const overflowAnimRef = React.useRef<{ stop: () => void } | null>(null);

  const stopOverflowAnim = React.useCallback(() => {
    overflowAnimRef.current?.stop();
    overflowAnimRef.current = null;
  }, []);

  const resetOverflow = React.useCallback(() => {
    stopOverflowAnim();
    overflowX.set(0);
    overflowY.set(0);
  }, [overflowX, overflowY, stopOverflowAnim]);

  const settleOverflowSpring = React.useCallback(() => {
    stopOverflowAnim();
    if (prefersReducedMotion) {
      overflowX.set(0);
      overflowY.set(0);
      return;
    }
    const ax = animate(overflowX, 0, SPRING_OVERFLOW_RELEASE);
    const ay = animate(overflowY, 0, SPRING_OVERFLOW_RELEASE);
    overflowAnimRef.current = {
      stop: () => {
        ax.stop();
        ay.stop();
      },
    };
  }, [prefersReducedMotion, overflowX, overflowY, stopOverflowAnim]);

  React.useEffect(() => () => stopOverflowAnim(), [stopOverflowAnim]);

  const modeRef = React.useRef(mode);
  const cornerRef = React.useRef(corner);
  const floatRef = React.useRef(floatPos);
  React.useEffect(() => {
    modeRef.current = mode;
  }, [mode]);
  React.useEffect(() => {
    cornerRef.current = corner;
  }, [corner]);
  React.useEffect(() => {
    floatRef.current = floatPos;
  }, [floatPos]);

  const dragRef = React.useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    grabX: number;
    grabY: number;
    moved: boolean;
    /** Ação de tap associada ao handle que iniciou o gesto. */
    onTap?: () => void;
    /** Samples recentes para calcular velocidade de flick. */
    samples: Array<{ t: number; x: number; y: number }>;
    /** Estado para detectar "sacudidas" (mudança rápida de direção). */
    lastVisualT: number;
    lastVxSign: -1 | 0 | 1;
    flipCount: number;
    lastFlipT: number;
    shakeEnergy: number;
  } | null>(null);

  const { locale, toggleLocale, dictionary } = useLanguage();
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = mounted && resolvedTheme === "dark";

  React.useEffect(() => {
    let loadedUserPlaced = false;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as StoredPullTab;
        const isLegacy = typeof parsed.userPlaced !== "boolean";

        const applySavedLayout = () => {
          if (isCorner(parsed.corner)) setCorner(parsed.corner);
          if (isMode(parsed.mode)) setMode(parsed.mode);
          if (
            typeof parsed.floatX === "number" &&
            typeof parsed.floatY === "number"
          ) {
            setFloatPos({ x: parsed.floatX, y: parsed.floatY });
          }
        };

        if (parsed.userPlaced === true) {
          loadedUserPlaced = true;
          applySavedLayout();
        } else if (isLegacy) {
          setCorner("top-right");
          setMode("collapsed");
          setFloatPos(null);
        } else {
          applySavedLayout();
        }
      }
    } catch {
      /* ignore */
    }
    setUserPlaced(loadedUserPlaced);
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (!mounted) return;
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          userPlaced,
          mode,
          corner,
          floatX: floatPos?.x ?? null,
          floatY: floatPos?.y ?? null,
        } satisfies StoredPullTab),
      );
    } catch {
      /* ignore */
    }
  }, [mounted, userPlaced, mode, corner, floatPos]);

  React.useEffect(() => {
    return () => {
      if (quickOpenTimerRef.current !== null) {
        window.clearTimeout(quickOpenTimerRef.current);
      }
    };
  }, []);

  /** Calcula posição de repouso quando nada está sendo arrastado. */
  const syncToRest = React.useCallback(() => {
    if (typeof window === "undefined") return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    if (modeRef.current === "collapsed") {
      setPos(collapsedCornerPos(cornerRef.current, vw, vh));
      return;
    }
    const fp =
      floatRef.current ??
      cornerExpandedPos(cornerRef.current, vw, vh, TAP_OPEN_MARGIN);
    const clamped = clampInViewport(
      fp.x,
      fp.y,
      EXPANDED_W,
      EXPANDED_H,
      vw,
      vh,
    );
    setPos(clamped);
    if (
      !floatRef.current ||
      clamped.x !== fp.x ||
      clamped.y !== fp.y
    ) {
      setFloatPos(clamped);
    }
  }, []);

  React.useEffect(() => {
    if (!mounted) return;
    if (dragging) return;
    syncToRest();
  }, [mounted, dragging, mode, corner, floatPos, syncToRest]);

  React.useEffect(() => {
    if (!mounted) return;
    const onResize = () => {
      if (!dragRef.current) syncToRest();
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [mounted, syncToRest]);

  const beginDrag = (
    e: React.PointerEvent<HTMLElement>,
    onTap?: () => void,
  ) => {
    if (!pos) return;
    resetOverflow();
    setDragVisual(IDLE_DRAG_VISUAL);
    const captureTarget = rootRef.current ?? e.currentTarget;
    try {
      captureTarget.setPointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      grabX: e.clientX - pos.x,
      grabY: e.clientY - pos.y,
      moved: false,
      onTap,
      samples: [{ t: e.timeStamp, x: e.clientX, y: e.clientY }],
      lastVisualT: e.timeStamp,
      lastVxSign: 0,
      flipCount: 0,
      lastFlipT: e.timeStamp,
      shakeEnergy: 0,
    };
  };

  const moveDrag = (e: React.PointerEvent<HTMLElement>) => {
    const info = dragRef.current;
    if (!info || info.pointerId !== e.pointerId) return;
    // Grava sample para cálculo de velocidade (janela deslizante).
    info.samples.push({ t: e.timeStamp, x: e.clientX, y: e.clientY });
    const cutoff = e.timeStamp - FLICK_SAMPLE_WINDOW_MS;
    while (info.samples.length > 2 && info.samples[0].t < cutoff) {
      info.samples.shift();
    }
    const prevSample = info.samples[info.samples.length - 2];
    const instDt = prevSample ? Math.max(1, e.timeStamp - prevSample.t) : 1;
    const instVx = prevSample ? (e.clientX - prevSample.x) / instDt : 0;
    const instVy = prevSample ? (e.clientY - prevSample.y) / instDt : 0;
    const dtVisual = Math.max(1, e.timeStamp - info.lastVisualT);
    info.lastVisualT = e.timeStamp;
    info.shakeEnergy *= Math.exp(-dtVisual / SHAKE_DECAY_MS);
    const vxSign: -1 | 0 | 1 =
      instVx > 0.02 ? 1 : instVx < -0.02 ? -1 : 0;
    if (vxSign !== 0 && Math.abs(instVx) >= SHAKE_MIN_SPEED_PX_MS) {
      if (
        info.lastVxSign !== 0 &&
        vxSign !== info.lastVxSign &&
        e.timeStamp - info.lastFlipT <= SHAKE_FLIP_WINDOW_MS
      ) {
        info.flipCount += 1;
      } else {
        info.flipCount = 1;
      }
      info.lastVxSign = vxSign;
      info.lastFlipT = e.timeStamp;
      if (info.flipCount >= SHAKE_TRIGGER_FLIPS) {
        info.shakeEnergy = Math.min(1, info.shakeEnergy + 0.55);
        info.flipCount = 0;
      }
    }

    const dx = e.clientX - info.startX;
    const dy = e.clientY - info.startY;
    if (!info.moved) {
      if (dx * dx + dy * dy < DRAG_THRESHOLD_PX * DRAG_THRESHOLD_PX) return;
      info.moved = true;
      setDragging(true);
    }

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const hit = hitCorner(e.clientX, e.clientY, vw, vh);
    const nextMode: Mode = hit ? "collapsed" : "expanded";

    if (nextMode !== modeRef.current) {
      if (nextMode === "expanded") {
        // Reancora o ponteiro no handle de drag da barra — bar "floresce" sob o cursor.
        info.grabX = EXPANDED_DRAG_ANCHOR.x;
        info.grabY = EXPANDED_DRAG_ANCHOR.y;
      }
      // Refs precisam atualizar NA MESMA rodada dos pointer events — se só o
      // useEffect atualizar modeRef depois do paint, vários pointermove chegam
      // com modeRef ainda "collapsed" e este bloco re-executa a cada frame,
      // resetando grabX/grabY e travando o arraste saindo do canto.
      modeRef.current = nextMode;
      setMode(nextMode);
      setPulseKey((k) => k + 1);
    }

    if (hit) {
      if (!snapping) setSnapping(true);
      cornerRef.current = hit;
      setCorner(hit);
      resetOverflow();
      setPos(collapsedCornerPos(hit, vw, vh));
      setDragVisual(IDLE_DRAG_VISUAL);
      return;
    }

    if (snapping) setSnapping(false);
    const rawX = e.clientX - info.grabX;
    const rawY = e.clientY - info.grabY;
    const maxX = Math.max(0, vw - EXPANDED_W);
    const maxY = Math.max(0, vh - EXPANDED_H);
    const clampedX = Math.min(Math.max(rawX, 0), maxX);
    const clampedY = Math.min(Math.max(rawY, 0), maxY);
    overflowX.set(dampOverscroll(rawX - clampedX));
    overflowY.set(dampOverscroll(rawY - clampedY));
    setPos({ x: clampedX, y: clampedY });
    setFloatPos(
      clampInViewport(clampedX, clampedY, EXPANDED_W, EXPANDED_H, vw, vh),
    );

    const speed = Math.hypot(instVx, instVy);
    const norm = Math.min(speed / DRAG_VELOCITY_FOR_MAX_STRETCH, 1);
    if (norm <= 0.01 && info.shakeEnergy < 0.01) {
      setDragVisual(IDLE_DRAG_VISUAL);
      return;
    }
    const stretch = DRAG_STRETCH_MAX * norm + info.shakeEnergy * SHAKE_STRETCH_BOOST;
    const dominantX = Math.abs(instVx) >= Math.abs(instVy);
    const scaleMajor = 1 + stretch;
    const scaleMinor = Math.max(0.86, 1 - stretch * 0.72);
    const wobble =
      info.shakeEnergy * SHAKE_ROTATE_BOOST_DEG * Math.sin(e.timeStamp / 22);
    const rotateDeg = Math.max(
      -DRAG_ROTATE_MAX_DEG,
      Math.min(
        DRAG_ROTATE_MAX_DEG,
        (instVx / DRAG_VELOCITY_FOR_MAX_STRETCH) * DRAG_ROTATE_MAX_DEG * 0.65 +
          wobble,
      ),
    );
    setDragVisual({
      scaleX: dominantX ? scaleMajor : scaleMinor,
      scaleY: dominantX ? scaleMinor : scaleMajor,
      rotateDeg,
    });
  };

  /**
   * Calcula velocidade (px/ms) a partir dos samples. Usa janela deslizante
   * curta para captar apenas o movimento dos últimos ~100ms antes do release.
   */
  const computeVelocity = (
    samples: Array<{ t: number; x: number; y: number }>,
  ) => {
    if (samples.length < 2) return { vx: 0, vy: 0, speed: 0 };
    const first = samples[0];
    const last = samples[samples.length - 1];
    const dt = last.t - first.t;
    if (dt <= 0) return { vx: 0, vy: 0, speed: 0 };
    const vx = (last.x - first.x) / dt;
    const vy = (last.y - first.y) / dt;
    return { vx, vy, speed: Math.hypot(vx, vy) };
  };

  const endDrag = (e: React.PointerEvent<HTMLElement>) => {
    const info = dragRef.current;
    if (!info || info.pointerId !== e.pointerId) return;
    dragRef.current = null;
    const captureTarget = rootRef.current ?? e.currentTarget;
    try {
      captureTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    if (!info.moved) {
      info.onTap?.();
      setDragging(false);
      setSnapping(false);
      setDragVisual(IDLE_DRAG_VISUAL);
      return;
    }

    setUserPlaced(true);
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const { vx, vy, speed } = computeVelocity(info.samples);
    const alreadyInHitbox = hitCorner(e.clientX, e.clientY, vw, vh) !== null;
    let dropKick: { x: number; y: number } | null = null;
    let dropSettle: { x: number; y: number } | null = null;

    // Flick: velocidade alta e ponteiro NÃO em hitbox → arremessa para o canto
    // na direção do movimento, mesmo que esteja longe dele agora.
    if (speed > FLICK_MIN_SPEED_PX_MS && !alreadyInHitbox) {
      const currentW = modeRef.current === "expanded" ? EXPANDED_W : COLLAPSED_W;
      const currentH = modeRef.current === "expanded" ? EXPANDED_H : COLLAPSED_H;
      const centerX = e.clientX - info.grabX + currentW / 2;
      const centerY = e.clientY - info.grabY + currentH / 2;
      const projectedX = centerX + vx * FLICK_PROJECTION_MS;
      const projectedY = centerY + vy * FLICK_PROJECTION_MS;
      const target = nearestCorner(projectedX, projectedY, vw, vh);
      cornerRef.current = target;
      modeRef.current = "collapsed";
      setCorner(target);
      setMode("collapsed");
      setPulseKey((k) => k + 1);
      setPos(collapsedCornerPos(target, vw, vh));
    }

    if (!alreadyInHitbox && modeRef.current === "expanded") {
      const settle = clampInViewport(
        e.clientX - info.grabX,
        e.clientY - info.grabY,
        EXPANDED_W,
        EXPANDED_H,
        vw,
        vh,
      );
      floatRef.current = settle;
      setFloatPos(settle);
      if (speed >= DROP_MIN_SPEED_PX_MS) {
        const kick = clampInViewport(
          settle.x + vx * DROP_OVERSHOOT_MS,
          settle.y + vy * DROP_OVERSHOOT_MS,
          EXPANDED_W,
          EXPANDED_H,
          vw,
          vh,
        );
        const travel = Math.hypot(kick.x - settle.x, kick.y - settle.y);
        if (travel > 1) {
          dropKick = kick;
          dropSettle = settle;
          setPos(kick);
        } else {
          setPos(settle);
        }
      } else {
        setPos(settle);
      }
    }

    setDragging(false);
    setSnapping(false);
    setDragVisual(IDLE_DRAG_VISUAL);
    if (info.moved) {
      settleOverflowSpring();
    }
    if (dropKick && dropSettle) {
      requestAnimationFrame(() => {
        setPos(dropSettle);
      });
    }
    // Demais casos: estado (mode, corner, floatPos, pos) já reflete a última
    // posição do drag — se estiver na hitbox fica colapsado lá, se estiver
    // flutuando fica onde soltou.
  };

  const cancelDrag = (e: React.PointerEvent<HTMLElement>) => {
    const info = dragRef.current;
    if (!info || info.pointerId !== e.pointerId) return;
    dragRef.current = null;
    const captureTarget = rootRef.current ?? e.currentTarget;
    try {
      captureTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    setDragging(false);
    setSnapping(false);
    setDragVisual(IDLE_DRAG_VISUAL);
    resetOverflow();
    syncToRest();
  };

  const handleLostPointerCapture = (e: React.PointerEvent<HTMLElement>) => {
    const info = dragRef.current;
    if (!info || info.pointerId !== e.pointerId) return;
    dragRef.current = null;
    setDragging(false);
    setSnapping(false);
    setDragVisual(IDLE_DRAG_VISUAL);
    resetOverflow();
    syncToRest();
  };

  const handleCollapsedTap = () => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    // Tap sempre reabre no canto atual com 48px de folga — ignora posição
    // flutuante anterior para dar um comportamento previsível ao usuário.
    const fp = cornerExpandedPos(cornerRef.current, vw, vh, TAP_OPEN_MARGIN);
    if (quickOpenTimerRef.current !== null) {
      window.clearTimeout(quickOpenTimerRef.current);
    }
    setQuickOpen(true);
    quickOpenTimerRef.current = window.setTimeout(() => {
      setQuickOpen(false);
      quickOpenTimerRef.current = null;
    }, 240);
    modeRef.current = "expanded";
    floatRef.current = fp;
    setFloatPos(fp);
    setMode("expanded");
    setPulseKey((k) => k + 1);
  };

  const handleExpandedTap = () => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const current = pos ?? floatRef.current;
    const nearest = current
      ? nearestCorner(
          current.x + EXPANDED_W / 2,
          current.y + EXPANDED_H / 2,
          vw,
          vh,
        )
      : cornerRef.current;
    cornerRef.current = nearest;
    modeRef.current = "collapsed";
    setCorner(nearest);
    setMode("collapsed");
    setPulseKey((k) => k + 1);
  };

  if (!mounted || !pos) return null;

  const edge = corner.endsWith("left") ? "left" : "right";
  const isExpanded = mode === "expanded";

  /**
   * Transição ligada sempre que:
   *  - não está arrastando (repouso / animação final), ou
   *  - está arrastando mas dentro de uma hitbox (snap magnético).
   * Em arraste livre, layout segue o ponteiro sem spring; opacidade/entrada
   * continuam com física suave quando aplicável.
   */
  const transitionOn = !dragging || snapping;
  const snapSpring = quickOpen ? SPRING_SNAP_QUICK : SPRING_SNAP;
  const sizeSpring = quickOpen ? SPRING_SIZE_QUICK : SPRING_SIZE;
  const radiusSpring = quickOpen ? SPRING_RADIUS_QUICK : SPRING_RADIUS;

  const transition = prefersReducedMotion
    ? {
        left: TRANSITION_INSTANT,
        top: TRANSITION_INSTANT,
        width: TRANSITION_INSTANT,
        height: TRANSITION_INSTANT,
        borderTopLeftRadius: TRANSITION_INSTANT,
        borderTopRightRadius: TRANSITION_INSTANT,
        borderBottomLeftRadius: TRANSITION_INSTANT,
        borderBottomRightRadius: TRANSITION_INSTANT,
        opacity: TRANSITION_INSTANT,
        scaleX: TRANSITION_INSTANT,
        scaleY: TRANSITION_INSTANT,
        rotate: TRANSITION_INSTANT,
      }
    : {
        opacity: SPRING_ENTRANCE,
        scaleX: dragging ? TRANSITION_INSTANT : SPRING_ENTRANCE,
        scaleY: dragging ? TRANSITION_INSTANT : SPRING_ENTRANCE,
        rotate: dragging ? TRANSITION_INSTANT : SPRING_RELEASE_ROTATE,
        left: transitionOn ? snapSpring : TRANSITION_INSTANT,
        top: transitionOn ? snapSpring : TRANSITION_INSTANT,
        width: transitionOn ? sizeSpring : TRANSITION_INSTANT,
        height: transitionOn ? sizeSpring : TRANSITION_INSTANT,
        borderTopLeftRadius: transitionOn ? radiusSpring : TRANSITION_INSTANT,
        borderTopRightRadius: transitionOn ? radiusSpring : TRANSITION_INSTANT,
        borderBottomLeftRadius: transitionOn ? radiusSpring : TRANSITION_INSTANT,
        borderBottomRightRadius: transitionOn ? radiusSpring : TRANSITION_INSTANT,
      };

  /** Origem do transform: cola à borda docada quando colapsado — parece "crescer da parede". */
  const transformOrigin = isExpanded
    ? "center center"
    : edge === "right"
      ? "100% 50%"
      : "0% 50%";
  const revealScale = revealed ? 1 : 0.25;
  const visualScaleX = dragging ? dragVisual.scaleX : 1;
  const visualScaleY = dragging ? dragVisual.scaleY : 1;
  const visualRotate = dragging ? dragVisual.rotateDeg : 0;

  const cornerRadii = isExpanded
    ? {
        tl: CORNER_RADIUS_PX,
        tr: CORNER_RADIUS_PX,
        bl: CORNER_RADIUS_PX,
        br: CORNER_RADIUS_PX,
      }
    : edge === "right"
      ? {
          tl: CORNER_RADIUS_PX,
          tr: 0,
          bl: CORNER_RADIUS_PX,
          br: 0,
        }
      : {
          tl: 0,
          tr: CORNER_RADIUS_PX,
          bl: 0,
          br: CORNER_RADIUS_PX,
        };

  const squishTransition = prefersReducedMotion
    ? TRANSITION_INSTANT
    : {
        duration: 0.32,
        times: [0, 0.28, 0.58, 1],
        ease: [
          [0.2, 0.95, 0.25, 1.4],
          [0.2, 0.95, 0.25, 1.4],
          [0.22, 1, 0.36, 1],
          [0.34, 1.56, 0.64, 1],
        ] as [
          [number, number, number, number],
          [number, number, number, number],
          [number, number, number, number],
          [number, number, number, number],
        ],
      };

  const collapsedLabel =
    locale === "pt" ? "Abrir controles" : "Open controls";
  const collapseLabel =
    locale === "pt" ? "Arrastar ou recolher" : "Drag or collapse";
  const themeLabel = isDark
    ? locale === "pt"
      ? "Ativar tema claro"
      : "Switch to light theme"
    : locale === "pt"
    ? "Ativar tema escuro"
    : "Switch to dark theme";
  const cmsLabel =
    locale === "pt" ? "CMS do portfólio" : "Portfolio CMS";
  const cvLabel = locale === "pt" ? "Baixar CV" : "Download CV";

  return (
    <motion.div
      ref={rootRef}
      role="group"
      initial={false}
      animate={{
        left: pos.x,
        top: pos.y,
        width: isExpanded ? EXPANDED_W : COLLAPSED_W,
        height: isExpanded ? EXPANDED_H : COLLAPSED_H,
        borderTopLeftRadius: cornerRadii.tl,
        borderTopRightRadius: cornerRadii.tr,
        borderBottomLeftRadius: cornerRadii.bl,
        borderBottomRightRadius: cornerRadii.br,
        opacity: revealed ? 1 : 0,
        scaleX: revealScale * visualScaleX,
        scaleY: revealScale * visualScaleY,
        rotate: visualRotate,
      }}
      transition={transition}
      aria-hidden={!revealed}
      aria-label={
        locale === "pt" ? "Atalhos do portfólio" : "Portfolio shortcuts"
      }
      onPointerMove={moveDrag}
      onPointerUp={endDrag}
      onPointerCancel={cancelDrag}
      onLostPointerCapture={handleLostPointerCapture}
      style={{
        position: "fixed",
        zIndex: 60,
        transformOrigin,
        x: overflowX,
        y: overflowY,
        pointerEvents: revealed ? undefined : "none",
        touchAction: "none",
      }}
      className={cn(
        "relative flex select-none items-center justify-center overflow-hidden bg-foreground text-background shadow-lg shadow-foreground/20 ring-1 ring-background/10",
        dragging ? "cursor-grabbing" : "",
      )}
    >
      {/* Squash visual na troca de modo — keyframes com easing tipo UIKit. */}
      <motion.span
        key={pulseKey}
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
        style={{
          background:
            "radial-gradient(120% 120% at 50% 50%, color-mix(in oklab, var(--background) 16%, transparent), transparent 60%)",
          transformOrigin: "center center",
        }}
        initial={false}
        animate={
          prefersReducedMotion
            ? { opacity: 0, scaleX: 1, scaleY: 1 }
            : {
                opacity: [0, 1, 0.42, 0],
                scaleX: [0.72, 1.18, 0.94, 1],
                scaleY: [1.22, 0.86, 1.06, 1],
              }
        }
        transition={squishTransition}
      />
      {isExpanded ? (
        <TooltipProvider delayDuration={PULLTAB_TOOLTIP_DELAY_MS}>
          <Tooltip>
            <TooltipTrigger asChild>
              <TabSlot
                aria-label={collapseLabel}
                onPointerDown={(e) => beginDrag(e, handleExpandedTap)}
                draggable
                dragging={dragging}
              >
                <DotsSixVertical size={16} weight="bold" />
              </TabSlot>
            </TooltipTrigger>
            <TooltipContent side="top">{collapseLabel}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <TabSlot
                aria-label={themeLabel}
                onClick={() => setTheme(isDark ? "light" : "dark")}
              >
                {isDark ? (
                  <Sun size={16} weight="regular" />
                ) : (
                  <MoonStars size={16} weight="regular" />
                )}
              </TabSlot>
            </TooltipTrigger>
            <TooltipContent side="top">{themeLabel}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <TabSlot
                aria-label={
                  locale === "pt"
                    ? "Mudar para inglês"
                    : "Mudar para português"
                }
                onClick={toggleLocale}
              >
                <span className="font-mono text-[12px] font-medium leading-none tracking-wide">
                  {dictionary.languageToggle}
                </span>
              </TabSlot>
            </TooltipTrigger>
            <TooltipContent side="top">
              {locale === "pt" ? "English" : "Português"}
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <TabSlot asChild aria-label={cvLabel}>
                <a href="/cv.pdf" download aria-label={cvLabel}>
                  <ReadCvLogo size={16} weight="regular" />
                </a>
              </TabSlot>
            </TooltipTrigger>
            <TooltipContent side="top">{cvLabel}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <TabSlot asChild aria-label={cmsLabel}>
                <Link href="/admin" prefetch={false}>
                  <Keyhole size={16} weight="regular" />
                </Link>
              </TabSlot>
            </TooltipTrigger>
            <TooltipContent side="top">{cmsLabel}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        <TabSlot
          className="size-full"
          aria-label={collapsedLabel}
          onPointerDown={(e) => beginDrag(e, handleCollapsedTap)}
          draggable
          dragging={dragging}
        >
          {edge === "right" ? (
            <CaretLeft size={16} weight="regular" />
          ) : (
            <CaretRight size={16} weight="regular" />
          )}
        </TabSlot>
      )}
    </motion.div>
  );
}

type TabSlotProps = React.ComponentProps<typeof Button> & {
  draggable?: boolean;
  dragging?: boolean;
};

/**
 * Slot sobre `bg-foreground` — `inverse-ghost` alinha hover/foco ao texto de fundo.
 */
function TabSlot({
  className,
  draggable,
  dragging,
  ...props
}: TabSlotProps) {
  return (
    <Button
      variant="inverse-ghost"
      size="icon"
      className={cn(
        "relative z-10",
        draggable && [
          dragging ? "cursor-grabbing" : "cursor-grab",
          "hover:bg-transparent active:translate-y-0",
        ],
        className,
      )}
      {...props}
    />
  );
}
