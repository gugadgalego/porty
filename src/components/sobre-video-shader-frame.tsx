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
import { cn } from "@/lib/utils";

/** Ficheiro em `public/videos/`. */
const VIDEO_SRC = "/videos/sobre-dijon.mp4";

const VIDEO_MEDIA_STORAGE_KEY = "porty:sobre:sobre-dijon:mediaTime";

function collectSobreDijonVideos(): HTMLVideoElement[] {
  if (typeof document === "undefined") return [];
  return [...document.querySelectorAll("video")].filter(
    (v) =>
      v.src.includes("sobre-dijon") ||
      (v.currentSrc.length > 0 && v.currentSrc.includes("sobre-dijon")),
  );
}

function readStoredMediaTime(): number | null {
  if (typeof sessionStorage === "undefined") return null;
  const raw = sessionStorage.getItem(VIDEO_MEDIA_STORAGE_KEY);
  if (raw == null) return null;
  const n = Number.parseFloat(raw);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function writeStoredMediaTime(t: number) {
  if (typeof sessionStorage === "undefined") return;
  if (!Number.isFinite(t) || t < 0) return;
  sessionStorage.setItem(VIDEO_MEDIA_STORAGE_KEY, String(t));
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
 * ou ao navegar para outra rota (`pagehide`) — não durante a reprodução.
 */
export type SobreVideoShaderFrameProps = {
  /** Quando o utilizador está noutro “slide” (CoverFlow): pausa e liberta CPU; o nó mantém-se montado. */
  presentationHidden?: boolean;
};

export function SobreVideoShaderFrame({
  presentationHidden = false,
}: SobreVideoShaderFrameProps) {
  const audioVideoRef = useRef<HTMLVideoElement>(null);
  const wasPlayingBeforeHideRef = useRef(false);
  const [muted, setMuted] = useState(false);
  const [frameHovered, setFrameHovered] = useState(false);
  const [muteFocused, setMuteFocused] = useState(false);

  const showMuteControl = frameHovered || muteFocused;

  const toggleMute = useCallback(() => {
    const el = audioVideoRef.current;
    if (!el) return;
    const next = !el.muted;
    el.muted = next;
    if (!next) el.volume = Math.max(el.volume, 0.35);
    setMuted(next);
  }, []);

  useEffect(() => {
    const el = audioVideoRef.current;
    if (!el) return;
    el.volume = Math.max(el.volume, 0.35);
    const p = el.play();
    if (p === undefined) return;
    p.catch(() => {
      el.muted = true;
      setMuted(true);
      void el.play().catch(() => {});
    });
  }, []);

  const applyStoredOrSyncedTime = useCallback((master?: HTMLVideoElement) => {
    const primary = master ?? audioVideoRef.current;
    if (!primary) return;
    const stored = readStoredMediaTime();
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
    }
  }, []);

  useEffect(() => {
    const el = audioVideoRef.current;
    if (!el) return;

    const onLoaded = () => {
      applyStoredOrSyncedTime(el);
    };
    el.addEventListener("loadeddata", onLoaded);
    if (el.readyState >= 1) onLoaded();

    const onPageHide = () => writeStoredMediaTime(el.currentTime);
    window.addEventListener("pagehide", onPageHide);

    return () => {
      el.removeEventListener("loadeddata", onLoaded);
      window.removeEventListener("pagehide", onPageHide);
      writeStoredMediaTime(el.currentTime);
    };
  }, [applyStoredOrSyncedTime]);

  useEffect(() => {
    const videos = collectSobreDijonVideos();
    const primary = audioVideoRef.current;
    if (presentationHidden) {
      if (primary && !primary.paused) wasPlayingBeforeHideRef.current = true;
      else if (primary) wasPlayingBeforeHideRef.current = false;
      for (const v of videos) {
        try {
          void v.pause();
        } catch {
          /* ignore */
        }
      }
      return;
    }

    const t = primary?.currentTime;
    if (primary != null && t != null && Number.isFinite(t)) {
      for (const v of videos) {
        if (v !== primary)
          try {
            v.currentTime = t;
          } catch {
            /* ignore */
          }
      }
    }

    if (!wasPlayingBeforeHideRef.current || !primary) return;
    void primary.play().catch(() => {});
  }, [presentationHidden]);

  return (
    <div
      className="relative isolate size-full min-h-0 overflow-hidden rounded-[inherit] bg-black"
      style={{ cursor: SHADER_FRAME_CURSOR }}
      onMouseEnter={() => setFrameHovered(true)}
      onMouseLeave={() => setFrameHovered(false)}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url(/images/shader-frame-bg.png)" }}
      />

      {/* Áudio: mesmo ficheiro que o `VideoTexture`; visual vem só do canvas. */}
      <video
        ref={audioVideoRef}
        className="pointer-events-none absolute left-0 top-0 h-px w-px opacity-0"
        aria-hidden
        src={VIDEO_SRC}
        autoPlay
        muted={muted}
        loop
        playsInline
      />

      <Shader
        className="relative z-0 flex size-full min-h-0 flex-col [&>canvas]:block [&>canvas]:min-h-0 [&>canvas]:w-full [&>canvas]:flex-1"
        colorSpace="srgb"
      >
        <VideoTexture
          id={MAIN_VIDEO_TEX_ID}
          url={VIDEO_SRC}
          objectFit="cover"
          loop
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
