// Shadow Design Tokens
export const shadows = {
  light: {
    card: "0 8px 24px rgba(0,0,0,.08)",
    floating: "0 12px 36px rgba(0,0,0,.12)",
    soft: "0 2px 8px rgba(0,0,0,.04)",
  },
  dark: {
    card: "0 8px 32px rgba(0,0,0,.35)",
    floating: "0 12px 48px rgba(0,0,0,.5)",
    soft: "0 2px 12px rgba(0,0,0,.2)",
  },
};

export function getThemeShadows(mode: "dark" | "light") {
  return mode === "dark" ? shadows.dark : shadows.light;
}
