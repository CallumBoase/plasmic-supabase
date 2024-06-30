# Changelog

## 2024-06-28: Version 0.1.0 -> 0.2.0
This release does not contain any breaking changes
* Added the ability to specify an `options` object in the Global Action: SupabaseUserGlobalContext -> signup (see `src/components/SupabaseUserGlobalContext` files `index.tsx` and `registerComponentMeta.tsx`). Options object is optional, as per [supabase docs](https://supabase.com/docs/reference/javascript/auth-signup)

## 2024-06-13: Version 0.0.3 -> 0.1.0
* * This release does not contain any breaking changes, but it is a major release because it introduces new features (instructions for how to login protect pages)
* Updated `Readme`:
    * Clearer basic installation instructions
    * Instructions for login protecting pages
* Export from `src/index.ts` new types for `AuthorizationCheckFunction` and `RoutePath` to support the new instructions for login protecting pages
* Moved dev notes from main readme to standalone file

## 2024-04-30: version 0.0.2 -> 0.0.3
* Updated Readme to include contributors and brief introduction 