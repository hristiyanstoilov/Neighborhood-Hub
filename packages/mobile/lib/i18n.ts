// i18n stub — full implementation (i18next + expo-localization) lives on
// the i18n feature branch. This file satisfies the TypeScript program until
// that branch is merged.
export function useTranslation() {
  return { t: (key: string) => key }
}

export const i18n = {
  language: 'en',
  t: (key: string) => key,
}
