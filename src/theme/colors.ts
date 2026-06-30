// Semantic Color Tokens
export const colors = {
  brand: {
    crimson: "#C90023",
    hover: "#BD0F3B",
  },
  dark: {
    canvas: "#4A0517",
    surface: "#5A0A20",
    elevated: "#68102A",
    primaryText: "#FFFFFF",
    secondaryText: "#D7D7D7",
    mutedText: "#A9A9A9",
    divider: "rgba(255, 255, 255, 0.08)",
  },
  light: {
    canvas: "#FFFFFF",
    surface: "#F7F7F8",
    elevated: "#FFFFFF",
    primaryText: "#171717",
    secondaryText: "#555555",
    mutedText: "#888888",
    divider: "#E7E7E7",
  },
};

export type ThemeMode = "dark" | "light";

export function getThemeColors(mode: ThemeMode) {
  return mode === "dark" ? colors.dark : colors.light;
}
