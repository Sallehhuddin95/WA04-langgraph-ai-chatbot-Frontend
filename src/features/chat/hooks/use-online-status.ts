"use client";

import * as React from "react";

export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = React.useState<boolean>(() =>
    typeof navigator === "undefined" ? true : navigator.onLine,
  );

  React.useEffect(() => {
    function handleOnline(): void {
      setIsOnline(true);
    }
    function handleOffline(): void {
      setIsOnline(false);
    }
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOnline;
}
