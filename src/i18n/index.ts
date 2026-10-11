import { en } from './en';
import { createTranslator, type Translator } from './format';

export {
  createTranslator,
  catalogKeys,
  lookup,
  type Catalog,
  type NameResolver,
  type Translator,
} from './format';

export const catalogs = { en } as const;
export type Locale = keyof typeof catalogs;

export function translatorFor(locale: string): Translator {
  const code = (locale.split('-')[0] ?? 'en') as Locale;
  return createTranslator(code in catalogs ? code : 'en', catalogs[code in catalogs ? code : 'en']);
}
