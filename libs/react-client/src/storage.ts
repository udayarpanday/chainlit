import { v4 as uuidv4 } from 'uuid';

const TAB_ID_KEY = 'chainlit_tab_id';
const SESSION_ID_KEY = 'chainlit_session_id';

let memoryTabId: string | undefined;
const memoryStorage = new Map<string, string>();

const getStorage = () => {
  if (typeof window === 'undefined') {
    return undefined;
  }

  try {
    return window.sessionStorage;
  } catch {
    return undefined;
  }
};

const getItem = (key: string) =>
  getStorage()?.getItem(key) ?? memoryStorage.get(key) ?? null;

const setItem = (key: string, value: string) => {
  const storage = getStorage();

  if (storage) {
    storage.setItem(key, value);
  } else {
    memoryStorage.set(key, value);
  }
};

const removeItem = (key: string) => {
  const storage = getStorage();

  if (storage) {
    storage.removeItem(key);
  }

  memoryStorage.delete(key);
};

export const getChainlitTabId = () => {
  let tabId = getItem(TAB_ID_KEY) || memoryTabId;

  if (!tabId) {
    tabId = uuidv4();
    memoryTabId = tabId;
    setItem(TAB_ID_KEY, tabId);
  }

  return tabId;
};

export const getScopedStorageKey = (key: string) =>
  `${key}:${getChainlitTabId()}`;

export const getScopedSessionStorageItem = (key: string) => {
  const scopedKey = getScopedStorageKey(key);
  const scopedValue = getItem(scopedKey);

  if (scopedValue !== null) {
    return scopedValue;
  }

  const legacyValue = getItem(key);

  if (legacyValue !== null) {
    setItem(scopedKey, legacyValue);
    removeItem(key);
  }

  return legacyValue;
};

export const setScopedSessionStorageItem = (key: string, value: string) => {
  setItem(getScopedStorageKey(key), value);
  removeItem(key);
};

export const removeScopedSessionStorageItem = (key: string) => {
  removeItem(getScopedStorageKey(key));
  removeItem(key);
};

export const createScopedSessionId = () => {
  const sessionId = uuidv4();
  setScopedSessionStorageItem(SESSION_ID_KEY, sessionId);
  return sessionId;
};

export const getScopedSessionId = () =>
  getScopedSessionStorageItem(SESSION_ID_KEY) || createScopedSessionId();

export const setScopedSessionId = (sessionId: string) => {
  setScopedSessionStorageItem(SESSION_ID_KEY, sessionId);
};
