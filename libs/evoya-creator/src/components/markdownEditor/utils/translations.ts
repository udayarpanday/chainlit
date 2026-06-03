export const getTranslations = (key: string, defaultValue: string, interpolations = {}, t: (path: string | string[]) => string) => {

  const trans = t('evoyaCreator.' + key);

  return trans === "..." ? defaultTranslation(key, defaultValue, interpolations) : trans;
}

function defaultTranslation(key: string, defaultValue: string, interpolations = {}) {
  let value = defaultValue
  for (const [k, v] of Object.entries(interpolations)) {
    value = value.replaceAll(`{{${k}}}`, String(v))
  }
  return value
}