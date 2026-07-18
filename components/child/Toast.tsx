"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function useToast(): { toast: string | null; showToast: (message: string) => void } {
  const [toast, setToast] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((message: string) => {
    setToast(message);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), 2600);
  }, []);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  return { toast, showToast };
}

export function Toast({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div
      role="status"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-zinc-900 px-5 py-2 text-sm font-medium text-white shadow-lg"
    >
      {message}
    </div>
  );
}
