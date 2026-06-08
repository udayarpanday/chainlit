import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'dark' | 'light' | 'system';

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

function applyThemeVariables(
  variant: 'dark' | 'light',
  brandColor?: string | null
) {
  const shadowContainer = window.mdx_shadowRootElement;
  if (!shadowContainer) return;

  const variables = window.theme?.[variant];

  if (variables) {
    Object.entries(variables).forEach(([key, value]) => {
      shadowContainer.style.setProperty(key, value);
    });
  }

  applyBrandColorVariables(shadowContainer, brandColor);
}

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
  const [openBrandColor, setOpenBrandColor] = useState<
    string | null | undefined
  >(undefined);
  const effectiveBrandColor = openBrandColor ?? brandColor;

  useEffect(() => {
    const handleOpenCreator = (event: Event) => {
      const brandColor = (event as CustomEvent<{ config?: { brand_color?: string | null } }>)
        .detail?.config?.brand_color;

      if (brandColor !== undefined) {
        setOpenBrandColor(brandColor);
      }
    };

    window.addEventListener('open-evoya-creator', handleOpenCreator);
    return () =>
      window.removeEventListener('open-evoya-creator', handleOpenCreator);
  }, []);

  useEffect(() => {
    const shadowContainer = window.mdx_shadowRootElement;
    if (!shadowContainer) return;

    // Remove existing theme classes
    shadowContainer.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)')
        .matches
        ? 'dark'
        : 'light';

      shadowContainer.classList.add(systemTheme);
      applyThemeVariables(systemTheme, effectiveBrandColor);
      return;
    }

    shadowContainer.classList.add(theme);
    applyThemeVariables(theme, effectiveBrandColor);
  }, [theme, effectiveBrandColor]);

  // Listen for system theme changes
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = () => {
      const shadowContainer = window.mdx_shadowRootElement;
      if (!shadowContainer) return;

      const newTheme = mediaQuery.matches ? 'dark' : 'light';
      shadowContainer.classList.remove('light', 'dark');
      shadowContainer.classList.add(newTheme);
      applyThemeVariables(newTheme, effectiveBrandColor);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme, effectiveBrandColor]);

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

  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';

  const variant = context.theme === 'system' ? systemTheme : context.theme;

  return { ...context, variant };
};
