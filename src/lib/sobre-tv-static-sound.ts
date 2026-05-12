let sharedCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (sharedCtx) return sharedCtx;
  const Ctx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!Ctx) return null;
  sharedCtx = new Ctx();
  return sharedCtx;
}

/** Chamar após gesto do utilizador (ex. desmutar) para destravar autoplay do Web Audio. */
export async function resumeSobreTvAudioContext(): Promise<void> {
  const ctx = getAudioContext();
  if (!ctx || ctx.state !== "suspended") return;
  try {
    await ctx.resume();
  } catch {
    /* ignore */
  }
}

/**
 * Ruído curto + envelope (estática de TV). Falha silenciosamente se Web Audio não existir.
 */
export function playSobreTvStaticGlitchSound(volume = 0.2): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const dur = 0.14;
  const sampleRate = ctx.sampleRate;
  const n = Math.max(1, Math.floor(sampleRate * dur));
  const buf = ctx.createBuffer(1, n, sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < n; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / n) ** 0.35;
  }

  const src = ctx.createBufferSource();
  src.buffer = buf;
  const gain = ctx.createGain();
  const t0 = ctx.currentTime;
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(
    Math.max(0.0002, volume),
    t0 + 0.012,
  );
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(gain);
  gain.connect(ctx.destination);
  src.start(t0);
  src.stop(t0 + dur + 0.02);
}
