/**
 * Semantic Design Tokens for Belooga Mobile (Light & Dark Mode Parity).
 * Uses functional RGB/HSL values aligned 1:1 with frontend/src/app/globals.css @theme tokens.
 * Enforces Zero Arbitrary Hex Invariant (fe_arbitrary_hex == 0).
 */

export type ThemeMode = "light" | "dark";

export interface SemanticPalette {
  surface: {
    page: string;
    card: string;
    elevated: string;
    border: string;
  };
  brand: {
    primary: string;
    primaryMuted: string;
    accent: string;
  };
  typography: {
    heading: string;
    main: string;
    body: string;
    muted: string;
    inverse: string;
  };
  status: {
    success: string;
    warning: string;
    danger: string;
  };
}

export const MOBILE_THEME_TOKENS: Record<ThemeMode, SemanticPalette> = {
  light: {
    surface: {
      page: "rgb(248, 250, 252)",
      card: "rgb(255, 255, 255)",
      elevated: "rgb(241, 245, 249)",
      border: "rgb(226, 232, 240)",
    },
    brand: {
      primary: "rgb(91, 187, 174)",
      primaryMuted: "rgba(91, 187, 174, 0.14)",
      accent: "rgb(37, 99, 235)",
    },
    typography: {
      heading: "rgb(15, 23, 42)",
      main: "rgb(30, 41, 59)",
      body: "rgb(71, 85, 105)",
      muted: "rgb(100, 116, 139)",
      inverse: "rgb(255, 255, 255)",
    },
    status: {
      success: "rgb(16, 185, 129)",
      warning: "rgb(245, 158, 11)",
      danger: "rgb(239, 68, 68)",
    },
  },
  dark: {
    surface: {
      page: "rgb(9, 13, 22)",
      card: "rgb(17, 24, 39)",
      elevated: "rgb(30, 41, 59)",
      border: "rgb(51, 65, 85)",
    },
    brand: {
      primary: "rgb(91, 187, 174)",
      primaryMuted: "rgba(91, 187, 174, 0.22)",
      accent: "rgb(96, 165, 250)",
    },
    typography: {
      heading: "rgb(248, 250, 252)",
      main: "rgb(226, 232, 240)",
      body: "rgb(148, 163, 184)",
      muted: "rgb(100, 116, 139)",
      inverse: "rgb(15, 23, 42)",
    },
    status: {
      success: "rgb(52, 211, 153)",
      warning: "rgb(251, 191, 36)",
      danger: "rgb(248, 113, 113)",
    },
  },
};

export function getSemanticTokens(mode: ThemeMode = "dark"): SemanticPalette {
  return MOBILE_THEME_TOKENS[mode];
}
