import { createContext } from 'react';
import { EvoyaConfig } from 'evoya/types';

interface IWidgetContext {
  accessToken?: string;
  setAccessToken: (accessToken?: string) => void;
  evoya?: EvoyaConfig;
}

const defaultContext = {
  accessToken: undefined,
  setAccessToken: () => {},
  evoya: undefined
};

const WidgetContext = createContext<IWidgetContext>(defaultContext);

export { WidgetContext, defaultContext };
