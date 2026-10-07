"use client";

import { useSyncExternalStore } from "react";
import { useStore } from "@/lib/store";

const subscribe = (cb: () => void) => useStore.persist.onFinishHydration(cb);
const getSnapshot = () => useStore.persist.hasHydrated();
const getServerSnapshot = () => false;

export function useHydrated() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
