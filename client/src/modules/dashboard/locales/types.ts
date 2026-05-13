import type { en } from "./en";

export type Locale = "en" | "bn";

type DeepStringify<T> = T extends readonly string[]
  ? readonly string[]
  : T extends string
    ? string
    : T extends object
      ? { readonly [K in keyof T]: DeepStringify<T[K]> }
      : T;

export type DashboardTranslations = DeepStringify<typeof en>;
