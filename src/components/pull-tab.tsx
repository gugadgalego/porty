"use client";

import * as React from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import {
  CaretLeft,
  CaretRight,
  DotsSixVertical,
  Keyhole,
  Minus,
  MoonStars,
  Plus,
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
 * As transições usam easeOutBack para dar um leve overshoot ("gooey" / bounce).
 */

type Corner = "top-left" | "top-right" | "bottom-left" | "bottom-right";
type Mode = "collapsed" | "expanded";

const STORAGE_KEY = "porty.pullTab.v2";

const COLLAPSED_W = 32;
const COLLAPSED_H = 48;
const EXPANDED_W = 276;
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
const RUBBER_BAND_RESISTANCE = 0.26;
const DRAG_STRETCH_MAX = 0.145;
const DRAG_ROTATE_MAX_DEG = 8;
const DRAG_VELOCITY_FOR_MAX_STRETCH = 1.8;
const SHAKE_MIN_SPEED_PX_MS = 0.55;
const SHAKE_FLIP_WINDOW_MS = 160;
const SHAKE_TRIGGER_FLIPS = 3;
const SHAKE_DECAY_MS = 220;
const SHAKE_STRETCH_BOOST = 0.055;
const SHAKE_ROTATE_BOOST_DEG = 3.2;
const DROP_OVERSHOOT_MS = 90;
const DROP_MIN_SPEED_PX_MS = 0.08;

/** Ancoragem do ponteiro sobre o handle de drag quando o modo expande mid-drag. */
const EXPANDED_DRAG_ANCHOR = { x: 16, y: 16 };

/** Bounce: easeOutBack — dá overshoot. */
const SPRING_EASE = "cubic-bezier(0.34, 1.56, 0.64, 1)";
/** Ease mais contida para border-radius e pequenas transições. */
const SMOOTH_EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const SNAP_MS = 300;
const SIZE_MS = 220;
const RADIUS_MS = 170;
const TAP_OPEN_SNAP_MS = 170;
const TAP_OPEN_SIZE_MS = 130;
const TAP_OPEN_RADIUS_MS = 120;
const PULLTAB_TOOLTIP_DELAY_MS = 650;

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

function rubberBand(value: number, min: number, max: number, resistance: number) {
  if (value < min) return min + (value - min) * resistance;
  if (value > max) return max + (value - max) * resistance;
  return value;
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
  const [corner, setCorner] = React.useState<Corner>("bottom-right");
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
  /** Incrementa a cada troca de modo para re-disparar a animação de squish. */
  const [pulseKey, setPulseKey] = React.useState(0);
  /** Nó raiz fixo da pull-tab (não desmonta), usado para pointer-capture estável. */
  const rootRef = React.useRef<HTMLDivElement | null>(null);

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
    let loadedCorner: Corner | null = null;
    let loadedMode: Mode | null = null;
    let loadedFloat: { x: number; y: number } | null = null;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<{
          mode: Mode;
          corner: Corner;
          floatX: number;
          floatY: number;
        }>;
        if (isCorner(parsed.corner)) loadedCorner = parsed.corner;
        if (isMode(parsed.mode)) loadedMode = parsed.mode;
        if (
          typeof parsed.floatX === "number" &&
          typeof parsed.floatY === "number"
        ) {
          loadedFloat = { x: parsed.floatX, y: parsed.floatY };
        }
      }
    } catch {
      /* ignore */
    }
    // Carregamento único pós-mount (evita hydration mismatch; o componente
    // retorna null enquanto mounted=false, então não há cascata real).
    if (loadedCorner) setCorner(loadedCorner);
    if (loadedMode) setMode(loadedMode);
    if (loadedFloat) setFloatPos(loadedFloat);
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (!mounted) return;
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          mode,
          corner,
          floatX: floatPos?.x ?? null,
          floatY: floatPos?.y ?? null,
        }),
      );
    } catch {
      /* ignore */
    }
  }, [mounted, mode, corner, floatPos]);

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
      setPos(collapsedCornerPos(hit, vw, vh));
      setDragVisual(IDLE_DRAG_VISUAL);
      return;
    }

    if (snapping) setSnapping(false);
    const rawX = e.clientX - info.grabX;
    const rawY = e.clientY - info.grabY;
    const maxX = Math.max(0, vw - EXPANDED_W);
    const maxY = Math.max(0, vh - EXPANDED_H);
    const visualX = rubberBand(rawX, 0, maxX, RUBBER_BAND_RESISTANCE);
    const visualY = rubberBand(rawY, 0, maxY, RUBBER_BAND_RESISTANCE);
    const clamped = clampInViewport(
      rawX,
      rawY,
      EXPANDED_W,
      EXPANDED_H,
      vw,
      vh,
    );
    setPos({ x: visualX, y: visualY });
    setFloatPos(clamped);

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
    syncToRest();
  };

  const handleLostPointerCapture = (e: React.PointerEvent<HTMLElement>) => {
    const info = dragRef.current;
    if (!info || info.pointerId !== e.pointerId) return;
    dragRef.current = null;
    setDragging(false);
    setSnapping(false);
    setDragVisual(IDLE_DRAG_VISUAL);
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
   * Enquanto arrasta em modo livre, NÃO transiciona — barra segue o ponteiro.
   *
   * `opacity` e `transform` ficam sempre com transição (usados pela entrada
   * dramática) — drag não altera eles, então não atrapalha.
   */
  const transitionOn = !dragging || snapping;
  const snapMs = quickOpen ? TAP_OPEN_SNAP_MS : SNAP_MS;
  const sizeMs = quickOpen ? TAP_OPEN_SIZE_MS : SIZE_MS;
  const radiusMs = quickOpen ? TAP_OPEN_RADIUS_MS : RADIUS_MS;
  const entranceTransition = [
    `opacity 320ms ${SMOOTH_EASE}`,
    ...(!dragging ? [`transform 420ms ${SPRING_EASE}`] : []),
  ];
  const transitionStr = transitionOn
    ? [
        `left ${snapMs}ms ${SPRING_EASE}`,
        `top ${snapMs}ms ${SPRING_EASE}`,
        `width ${sizeMs}ms ${SPRING_EASE}`,
        `height ${sizeMs}ms ${SPRING_EASE}`,
        `border-radius ${radiusMs}ms ${SMOOTH_EASE}`,
        ...entranceTransition,
      ].join(", ")
    : entranceTransition.join(", ");

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
    <div
      ref={rootRef}
      role="group"
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
        left: pos.x,
        top: pos.y,
        zIndex: 60,
        width: isExpanded ? EXPANDED_W : COLLAPSED_W,
        height: isExpanded ? EXPANDED_H : COLLAPSED_H,
        opacity: revealed ? 1 : 0,
        transform: `scale(${revealScale}) scaleX(${visualScaleX}) scaleY(${visualScaleY}) rotate(${visualRotate}deg)`,
        transformOrigin,
        pointerEvents: revealed ? undefined : "none",
        transition: transitionStr,
        touchAction: "none",
      }}
      className={cn(
        "relative flex select-none items-center justify-between gap-2 overflow-hidden bg-foreground pl-1 text-background shadow-skeu",
        isExpanded
          ? "rounded-[2px]"
          : edge === "right"
          ? "rounded-l-[2px]"
          : "rounded-r-[2px]",
        dragging ? "cursor-grabbing" : "",
      )}
    >
      {/* Camada de "squish" que pulsa a cada troca de modo — dá o toque gooey.
       * Usa a cor de background (inverso do bar) com opacidade baixa: fica
       * claro no tema claro (bar preta) e escuro no tema escuro (bar clara). */}
      <span
        key={pulseKey}
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit] animate-pulltab-squish"
        style={{
          background:
            "radial-gradient(120% 120% at 50% 50%, color-mix(in oklab, var(--background) 16%, transparent), transparent 60%)",
        }}
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
              <ThemeToggle
                isDark={isDark}
                onToggle={() => setTheme(isDark ? "light" : "dark")}
                label={themeLabel}
              />
            </TooltipTrigger>
            <TooltipContent side="top">{themeLabel}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <LangToggle
                onToggle={toggleLocale}
                label={
                  locale === "pt"
                    ? "Mudar para inglês"
                    : "Mudar para português"
                }
                text={dictionary.languageToggle}
              />
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
    </div>
  );
}

