import { useEffect, useRef } from "react";
import type { EventCallback } from "@tauri-apps/api/event";
import { onBackendEvent } from "@/lib/ipc";

/**
 * Subscribe to a Rust-emitted Tauri event for the lifetime of the component.
 * Handles the async listen/unlisten lifecycle and avoids leaking subscriptions.
 */
export function useBackendEvent<T>(name: string, handler: EventCallback<T>) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    let unlisten: UnlistenFn | undefined;
    let cancelled = false;

    onBackendEvent<T>(name, (event) => handlerRef.current(event)).then((fn) => {
      if (cancelled) fn();
      else unlisten = fn;
    });

    return () => {
      cancelled = true;
      unlisten?.();
    };
  }, [name]);
}

type UnlistenFn = () => void;
