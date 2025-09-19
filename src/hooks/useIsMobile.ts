import { useEffect, useState } from "react";

/**
 * Returns true when viewport width is below the given Tailwind md breakpoint (default 768px).
 * Uses matchMedia when available and falls back to resize listener.
 */
export default function useIsMobile(breakpoint = 768): boolean {
  const getInit = () => {
    if (typeof window === "undefined") return false;
    return window.innerWidth < breakpoint;
  };

  const [isMobile, setIsMobile] = useState<boolean>(getInit);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const query = `(max-width: ${breakpoint - 1}px)`;
    const mql = window.matchMedia(query);

    const update = () => setIsMobile(mql.matches || window.innerWidth < breakpoint);
    const onChange = () => update();

    // Initial sync
    update();

    // Prefer modern API, fallback for older browsers
    if ('addEventListener' in mql) {
      mql.addEventListener("change", onChange as EventListener);
    } else if ('addListener' in mql) {
      (mql as unknown as { addListener(cb: (e?: unknown) => void): void }).addListener(onChange);
    }

    const onResize = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener("resize", onResize, { passive: true });

    return () => {
      if ('removeEventListener' in mql) {
        mql.removeEventListener("change", onChange as EventListener);
      } else if ('removeListener' in mql) {
        (mql as unknown as { removeListener(cb: (e?: unknown) => void): void }).removeListener(onChange);
      }
      window.removeEventListener("resize", onResize);
    };
  }, [breakpoint]);

  return isMobile;
}
