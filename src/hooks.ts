import { useEffect } from "react";
import { useState } from "react";

export const useAsyncMemo = <T>(
  asyncFn: () => Promise<T>,
  dependencies: any[]
): T | undefined => {
  const [value, setValue] = useState<T | undefined>();

  useEffect(() => {
    let isMounted = true;

    asyncFn().then((result) => {
      if (isMounted) setValue(result);
    });

    return () => {
      isMounted = false;
    };
  }, dependencies);

  return value;
};
