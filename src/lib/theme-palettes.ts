export interface ThemePalette {
  id: string;
  name: string;
  previewColors: { primary: string; accent: string; bg: string };
  light: Record<string, string>;
  dark: Record<string, string>;
}

export const THEME_PALETTES: ThemePalette[] = [
  {
    id: "default",
    name: "Padrão",
    previewColors: { primary: "#7C3AED", accent: "#6D28D9", bg: "#F7F7F7" },
    light: {
      "--primary": "256 100% 54%",
      "--primary-foreground": "0 0% 97%",
      "--primary-glow": "258 90% 40%",
      "--accent": "272 72% 35%",
      "--accent-foreground": "0 0% 97%",
      "--accent-glow": "272 72% 45%",
      "--ring": "256 100% 54%",
      "--sidebar-primary": "256 100% 54%",
      "--sidebar-ring": "256 100% 54%",
    },
    dark: {
      "--primary": "256 100% 54%",
      "--primary-foreground": "0 0% 97%",
      "--primary-glow": "258 90% 40%",
      "--accent": "272 72% 35%",
      "--accent-foreground": "0 0% 97%",
      "--accent-glow": "272 72% 45%",
      "--ring": "256 100% 54%",
      "--sidebar-primary": "256 100% 54%",
      "--sidebar-ring": "256 100% 54%",
    },
  },
  {
    id: "midnight-blue",
    name: "Midnight Blue",
    previewColors: { primary: "#3B82F6", accent: "#1D4ED8", bg: "#0F172A" },
    light: {
      "--primary": "217 91% 60%",
      "--primary-foreground": "0 0% 100%",
      "--primary-glow": "221 83% 53%",
      "--accent": "224 76% 48%",
      "--accent-foreground": "0 0% 100%",
      "--accent-glow": "224 76% 58%",
      "--ring": "217 91% 60%",
      "--sidebar-primary": "217 91% 60%",
      "--sidebar-ring": "217 91% 60%",
    },
    dark: {
      "--primary": "217 91% 60%",
      "--primary-foreground": "0 0% 100%",
      "--primary-glow": "221 83% 53%",
      "--accent": "224 76% 48%",
      "--accent-foreground": "0 0% 100%",
      "--accent-glow": "224 76% 58%",
      "--ring": "217 91% 60%",
      "--sidebar-primary": "217 91% 60%",
      "--sidebar-ring": "217 91% 60%",
    },
  },
  {
    id: "ocean-teal",
    name: "Ocean Teal",
    previewColors: { primary: "#14B8A6", accent: "#0D9488", bg: "#F0FDFA" },
    light: {
      "--primary": "173 80% 40%",
      "--primary-foreground": "0 0% 100%",
      "--primary-glow": "173 69% 32%",
      "--accent": "175 84% 32%",
      "--accent-foreground": "0 0% 100%",
      "--accent-glow": "175 84% 42%",
      "--ring": "173 80% 40%",
      "--sidebar-primary": "173 80% 40%",
      "--sidebar-ring": "173 80% 40%",
    },
    dark: {
      "--primary": "173 80% 40%",
      "--primary-foreground": "0 0% 100%",
      "--primary-glow": "173 69% 32%",
      "--accent": "175 84% 32%",
      "--accent-foreground": "0 0% 100%",
      "--accent-glow": "175 84% 42%",
      "--ring": "173 80% 40%",
      "--sidebar-primary": "173 80% 40%",
      "--sidebar-ring": "173 80% 40%",
    },
  },
  {
    id: "sunset-warm",
    name: "Sunset Warm",
    previewColors: { primary: "#F97316", accent: "#EA580C", bg: "#FFFBEB" },
    light: {
      "--primary": "25 95% 53%",
      "--primary-foreground": "0 0% 100%",
      "--primary-glow": "22 93% 48%",
      "--accent": "20 91% 48%",
      "--accent-foreground": "0 0% 100%",
      "--accent-glow": "20 91% 58%",
      "--ring": "25 95% 53%",
      "--sidebar-primary": "25 95% 53%",
      "--sidebar-ring": "25 95% 53%",
    },
    dark: {
      "--primary": "25 95% 53%",
      "--primary-foreground": "0 0% 100%",
      "--primary-glow": "22 93% 48%",
      "--accent": "20 91% 48%",
      "--accent-foreground": "0 0% 100%",
      "--accent-glow": "20 91% 58%",
      "--ring": "25 95% 53%",
      "--sidebar-primary": "25 95% 53%",
      "--sidebar-ring": "25 95% 53%",
    },
  },
  {
    id: "forest-green",
    name: "Forest Green",
    previewColors: { primary: "#22C55E", accent: "#16A34A", bg: "#F0FDF4" },
    light: {
      "--primary": "142 71% 45%",
      "--primary-foreground": "0 0% 100%",
      "--primary-glow": "142 64% 37%",
      "--accent": "142 69% 38%",
      "--accent-foreground": "0 0% 100%",
      "--accent-glow": "142 69% 48%",
      "--ring": "142 71% 45%",
      "--sidebar-primary": "142 71% 45%",
      "--sidebar-ring": "142 71% 45%",
    },
    dark: {
      "--primary": "142 71% 45%",
      "--primary-foreground": "0 0% 100%",
      "--primary-glow": "142 64% 37%",
      "--accent": "142 69% 38%",
      "--accent-foreground": "0 0% 100%",
      "--accent-glow": "142 69% 48%",
      "--ring": "142 71% 45%",
      "--sidebar-primary": "142 71% 45%",
      "--sidebar-ring": "142 71% 45%",
    },
  },
  {
    id: "rose-pink",
    name: "Rose Pink",
    previewColors: { primary: "#F43F5E", accent: "#E11D48", bg: "#FFF1F2" },
    light: {
      "--primary": "350 89% 60%",
      "--primary-foreground": "0 0% 100%",
      "--primary-glow": "350 83% 50%",
      "--accent": "347 77% 50%",
      "--accent-foreground": "0 0% 100%",
      "--accent-glow": "347 77% 60%",
      "--ring": "350 89% 60%",
      "--sidebar-primary": "350 89% 60%",
      "--sidebar-ring": "350 89% 60%",
    },
    dark: {
      "--primary": "350 89% 60%",
      "--primary-foreground": "0 0% 100%",
      "--primary-glow": "350 83% 50%",
      "--accent": "347 77% 50%",
      "--accent-foreground": "0 0% 100%",
      "--accent-glow": "347 77% 60%",
      "--ring": "350 89% 60%",
      "--sidebar-primary": "350 89% 60%",
      "--sidebar-ring": "350 89% 60%",
    },
  },
];

