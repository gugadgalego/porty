"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Volume as VolumeX, Volume3 } from "pixelarticons/react";
import {
  Shader,
  CRTScreen,
  CursorTrail,
  ImageTexture,
  Pixelate,
  Spherize,
  VideoTexture,
  VHS,
} from "shaders/react";
import { Button } from "@/components/ui/button";
import { resumeSobreTvAudioContext } from "@/lib/sobre-tv-static-sound";
import { cn } from "@/lib/utils";

function mediaStorageKey(videoSrc: string): string {
  return `porty:sobre:mediaTime:${videoSrc}`;
}

/** Marca o `<video>` de áudio controlado por React. */
const ATTR_PORTY_SOBRE_AUDIO = "data-porty-sobre-audio";

/**
 * O `VideoTexture` do pacote `shaders` cria um `<video>` em memória **fora** do DOM — não dá para
 * alinhar `currentTime` ao áudio. Anexamos esses elementos a um contentor oculto (patch temporário
 * de `document.createElement`) só enquanto este componente está montado.
 */
const ATTR_PORTY_SHADER_INTERNAL_VIDEO = "data-porty-shaders-internal-video";

/** Contentor onde o patch anexa os `<video>` criados por `document.createElement` (escopo para não apanhar outros vídeos da página). */
const ATTR_PORTY_PROBE_HOST = "data-porty-sobre-shader-probe-host";

/** Áudio segue o relógio da textura (imagem no canvas); após F5 o áudio pode restaurar primeiro. */
const AV_SYNC_DRIFT_SEC = 0.1;
const AV_SYNC_INTERVAL_MS = 120;

function installPortyShaderVideoProbe(host: HTMLElement): () => void {
  const orig = document.createElement.bind(document);
  const patched = (tagName: string, options?: unknown) => {
    const el = orig(tagName, options as never);
    if (String(tagName).toLowerCase() === "video") {
      try {
        (el as HTMLVideoElement).setAttribute(ATTR_PORTY_SHADER_INTERNAL_VIDEO, "");
        host.appendChild(el as Node);
      } catch {
        /* ignore */
      }
    }
    return el;
  };
  document.createElement = patched as typeof document.createElement;
  return () => {
    document.createElement = orig;
  };
}

function getPortyAudioVideo(): HTMLVideoElement | null {
  if (typeof document === "undefined") return null;
  return document.querySelector<HTMLVideoElement>(
    `video[${ATTR_PORTY_SOBRE_AUDIO}]`,
  );
}

function getProbeHost(): HTMLElement | null {
  if (typeof document === "undefined") return null;
  return document.querySelector(`[${ATTR_PORTY_PROBE_HOST}]`);
}

/**
 * O core do `VideoTexture` cria **dois** `<video>`: um placeholder e o da `loadVideo` (ver
 * `VideoTexture-D9XxE1Hw.js`). Ambos são capturados pelo patch — o ativo é o **último** no host.
 */
function listShaderInternalVideos(): HTMLVideoElement[] {
  const host = getProbeHost();
  if (!host) return [];
  return Array.from(
    host.querySelectorAll<HTMLVideoElement>(
      `video[${ATTR_PORTY_SHADER_INTERNAL_VIDEO}]`,
    ),
  );
}

function getShaderInternalVideo(): HTMLVideoElement | null {
  const xs = listShaderInternalVideos();
  return xs.at(-1) ?? null;
}

function collectSobreDijonVideos(): HTMLVideoElement[] {
  const a = getPortyAudioVideo();
  const xs = listShaderInternalVideos();
  if (a) return [a, ...xs];
  return xs;
}

/** Relógio de mídia fiável: o `<video>` interno do shader por vezes volta a `currentTime === 0` após pausa. */
function maxPresentationMediaTime(
  audio: HTMLVideoElement | null,
  texture: HTMLVideoElement | null,
  fallback: number,
): number {
  const a = audio?.currentTime;
  const b = texture?.currentTime;
  const na = Number.isFinite(a) ? (a as number) : 0;
  const nb = Number.isFinite(b) ? (b as number) : 0;
  const fb = Number.isFinite(fallback) ? fallback : 0;
  return Math.max(na, nb, fb);
}

