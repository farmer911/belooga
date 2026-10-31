/**
 * Primer 3-Tier Design Token SSOT for Belooga Frontend (BEL-246 / #255).
 * Mirrors tokens/design-tokens.json (Tier 1: Base -> Tier 2: Semantic -> Tier 3: Component)
 * and is verified against CSS custom properties in globals.css by scripts/sync-design-tokens.py.
 */

export type DesignThemeMode = "light" | "dark" | "neumorphic";

export interface SemanticTokenPalette {
  surface: {
    page: string;
    card: string;
    border: string;
    divider: string;
    subtle: string;
  };
  brand: {
    primary: string;
    hover: string;
    accent: string;
    dark: string;
    blue: string;
    overlay: string;
  };
  typography: {
    main: string;
    heading: string;
    body: string;
    muted: string;
  };
  status: {
    success: string;
    warning: string;
    danger: string;
    info: string;
  };
}

export const DESIGN_TOKENS = {
  base: {
    brand: {
      teal500: "#5bbbae",
      teal600: "#497d76",
      teal400: "#3fc6b7",
      teal700: "#21655e",
      teal800: "#0F766E",
      blue500: "#39a0e8",
    },
    neutral: {
      porcelain: "#E0E5EC",
      recessedWell: "#D1D9E6",
      shadowDark: "#A3B1C6",
      slate50: "#f8f9fa",
      slate900: "#0b0f19",
      white: "#ffffff",
    },
    status: {
      emerald500: "#10b981",
      emerald400: "#34d399",
      amber500: "#f59e0b",
      amber400: "#fbbf24",
      red500: "#ef4444",
      red400: "#f87171",
      blue500: "#39a0e8",
      blue400: "#60a5fa",
    },
  },
  semantic: {
    light: {
      surface: {
        page: "#f8f9fa",
        card: "#ffffff",
        border: "#d1d6da",
        divider: "#f0f2f5",
        subtle: "#fafafa",
      },
      brand: {
        primary: "#5bbbae",
        hover: "#497d76",
        accent: "#3fc6b7",
        dark: "#21655e",
        blue: "#39a0e8",
        overlay: "#d7ecea",
      },
      typography: {
        main: "#252525",
        heading: "#515151",
        body: "#666666",
        muted: "#737475",
      },
      status: {
        success: "#10b981",
        warning: "#f59e0b",
        danger: "#ef4444",
        info: "#39a0e8",
      },
    },
    dark: {
      surface: {
        page: "#0b0f19",
        card: "#131b2e",
        border: "#1e293b",
        divider: "#1e293b",
        subtle: "#162035",
      },
      brand: {
        primary: "#5bbbae",
        hover: "#6bc4b8",
        accent: "#3fc6b7",
        dark: "#2dd4bf",
        blue: "#60a5fa",
        overlay: "#132e2b",
      },
      typography: {
        main: "#f8fafc",
        heading: "#e2e8f0",
        body: "#cbd5e1",
        muted: "#94a3b8",
      },
      status: {
        success: "#34d399",
        warning: "#fbbf24",
        danger: "#f87171",
        info: "#60a5fa",
      },
    },
    neumorphic: {
      surface: {
        page: "#E0E5EC",
        card: "#E0E5EC",
        border: "#A3B1C6",
        divider: "#D1D9E6",
        subtle: "#D1D9E6",
      },
      brand: {
        primary: "#0F766E",
        hover: "#0F766E",
        accent: "#0F766E",
        dark: "#0F766E",
        blue: "#39a0e8",
        overlay: "rgba(15, 118, 110, 0.14)",
      },
      typography: {
        main: "#1E293B",
        heading: "#1E293B",
        body: "#475569",
        muted: "#475569",
      },
      status: {
        success: "rgb(15, 118, 110)",
        warning: "rgb(180, 83, 9)",
        danger: "rgb(185, 28, 28)",
        info: "#39a0e8",
      },
    },
  } satisfies Record<DesignThemeMode, SemanticTokenPalette>,
  component: {
    videoPlayButton: {
      sizePx: 54,
      background: "#ffffff",
      iconColor: "#5bbbae",
    },
    card: {
      radiusPx: 20,
      paddingPx: 16,
    },
    button: {
      minHeightPx: 44,
      radiusPx: 14,
    },
    pill: {
      radiusPx: 999,
    },
  },
} as const;

export function getSemanticTokenPalette(mode: DesignThemeMode = "light"): SemanticTokenPalette {
  return DESIGN_TOKENS.semantic[mode];
}
