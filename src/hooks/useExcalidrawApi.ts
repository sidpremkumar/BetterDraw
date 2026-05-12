import { useState, useCallback } from "react";

export function useExcalidrawApi() {
  const [api, setApi] = useState<any>(null);

  const onApiReady = useCallback((apiInstance: any) => {
    setApi(apiInstance);
  }, []);

  return { api, onApiReady };
}
