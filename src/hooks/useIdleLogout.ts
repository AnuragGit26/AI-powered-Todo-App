import { useCallback, useEffect, useRef, useState } from 'react';

interface IdleOptions {
  idleMs?: number; // total idle time before auto-logout
  warningMs?: number; // show warning this long before timeout
  onWarn?: (remainingMs: number) => void;
  onTimeout?: () => void;
}

export function useIdleLogout({
  idleMs = 30 * 60 * 1000, // 30 minutes
  warningMs = 60 * 1000, // 1 minute
  onWarn,
  onTimeout,
}: IdleOptions = {}) {
  const [isWarning, setIsWarning] = useState(false);
  const [remainingMs, setRemainingMs] = useState<number>(warningMs);

  const lastActivityRef = useRef<number>(Date.now());
  const warnTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timeoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimers = useCallback(() => {
    if (warnTimerRef.current) clearTimeout(warnTimerRef.current);
    if (timeoutTimerRef.current) clearTimeout(timeoutTimerRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    warnTimerRef.current = null;
    timeoutTimerRef.current = null;
    countdownIntervalRef.current = null;
  }, []);

  const scheduleTimers = useCallback(() => {
    clearTimers();

    const now = Date.now();
    const elapsed = now - lastActivityRef.current;

    const warnAt = Math.max(0, idleMs - warningMs - elapsed);
    const timeoutAt = Math.max(0, idleMs - elapsed);

    // Schedule warning
    warnTimerRef.current = setTimeout(() => {
      setIsWarning(true);
      setRemainingMs(Math.max(0, timeoutAt - warnAt));
      if (onWarn) onWarn(warningMs);

      // Start countdown each second
      countdownIntervalRef.current = setInterval(() => {
        setRemainingMs(prev => {
          const next = Math.max(0, prev - 1000);
          return next;
        });
      }, 1000);
    }, warnAt);

    // Schedule timeout
    timeoutTimerRef.current = setTimeout(() => {
      setIsWarning(false);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      if (onTimeout) onTimeout();
    }, timeoutAt);
  }, [clearTimers, idleMs, onTimeout, onWarn, warningMs]);

  const markActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    setIsWarning(false);
    setRemainingMs(warningMs);
    scheduleTimers();
  }, [scheduleTimers, warningMs]);

  const extendSession = useCallback(() => {
    markActivity();
  }, [markActivity]);

  useEffect(() => {
    scheduleTimers();
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        markActivity();
      }
    };

    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    const options: AddEventListenerOptions = { passive: true };
    events.forEach(evt => window.addEventListener(evt, markActivity, options));
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      events.forEach(evt => window.removeEventListener(evt, markActivity));
      document.removeEventListener('visibilitychange', onVisibility);
      clearTimers();
    };
  }, [clearTimers, markActivity, scheduleTimers]);

  return {
    isWarning,
    remainingMs,
    extendSession,
    markActivity,
  };
}
