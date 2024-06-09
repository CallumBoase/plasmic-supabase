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

## Installation

### 01 - in Plasmic web interface
1. Create a new Plasmic app
2. Rename your app
3. Click the "Publish" button at top-right
4. Add a "Push to Github" step, publishing to a new repo, nextjs, loader (recommended) method, typescript
5. Click "publish" and wait for the build to complete

### 02 - On your machine
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


### 03 - in Plasmic web interface
1. Configure you Custom App host to point to http://localhost:3000/plasmic-host
2. When the page reloads, the registered components should be available in Add component -> Custom Components

### 04 - Adding user logins
This section outlines how to add authentication to your app using Supabase auth. Note, that we do NOT use Plasmic auth at all in this setup.

#### Change catchall page setup in your Nextjs project
On your local machine, the plasmic-generated nextjs project contains a `[[...catchall]].tsx` page in the `pages` directory.
This catchall page dynamically loads & renders pages you define in Plasmic studio.

We will be modifying this default setup to add authorization logic to protect pages from unauthenticated users.

1. In your local project, delete `pages/[[...catchall]].tsx`
2. Create a new file `pages/index.tsx` with this content
```tsx
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
3. Create a new file `pages/login.tsx` with the same content as `index.tsx` but with `pageToLoad = '/login'` on line 1 instead
```tsx
const pageToLoad = '/login';

//Rest of the code from index.tsx continues here
```
4. Create a new file called `pages/[...catchall].tsx` with this content. (note that single square brackets instead of double square brackets)
    <details>
      <summary>
        <strong>pages/[...catchall].tsx content</strong>
      </summary>
          ```tsx
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

