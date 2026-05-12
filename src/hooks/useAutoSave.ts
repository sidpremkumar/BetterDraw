import { useRef, useCallback } from "react";

export function useAutoSave(
  saveFn: (data: string) => Promise<void>,
  delayMs = 2500
) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestDataRef = useRef<string | null>(null);

  const scheduleAutoSave = useCallback(
    (data: string) => {
      latestDataRef.current = data;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(async () => {
        if (latestDataRef.current) {
          await saveFn(latestDataRef.current);
        }
      }, delayMs);
    },
    [saveFn, delayMs]
  );

  const flushSave = useCallback(async () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (latestDataRef.current) {
      await saveFn(latestDataRef.current);
      latestDataRef.current = null;
    }
  }, [saveFn]);

  return { scheduleAutoSave, flushSave };
}
