export const DARK_MODE_KEY = "dark-mode";

export function applyDarkModeClass(isDark: boolean) {
  if (isDark) {
    document.body.classList.add("dark");
  } else {
    document.body.classList.remove("dark");
  }
}

export function getInitialDarkMode(): boolean {
  // Check localStorage first
  const saved = localStorage.getItem(DARK_MODE_KEY);
  if (saved !== null) {
    return saved === "true";
  }
  // Otherwise detect system preference
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function saveDarkModePreference(isDark: boolean) {
  localStorage.setItem(DARK_MODE_KEY, isDark ? "true" : "false");
}
