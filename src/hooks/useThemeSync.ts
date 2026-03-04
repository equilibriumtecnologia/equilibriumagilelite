import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

/**
 * Syncs the theme preference bidirectionally:
 * - On login: loads theme from profiles table
 * - On change: saves theme to profiles table + localStorage
 */
export function useThemeSync() {
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  const hasLoadedFromDb = useRef(false);
  const previousTheme = useRef(theme);

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

      if (data?.theme && data.theme !== theme) {
        setTheme(data.theme);
      }
      hasLoadedFromDb.current = true;
    };

    loadTheme();
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Save theme to DB on change
  useEffect(() => {
    if (!user?.id || !hasLoadedFromDb.current) return;
    if (theme === previousTheme.current) return;
    previousTheme.current = theme;

    supabase
      .from("profiles")
      .update({ theme })
      .eq("id", user.id)
      .then(); // fire-and-forget
  }, [theme, user?.id]);
}
