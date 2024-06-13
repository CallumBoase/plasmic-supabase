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

## Only works with NextJS pages router - Loader API
Important note: this repo currently only works with a Plasmic project that uses the NextJS pages router with the Loader API. 

Support for NextJS pages router with codegen will be added later.

## Basic Installation
This sections covers how to create a new Plasmic project and make the `plasmic-supabase` component available in the project.

After completing this section, you will be able to use the `plasmic-supabase` components in your Plasmic project to:
  * Log a user in & out via Supabase auth
  * CRUD data from your supabase database & supabase storage (including tables/buckets that have RLS policies enabled that limit actions based on logged in user)

However, you will **NOT** yet be able to limit access to pages based on user authentication status. This is covered in the next section.

### 01 - Create new Plasmic Project 
In the Plasmic web interface:
1. Create a new Plasmic app
2. Rename your app
3. Click the "Publish" button at top-right
4. Add a "Push to Github" step, publishing to a new repo, nextjs, loader (recommended) method, typescript
5. Click "publish" and wait for the build to complete

### 02 - Download & modify your project code:
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
5. Open `./plasmic-init.ts`. It should look like this to start with (default Plasmic comments removed for brevity)
```ts
import { initPlasmicLoader } from "@plasmicapp/loader-nextjs";

export const PLASMIC = initPlasmicLoader({
  projects: [
    {
      id: "your-plasmic-project-id",
      token: "your-plasmic-project-token",
    },
  ],

  preview: false,
});

```
6. Modify `plasmic-init.ts` to import components from `plasmic-supabase`
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
8. In terminal: `npm run dev` to start your Dev server


### 03 - Configure custom app host 
In Plasmic studio:
1. Configure you Custom App host to point to http://localhost:3000/plasmic-host
2. When the page reloads, the registered components should be available in Add component -> Custom Components. You'll also see global actions available for login/logout etc & a global context value of logged in SupabaseUser.

### 04 - Add login and logout functionality
In Plasmic studio:
1. Create a login page
    * Create page at path `/login`. 
    * Add a form component to the page
    * Configure the form fields so it contains an email and password input
    * In Plasmic studio, top right next to the triangle button, click "view" and select "Turn off design mode"
    * Turn on `Interactive` mode in the studio
    * Fill in the form with a valid email & password of a Supabase user in your Supabase project but **don't submit it yet**
    * Attach an interaction to the form for `onSubmit`: 
        * Action 1: `SupabaseUserGlobalContext -> login`. Fill in the fields that appear (`Email` and `Password`) with the dynamic values from the form: `form.value.email` & `form.value.password`. Also fill in the `Success redirect` field with the home page `/`
    * Close the form configuration popups and submit the login form with a valid email & password. You should have logged in but won't yet be able to tell.
2. Check that login worked by showing logged in user email on the home page
    * Ensure you've already logged in while viewing your app in Plasmic studio (see previous step 2) 
    * Go to your project's home `/` page using the page dropdown in Plasmic studio.
    * Click the "refresh arena" button (because Plasmic studio caches page context between visits so login status sometimes will not be available until you refresh the arena)
    * Add a text element to the page
    * Assign dynamic content to the text element and pick `SupabaseUser.user.email` with fallback "You are not logged in"
    * If login succeeded in step 2, you should see the logged in user's email address on the page
3. Add a logout button to the home page
    * Add a button to the homepage of your app
    * Change the button text to "Logout"
    * Attach an interaction to the button: `onClick`: 
        * Action 1: `SupabaseUserGlobalContext -> logout`. Leave the `Success redirect` field blank
4. Check that you can log out
    * Make sure you are currently logged in (see step 1 & 2) and have added a logout button to the homepage (see step 3)
    * Turn on `Interactive` mode in the studio
    * Click the logout button
    * If logout succeeded, you should no longer see the logged in user's email address on the page. Instead you should see the fallback content from your text block "You are not logged in"

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

