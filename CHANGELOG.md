# Changelog

## 2025-03-27: Version 0.4.1 -> 0.5.0
This release contains breaking changes:

### Breaking changes
* `SupabaseProvider` component:
    * **SSG/ISR default:** 
        * Data is now fetched via `useMutablePlasmicQueryData` hook instead of `useSWR`. 
        * This means that the `SupabaseProvider` (when used with Plasmic's Loader API Nextjs Pages router implementation) will try to fetch data server-side & cache it server-side by default. 
        * This can be disabled by setting the `disableServerSideFetch` prop of the `SupabaseProvider` component to `true`. 
        * See [README SSG/ISR section](README.md#static-site-generation-ssg--incremental-static-regeneration-isr) for more details.
        * Address issue [6](https://github.com/CallumBoase/plasmic-supabase/issues/6)
    * **Initial sort order replaced with orderBy prop:** 
        * The `initialSortOrder` prop of the `SupabaseProvider` component has been replaced with the `orderBy` prop
        * `orderBy` is more flexible as it provides multiple options for sorting the data.
        * Addresses issue [30](https://github.com/CallumBoase/plasmic-supabase/issues/30)
    * **`sortRows` element action removed:** The `sortRows` element action has been removed. Previously, this could be used to sort data returned by the `SupabaseProvider` component. If you want to create dynamic sorting, you can now make the `orderBy` prop dynamic instead.
    * **Loading, error & no data slots removed:** 
        * The `Loading`, `Error` and `NoData` slots of the `SupabaseProvider` component have been removed. 
        * These were previously used to display loading states, error states and no data states respectively. 
        * You can now use the `isLoading` and `isError` context values to display loading states, (see [README on loading states](README.md#loading-states) for more details) and you can count the data within the `SupabaseProvider` component's data to determine if there is data to display.
        * Address issue [27](https://github.com/CallumBoase/plasmic-supabase/issues/27)
    * **Prop `generateRandomErrors` replaced by 2 error-simulation props:** The prop `generateRandomErrors` has been replaced by 2 new props: `simulateRandomFetchErrors` and `simulateRandomMutationErrors`. These allow you to simulate errors with better control.
    * **mutation errors aren't shown in the SupabaseProvider's data:** Previously, mutation errors would be shown in the `SupabaseProvider`'s data. This was note a robust pattern so has been removed. Instead, you can use the `onError` prop to define an action to run when an error occurs, or you can add actions directly after the mutation, filtered by the mutation's status. See [README on success and on error callbacks](README.md#supabaseprovider-onsuccess-and-onerror-callbacks) and [README on running actions after a mutation](README.md#supabaseprovider-running-actions-after-a-mutation) for more details and examples.
    * **subsequent actions after mutations have different behaviour:**: 
        * Old behaviour: actions after a mutation action would run immedatiely without waiting for the mutation to finish. Subsequent actions would not have access to the status (success or failure) or data from the mutation. There was no way to wait for the mutation to finish before running subsequent actions.
        * New behaviour: you have options
            * Optional running next action immediately without waiting for mutation to finish, or running after mutation has finished. Defaults to running after mutation has finished.
            * Optional returning the mutated row after the mutation has finished for use in subsequent actions. Defaults to NOT returning the mutated row.
        * Addresses issue [3](https://github.com/CallumBoase/plasmic-supabase/issues/3)
* **`SupabaseUserGlobalContext` component:**
    * **`resetPasswordForEmail` refreshes user details automatically:** When using the `resetPasswordForEmail` global action, the logged in user details will now be refreshed automatically before the mutation finishes. This is unlikely to cause issues in existing apps but could be considered a breaking change
    * **`updateUserPassword` global action:** Will refresh the logged in user details automatically after the mutation finishes. This is unlikely to cause issues in existing apps but could be considered a breaking change
* **Other breaking changes:**
    * **`Bundling method causing imports of non-exported utilities to break`:** `plasmic-supabase` now uses a different bundling method taken from Plasmic's implementation of code components. If you were importing utilities beyond the main components from `plasmic-supabase` (for example the supabase `createClient` methods from `plasmic-supabase/utils/supabase/...`), these will no longer work.
        * For supabase create client methods, you can now import as shown in the [README create client supabase methods](README.md#createclient-supabase-methods)        

### Non-breaking changes
* **Supabase `createClient` methods use latest version of `@supabase/ssr` & suggested methods:** The 4x `createClient` methods for nextjs pages router and now created using the latest version of the `@supabase/ssr` package and the methods for getting and setting cookies have been updated to match the latest supabase docs (using `getAll` and `setAll` instead of `get`, `set` and `delete`). This should not impact existing projects.

### Bug fixes
* `SupabaseProvider` component:
    * **All props cause revalidation of fetched data:** Previously, not all SupabaseProvider props caused revalidation of data when changed. This is fixed, and every props of the `SupabaseProvider` component will now cause revalidation (refetch) of data once it changes
    * **Automatic cache invalidation for different queries:** 
        * Partially addresses issue [26](https://github.com/CallumBoase/plasmic-supabase/issues/26)
        * Old versions of `plasmic-supabase` would often show cached data from the wrong query unless you carefully created dynamic cache keys in your `SupabaseProvider` component. 
        * For example if you have a dynamic page `/projects/[id]` with a SupabaseProvider fetching 1 project by it's id.
            * If I visited `/projects/1` and then `/projects/2`, the data for `/projects/1` would be shown briefly on `/projects/2` before being replaced with the data for `/projects/2`. 
        * This is fixed by including all query parameters in the cache key so that truly different queries will be considered unique and will not show stale data from similar other queries.
    * **LHS/RHS abbreviations in default text:** The `SupabaseProvider` loads a default text block when added in Plasmic studio. This text block previously used LHS and RHS to refer to the left and right hand sides of the screen. This has been updated to use left-hand-side and right-hand-side instead for easier understanding. Addresses issue [15](https://github.com/CallumBoase/plasmic-supabase/issues/15)
* **`SupabaseUserGlobalContext` component:**
    * **inappropriate await in code fixed:** See issue [12](https://github.com/CallumBoase/plasmic-supabase/issues/12)
* **Other bugs fixed:** 
    * removed unecessary `getSupabaseProjectidFromUrl.ts` utility function see issue [23](https://github.com/CallumBoase/plasmic-supabase/issues/23)
    * included documentation for how to handle auth actions including password requests added (issue [34](https://github.com/CallumBoase/plasmic-supabase/issues/34))

### New features
* `SupabaseProvider` component:
    * **New prop `simulateRandomFetchErrors`:** This prop allows you to simulate fetch errors with better control.
    * **New prop `simulateRandomMutationErrors`:** This prop allows you to simulate mutation errors with better control.
    * **New prop `disableServerSideFetch`:** This prop allows you to disable server-side fetching and caching of data.
    * **New prop `orderBy`:** This prop allows you to specify the order of the data returned by the `SupabaseProvider` component (replaces `initialSortOrder` prop)
    * **onError and onMutateSuccess interaction props:**: New props available on the `SupabaseProvider` so you can define actions to run anytime an error occurs within the `SupabaseProvider` or when a mutation is successfully run from the `SupabaseProvider` component.
    * **Count available:** You can now ask Supabase to return a count of the total number of rows that match your query.
    * **Pagination available:** Supabase provider now supports props `limit` and `offset` for server-side pagination. Addresses issue [28](https://github.com/CallumBoase/plasmic-supabase/issues/28)
* **`SupabaseUserGlobalContext` component:**
    * **`requestMagicLinkToEmail` global action:** This is now available on the `SupabaseUserGlobalContext` component for alternative login method.
    * **`updateUser` global action:** This is now available on the `SupabaseUserGlobalContext` component, allowing you to update the logged in user's details including email, password and user metadata.

## 2024-07-19: Version 0.4.0 -> 0.4.1
This release does not contain any breaking changes
* Bugfix in `SupabaseProvider` component -> Filters props. the `containedBy` filter option had an incorrect case causing it to not work. This has been fixed so `containedBy` should function as expected now.

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