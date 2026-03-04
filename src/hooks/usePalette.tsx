import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useTheme } from "next-themes";
import { applyPalette, clearPaletteOverrides } from "@/lib/theme-palettes";

interface PaletteContextType {
  paletteId: string;
  setPaletteId: (id: string) => void;
}

const PaletteContext = createContext<PaletteContextType>({
  paletteId: "default",
  setPaletteId: () => {},
});

const PALETTE_KEY = "color-palette";

export function PaletteProvider({ children }: { children: React.ReactNode }) {
  const [paletteId, setPaletteIdState] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(PALETTE_KEY) || "default";
    }
    return "default";
  });

  const { resolvedTheme } = useTheme();

  const setPaletteId = useCallback((id: string) => {
    setPaletteIdState(id);
    localStorage.setItem(PALETTE_KEY, id);
  }, []);

  // Apply palette whenever paletteId or resolved theme changes
  useEffect(() => {
    if (paletteId === "default") {
      clearPaletteOverrides();
    } else {
      applyPalette(paletteId, resolvedTheme === "dark");
    }
  }, [paletteId, resolvedTheme]);

  return (
    <PaletteContext.Provider value={{ paletteId, setPaletteId }}>
      {children}
    </PaletteContext.Provider>
  );
}

export function usePalette() {
  return useContext(PaletteContext);
}
