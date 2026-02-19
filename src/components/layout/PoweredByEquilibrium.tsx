import React from "react";

type Variant = "footer" | "login" | "menu" | "badge" | "minimal";
type Theme = "auto" | "light" | "dark";
type Logo = "compact" | "horizontal" | "square" | "icon";

export type PoweredByEquilibriumProps = {
  /** Texto acima do logo/nome */
  label?: string; // default: "Powered by"
  /** Para onde o clique leva */
  href?: string; // default: "https://equilibriumtecnologia.com.br"
  /** Variante de tamanho/espacamento */
  variant?: Variant; // default: "footer"
  /** Força tema (define se usa logo preta ou branca) */
  theme?: Theme; // default: "auto"
  /** Qual imagem usar */
  logo?: Logo; // default: "compact"
  /** Abre em nova aba */
  targetBlank?: boolean; // default: true
  /** Mostra o texto "Equilibrium Tecnologia" junto como fallback */
  showTextFallback?: boolean; // default: true
  /** Se quiser forçar width/height no container */
  width?: number | string;
  height?: number | string;
  /** Estilos externos (funciona com qualquer projeto) */
  className?: string;
  style?: React.CSSProperties;
  /** Estilos específicos (opcional) */
  labelStyle?: React.CSSProperties;
  imageStyle?: React.CSSProperties;
  textStyle?: React.CSSProperties;
  /** Se quiser “somente texto” (sem imagem) */
  textOnly?: boolean;
};

/**
 * PoweredByEquilibrium
 * - Sem iframe, sem dependência de Tailwind, funciona em qualquer projeto React+TS.
 * - Usa <img> com URLs hardcoded.
 * - Tema "auto" tenta deduzir dark/light pelo prefers-color-scheme.
 */
export function PoweredByEquilibrium({
  label = "Powered by",
  href = "https://equilibriumtecnologia.com.br",
  variant = "footer",
  theme = "auto",
  logo = "compact",
  targetBlank = true,
  showTextFallback = true,
  width,
  height,
  className,
  style,
  labelStyle,
  imageStyle,
  textStyle,
  textOnly = false,
}: PoweredByEquilibriumProps) {
  const isDark =
    theme === "dark"
      ? true
      : theme === "light"
        ? false
        : typeof window !== "undefined"
          ? (window.matchMedia?.("(prefers-color-scheme: dark)")?.matches ??
            false)
          : false;

  // URLs hardcoded (troque aqui uma vez e pronto)
  // Sugestão: use as versões transparentes (white/black)
  const ASSETS = {
    white: {
      compact:
        "https://imgix.cosmicjs.com/893ba360-fd0b-11f0-bd37-87d3468b9b4a-logo-white-3.png",
      horizontal:
        "https://imgix.cosmicjs.com/893c8dc0-fd0b-11f0-bd37-87d3468b9b4a-logo-white-2.png",
      square:
        "https://imgix.cosmicjs.com/894a9780-fd0b-11f0-bd37-87d3468b9b4a-logo-white-1.png",
      icon: "https://imgix.cosmicjs.com/53c21020-fd0b-11f0-bd37-87d3468b9b4a-simbolo-white-1.png",
    },
    black: {
      compact:
        "https://imgix.cosmicjs.com/893a43d0-fd0b-11f0-bd37-87d3468b9b4a-logo-black-3.png",
      horizontal:
        "https://imgix.cosmicjs.com/893f9b00-fd0b-11f0-bd37-87d3468b9b4a-logo-black-2.png",
      square:
        "https://imgix.cosmicjs.com/8917c7b0-fd0b-11f0-bd37-87d3468b9b4a-logo-black-1.png",
      icon: "https://imgix.cosmicjs.com/53c19af0-fd0b-11f0-bd37-87d3468b9b4a-simbolo-black-1.png",
    },
  } as const;

  const variantPreset = getPreset(variant);

  const chosen = isDark ? ASSETS.white : ASSETS.black;
  const imgSrc = chosen[logo];

  const containerStyle: React.CSSProperties = {
    display: "inline-flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    gap: variantPreset.gap,
    width,
    height,
    ...style,
  };

  const defaultLabelStyle: React.CSSProperties = {
    fontFamily:
      'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"',
    fontSize: variantPreset.fontSize,
    lineHeight: 1.1,
    opacity: 0.9,
    userSelect: "none",
    whiteSpace: "nowrap",
    margin: 0,
  };

  const defaultImageStyle: React.CSSProperties = {
    height: variantPreset.logoHeight,
    width: "auto",
    maxWidth: "100%",
    display: "block",
  };

  const defaultTextStyle: React.CSSProperties = {
    fontFamily:
      'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"',
    fontSize: Math.max(12, variantPreset.fontSize),
    lineHeight: 1.1,
    opacity: 0.9,
    margin: 0,
    whiteSpace: "nowrap",
  };

  const rel = targetBlank ? "noopener noreferrer" : undefined;
  const target = targetBlank ? "_blank" : undefined;

  return (
    <div className={className} style={containerStyle}>
      {variant !== "minimal" && (
        <p style={{ ...defaultLabelStyle, ...labelStyle }}>{label}</p>
      )}

      <a
        href={href}
        target={target}
        rel={rel}
        style={{ display: "inline-flex", alignItems: "center" }}
      >
        {!textOnly && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imgSrc}
            alt="Equilibrium Tecnologia"
            style={{ ...defaultImageStyle, ...imageStyle }}
            loading="lazy"
            decoding="async"
            onError={(e) => {
              // Se a imagem falhar, esconde e deixa cair no fallback textual
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
        )}

        {showTextFallback && (
          <p style={{ ...defaultTextStyle, ...textStyle }}>
            Equilibrium Tecnologia
          </p>
        )}
      </a>
    </div>
  );
}

function getPreset(variant: Variant) {
  switch (variant) {
    case "login":
      return { fontSize: 11, gap: 6, logoHeight: 18 };
    case "menu":
      return { fontSize: 11, gap: 6, logoHeight: 18 };
    case "badge":
      return { fontSize: 10, gap: 6, logoHeight: 16 };
    case "minimal":
      return { fontSize: 10, gap: 0, logoHeight: 18 };
    case "footer":
    default:
      return { fontSize: 12, gap: 8, logoHeight: 22 };
  }
}
