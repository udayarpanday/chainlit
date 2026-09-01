export interface IWidgetConfig {
  chainlitServer: string;
  showCot?: boolean;
  accessToken?: string;
  theme?: 'light' | 'dark';
  isEmbedded?:boolean;
  button?: {
    containerId?: string;
    imageUrl?: string;
    className?: string;
  };
  customCssUrl?: string;
  language?: string;
  additionalQueryParamsForAPI?: Record<string, string>;
  expanded?: boolean;
  opened?: boolean;
  displayMode?: string;
}
