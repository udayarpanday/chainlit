import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'dark' | 'light' | 'system';
type ThemeVariant = Exclude<Theme, 'system'>;

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
  brandColor?: string | null;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const initialState: ThemeProviderState = {
  theme: 'system',
  setTheme: () => null
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

const getSystemTheme = (): ThemeVariant =>
  window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

const getThemeVariant = (theme: Theme): ThemeVariant =>
  theme === 'system' ? getSystemTheme() : theme;

const rgbToHslValue = (red: number, green: number, blue: number) => {
  const r = red / 255;
  const g = green / 255;
  const b = blue / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let hue = 0;
  let saturation = 0;
  const lightness = (max + min) / 2;

  if (max !== min) {
    const delta = max - min;
    saturation =
      lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);

    switch (max) {
      case r:
        hue = (g - b) / delta + (g < b ? 6 : 0);
        break;
      case g:
        hue = (b - r) / delta + 2;
        break;
      default:
        hue = (r - g) / delta + 4;
    }

    hue /= 6;
  }

  return `${Math.round(hue * 360)} ${Math.round(
    saturation * 100
  )}% ${Math.round(lightness * 100)}%`;
};

const hexToHslValue = (color?: string | null) => {
  const match = color?.trim().match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (!match) return undefined;

  const value = match[1];
  const normalized =
    value.length === 3
      ? value
          .split('')
          .map((char) => char + char)
          .join('')
      : value;

  return rgbToHslValue(
    parseInt(normalized.slice(0, 2), 16),
    parseInt(normalized.slice(2, 4), 16),
    parseInt(normalized.slice(4, 6), 16)
  );
};

const applyBrandColorVariables = (
  shadowContainer: HTMLDivElement,
  brandColor?: string | null
) => {
  const hslBrandColor = hexToHslValue(brandColor);
  if (!hslBrandColor) return;

  shadowContainer.style.setProperty('--primary', hslBrandColor);
  shadowContainer.style.setProperty('--ring', hslBrandColor);
};

const applyThemeVariables = (
  shadowContainer: HTMLDivElement,
  variant: ThemeVariant,
  brandColor?: string | null
) => {
  const variables = window.theme?.[variant];

  if (variables) {
    Object.entries(variables).forEach(([key, value]) => {
      shadowContainer.style.setProperty(key, value);
    });
  }

  applyBrandColorVariables(shadowContainer, brandColor);
};

const applyTheme = (
  shadowContainer: HTMLDivElement,
  variant: ThemeVariant,
  brandColor?: string | null
) => {
  shadowContainer.classList.remove('light', 'dark');
  shadowContainer.classList.add(variant);
  applyThemeVariables(shadowContainer, variant, brandColor);
};

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'vite-ui-theme',
  brandColor,
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  );

  useEffect(() => {
    const shadowContainer = window.cl_shadowRootElement;
    if (!shadowContainer) return;

    applyTheme(shadowContainer, getThemeVariant(theme), brandColor);
  }, [theme, brandColor]);

  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = () => {
      const shadowContainer = window.cl_shadowRootElement;
      if (!shadowContainer) return;

      applyTheme(shadowContainer, getSystemTheme(), brandColor);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme, brandColor]);

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme);
      setTheme(theme);
    }
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined)
    throw new Error('useTheme must be used within a ThemeProvider');

  const variant = getThemeVariant(context.theme);

  return { ...context, variant };
};
