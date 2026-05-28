import { v4 as uuidv4 } from 'uuid';

const TAB_ID_KEY = 'chainlit_tab_id';

export const getChainlitTabId = () => {
  let tabId = sessionStorage.getItem(TAB_ID_KEY);

  if (!tabId) {
    tabId = uuidv4();
    sessionStorage.setItem(TAB_ID_KEY, tabId);
  }

  return tabId;
};

export const getScopedStorageKey = (key: string) =>
  `${key}:${getChainlitTabId()}`;

export const getScopedSessionStorageItem = (key: string) => {
  const scopedKey = getScopedStorageKey(key);
  const scopedValue = sessionStorage.getItem(scopedKey);

  if (scopedValue !== null) {
    return scopedValue;
  }

  const legacyValue = sessionStorage.getItem(key);

  if (legacyValue !== null) {
    sessionStorage.setItem(scopedKey, legacyValue);
    sessionStorage.removeItem(key);
  }

  return legacyValue;
};

export const setScopedSessionStorageItem = (key: string, value: string) => {
  sessionStorage.setItem(getScopedStorageKey(key), value);
  sessionStorage.removeItem(key);
};

export const removeScopedSessionStorageItem = (key: string) => {
  sessionStorage.removeItem(getScopedStorageKey(key));
  sessionStorage.removeItem(key);
};