1. On your local machine (cloned repo from github, see previous section `02 - Download & modify your project code`):
    1. delete the file `pages/[[...catchall]].tsx`
    2. Create a new file `pages/index.tsx` with this content
        <details>
          <summary>
            <strong>
              Content of pages/index.tsx
            </strong>
          </summary>
        
          ```tsx
          // ./pages/index.tsx

          // Load & render the '/' (home) page from Plasmic studio
          // we do this outside of normal catchall routes so it can be publicly accessible without having '/public/' at front of route path

          const pageToLoad = '/';

          import * as React from "react";
          import {
            PlasmicComponent,
            extractPlasmicQueryData,
            ComponentRenderData,
            PlasmicRootProvider,
          } from "@plasmicapp/loader-nextjs";
          import type { GetStaticProps } from "next";

          import Error from "next/error";
          import { useRouter } from "next/router";
          import { PLASMIC } from "@/plasmic-init";

          export default function PlasmicLoaderPage(props: {
            plasmicData?: ComponentRenderData;
            queryCache?: Record<string, any>;
          }) {
            const { plasmicData, queryCache } = props;
            const router = useRouter();
            if (!plasmicData || plasmicData.entryCompMetas.length === 0) {
              return <Error statusCode={404} />;
            }
            const pageMeta = plasmicData.entryCompMetas[0];
            return (
              <PlasmicRootProvider
                loader={PLASMIC}
                prefetchedData={plasmicData}
                prefetchedQueryData={queryCache}
                pageParams={pageMeta.params}
                pageQuery={router.query}
              >
                <PlasmicComponent component={pageMeta.displayName} />
              </PlasmicRootProvider>
            );
          }

          export const getStaticProps: GetStaticProps = async () => {
            const plasmicPath = pageToLoad;
            const plasmicData = await PLASMIC.maybeFetchComponentData(plasmicPath);
            if (!plasmicData) {
              // non-Plasmic catch-all
              return { props: {} };
            }
            const pageMeta = plasmicData.entryCompMetas[0];
            // Cache the necessary data fetched for the page
            const queryCache = await extractPlasmicQueryData(
              <PlasmicRootProvider
                loader={PLASMIC}
                prefetchedData={plasmicData}
                pageParams={pageMeta.params}
              >
                <PlasmicComponent component={pageMeta.displayName} />
              </PlasmicRootProvider>
            );
            // Use revalidate if you want incremental static regeneration
            return { props: { plasmicData, queryCache }, revalidate: 60 };
          }
          ```
        </details>
    3. Create a new file `pages/login.tsx` with this content
        <details>
          <summary>
            <strong>
              Content of pages/login.tsx
            </strong>
          </summary>
        
          ```tsx
          // ./pages/login.tsx

          // Load & render the '/login' page from Plasmic studio
          // we do this outside of normal catchall routes so it can be publicly accessible without having '/public/' at front of route path

          const pageToLoad = '/login';

          import * as React from "react";
          import {
            PlasmicComponent,
            extractPlasmicQueryData,
            ComponentRenderData,
            PlasmicRootProvider,
          } from "@plasmicapp/loader-nextjs";
          import type { GetStaticProps } from "next";

          import Error from "next/error";
          import { useRouter } from "next/router";
          import { PLASMIC } from "@/plasmic-init";

          export default function PlasmicLoaderPage(props: {
            plasmicData?: ComponentRenderData;
            queryCache?: Record<string, any>;
          }) {
            const { plasmicData, queryCache } = props;
            const router = useRouter();
            if (!plasmicData || plasmicData.entryCompMetas.length === 0) {
              return <Error statusCode={404} />;
            }
            const pageMeta = plasmicData.entryCompMetas[0];
            return (
              <PlasmicRootProvider
                loader={PLASMIC}
                prefetchedData={plasmicData}
                prefetchedQueryData={queryCache}
                pageParams={pageMeta.params}
                pageQuery={router.query}
              >
                <PlasmicComponent component={pageMeta.displayName} />
              </PlasmicRootProvider>
            );
          }

          export const getStaticProps: GetStaticProps = async () => {
            const plasmicPath = pageToLoad;
            const plasmicData = await PLASMIC.maybeFetchComponentData(plasmicPath);
            if (!plasmicData) {
              // non-Plasmic catch-all
              return { props: {} };
            }
            const pageMeta = plasmicData.entryCompMetas[0];
            // Cache the necessary data fetched for the page
            const queryCache = await extractPlasmicQueryData(
              <PlasmicRootProvider
                loader={PLASMIC}
                prefetchedData={plasmicData}
                pageParams={pageMeta.params}
              >
                <PlasmicComponent component={pageMeta.displayName} />
              </PlasmicRootProvider>
            );
            // Use revalidate if you want incremental static regeneration
            return { props: { plasmicData, queryCache }, revalidate: 60 };
          }
          ```
        </details>
    4. Create a new file `pages/[...catchall].tsx` with this content. (note: single square brackets as opposed to double)
        <details>

          <summary>
            <strong>
              Content of pages/[...catchall].tsx
            </strong>
          </summary>

          ```tsx
          // ./pages/[...catchall].tsx

          /* 
            Catchall page that runs for every page EXCEPT /, /login, and /public/*
            These pages are login protected by default
            The logic for checking authorization & where to redirect if a user is not authorized is controlled
            by @/authorization-settings.ts.
            The authorization-settings.ts file should export:
            - authorizationCheckFunction: a function that returns true if the user is authorized to view the page
            - loginPagePath: where to redirect to if authorization fails  eg '/login'
            
            The routes that render through this page are rendered on-demand (getServerSideProps instead of getStaticProps) 
            because they are login protected. This ensures that the user's session is checked on every request
            and avoids login-protected pages being cached and related issues.

            This pages is a modified various of the standard Plasmic NextJS loader API catchall page.

            Pages created in Plasmic studio will render using this catchall if it's:
              Page Settings -> URL path does NOT start with '/public/' and is not "/" or "/login"
          */

          import type { GetServerSideProps } from "next";
          import { createClient } from 'plasmic-supabase/dist/utils/supabase/server-props'

          import * as React from "react";
          import {
            PlasmicComponent,
            extractPlasmicQueryData,
            ComponentRenderData,
            PlasmicRootProvider,
          } from "@plasmicapp/loader-nextjs";

          import Error from "next/error";
          import { useRouter } from "next/router";
          import { PLASMIC } from "@/plasmic-init";

          import { authorizationCheckFunction, loginPagePath } from "@/authorization-settings";

          export default function PlasmicLoaderPage(props: {
            plasmicData?: ComponentRenderData;
            queryCache?: Record<string, any>;
          }) {
            const { plasmicData, queryCache } = props;
            const router = useRouter();
            if (!plasmicData || plasmicData.entryCompMetas.length === 0) {
              return <Error statusCode={404} />;
            }
            const pageMeta = plasmicData.entryCompMetas[0];
            return (
              <PlasmicRootProvider
                loader={PLASMIC}
                prefetchedData={plasmicData}
                prefetchedQueryData={queryCache}
                pageParams={pageMeta.params}
                pageQuery={router.query}
              >
                <PlasmicComponent component={pageMeta.displayName} />
              </PlasmicRootProvider>
            );
          }

          //This runs on the server while rendering
          //Unlike the pages in the root directory, we run this every time the page is requested with no cache
          //This is appropriate because these pages are login protected and only work with a valid session
          //We also need to recheck each time the page is requested to ensure the user is still authenticated
          export const getServerSideProps: GetServerSideProps = async (context) => {

            //Get the catchall parameter from the page context
            const { catchall } = context.params ?? {};

            //Get the path of the current page
            let plasmicPath = typeof catchall === 'string' ? catchall : Array.isArray(catchall) ? `/${catchall.join('/')}` : '/';

            //Determine if the user is authorized to view this page
            const supabase = createClient(context);

            const { data: { user } } = await supabase.auth.getUser();

            const isAuthorized = authorizationCheckFunction(plasmicPath, user);

            if(isAuthorized !== true) return {
              redirect: {
                destination: loginPagePath,
                permanent: false,
              }
            }

            //Fetch data for the current page/component from plasmic
            const plasmicData = await PLASMIC.maybeFetchComponentData(plasmicPath);
            
            //If there's no plasmic data, the page does not exist in plasmic. So return nothing
            //This will ultimately cause a 404 error to be shown by default
            if (!plasmicData) {
              // non-Plasmic catch-all
              return { props: {} };
            }
            //Get the metadata for the current page
            const pageMeta = plasmicData.entryCompMetas[0];
            //Prefetch any data for the page
            const queryCache = await extractPlasmicQueryData(
              <PlasmicRootProvider
                loader={PLASMIC}
                prefetchedData={plasmicData}
                pageParams={pageMeta.params}
              >
                <PlasmicComponent component={pageMeta.displayName} />
              </PlasmicRootProvider>
            );
            //Return the plasmic data and the query cache data
            return { props: { plasmicData, queryCache } };
          }

          ```
        </details>
    5. Create a new directory `pages/public`
    6. Create a new file `pages/public/[[...catchall]].tsx` with this content. (note: double square brackets as opposed to single)
        <details>

          <summary>
            <strong>
              Content of pages/public/[[...catchall]].tsx
            </strong>
          </summary>

          ```tsx
          // ./pages/public/[[...catchall]].tsx

          /* 
            Catchall page that runs for all routes that start with /public (ie /public/*)
            These pages are publicly accessible (no logged in user required)
            
            The routes that render through this page are rendered with Incremental Static Regeneration (ISR) 
            using getStaticProps.
            
            This pages is a modified various of the standard Plasmic NextJS loader API catchall page.

            Pages created in Plasmic studio will render using this catchall if it's:
              Page Settings -> URL path starts with "/public/"
          */
          import * as React from "react";
          import {
            PlasmicComponent,
            extractPlasmicQueryData,
            ComponentRenderData,
            PlasmicRootProvider,
          } from "@plasmicapp/loader-nextjs";
          import type { GetStaticPaths, GetStaticProps } from "next";

          import Error from "next/error";
          import { useRouter } from "next/router";
          import { PLASMIC } from "@/plasmic-init";

          export default function PlasmicLoaderPage(props: {
            plasmicData?: ComponentRenderData;
            queryCache?: Record<string, any>;
          }) {
            const { plasmicData, queryCache } = props;
            const router = useRouter();
            if (!plasmicData || plasmicData.entryCompMetas.length === 0) {
              return <Error statusCode={404} />;
            }
            const pageMeta = plasmicData.entryCompMetas[0];
            return (
              <PlasmicRootProvider
                loader={PLASMIC}
                prefetchedData={plasmicData}
                prefetchedQueryData={queryCache}
                pageParams={pageMeta.params}
                pageQuery={router.query}
              >
                <PlasmicComponent component={pageMeta.displayName} />
              </PlasmicRootProvider>
            );
          }

          export const getStaticProps: GetStaticProps = async (context) => {
            
            const { catchall } = context.params ?? {};
            
            //Add "/public" at the start of the catchall parameter
            //Since we're in the public folder
            //This ensures the page is available at the same path as configured in Plasmic studio
            let plasmicPath = typeof catchall === 'string' ? catchall : Array.isArray(catchall) ? `/${catchall.join('/')}` : '/';
            plasmicPath = `/public${plasmicPath}`

            //Continue with normal Plasmic loading logic
            const plasmicData = await PLASMIC.maybeFetchComponentData(plasmicPath);
            if (!plasmicData) {
              // non-Plasmic catch-all
              return { props: {} };
            }
            const pageMeta = plasmicData.entryCompMetas[0];
            // Cache the necessary data fetched for the page
            const queryCache = await extractPlasmicQueryData(
              <PlasmicRootProvider
                loader={PLASMIC}
                prefetchedData={plasmicData}
                pageParams={pageMeta.params}
              >
                <PlasmicComponent component={pageMeta.displayName} />
              </PlasmicRootProvider>
            );
            // Use revalidate if you want incremental static regeneration
            return { props: { plasmicData, queryCache }, revalidate: 60 };
          }

          export const getStaticPaths: GetStaticPaths = async () => {
            
            //Get all pages from plasmic
            const pageModules = await PLASMIC.fetchPages();

            //Filter out only the pages who's url starts with "/public"
            const pageModulesWithPublicPath = pageModules.filter(mod => mod.path.startsWith("/public"));

            return {
              paths: pageModulesWithPublicPath.map((mod) => ({
                params: {
                  //Remove "/public/" from the path to get the catchall parameter
                  //Would usually be just removing "/" here but since we are in a folder called "public" we need to remove "/public/"
                  catchall: mod.path.split("/public/")[1].split("/"),
                },
              })),
              fallback: "blocking",
            };
          }


          ```
        </details>
    7. Create a new file in the root of your project called `authorization-settings.ts` with the content below. The `authorizationCheck` function is imported by the `./pages/[...catchall].tsx` file to determine if a user is authorized to view a page. The `loginPagePath` is the path to redirect to if a user is not authorized to view a page. Modify this file to suit your needs.
        <details>

          <summary>
            <strong>
              Content of authorization-settings.ts
            </strong>
          </summary>

          ```ts
          // ./authorization-settings.ts

          import type { AuthorizationCheckFunction, RoutePath } from "plasmic-supabase";

          //Run this function to check if the user is authorized to view any page
          //This will run server-side before render of all pages EXCEPT /, /login and /public/*
          //due to the setup of catchall pages in the pages directory

          export const authorizationCheckFunction : AuthorizationCheckFunction= (pagePath, user) => {
            if(!user || user.role !== 'authenticated') {
              return false;
            } else {
              return true;
            }
          }

          export const loginPagePath : RoutePath = '/login';
          ```
        </details>
