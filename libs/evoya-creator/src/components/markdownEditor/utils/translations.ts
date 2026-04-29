// import { useTranslation } from '@chainlit/app/src/components/i18n/Translator';

export const getTranslations = (key: string, defaultValue: string, interpolations = {}, t: (path: string | string[]) => string) => {
  // const { t } = useTranslation();

  console.log('evoyaCreator.' + key, t('evoyaCreator.' + key))

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