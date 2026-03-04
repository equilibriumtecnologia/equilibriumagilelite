import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import { useAuth } from "@/contexts/AuthContext";
import { usePalette } from "@/hooks/usePalette";
import { supabase } from "@/integrations/supabase/client";

const PALETTE_KEY = "color-palette";

/**
 * Syncs the theme preference bidirectionally:
 * - On login: loads theme + palette from profiles table
 * - On change: saves theme + palette to profiles table + localStorage
 *
 * The profiles.theme column stores a compound value: "mode:palette"
 * e.g. "dark:midnight-blue", "system:default", "light:ocean-teal"
 */
export function useThemeSync() {
  const { theme, setTheme } = useTheme();
  const { paletteId, setPaletteId } = usePalette();
  const { user } = useAuth();
  const hasLoadedFromDb = useRef(false);
  const previousValue = useRef("");

  const compoundValue = `${theme}:${paletteId}`;

  // Load theme from DB on login
  useEffect(() => {
    if (!user?.id) {
      hasLoadedFromDb.current = false;
      return;
    }

    const loadTheme = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("theme")
        .eq("id", user.id)
        .single();

      if (data?.theme) {
        const parts = data.theme.split(":");
        const savedMode = parts[0] || "system";
        const savedPalette = parts[1] || "default";

        if (savedMode !== theme) setTheme(savedMode);
        if (savedPalette !== paletteId) setPaletteId(savedPalette);
        previousValue.current = `${savedMode}:${savedPalette}`;
      }
      hasLoadedFromDb.current = true;
    };

    loadTheme();
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Save theme to DB on change
  useEffect(() => {
    if (!user?.id || !hasLoadedFromDb.current) return;
    if (compoundValue === previousValue.current) return;
    previousValue.current = compoundValue;

    supabase
      .from("profiles")
      .update({ theme: compoundValue })
      .eq("id", user.id)
      .then(); // fire-and-forget
  }, [compoundValue, user?.id]);
}
