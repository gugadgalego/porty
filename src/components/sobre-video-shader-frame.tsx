"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { SpeakerHigh, SpeakerSimpleSlash } from "@phosphor-icons/react/dist/ssr";
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

/** Ficheiro em `public/videos/`. */
const VIDEO_SRC = "/videos/sobre-dijon.mp4";

/** Textura oculta para o mapa de `pixelSize` do CRT (substitui a 2.ª ImageTexture do preset). */
const MAP_TEXTURE_ID = "portyCrtMapTex";
const MAP_TEXTURE_URL =
  "https://data.shaders.com/storage/v1/object/public/user-uploaded-images/user_3CfsWiRipzJElZrstKNHEySeuqn/tckqF__gsYjA.png";

const MAIN_VIDEO_TEX_ID = "portyMainVideoTex";

/**
 * Vídeo processado **no** canvas WebGL (`VideoTexture` + efeitos), limitado ao contentor
 * (tamanho do pai, `rounded-[inherit]`, `overflow-hidden`).
 * O `VideoTexture` do pacote `shaders` cria o elemento `<video>` internamente a partir de `url`;
 * mantemos um `<video>` escondido com o mesmo `src` só para áudio e mute (API do pacote não expõe mute).
 */
export function SobreVideoShaderFrame() {
  const audioVideoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);

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
    void el.play().catch(() => {});
  }, []);

  return (
    <div className="relative isolate size-full min-h-0 overflow-hidden rounded-[inherit] bg-black">
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

      <button
        type="button"
        onClick={toggleMute}
        className="absolute right-3 bottom-3 z-20 flex size-10 items-center justify-center rounded-full border border-white/25 bg-black/55 text-white shadow-md backdrop-blur-sm transition-colors hover:bg-black/75 focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:outline-none"
        aria-label={muted ? "Ligar som do vídeo" : "Desligar som do vídeo"}
        aria-pressed={!muted}
      >
        {muted ? (
          <SpeakerSimpleSlash className="size-5" weight="bold" aria-hidden />
        ) : (
          <SpeakerHigh className="size-5" weight="bold" aria-hidden />
        )}
      </button>
    </div>
  );
}
