"use client";

import * as React from "react";
import { markChromeReady } from "@/lib/ui-chrome";

/** Em rotas sem a coreografia da home, liberta a PullTab do `layout` na hora. */
export function ChromeReadyMark() {
  React.useEffect(() => {
    markChromeReady();
  }, []);
  return null;
}
