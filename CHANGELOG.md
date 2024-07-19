# Changelog

## 2024-07-19: Version 0.3.1 -> 0.4.0
This release contains breaking changes:
* Context: Previous versions used multiple catchall pages plus `getServerSideProps` to login protect pages. This was not an optimal solution and was complex to setup. 
* This version introduces a new method to login protect pages via nextjs middleware. Changes to behaviour after successful login, logout and signup (in `SuapabaseUserGlobalContext` component) where required to support this.
* Breaking changes:
    * Substantial change in recommended setup of nextjs repo:
        * Due to changed instructions, substantial adjustment of existing nextjs repos that used old method for login protecting pages will be needed (see updated `readme.md` for instructions)
        * Includes removal of now-unneeded `AuthorizationCheckFunction` typescript types which were previously available for import in projects that had `plasmic-supabase` installed
    * On successful login, logout and signup, (via `SupabaseUserGlobalContext` component) the behaviour is now different:
        * If a "redirect on success" URL is specified
            * Old behaviour: redirect to specified URL would occur via `router.ridrect`
            * New behaviour: redirection is performed using `window.location.href`
        * If a "redirect on success" URL is not specified
            * Old behaviour: nothing happens
            * New behaviour: the existing page will automatically reload via `window.location.reload()`
    * Dependecies of this package have changed. They now use a later version of `@supabase/ssr` package which likely has breaking changes compared to previously used version

## 2024-07-04: Version 0.3.0 -> 0.3.1
This release does not contain any breaking changes
* Bugfix for `SupabaseUppyUploader` component:
    * Issue: The `SupabaseUppyUploader` component only worked for Supabase projects in the Supabase SaaS offering with a supabase.co domain (see [issue 20](https://github.com/CallumBoase/plasmic-supabase/issues/20))
    * Fix: The `SupabaseUppyUploader` component will now work with Supabase projects with different URLs. It will respect the URL defined in the environment variable `NEXT_PUBLIC_SUPABASE_URL` for your project

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