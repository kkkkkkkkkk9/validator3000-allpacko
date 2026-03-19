"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface UsePrototypeNavOptions {
  screens: { id: string; slug: string }[];
  flows: { id: string; slug: string }[];
  initialFlowId: string;
  initialScreenId: string;
  productSlug: string;
}

export function usePrototypeNav({
  screens,
  flows,
  initialFlowId,
  initialScreenId,
  productSlug,
}: UsePrototypeNavOptions) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeFlowId, setActiveFlowId] = useState(initialFlowId);
  const [activeScreenId, setActiveScreenId] = useState(initialScreenId);

  // Sync activeScreenId from URL search param on mount
  useEffect(() => {
    const screenSlug = searchParams.get("screen");
    if (screenSlug) {
      const found = screens.find((s) => s.slug === screenSlug);
      if (found) {
        setActiveScreenId(found.id);
      }
    }
  }, [searchParams, screens]);

  const goToScreen = useCallback(
    (screenId: string) => {
      const screen = screens.find((s) => s.id === screenId);
      if (screen) {
        setActiveScreenId(screenId);
        // Update URL without navigation
        const flow = flows.find((f) => f.id === activeFlowId);
        if (flow) {
          const url = `/app/products/${productSlug}/flows/${flow.slug}?screen=${screen.slug}`;
          router.replace(url, { scroll: false });
        }
      }
    },
    [screens, flows, activeFlowId, productSlug, router],
  );

  const goToFlow = useCallback(
    (flowId: string) => {
      const flow = flows.find((f) => f.id === flowId);
      if (flow) {
        setActiveFlowId(flowId);
        router.push(`/app/products/${productSlug}/flows/${flow.slug}`);
      }
    },
    [flows, productSlug, router],
  );

  const currentIndex = screens.findIndex((s) => s.id === activeScreenId);

  const nextScreen = useCallback(() => {
    if (currentIndex < screens.length - 1) {
      goToScreen(screens[currentIndex + 1].id);
    }
  }, [currentIndex, screens, goToScreen]);

  const prevScreen = useCallback(() => {
    if (currentIndex > 0) {
      goToScreen(screens[currentIndex - 1].id);
    }
  }, [currentIndex, screens, goToScreen]);

  // Keyboard navigation: Enter = next, Escape = prev
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Do not interfere when user is typing in an input or textarea
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      if (e.key === "Enter") {
        e.preventDefault();
        nextScreen();
      } else if (e.key === "Escape") {
        e.preventDefault();
        prevScreen();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [nextScreen, prevScreen]);

  return {
    activeFlowId,
    activeScreenId,
    goToScreen,
    goToFlow,
    nextScreen,
    prevScreen,
    currentIndex,
    totalScreens: screens.length,
  };
}
