/**
 * Mini pub/sub para sincronizar a entrada de UI "supporting" (ex.: PullTab)
 * com a coreografia da página principal.
 *
 * `page.tsx` chama `markChromeReady()` após a animação de intro terminar;
 * componentes globais hospedados no layout (fora do fluxo do `page`) se
 * inscrevem via `subscribeChromeReady` para só entrar em cena depois disso.
 */

type Listener = () => void;

let ready = false;
const listeners = new Set<Listener>();

export function markChromeReady(): void {
  if (ready) return;
  ready = true;
  for (const fn of listeners) fn();
}

export function resetChromeReady(): void {
  ready = false;
}

export function isChromeReady(): boolean {
  return ready;
}

export function subscribeChromeReady(fn: Listener): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