type TabSlotProps = React.ComponentProps<typeof Button> & {
  draggable?: boolean;
  dragging?: boolean;
};

/**
 * Slot de botão da pull-tab — encaminha para o `Button` shadcn com a variante
 * `inverse-ghost`, que é o par correto quando o botão vive sobre uma
 * superfície `bg-foreground` (hover vira `bg-background/10`, ring foca em
 * `background`, textos herdados do container).
 *
 * Quando marcado como `draggable` (handle de drag), cursor vira grab/grabbing
 * e removemos o hover de fundo + o `active:translate-y-px` do Button para
 * evitar jitter de 1px durante o arraste.
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

type ThemeToggleProps = Omit<React.ComponentProps<"button">, "onToggle"> & {
  isDark: boolean;
  onToggle: () => void;
  label: string;
};

/**
 * Sub-pill do tema — o próprio container ganha fundo `bg-background/10` (um
 * degrau de superfície acima do pill principal) e arredondamento `rounded-md`
 * (8px, segue o design system). Dentro: Sol, track/knob, Lua. O ícone do lado
 * ativo fica opaco; o inativo fica apagado.
 */
const ThemeToggle = React.forwardRef<HTMLButtonElement, ThemeToggleProps>(
  function ThemeToggle(
    { isDark, onToggle, label, className, ...props },
    ref,
  ) {
    return (
      <span
        className={cn(
          "relative z-10 flex h-6 shrink-0 items-center gap-1 rounded-md bg-background/10 p-1",
        )}
      >
        <Sun
          aria-hidden
          size={14}
          weight="fill"
          className={cn(
            "shrink-0 transition-opacity duration-200",
            isDark ? "opacity-30" : "opacity-80",
          )}
        />
        <button
          ref={ref}
          type="button"
          role="switch"
          aria-checked={isDark}
          aria-label={label}
          className={cn(
            "relative flex h-4 w-7 shrink-0 items-center rounded-full bg-background/20 p-0.5 transition-colors",
            "shadow-[inset_0_1px_1px_0_rgba(0,0,0,0.25),inset_0_-1px_0_0_rgba(255,255,255,0.08)]",
            "hover:bg-background/30 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-background/60",
            className,
          )}
          {...props}
          onClick={(e) => {
            props.onClick?.(e);
            if (!e.defaultPrevented) onToggle();
          }}
        >
          <span
            aria-hidden
            className={cn(
              "block size-3 rounded-full bg-background transition-transform duration-200 ease-out",
              "shadow-[0_1px_2px_rgba(0,0,0,0.45),inset_0_0.5px_0_0_rgba(255,255,255,0.6)]",
              isDark ? "translate-x-3" : "translate-x-0",
            )}
          />
        </button>
        <MoonStars
          aria-hidden
          size={14}
          weight="fill"
          className={cn(
            "shrink-0 transition-opacity duration-200",
            isDark ? "opacity-80" : "opacity-30",
          )}
        />
      </span>
    );
  },
);

