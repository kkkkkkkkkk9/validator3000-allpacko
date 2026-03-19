"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface RealtimeScreen {
  id: string;
  html_content: string;
}

/**
 * Subscribes to Supabase Realtime on the screens table for a given org.
 * Returns a map of screen IDs to their latest html_content, only for
 * screens that have been updated since the component mounted.
 */
export function useRealtimeScreens(organizationId: string) {
  const [updates, setUpdates] = useState<Record<string, string>>({});
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`screens:${organizationId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "screens",
          filter: `organization_id=eq.${organizationId}`,
        },
        (payload) => {
          const row = payload.new as RealtimeScreen;
          if (row.id && row.html_content !== undefined) {
            setUpdates((prev) => ({ ...prev, [row.id]: row.html_content }));
          }
        },
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [organizationId]);

  return updates;
}
