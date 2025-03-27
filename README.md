# plasmic-supabase

*Components that make it easy to use Supabase as a backend for your Plasmic app.*

These components allow you to use the auto-generated Supabase API for database, storage & auth, so you can leverage all of Supabase's powerful features in your Plasmic app. Note that this is DIFFERENT from the built-in Plasmic supabase integration which uses direct database connection.

These components support use of Supabase auth without Plasmic auth.

## Contributors
- Callum Boase
   * Github: [CallumBoase](https://github.com/CallumBoase)
   * Website: [Enliven IT](https://enliven-it.com.au/contact)
   * Email: callum.boase@gmail.com
   * Mobile (Australia): +61409 378 253
- Ryan Mouritz
    * Github: [ryanmouritz](https://github.com/ryanmouritz)

## Getting help
**Need help with your project?**
Contact one of the contributors using their contact details above.

We provide general support for this package, as well as paid coaching & development in Plasmic & Supabase.

## Changelog
You can find the changelog for this project [here](https://github.com/CallumBoase/plasmic-supabase/blob/main/CHANGELOG.md)

## Only works with NextJS pages router - Loader API
Important note: this repo currently only works with a Plasmic project that uses the NextJS pages router with the Loader API. 

Support for NextJS pages router with codegen will be added later.

## Basic Installation
This sections covers how to create a new Plasmic project and make the `plasmic-supabase` component available in the project.

After completing this section, you will be able to use the `plasmic-supabase` components in your Plasmic project to:
  * Perform user related actions in Supabase auth:
    * Sign up a user
    * Confirm a user's email address
    * Log a user in via email/password
    * Log a user in via magic link
    * Log a user out
    * Allow user to request a password reset link
    * Allow a logged in user to update their password
    * Allow a logged in user to update details: email, phone, password, user metadata
  * CRUD data from your supabase database & supabase storage (including tables/buckets that have RLS policies enabled that limit actions based on logged in user)

However, you will **NOT** yet be able to limit access to pages based on user authentication status. This is covered in the next section.

### 01 - Create a new Supabase project
1. Visit supabase.com
2. Create a new project
3. Once the new project is ready, click "Connect" and then "App frameworks"
4. Copy the NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY values for later use
5. Back in your main project dashboard, in the left sidebar, click "Authentication" then "Emails"
6. Update each of the following emails to the content shown below:
    <details>
        <summary>Confirm signup</summary>
        
    ```md    
      <h2>Confirm your signup</h2>

      <p>Follow this link to confirm your user:</p>
      <p><a href="{{ .SiteURL }}/api/auth/confirm?token_hash={{ .TokenHash }}&type=signup&next={{ .RedirectTo }}">Confirm your email</a></p>
    ```
    </details>
    <details>
        <summary>Magic Link</summary>
        
    ```md    
      <h2>Magic Link</h2>

      <p>Follow this link to login:</p>
      <!-- <p><a href="{{ .ConfirmationURL }}">Log In</a></p> -->
      <p><a href="{{ .SiteURL }}/api/auth/confirm?token_hash={{ .TokenHash }}&type=magiclink&next={{ .RedirectTo }}">Log In</a></p>
    ```
    </details>
    <details>
        <summary>Change Email Address</summary>
        
    ```md    
      <h2>Confirm Change of Email</h2>

      <p>Follow this link to confirm the update of your email from {{ .Email }} to {{ .NewEmail }}:</p> 
      <p><a href="{{ .SiteURL }}/api/auth/confirm?token_hash={{ .TokenHash }}&type=email_change&next={{ .RedirectTo }}">Change Email</a></p>
    ```
    </details>
    <details>
        <summary>Reset Password</summary>
        
    ```md    
      <h2>Reset Password</h2>

      <p>Follow this link to reset the password for your user:</p>
      <p><a href="{{ .SiteURL }}/api/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next={{ .RedirectTo }}">Reset Password</a></p>
    ```
    </details>

### 02 - Create new Plasmic Project 
In the Plasmic web interface:
1. Create a new Plasmic app
2. Rename your app
3. Click the "Publish" button at top-right
4. Add a "Push to Github" step, publishing to a new repo, nextjs, loader (recommended) method, typescript
5. Click "publish" and wait for the build to complete

### 03 - Download & modify your Plasmic project code:
On your local machine:
1. Clone the repo you just created to your local machine
2. In terminal, run `npm install` to install plasmic & it's dependencies
3. Add a .env.local file with your supabase credentials (from Supabase dashboard)
```
# Supabase Project
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```
4. `npm install plasmic-supabase` to install this package
5. Open `./plasmic-init.ts` and modify it to look like this:
```ts
import { initPlasmicLoader } from "@plasmicapp/loader-nextjs";
import { 
  SupabaseProvider, 
  SupabaseProviderMeta,
  SupabaseUserGlobalContext,
  SupabaseUserGlobalContextMeta,
  SupabaseUppyUploader,
  SupabaseUppyUploaderMeta,
  SupabaseStorageGetSignedUrl,
  SupabaseStorageGetSignedUrlMeta,
} from "plasmic-supabase"

export const PLASMIC = initPlasmicLoader({
  projects: [
    {
      id: "your-plasmic-project-id",
      token: "your-plasmic-project-token",
    },
  ],

  preview: true,
});

//Register global context
PLASMIC.registerGlobalContext(SupabaseUserGlobalContext, SupabaseUserGlobalContextMeta)

//Register components
PLASMIC.registerComponent(SupabaseProvider, SupabaseProviderMeta);
PLASMIC.registerComponent(SupabaseUppyUploader, SupabaseUppyUploaderMeta);
PLASMIC.registerComponent(SupabaseStorageGetSignedUrl, SupabaseStorageGetSignedUrlMeta);

```
7. In `./pages` directory add a new file called `_app.tsx` and add the following content. Save your file
```js
import type { AppProps } from 'next/app';

//Import the CSS required for SupabaseUppyUploader globally
import "@uppy/core/dist/style.min.css";
import "@uppy/dashboard/dist/style.min.css";

function MyApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}

export default MyApp;
```
8. In `./pages/api` directory and a new folder called `auth` and then a new file called `confirm.ts` with the following content. (Note that we modify [the official supabase method](https://supabase.com/docs/guides/auth/server-side/nextjs?queryGroups=router&router=pages) here by importing `createApiClient` from `plasmic-supabase`).
```ts
import { type EmailOtpType } from '@supabase/supabase-js'
import type { NextApiRequest, NextApiResponse } from 'next'

import { createApiClient as createClient } from 'plasmic-supabase'

function stringOrFirstString(item: string | string[] | undefined) {
  return Array.isArray(item) ? item[0] : item
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.status(405).appendHeader('Allow', 'GET').end()
    return
  }

  const queryParams = req.query
  const token_hash = stringOrFirstString(queryParams.token_hash)
  const type = stringOrFirstString(queryParams.type)

  let next = '/error'

  if (token_hash && type) {
    const supabase = createClient(req, res)
    const { error } = await supabase.auth.verifyOtp({
      type: type as EmailOtpType,
      token_hash,
    })
    if (error) {
      console.error(error)
    } else {
      next = stringOrFirstString(queryParams.next) || '/'
    }
  }
  res.redirect(next)
}
```
9. In terminal: `npm run dev` to start your Dev server


### 03 - Configure custom app host 
In Plasmic studio:
1. Configure you Custom App host to point to http://localhost:3000/plasmic-host
2. When the page reloads, the registered components should be available in Add component -> Custom Components. You'll also see global actions available for login/logout etc & a global context value of logged in SupabaseUser.

### 04 - Add basic authentication pages
In Plasmic studio:
1. Create a login page (with forgot password & magic link options)
    * Create page at path `/login`. 
    * Configure the login page as shown in [THIS VIDEO](https://drive.google.com/open?id=1HooSVuOVig_oixISwElIkfiHiFTIJ96u&usp=drive_fs)
2. Create a signup page as shown in [THIS VIDEO](https://drive.google.com/open?id=1s1IMur6h8SE7cSMZtYTu_1Quw84KfRbJ&usp=drive_fs)
3. Create a signup confirmation and signup complete page as shown in [THIS VIDEO](https://drive.google.com/open?id=1Xur8wBaUKtrgJY5EUGcgPowY19V7yhNX&usp=drive_fs)
4. Create an OTP request confirmation page as shown in [THIS VIDEO](https://drive.google.com/open?id=1Xc7uNUMMhbF3N6EvNJGXzZud2NW6QIXY&usp=drive_fs)
5. Create a change password page as shown in [THIS VIDEO](https://drive.google.com/open?id=1zLcD6p_slzwih-bsItS1vqPExjFlyYsO&usp=drive_fs)
6. Create a home page that shows logged in user details and a logout button as shown in [THIS VIDEO](https://drive.google.com/open?id=1N28893FYPs2WlK3NZyvRMDr18UflFsES&usp=drive_fs)
7. Verify that all the auth methods work as shown in [THIS VIDEO](https://drive.google.com/open?id=1y-d14FE0ictvlYsb2wWanaFx368YrG1P&usp=drive_fs)

#### Known issues / limitations with Authentication global actions:
* Known issues:
    * Can't specify an action (eg redirect) when running `resetPasswordForEmail` and `changePassword` global actions. This makes it hard to create a good user experience (see [issue 39](https://github.com/CallumBoase/plasmic-supabase/issues/39))
    * In the authentcation global actions, you must use absolute URLs (eg `http://localhost:3000/signup-complete`) when defining URLs for email redirect, however relative URLs work for defining success redirect.  (see [issue 40](https://github.com/CallumBoase/plasmic-supabase/issues/40))

### 05 - Test that you can access your Supabase database
In Plasmic studio:
1. Create a new page
2. Add a `SupabaseProvider` component to the page
3. Configure the `SupabaseProvider` component as per the on-screen instructions
4. Add a text element inside the `SupabaseProvider` component
5. Assign a dynamic value provided by the `SupabaseProvider` to this text element.
6. If everything worked, you'll see a real value from your database on the page!


You're now done with basic setup!

## Login-protecting pages in your app
The previous section allowed you to login and logout, however we don't yet have a way to prevent non-logged-in users from accessing certain pages of our app.

In this section, we'll fix this issue so that we can define both public and login-protected pages in our app.

1. In your cloned local version of your Plasmic project (see above):
    1. Stop your dev server if it's currently running (`cntrl + c` or `cmd + c` in terminal)
    2. Install the package `@supabase/ssr` by running in terminal
        ```bash
        npm install @supabase/ssr
        ```
    2. Add to the root directory a file called `middleware.ts` with the following content:
        <details>
          <summary><strong>Contents of middleware.ts</strong></summary>
          
          ```ts
          import { createServerClient } from "@supabase/ssr";
          import { NextResponse, type NextRequest } from "next/server";

          // Define the route that contains your login page
          const loginPage = "/login";

          // Add any public (non-login protected) routes here
          // All other routes will be login protected
          // Important: plasmic-host and your login page must always be public
          const publicRoutes = [
            "/", 
            "/login", 
            "/otp-request-confirmation",
            "/signup",
            "/signup-confirmation",
            "/plasmic-host"
          ];

          // Middleware function
          // This will run on every request to your app that matches the pattern at the bottom of this file
          // Adapted from @supabase/ssr docs https://supabase.com/docs/guides/auth/server-side/nextjs?queryGroups=router&router=app
          export async function middleware(request: NextRequest) {
            let supabaseResponse = NextResponse.next({
              request,
            });

            //Create a new supabase client
            //Refresh expired auth tokens and set new cookies
            const supabase = createServerClient(
              process.env.NEXT_PUBLIC_SUPABASE_URL!,
              process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
              {
                cookies: {
                  getAll() {
                    return request.cookies.getAll();
                  },
                  setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) =>
                      request.cookies.set(name, value)
                    );
                    supabaseResponse = NextResponse.next({
                      request,
                    });
                    cookiesToSet.forEach(({ name, value, options }) =>
                      supabaseResponse.cookies.set(name, value, options)
                    );
                  },
                },
              }
            );

            // IMPORTANT: Avoid writing any logic between createServerClient and
            // supabase.auth.getUser(). A simple mistake could make it very hard to debug
            // issues with users being randomly logged out.

            // Get details of the logged in user if present
            const {
              data: { user },
            } = await supabase.auth.getUser();

            // Decide whether to redirect to the /login page or not
            // You can adapt this logic to suit your needs

            if (publicRoutes.includes(request.nextUrl.pathname) !== true && !user) {
              // It's a login protected route but there's no logged in user.
              // Respond by redirecting the user to the login page
              const url = request.nextUrl.clone();
              url.pathname = loginPage;
              return NextResponse.redirect(url);
            } else {
              // It's a public route, or it's a login protected route and there is a logged in user.
              // Proceed as normal
              return supabaseResponse;
            }

            // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
            // creating a new response object with NextResponse.next() make sure to:
            // 1. Pass the request in it, like so:
            //    const myNewResponse = NextResponse.next({ request })
            // 2. Copy over the cookies, like so:
            //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
            // 3. Change the myNewResponse object to fit your needs, but avoid changing
            //    the cookies!
            // 4. Finally:
            //    return myNewResponse
            // If this is not done, you may be causing the browser and server to go out
            // of sync and terminate the user's session prematurely!
          }

          //Only run middleware on requests that match this pattern
          export const config = {
            matcher: [
              /*
              * Match all request paths except for the ones starting with:
              * - _next/static (static files)
              * - _next/image (image optimization files)
              * - favicon.ico (favicon file)
              * Feel free to modify this pattern to include more paths.
              */
              "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
            ],
          };

          ```
        </details>
    4. Middleware is best tested in a production build because it behaves differently in development. Therefore build and start a local production version of your app by running:
        ```bash
        npm run build
        npm run start
        ```
    
2. In Plasmic studio:
    1. Make sure you have a login page (see previous)
    2. Make sure you have a logout button (see previous)
    3. Make sure you have a home page
        * Look at your page list in Plasmic studio and make sure there's a page with URL `/`. This is your homepage and is automatically made publicly accesible
        * If you do not have a home page, create one now
    4. Add a private page to your app:
        * Create a new page in Plasmic studio
        * Set it's URL to anything except `/` or `/login`. This will automatically make it a private (login protected) page.
3. Make sure your `plasmic-init.ts` file has `preview: true` enabled (as shown in the basic setup instructions above) 
4. In a web browser, open your locally running app by going to `localhost:3000`. Check that Authorization and Authentication logic is working as expected:
    * When not logged in:
        * The home page `/` should load
        * The login page should load
        * The private page should redirect you to the login page
    * When logged in:
        * The home page `/` should load
        * The login page should load
        * The private page should load

### Troubleshooting middleware

#### Error 1: Cannot read properties of undefined (reading 'bind')
* Presentation: in the terminal instance that is running your app, you see an error like this:
    ```bash
    TypeError: Cannot read properties of undefined (reading 'bind')
        at NextNodeServer.handleRequestImpl (C:\VS Code repos\plasmic-supabase-middleware-pr-test\node_modules\next\dist\server\base-server.js:478:50)        
        at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
    ```
* Cause: you haven't installed `@supabase/ssr`

* Solution:
    1. Stop your app if it's running by pressing `cntrl + c` or `cmd + c` in the terminal
    2. Run this command in your terminal
        ```bash
        npm install @supabase/ssr
        ```
    3. Rebuild and restart your app by running
        ```bash
        npm run build
        npm run start
        ``` 


### Role-based access control & other advanced authorization logic
You are free to adapt `middleware.ts` to suit the authorization needs for your app.

Most users will need to add additional values in the array of `publicRoutes` at the top of `middleware.ts` to define more public pages.

You can also implement any other authorization logic you need, for example `role-based access control`, by customising your Supabase project and adding additional logic to `middleware.ts`.

Further guidance on implementing role-based access control and similar may be added in a future update of this package.

## Further Details & Notes

### Plasmic-supabase behaviour

#### Server-side rendering (Incremental Static Regeneration or ISR)
Plasmic-supabase fetches data using `useMutablePlasmicQueryData` hook (which works the same as `usePlasmicQueryData`) as shown in the [Plasmic docs on fetching data from code components](https://docs.plasmic.app/learn/data-code-components/#fetching-data-from-your-code-components).

This means that incremental static regeneration (ISR) or static-site generation (SSG) will work as expected on pages that use a `SupabaseProvider` component (as long as the Supabase query allows for public access).

In simplified terms, nextjs will fetch data from Supabase & cache it server-side. This cached data means that the server can send HTML filled with dynamic data when a user (or a search engine) requests a particular page of your app.

All of this is good for SEO on public-facing pages.

Server-side fetch and cache of data will only work for Supabase queries where RLS policies allow non-login-protected access because server-side fetch and cache operates via the catchall page's `getStaticProps` function, which does not have access to the logged in user's session.

You don't need to change any settings in `plasmic-supabase` when working with Login-protected data, because the `useMutablePlasmicQueryData` hook (when run server-side) will silently fail, leading to no data being cached server-side. However, data will still be fetched client-side as expected.

In advanced cases, you can disable server-side fetch and cache for a `SupabaseProvider` component by setting the `disableServerSideFetch` prop to `true`. 

For a deep-dive into ISR / SSG with plasmic-supabase, see [THIS VIDEO](https://drive.google.com/open?id=15DSD0aEjvwuS1JWzmKVmYqcSJUwcmDyf&usp=drive_fs)

### `createClient` Supabase methods
4x createClient methods are exported from `plasmic-supabase` to use in your project code if you require them.

These can be imported like so

```ts
import { createStaticPropsClient } from 'plasmic-supabase';
import { createComponentClient } from 'plasmic-supabase';
import { createApiClient } from 'plasmic-supabase';
import { createServerPropsClient } from 'plasmic-supabase';
```

These methods are created to match the [Supabase SSR Nextjs Pages router docs](https://supabase.com/docs/guides/auth/server-side/nextjs?queryGroups=router&router=pages) and can be used as if you defined them directly in your project utils.

Note that the `createComponentClient` is slightly different to the official Supabase recommended version in order to work with Plasmic studio properly. See the [createClient.ts](https://github.com/CallumBoase/plasmic-supabase/blob/main/src/utils/supabase/component.ts) file for details.