function readStoredMediaTime(src: string): number | null {
  if (typeof sessionStorage === "undefined") return null;
  const raw = sessionStorage.getItem(mediaStorageKey(src));
  if (raw == null) return null;
  const n = Number.parseFloat(raw);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function writeStoredMediaTime(src: string, t: number) {
  if (typeof sessionStorage === "undefined") return;
  if (!Number.isFinite(t) || t < 0) return;
  sessionStorage.setItem(mediaStorageKey(src), String(t));
}

function syncAudioAndShaderTextureVideo(audioEl: HTMLVideoElement | null) {
  if (!audioEl) return;
  const texture = getShaderInternalVideo();
  if (!texture || texture === audioEl) return;
  if (!Number.isFinite(texture.duration) || texture.duration <= 0) return;

  const a = audioEl.currentTime;
  const b = texture.currentTime;

  if (a > 0.5 && b + 1 < a) {
    try {
      texture.currentTime = a;
    } catch {
      /* ignore */
    }
    return;
  }

  if (texture.paused || audioEl.paused) return;
  if (texture.readyState < 2) return;
  if (Math.abs(a - b) <= AV_SYNC_DRIFT_SEC) return;
  try {
    audioEl.currentTime = b;
  } catch {
    /* ignore */
  }
}

function applyStoredMediaTimeToVideos(
  primary: HTMLVideoElement | null,
  src: string,
) {
  if (!primary) return;
  const stored = readStoredMediaTime(src);
  const t =
    stored != null
      ? Math.min(stored, primary.duration || stored)
      : primary.currentTime;
  if (stored != null && Number.isFinite(t)) {
    primary.currentTime = t;
    for (const v of collectSobreDijonVideos()) {
      if (v !== primary)
        try {
          v.currentTime = t;
        } catch {
          /* ignore */
        }
    }
    syncAudioAndShaderTextureVideo(primary);
  }
}

/** Textura oculta para o mapa de `pixelSize` do CRT (substitui a 2.ª ImageTexture do preset). */
const MAP_TEXTURE_ID = "portyCrtMapTex";
const MAP_TEXTURE_URL =
  "https://data.shaders.com/storage/v1/object/public/user-uploaded-images/user_3CfsWiRipzJElZrstKNHEySeuqn/tckqF__gsYjA.png";

const MAIN_VIDEO_TEX_ID = "portyMainVideoTex";

/** Cursor personalizado sobre o canvas do shader (16×16; canto quente no vértice do ponteiro). */
const SHADER_FRAME_CURSOR =
  "url('/cursors/sobre-video-shader.png') 0 0, auto";

/** Mão “clique” no botão de som (16×16; canto quente na ponta do dedo). */
const MUTE_BUTTON_CURSOR =
  "url('/cursors/mute-button-pointer.png') 8 1, pointer";

/**
 * Vídeo processado **no** canvas WebGL (`VideoTexture` + efeitos), limitado ao contentor
 * (tamanho do pai, `rounded-[inherit]`, `overflow-hidden`).
 * O `VideoTexture` do pacote `shaders` cria o elemento `<video>` internamente a partir de `url`;
 * mantemos um `<video>` escondido com o mesmo `src` só para áudio e mute (API do pacote não expõe mute).
 *
 * O som tenta iniciar ligado; muitos browsers bloqueiam autoplay com áudio — nesse caso voltamos a muted.
 *
 * O tempo em `sessionStorage` só é gravado ao sair da página Sobre (desmontagem), ao fechar o separador
 * ou ao navegar para outra rota (`pagehide`) — não durante a reprodução. A chave inclui o URL do vídeo.
 */
export type SobreVideoShaderFrameProps = {
  /** Caminho público do vídeo (ex. `/videos/clip.mp4`). */
  videoSrc: string;
  /** Primeira frame / metadados prontos — para atrasar legenda fora do shader. */
  onMediaReady?: () => void;
  /**
   * Atenuação com o scroll: 0 = volume normal, 1 = quase silêncio (apenas se não muted).
   */
  volumeAttenuation?: number;
  /** Quando falso e há `onClipEnded`, o evento `ended` do áudio dispara a troca de clip. */
  loop?: boolean;
  /** Chamado quando o clip termina (só relevante com `loop={false}`). */
  onClipEnded?: () => void;
  /**
   * Quando o frame está oculto (ex. outro slide ativo): pausa e liberta CPU; o nó mantém-se montado.
   */
  presentationHidden?: boolean;
};

export function SobreVideoShaderFrame({
  videoSrc,
  onMediaReady,
  volumeAttenuation = 0,
  loop = true,
  onClipEnded,
  presentationHidden = false,
}: SobreVideoShaderFrameProps) {
  const audioVideoRef = useRef<HTMLVideoElement>(null);
  const probeCleanupRef = useRef<(() => void) | null>(null);
  const mediaReadySentRef = useRef(false);
  const onMediaReadyRef = useRef(onMediaReady);
  onMediaReadyRef.current = onMediaReady;
  const onClipEndedRef = useRef(onClipEnded);
  onClipEndedRef.current = onClipEnded;
  const wasPlayingBeforeHideRef = useRef(false);
  /** Instantâneo ao ocultar o frame — evita usar `currentTime` da textura a 0 após pausa. */
  const presentationResumeTimeRef = useRef(0);
  const [muted, setMuted] = useState(false);
  const [frameHovered, setFrameHovered] = useState(false);
  const [muteFocused, setMuteFocused] = useState(false);

  const showMuteControl = frameHovered || muteFocused;

  const connectProbeHost = useCallback((node: HTMLDivElement | null) => {
    probeCleanupRef.current?.();
    probeCleanupRef.current = null;
    if (!node) return;
    probeCleanupRef.current = installPortyShaderVideoProbe(node);
  }, []);

  useEffect(
    () => () => {
      probeCleanupRef.current?.();
      probeCleanupRef.current = null;
    },
    [],
  );

  const toggleMute = useCallback(() => {
    const el = audioVideoRef.current;
    if (!el) return;
    const next = !el.muted;
    el.muted = next;
    if (!next) {
      void resumeSobreTvAudioContext();
      const t = Math.min(1, Math.max(0, volumeAttenuation));
      const hi = 0.44;
      const lo = 0.045;
      el.volume = lo + (hi - lo) * (1 - t * 0.94);
    }
    setMuted(next);
  }, [volumeAttenuation]);

  useEffect(() => {
    const el = audioVideoRef.current;
    if (!el || muted) return;
    const t = Math.min(1, Math.max(0, volumeAttenuation));
    const hi = 0.44;
    const lo = 0.045;
    el.volume = lo + (hi - lo) * (1 - t * 0.94);
  }, [muted, volumeAttenuation]);

  useEffect(() => {
    const el = audioVideoRef.current;
    if (!el) return;
    const t = Math.min(1, Math.max(0, volumeAttenuation));
    const hi = 0.44;
    const lo = 0.045;
    el.volume = lo + (hi - lo) * (1 - t * 0.94);
    const p = el.play();
    if (p === undefined) return;
    p.catch(() => {
      el.muted = true;
      setMuted(true);
      void el.play().catch(() => {});
    });
  }, [videoSrc]);

  useEffect(() => {
    const el = audioVideoRef.current;
    if (!el) return;

    mediaReadySentRef.current = false;

    const persistTime = () => {
      const a = audioVideoRef.current;
      const tt = getShaderInternalVideo();
      writeStoredMediaTime(
        videoSrc,
        maxPresentationMediaTime(a, tt, 0),
      );
    };

    const onLoaded = () => {
      applyStoredMediaTimeToVideos(el, videoSrc);
      requestAnimationFrame(() => syncAudioAndShaderTextureVideo(el));
      window.setTimeout(() => syncAudioAndShaderTextureVideo(el), 320);
      if (!mediaReadySentRef.current) {
        mediaReadySentRef.current = true;
        queueMicrotask(() => onMediaReadyRef.current?.());
      }
    };
    el.addEventListener("loadeddata", onLoaded);
    if (el.readyState >= 1) onLoaded();

    const onPageHide = () => persistTime();
    window.addEventListener("pagehide", onPageHide);

    return () => {
      el.removeEventListener("loadeddata", onLoaded);
      window.removeEventListener("pagehide", onPageHide);
      persistTime();
    };
  }, [videoSrc]);

  useEffect(() => {
    const videos = collectSobreDijonVideos();
    const primary = audioVideoRef.current;
    if (presentationHidden) {
      if (primary && !primary.paused) wasPlayingBeforeHideRef.current = true;
      else if (primary) wasPlayingBeforeHideRef.current = false;

      presentationResumeTimeRef.current = maxPresentationMediaTime(
        primary,
        getShaderInternalVideo(),
        presentationResumeTimeRef.current,
      );

      for (const v of videos) {
        try {
          void v.pause();
        } catch {
          /* ignore */
        }
      }
      return;
    }

    const texture = getShaderInternalVideo();
    const seekRaw = maxPresentationMediaTime(
      primary,
      texture,
      presentationResumeTimeRef.current,
    );
    const dur =
      primary != null &&
      Number.isFinite(primary.duration) &&
      primary.duration > 0
        ? primary.duration
        : null;
    const seekT = dur != null ? Math.min(seekRaw, dur) : seekRaw;
    presentationResumeTimeRef.current = seekT;

    for (const v of videos) {
      const cap =
        Number.isFinite(v.duration) && v.duration > 0 ? v.duration : null;
      const t = cap != null ? Math.min(seekT, cap) : seekT;
      try {
        v.currentTime = t;
      } catch {
        /* ignore */
      }
    }
    syncAudioAndShaderTextureVideo(primary ?? null);

    if (!wasPlayingBeforeHideRef.current || !primary) return;

    const tt = getShaderInternalVideo();
    void tt?.play().catch(() => {});
    void primary.play().catch(() => {});

    requestAnimationFrame(() => {
      syncAudioAndShaderTextureVideo(primary);
      window.setTimeout(() => syncAudioAndShaderTextureVideo(primary), 160);
      window.setTimeout(() => syncAudioAndShaderTextureVideo(primary), 420);
    });
  }, [presentationHidden]);

  useEffect(() => {
    if (presentationHidden) return;
    const tick = () => syncAudioAndShaderTextureVideo(audioVideoRef.current);
    tick();
    const id = window.setInterval(tick, AV_SYNC_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [videoSrc, presentationHidden]);

  useEffect(() => {
    const el = audioVideoRef.current;
    if (!el || loop || !onClipEnded) return;
    const onEnded = () => {
      onClipEndedRef.current?.();
    };
    el.addEventListener("ended", onEnded);
    return () => el.removeEventListener("ended", onEnded);
  }, [videoSrc, loop, onClipEnded]);

  return (
    <div
      className="relative isolate size-full min-h-0 overflow-hidden rounded-[inherit] [corner-shape:inherit] bg-black"
      style={{ cursor: SHADER_FRAME_CURSOR }}
      onMouseEnter={() => setFrameHovered(true)}
      onMouseLeave={() => setFrameHovered(false)}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url(/images/shader-frame-bg.png)" }}
      />

      <video
        ref={audioVideoRef}
        {...{ [ATTR_PORTY_SOBRE_AUDIO]: "" }}
        className="pointer-events-none absolute left-0 top-0 h-px w-px opacity-0"
        aria-hidden
        src={videoSrc}
        autoPlay
        muted={muted}
        loop={loop}
        playsInline
      />

      {/*
        O patch tem de estar ativo **antes** do `<Shader>` montar: o `VideoTexture` chama
        `createElement("video")` no init (placeholder) e outra vez em `loadVideo` (setTimeout 0).
        Depois do áudio: assim o nosso `<video>` não é capturado pelo patch.
      */}
      <div
        ref={connectProbeHost}
        {...{ [ATTR_PORTY_PROBE_HOST]: "" }}
        className="pointer-events-none absolute left-0 top-0 -z-10 h-px w-px overflow-hidden opacity-0"
        aria-hidden
      />

      <Shader
        className="relative z-0 flex size-full min-h-0 flex-col [&>canvas]:block [&>canvas]:min-h-0 [&>canvas]:w-full [&>canvas]:flex-1"
        colorSpace="srgb"
      >
        <VideoTexture
          id={MAIN_VIDEO_TEX_ID}
          url={videoSrc}
          objectFit="cover"
          loop={loop}
        />
        <ImageTexture
          id={MAP_TEXTURE_ID}
          objectFit="contain"
          url={MAP_TEXTURE_URL}
          visible={false}
        />
        <Pixelate>
          <CursorTrail
            colorA="#ffffff"
            colorB="#262626"
            visible={true}
          />
        </Pixelate>
        <CRTScreen
          pixelSize={{
            type: "map",
            source: MAP_TEXTURE_ID,
            channel: "alpha",
            inputMax: 1,
            inputMin: 0,
            outputMax: 128,
            outputMin: 8,
          }}
          visible={true}
        />
        <VHS
          visible={true}
          wobble={{
            axis: "y",
            type: "mouse",
            outputMax: 5,
            outputMin: 0,
          }}
        />
        <Spherize depth={0.2} radius={2.2} visible={false} />
      </Shader>

      <Button
        type="button"
        variant="outline"
        size="icon-xs"
        onClick={toggleMute}
        onFocus={() => setMuteFocused(true)}
        onBlur={() => setMuteFocused(false)}
        style={{ cursor: MUTE_BUTTON_CURSOR }}
        className={cn(
          "absolute right-2 bottom-2 z-20 rounded-none border-white/25 bg-black/55 text-white shadow-sm backdrop-blur-sm",
          "transition-[opacity,transform,colors] duration-200 ease-out",
          "hover:bg-black/75 hover:text-white focus-visible:border-white/40 focus-visible:ring-white/80",
          showMuteControl
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none translate-y-1 opacity-0",
        )}
        aria-label={muted ? "Ligar som do vídeo" : "Desligar som do vídeo"}
        aria-pressed={!muted}
      >
        {muted ? (
          <VolumeX className="size-3" aria-hidden />
        ) : (
          <Volume3 className="size-3" aria-hidden />
        )}
      </Button>
    </div>
  );
}
