# Template changelog

Track **template** upgrades when you fix the API layer, Strapi wiring, or shared components—then cherry-pick or merge the same changes into other company repos cloned from this template.

## Unreleased

- _Add entries when you bump the golden template._

## template-v1 (baseline)

- Strapi v5 integration with explicit `populate` where nested components/media require it.
- Central `src/lib/api.ts` for REST helpers, mappers, and mock fallbacks.
- Rich text: `RichText` + `richtextToPlainString` for Strapi Blocks / multiline fields.
- SEO via shared head component; media via `getStrapiMediaUrl` patterns.
- Env: `VITE_STRAPI_URL`, `VITE_STRAPI_API_KEY` (see `.env.example`).
