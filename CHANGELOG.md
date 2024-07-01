# Changelog

## 2024-07-01: Version 0.2.0 -> 0.3.0
This release contains breaking changes:
* Context: Version 0.2.0 introduced the ability to specify an `options` object in the Global Action invoked via SupabaseUserGlobalContext -> signup. However, this required the user to know the shape of the options object that Supabase expects (as per [supabase docs](https://supabase.com/docs/reference/javascript/auth-signup)). 
* Therefore, in this release, removed the ability to specify a single `options` object in SupabaseUserGlobalContext -> signup, and instead added two separate fields to specify parameters of the `options` object. `Supabase-plasmic` will dynamically generate the `options` object in the background based on these values:
    * `emailRedirect` (string). Where the user will be redirected to in the confirmation email (matches the `emailRedirectTo` parameter of `options` object as seen in [signup docs](https://supabase.com/docs/reference/javascript/auth-signup))
    * `userMetadata` (object). Any arbritrary object (key:value pairs). These will be stored in the `raw_user_metadata` column in the `auth.users` table in Supabase. (This matches `data` parameter of `options` object as seen in [signup docs](https://supabase.com/docs/reference/javascript/auth-signup))
* This is a breaking change. If you previously made use of the `options` object when running the `SupabaseUserGlobalContext -> signup` action, you will need to update your app's configuration in Plasmic studio to use the new `emailRedirect` and `userMetadata` fields instead.

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