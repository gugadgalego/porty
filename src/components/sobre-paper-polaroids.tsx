import Image from "next/image";
import { SobreScrollReveal } from "@/components/sobre-scroll-reveal";
import { cn } from "@/lib/utils";

const CARD_SIZE = "h-[308px] w-[409px] shrink-0";

/** Hover conjunto no `group`: endireita com curva suave. */
const TILT =
  "pointer-events-auto transition-transform duration-500 ease-out";

/** Desktop: foto de trás (grupo) — ligeiramente à esquerda do layout Paper original. */
const GROUP_DESKTOP_TRANSLATE = "translate(162px, 7.231px)";

const STAGGER_MS = 480;

/**
 * Sombra só no “invólucro” sem `overflow-hidden`; a moldura branca recorta a foto noutro nó.
 * Evita artefactos ao scroll (Chrome compõe mal inset+outer+overflow+transform no mesmo elemento).
 */
function PolaroidCard({
  src,
  alt,
  tiltClass,
}: {
  src: string;
  alt: string;
  tiltClass: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-visible",
        CARD_SIZE,
        TILT,
        tiltClass,
        "origin-top-left select-none",
      )}
      draggable={false}
    >
      <div className="relative h-full w-full shadow-[0_14px_32px_-8px_rgba(0,0,0,0.2)]">
        <div className="relative h-full w-full overflow-hidden border-[12px] border-white bg-neutral-100">
          <Image
            src={src}
            alt={alt}
            fill
            className="pointer-events-none object-cover select-none [-webkit-user-drag:none] [-webkit-touch-callout:none]"
            sizes="409px"
            quality={90}
            draggable={false}
          />
        </div>
      </div>
    </div>
  );
}

type Props = {
  /** Igual à timeline: só observa o viewport depois do primeiro scroll. */
  scrollUnlocked: boolean;
  className?: string;
};

/**
 * Fotos Paper (409×308), largura máx. da timeline (600px); overflow visível para sombras/rotação.
 * Hover: `group` no conjunto — as duas endireitam em conjunto com transição longa e suave.
 */
export function SobrePaperPolaroids({ scrollUnlocked, className }: Props) {
  return (
    <div className={cn("w-full max-w-[600px] overflow-visible", className)}>
      {/* Mobile */}
      <div className="group relative mx-auto flex min-h-[340px] w-full max-w-[600px] justify-center overflow-visible sm:hidden">
        <SobreScrollReveal
          scrollUnlocked={scrollUnlocked}
          revealDelayMs={STAGGER_MS}
          revealMotion="fade"
          className="relative z-0 -translate-x-2"
        >
          <PolaroidCard
            src="/sobre/paper/group.jpg"
            alt=""
            tiltClass="-rotate-2 group-hover:rotate-0"
          />
        </SobreScrollReveal>
        <SobreScrollReveal
          scrollUnlocked={scrollUnlocked}
          revealDelayMs={0}
          revealMotion="fade"
          className="absolute left-1/2 top-14 z-10 flex h-[308px] w-[409px] -translate-x-1/2 justify-center"
        >
          <PolaroidCard
            src="/sobre/paper/bench.jpg"
            alt=""
            tiltClass="rotate-[2deg] group-hover:rotate-0"
          />
        </SobreScrollReveal>
      </div>

      {/* sm+ — reveal no retângulo do cartão (como os <article> da TL), não em inset-0 */}
      <div className="relative mx-auto hidden h-[431px] w-full max-w-[600px] overflow-visible sm:block">
        <div className="group relative mx-auto h-full w-full max-w-[600px]">
          <div
            className="absolute left-0 top-0 z-0"
            style={{ transform: GROUP_DESKTOP_TRANSLATE }}
          >
            <SobreScrollReveal
              scrollUnlocked={scrollUnlocked}
              revealDelayMs={STAGGER_MS}
              revealMotion="fade"
              className={cn(CARD_SIZE)}
            >
              <PolaroidCard
                src="/sobre/paper/group.jpg"
                alt=""
                tiltClass="-rotate-2 group-hover:rotate-0"
              />
            </SobreScrollReveal>
          </div>
          <div
            className="absolute left-0 top-0 z-10"
            style={{ transform: "translate(5.499px, 115.957px)" }}
          >
            <SobreScrollReveal
              scrollUnlocked={scrollUnlocked}
              revealDelayMs={0}
              revealMotion="fade"
              className={cn(CARD_SIZE)}
            >
              <PolaroidCard
                src="/sobre/paper/bench.jpg"
                alt=""
                tiltClass="rotate-[2deg] group-hover:rotate-0"
              />
            </SobreScrollReveal>
          </div>
        </div>
      </div>
    </div>
  );
}
