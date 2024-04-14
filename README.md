# plasmic-supabase

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

  preview: false,
});

//Register global context
PLASMIC.registerGlobalContext(SupabaseUserGlobalContext, SupabaseUserGlobalContextMeta)

//Register components
PLASMIC.registerComponent(SupabaseProvider, SupabaseProviderMeta);
PLASMIC.registerComponent(SupabaseUppyUploader, SupabaseUppyUploaderMeta);
PLASMIC.registerComponent(SupabaseStorageGetSignedUrl, SupabaseStorageGetSignedUrlMeta);


```
6. In terminal: `npm run dev` to start your Dev server


### 03 - in Plasmic web interface
1. Configure you Custom App host to localhost:3000/plasmic-host
2. When the page reloads, the registered components should be available in Add component -> Custom Components


## Dev notes
* To test locally:
    1. run `npm run build`
    2. run `npm pack` to create a tarball of the package (eg `plasmic-supabase-0.0.1.tgz`) (important: `npm link` does NOT work due to react conflicts)
    3. In your local Plasmic project, run `npm install /path/to/plasmic-supabase-0.0.1.tgz` to install the package
* To publish:
    1. Update the version in `package.json`