2. In Plasmic studio:
    1. Make sure you have a login page (see previous)
    2. Make sure you have a logout button (see previous)
    3. Make sure you have a home page
        * Look at your page list in Plasmic studio and make sure there's a page with URL `/`. This is your homepage and is automatically made publicly accesible
        * If you do not have a home page, create one now
    4. Add a login protected page to your app:
        * Create a new page in Plasmic studio
        * Set it's URL to anything except `/` or `/login` and not starting with `/public/`. This will automatically make it a login protected page.
    5. Add a public page to your app in Plasmic studio
        * Create a new page in Plasmic studio
        * Set it's URL anything that starts with `/public/`. This will automatically make it a publicly accessible page.
3. Make sure your `plasmic-init.ts` file has `preview: true` enabled (as shown in the basic setup instructions above) 
4. On your local machine, open terminal and restart your local dev server by hitting `cntrl + c` or `cmd + c` and then
    ```bash
      npm run dev
    ```
5. In a web browser, open your locally running app by going to `localhost:3000`. Check that Authorization and Authentication logic is working as expected:
    * The home page `/` should load without any login required
    * The login page should load without any login required
    * The login protected page should redirect you to the login page if you are not logged in
    * The login protected page should load if you are logged in
    * The public page should load without any login required

## Dev notes
* To test locally:
    1. In this plasmic-supabase repo:
        1. run `npm run build`
        2. run `npm pack` to create a tarball of the package (eg `plasmic-supabase-0.0.1.tgz`) (important: `npm link` does NOT work due to react conflicts)
    2. In your local Plasmic nextjs project, 
        1. run `npm install /path/to/plasmic-supabase-0.0.1.tgz` to install the package
        2. run `npm run dev` to start the dev server
* To retest a new version of local package locally
    1. Follow step 1 above
    2. In your local plasmic nextjs project:
        1. Stop your dev server
        2. run `npm uninstall plasmic-supabase` 
        3. Clear nextjs cache by deleting `.next` folder
        4. (usually not needed): clear node cache `npm cache clean --force`
        5. run `npm install /path/to/plasmic-supabase-0.0.1.tgz`
        6. run `npm run dev` to start the dev server
* To publish this package to npm:
    1. Update the version in `package.json`
    2. Update changelog
    3. Push all changes to github
    4. Run npm publish
    5. In github user interface: create a new release & tag with same version number

