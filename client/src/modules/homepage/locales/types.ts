import type { en } from "./en";

export type Locale = "en" | "bn";

// Recursively widen `as const` literal strings to `string` / `string[]`
type DeepStringify<T> = T extends readonly string[]
  ? string[]
  : T extends string
    ? string
    : T extends object
      ? { [K in keyof T]: DeepStringify<T[K]> }
      : T;

export type HomepageTranslations = DeepStringify<typeof en>;
