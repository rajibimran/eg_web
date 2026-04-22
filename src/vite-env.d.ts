/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_STRAPI_URL?: string;
  readonly VITE_STRAPI_API_KEY?: string;
  /** Yes/true/1/on (default) = allow local mock fallbacks when Strapi is missing or returns empty; No/false/0/off = Strapi-only (empty sections, no bundled demo rows). */
  readonly VITE_MOCK_DATA?: string;
  readonly VITE_MOCKDATA?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