type LangToggleProps = Omit<React.ComponentProps<"button">, "onToggle"> & {
  onToggle: () => void;
  label: string;
  text: string;
};

/**
 * Sub-pill de idioma — visual stepper com `[−] EN [+]`. Clicar no − reduz
 * o tamanho do texto do site, no + aumenta. Clicar no texto dispara toggleLocale.
 * Tamanho persiste em localStorage.
 */
const LangToggle = React.forwardRef<HTMLButtonElement, LangToggleProps>(
  function LangToggle({ onToggle, label, text, className, ...props }, ref) {
    const [fontSize, setFontSize] = React.useState(100);

    React.useEffect(() => {
      try {
        const stored = window.localStorage.getItem("porty.fontSize");
        if (stored) setFontSize(Math.max(75, Math.min(125, parseInt(stored, 10))));
      } catch {
        /* ignore */
      }
    }, []);

    React.useEffect(() => {
      try {
        window.localStorage.setItem("porty.fontSize", String(fontSize));
        const root = document.documentElement;
        root.style.setProperty("--user-font-scale", `${fontSize / 100}`);
      } catch {
        /* ignore */
      }
    }, [fontSize]);

    const handleDecrease = (e: React.MouseEvent) => {
      e.stopPropagation();
      setFontSize((prev) => Math.max(75, prev - 5));
    };

    const handleIncrease = (e: React.MouseEvent) => {
      e.stopPropagation();
      setFontSize((prev) => Math.min(125, prev + 5));
    };

    const handleTextClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      onToggle();
    };

    return (
      <div
        className={cn(
          "relative z-10 flex h-6 w-[72px] shrink-0 items-center justify-between gap-2 rounded-md bg-background/10 p-1",
        )}
      >
        <button
          type="button"
          aria-label="Diminuir tamanho do texto"
          onClick={handleDecrease}
          className="shrink-0 rounded transition-colors hover:bg-background/20 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-background/60 p-0.5"
        >
          <Minus size={14} weight="regular" className="opacity-50" />
        </button>
        <button
          ref={ref}
          type="button"
          aria-label={label}
          onClick={handleTextClick}
          className="shrink-0 font-mono text-[12px] font-medium leading-none tracking-wide transition-colors hover:opacity-70 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-background/60"
          {...props}
        >
          {text}
        </button>
        <button
          type="button"
          aria-label="Aumentar tamanho do texto"
          onClick={handleIncrease}
          className="shrink-0 rounded transition-colors hover:bg-background/20 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-background/60 p-0.5"
        >
          <Plus size={14} weight="regular" className="opacity-50" />
        </button>
      </div>
    );
  },
);