export function getPaletteById(id: string): ThemePalette {
  return THEME_PALETTES.find((p) => p.id === id) || THEME_PALETTES[0];
}

export function applyPalette(paletteId: string, isDark: boolean) {
  const palette = getPaletteById(paletteId);
  const vars = isDark ? palette.dark : palette.light;
  const root = document.documentElement;

  Object.entries(vars).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });

  // Update gradient variables that depend on primary/accent
  const primary = vars["--primary"];
  const accent = vars["--accent"];
  const primaryGlow = vars["--primary-glow"] || accent;

  root.style.setProperty(
    "--gradient-primary",
    `linear-gradient(135deg, hsl(${primary}) 0%, hsl(${accent}) 100%)`
  );
  root.style.setProperty(
    "--gradient-accent",
    `linear-gradient(135deg, hsl(${accent}) 0%, hsl(${primaryGlow}) 100%)`
  );
  root.style.setProperty(
    "--gradient-hero",
    `linear-gradient(135deg, hsl(${primary}) 0%, hsl(${accent}) 100%)`
  );
  root.style.setProperty(
    "--shadow-glow",
    `0 0 30px hsl(${primary} / 0.3)`
  );
  root.style.setProperty(
    "--shadow-accent-glow",
    `0 0 25px hsl(${accent} / 0.4)`
  );
}

export function clearPaletteOverrides() {
  const root = document.documentElement;
  const keys = [
    "--primary", "--primary-foreground", "--primary-glow",
    "--accent", "--accent-foreground", "--accent-glow",
    "--ring", "--sidebar-primary", "--sidebar-ring",
    "--gradient-primary", "--gradient-accent", "--gradient-hero",
    "--shadow-glow", "--shadow-accent-glow",
  ];
  keys.forEach((key) => root.style.removeProperty(key));
}
