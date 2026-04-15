import { useEffect } from "react";
import { listen } from "@tauri-apps/api/event";

export function useTabKey(onPress?: () => void, onRelease?: () => void) {
  useEffect(() => {
    const unlistenPress = onPress
      ? listen("tab_pressed", onPress)
      : Promise.resolve(() => {});

    const unlistenRelease = onRelease
      ? listen("tab_released", onRelease)
      : Promise.resolve(() => {});

    return () => {
      unlistenPress.then((f) => f());
      unlistenRelease.then((f) => f());
    };
  }, [onPress, onRelease]);
}
