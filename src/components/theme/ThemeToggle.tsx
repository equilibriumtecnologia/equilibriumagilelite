import { Moon, Sun, Monitor, Palette } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { THEME_PALETTES } from "@/lib/theme-palettes";
import { usePalette } from "@/hooks/usePalette";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export function ThemeToggle() {
  const { setTheme, theme } = useTheme();
  const { paletteId, setPaletteId } = usePalette();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Alternar tema</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel className="text-xs text-muted-foreground">Modo</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => setTheme("light")}>
          <Sun className="mr-2 h-4 w-4" />
          Claro
          {theme === "light" && <Check className="ml-auto h-3 w-3" />}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          <Moon className="mr-2 h-4 w-4" />
          Escuro
          {theme === "dark" && <Check className="ml-auto h-3 w-3" />}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          <Monitor className="mr-2 h-4 w-4" />
          Sistema
          {theme === "system" && <Check className="ml-auto h-3 w-3" />}
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs text-muted-foreground flex items-center gap-1">
          <Palette className="h-3 w-3" />
          Paleta de cores
        </DropdownMenuLabel>

        {THEME_PALETTES.map((palette) => (
          <DropdownMenuItem
            key={palette.id}
            onClick={() => setPaletteId(palette.id)}
            className="flex items-center gap-2"
          >
            <div className="flex gap-0.5">
              <div
                className="h-4 w-4 rounded-full border border-border"
                style={{ backgroundColor: palette.previewColors.primary }}
              />
              <div
                className="h-4 w-4 rounded-full border border-border"
                style={{ backgroundColor: palette.previewColors.accent }}
              />
            </div>
            <span className="text-sm">{palette.name}</span>
            {paletteId === palette.id && <Check className="ml-auto h-3 w-3" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
